# MUSIC ANALYSIS SKILL — Operating Contract

> This file is your source of truth for beat-matching. Read it **in full** before you
> touch a music-driven edit. You do not estimate tempo by ear, you do not guess where the
> chorus starts, and you do not invent beat timestamps. **You run the script, you read the
> JSON, and you check the provenance flags before you trust a field.**

---

## 1 · WHAT THIS SKILL IS

A Python CLI that turns an audio file into a **frame-accurate beat map JSON** — tempo,
every beat, downbeats, structural sections with energy, a continuous energy curve, and a
weighted onset list (kick / snare / hi-hat / riser / off-grid hit / lyric hook).

It exists because no pre-built Claude Skill, MCP server, or hosted API does this job:
librosa gives beats but not downbeats, Spotify's audio-analysis API is dead, and every
tagging API returns bucket-level moods instead of a beat array. The full survey is in
`/Users/nishkarsh/Direkta_git/direkta-modules/research/music-analysis-skill.md` — read it
if you need to justify a library choice, not to operate the tool.

**The script is the only source of beat data.** Downstream agents read the JSON and
nothing else. The script is free to change internally as long as the §5 contract holds.

---

## 2 · WHEN TO INVOKE (non-negotiable)

**Run this before scripting, on every job where a music track drives the cut rhythm.**
Specifically:

1. **Any AMV / music-video job** — before the Screenplay or Cinematographer agent writes a
   single beat. Shot count and shot duration are *derived from* the track's sections; you
   cannot write a shotlist first and retrofit it to the music.
2. **Any trailer job** — before the beat sheet. Trailer structure hangs off risers,
   stingers and the drop; those are onsets in this JSON, not vibes.
3. **Whenever the track changes** — a new cut, a different edit, a swapped needle-drop, a
   re-master. A beat map for the old file is worthless for the new one.
4. **Whenever the target `fps` changes** — the frame math (`frames_per_beat`,
   `cut_offset_frames`) is fps-dependent. Re-run with the new `--fps`.

**Do not invoke** for dialogue-driven or narration-paced work with no music bed, and do
not invoke a second time on an unchanged track — see §7 caching.

**Do not proceed to scripting without the JSON.** If the analysis fails, say so and stop;
do not fall back to guessing a BPM.

---

## 3 · INSTALL — THE LADDER

The skill is built so it **always produces a valid beat map** with only three packages
installed. Everything else buys accuracy and degrades with a warning, never a crash.

**Core (required):**

```bash
pip install -r /Users/nishkarsh/Direkta_git/direkta-modules/skills/music-analysis/requirements.txt
```

**System (strongly recommended):**

```bash
brew install ffmpeg          # macOS   (Debian: sudo apt-get install ffmpeg)
```

ffmpeg is the single decode-normalization path. Without it every timestamp may carry an
MP3 priming/padding offset of up to ~51ms — **more than one frame at 24, 25 and 30fps** —
and `"decode_normalized": false` will be set. Install it before trusting frame math.

**Optional, in priority order** (install top-down; stop when accuracy is good enough):

| Step | Package | Buys you | Without it |
|---|---|---|---|
| 1 | `pip install beat-this` | Real downbeats + per-beat posterior confidence | Downbeats **estimated** (every 4th beat, phase-anchored on the strongest early onset) |
| 2 | `pip install allin1` | Labeled sections (intro/verse/chorus/drop/outro) | Unlabeled Foote-novelty segments (`segment_1`, `segment_2`, …) |
| 3 | `pip install -U demucs` | Drum-stem onsets + `sections[].instrumentation` | Onsets classified on the full mix (noisier), instrumentation empty |
| 4 | `pip install whisperx` | `lyric_hook_onset` entries | Omitted, `lyric_alignment_mode: "none"` |

Step 1 is the highest-value install by a wide margin: **cuts landing on bar one instead of
a guessed phase is the difference between seamless and arbitrary.**

---

## 4 · CLI USAGE

