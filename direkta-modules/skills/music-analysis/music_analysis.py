#!/usr/bin/env python3
"""music_analysis.py — Direkta music-analysis skill core script.

Produces the frame-accurate beat-map JSON contract defined in
`direkta-modules/research/music-analysis-skill.md` §6, consumed by the AMV and
Trailer agents (`direkta-modules/agents/amv-music-video-agent.md`,
`direkta-modules/agents/trailer-agent.md`) to generate cut-lists (§7).

Usage
-----
    python3 music_analysis.py <audio_path> [--fps 24] [--lyrics lyrics.txt]
                              [--track-id ID] [-o out.json]
                              [--cut-offset-frames -2] [--skip-optional]
                              [--device cpu] [--no-octave-fix]

Default output path: ./analysis/<basename>.json

Dependency ladder
-----------------
CORE (hard requirement):     librosa, soundfile, numpy
DECODE (soft):               ffmpeg on PATH  -> mono/44.1k/s16 WAV, one decode for
                             every detector (§6 "Decode normalization"). If ffmpeg is
                             absent or fails, we fall back to a direct librosa.load()
                             decode and set "decode_normalized": false plus a warning.
                             We do NOT hard-fail on a missing ffmpeg: the whole point of
                             this script is to always return a usable beat map, and the
                             decode-offset risk is a provenance fact the agent can gate
                             on, not a reason to produce nothing.
OPTIONAL (degrade + warn):   beat-this (downbeats), allin1 (labeled sections),
                             demucs (stems -> drum-class onsets, instrumentation,
                             vocal stem), whisperx (lyric hook onsets).

Every optional stage that is unavailable or fails records a string in the output's
"warnings" array and flips the matching "*_source" provenance field. Nothing outside
librosa/soundfile/numpy is imported at module scope.

Exit codes
----------
    0  success
    2  input could not be decoded by any available path
    3  a core dependency (numpy/librosa/soundfile) is missing
"""

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
from collections import Counter

# ---------------------------------------------------------------------------
# Core dependencies. These three are the only hard requirements.
# ---------------------------------------------------------------------------
try:
    import numpy as np
    import librosa
    import soundfile as sf
except ImportError as exc:  # pragma: no cover - environment guard
    sys.stderr.write(
        "FATAL: music_analysis.py requires numpy, librosa and soundfile.\n"
        f"       Missing: {exc.name}\n"
        "       Install with:  pip install -r requirements.txt\n"
    )
    raise SystemExit(3)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
FPS_DEFAULT = 24
TARGET_SR = 44100                # §6: decode-normalize to 44.1kHz, not 22050
CUT_OFFSET_FRAMES_DEFAULT = -2   # §6 "Frame-accuracy budget": a per-project default
MIREX_TOLERANCE_SEC = 0.070      # Dixon (2007) F-measure window used by MIREX/beat_this
ENERGY_HOP_SEC = 0.5             # RMS curve hop (matches the §6 script sketch)
FLUX_HOP_SEC = 0.1               # riser-detection hop (§4.1)
CONFIDENCE_GATE = 0.6            # §7 "Confidence-gating" threshold
PREFERRED_BPM = (70.0, 180.0)    # perceptual tempo window for octave resolution
ABSOLUTE_BPM = (55.0, 215.0)     # hard plausibility bounds

ACCENT_WEIGHTS = {               # §7 accent hierarchy, expressed numerically
    "downbeat": 1.0,
    "kick": 1.0,
    "riser_payoff": 1.0,
    "sound_design_hit": 1.0,
    "lyric_hook_onset": 0.85,
    "snare": 0.6,
    "hihat": 0.2,
    "drum_other": 0.2,
}

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "so", "to", "of", "in", "on",
    "at", "for", "with", "is", "it", "its", "i", "you", "we", "he", "she",
    "they", "me", "my", "your", "our", "this", "that", "be", "am", "are",
    "was", "were", "do", "does", "did", "not", "no", "yes", "oh", "yeah",
}


# ===========================================================================
# Small utilities
# ===========================================================================
class Warnings:
    """Ordered, de-duplicated collector for the JSON `warnings` array."""

    def __init__(self) -> None:
        self._items: list[str] = []

    def add(self, msg: str) -> None:
        if msg not in self._items:
            self._items.append(msg)
            sys.stderr.write(f"[warn] {msg}\n")

    def as_list(self) -> list[str]:
        return list(self._items)


def _r(x, n: int = 3) -> float:
    """Round to n places as a plain float (numpy scalars are not JSON-serialisable)."""
    return round(float(x), n)


def _describe(exc: BaseException) -> str:
    """Some audio backends raise with an empty message; always show the type."""
    text = str(exc).strip()
    return f"{type(exc).__name__}: {text}" if text else type(exc).__name__


def _minmax(arr: "np.ndarray") -> "np.ndarray":
    lo, hi = float(arr.min()), float(arr.max())
    return (arr - lo) / (hi - lo + 1e-9)


def _sample_at(env: "np.ndarray", times, sr: int, hop: int) -> "np.ndarray":
    """Sample a frame-rate envelope at arbitrary timestamps."""
    if env.size == 0 or len(times) == 0:
        return np.zeros(len(times), dtype=float)
    idx = np.clip((np.asarray(times, dtype=float) * sr / hop).astype(int), 0, env.size - 1)
    return env[idx]


def _sample_peak_at(env: "np.ndarray", times, sr: int, hop: int,
                    radius_sec: float = 0.03) -> "np.ndarray":
    """Sample an onset envelope at timestamps, taking the local MAX within +/-radius.

    Point-sampling a spiky onset envelope is fragile: a one-frame miss lands in the
    trough beside the peak and reports near-zero accent for a beat that is obviously
    accented. The radius stays inside the +/-70ms MIREX tolerance the detectors are
    themselves scored against, so this reads the accent that belongs to the beat
    without borrowing a neighbour's.
    """
    if env.size == 0 or len(times) == 0:
        return np.zeros(len(times), dtype=float)
    radius = max(int(radius_sec * sr / hop), 1)
    centres = np.clip((np.asarray(times, dtype=float) * sr / hop).astype(int), 0, env.size - 1)
    return np.array([
        float(env[max(0, c - radius):min(env.size, c + radius + 1)].max())
        for c in centres
    ])


def _pick_peaks(curve: "np.ndarray", min_distance: int, threshold: float) -> list[int]:
    """Local maxima above `threshold`, greedily thinned to `min_distance` frames."""
    candidates = [
        i for i in range(1, len(curve) - 1)
        if curve[i] >= curve[i - 1] and curve[i] > curve[i + 1] and curve[i] >= threshold
    ]
    candidates.sort(key=lambda i: -curve[i])
    kept: list[int] = []
    for i in candidates:
        if all(abs(i - j) >= min_distance for j in kept):
            kept.append(i)
    return sorted(kept)


def _librosa_tempo(onset_env: "np.ndarray", sr: int, hop: int) -> float:
    """librosa moved `tempo` between 0.9 / 0.10 / 0.11 — resolve it at runtime."""
    for path in (("feature", "rhythm", "tempo"), ("feature", "tempo"), ("beat", "tempo")):
        obj = librosa
        try:
            for attr in path:
                obj = getattr(obj, attr)
        except AttributeError:
            continue
        value = obj(onset_envelope=onset_env, sr=sr, hop_length=hop)
        return float(np.atleast_1d(value)[0])
    return 0.0


