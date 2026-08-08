# Music Analysis Skill — Findings & Recommendation

Research date: 2026-08-08. Scope: Claude Skills, MCP servers, Python libraries, and
hosted APIs for tempo/beat/downbeat/section/energy extraction from an audio file, to
inform a custom `music-analysis` skill feeding Direkta's AMV and Trailer modules (see
`direkta-modules/agents/amv-music-video.md` and `direkta-modules/agents/movie-anime-trailer.md`).
Only links that were directly fetched or verified via `gh api` are kept; anything that
returned a 403/429 without a successful retry is marked unverified below rather than
dropped silently.

---

## 1. What we need (beat-matching requirements for the AMV and Trailer modules)

Both downstream modules already exist as rule files in `direkta-modules/agents/` and both
assume a music track drives the cut rhythm — but today neither has a real signal-level
beat map to read from. To generate a cut-list that actually lands on the music instead of
guessing, the modules need, per uploaded track:

1. **Global tempo (BPM)**, with a confidence score, and an explicit flag if the track has
   tempo drift (live recording, rubato, no click track) rather than a single fixed pulse.
2. **Every beat timestamp**, not just tempo — the raw pulse train, frame-quantizable.
3. **Downbeats specifically** (beat 1 of each bar) — the single biggest gap in the
   "obvious" tool choice (librosa) and the reason this research exists. Cuts on downbeats
   read as seamless; cuts on off-beats read as arbitrary. The Higgsfield-audio skill (§2)
   states this directly: "camera cuts land on the downbeats."
4. **Section boundaries + labels** (intro/verse/chorus/bridge/drop/outro) with a per-section
   **energy value**, so the agent can budget cut density instead of treating the track as
   uniform (long holds in a verse, rapid cuts in a chorus/drop).
5. **A continuous energy curve** (RMS or equivalent), finer-grained than section labels,
   for micro-pacing decisions inside a section.
6. **Non-metrical "hit" moments** — risers, stingers, drops, vocal ad-libs — that don't sit
   on the beat grid but outrank ordinary beats for trailer title-card/reveal placement.
7. **A frame-accurate, reproducible JSON artifact** the agents can consume deterministically
   — not a qualitative prose "vibe report" (ruling out most Claude Skills found in §2). "Frame-
   accurate" has a specific numeric budget and a decode-normalization precondition — see §6's
   "Decode normalization" and "Frame-accuracy budget" subsections; raw detector output is
   *not* frame-accurate by the field's own MIREX standard (±70ms ≈ 1.7–2.1 video frames)
   until both are applied.
8. **A runtime shape that fits Direkta's stack.** Direkta is Next.js/Vercel (`package.json`:
   Next 15, React 19, no Python runtime) that already special-cases Vercel's ephemeral
   filesystem (commit `db4b29d`). The scripting pipeline runs as **Claude Code agent rule
   files invoked outside the deployed app** (Screenplay → Cinematographer → Higgsfield,
   per `direkta-scripting-test/docs/pipeline.md`), so heavy Python analysis belongs in that
   same authoring-time pattern, not inside a Vercel API route.

---

## 2. Existing Claude skills found (exact links, what each does, verdict on each)

**Official `anthropics/skills` repo — confirmed empty for audio.** Listed directly via
`gh api repos/anthropics/skills/contents/skills`: `algorithmic-art, brand-guidelines,
canvas-design, claude-api, doc-coauthoring, docx, frontend-design, internal-comms,
mcp-builder, pdf, pptx, skill-creator, slack-gif-creator, theme-factory,
web-artifacts-builder, webapp-testing, xlsx`. No audio/music skill exists.
https://github.com/anthropics/skills

| Skill | Link | What it does | Verdict |
|---|---|---|---|
| "Music Analysis — Local Audio Insights" | https://mcpmarket.com/tools/skills/music-analysis-audio-insights | SKILL.md that shells out to **librosa** for tempo/key-clarity/harmonic-tension and local **Whisper** for transcription, producing a qualitative report (groove feel, emotional journey, mood arc). MP3/WAV/FLAC/M4A. | Descriptive/qualitative only, no beat-grid precision, no downbeats. Not usable as a JSON data source for a cut-list generator. |
| "Music Analysis — Audio Intelligence" | https://mcpmarket.com/tools/skills/music-analysis-audio-intelligence | Search-snippet only — same author/family as the entry above (librosa+Whisper). Direct fetch returned 429 on two attempts. | Unverified; treat as a duplicate listing, not a distinct tool. Do not rely on it. |
| Loooom | https://loooom.xyz/s/mager/how-to-identify-parts-of-a-song (blog: https://www.mager.co/blog/2026-03-26-loooom-identify-song-parts/) | Instructs Claude Code to install ffmpeg + librosa itself and run a custom PCM pipeline for BPM (onset-based), song sections w/ timestamps, key/meter, frequency-band energy, rough instrument ID. | Closest in spirit to what Direkta needs conceptually, but it is a prompt artifact with **no packaged repo** to fork, no downbeat detection, and no fixed JSON schema. Useful as a design reference, not as an install target. |
| bitwize-music-studio/claude-ai-music-skills | https://github.com/bitwize-music-studio/claude-ai-music-skills (405 stars, active) | 53-skill collection for a **Suno song-generation** pipeline; "audio/stem analysis" skills run *after generation* for mastering QC (loudness/clipping/phase/stereo width). | Not a fit — analyzes output masters, not an arbitrary input track's beat grid. |
| KVNKEVINN/claude-music-studio | https://github.com/KVNKEVINN/claude-music-studio (8 stars) | A standalone desktop installer app with loose "Claude AI integration," not an actual Skill/MCP. Basic pitch/tempo/frequency analysis. | Low relevance, low adoption, misleading name. |

**Adjacent skills** — not audio analyzers, but directly useful as vocabulary/precedent for
the beat-sync *rules* Direkta's own skill should encode:

- `browser-use/video-use` SKILL.md — https://github.com/browser-use/video-use/blob/main/SKILL.md
  — codifies **0.5–2s per accent cut** for music-video/fast-montage pacing (vs. 3–14s for
  narration-paced explainer cuts), a "hold final frame ≥1s before cut" rule, and a
  400ms-silence-gap cut-candidate heuristic (transcript-driven, not real beat detection).
- `keithwalsky-ship-it/UGC-ai-prompt-skill` — https://github.com/keithwalsky-ship-it/UGC-ai-prompt-skill/blob/main/skills/higgsfield-audio/SKILL.md
  — Higgsfield-specific: "camera cuts land on the downbeats," visual energy builds toward
  the drop; recommends extracting a **15-second build→drop window** (pre-chorus→chorus or
  verse-climax→bridge) instead of feeding a full track, since full-track uploads default to
  the rhythmically weak intro. Directly relevant to Direkta's Higgsfield Operator agent.

**Verdict:** No usable pre-built Claude Skill exists for rigorous beat/downbeat/section
extraction. The closest options are thin, undocumented librosa/ffmpeg wrappers with no
downbeat detection and nothing packaged to fork. Direkta needs to build its own.

---

## 3. MCP servers found (links, capabilities, verdict)

Note: the internal `mcp__mcp-registry__search_mcp_registry` tool returned **zero results**
for every query tried (`music analysis`, `beat detection`, `audio`, `music`, `tempo BPM`,
`sound analysis`) during the original research pass — it does not index this space. All
findings below come from web search plus direct GitHub verification.