```bash
python3 /Users/nishkarsh/Direkta_git/direkta-modules/skills/music-analysis/music_analysis.py \
        <audio_path> [options]
```

| Flag | Default | What it does |
|---|---|---|
| `<audio_path>` | *(required)* | Source track. Any format ffmpeg can decode. |
| `--fps N` | `24` | Target timeline frame rate. Drives `frames_per_beat` and the `cut_offset_frames` recommendation. |
| `--track-id ID` | input basename | Id written into the JSON **and** used for the cache filename. |
| `-o, --output PATH` | `analysis/<track-id>.json` | Where to write. |
| `--stdout` | off | Print JSON to stdout instead of writing a file. |
| `--lyrics FILE` | none | Lyric text used to pick the hook phrase (see §6). |
| `--cut-offset-frames N` | recommended value | Override the frame offset after a human reviews real cuts. |
| `--device cpu\|cuda\|mps` | `cpu` | Torch device for the optional models. |
| `--skip-optional` | off | Core-only run (skips beat_this / allin1 / demucs / whisperx). Fast, and recorded in `warnings`. |
| `--no-octave-fix` | off | Disable tempo-octave resolution and report the raw detected BPM. |

**Typical call for an AMV job at 24fps:**

```bash
cd <project-root>
python3 .../music_analysis.py assets/track.mp3 --fps 24 --track-id main-theme
# -> analysis/main-theme.json
```

**Exit codes:** `0` success · `2` input could not be decoded (or contains no detectable
beats) · `3` a core dependency is missing. **A non-zero exit means stop, not improvise.**

The script prints a one-line summary to stderr on success — BPM, confidence, counts, and
the warning count. Read it. A high warning count means a degraded run.

---

## 5 · THE OUTPUT CONTRACT — FIELD BY FIELD

Read these fields and nothing else. Everything is seconds unless stated.

### 5.1 Identity and decode

| Field | Meaning |
|---|---|
| `track_id` | Cache key. Matches the filename. |
| `source_file` | Absolute path to the **original** upload. Provenance only — never re-decode it yourself. |
| `sample_rate` | Always `44100` after normalization. |
| `duration_sec` | Decoded duration. |
| `schema_version` | `"1.0.0"`. Bump = contract change. |
| `decode_normalized` | `true` = ffmpeg decode-normalized (trustworthy frame math). `false` = fallback decode, timestamps may be up to ~51ms off. |

### 5.2 Tempo

| Field | Meaning |
|---|---|
| `global_bpm` | The resolved tempo. Use this one. |
| `bpm_confidence` | `0–1`. Cross-method agreement between the beat-grid tempo and librosa's independent tempogram estimate. **Below 0.6 → widen tolerance and flag for manual review.** |
| `tempo_stability` | `"stable"` / `"drifting"` / `"rubato"`. Anything but `stable` means a single fixed offset will not hold across the track. |
| `time_signature` | `[beats_per_bar, 4]`. The beat unit is **assumed** to be the quarter note — a documented assumption, not a measurement. |
| `resolved_bpm` | Same as `global_bpm`, stated explicitly. |
| `rejected_bpm` | The pre-correction value if a tempo-octave error was fixed, else `null`. If this is non-null, the grid was rewritten — see §6. |

### 5.3 Grid

| Field | Meaning |
|---|---|
| `beats[]` | `{t, index, position_in_bar, is_downbeat, confidence}`. `index` is 1-based sequential. `position_in_bar` resets to 1 on every downbeat. `confidence` is beat_this's posterior, or an onset-strength proxy in the fallback. |
| `downbeats[]` | Bar-one timestamps. **The primary cut-sync targets.** |

### 5.4 Structure and energy