def _band_onset_envelope(y, sr: int, hop: int, fmin: float, fmax: float) -> "np.ndarray":
    """Spectral-flux onset strength restricted to a frequency band, in LINEAR power.

    librosa's default onset_strength runs the spectrogram through power_to_db first,
    which compresses exactly the dynamic range the tempo-octave test depends on: in the
    dB domain an 8th-note hi-hat reads as ~0.6 of a kick, so a double-time grid looks
    identical to a correct one. Passing a linear-power spectrogram keeps that contrast
    (the same hi-hat reads ~0.01 of the kick).
    """
    spec = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)) ** 2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    mask = (freqs >= fmin) & (freqs < fmax)
    if not mask.any():
        return np.zeros(spec.shape[1], dtype=float)
    return librosa.onset.onset_strength(S=spec[mask, :], sr=sr, hop_length=hop)


def _linear_onset_envelope(y, sr: int, hop: int) -> "np.ndarray":
    """Broadband onset strength in linear power — see _band_onset_envelope on why."""
    mel = librosa.feature.melspectrogram(y=y, sr=sr, hop_length=hop)
    return librosa.onset.onset_strength(S=mel, sr=sr, hop_length=hop)


# ===========================================================================
# 1. Decode normalization (§6)
# ===========================================================================
def normalize_audio(path: str, workdir: str, warn: Warnings) -> tuple[str, bool, str]:
    """Decode once to mono / 44.1kHz / 16-bit WAV so every detector sees the same
    sample grid (§6 'Decode normalization': MP3 priming/padding can otherwise put two
    decoders ~25-51ms — more than a frame — out of step).

    Returns (wav_path, decode_normalized, method).
    """
    if not os.path.isfile(path):
        raise SystemExit(f"FATAL: input file not found: {path}")

    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        warn.add(
            "ffmpeg not found on PATH — falling back to a direct librosa decode. "
            "decode_normalized=false: beat/onset timestamps may carry an MP3 "
            "priming/padding offset of up to ~51ms (>1 frame at 24/25/30fps). "
            "Install ffmpeg and re-run before trusting cut_offset_frames."
        )
        return path, False, "librosa.load"

    out_path = os.path.join(workdir, "normalized.wav")
    proc = subprocess.run(
        [ffmpeg, "-y", "-i", path, "-ac", "1", "-ar", str(TARGET_SR),
         "-sample_fmt", "s16", "-map_metadata", "-1", out_path],
        capture_output=True,
    )
    if proc.returncode != 0 or not os.path.isfile(out_path):
        tail = proc.stderr.decode("utf-8", "replace").strip().splitlines()[-4:]
        warn.add(
            "ffmpeg decode failed — falling back to a direct librosa decode "
            "(decode_normalized=false). ffmpeg said: " + " / ".join(tail)
        )
        return path, False, "librosa.load"
    return out_path, True, "ffmpeg"


def load_audio(wav_path: str, warn: Warnings) -> tuple["np.ndarray", int]:
    """Read the normalized WAV with soundfile; fall back to librosa for anything
    soundfile cannot open (e.g. the original upload when ffmpeg was unavailable)."""
    try:
        y, sr = sf.read(wav_path, dtype="float32", always_2d=False)
        if getattr(y, "ndim", 1) > 1:
            y = y.mean(axis=1)
        if sr != TARGET_SR:
            y = librosa.resample(np.asarray(y, dtype=float), orig_sr=sr, target_sr=TARGET_SR)
            sr = TARGET_SR
        return np.asarray(y, dtype=float), int(sr)
    except Exception as exc_sf:
        try:
            y, sr = librosa.load(wav_path, sr=TARGET_SR, mono=True)
            warn.add(f"soundfile could not read the input ({exc_sf}); used librosa.load.")
            return np.asarray(y, dtype=float), int(sr)
        except Exception as exc_lr:
            sys.stderr.write(
                "FATAL: could not decode the input audio by any available path.\n"
                f"       soundfile: {_describe(exc_sf)}\n"
                f"       librosa:   {_describe(exc_lr)}\n"
                "       Check the file is real audio and that ffmpeg is installed.\n"
            )
            raise SystemExit(2)


# ===========================================================================
# 2. Beats and downbeats
# ===========================================================================
def track_beats(wav_path: str, y, sr: int, device: str, use_optional: bool,
                warn: Warnings) -> tuple[list[float], list[float], dict]:
    """Primary: beat_this (beats + real downbeats + framewise posteriors, §4).
    Fallback: librosa.beat.beat_track for beats, estimated downbeats (§ below)."""
    prov = {
        "beat_source": "librosa.beat.beat_track",
        "downbeat_source": "estimated",
        "beat_confidence_source": "onset_strength_proxy",
        "beat_this_checkpoint": None,
    }
    if use_optional:
        try:
            from beat_this.inference import File2Beats, File2Frames  # noqa: heavy import

            beats_raw, downbeats_raw = File2Beats(checkpoint_path="final0", device=device)(wav_path)
            beats = [float(b) for b in beats_raw]
            downbeats = [float(d) for d in downbeats_raw]
            prov.update(
                beat_source="beat_this",
                downbeat_source="beat_this",
                beat_confidence_source="beat_this_posterior",
                beat_this_checkpoint="final0",
            )
            try:
                frames = File2Frames(checkpoint_path="final0", device=device)(wav_path)
                prov["_beat_logits"], prov["_frame_hz"] = _unpack_frames(frames)
            except Exception as exc:
                warn.add(f"beat_this File2Frames unavailable ({exc}); "
                         "beats[].confidence falls back to an onset-strength proxy.")
                prov["beat_confidence_source"] = "onset_strength_proxy"
            if beats:
                return beats, downbeats, prov
            warn.add("beat_this returned no beats; falling back to librosa beat tracking.")
        except ImportError:
            warn.add("beat-this not installed — beats from librosa.beat.beat_track and "
                     "downbeats ESTIMATED (every 4th beat). Install with "
                     "`pip install beat-this` for real downbeat detection.")
        except Exception as exc:
            warn.add(f"beat_this failed ({exc}); falling back to librosa beat tracking "
                     "with estimated downbeats.")

    hop = 512
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    _tempo, beat_times = librosa.beat.beat_track(
        onset_envelope=onset_env, sr=sr, hop_length=hop, units="time"
    )
    beats = [float(b) for b in np.atleast_1d(beat_times)]
    downbeats = estimate_downbeats(beats, onset_env, sr, hop)
    return beats, downbeats, prov


def _unpack_frames(frames) -> tuple["np.ndarray", float]:
    """File2Frames returns (beat_logits, downbeat_logits, frame_hz) in current
    beat_this builds; tolerate a 2-tuple by assuming the documented 50Hz frame rate."""
    if isinstance(frames, (tuple, list)) and len(frames) >= 3:
        return np.asarray(frames[0], dtype=float), float(frames[2])
    if isinstance(frames, (tuple, list)) and len(frames) == 2:
        return np.asarray(frames[0], dtype=float), 50.0
    return np.asarray(frames, dtype=float), 50.0


def estimate_downbeats(beats: list[float], onset_env, sr: int, hop: int) -> list[float]:
    """Downbeat fallback: every 4th beat, phase-anchored on the strongest onset among
    the first 16 beats. Intros are rhythmically weak (§7 step 8), so the anchor search
    is bounded to the opening rather than the whole track, and the strongest early
    accent is overwhelmingly a bar-one hit."""
    if len(beats) < 2:
        return list(beats)
    head = beats[: min(16, len(beats))]
    strengths = _sample_at(np.asarray(onset_env, dtype=float), head, sr, hop)
    anchor = int(np.argmax(strengths)) if strengths.size else 0
    return [beats[i] for i in range(anchor % 4, len(beats), 4)]