| Server | Repo | Capabilities | License / install | Status |
|---|---|---|---|---|
| **mcp-music-analysis** (best candidate) | https://github.com/hugohow/mcp-music-analysis (26 stars) | Built on **librosa**; exposes beat detection, tempo, onset times, spectral centroid, MFCCs, pitch-change points, duration. Accepts local files, YouTube links, or direct URLs (auto-downloads). | MIT. Has `smithery.yaml`, `Dockerfile`, `pyproject.toml`. Install: `npx -y @smithery/cli install @hugohow/mcp-music-analysis --client claude`, or `uv pip install -e .` from source. | Pushed 2026-07-21, actively maintained. |
| MCP Advanced Music Analysis Server (FantasticEarMCP) | https://market.lobehub.com/s/plugins/vbarreiratt-fantasticearmcp | librosa-based; MP3/WAV/FLAC/M4A/OGG; tempo, duration, spectral features. | Unverified license/repo — source page returned 403. | Lower confidence, unconfirmed. |
| xlights-mcp-server | https://github.com/JohnBreault/xlights-mcp-server | Full pipeline: beat/tempo via **librosa + madmom**, song-structure detection, frequency-band analysis, stem separation — built to drive Christmas light shows, but the analysis module is reusable. The **only MCP found that pairs librosa with madmom for real downbeat-capable structure detection.** | Not deeply verified beyond search snippet. | Worth a closer look if the MCP route is revisited later. |
| music-mcp-server | https://github.com/gorums/music-mcp-server (14 stars) | Local music **library/metadata** management (album classification, analytics) — confirmed via `gh api`: purely metadata management, **not signal analysis**. | MIT | False positive on "music MCP" searches — not a fit. |
| live-coding-music-mcp | https://github.com/williamzujkowski/live-coding-music-mcp (229 stars, pushed 2026-08-07) | Gives Claude control of **Strudel.cc** for live-coding music generation. Its "analyze" tool reads FFT/tempo only from **currently-playing Strudel patterns via Web Audio API** — confirmed it cannot ingest an arbitrary external audio file. | MIT | Not a fit despite the highest star count — it's a generation tool, not a file analyzer. |

**Verdict:** `hugohow/mcp-music-analysis` is the one legitimately usable, verifiable,
actively-maintained MCP server for this space — but it inherits librosa's core limitation:
**no downbeat detection, no structural sections** (see §4). It gets tempo + beat grid +
onsets only, which is not sufficient on its own for the AMV/Trailer cut-list requirement
in §1.

---

## 4. Python libraries compared