| Field | Meaning |
|---|---|
| `sections[]` | `{label, start, end, bars, energy, rms_mean, instrumentation, target_avg_shot_sec}`. Always present. |
| `sections[].energy` | `0–1`, **track-relative** (min-max normalized RMS). Feeds the cut budget. |
| `sections[].rms_mean` | Raw, non-normalized RMS — an absolute loudness reference for cross-track comparison. |
| `sections[].bars` | Count of real downbeats inside the section (stays correct under tempo drift). |
| `sections[].target_avg_shot_sec` | `[lo, hi]` — interpolated from energy (0.3 → 4–6s, 0.9 → 0.5–1.5s). |
| `section_labels` | `"auto"` = labels are real and narrative rules apply. `"unlabeled"` = structural only; **do not key narrative decisions on the label.** |
| `energy_curve[]` | `{t, energy, rms}` on a 0.5s hop. Finer than sections, for micro-pacing. |
| `troughs[]` | `{t, energy, prominence}` — local energy minima (a **point**, not a window). Where to place deliberate holds. Carries no `start`/`end`/`duration_sec` — see §10 deviation 9 before using a trough to length-fit anything. |

### 5.5 Onsets

`onsets[]` entries are `{t, type, weight}` plus `non_metrical: true` on off-grid hits and
`word` on lyric hooks. Sorted by `t`. The **accent hierarchy is the `weight` field**:

| `type` | `weight` | Use |
|---|---|---|
| `downbeat`, `kick` | 1.0 | Hero reveals, primary cuts |
| `riser_payoff`, `sound_design_hit` | 1.0 + `non_metrical` | Trailer title cards — these **override** the beat grid |
| `lyric_hook_onset` | 0.85 | Dialogue / action beats |
| `snare` | 0.6 | Secondary cuts |
| `hihat`, `drum_other` | 0.2 | Effect-sync only — **never a full cut** |

Sustained tonal material is never a cut point: pads, bass notes and vocal sustain are cut
*through*, not cut *to*.

### 5.6 Frame math

| Field | Meaning |
|---|---|
| `fps` | The fps this analysis was computed for. |
| `frames_per_beat` | `fps × 60 / bpm`. |
| `cut_offset_frames` | The offset to apply to every selected timestamp before writing the EDL. |
| `frame_accuracy` | `{frame_duration_ms, detector_tolerance_ms, detector_tolerance_frames, median_beat_confidence, cut_offset_frames_recommended, cut_offset_basis, rationale}`. |

`cut_offset_basis` is the one to read:

- `"perceptual_default"` — confidence and stability cleared the gate, `-2` frames behaves
  as a genuine perceptual early-cut correction.
- `"detector_error_dominant"` — confidence or stability is low. The recommendation drops
  to `0` because detector error (±70ms ≈ 1.7–2.1 frames at 24–30fps) is **larger** than
  the correction, so a fixed offset cannot distinguish "cut early on purpose" from "the
  detector was wrong". Widen your cut tolerance instead.

### 5.7 Provenance and warnings

`warnings[]` is a plain string array — **read it before trusting anything.** Each degraded
stage adds an entry naming what was missing and what changed as a result.

`provenance` mirrors every source decision as structured data (`decode`, `beats`,
`downbeats`, `tempo.octave_resolution`, `sections`, `onsets`, `energy`, `troughs`,
`instrumentation`, `lyrics`).

---

## 6 · THE FALLBACK / PROVENANCE LADDER

Every optional stage has a flat top-level provenance field. **Branch on these, do not
assume the best case.**

| Field | Best case | Degraded | What changes for you |
|---|---|---|---|
| `decode_normalized` | `true` (ffmpeg) | `false` (librosa direct) | Frame math may be up to ~51ms off. Don't trust `cut_offset_frames`; install ffmpeg and re-run. |
| `downbeat_source` | `"beat_this"` | `"estimated"` | Downbeats are every 4th beat anchored on the strongest early onset. Bar phase may be wrong; verify the first downbeat against the audio before committing an edit. |
| `section_source` | `"allin1"` (+ `section_labels: "auto"`) | `"foote_novelty"` (+ `"unlabeled"`) | Energy-driven budget and hold logic still work. Label-keyed narrative rules ("wow-shot on Chorus 1") **do not apply** — say so rather than pretending a `segment_3` is a chorus. |
| `onset_source` | `"demucs_drum_stem"` | `"full_mix"` | Drum-class labels are noisier. Ranking still works; treat `snare` vs `drum_other` as soft. |
| | | `"downbeats_only"` (+ `onset_detection_mode: "downbeat_only"`) | Only downbeats exist. Skip the accent-escalation rule entirely and cut on the bar grid. The trailer non-metrical override **cannot fire** — surface that, don't silently skip it. |
| `lyric_alignment_mode` | `"asr_alignment"` | `"none"` | No `lyric_hook_onset` candidates. Reassign those dialogue/action slots to downbeats rather than leaving them unfilled. |