# ===========================================================================
# 3. Tempo-octave resolution (backbeat-period test)
# ===========================================================================
def resolve_tempo_octave(y, sr: int, beats: list[float], downbeats: list[float],
                         warn: Warnings, enabled: bool = True) -> dict:
    """Beat trackers routinely lock to half or double the perceived tempo. Resolve the
    octave with a backbeat-period test on a snare-band flux envelope, corroborated by
    the meter implied by the raw grid, then rewrite the grid so global_bpm, beats[],
    time_signature and the §7 step-3 minimum-spacing rule all agree.

    Half-time symptom  : the midpoints between detected beats carry as much accent as
                         the beats themselves (the real backbeat is falling between our
                         beats) -> double.
    Double-time symptom: every other detected beat is near-silent (ghost beats on the
                         8th-note grid) -> halve, keeping downbeat phase.

    Returns a dict with resolved beats/downbeats plus resolved_bpm / rejected_bpm and
    the full evidence block for provenance.
    """
    intervals = np.diff(np.asarray(beats, dtype=float)) if len(beats) > 1 else np.array([])
    bpm_raw = float(60.0 / np.median(intervals)) if intervals.size else 0.0
    result = {
        "beats": list(beats),
        "downbeats": list(downbeats),
        "resolved_bpm": round(bpm_raw, 2),
        "rejected_bpm": None,
        "evidence": {"test": "backbeat_period", "action": "kept", "reason": "not_run"},
    }
    if not enabled:
        result["evidence"]["reason"] = "disabled_by_flag"
        return result
    if len(beats) < 8 or bpm_raw <= 0:
        result["evidence"]["reason"] = "too_few_beats"
        return result

    hop = 512
    snare_env = _band_onset_envelope(y, sr, hop, 150.0, 4000.0)
    broad_env = _linear_onset_envelope(y, sr, hop)

    beat_arr = np.asarray(beats, dtype=float)
    midpoints = (beat_arr[:-1] + beat_arr[1:]) / 2.0
    on_beat = _sample_peak_at(snare_env, beat_arr, sr, hop)
    off_beat = _sample_peak_at(snare_env, midpoints, sr, hop)
    off_on_ratio = float(off_beat.mean() / (on_beat.mean() + 1e-9))

    broad = _sample_peak_at(broad_env, beat_arr, sr, hop)
    even_mean, odd_mean = float(broad[0::2].mean()), float(broad[1::2].mean())
    alternate_ratio = float(min(even_mean, odd_mean) / (max(even_mean, odd_mean) + 1e-9))

    beats_per_bar_raw = _median_beats_per_bar(beats, downbeats)

    # Meter corroboration: 2 beats per "bar" means we are counting half-notes;
    # 8 means we are counting 8th notes.
    meter_double = beats_per_bar_raw == 2
    meter_halve = beats_per_bar_raw == 8

    # Build both candidate actions, strongest evidence first, and fall through if the
    # leading candidate turns out to be implausible (e.g. doubling 240 BPM to 480).
    # Thresholds are calibrated on linear-power flux, where the three cases separate
    # with wide margins (measured on a 4/4 reference: off_on 2.37 half-time vs 0.02
    # correct vs 0.05 double-time; alternate 0.01 double-time vs 0.31 correct vs 0.76
    # half-time). They are an engineering choice, not a published standard.
    candidates: list[tuple[float, str]] = []
    if off_on_ratio > 0.80 or (meter_double and off_on_ratio > 0.60):
        candidates.append((off_on_ratio + (1.0 if meter_double else 0.0), "doubled"))
    if alternate_ratio < 0.10 or (meter_halve and alternate_ratio < 0.20):
        candidates.append(((1.0 - alternate_ratio) + (1.0 if meter_halve else 0.0), "halved"))
    candidates.sort(reverse=True)

    evidence = {
        "test": "backbeat_period",
        "action": "kept",
        "off_on_ratio": _r(off_on_ratio),
        "alternate_ratio": _r(alternate_ratio),
        "beats_per_bar_raw": beats_per_bar_raw,
        "preferred_window_bpm": list(PREFERRED_BPM),
        "reason": "no_octave_error_detected",
    }

    for _score, action in candidates:
        candidate_bpm = bpm_raw * 2.0 if action == "doubled" else bpm_raw / 2.0
        plausible = ABSOLUTE_BPM[0] <= candidate_bpm <= ABSOLUTE_BPM[1]
        improves = _in_window(candidate_bpm) or (
            not _in_window(bpm_raw)
            and _window_distance(candidate_bpm) < _window_distance(bpm_raw)
        )
        if not (plausible and improves):
            evidence["reason"] = "implausible_candidate"
            evidence["rejected_candidate_bpm"] = round(candidate_bpm, 2)
            continue

        if action == "doubled":
            new_beats = sorted(beat_arr.tolist() + midpoints.tolist())
        else:
            new_beats = _halve_grid(beats, downbeats)
        new_downbeats = [
            d for d in downbeats if any(abs(d - b) < 1e-6 for b in new_beats)
        ] or downbeats
        new_intervals = np.diff(np.asarray(new_beats, dtype=float))
        bpm_new = float(60.0 / np.median(new_intervals)) if new_intervals.size else candidate_bpm

        warn.add(
            f"tempo-octave corrected: {bpm_raw:.2f} BPM {action} to {bpm_new:.2f} BPM "
            f"(backbeat-period test: off/on={off_on_ratio:.2f}, "
            f"alt={alternate_ratio:.2f}, beats_per_bar_raw={beats_per_bar_raw}). "
            "Original value retained as rejected_bpm; the beat grid was rewritten to "
            "match so global_bpm, beats[] and time_signature stay consistent."
        )
        result.update(
            beats=[float(b) for b in new_beats],
            downbeats=[float(d) for d in new_downbeats],
            resolved_bpm=round(bpm_new, 2),
            rejected_bpm=round(bpm_raw, 2),
        )
        evidence["action"] = action
        evidence["reason"] = "signal+meter"
        evidence.pop("rejected_candidate_bpm", None)
        break

    result["evidence"] = evidence
    return result


def _in_window(bpm: float) -> bool:
    return PREFERRED_BPM[0] <= bpm <= PREFERRED_BPM[1]


def _window_distance(bpm: float) -> float:
    if _in_window(bpm):
        return 0.0
    return min(abs(bpm - PREFERRED_BPM[0]), abs(bpm - PREFERRED_BPM[1]))


def _halve_grid(beats: list[float], downbeats: list[float]) -> list[float]:
    """Keep every other beat, phase-locked so every downbeat survives."""
    downbeat_set = {round(d, 3) for d in downbeats}
    kept, since_downbeat = [], 0
    for b in beats:
        if round(b, 3) in downbeat_set:
            since_downbeat = 0
        if since_downbeat % 2 == 0:
            kept.append(float(b))
        since_downbeat += 1
    return kept if len(kept) >= 2 else list(beats)


def _median_beats_per_bar(beats: list[float], downbeats: list[float]) -> int:
    if len(downbeats) < 2:
        return 4
    counts = []
    for start, end in zip(downbeats[:-1], downbeats[1:]):
        counts.append(sum(1 for b in beats if start <= b < end))
    counts = [c for c in counts if c > 0]
    return int(np.median(counts)) if counts else 4