| Library | Detects | Accuracy reputation | Install friction | License |
|---|---|---|---|---|
| **librosa** | Tempo (single global value) + beat times via `beat.beat_track()`. Confirmed via official docs: does **not** detect downbeats, only regular beats. Assumes one steady tempo; degrades on tempo changes/rubato. `librosa.feature.rms` gives a usable energy-over-time curve. | Reliable on tracks with clear percussive onsets and stable tempo; weak on rubato. Industry-standard MIR baseline. | Trivial — `pip install librosa`, pure Python + numpy/scipy/numba, no model downloads. | ISC (permissive) |
| **madmom** | Beats, **downbeats**, onsets, tempo, key, chords via DBN/RNN models — historical gold standard for downbeat tracking. | SOTA ~2016–2018; still the beat backbone inside `allin1`. | **Bad** — PyPI's last release is 0.16.1 from November 2018 (confirmed via PyPI metadata). Modern installs need `pip install git+https://github.com/CPJKU/madmom` from source, which hits chronic Cython/NumPy ABI breakage (open discussion: https://github.com/CPJKU/madmom/discussions/536). | BSD-ish/academic, but effectively unmaintained — treat as a liability. |
| **beat_this** (CPJKU, ISMIR 2024) — modern replacement for madmom's core job | Beats + **downbeats** via a transformer, no DBN postprocessing required. Does not output BPM directly (derive from beat-interval spacing). | Paper claims SOTA beat tracking "without DBN postprocessing," outperforming madmom-based pipelines on standard benchmarks. | Clean: `pip install beat-this`. Independent of madmom. PyPI confirms "Development Status :: 5 - Production/Stable." | MIT, code + weights |
| **allin1** (All-In-One Music Structure Analyzer) | The only library here giving **labeled structural sections** (intro/verse/chorus/bridge/outro) plus BPM, beats, downbeats, beat_positions in one JSON. Under the hood: madmom for beat tracking + a Harmonix-trained segmentation model. | 818 stars; built on the Harmonix Set benchmark. Reported: RTX 4090 + i9-10940X processed 10 songs (33 min) in 73s. | **Heaviest of the group** — needs PyTorch, NATTEN (auto-installs on macOS, manual elsewhere), madmom (inherits its pain), optional ffmpeg. MP3-decoder timing-offset quirk — WAV recommended. Repo last pushed 2024-05-09, 18 open issues. | MIT |
| **Essentia** (C++/Python) | `RhythmExtractor2013`: tempo, beat times + **per-beat confidence score**. Confirmed via docs: no native downbeat algorithm either. Also key/chord/loudness/genre/mood classification. | Long-standing MTG/UPF academic library, widely cited. | Native pip wheels exist but Apple Silicon has open compatibility issues (e.g. `essentia.tensorflow` submodule missing on osx-arm64, GitHub issue #1486). | **AGPL-3.0** for the free tier — commercial licensing available from MTG/UPF. Real constraint for a commercial SaaS. |
| **aubio** | Tempo, beat tracking, onset detection, pitch. Lightweight C core, thin Python bindings. | Older/simpler than librosa; fine for onset/tempo, not used for downbeats/sections in practice. | `pip install aubio`, minimal deps. | GPL |
| **demucs** (stem separation, preprocessing aid) | 4–6 stem separation (vocals/drums/bass/other). Not beat detection itself — useful to isolate drums/bass before beat-tracking a dense mix. | Meta's model, strong SOTA reputation for source separation. | `pip install -U demucs`. Stock PyTorch MPS backend breaks on demucs' complex tensors — runs CPU-only unless using `demucs-mlx` (~73x realtime on Apple Silicon, MIT) or `mlx-demucs` (34x realtime on M4 Max, Apple MLX). | MIT |
| BeatNet | Real-time CRNN + particle-filter joint beat/downbeat/tempo/meter tracker. https://github.com/mjhydri/BeatNet (510 stars, pushed 2026-04-13) | Comparable modern alternative to beat_this for downbeats. | Not deeply evaluated for this doc — noted as an alternative if beat_this underperforms on a given catalog. | CC-BY-4.0 |
| openl3 / musicnn | Deep audio **embeddings** / genre-mood tagging — not beat/tempo/section detectors. | N/A for beat-matching. | `pip install openl3` (TF2-based) | Permissive |

**Key finding driving the design:** librosa and Essentia both give beats but **not
downbeats**; only madmom (stale), beat_this (modern, MIT, actively maintained, pushed
2026-05-28), allin1 (stale-ish, heavy), or BeatNet give real downbeat timing. `beat_this`
is the best-maintained, lowest-friction option for beats+downbeats today, and is the
library Direkta should adopt as the core dependency.

### 4.1 Onset classification — drum-class weighting and non-metrical hits

None of the libraries in the table above classify an onset into kick/snare/hi-hat, and
none detect risers, stingers, or sound-design hits. No packaged library does this end to
end; it has to be composed from primitives already in the stack (librosa onset detection
+ demucs stem separation, both already adopted above). This is the derivation for the
`onsets[]` array's `type` field:

**Drum-class onsets (kick / snare / hihat).**

1. Run `demucs` (already the stem-separation dependency for §4.3 below) to split the
   track into `drums / bass / vocals / other` stems.
2. Run `librosa.onset.onset_detect()` on the **drums stem only** — isolating drums first
   removes melodic/vocal energy that would otherwise pollute peak-picking. `onset_detect`
   peak-picks a spectral-flux onset-strength envelope (`onset_strength()`, mel-band
   spectral flux) with tunable `pre_max/post_max/pre_avg/post_avg/delta/wait` peak-picking
   windows (defaults ~30ms pre/post-max, 100ms pre/post-avg, `delta=0.07`); pass
   `backtrack=True` to snap each detected peak to the preceding local energy minimum, which
   gives a cleaner attack-point timestamp for cut-quantization.
   ([librosa onset docs](https://librosa.org/doc/main/generated/librosa.onset.onset_detect.html))
3. Classify each detected drum-stem onset by **band energy** in a short window (≈30–50ms)
   after the onset: compute RMS or spectral-centroid-weighted energy in three bands and
   pick the dominant one. There is no single universally-agreed frequency table (drum
   timbre varies by kit/genre and "the boundaries between drum types are blurry" even in
   dedicated classifiers — [soundsandwords.io](https://www.soundsandwords.io/drum-sound-classification/)),
   but a workable starting heuristic, cross-checked against a shipped drum-stem-splitting
   tool's band choices ([drumsep](https://github.com/cukas/drumsep)):
   - **kick**: energy concentrated **< 150 Hz** (typical fundamental spike ~60–100 Hz)
   - **snare**: energy in **150–400 Hz** (body) *and* a broadband noise burst in
     **2–4 kHz**; require both bands to be non-trivial to avoid confusing a snare with a
     low tom
   - **hihat**: energy concentrated **> 3 kHz**, low low-band energy, short decay
   Onsets that don't clear a minimum energy threshold in any band, or that split evenly
   across bands (ambiguous/cymbal wash/fill), are labeled `type: "drum_other"` and get the
   hi-hat weight (0.2) rather than being dropped — better to under-weight an ambiguous hit
   than to silently lose it from the candidate pool.
4. This is a heuristic, not a trained classifier — accept it will misclassify on unusual
   kits (808-style kicks with high-frequency click, trap hi-hat rolls, live jazz kits with
   heavy bleed between mics). If Direkta later needs higher accuracy, the same soundsandwords.io
   piece and the drum-transcription literature ([arXiv:2209.10016](https://arxiv.org/pdf/2209.10016))
   point to MFCC + a small trained classifier as the upgrade path — out of scope for v1.

**Non-metrical hits (risers, stingers, drops).**

- **Riser payoff**: compute a global spectral-flux envelope (`librosa.onset.onset_strength()`
  on the full mix or the `other` stem) and RMS in ~100ms hops. Flag a window as a riser
  candidate when both curves show a **monotonic (or near-monotonic, allowing small dips)
  upward ramp over ≥ 1.0s** immediately followed by a local peak-then-drop. The onset
  timestamp emitted is the **peak**, not the start of the ramp — that peak is the "payoff"
  moment the cut-list logic syncs to (`type: "riser_payoff"`, `weight: 1.0`,
  `non_metrical: true`). Spectral flux is defined as the frame-to-frame magnitude
  difference in the spectrum and is the standard "signal is building" measure in onset
  literature ([MathWorks spectral descriptors](https://www.mathworks.com/help/audio/ug/spectral-descriptors.html)).
- **Sub-band transients off the grid**: run onset detection independently on the `other`
  stem (the bucket most likely to contain sound-design SFX: whooshes, impacts, drones) and
  compare each detected onset's timestamp to the nearest point on the beat/subdivision grid
  (beats, half-beats, quarter-beats derived from `beats[]`). An onset more than **half a
  subdivision (`1/8 * 60/bpm` seconds) away from any grid point** is tagged
  `non_metrical: true`; if its local energy jump exceeds a threshold (e.g. spectral flux
  > 2× the track's median flux), it is emitted as `type: "sound_design_hit"`,
  `weight: 1.0`. This is what powers trailer-mode step 7 in §7 — a hit that has no
  business being on the beat grid but must win the cut anyway.

**Degraded behaviour when no classifier is available.** If `demucs` fails (missing
dependency, OOM on a long track, unsupported input) or the classification step is skipped
for cost reasons, the script must not silently omit `onsets[]` — it falls back to emitting
**only downbeat onsets** (`type: "downbeat"`, `weight: 1.0`, one entry per `downbeats[]`
timestamp) and sets a top-level `"onset_detection_mode": "downbeat_only"` flag (full mode:
`"full"`). Consuming agents must check this flag: in `downbeat_only` mode, §7 step 2's
ranking has nothing above weight 1.0 to rank against, step 7's trailer override has no
`non_metrical` candidates and cannot fire, and the agent should fall back to bar-grid
cutting only — degraded, not broken.

### 4.2 Section boundaries — provider and fallback

§6 previously treated `allin1` (the only library giving labeled sections, §4 table above)
as optional — "only if labeled sections prove worth the cost." That is not a real option:
both `amv-music-video.md` (§6.2, cut-budget formula keyed on `section.energy`) and
`movie-anime-trailer.md` (same formula, plus §5.1's section-length templates) require a
`sections[]` array with energy on every track. **Sections are therefore mandatory in the
artifact; the labeling is what degrades gracefully:**

- **Primary path**: `allin1` — gives real labels (intro/verse/chorus/bridge/drop/outro),
  bar counts, and beat-synced boundaries in one call. This is the default, not an optional
  add-on, whenever the PyTorch/NATTEN/madmom install succeeds.
- **Fallback path** (allin1 unavailable/fails/times out): **Foote novelty segmentation**
  over the same RMS energy curve the script already computes. Foote's method (2000) builds
  a self-similarity matrix over short-time features, convolves it with a checkerboard
  kernel centered on the diagonal, and reads local maxima of the resulting novelty curve as
  segment boundaries — it needs no training data and works on the same features already in
  memory ([Foote, "Automatic audio segmentation using a measure of audio novelty"](https://www.researchgate.net/publication/3863771_Automatic_audio_segmentation_using_a_measure_of_audio_novelty);
  [worked example](https://www.audiolabs-erlangen.de/resources/MIR/FMP/C4/C4S4_NoveltySegmentation.html)).
  Boundaries from this path are **unlabeled** (`"label": "segment_1"`, `"segment_2"`, …
  rather than `"chorus"`) and `instrumentation` is left `[]` (no classifier run), but
  `energy` and `rms_mean` are computed identically to the primary path (mean of the
  already-computed RMS curve within each boundary pair) so `target_avg_shot_sec` and the
  §7 step-1 cut budget still work. Set `"section_labels": "auto"` (allin1) or `"unlabeled"`
  (Foote fallback) at the top level so consuming agents know whether `label` values are
  trustworthy for narrative decisions (e.g. "put the wow-shot on Chorus 1," §6.2 of
  `amv-music-video.md`) or are structural-only.

### 4.3 Word-level lyric alignment (for `lyric_hook_onset`)

`lyric_hook_onset` (weight 0.85) has no producer anywhere in the doc as flagged. Whisper
only appears inside the third-party skill §2 rejects ("Music Analysis — Local Audio
Insights"), and no forced aligner is evaluated. This closes that gap.

| Approach | What it does | Timing error | Fit |
|---|---|---|---|
| **Demucs vocal stem → Montreal Forced Aligner (MFA)** against supplied lyrics | Isolate vocals with the demucs dependency already adopted, then force-align the known lyric text (not ASR transcription) to the isolated vocal stem. MFA is a mature, actively maintained Kaldi-based forced aligner. | Mean boundary error **21.9ms (TIMIT)** / **27.8ms (Buckeye)**; median deviation **~12.5ms**; MFA 3.0 (2026) reports mean boundary error **< 15ms** across languages. ([MFA/aligner comparison study](https://arxiv.org/html/2606.18466v1)) | **Recommended primary path when lyrics are supplied.** Sub-frame accuracy at 24/25/30fps (one frame = 33–42ms) — this is the only evaluated lyric-timing method that actually meets the §6 frame-accuracy budget. |
| **Demucs vocal stem → WhisperX** (ASR + wav2vec2 forced alignment) | Transcribes *and* aligns when lyrics aren't supplied. Used inside the rejected §2 skill and in common karaoke pipelines. | WhisperX's own published evaluation uses a **200ms collar** — i.e. its authors only claim word-boundary accuracy to within 200ms, ~5 frames at 24fps. Production users report timestamps "significantly off" versus MFA on the same audio ([GitHub issue #1247](https://github.com/m-bain/whisperX/issues/1247)), and accuracy degrades further on music (instrumental bleed even after demucs) versus WhisperX's clean-speech benchmark corpora (AMI, Switchboard). | **Fallback only, when no lyric text is supplied.** Exceeds the frame budget — see degraded-mode note below. |
| **NVIDIA NeMo Forced Aligner (NFA)** | CTC-based Viterbi forced alignment against supplied text; reported the most accurate/fastest of aligners it was benchmarked against. | Reported timestamp error **20–120ms** across languages in one benchmark ([arXiv:2505.15646](https://arxiv.org/html/2505.15646)) — wider spread than MFA, sometimes sub-frame, sometimes not. | Not adopted for v1 — heavier NeMo/PyTorch dependency for accuracy that doesn't clearly beat MFA; worth revisiting if MFA underperforms on a specific catalog. |

**Hook-word selection.** The `lyric_hook_onset` contract entry is one event, not a
transcript — emitting every aligned word would just be `onsets[]` bloat with weight 0.85
attached to filler words. Selection rule:

1. If `sections[]` labels are trustworthy (`"section_labels": "auto"`, §4.2), take the
   **first word of the first line inside the first `chorus`-labeled section** — the hook is
   by definition the line the chorus opens on.
2. If sections are unlabeled (Foote fallback) or no `chorus` label exists, fall back to a
   **repeated-title-phrase heuristic**: count word/short-n-gram frequency across all
   aligned words (excluding a small stopword list), and take the **first occurrence** of
   the most-repeated content word or phrase as the hook.
3. Emit exactly one `lyric_hook_onset` per chorus occurrence (not per word, not once per
   track) — one for Chorus 1, one for Chorus 2, etc. — matching how §7 step 4 assigns it to
   a single "dialogue/action beat" slot per chorus, not a continuous lyric-sync track.

**Degraded behaviour.** If neither MFA nor WhisperX can run (no lyrics supplied and no ASR
available), the script omits `lyric_hook_onset` entries entirely and sets
`"lyric_alignment_mode": "none"` (values: `"forced_alignment"`, `"asr_alignment"`,
`"none"`) at the top level. §7 step 4's "dialogue/action beats → lyric_hook_onset" clause
is a no-op in that mode; the agent must reassign those shot slots to downbeats instead of
silently dropping them.

---

## 5. Hosted APIs (if any are viable)

| Service | Capability | Beat-level timing data? | Status |
|---|---|---|---|
| **Spotify Audio Analysis / Audio Features API** | Historically returned bars/beats/tatums/sections with confidence scores, BPM/key/energy/danceability. | Was the gold standard — **now dead**. Spotify killed `audio-features`, `audio-analysis`, `recommendations`, `related-artists`, and `featured-playlists` on **November 27, 2024**. New apps get 403 immediately; only pre-existing quota-extension apps retain access. No official replacement. | Confirmed dead via Spotify developer community threads. Do not build on this. |
| **Cyanite.ai** | Mood/energy/genre/instrument tagging, BPM classifier (60–180 BPM range), per-15-second-segment mood/energy tags. | **No beat-grid timestamps** — 15-second-bucket tagging only. | Confirmed via Cyanite's own API docs. €290/month base fee. |
| **Musiio (by SoundCloud)** | Tagging API: BPM, key, genre, mood, instruments from an uploaded file or YouTube link. Sample repo: https://github.com/Musiio-AI/tagging-sample | BPM as a single value, not a beat-time array. | Confirmed via GitHub org + blog. Pricing enterprise-gated. |
| **AudioShake** | Enterprise stem separation + audio classification for broadcasters. | Not a beat-timing API. | Pricing not fully public. |
| **Bridge.audio** | AI auto-tagging (genre/mood/vocals/instrumentation/themes) via a musicologist-curated taxonomy, webhook delivery. | No — tagging/metadata, not beat-grid timing. | Confirmed feature set, no pricing found. |
| **GetSongBPM / SongData.io** | Lookup against a database of known commercial songs — single BPM (sometimes key). | Single value only, and only for tracks already catalogued — useless for original/licensed Direkta soundtrack material. | Confirmed via their own API docs. |
| **AcousticBrainz** | Was a free, open BPM/key/MFCC/mood database. | **Discontinued** — MetaBrainz shut down the live API on 2022-02-16. Dataset downloadable as a static archive only, not a live API. | Confirmed via MetaBrainz's own announcement. |

**Verdict:** No hosted API can replace local signal analysis for frame-accurate
beat-matching. Every option either returns bucket-level tags instead of a beat array
(Cyanite, Musiio, Bridge.audio), only works for catalogued commercial songs (GetSongBPM),
or is dead (Spotify, AcousticBrainz).

---

## 6. RECOMMENDATION — the concrete path for Direkta

**Build a custom `music-analysis` skill. No existing skill, MCP, or hosted API is
sufficient as-is.**

### Why build, not adopt

- Direkta is Next.js 15 / React 19 with no Python runtime, and already works around
  Vercel's ephemeral filesystem (commit `db4b29d`). Heavy native-dependency Python
  (madmom/NATTEN/PyTorch) has no place inside a Vercel serverless function — package size
  limits and cold-start costs rule it out as an inline API route.
- The one real MCP option (`hugohow/mcp-music-analysis`) only wraps librosa, so it
  inherits librosa's core gap: no downbeats, no structural sections — and downbeats are
  exactly what the Higgsfield-audio skill's "cuts land on the downbeat" rule needs.
- The existing pipeline (`direkta-scripting-test/agents/*.md`) already runs as **Claude
  Code agent rule files invoked outside the deployed app** (Screenplay → Cinematographer →
  Higgsfield Operator, per `direkta-scripting-test/docs/pipeline.md`). A Python-CLI-backed
  skill fits this pattern: an authoring-time tool the agent shells out to once per
  uploaded track, not a per-request Vercel endpoint.

### Runtime split

- **Authoring-time** (where the analysis actually happens): a Python CLI script, invoked
  via Bash by the Claude Code skill, run once per uploaded track, output cached to
  `analysis/<track-id>.json`. This is where the heavy-but-accurate libraries belong —
  librosa + beat_this for tempo/beats/downbeats/energy; allin1 (with a Foote-novelty
  fallback, §4.2) for sections, now a mandatory pipeline stage, not optional; demucs for
  stem separation feeding both onset classification (§4.1) and vocal-stem lyric alignment
  (§4.3).
- **Production runtime** (only if/when the Next.js app itself needs to react to audio
  client-side, e.g. a live waveform preview): `essentia.js` (WASM, `npm i essentia.js`,
  runs in Node/browser, no Python) for tempo/beat/energy — but it is **AGPL-3.0**, a real
  licensing question for a commercial product. Either secure a commercial license from
  MTG/UPF or keep it isolated behind a boundary that doesn't trigger AGPL's network-copyleft
  clause. Cheaper npm-only fallbacks for tempo-only estimates: `realtime-bpm-analyzer`
  (TypeScript, zero-dep, ±1–2 BPM accuracy on steady-beat tracks) or `music-tempo`.

### Library choice for the CLI script

`librosa` (tempo, beat times, RMS energy, onset detection — trivial install, ISC license) +
`beat_this` (`pip install beat-this`, MIT, actively maintained, gives accurate
**downbeats** without madmom's install pain) as the core dependency set. Add `allin1` as
the default sections provider (§4.2 — mandatory, not optional; falls back to Foote-novelty
segmentation over the RMS curve if the PyTorch+NATTEN+madmom install fails at runtime), and
`demucs` for stem separation feeding onset classification (§4.1) and vocal-stem lyric
alignment (§4.3, via MFA or WhisperX). A directly comparable project, **CutClaw**
(https://github.com/GVCLab/CutClaw, 945 stars, active — "agentic video editing via music
synchronization"), validates this exact feature set: it keypoints on
`["downbeat", "pitch", "mel_energy"]` and constrains cut segments to a **3.0–5.0 second**
default range — a good starting number for Direkta's own beat-to-shot-duration mapping.
(CutClaw's public docs don't detail a non-metrical/off-grid hit detector, which is why §4.1
composes one from primitives rather than adopting CutClaw's method directly.) Skip madmom
directly (PyPI stale since Nov 2018, chronic NumPy/Cython ABI breakage) and skip Essentia's
Python build for this path (AGPL, plus no downbeat support anyway — its only edge is
per-beat confidence scores).

### Decode normalization (frame-accuracy prerequisite)

§4's allin1 row already flags an "MP3-decoder timing-offset quirk — WAV recommended," but
the original script sketch didn't act on it: it fed the *original* uploaded file to
`beat_this` while separately having librosa re-decode-and-resample that same original file
to 22050 Hz — two different decode paths off the same source, with no guarantee they agree
on where sample 0 is.

That disagreement is not hypothetical. MP3 encoders prepend priming/padding samples that
different decoders trim differently: the ISO reference filterbank alone introduces a
**528-sample** decoder delay, LAME CBR encoding adds **1105 samples** of encoder delay, and
LAME VBR adds **2257 samples**
([LAME technical FAQ](https://lame.sourceforge.io/tech-FAQ.txt); [gapless-playback history](https://medium.com/vimeo-engineering-blog/a-brief-history-of-gapless-audio-and-what-you-can-do-about-it-ea9e1c343215)).
At 44.1kHz that's **~25ms (CBR)** to **~51ms (VBR)** of possible offset between two
decoders that don't agree on trim — before any detector has even run. 51ms is already
larger than one frame at every fps Direkta targets (24fps = 41.7ms, 25fps = 40ms, 30fps =
33.3ms). A decoder-timebase mismatch this size can silently invalidate the fixed
`cut_offset_frames` correction.

**Fix: decode once, feed every detector the identical file.**

```bash
ffmpeg -y -i "$INPUT" -ac 1 -ar 44100 -sample_fmt s16 -map_metadata -1 "$NORMALIZED_WAV"
```

- Mono, 44.1kHz, 16-bit PCM WAV. 44.1kHz matches the sample rate most source music is
  mastered/delivered at, avoiding an extra resample; librosa is told to load at this same
  rate (`sr=44100`, not the previous `sr=22050`) so its frame-to-time math and beat_this's
  frame-to-time math are computed on the same sample grid.
- `-map_metadata -1` strips ID3/LAME headers that could otherwise re-trigger
  format-specific trim heuristics downstream.
- Every subsequent stage — librosa, `beat_this`, `demucs`, `allin1` — reads
  `$NORMALIZED_WAV`, never the original upload. The original path is retained in the output
  JSON's `source_file` field for provenance only.
- This single ffmpeg decode is also where a corrupt/undecodable upload fails fast, before
  any of the four downstream libraries attempt (and possibly silently mis-handle) it.

### Analysis script sketch

```python
#!/usr/bin/env python3
"""music_analysis.py — Direkta music-analysis skill core script.
Usage: python music_analysis.py <audio_path> [--lyrics lyrics.txt] [--fps 24] [-o output.json]
Deps:     pip install librosa beat-this soundfile numpy    (ffmpeg on PATH)
Sections: pip install allin1 (+ torch, natten, madmom) — falls back to Foote-novelty
          segmentation over librosa's own RMS curve if allin1 fails to import or run.
Onsets:   pip install demucs                             — falls back to downbeat-only
          onsets (onset_detection_mode="downbeat_only") if demucs fails.
Lyrics:   --lyrics <text file> + montreal-forced-aligner, OR pip install whisperx as a
          fallback ASR+align path when no lyric text is supplied. Omitted entirely
          (lyric_alignment_mode="none") if neither is available.
"""
import sys, json, argparse, subprocess, tempfile
import librosa
import numpy as np
from beat_this.inference import File2Beats, File2Frames

FPS_DEFAULT = 24

def normalize_audio(path: str, sr: int = 44100) -> str:
    """Decode once to mono/44.1kHz/16-bit WAV; every downstream tool reads this file,
    never the original upload (see §6 'Decode normalization')."""
    out_path = tempfile.mktemp(suffix=".wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", path, "-ac", "1", "-ar", str(sr),
         "-sample_fmt", "s16", "-map_metadata", "-1", out_path],
        check=True, capture_output=True,
    )
    return out_path

def compute_tempo_stability(intervals: np.ndarray) -> tuple[str, float]:
    """IQR of beat-to-beat intervals, normalized by the median interval. Thresholds are
    an engineering choice, not a published standard — literature only establishes that
    rubato/tempo-variable tracks show 2.5-5.3x the inter-beat-interval variability of
    metronomic tracks (arXiv:2605.12287), which motivates using a ratio-based cut rather
    than an absolute-ms one."""
    if len(intervals) < 4:
        return "stable", 1.0
    q75, q25 = np.percentile(intervals, [75, 25])
    iqr_ratio = (q75 - q25) / np.median(intervals)
    if iqr_ratio < 0.03:
        label = "stable"
    elif iqr_ratio < 0.10:
        label = "drifting"
    else:
        label = "rubato"
    return label, float(iqr_ratio)

def compute_bpm_confidence(bpm_from_beats: float, y: np.ndarray, sr: int) -> float:
    """Cross-method agreement: beat_this's median-beat-interval tempo vs. librosa's
    independent autocorrelation/tempogram estimate. Two different algorithms landing on
    the same number is a stronger confidence signal than either one's internal score."""
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    bpm_librosa = float(librosa.feature.tempo(onset_envelope=onset_env, sr=sr)[0])
    agreement = 1.0 - abs(bpm_from_beats - bpm_librosa) / max(bpm_from_beats, 1e-6)
    return round(max(0.0, min(1.0, agreement)), 3)

def infer_time_signature(beats: list[float], downbeats: list[float]) -> list[int]:
    """beats_per_bar = median count of beats between consecutive downbeats. Beat unit is
    assumed to be the quarter note (true for the overwhelming majority of pop/trailer
    source material per movie-anime-trailer.md §3); no evaluated tool detects the beat
    unit itself, so this is a documented assumption, not a measurement."""
    if len(downbeats) < 2:
        return [4, 4]
    counts = []
    for i in range(len(downbeats) - 1):
        n = sum(1 for b in beats if downbeats[i] <= b < downbeats[i + 1])
        counts.append(n)
    return [int(np.median(counts)), 4]

def build_beats_array(beats, downbeats, beats_per_bar, beat_logits, frame_hz):
    """index = sequential position; position_in_bar cycles 1..beats_per_bar between
    downbeats (derived purely from the downbeat array, no separate meter detector);
    confidence = beat_this's own framewise sigmoid activation sampled at each beat's
    frame (File2Frames exposes beat_logits/downbeat_logits — this is the 'beat_this
    posterior' referenced in the schema's field notes)."""
    downbeat_set = set(round(d, 3) for d in downbeats)
    out, bar_pos = [], 1
    for i, t in enumerate(beats):
        is_db = round(t, 3) in downbeat_set
        bar_pos = 1 if is_db else (bar_pos % beats_per_bar) + 1
        frame_idx = min(int(t * frame_hz), len(beat_logits) - 1)
        conf = float(1 / (1 + np.exp(-beat_logits[frame_idx])))  # sigmoid
        out.append({"t": round(t, 3), "index": i + 1, "position_in_bar": bar_pos,
                     "is_downbeat": is_db, "confidence": round(conf, 3)})
    return out

def get_sections(path: str, rms_norm, rms_raw, energy_times, downbeats) -> tuple[list[dict], str]:
    """Primary: allin1 (labeled). Fallback: Foote novelty segmentation over the RMS curve
    already computed for energy_curve (unlabeled). See §4.2. `bars` = count of `downbeats`
    falling inside [start, end) — counting real downbeats rather than dividing by an
    assumed-constant bar duration keeps this correct under tempo drift."""
    def _pack(label, start, end):
        in_range = [(e, r) for e, r in zip(energy_times, rms_norm) if start <= e < end]
        energy = float(np.mean([r for _, r in in_range])) if in_range else 0.0
        rms_mean = float(np.mean([r for e, r in zip(energy_times, rms_raw) if start <= e < end]) or 0.0)
        bars = sum(1 for d in downbeats if start <= d < end)
        lo, hi = energy_to_shot_sec(energy)
        return {"label": label, "start": start, "end": end, "bars": bars,
                "energy": round(energy, 3), "rms_mean": round(rms_mean, 4),
                "instrumentation": [], "target_avg_shot_sec": [lo, hi]}

    try:
        import allin1
        struct = allin1.analyze(path)
        sections = [_pack(s.label, s.start, s.end) for s in struct.segments]
        return sections, "auto"
    except Exception:
        # Foote-novelty fallback: self-similarity + checkerboard-kernel novelty over the
        # RMS curve, peak-picked into unlabeled boundaries.
        boundaries = foote_novelty_boundaries(rms_norm, energy_times)  # -> list[(start,end)]
        sections = [_pack(f"segment_{i+1}", s, e) for i, (s, e) in enumerate(boundaries)]
        return sections, "unlabeled"

def energy_to_shot_sec(energy: float) -> tuple[float, float]:
    """Linear interpolation between the anchor points amv-music-video.md §6.2 and
    movie-anime-trailer.md already publish: energy 0.3 -> 4-6s shots, energy 0.9 ->
    0.5-1.5s shots. Clamped outside [0.3, 0.9]; extreme hyper-cut cases (documented
    ASL ~0.3s) are a manual agent override, not this formula's default output."""
    e0, lo0, hi0 = 0.3, 4.0, 6.0
    e1, lo1, hi1 = 0.9, 0.5, 1.5
    e = min(max(energy, e0), e1)
    t = (e - e0) / (e1 - e0)
    return (round(lo0 + t * (lo1 - lo0), 2), round(hi0 + t * (hi1 - hi0), 2))

def classify_drum_onsets(path: str, y_full, sr, beats, onset_detection_mode: list) -> list[dict]:
    """§4.1: demucs drum-stem separation + band-energy classification, plus riser and
    non-metrical (off-grid) hit detection. Mutates onset_detection_mode[0] to
    'downbeat_only' on failure instead of raising, so the caller degrades gracefully."""
    try:
        import demucs.separate  # noqa: heavy import, isolated in this try block
        drums, other = separate_stems(path)  # -> (drums_stem_array, other_stem_array)
    except Exception:
        onset_detection_mode[0] = "downbeat_only"
        return []

    onsets = []
    onset_frames = librosa.onset.onset_detect(y=drums, sr=sr, backtrack=True, units="time")
    for t in onset_frames:
        band = classify_band_energy(drums, sr, t)  # -> "kick" | "snare" | "hihat" | "drum_other"
        weight = {"kick": 1.0, "snare": 0.6, "hihat": 0.2, "drum_other": 0.2}[band]
        onsets.append({"t": round(float(t), 3), "type": band, "weight": weight})

    onsets += detect_riser_payoffs(y_full, sr)                 # weight 1.0, non_metrical
    onsets += detect_non_metrical_hits(other, sr, beats)        # weight 1.0, non_metrical
    return onsets

def analyze(path: str, lyrics_path: str | None, fps: int) -> dict:
    wav_path = normalize_audio(path)                     # identical decode for every tool
    y, sr = librosa.load(wav_path, sr=44100, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    f2b = File2Beats(checkpoint_path="final0", device="cpu")
    beats, downbeats = f2b(wav_path)
    beats, downbeats = [float(b) for b in beats], [float(d) for d in downbeats]
    intervals = np.diff(beats)
    bpm = float(60.0 / np.median(intervals)) if len(intervals) else 0.0

    f2f = File2Frames(checkpoint_path="final0", device="cpu")
    beat_logits, _downbeat_logits, frame_hz = f2f(wav_path)   # per-frame posterior
    tempo_stability, _iqr_ratio = compute_tempo_stability(intervals)
    bpm_confidence = compute_bpm_confidence(bpm, y, sr)
    time_signature = infer_time_signature(beats, downbeats)
    beats_per_bar = time_signature[0]
    beats_array = build_beats_array(beats, downbeats, beats_per_bar, beat_logits, frame_hz)

    hop = int(sr * 0.5)
    rms_raw = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]
    rms_norm = ((rms_raw - rms_raw.min()) / (rms_raw.max() - rms_raw.min() + 1e-9))
    energy_times = librosa.frames_to_time(np.arange(len(rms_raw)), sr=sr, hop_length=hop)

    sections, section_labels_mode = get_sections(wav_path, rms_norm, rms_raw, energy_times, downbeats)

    onset_mode = ["full"]
    onsets = classify_drum_onsets(wav_path, y, sr, beats, onset_mode)
    onsets += [{"t": d, "type": "downbeat", "weight": 1.0} for d in downbeats]
    if onset_mode[0] == "downbeat_only":
        onsets = [{"t": d, "type": "downbeat", "weight": 1.0} for d in downbeats]

    lyric_mode = "none"
    if onset_mode[0] != "downbeat_only":  # needs the vocal stem separated above
        hook = get_lyric_hook_onset(wav_path, sections, lyrics_path)
        if hook is not None:
            onsets.append(hook)
            lyric_mode = "forced_alignment" if lyrics_path else "asr_alignment"

    return {
        "track_id": None,  # filled by the caller/skill wrapper
        "source_file": path,           # original upload path, provenance only
        "sample_rate": sr,
        "duration_sec": round(duration, 3),
        "global_bpm": round(bpm, 2),
        "bpm_confidence": bpm_confidence,
        "tempo_stability": tempo_stability,
        "time_signature": time_signature,
        "beats": beats_array,
        "downbeats": [round(d, 3) for d in downbeats],
        "sections": sections,
        "section_labels": section_labels_mode,           # "auto" | "unlabeled"
        "onsets": sorted(onsets, key=lambda o: o["t"]),
        "onset_detection_mode": onset_mode[0],            # "full" | "downbeat_only"
        "lyric_alignment_mode": lyric_mode,                # "forced_alignment" | "asr_alignment" | "none"
        "cut_offset_frames": -2,   # per-project default; see §6 "Frame-accuracy budget"
        "fps": fps,
    }

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("audio_path")
    ap.add_argument("--lyrics", default=None)
    ap.add_argument("--fps", type=int, default=FPS_DEFAULT)
    ap.add_argument("-o", "--output")
    args = ap.parse_args()
    data = analyze(args.audio_path, args.lyrics, args.fps)
    out = json.dumps(data, indent=2)
    if args.output:
        open(args.output, "w").write(out)
    else:
        print(out)
```

`separate_stems`, `classify_band_energy`, `detect_riser_payoffs`, `detect_non_metrical_hits`,
`foote_novelty_boundaries`, and `get_lyric_hook_onset` are left as named stubs above — their
algorithms are specified in §4.1–§4.3, not reproduced twice. This is a design sketch showing
where every contract field comes from, not a drop-in-ready module.

### The exact beat-map JSON schema the AMV/Trailer agents consume

This is the contract. `direkta-modules/agents/amv-music-video.md` and
`direkta-modules/agents/movie-anime-trailer.md` should both read this shape and nothing
else — the analysis script is free to change internally as long as this contract holds.

```json
{
  "track_id": "string",
  "source_file": "string",
  "sample_rate": 44100,
  "duration_sec": 187.42,
  "global_bpm": 128.0,
  "bpm_confidence": 0.93,
  "tempo_stability": "stable | drifting | rubato",
  "time_signature": [4, 4],
  "beats": [
    { "t": 0.469, "index": 1, "position_in_bar": 1, "is_downbeat": true, "confidence": 0.97 },
    { "t": 0.938, "index": 2, "position_in_bar": 2, "is_downbeat": false, "confidence": 0.95 }
  ],
  "downbeats": [0.469, 2.344, 4.219],
  "sections": [
    {
      "label": "intro",
      "start": 0.0,
      "end": 14.06,
      "bars": 8,
      "energy": 0.22,
      "rms_mean": 0.08,
      "instrumentation": ["synth_pad", "kick_sparse"],
      "target_avg_shot_sec": [4.0, 6.0]
    },
    {
      "label": "chorus",
      "start": 46.9,
      "end": 65.6,
      "bars": 8,
      "energy": 0.91,
      "rms_mean": 0.34,
      "instrumentation": ["full_mix", "vocal_hook"],
      "target_avg_shot_sec": [0.5, 1.2]
    }
  ],
  "section_labels": "auto | unlabeled",
  "onsets": [
    { "t": 46.9, "type": "downbeat", "weight": 1.0 },
    { "t": 47.37, "type": "snare", "weight": 0.6 },
    { "t": 47.58, "type": "hihat", "weight": 0.2 },
    { "t": 45.1, "type": "riser_payoff", "weight": 1.0, "non_metrical": true },
    { "t": 46.9, "type": "lyric_hook_onset", "word": "run", "weight": 0.85 }
  ],
  "onset_detection_mode": "full | downbeat_only",
  "lyric_alignment_mode": "forced_alignment | asr_alignment | none",
  "cut_offset_frames": -2,
  "fps": 24
}
```

Field notes — computation rule for every field the critic flagged as unspecified:

- `bpm_confidence` — cross-method agreement between two independent tempo estimates:
  `beat_this`'s median-beat-interval tempo and librosa's autocorrelation/tempogram tempo
  (`librosa.feature.tempo`), as `1 - |bpm_a - bpm_b| / bpm_a` clamped to `[0, 1]`. Two
  differently-built detectors landing on the same number is a stronger signal than either
  detector's internal score alone.
- `tempo_stability` — IQR of inter-beat intervals normalized by the median interval
  (`(Q75 - Q25) / median`, computed over `np.diff(beats)`): `< 0.03` → `"stable"`,
  `0.03–0.10` → `"drifting"`, `> 0.10` → `"rubato"`. A ratio-based cut, not an absolute-ms
  one, because published tempo-variability research only establishes rubato tracks show
  **2.5–5.3× the inter-beat-interval variability** of metronomic tracks, not an absolute
  bound ([arXiv:2605.12287](https://arxiv.org/html/2605.12287v1)) — the thresholds above are
  Direkta's own engineering choice built on that ratio, not a cited industry standard.
- `time_signature` — `beats_per_bar` = median count of `beats[]` falling strictly between
  each consecutive pair of `downbeats[]`; the beat unit is assumed to be the quarter note
  (true for the overwhelming majority of the pop/trailer source material both consuming
  modules target — `movie-anime-trailer.md` §3) since no evaluated tool detects the beat
  unit itself. `time_signature` is therefore `[beats_per_bar, 4]`, a documented assumption
  for irregular meters, not a measurement.
- `beats[].index` — sequential position, 1-based, `enumerate(beats)`.
- `beats[].position_in_bar` — derived purely from the `downbeats[]` array: resets to `1` on
  every downbeat, increments (mod `beats_per_bar`) on every subsequent beat until the next
  downbeat. No separate meter-tracking model needed once downbeats and `beats_per_bar` exist.
- `beats[].confidence` / `bpm_confidence` — `beats[].confidence` is `beat_this`'s own
  framewise sigmoid activation (`File2Frames` exposes `beat_logits`/`downbeat_logits`
  before the postprocessor collapses them to discrete timestamps) sampled at each detected
  beat's frame — this is the literal "beat_this posterior" this doc already referenced
  without defining. `bpm_confidence` is the separate cross-method formula above. Low values
  on either should widen the cut-list's timing tolerance or trigger manual-marker review
  (§7 "Confidence-gating").
- `sections[].bars` — count of `downbeats[]` timestamps falling inside `[start, end)`.
  Counting real downbeats (not dividing section duration by an assumed constant bar length)
  keeps this correct under tempo drift.
- `sections[].energy` — mean of the same min-max-normalized RMS curve used for
  `energy_curve`, restricted to `[start, end)`. Track-relative (0–1 within this track), so
  it is directly usable by the `target_avg_shot_sec` formula below without a second
  normalization pass.
- `sections[].rms_mean` — mean of the **raw, non-normalized** RMS values (`librosa.feature.rms`,
  `RMS = sqrt(mean(amplitude² over frame))`, [Unison Audio](https://unison.audio/what-is-rms-in-audio/))
  in the same window — an absolute loudness reference for cross-track comparison, distinct
  from the track-relative `energy` field.
- `sections[].instrumentation` — demucs stem names (`vocals`/`drums`/`bass`/`other`, or the
  6-stem `htdemucs_6s` bucket `vocals`/`drums`/`bass`/`guitar`/`piano`/`other`) whose RMS
  energy within the section clears a presence threshold (e.g. ≥ 20% of the section's total
  stem RMS). No evaluated tool produces finer descriptive tags like `"synth_pad"` — treat
  those in the worked example above as illustrative of what a human editor might annotate
  later, not automated output.
- `sections[].target_avg_shot_sec` — linear interpolation between the energy→pace anchor
  points `amv-music-video.md` §6.2 and `movie-anime-trailer.md` already publish
  (`energy 0.3 → 4–6s`, `energy 0.9 → 0.5–1.5s`), clamped outside `[0.3, 0.9]`. Both bounds
  (lo/hi) are interpolated independently along the same `t = (energy − 0.3) / 0.6` fraction.
- `onsets[].type` (`kick`/`snare`/`hihat`/`drum_other`/`riser_payoff`/`sound_design_hit`/
  `lyric_hook_onset`/`downbeat`) and the degraded-mode flags `onset_detection_mode` /
  `lyric_alignment_mode` — derivation and fallback behaviour specified in §4.1 and §4.3.
  Consuming agents must branch on these flags before trusting the accent hierarchy in §7.
- `onsets[].weight` implements the accent hierarchy from §7 numerically (downbeat 1.0 >
  riser/hit 1.0 non-metrical > lyric hook ~0.85 > snare 0.6 > hi-hat 0.2) so cut-list logic
  ranks candidates instead of treating every hit as equal.
- `cut_offset_frames: -2` is a **per-project default, not a fixed constant** — see "Frame-
  accuracy budget" below for when this correction is dominated by detector error rather than
  perceptual latency, and should be widened or set to `0`.

### Frame-accuracy budget

Requirement #7 (§1) calls the artifact "frame-accurate." That claim needs a number, because
the detectors this doc adopts are not evaluated against frame accuracy at all — they're
evaluated against the field's own coarser standard. MIREX beat/downbeat tracking tasks score
detections with the **Dixon (2007) F-measure**: a beat counts as correct if it falls within a
**±70ms tolerance window** of the ground-truth annotation
([MIREX Audio Beat Tracking](https://www.music-ir.org/mirex/wiki/2019:Audio_Beat_Tracking);
[evaluation walkthrough](https://tempobeatdownbeat.github.io/tutorial/ch2_basics/evaluate.html)).
Even `beat_this` — the best-in-class detector this doc recommends — reports F-measures of
**88.9% (GTZAN)** and **96.8% (Ballroom)** ([arXiv:2407.21658](https://arxiv.org/pdf/2407.21658))
*using that same ±70ms window as the pass/fail bar*, not a tighter one. Converted to frames:

| fps | 1 frame | ±70ms in frames |
|---|---|---|
| 24 | 41.7ms | ≈ 1.68 frames |
| 25 | 40.0ms | ≈ 1.75 frames |
| 30 | 33.3ms | ≈ 2.10 frames |

So a beat this doc's own recommended detector counts as "correctly detected" can still be
**1.7–2.1 frames off** at Direkta's target frame rates — before decode normalization (§6
"Decode normalization") is even applied. The fixed `cut_offset_frames: -2` in the original
schema is *smaller* than this error band, which means it cannot be reliably distinguishing
"perceptual early-cut correction" from "the detector was just wrong." Two consequences:

1. **`cut_offset_frames` must be a per-project tunable**, not a hardcoded constant — expose
   it as a skill parameter with `-2` as the default starting point, and let a project raise
   or lower it after a human reviews a handful of cuts against the actual audio.
2. **Guidance on which error dominates:** when `bpm_confidence` and the relevant
   `beats[].confidence` are both high (§7 "Confidence-gating" threshold, ~0.6+) *and*
   `tempo_stability` is `"stable"`, the residual error is closer to genuine perceptual
   early-cut latency and `cut_offset_frames` behaves as designed. When confidence is low or
   `tempo_stability` is `"drifting"`/`"rubato"`, detector error (the ±70ms/1.7–2.1-frame
   band above) is the larger term, and the agent should widen its cut-timing tolerance
   (§7's existing confidence-gating rule) rather than trust a fixed frame offset to fully
   correct it.

This shape is intentionally close in spirit to rhythm-game timing-point formats (osu!'s
`.osu` file format stores `time, beatLength, meter` triplets — https://osu.ppy.sh/wiki/en/Client/File_formats/osu_(file_format))
but flattened and pre-resolved, so the AMV/Trailer agents never have to do meter math
themselves.

---

## 7. How the agents use the beat map (cut-list generation logic)

This is the logic `amv-music-video.md` and `movie-anime-trailer.md` should encode when
mapping a shotlist onto the beat map produced in §6.

**Accent hierarchy** (which hits deserve a cut, highest weight first): downbeat kick
(1.0) > non-metrical hit/riser payoff (1.0, trailer-mode override) > lyric hook onset
(~0.85) > snare backbeat (0.6) > hi-hat/subdivision (0.2, effect-sync only, never a full
cut) > sustained tonal material (never a cut point — held pads, bass notes, vocal
sustain are cut *through*, not cut *to*).

**Cut-list generation steps:**

1. **Budget cuts per section, not per beat.**
   `n_cuts(section) = round(section.duration_sec / avg(section.target_avg_shot_sec))`.
   High-energy sections (chorus, drop) get many cuts; low-energy sections (intro, verse)
   get few, by construction. This mirrors the reported real-world pattern: chart-topping
   music videos average ~3.5s clips in choruses vs. ~5–6s in verses. `sections[]` is always
   present (§4.2/§6 make it mandatory), but check `section_labels` first — in `"unlabeled"`
   mode (Foote-novelty fallback), narrative rules keyed on a specific label (e.g. "put the
   wow-shot on Chorus 1") don't apply; only the energy-driven budget and hold logic (steps
   1 and 6) still work.
2. **Rank candidate sync points inside the section** from `onsets[]`, sorted by `weight`
   descending, restricted first to `is_downbeat=true` or `weight ≥ 0.6`. Only spill into
   hi-hat/subdivision onsets if the cut budget exceeds the count of high-weight candidates
   — the bar-cuts-vs-beat-cuts escalation rule: bar-length cuts (every 4 beats) for
   verses/builds, collapsing to beat/half-beat cuts only at choruses/drops/payoffs. If
   `onset_detection_mode = "downbeat_only"` (§4.1 degraded path), the only candidates
   available are downbeats — skip straight to bar-grid cutting for the whole track rather
   than attempting the escalation rule with no snare/hihat/riser data to escalate into.
3. **Select the top-N candidates** (N = budget from step 1), enforcing a minimum spacing
   of `≥ 1 beat` (`60 / bpm` seconds) so selected cuts don't cluster unnaturally.
4. **Assign shots from the shotlist to the selected timestamps** in narrative order:
   reveal/hero shots → downbeat and `riser_payoff`/`non_metrical` hits; dialogue/action
   beats → `lyric_hook_onset` timestamps; connective/B-roll shots → remaining downbeats. If
   `lyric_alignment_mode = "none"` (§4.3 — no lyrics supplied and no ASR available), there
   are no `lyric_hook_onset` candidates; reassign those dialogue/action slots to downbeats
   instead of leaving them unfilled.
5. **Apply `cut_offset_frames`** to every selected timestamp before writing the final
   edit-decision-list, quantized to the nearest frame at the target `fps` — the
   1–3-frame early-cut correction from §6, applied once globally, not hand-tuned per cut.
6. **Insert deliberate holds.** Where `energy` drops sharply from the previous section
   (a bridge/breakdown), cut the step-1 budget by ~50% and prefer motion-sync (shot held,
   in-frame motion resolves on the beat) over cut-sync — a well-placed hold makes the next
   cut land harder by contrast, and cutting on every detected beat reads as frantic.
7. **Trailer-mode override.** A `non_metrical` onset with `weight = 1.0` (sound-design
   hit/stinger) near a title-card or hero-reveal shot always wins that slot regardless of
   the beat grid — trailer hits sit above the standard drum-accent hierarchy. This step is
   a no-op when `onset_detection_mode = "downbeat_only"`, since `non_metrical` onsets are
   exactly what that degraded mode fails to produce (§4.1) — the trailer module should
   treat the override as unavailable, not silently skip it without surfacing that the track
   is running in a degraded analysis mode.
8. **AMV-specific note:** for montage/opening sequences, extract the song's build→drop
   arc (pre-chorus into chorus, or verse-climax into bridge) as the primary working window
   rather than defaulting to the intro — intros are reliably the rhythmically weakest
   material and produce a weak opening cut rhythm if used as the anchor.

**Confidence-gating:** if `bpm_confidence` or a given `beats[].confidence` is low (e.g.
below ~0.6), the agent should widen the cut-timing tolerance rather than snapping tightly,
and should flag the track for manual marker review rather than silently trusting a
possibly wrong beat grid — this mirrors the real accuracy ceiling of automated beat
trackers (state-of-the-art systems reach roughly 86–94% Accuracy2 on standard MIR
benchmarks, so a fully blind trust model will occasionally be wrong).

---

## 8. Sources

**Claude Skills** — https://github.com/anthropics/skills · https://mcpmarket.com/tools/skills/music-analysis-audio-insights · https://mcpmarket.com/tools/skills/music-analysis-audio-intelligence (unverified, 429 on fetch) · https://loooom.xyz/s/mager/how-to-identify-parts-of-a-song · https://www.mager.co/blog/2026-03-26-loooom-identify-song-parts/ · https://github.com/bitwize-music-studio/claude-ai-music-skills · https://github.com/KVNKEVINN/claude-music-studio · https://github.com/browser-use/video-use/blob/main/SKILL.md · https://github.com/keithwalsky-ship-it/UGC-ai-prompt-skill/blob/main/skills/higgsfield-audio/SKILL.md

**MCP servers** — https://github.com/hugohow/mcp-music-analysis · https://market.lobehub.com/s/plugins/vbarreiratt-fantasticearmcp (unverified, 403 on fetch) · https://github.com/JohnBreault/xlights-mcp-server · https://github.com/gorums/music-mcp-server · https://github.com/williamzujkowski/live-coding-music-mcp

**Python libraries** — https://librosa.org/doc/0.11.0/generated/librosa.beat.beat_track.html · https://deepwiki.com/librosa/librosa/5.2-beat-tracking-and-tempo-estimation · http://librosa.org/doc/0.11.0/auto_examples/plot_dynamic_beat.html · https://madmom.readthedocs.io/en/v0.16/modules/features/downbeats.html · https://arxiv.org/abs/1605.07008 (Böck et al. 2016) · https://github.com/CPJKU/madmom/discussions/536 · https://github.com/GVCLab/CutClaw · https://github.com/mjhydri/BeatNet · https://aubio.org/manual/latest/cli.html · https://github.com/aubio/aubio/issues/106 · https://essentia.upf.edu/algorithms_reference.html · https://deepwiki.com/MTG/essentia/5.4-rhythm-and-beat-analysis · https://essentia.upf.edu/licensing_information.html · https://github.com/CPJKU/beat_this · https://arxiv.org/pdf/2407.21658 (Beat This! ISMIR 2024 paper) · https://raw.githubusercontent.com/CPJKU/beat_this/main/beat_this/inference.py

**Hosted APIs** — https://github.com/Musiio-AI/tagging-sample · Spotify audio-features/audio-analysis deprecation (Nov 27 2024, Spotify developer community) · AcousticBrainz shutdown (Feb 16 2022, MetaBrainz announcement)

**Onset classification, section fallback, lyric alignment, decode normalization (§4.1–§4.3, §6)** — https://librosa.org/doc/main/generated/librosa.onset.onset_detect.html · https://www.soundsandwords.io/drum-sound-classification/ · https://github.com/cukas/drumsep · https://arxiv.org/pdf/2209.10016 (drum transcription classifier features) · https://www.mathworks.com/help/audio/ug/spectral-descriptors.html (spectral flux) · https://www.audiolabs-erlangen.de/resources/MIR/FMP/C4/C4S4_NoveltySegmentation.html (Foote novelty worked example) · https://arxiv.org/html/2606.18466v1 (forced-aligner accuracy comparison, MFA boundary error) · https://github.com/m-bain/whisperX/issues/1247 (WhisperX vs MFA timestamp discrepancy) · https://ar5iv.labs.arxiv.org/html/2303.00747 (WhisperX paper, 200ms collar evaluation) · https://arxiv.org/html/2505.15646 (NeMo Forced Aligner timestamp error) · https://lame.sourceforge.io/tech-FAQ.txt (MP3 encoder delay/priming samples) · https://medium.com/vimeo-engineering-blog/a-brief-history-of-gapless-audio-and-what-you-can-do-about-it-ea9e1c343215 · https://arxiv.org/html/2605.12287v1 (inter-beat-interval variability, rubato) · https://tempobeatdownbeat.github.io/tutorial/ch2_basics/evaluate.html (MIREX F-measure ±70ms definition)

**Beat-sync craft / editing theory** — https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide · https://clipmusic.ai/blog/bpm-video-editing-guide · https://aescripts.com/beatedit-for-premiere-pro/ · https://jayaretv.com/edit/davinci-resolve-ai-beat-detector-explained/ · https://pulseedit.com/blog/auto-place-beat-markers-davinci-resolve.html · https://www.researchgate.net/publication/3863771_Automatic_audio_segmentation_using_a_measure_of_audio_novelty · https://transactions.ismir.net/articles/10.5334/tismir.167 · https://arxiv.org/pdf/2103.14253 · https://transactions.ismir.net/articles/10.5334/tismir.43 · https://www.music-ir.org/mirex/wiki/2019:Audio_Beat_Tracking · https://unison.audio/what-is-rms-in-audio/ · https://vashivisuals.com/music-video-editing-stats/ · https://www.filmmakersacademy.com/glossary/average-shot-length-asl/ · https://www.musicradar.com/how-to/song-sections-explained-intro-verse-chorus-middle8-outro-tag-bridge · https://theproaudiofiles.com/phrasing/ · https://www.djingtips.com/how-to-dj/track-structure/ · https://nofilmschool.com/how-to-edit-trailer-music · https://www.derek-lieu.com/blog/2018/1/6/what-im-thinking-when-i-edit-a-trailer · https://mysticalankar.com/blogs/blog/hi-hat-and-snare-patterns-a-guide-for-beatmakers · https://audiblegenius.com/blog/the-roles-of-the-kick-snare-and-hi-hat-in-a-drum-pattern · https://www.whippedcreamsounds.com/what-are-transients-in-music-why-are-they-important-explained/ · https://osu.ppy.sh/wiki/en/Client/File_formats/osu_(file_format)

**Direkta internal** — `direkta-modules/agents/amv-music-video.md` · `direkta-modules/agents/movie-anime-trailer.md` · `direkta-scripting-test/agents/{screenplay,cinematographer,higgsfield}-agent.md` · `direkta-scripting-test/docs/pipeline.md` · commit `db4b29d` ("Vercel: write DB and OSS to /tmp on Vercel runtime")