**Tempo-octave resolution.** Beat trackers routinely lock to half or double the perceived
tempo. The script runs a backbeat-period test (does the accent fall between the detected
beats, or is every other beat empty?), corroborates it against the meter implied by the
raw grid, and **rewrites the beat grid** so `global_bpm`, `beats[]` and `time_signature`
stay consistent. If `rejected_bpm` is non-null the correction fired — the evidence is in
`provenance.tempo.octave_resolution`. Disable with `--no-octave-fix` if a track is
genuinely at an unusual tempo and the correction is fighting you.

**Confidence-gating (applies in every mode).** If `bpm_confidence` or a given
`beats[].confidence` is below ~0.6, widen the cut-timing tolerance rather than snapping
tightly, and flag the track for manual marker review. State-of-the-art beat trackers reach
roughly 86–94% accuracy on standard benchmarks — a blind-trust model will occasionally be
wrong, and it is cheaper to say so than to ship a drifting edit.

---

## 7 · CACHING CONVENTION

- **Path:** `analysis/<track-id>.json`, relative to the project root. This is the default
  output; do not invent another location.
- **One file per track per fps.** The JSON records the `fps` it was computed for.
- **Re-run only when the track changes** — a different file, a new cut/edit/master, or a
  changed `--fps`. Analysis takes real time (and real GPU/CPU on the optional models);
  re-running on an unchanged track is pure waste.
- **Before analysing, check whether `analysis/<track-id>.json` already exists.** If it
  does, and `source_file` + `fps` still match the job, **read it and move on.**
- **Never hand-edit the JSON.** If a value is wrong, fix the input or the flags and re-run.
  The one exception is `cut_offset_frames`, which is explicitly a per-project tunable —
  change it via `--cut-offset-frames` after a human reviews real cuts against the audio,
  so the change is reproducible.
- Commit the JSON with the project. It is a deterministic artifact and a cheap way to make
  an edit reproducible later.

---

## 8 · HOW DOWNSTREAM AGENTS CONSUME IT

The consuming rule files are:

- `/Users/nishkarsh/Direkta_git/direkta-modules/agents/amv-music-video-agent.md`
- `/Users/nishkarsh/Direkta_git/direkta-modules/agents/trailer-agent.md`

Both open with a **"NO BEAT MAP, NO WORK"** directive: they refuse to plan a single beat
without `analysis/<track-id>.json` and are forbidden from re-deriving BPM by ear. That
makes this skill a hard upstream gate, not an optional enrichment step. Their background
research lives in `/Users/nishkarsh/Direkta_git/direkta-modules/research/amv-music-video.md`
and `.../research/movie-anime-trailer.md`.

Both map a shotlist onto the beat map with the same eight steps:

1. **Budget cuts per section, not per beat.**
   `n_cuts = round(section.duration / avg(section.target_avg_shot_sec))`. High-energy
   sections get many cuts, low-energy sections few, by construction. Check
   `section_labels` first — in `"unlabeled"` mode only the energy-driven budget applies.
2. **Rank candidate sync points inside the section** from `onsets[]` by `weight`
   descending, restricted first to `is_downbeat` or `weight ≥ 0.6`. Spill into
   hi-hat/subdivision onsets **only** if the budget exceeds the high-weight candidates:
   bar-length cuts for verses and builds, collapsing to beat/half-beat cuts at
   choruses/drops. In `downbeat_only` mode, skip straight to bar-grid cutting.