# ===========================================================================
# 4. Derived tempo fields (§6 field notes)
# ===========================================================================
def compute_tempo_stability(intervals: "np.ndarray") -> tuple[str, float]:
    """IQR of inter-beat intervals normalized by the median interval. The cut points
    are Direkta's engineering choice built on the published finding that rubato tracks
    show 2.5-5.3x the IBI variability of metronomic ones — not a cited standard."""
    if intervals.size < 4:
        return "stable", 0.0
    q75, q25 = np.percentile(intervals, [75, 25])
    iqr_ratio = float((q75 - q25) / (np.median(intervals) + 1e-9))
    if iqr_ratio < 0.03:
        label = "stable"
    elif iqr_ratio < 0.10:
        label = "drifting"
    else:
        label = "rubato"
    return label, iqr_ratio


def compute_bpm_confidence(bpm_from_beats: float, y, sr: int) -> tuple[float, float]:
    """Cross-method agreement: the beat-grid's median-interval tempo vs librosa's
    independent autocorrelation/tempogram estimate. Two differently-built detectors
    agreeing is a stronger signal than either one's internal score."""
    hop = 512
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    bpm_librosa = _librosa_tempo(onset_env, sr, hop)
    if bpm_from_beats <= 0 or bpm_librosa <= 0:
        return 0.0, round(bpm_librosa, 2)
    # Compare in the same octave before scoring — an octave disagreement is what
    # resolve_tempo_octave() already adjudicated; scoring it twice would double-punish.
    ratio = bpm_librosa / bpm_from_beats
    for factor in (0.5, 1.0, 2.0):
        if 0.75 < ratio / factor < 1.33:
            bpm_librosa_cmp = bpm_librosa / factor
            break
    else:
        bpm_librosa_cmp = bpm_librosa
    agreement = 1.0 - abs(bpm_from_beats - bpm_librosa_cmp) / max(bpm_from_beats, 1e-6)
    return round(max(0.0, min(1.0, agreement)), 3), round(bpm_librosa, 2)


def infer_time_signature(beats: list[float], downbeats: list[float]) -> list[int]:
    """beats_per_bar = median beats between consecutive downbeats. The beat unit is
    ASSUMED to be the quarter note — no evaluated tool detects the beat unit itself."""
    return [_median_beats_per_bar(beats, downbeats), 4]


def build_beats_array(beats: list[float], downbeats: list[float], beats_per_bar: int,
                      beat_logits, frame_hz: float, onset_env, sr: int,
                      hop: int) -> list[dict]:
    """index is sequential; position_in_bar resets to 1 on every downbeat and cycles
    from there; confidence is beat_this's framewise sigmoid posterior when available,
    otherwise a min-max-normalized onset-strength proxy."""
    downbeat_set = {round(d, 3) for d in downbeats}
    if beat_logits is not None and len(beat_logits):
        logits = np.asarray(beat_logits, dtype=float)
        confidences = []
        for t in beats:
            idx = min(int(t * frame_hz), logits.size - 1)
            confidences.append(float(1.0 / (1.0 + math.exp(-logits[idx]))))
    else:
        proxy = _minmax(np.asarray(onset_env, dtype=float))
        confidences = [float(c) for c in _sample_at(proxy, beats, sr, hop)]

    # Beats before the first downbeat belong to a partial pickup bar: count backwards
    # from the first downbeat so they are not all mislabelled as position 1.
    per_bar = max(beats_per_bar, 1)
    first_downbeat_index = next(
        (i for i, t in enumerate(beats) if round(t, 3) in downbeat_set), 0
    )
    bar_pos = ((per_bar - first_downbeat_index - 1) % per_bar) + 1

    out = []
    for i, t in enumerate(beats):
        is_downbeat = round(t, 3) in downbeat_set
        bar_pos = 1 if is_downbeat else (bar_pos % per_bar) + 1
        out.append({
            "t": _r(t),
            "index": i + 1,
            "position_in_bar": bar_pos,
            "is_downbeat": is_downbeat,
            "confidence": _r(confidences[i]),
        })
    return out


# ===========================================================================
# 5. Energy curve and troughs
# ===========================================================================
def compute_energy_curve(y, sr: int) -> tuple["np.ndarray", "np.ndarray", "np.ndarray"]:
    """Returns (rms_raw, rms_norm, times) on a 0.5s hop."""
    hop = max(int(sr * ENERGY_HOP_SEC), 1)
    rms_raw = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]
    rms_norm = _minmax(rms_raw)
    times = librosa.frames_to_time(np.arange(len(rms_raw)), sr=sr, hop_length=hop)
    return rms_raw, rms_norm, times


def detect_troughs(rms_norm: "np.ndarray", times: "np.ndarray",
                   min_prominence: float = 0.08,
                   min_spacing_sec: float = 4.0) -> list[dict]:
    """Local minima of the energy curve — the breakdown/breath moments §7 step 6 wants
    for deliberate holds. Prominence is the smaller of the two surrounding rises, so a
    dip inside an already-quiet passage does not outrank a real drop-out.

    Not specified in the research doc; added because step 6 ("insert deliberate holds
    where energy drops sharply") has no producer otherwise — section boundaries are too
    coarse to place a hold on.
    """
    if rms_norm.size < 5:
        return []
    smooth = np.convolve(rms_norm, np.ones(3) / 3.0, mode="same")
    hop_sec = float(times[1] - times[0]) if times.size > 1 else ENERGY_HOP_SEC
    min_distance = max(int(min_spacing_sec / max(hop_sec, 1e-6)), 1)
    minima = _pick_peaks(-smooth, min_distance=min_distance, threshold=-np.inf)

    troughs = []
    for i in minima:
        left = smooth[max(0, i - min_distance):i]
        right = smooth[i + 1:i + 1 + min_distance]
        if left.size == 0 or right.size == 0:
            continue
        prominence = float(min(left.max(), right.max()) - smooth[i])
        if prominence < min_prominence:
            continue
        troughs.append({
            "t": _r(times[i]),
            "energy": _r(smooth[i]),
            "prominence": _r(prominence),
        })
    return sorted(troughs, key=lambda d: d["t"])


def energy_to_shot_sec(energy: float) -> list[float]:
    """Linear interpolation between the anchors the AMV/Trailer agents publish:
    energy 0.3 -> 4-6s shots, energy 0.9 -> 0.5-1.5s shots; clamped outside [0.3, 0.9]."""
    e0, lo0, hi0 = 0.3, 4.0, 6.0
    e1, lo1, hi1 = 0.9, 0.5, 1.5
    e = min(max(energy, e0), e1)
    t = (e - e0) / (e1 - e0)
    return [round(lo0 + t * (lo1 - lo0), 2), round(hi0 + t * (hi1 - hi0), 2)]


# ===========================================================================
# 6. Sections — allin1 primary, Foote-novelty fallback (§4.2)
# ===========================================================================
def get_sections(wav_path: str, rms_norm, rms_raw, times, downbeats: list[float],
                 duration: float, stems: dict | None, use_optional: bool,
                 warn: Warnings) -> tuple[list[dict], str, str]:
    """Returns (sections, section_labels_mode, section_source)."""

    def pack(label: str, start: float, end: float) -> dict:
        window = (times >= start) & (times < end)
        energy = float(rms_norm[window].mean()) if window.any() else 0.0
        rms_mean = float(rms_raw[window].mean()) if window.any() else 0.0
        bars = sum(1 for d in downbeats if start <= d < end)
        return {
            "label": label,
            "start": _r(start),
            "end": _r(end),
            "bars": bars,
            "energy": _r(energy),
            "rms_mean": _r(rms_mean, 4),
            "instrumentation": section_instrumentation(stems, start, end),
            "target_avg_shot_sec": energy_to_shot_sec(energy),
        }

    if use_optional:
        try:
            import allin1  # noqa: heavy import (torch + NATTEN + madmom)

            struct = allin1.analyze(wav_path)
            segments = getattr(struct, "segments", None) or getattr(struct, "segment", [])
            sections = [pack(str(s.label), float(s.start), float(s.end)) for s in segments]
            if sections:
                return sections, "auto", "allin1"
            warn.add("allin1 returned no segments; using Foote-novelty segmentation.")
        except ImportError:
            warn.add("allin1 not installed — sections come from Foote-novelty "
                     "segmentation and are UNLABELED. Narrative rules keyed on a "
                     "specific label (e.g. 'wow-shot on Chorus 1') do not apply. "
                     "Install with `pip install allin1` for labeled sections.")
        except Exception as exc:
            warn.add(f"allin1 failed ({exc}); using Foote-novelty segmentation (unlabeled).")

    boundaries = foote_novelty_boundaries(rms_norm, times, duration, downbeats)
    sections = [pack(f"segment_{i + 1}", s, e) for i, (s, e) in enumerate(boundaries)]
    return sections, "unlabeled", "foote_novelty"