3. **Select the top-N candidates** (N from step 1) with a minimum spacing of one beat
   (`60 / bpm` seconds) so cuts don't cluster unnaturally.
4. **Assign shots in narrative order:** reveal/hero shots → downbeats and
   `riser_payoff` / `sound_design_hit`; dialogue/action beats → `lyric_hook_onset`;
   connective B-roll → remaining downbeats. If `lyric_alignment_mode` is `"none"`,
   reassign those slots to downbeats.
5. **Apply `cut_offset_frames`** to every selected timestamp, quantized to the nearest
   frame at `fps` — once globally, never hand-tuned per cut.
6. **Insert deliberate holds.** Where `energy` drops sharply from the previous section, cut
   the step-1 budget by ~50% and prefer motion-sync over cut-sync. `troughs[]` gives the
   *point* to hold on (`t`) — it is not a duration. If the use needs a **length** (e.g.
   fitting a line of dialogue to a gap), a trough alone cannot answer that; derive the
   window from `energy_curve[]` as described in §10 deviation 9. A well-placed hold makes
   the next cut land harder; cutting on every beat reads as frantic.
7. **Trailer-mode override.** A `non_metrical` onset with `weight 1.0` near a title card or
   hero reveal **wins that slot regardless of the beat grid.** No-op in `downbeat_only`
   mode — surface that the track is running degraded rather than skipping silently.
8. **AMV note:** for montage/opening sequences, work from the build→drop arc (pre-chorus
   into chorus, or verse-climax into bridge), not the intro. Intros are reliably the
   rhythmically weakest material and produce a weak opening rhythm.

---

## 9 · KNOWN LIMITS — STATE THESE, DON'T PAPER OVER THEM

- **Drum classification is a heuristic, not a trained classifier.** Band energy plus a
  decay test. It will misclassify 808 kicks with a high-frequency click, trap hi-hat rolls,
  and live kits with heavy mic bleed. Ambiguous hits become `drum_other` at hi-hat weight —
  under-weighted, never dropped.
- **The beat unit is assumed to be a quarter note.** `time_signature` is
  `[beats_per_bar, 4]` by assumption. Irregular meters will be reported wrong.
- **Lyric alignment is ASR-based (WhisperX), not forced alignment.** WhisperX's own
  evaluation uses a 200ms collar — roughly 5 frames at 24fps, which **exceeds** the frame
  budget. Treat `lyric_hook_onset` timings as approximate and never as the sole anchor for
  a hard cut. Montreal Forced Aligner is the accurate path and is not wired in (see §10).
- **`sections[].instrumentation` is demucs stem names only** (`vocals`/`drums`/`bass`/
  `other`). Finer descriptive tags like `"synth_pad"` are human annotation, not output.
- **Foote-novelty boundaries are unlabeled and approximate.** They are snapped to the
  nearest downbeat within one bar, which makes them musically usable but not authoritative.

---

## 10 · DEVIATIONS FROM THE RESEARCH DOC

Recorded so nobody assumes these are bugs.

1. **ffmpeg is not a hard requirement.** §6 makes decode-normalization a precondition. The
   script prefers it but falls back to a direct librosa decode with
   `"decode_normalized": false` and a loud warning, because always returning a usable beat
   map with an honest provenance flag beats returning nothing on a machine without ffmpeg.
2. **Off-grid hit detection uses a beat + half-beat grid.** §4.1 specifies a quarter-beat
   grid with a `1/8 × 60/bpm` threshold — but on a quarter-beat grid the *maximum possible*
   distance to the nearest grid point **is** `1/8 × 60/bpm`, so that rule can never fire.
   The threshold is kept (it is the musically meaningful one) and applied to the
   beat + half-beat grid, where it flags the outer half of each interval.