def foote_novelty_boundaries(rms_norm, times, duration: float, downbeats: list[float],
                             min_section_sec: float = 8.0) -> list[tuple[float, float]]:
    """Foote (2000): self-similarity matrix -> checkerboard-kernel novelty -> peaks.

    The doc specifies "over the RMS curve". A raw 1-D curve makes a degenerate SSM, so
    the curve is delay-embedded (librosa.feature.stack_memory) into a short context
    window first — standard practice, and still strictly a function of the RMS curve
    already in memory. Boundaries are then snapped to the nearest downbeat within one
    bar so a fallback section still starts musically.
    """
    n = rms_norm.size
    if n < 12:
        return [(0.0, duration)]

    feat = librosa.feature.stack_memory(rms_norm[np.newaxis, :], n_steps=8, delay=2)
    feat = feat / (np.linalg.norm(feat, axis=0, keepdims=True) + 1e-9)
    ssm = feat.T @ feat                                    # cosine self-similarity

    kernel_half = max(int(4.0 / max(float(times[1] - times[0]), 1e-6)), 2)
    kernel = _checkerboard_kernel(kernel_half)
    novelty = np.zeros(n, dtype=float)
    for i in range(kernel_half, n - kernel_half):
        block = ssm[i - kernel_half:i + kernel_half + 1, i - kernel_half:i + kernel_half + 1]
        if block.shape == kernel.shape:
            novelty[i] = float((block * kernel).sum())
    novelty = _minmax(np.maximum(novelty, 0.0))

    hop_sec = float(times[1] - times[0])
    peaks = _pick_peaks(
        novelty,
        min_distance=max(int(min_section_sec / max(hop_sec, 1e-6)), 1),
        threshold=float(novelty.mean() + novelty.std()),
    )
    # Snap interior boundaries to a downbeat, but never the track's own start/end —
    # sections[] must cover [0, duration] exactly.
    interior = [_snap_to_downbeat(float(times[i]), downbeats, tolerance=2.0) for i in peaks]
    cuts = sorted(set(round(c, 3) for c in interior if 0.0 < c < duration))
    cuts = [0.0] + cuts + [round(float(duration), 3)]

    bounds = [(a, b) for a, b in zip(cuts[:-1], cuts[1:]) if b - a >= 1.0]
    return bounds or [(0.0, duration)]


def _checkerboard_kernel(half: int) -> "np.ndarray":
    axis = np.arange(-half, half + 1)
    gauss = np.exp(-0.5 * (axis[:, None] ** 2 + axis[None, :] ** 2) / ((0.5 * half) ** 2 + 1e-9))
    sign = np.sign(axis)[:, None] * np.sign(axis)[None, :]
    return gauss * sign


def _snap_to_downbeat(t: float, downbeats: list[float], tolerance: float) -> float:
    if not downbeats:
        return t
    nearest = min(downbeats, key=lambda d: abs(d - t))
    return float(nearest) if abs(nearest - t) <= tolerance else float(t)


def section_instrumentation(stems: dict | None, start: float, end: float,
                            presence: float = 0.20) -> list[str]:
    """demucs stem names whose RMS inside the section clears `presence` of the section's
    total stem RMS. No evaluated tool produces finer tags ("synth_pad" etc.)."""
    if not stems:
        return []
    sr = stems.get("_sr", TARGET_SR)
    energies = {}
    for name, audio in stems.items():
        if name.startswith("_"):
            continue
        seg = audio[int(start * sr):int(end * sr)]
        energies[name] = float(np.sqrt(np.mean(seg ** 2))) if seg.size else 0.0
    total = sum(energies.values())
    if total <= 0:
        return []
    return sorted(n for n, e in energies.items() if e / total >= presence)


# ===========================================================================
# 7. Onsets — drum classes, risers, non-metrical hits (§4.1)
# ===========================================================================
def separate_stems(wav_path: str, device: str, use_optional: bool,
                   warn: Warnings) -> dict | None:
    """demucs 4.x programmatic API. Returns {stem_name: mono float array, '_sr': sr}."""
    if not use_optional:
        return None
    try:
        from demucs.api import Separator  # noqa: heavy import (torch)

        separator = Separator(model="htdemucs", device=device)
        _origin, sources = separator.separate_audio_file(wav_path)
        stems = {"_sr": int(getattr(separator, "samplerate", TARGET_SR))}
        for name, tensor in sources.items():
            arr = tensor.detach().cpu().numpy()
            stems[name] = arr.mean(axis=0) if arr.ndim > 1 else arr
        return stems
    except ImportError:
        warn.add("demucs not installed — onsets are detected on the FULL MIX instead of "
                 "an isolated drum stem, so kick/snare/hihat labels are less reliable "
                 "and sections[].instrumentation is empty. "
                 "Install with `pip install -U demucs`.")
    except Exception as exc:
        warn.add(f"demucs failed ({exc}); falling back to full-mix onset detection.")
    return None


def _decay_ratio(y, sr: int, t: float) -> float:
    """Late-to-early RMS ratio. §4.1 defines a hi-hat as high-band energy AND a SHORT
    decay; without the decay half of that rule any noise burst skewed above 3kHz (a
    bright snare, a crash) is labelled a hi-hat and silently loses its 0.6 weight."""
    start = int(t * sr)
    early = y[start:start + int(0.040 * sr)]
    late = y[start + int(0.060 * sr):start + int(0.160 * sr)]
    if early.size < 32 or late.size < 32:
        return 0.0
    early_rms = float(np.sqrt(np.mean(early ** 2)))
    late_rms = float(np.sqrt(np.mean(late ** 2)))
    return late_rms / (early_rms + 1e-12)


def classify_band_energy(y, sr: int, t: float, window_sec: float = 0.045) -> str:
    """Band-energy heuristic (§4.1 step 3). Not a trained classifier — it will
    misclassify 808 kicks with a click, trap hats, and bleed-heavy live kits."""
    start = int(t * sr)
    seg = y[start:start + int(window_sec * sr)]
    if seg.size < 64:
        return "drum_other"
    spec = np.abs(np.fft.rfft(seg * np.hanning(seg.size)))
    freqs = np.fft.rfftfreq(seg.size, 1.0 / sr)
    spec[freqs < 40] = 0.0                       # drop DC/rumble before normalising
    total = float((spec ** 2).sum()) + 1e-12

    def band(lo, hi):
        return float((spec[(freqs >= lo) & (freqs < hi)] ** 2).sum()) / total

    low = band(40, 150)
    body = band(150, 400)
    noise = band(2000, 4000)
    high = band(3000, sr / 2)

    # Snare is tested first: it is the only class defined by TWO simultaneous bands
    # (body + broadband noise), so testing kick first would swallow every snare that
    # happens to share a window with a bass note.
    if body > 0.10 and noise > 0.06:
        return "snare"
    if low > 0.45:
        return "kick"
    if high > 0.50:
        # High-band burst: a hi-hat chokes fast, a bright snare or cymbal rings on.
        return "hihat" if _decay_ratio(y, sr, t) < 0.15 else "snare"
    return "drum_other"