3. **`onset_detection_mode` stays a two-value enum.** §4.1 defines `"full"` and
   `"downbeat_only"`. Full-mix classification (demucs absent) is a third real state, but it
   still produces every candidate type the cut-list logic needs, so it reports as `"full"`
   with `onset_source: "full_mix"` rather than adding an enum value that would break agents
   branching on the documented two.
4. **Montreal Forced Aligner is not wired in.** §4.3 makes MFA the primary lyric path. It
   needs an external binary, a pronunciation dictionary and a pre-built corpus directory —
   none of which can degrade gracefully inside a self-contained script. v1 ships the
   WhisperX path and reports `"asr_alignment"` honestly. When `--lyrics` is supplied the
   text is still used to *select* the hook phrase, which is the part of §4.3 that changes
   the output. MFA is the obvious v1.1 upgrade.
5. **Additive fields beyond the §6 schema.** `schema_version`, `decode_normalized`,
   `resolved_bpm`, `rejected_bpm`, `frames_per_beat`, `frame_accuracy`, `energy_curve`,
   `troughs`, `downbeat_source`, `section_source`, `onset_source`, `provenance`,
   `warnings`. All additive — every §6 contract field is present, unchanged, in its
   original order. `energy_curve` is required by §1 requirement 5 and referenced in §6's
   field notes but was missing from the schema block; `troughs` is added because §7 step 6
   ("insert deliberate holds where energy drops") otherwise has no producer.
6. **Tempo-octave resolution rewrites the beat grid.** Reporting a corrected `global_bpm`
   while leaving a half-rate `beats[]` array in place would break `time_signature` and the
   step-3 minimum-spacing rule. Doubling inserts midpoints; halving keeps every other beat,
   phase-locked so every downbeat survives. Both preserve `downbeats[]` exactly.
7. **Octave-test envelopes are linear-power, not dB.** librosa's default onset strength
   runs through `power_to_db`, which compresses the exact dynamic range the test depends on
   (an 8th-note hi-hat reads ~0.6 of a kick in dB, ~0.01 in linear power). Thresholds are
   calibrated on the linear domain.
8. **The hi-hat rule includes the decay test §4.1 specifies.** Frequency alone labels any
   bright noise burst — a crisp snare, a crash — as a hi-hat and silently costs it its 0.6
   weight. High-band hits are split by late/early RMS ratio.
9. **`troughs[]` is a point minimum, not the research §5.6 duration-bearing window.** The
   trailer research (§5.6) specifies a trough as an interval — `{start, end, duration_sec,
   floor_rms, floor_rms_rel}`, a maximal span where smoothed RMS stays ≤40% of the
   enclosing section's `rms_mean` for ≥300ms — and trailer rule 14 queries exactly those
   fields to length-fit a dialogue line. The script instead emits the local-minimum
   timestamp — `{t, energy, prominence}` — with no `start`, `end` or `duration_sec`. Both
   answer "where is the next gap", but only the research shape also answers "how long is
   it", which is what a length-fit needs. **Do not treat `troughs[]` as carrying a
   duration.** A consumer that needs a trough's length must derive it from `energy_curve[]`
   (0.5s hop, `{t, energy, rms}`): walk outward from `troughs[i].t` in each direction while
   `energy` stays within `troughs[i].prominence` of `troughs[i].energy`; the first sample
   past that band on each side gives `start`/`end`, and `duration_sec = end − start`
   (±0.25s resolution from the hop). See §5.4 and §8 step 6.

---

## 11 · DEFINITION OF DONE

You are done when: the JSON exists at `analysis/<track-id>.json`; the script exited `0`;
you have **read the `warnings` array out loud to the director** if it is non-empty; you
have stated which provenance mode each of `downbeat_source`, `section_source`,
`onset_source` and `lyric_alignment_mode` is in; and you have flagged the track for manual
marker review if `bpm_confidence < 0.6` or `tempo_stability` is not `"stable"`.

You never declare a beat map trustworthy on your own authority when it ran degraded — you
report the mode and let the director decide whether to install the missing dependency.