def detect_drum_onsets(source, sr: int) -> list[dict]:
    times = librosa.onset.onset_detect(y=source, sr=sr, units="time", backtrack=True)
    onsets = []
    for t in np.atleast_1d(times):
        kind = classify_band_energy(source, sr, float(t))
        onsets.append({"t": _r(t), "type": kind, "weight": ACCENT_WEIGHTS[kind]})
    return onsets


def detect_riser_payoffs(y, sr: int) -> list[dict]:
    """A >=1.0s near-monotonic rise in both spectral flux and RMS, followed by a peak
    and a drop. The emitted timestamp is the PEAK — the payoff the cut syncs to."""
    hop = max(int(sr * FLUX_HOP_SEC), 1)
    flux = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]
    n = min(flux.size, rms.size)
    if n < 20:
        return []
    curve = 0.5 * (_minmax(flux[:n]) + _minmax(rms[:n]))
    times = librosa.frames_to_time(np.arange(n), sr=sr, hop_length=hop)

    ramp_min = int(1.0 / FLUX_HOP_SEC)          # >= 1.0s of build (§4.1)
    ramp_max = int(6.0 / FLUX_HOP_SEC)
    payoffs = []
    peaks = _pick_peaks(curve, min_distance=int(4.0 / FLUX_HOP_SEC),
                        threshold=float(curve.mean() + 0.5 * curve.std()))
    for p in peaks:
        if p < ramp_min or p + 3 >= n:
            continue
        # Ramp start = the lowest point in the legal look-back window, so `rise` is the
        # real depth of the build rather than whatever happened exactly 4s ago.
        lo = max(0, p - ramp_max)
        window = curve[lo:p - ramp_min + 1]
        if window.size == 0:
            continue
        start = lo + int(np.argmin(window))
        deltas = np.diff(curve[start:p + 1])
        near_monotonic = float((deltas > -0.02).mean()) >= 0.80
        rise = float(curve[p] - curve[start])
        drop = float(curve[p] - curve[p + 3])
        if near_monotonic and rise >= 0.35 and drop >= 0.10:
            payoffs.append({
                "t": _r(times[p]),
                "type": "riser_payoff",
                "weight": ACCENT_WEIGHTS["riser_payoff"],
                "non_metrical": True,
            })
    return payoffs


def detect_non_metrical_hits(source, sr: int, beats: list[float], bpm: float) -> list[dict]:
    """Off-grid sound-design hits (§4.1).

    Deviation from §4.1 as written: the doc builds the grid from "beats, half-beats,
    quarter-beats" and then flags an onset that is more than `1/8 * 60/bpm` from any
    grid point. On a quarter-beat grid the maximum possible distance to the nearest
    point IS `1/8 * 60/bpm`, so that rule can never fire. We keep the doc's threshold
    (it is the musically meaningful one) and use the beat + half-beat grid, where the
    threshold flags the outer half of each half-beat interval.
    """
    if bpm <= 0 or len(beats) < 2:
        return []
    beat_sec = 60.0 / bpm
    grid = sorted(set(list(beats) + [(a + b) / 2.0 for a, b in zip(beats[:-1], beats[1:])]))
    grid_arr = np.asarray(grid, dtype=float)
    threshold = beat_sec / 8.0

    hop = 512
    flux = librosa.onset.onset_strength(y=source, sr=sr, hop_length=hop)
    median_flux = float(np.median(flux)) if flux.size else 0.0
    times = librosa.onset.onset_detect(y=source, sr=sr, units="time", backtrack=True)

    hits = []
    for t in np.atleast_1d(times):
        t = float(t)
        if float(np.min(np.abs(grid_arr - t))) <= threshold:
            continue
        strength = float(_sample_at(flux, [t], sr, hop)[0])
        if median_flux > 0 and strength < 2.0 * median_flux:
            continue
        hits.append({
            "t": _r(t),
            "type": "sound_design_hit",
            "weight": ACCENT_WEIGHTS["sound_design_hit"],
            "non_metrical": True,
        })
    return hits


def build_onsets(y, sr: int, beats: list[float], downbeats: list[float], bpm: float,
                 stems: dict | None, warn: Warnings) -> tuple[list[dict], str, str]:
    """Returns (onsets, onset_detection_mode, onset_source).

    `onset_detection_mode` stays the two-value contract enum ("full" | "downbeat_only")
    so agents branching on it keep working; the extra `onset_source` field says whether
    the full-mode candidates came from an isolated drum stem or the raw mix.
    """
    downbeat_onsets = [
        {"t": _r(d), "type": "downbeat", "weight": ACCENT_WEIGHTS["downbeat"]}
        for d in downbeats
    ]
    try:
        if stems and "drums" in stems:
            drums = stems["drums"]
            other = stems.get("other", y)
            source_label = "demucs_drum_stem"
        else:
            drums = other = y
            source_label = "full_mix"

        onsets = detect_drum_onsets(drums, sr)
        onsets += detect_riser_payoffs(y, sr)
        onsets += detect_non_metrical_hits(other, sr, beats, bpm)
        onsets += downbeat_onsets
        if not onsets:
            raise ValueError("no onsets detected")
        return onsets, "full", source_label
    except Exception as exc:
        warn.add(
            f"onset classification failed ({exc}) — onsets degrade to downbeats only. "
            "Cut-list logic must skip the accent-escalation rule (§7 step 2) and the "
            "trailer non-metrical override (§7 step 7)."
        )
        return downbeat_onsets, "downbeat_only", "downbeats_only"


# ===========================================================================
# 8. Lyric hook onsets (§4.3)
# ===========================================================================
def get_lyric_hook_onsets(wav_path: str, stems: dict | None, sections: list[dict],
                          section_labels: str, lyrics_path: str | None, device: str,
                          workdir: str, use_optional: bool,
                          warn: Warnings) -> tuple[list[dict], str]:
    """Returns (onsets, lyric_alignment_mode).

    Deviation from §4.3: v1 ships the WhisperX ASR+align path only. Montreal Forced
    Aligner is the doc's preferred primary (sub-frame boundary error vs WhisperX's
    200ms collar) but it needs an external binary, a pronunciation dictionary and a
    pre-built corpus directory — none of which can degrade gracefully inside a single
    self-contained script. When --lyrics is supplied we still use the text to SELECT
    the hook phrase against the ASR word timings, which is the part of §4.3 that
    actually changes the output. mode is reported honestly as "asr_alignment".
    """
    if not use_optional:
        return [], "none"
    try:
        import whisperx  # noqa: heavy import (torch + faster-whisper)
    except ImportError:
        warn.add("whisperx not installed and no forced aligner available — "
                 "lyric_hook_onset entries are omitted (lyric_alignment_mode='none'). "
                 "§7 step 4 must reassign dialogue/action slots to downbeats.")
        return [], "none"
    except Exception as exc:
        warn.add(f"whisperx import failed ({exc}); lyric_alignment_mode='none'.")
        return [], "none"

    try:
        target = wav_path
        if stems and "vocals" in stems:
            target = os.path.join(workdir, "vocals.wav")
            sf.write(target, stems["vocals"], stems.get("_sr", TARGET_SR))

        audio = whisperx.load_audio(target)
        model = whisperx.load_model("small", device, compute_type="int8")
        transcript = model.transcribe(audio, batch_size=8)
        align_model, meta = whisperx.load_align_model(
            language_code=transcript.get("language", "en"), device=device
        )
        aligned = whisperx.align(transcript["segments"], align_model, meta, audio, device,
                                 return_char_alignments=False)
        words = [
            {"word": str(w["word"]).strip().strip(".,!?\"'").lower(), "t": float(w["start"])}
            for seg in aligned.get("segments", [])
            for w in seg.get("words", [])
            if "start" in w and str(w.get("word", "")).strip()
        ]
    except Exception as exc:
        warn.add(f"whisperx alignment failed ({exc}); lyric_alignment_mode='none'.")
        return [], "none"

    if not words:
        warn.add("whisperx produced no word timings; lyric_alignment_mode='none'.")
        return [], "none"

    hooks = select_hook_onsets(words, sections, section_labels, lyrics_path, warn)
    return hooks, "asr_alignment" if hooks else "none"


def select_hook_onsets(words: list[dict], sections: list[dict], section_labels: str,
                       lyrics_path: str | None, warn: Warnings) -> list[dict]:
    """§4.3 hook selection: one entry per chorus when labels are trustworthy, otherwise
    the most-repeated content word's occurrences (capped)."""
    if section_labels == "auto":
        hooks = []
        for section in sections:
            if "chorus" not in section["label"].lower():
                continue
            first = next((w for w in words if section["start"] <= w["t"] < section["end"]), None)
            if first:
                hooks.append({
                    "t": _r(first["t"]), "type": "lyric_hook_onset",
                    "word": first["word"], "weight": ACCENT_WEIGHTS["lyric_hook_onset"],
                })
        if hooks:
            return hooks
        warn.add("no chorus-labeled section contained aligned words; "
                 "using the repeated-phrase hook heuristic instead.")

    vocabulary = [w["word"] for w in words if w["word"] not in STOPWORDS and len(w["word"]) > 2]
    if lyrics_path and os.path.isfile(lyrics_path):
        try:
            with open(lyrics_path, "r", encoding="utf-8") as handle:
                supplied = [
                    token.strip().strip(".,!?\"'").lower()
                    for token in handle.read().split()
                ]
            supplied = [t for t in supplied if t not in STOPWORDS and len(t) > 2]
            if supplied:
                vocabulary = [w for w in vocabulary if w in set(supplied)] or vocabulary
        except OSError as exc:
            warn.add(f"could not read --lyrics file ({exc}); using ASR vocabulary only.")

    if not vocabulary:
        return []
    hook_word, _count = Counter(vocabulary).most_common(1)[0]
    occurrences = [w for w in words if w["word"] == hook_word][:8]
    return [
        {"t": _r(w["t"]), "type": "lyric_hook_onset", "word": w["word"],
         "weight": ACCENT_WEIGHTS["lyric_hook_onset"]}
        for w in occurrences
    ]


# ===========================================================================
# 9. Frame math (--fps)
# ===========================================================================
def build_frame_accuracy(fps: int, bpm: float, bpm_confidence: float,
                         beats_array: list[dict], tempo_stability: str,
                         override: int | None) -> tuple[dict, int, float]:
    """§6 'Frame-accuracy budget'. A beat that MIREX scores as "correct" can still be
    1.7-2.1 frames off at 24-30fps, which is LARGER than the -2 frame perceptual
    correction. So the recommendation is conditional: apply -2 only when the analysis
    is confident and the tempo is stable; otherwise recommend 0 and tell the agent to
    widen its tolerance instead of trusting a fixed offset."""
    frame_ms = 1000.0 / fps
    frames_per_beat = (fps * 60.0 / bpm) if bpm > 0 else 0.0
    tolerance_frames = math.ceil(MIREX_TOLERANCE_SEC * fps)
    median_beat_confidence = float(np.median([b["confidence"] for b in beats_array])) if beats_array else 0.0

    confident = (
        bpm_confidence >= CONFIDENCE_GATE
        and median_beat_confidence >= CONFIDENCE_GATE
        and tempo_stability == "stable"
    )
    if confident:
        recommended = CUT_OFFSET_FRAMES_DEFAULT
        basis = "perceptual_default"
        rationale = (
            "bpm_confidence, median beats[].confidence and tempo_stability all clear the "
            "gate, so the residual error is closer to genuine perceptual early-cut "
            f"latency: {CUT_OFFSET_FRAMES_DEFAULT} frames behaves as designed."
        )
    else:
        recommended = 0
        basis = "detector_error_dominant"
        rationale = (
            f"confidence or stability is below the gate (bpm_confidence={bpm_confidence}, "
            f"median beat confidence={round(median_beat_confidence, 3)}, "
            f"tempo_stability='{tempo_stability}'). Detector error (+/-70ms = "
            f"{tolerance_frames} frames at {fps}fps) dominates the perceptual offset — "
            "recommend 0 and widen cut-timing tolerance (§7 confidence-gating) rather "
            "than trusting a fixed frame offset."
        )

    applied = override if override is not None else recommended
    if override is not None and override != recommended:
        rationale += f" Overridden to {override} by --cut-offset-frames."

    block = {
        "frame_duration_ms": round(frame_ms, 3),
        "detector_tolerance_ms": round(MIREX_TOLERANCE_SEC * 1000, 1),
        "detector_tolerance_frames": tolerance_frames,
        "median_beat_confidence": round(median_beat_confidence, 3),
        "cut_offset_frames_recommended": recommended,
        "cut_offset_basis": basis,
        "rationale": rationale,
    }
    return block, applied, frames_per_beat


# ===========================================================================
# 10. Orchestration
# ===========================================================================
def analyze(audio_path: str, fps: int, lyrics_path: str | None, track_id: str | None,
            device: str, use_optional: bool, octave_fix: bool,
            cut_offset_override: int | None) -> dict:
    warn = Warnings()
    workdir = tempfile.mkdtemp(prefix="direkta-music-")
    try:
        if not use_optional:
            warn.add(
                "--skip-optional: beat_this, allin1, demucs and whisperx were DELIBERATELY "
                "skipped. Downbeats are estimated, sections are unlabeled, onsets come from "
                "the full mix and there are no lyric hooks. This is a core-only run, not a "
                "statement about what is installed."
            )
        wav_path, decode_normalized, decode_method = normalize_audio(audio_path, workdir, warn)
        y, sr = load_audio(wav_path, warn)
        duration = float(librosa.get_duration(y=y, sr=sr))
        if duration <= 0.5:
            sys.stderr.write(f"FATAL: decoded audio is empty or too short ({duration:.3f}s).\n")
            raise SystemExit(2)

        # --- beats / downbeats -------------------------------------------------
        beats, downbeats, beat_prov = track_beats(wav_path, y, sr, device, use_optional, warn)
        if not beats:
            sys.stderr.write("FATAL: no beats could be detected in this audio.\n")
            raise SystemExit(2)

        octave = resolve_tempo_octave(y, sr, beats, downbeats, warn, enabled=octave_fix)
        beats, downbeats = octave["beats"], octave["downbeats"]
        bpm = octave["resolved_bpm"]

        intervals = np.diff(np.asarray(beats, dtype=float))
        tempo_stability, iqr_ratio = compute_tempo_stability(intervals)
        bpm_confidence, bpm_librosa = compute_bpm_confidence(bpm, y, sr)
        if bpm_confidence < CONFIDENCE_GATE:
            warn.add(f"bpm_confidence {bpm_confidence} is below the {CONFIDENCE_GATE} gate — "
                     "widen cut-timing tolerance and flag this track for manual marker review.")
        if tempo_stability != "stable":
            warn.add(f"tempo_stability='{tempo_stability}' (IQR ratio {round(iqr_ratio, 3)}) — "
                     "the beat grid drifts; a single fixed cut offset will not hold across "
                     "the whole track.")

        time_signature = infer_time_signature(beats, downbeats)
        hop = 512
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
        beats_array = build_beats_array(
            beats, downbeats, time_signature[0],
            beat_prov.pop("_beat_logits", None), beat_prov.pop("_frame_hz", 50.0),
            onset_env, sr, hop,
        )

        # --- energy ------------------------------------------------------------
        rms_raw, rms_norm, energy_times = compute_energy_curve(y, sr)
        energy_curve = [
            {"t": _r(t), "energy": _r(e), "rms": _r(r, 4)}
            for t, e, r in zip(energy_times, rms_norm, rms_raw)
        ]
        troughs = detect_troughs(rms_norm, energy_times)

        # --- stems / sections / onsets / lyrics --------------------------------
        stems = separate_stems(wav_path, device, use_optional, warn)
        sections, section_labels, section_source = get_sections(
            wav_path, rms_norm, rms_raw, energy_times, downbeats, duration,
            stems, use_optional, warn,
        )
        onsets, onset_mode, onset_source = build_onsets(
            y, sr, beats, downbeats, bpm, stems, warn
        )
        hooks, lyric_mode = get_lyric_hook_onsets(
            wav_path, stems, sections, section_labels, lyrics_path, device,
            workdir, use_optional, warn,
        )
        if onset_mode == "downbeat_only" and hooks:
            warn.add("lyric hooks were found but onset_detection_mode is 'downbeat_only'; "
                     "hooks are still emitted and remain valid cut candidates.")
        onsets = sorted(onsets + hooks, key=lambda o: o["t"])

        # --- frame math --------------------------------------------------------
        frame_block, cut_offset_frames, frames_per_beat = build_frame_accuracy(
            fps, bpm, bpm_confidence, beats_array, tempo_stability, cut_offset_override
        )

        return {
            # ---- contract fields, in the §6 schema's order --------------------
            "track_id": track_id or os.path.splitext(os.path.basename(audio_path))[0],
            "source_file": os.path.abspath(audio_path),
            "sample_rate": int(sr),
            "duration_sec": _r(duration),
            "global_bpm": round(bpm, 2),
            "bpm_confidence": bpm_confidence,
            "tempo_stability": tempo_stability,
            "time_signature": time_signature,
            "beats": beats_array,
            "downbeats": [_r(d) for d in downbeats],
            "sections": sections,
            "section_labels": section_labels,
            "onsets": onsets,
            "onset_detection_mode": onset_mode,
            "lyric_alignment_mode": lyric_mode,
            "cut_offset_frames": cut_offset_frames,
            "fps": fps,

            # ---- additive extensions (documented in SKILL.md) -----------------
            "schema_version": "1.0.0",
            "decode_normalized": decode_normalized,
            "resolved_bpm": octave["resolved_bpm"],
            "rejected_bpm": octave["rejected_bpm"],
            "frames_per_beat": round(frames_per_beat, 3),
            "frame_accuracy": frame_block,
            "energy_curve": energy_curve,
            "troughs": troughs,
            "downbeat_source": beat_prov["downbeat_source"],
            "section_source": section_source,
            "onset_source": onset_source,
            "provenance": {
                "decode": {
                    "method": decode_method,
                    "normalized": decode_normalized,
                    "target": f"mono / {TARGET_SR}Hz / s16 wav",
                },
                "beats": {
                    "source": beat_prov["beat_source"],
                    "confidence_source": beat_prov["beat_confidence_source"],
                    "checkpoint": beat_prov["beat_this_checkpoint"],
                },
                "downbeats": {
                    "source": beat_prov["downbeat_source"],
                    "rule": ("beat_this downbeat head" if beat_prov["downbeat_source"] == "beat_this"
                             else "every 4th beat, phase-anchored on the strongest onset "
                                  "among the first 16 beats"),
                },
                "tempo": {
                    "source": "median inter-beat interval",
                    "cross_check_bpm_librosa": bpm_librosa,
                    "stability_iqr_ratio": _r(iqr_ratio),
                    "octave_resolution": octave["evidence"],
                },
                "sections": {"source": section_source, "labels": section_labels},
                "onsets": {"source": onset_source, "mode": onset_mode,
                           "classifier": "band-energy heuristic (kick/snare/hihat/drum_other)"},
                "energy": {"source": "librosa.feature.rms",
                           "hop_sec": ENERGY_HOP_SEC,
                           "normalization": "track-relative min-max"},
                "troughs": {"source": "rms_local_minima",
                            "min_prominence": 0.08, "min_spacing_sec": 4.0},
                "instrumentation": {"source": "demucs stem RMS >= 20% of section total"
                                    if stems else "unavailable"},
                "lyrics": {"source": "whisperx" if lyric_mode == "asr_alignment" else "none",
                           "mode": lyric_mode,
                           "lyrics_file": os.path.abspath(lyrics_path) if lyrics_path else None},
            },
            "warnings": warn.as_list(),
        }
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="music_analysis.py",
        description="Direkta music-analysis: emit the beat-map JSON contract for a track.",
    )
    parser.add_argument("audio_path", help="path to the source audio file")
    parser.add_argument("--fps", type=int, default=FPS_DEFAULT,
                        help=f"target timeline frame rate (default {FPS_DEFAULT})")
    parser.add_argument("--lyrics", default=None,
                        help="optional lyric text file used to select the hook phrase")
    parser.add_argument("--track-id", default=None,
                        help="track id for the JSON and the cache filename "
                             "(default: input basename)")
    parser.add_argument("-o", "--output", default=None,
                        help="output JSON path (default: analysis/<track-id>.json)")
    parser.add_argument("--cut-offset-frames", type=int, default=None,
                        help="override the recommended cut_offset_frames")
    parser.add_argument("--device", default="cpu",
                        help="torch device for optional models (cpu | cuda | mps)")
    parser.add_argument("--skip-optional", action="store_true",
                        help="core-only run: skip beat_this / allin1 / demucs / whisperx")
    parser.add_argument("--no-octave-fix", action="store_true",
                        help="disable tempo-octave resolution (report the raw BPM)")
    parser.add_argument("--stdout", action="store_true",
                        help="print the JSON to stdout instead of writing a file")
    args = parser.parse_args(argv)

    if args.fps <= 0:
        parser.error("--fps must be a positive integer")

    data = analyze(
        audio_path=args.audio_path,
        fps=args.fps,
        lyrics_path=args.lyrics,
        track_id=args.track_id,
        device=args.device,
        use_optional=not args.skip_optional,
        octave_fix=not args.no_octave_fix,
        cut_offset_override=args.cut_offset_frames,
    )

    payload = json.dumps(data, indent=2)
    if args.stdout:
        print(payload)
        return 0

    out_path = args.output or os.path.join("analysis", f"{data['track_id']}.json")
    out_dir = os.path.dirname(os.path.abspath(out_path))
    os.makedirs(out_dir, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as handle:
        handle.write(payload + "\n")

    sys.stderr.write(
        f"[ok] {data['track_id']}: {data['global_bpm']} BPM "
        f"(confidence {data['bpm_confidence']}, {data['tempo_stability']}), "
        f"{len(data['beats'])} beats, {len(data['downbeats'])} downbeats, "
        f"{len(data['sections'])} sections, {len(data['onsets'])} onsets, "
        f"{len(data['warnings'])} warning(s) -> {out_path}\n"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
