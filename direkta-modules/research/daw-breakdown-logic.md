# DAW Breakdown — Track → Logic Pro Architecture

> Research consolidated 2026-08-09 from four dossiers (stem separation, audio→MIDI/chords,
> Logic Pro interchange, hosted APIs & all-in-one pipelines). This document is the design
> authority for extending `direkta-modules/skills/music-analysis/` from a beat-map producer
> into a **Logic Import Kit** producer. Every claim below traces to §8.
>
> **Status: architecture, not shipped.** Nothing in §4 exists in the repo yet. What exists
> today is `music_analysis.py` (1,369 lines, schema 1.0.0) — see §2.0.

---

## 1 · Goal & constraints

**Goal.** Given one audio file, emit a folder that a human drags into Logic Pro and gets a
session that is *actually recreatable*: the tempo map matches, bars line up, sections are
named markers, each instrument is its own audio track, and where we can transcribe it, its
own MIDI region on a software instrument.

### The recreatable-in-Logic bar (the acceptance test)

A kit passes if, after the documented import steps and **zero manual retiming**:

1. Logic's tempo shows our `resolved_bpm` and every detected tempo change (114.84 on the
   test track), and the playhead at bar 9 lands on our downbeat #9 within one frame.
2. Every stem sits at 0:00 absolute and stays phase-locked to the others (they are all
   derived from the same decode, so sample-identical lengths — see §3).
3. The Marker track is populated with our `sections[].label` at `sections[].start`.
4. Bars are bars: `time_signature` from the beat map is in the Signature track, even
   though Logic only uses it for the click (§3).
5. MIDI regions, where present, are on separate instrument tracks named for their stem.

Explicitly **not** in the bar: plugin state, automation curves, mixer levels, track colors.
No public tool writes those into Logic safely (§3, daw2logic coverage table), and pretending
otherwise is how you ship a session that opens with a repair prompt.

### Constraints

- **Apple Silicon, local-first.** The host is an M-series Mac with a Python venv and ffmpeg.
  Anything that needs CUDA, or that a dossier flagged as ARM-incompatible (`omnizart`, §2),
  is out. Anything that only runs on someone else's server is a fallback, never the spine.
- **Claude-analyzable outputs.** Every stage writes JSON alongside its binary artifact. The
  AMV / trailer / future remix agents read JSON; they never open a `.wav` or parse a `.mid`.
  This is the same contract the existing skill already enforces (SKILL.md §5, "The script is
  the only source of beat data. Downstream agents read the JSON and nothing else.").
- **License-clean for a commercial product.** The skill's `requirements.txt` already records
  an `essentia` AGPL-3.0 rejection. That standard applies to every new dependency: no AGPL,
  no CC-BY-NC weights, no unlicensed research repos (§7).
- **Always produce something.** The existing degrade-with-a-warning ladder is the house
  style. A kit with stems and a tempo map but no MIDI is a valid kit; a crash is not.

---

## 2 · What already exists

### 2.0 · Ours (the baseline being extended)

`direkta-modules/skills/music-analysis/music_analysis.py` — 1,369 lines, core deps
`librosa`/`soundfile`/`numpy` only, everything heavier imported lazily behind a
degrade-and-warn ladder. Already emits: `resolved_bpm`, `beats[]`, `downbeats[]`,
`sections[]` (Foote novelty), `energy_curve[]`, `troughs[]`, weighted `onsets[]`
(kick/snare/hihat/riser/off-grid), `frame_accuracy{}`, `provenance{}`, `warnings[]`.
Verified on `test/dracula-jennie-remix.m4a` (209.58 s, 3.49 min): BPM 114.84,
`bpm_confidence` 1.0, `tempo_stability` "stable", 385 beats, 97 downbeats, 5 sections,
586 onsets. `separate_stems()` already shells `demucs.api.Separator(model="htdemucs")`.

Two facts that shape everything below: `downbeat_source` is `"estimated"` and
`section_source` is `"foote_novelty"` with `section_labels: "unlabeled"` on both test
tracks — i.e. the optional ladder (`beat-this`, `allin1`) is not installed on this host yet.
A marker track built today would say `segment_1…segment_5`, not `verse/chorus`.

### 2.1 · Stem separators

| Tool | License / activity | Apple Silicon | Verdict |
|---|---|---|---|
| **`audio-separator` (nomadkaraoke)** 1,307★, v0.44.5 | MIT, pushed 2026-07-20 | **Yes — ONNX models via `CoreMLExecutionProvider`** | ✅ **Adopt.** One pip package, superset of the UVR/MDX/Roformer/Demucs zoo. Only tool here with a real M-series acceleration path. |
| **SCNet-XL** (via above) | model checkpoint | via ONNX | ✅ Best joint 4-stem: bass 11.87 / drums 11.49 / vocals 9.32 / other 6.19 SDR (MUSDB18HQ) |
| **MelBand-Roformer "Kim"** / BS-Roformer "viperx" | model checkpoint | via ONNX | ✅ Best vocal isolation: 10.98 / 10.87 SDR — beats SCNet on vocals specifically |
| **`adefossez/demucs`** 3,005★ | MIT, pushed 2026-07-11 | **CPU-only in practice** — MPS breaks on complex-tensor ops; README quotes ~1.5× realtime on CPU | 🟡 Keep only for `htdemucs_6s`; invoke *through* `audio-separator` |
| `htdemucs_6s` | model checkpoint | CPU path | 🟡 Only real public 6-stem model (+piano/guitar). Quality is the industry-wide weak link — flag, don't apologise |
| **`facebookresearch/demucs`** 10,358★ | MIT, **ARCHIVED 2025-01-01** | — | 🔴 Dead URL. Our `separate_stems()` currently targets this lineage — repoint it |
| **UVR GUI (Anjok07)** 25,703★ | MIT, last push 2025-03-13, 1,505 open issues | arm64 build exists | 🔴 GUI-only, no CLI/API. Its model zoo *is* `audio-separator` |
| **BandIt / BandIt-v2** | Apache-2.0, stale ~1yr | — | 🔴 Separates speech/music/effects for film mixes. Wrong problem |
| **`demucs-mlx` (ssmall256)** 32★ | MIT, pushed 2026-06-14 | native MLX, claims ~73× realtime | 👀 **Watch, don't adopt.** 32 stars, one maintainer, no PyPI |
| **MSST (ZFTurbo)** 1,480★ | MIT, pushed 2026-07-27 | — | 🟡 Training framework, not pip-installable. Needed only if we fine-tune |
| **Logic's own Stem Splitter** (11.0+) | Apple, built-in | Apple Silicon only | ℹ️ 6 stems, free, in the DAW. Don't rebuild it for end users (§5) |

### 2.2 · Transcription (audio → MIDI)

| Tool | License | Apple Silicon | Verdict |
|---|---|---|---|
| **`basic-pitch` (Spotify)** 5,388★ | **Apache-2.0**, pushed 2025-11-13 | **Yes — CoreML is the default macOS runtime.** README: *"For Mac M1 hardware, we currently only support python version 3.10"* | ✅ **Adopt for pitched stems.** README also: *"works best on one instrument at a time"* — which is exactly why we go stems-first |
| **`torchcrepe`** 523★ | MIT, pushed 2025-05-16 | `device='mps'` *should* work (plain PyTorch); **unconfirmed by maintainers** — set `PYTORCH_ENABLE_MPS_FALLBACK=1`, verify empirically | ✅ Adopt as a Phase-3 pitch-curve refiner, not an onset source |
| **`marl/crepe`** 1,410★ | MIT | TF runtime | 🟡 Fallback only — adds a second ML runtime |
| **NeuralNote** 2,866★ | Apache-2.0 | AU/VST3 macOS Universal | ✅ **Adopt as the human-in-the-loop step**, not a pipeline stage. Same basic-pitch model, running *inside Logic* on an imported stem |
| **MuScriptor** 1,010★ | code MIT, **weights CC-BY-NC-4.0** | **native MPS, float16, `pip install muscriptor`** | 🔴 **Blocked.** Best engineering fit in the survey; NC weights kill it for a commercial product. Re-check if licensing changes |
| **YourMT3+** 243★ | **GPL-3.0** | untested | 🔴 Only tool that natively benchmarks drums (ENST-Drums), but copyleft + no clean pip path |
| **MT3 (Magenta)** 1,736★ | Apache-2.0 | JAX/TPU-era | 🔴 No usable inference path outside a research stack |
| **`omnizart`** 1,954★ | MIT, active | 🔴 README verbatim: *"incompatible for ARM-based MacOS"* | 🔴 Hard-blocked on our only host |
| **ADTLib** 209★ | *"Free for non-commercial use"*, depends on madmom, last release 2018 | — | 🔴 Dead and NC |
| **madmom** (notes/onsets/downbeats/key models) | code BSD, **bundled models CC-BY-NC-SA-4.0** via `package_data` | — | 🔴 Already rejected in our `requirements.txt` on staleness grounds; the NC weights are the harder blocker |
| **ADTOF** 95★ | `NOASSERTION` | — | 🟡 Dataset + reference CRNN, not a package |
| **Our own drum heuristic** (`classify_band_energy`, `detect_drum_onsets`) | ours | native | ✅ **The drum path today.** No license risk, already shipping, already classifies kick/snare/hihat/drum_other |

**The drum-transcription conclusion, stated plainly:** there is no clean,
commercially-licensed, Apple-Silicon-native drum transcription model in this survey.
Extend our own classifier (add toms/cymbals as a 5th/6th class) rather than adopt any of
the above.

### 2.3 · Chords & key

| Tool | License | Verdict |
|---|---|---|
| **CREMA (`bmcfee/crema`)** 97★ | **ISC** (`setup.cfg` is authoritative over GitHub's BSD-2 badge) | ✅ Primary. CRNN, outputs JAMS. **Caveat: pins `tensorflow>=2.0`, `keras>=2.6` — predates the Keras 3 API break. Verify it imports on macOS arm64 before adopting; may need a `tf_keras` shim** |
| **chroma + 24 triad templates** (in-house, librosa) | ours | ✅ Zero-dep fallback so chords are never a hard failure |
| **Krumhansl–Schmuckler key** (in-house, ~30 lines on the chroma we already compute) | ours | ✅ The key answer. No new dependency, no license |
| **`autochord`** 162★ | Apache-2.0, **last push 2023-04-09** | 🟡 README: *"macOS requires workarounds"*. 3 years stale on a TF/vamp stack |
| **`chord-extractor` / Chordino** 245★ | **GPL-2.0**, Linux-x86_64 binary only | 🔴 Copyleft + no confirmed arm64 macOS Vamp binary |
| **madmom `CNNChordRecognition`** | NC models | 🔴 Blocked |
| **`essentia`** | AGPL-3.0 | 🔴 Already rejected in-repo |
| **Logic Chord ID** (12.0+, improved 12.3) | Apple, built-in | ℹ️ Drag an audio region onto the Chord Track and Logic transcribes harmony itself (§5) |

### 2.4 · Logic bridge options

| Mechanism | What crosses | Verdict |
|---|---|---|
| **SMF Type 1 via `File > Open`** | **Everything**: track names, tempo changes, marker names+positions, copyright | ✅ **The chosen mechanism (§3)**. Apple-documented, stable, zero new deps |
| SMF via `File > Import > MIDI File` (or drag) | **Region data only** — notes, CC, SysEx, pitchbend. Tempo, signature, chords, track names, SMPTE start **explicitly ignored** | 🔴 The trap. Never document this path |
| **Stem audio + Smart Tempo** `Set imported audio files to: On + Align Bars and Beats` | audio conformed to Logic's tempo map | ✅ Adopt as the stem-import instruction |
| **`.logicx` synthesis** — `jonkubis/LogicProFormatWriter` | tempo events (`uint32 = BPM×10000`, 960 PPQ), meter map, markers, MIDI regions, multi-track audio regions, ALAC/CAF packing. 92 KB byte-level `PROJECTDATA_FORMAT.md`, reverse-engineered against **Logic Pro 11.2.2** | 👀 **Highest ceiling, highest risk. Spike, don't commit.** **0★, 0 forks, MIT, created 2026-06-04**, ~3 substantive commits, single author, not on PyPI. Author's own caveat: a future Logic release could change the format. Also: the downstream project cites it at a `geoffmyers/` URL that **404s** — verify provenance |
| **`audiohacking/daw2logic`** (DAWproject → `.logicx`) | Their coverage table is the best public ground truth: tempo/meter/markers/MIDI notes/audio regions/track order/mixer vol-pan = **native**; plugins/EQ/automation/colors = **sidecar JSON, manual re-apply**; *"native ProjectData graft disabled (corrupts Logic)"* for colors | 👀 2★, MIT, only release v0.0.1 (2026-06-06). Prebuilt macOS arm64 CLI + browser WASM |
| **DAWproject** (`bitwig/dawproject`) 1,012★ MIT + `dawproject-py` 66★ MIT | open IR: tempo, time sigs, audio/note/automation, plugin state | 🟡 Attractive as an internal IR *if* we go the `.logicx` route — gives a fallback that opens in Bitwig/Studio One/Cubase. **Logic has no native DAWproject support** |
| **AAF** | audio regions + volume automation. **Confirmed: does NOT carry the tempo map** (Pro Tools lands at flat 120 BPM); no MIDI | 🔴 Rejected as a tempo/marker vehicle |
| **FCPXML** | **MIDI tracks ignored outright**, software instruments always bounced to audio | 🔴 Wrong workflow entirely |
| **AppleScript / Shortcuts / Automator** | — | 🔴 **None exist.** Logic's dictionary exposes only a top-level app object with `renderpreview`. No Shortcuts actions, no Automator actions. Scripter is a per-channel MIDI-FX JS plugin, not a project API |
| **`pretty_midi`** 1,035★ MIT | tempo map via `_tick_scales` (multi-change, not just `initial_tempo`), `time_signature_changes`, `key_signature_changes`, `lyrics`, one track per `Instrument` → genuine Type 1 SMF | ✅ The authoring layer — **except markers** |
| **`mido`** 1,631★ MIT | `MetaSpec_marker` at `type_byte = 0x06` — real first-class marker meta-events | ✅ The marker post-pass. **`pretty_midi` has no `Marker` class at all** (confirmed by reading `containers.py`); its `text_events` write as `text` (0x01), which Logic's Marker track does not read |
| **`partitura`** 370★ Apache-2.0 | score↔performance alignment, MusicXML/MEI/Humdrum | 🔴 Overkill; built for musicology, not SMF writing |

### 2.5 · Hosted APIs & all-in-one products

| Product | Price | Covers | Verdict |
|---|---|---|---|
| **Klangio** (klang.io) | Free 50 req/mo (15 s clips) → $99 → $499 → custom | **The most breakdown-complete single vendor**: transcription→MIDI/MusicXML/PDF/GP5, separation, beat tracking (BPM/meter/downbeats), **chords with timing**, strum direction | 🟡 **Paid fallback / benchmark only.** Worth a trial against our 114.84 BPM output. Accepts commercial input; has a rights-holder retraction channel |
| **Music.ai** | stems $0.07/min ea, beats $0.03/min, chords $0.04/min, lyrics $0.17/min | modular workflows | 🟡 Cheap per-minute, but **ToS prohibits using Output to train AI/ML models** without written authorization, and it runs **Audible Magic Content-ID** against uploads. JSON timing granularity is undocumented — needs a live call to confirm |
| **AudioShake** | from $20/mo | separation + transcript alignment, REST server-to-server | 🟡 Separation-first. No MIDI/chords. Liability sits with the uploader |
| **LALAL.ai** | $15–19.99/mo | up to 10 stem types ("Andromeda"), batch 100 files, markets stem→MIDI | 🟡 Separation-first; MIDI claim not in a formal spec |
| **Moises** | Pro $9.99/mo | **No general REST API** — only a JS "Extension API" running inside the Moises web app | 🔴 Not a headless breakdown API |
| **Songscription** | API is Enterprise-tier only, unpriced | 9 instruments → MIDI/MusicXML/PDF/GP | 🔴 Unevaluable without a sales call |
| **RipX DAW / DAW PRO** | $99 / $198 one-time | 6+ stems, note-level "Rip" editing, exports WAV/MIDI, ARA2 in PRO | 🔴 **No API, no batch, no scripting.** GUI-only |
| **Samplab** | — | audio→MIDI plugin, chord detection | 🔴 **SHUTTING DOWN — final date 2026-09-17.** Do not integrate |
| **`mir-aidj/all-in-one`** 818★ MIT | tempo/beats/downbeats + **labeled** functional segments (intro/verse/chorus/bridge/outro) in one pass | 🟡 **The single best upgrade to our `section_labels: "unlabeled"` problem** — but pulls madmom (NC models) + NATTEN (compiled ext). Dormant since 2024-05-09. Already the `allin1` rung of our ladder |
| **`Aud2Stm2Mdi` / `StemToMidi`** 10★ / 0★ | **GPL-2.0**, 30 MB file cap, single-file, CPU-only | 🔴 Demo harnesses. Good *architecture* reference (separator-agnostic + AMT-agnostic), not code to adopt |
| **`ZZWaang/audio2midi`** 55★ | **no license file = all rights reserved**, dormant 4+ yrs | 🔴 Hard legal blocker |

**Buy-vs-build verdict: build.** No open pipeline matches the spec; no hosted vendor
produces a Logic session. Every API and desktop tool in the survey stops at "here are your
stems and maybe a MIDI file" — the Logic-import layer is bespoke work no matter who does the
analysis, which is exactly the argument for keeping the analysis in-house too.

---

## 3 · The Logic Pro bridge — the chosen mechanism

**Chosen: a Type 1 Standard MIDI File opened via `File > Open`, plus per-stem WAVs dragged
in with Smart Tempo set to "On + Align Bars and Beats".** Not `.logicx`. Not AAF. Not
FCPXML. Not automation of any kind.

### Why this and not `.logicx`

`.logicx` would give a literal double-click experience with zero manual steps, and as of
mid-2026 it is *demonstrably* synthesizable — `LogicProFormatWriter` ships byte-level docs
and a working `logicx exportbeatmap` CLI. But it is a 0-star, ~2-month-old, single-author
reverse-engineering pinned to Logic Pro 11.2.2's binary layout, with a broken provenance
link in its only downstream consumer, and **Logic Pro 12 shipped 2026-01-28 (12.3 in June)**.
Betting Direkta's DAW story on an unvetted binary format that Apple has never documented and
can silently change in a point release is not a Phase-1 decision. It is a Phase-4 spike
(§6) with a concrete gate: write a kit, open it in the Logic version Direkta actually
targets, confirm no repair prompt.

### What Logic imports, exactly

| Path | What comes in |
|---|---|
| `File > Open` (creates a **new project** from the SMF) | **Everything**: track names, tempo changes, marker names + positions, copyright text. **This is the only path that brings global data in.** |
| `File > Import > MIDI File`, or dragging into the Tracks area | **Region data only.** Tempo events, signature, chords, track names and SMPTE start are **explicitly ignored.** |

Two more documented facts that constrain the exporter:

- **Type 0 and Type 1 are both supported, and neither encodes region splits.** Apple:
  *"Neither format recognizes any division of a track into several regions."* If our
  exporter cuts a track into multiple MIDI regions, Logic presents one continuous region per
  track anyway. **Merge before writing.**
- **The Signature track only affects click-track playback.** Time-signature meta-events are
  read on Open, but they do not retime MIDI or audio region playback. Correct bars are a
  visual/metronome win, not a timing mechanism.

### What our export must contain

1. **One Type 1 SMF**, `kit.mid`, containing:
   - a conductor track (track 0) with the full **tempo map** — one `set_tempo` per detected
     change, not just an initial BPM — plus `time_signature` and `key_signature` events;
   - real **`marker` (0x06) meta-events** at every `sections[].start`, carrying
     `sections[].label`;
   - one named track per transcribed stem (drums on channel 9), notes merged into a single
     continuous span per track.
2. **One WAV per stem**, all cut from the same normalized decode so they are
   sample-identical in length and phase-locked when stacked at 0:00.
3. **A JSON manifest** describing every file, so the agent layer never has to open a binary.
4. **A `README.txt` in the kit** with the import steps, because step 1 is a footgun.

### The exact drag-in workflow (what the human does)

1. `File > Open` → select `kit.mid`. **Not** `File > Import`. Logic creates a new project
   carrying the tempo map, signature and markers.
2. `File > Project Settings > Smart Tempo` → set **"Set imported audio files to: On + Align
   Bars and Beats"**.
3. Drag the entire `stems/` folder into the Tracks area at bar 1 / 00:00:00:00. Each stem
   becomes its own audio track, conformed to the project tempo map rather than dictating
   its own.
4. Optional: drag any stem onto the **Chord Track** and let Logic's native **Chord ID**
   (12.0+, improved 12.3) transcribe harmony — then Session Players (Drummer / Bass /
   Keyboard / Synth) follow it for free.
5. Optional: insert **NeuralNote** (AU, Apache-2.0, free) on a stem to re-transcribe a
   passage our CLI got wrong; the MIDI lands directly in Logic's piano roll.

### What CANNOT be automated, and why

**There is no programmatic control surface for Logic Pro. At all.** Logic exposes no
AppleScript scripting dictionary beyond a trivial `renderpreview` method, no Shortcuts
actions, and no bundled Automator actions. Scripter is a JavaScript MIDI-FX plugin that
transforms MIDI live inside a channel strip — it cannot drive session assembly. The only
remaining "automation" options are MMC transport, CC→Key-Command mappings, and
accessibility-API macro tools like SoundFlow — none of which are an API.

**Consequence:** any drag-in-and-it-lines-up pipeline must work entirely at the file level.
Steps 1–3 above are irreducibly manual until and unless the `.logicx` spike lands. We
document them; we do not pretend to remove them.

### The marker caveat (verify before shipping)

Apple's own guide documents that SMF import reads *"names and positions of markers"*. But a
Gearspace thread titled *"Logic will import Standard Midi File but NOT the markers"* reports
Logic dropping conductor-track markers, and a logicprohelp.com thread converges on exactly
the `File > Open` (not `Import`) workaround adopted above. **All three of those pages 403'd
on direct fetch during research — the synthesis is from search snippets, not a primary
read.** Phase 1's first test is therefore a 3-marker SMF opened in the target Logic version
with the Marker track confirmed populated (§6). Treat `File > Open` as the strongest lead,
not a certainty.

---

## 4 · Recommended architecture — the "Logic Import Kit" pipeline

Extends `music_analysis.py` rather than replacing it. New CLI surface:

```bash
python3 music_analysis.py <audio> --logic-kit [--kit-dir DIR] [--stems 4|6] \
                          [--transcribe] [--chords] [--fps 30]
```

Without `--logic-kit` the script behaves exactly as it does today. Every new stage follows
the existing house rule: lazily imported, degrade with a `warnings[]` entry and a
`*_source` provenance flip, never crash.

### Stage list

| # | Stage | Tool | In → Out | Status |
|---|---|---|---|---|
| 0 | **Normalize** | `ffmpeg` → mono/44.1k/s16 WAV | audio → `norm.wav` | ✅ exists (`normalize_audio()`) |
| 1 | **Beat map** | librosa + `beat-this` + `allin1` | `norm.wav` → beats/downbeats/sections/onsets/energy | ✅ exists (`analyze()`) |
| 2 | **Stems** | `audio-separator` — Roformer vocals pass, then SCNet-XL on the instrumental; `htdemucs_6s` when `--stems 6` | `norm.wav` → `stems/*.wav` | 🔨 new (replaces `separate_stems()`) |
| 3 | **Per-stem MIDI** | `basic-pitch` on pitched stems; our own onset classifier on drums | `stems/*.wav` → note events | 🔨 new |
| 4 | **Chords + key** | CREMA (primary) → chroma-triad fallback; Krumhansl–Schmuckler for key | `norm.wav` → `chords.json` | 🔨 new |
| 5 | **SMF write** | `pretty_midi` (notes/tempo map/time sig/tracks) → `mido` post-pass (0x06 markers) | all of the above → `kit.mid` | 🔨 new |
| 6 | **Kit layout** | stdlib | → folder + `manifest.json` + `README.txt` | 🔨 new |

### Exact tooling, install commands, model downloads

```bash
# Stage 2 — stems. One package, superset of the UVR/MDX/Roformer/Demucs zoo.
pip install "audio-separator[cpu]"
audio-separator --env_info    # MUST print: CoreMLExecutionProvider available
# Models download on first run (multi-GB). Pre-warm them:
audio-separator norm.wav -m melband_roformer_kim.ckpt   # vocals
audio-separator norm.wav -m scnet_xl.ckpt               # bass/drums/other
audio-separator norm.wav -m htdemucs_6s.yaml            # only for --stems 6

# Stage 3 — pitched-stem transcription. PIN PYTHON 3.10 on M-series.
python3.10 -m venv .venv-bp && .venv-bp/bin/pip install basic-pitch
# CoreML is the default macOS runtime; no manual selection needed.

# Stage 4 — chords (validate the Keras pin BEFORE adopting)
pip install crema
python -c "import crema; crema.analyze"   # if this ImportErrors on Keras 3, use tf_keras shim

# Stage 5 — SMF
pip install pretty_midi mido

# Stage 3b (Phase 3, optional) — pitch-curve refinement
pip install torchcrepe
export PYTORCH_ENABLE_MPS_FALLBACK=1     # MPS support is unconfirmed by maintainers
```

**Version pinning note.** `basic-pitch`'s README caps M1 support at Python 3.10 while the
rest of the skill runs on the host's default interpreter. Run basic-pitch out of its own
venv via `subprocess` rather than forcing the whole skill down to 3.10 — this also keeps its
TF/CoreML runtime out of the core import graph, consistent with the existing lazy-import
rule.

### Expected runtime on M-series, ~3.5-min track

Calibrated against `test/dracula-jennie-remix.m4a` — **209.58 s (3.49 min)**, the exact
reference length.

| Stage | Estimate | Basis |
|---|---|---|
| 0 Normalize | < 2 s | ffmpeg decode, measured today (`decode_normalized: true`) |
| 1 Beat map | ~10–20 s | current librosa path on this host, 385 beats / 586 onsets emitted |
| 2 Stems (4, ONNX/CoreML) | **~1–3 min** | **No published seconds-per-song CoreML benchmark exists for `audio-separator` — checked, none in README/docs. Benchmark ourselves; do not ship this number as fact.** |
| 2′ Stems (`htdemucs_6s`) | **~5+ min** | Demucs's PyTorch path is CPU-only on Mac; README quotes ~1.5× realtime *per model pass*, and 6s is the slow model. Also unbenchmarked through `audio-separator` |
| 3 basic-pitch, per pitched stem | ~10–30 s each | small CoreML model, one instrument at a time |
| 4 CREMA chords | ~20–60 s | TF CRNN on CPU |
| 5 SMF write | < 1 s | pure Python |
| **Total, 4-stem + transcription** | **~3–6 min** | dominated entirely by stage 2 |

Every one of these is an **estimate to be replaced by a measured number** in the Phase-1
test (§6). Disk: budget multi-GB for model weights on first run, plus ~4× the source
duration in stem WAVs (4 stems × 44.1k/16-bit).

### Kit folder layout

```
<track-id>-logic-kit/
├── README.txt                 # the §3 import steps, verbatim, in the kit
├── kit.mid                    # Type 1 SMF: tempo map + time sig + key + 0x06 markers + MIDI tracks
├── manifest.json              # THE agent-facing index (see §5)
├── stems/
│   ├── 01_drums.wav           # numbered = Logic track order on drag-in
│   ├── 02_bass.wav
│   ├── 03_vocals.wav
│   └── 04_other.wav
├── midi/
│   ├── drums.mid              # per-stem SMFs, for selective import
│   ├── bass.mid
│   └── vocals.mid
└── analysis/
    ├── beatmap.json           # existing schema 1.0.0, unchanged
    ├── chords.json            # {time, end, chord, confidence}[] + key
    └── notes/<stem>.csv       # basic-pitch --save-note-events, for agent reasoning
```

`stems/` filenames are numbered because Logic orders dragged-in files alphabetically — the
prefix is the only control we have over track order.

---

## 5 · What the Claude agent layer does with the kit

`manifest.json` is the contract. Agents read it and the three files in `analysis/`; they
never open a WAV or parse a MIDI file. This mirrors the existing hard rule in the AMV agent:
*"NO BEAT MAP, NO WORK"* and *"trust the named upstream artifacts, never re-derive."*

**AMV / music-video agent** (`agents/amv-music-video-agent.md`). Already consumes
`beats[]`, `downbeats[]`, `sections[]`, `onsets[]`, `troughs[]`. The kit adds two things it
cannot get today:

- **`sections[].instrumentation` becomes real.** Today it is `[]` on both test tracks
  because `demucs` isn't installed and `onset_source` is `full_mix`. With stems, a section
  that is "vocal + bass, no drums" is a fact, and the agent can key a look change on the
  drums re-entering rather than on an energy delta.
- **Onset reliability jumps.** `classify_band_energy()` is explicitly documented as a
  heuristic that *"will misclassify 808 kicks with a click, trap hats, and bleed-heavy live
  kits"*. Running it on an isolated SCNet drum stem instead of the full mix removes most of
  that failure mode, which directly raises the trustworthiness of the `weight ≥ 0.6`
  ranking the agent uses to pick cut points.

**Trailer agent** (`agents/trailer-agent.md`). Risers and stingers are the structural spine.
`detect_riser_payoffs()` currently runs on the full mix; with an isolated `other` stem the
riser envelope is far less contaminated by vocals and drums. Chord data adds a genuinely new
capability: a minor→major turn or a suspended-chord hold is a *named* tension event the beat
sheet can hang a title card on.

**Future remix / recreate agent** (does not exist yet — this kit is its enabling
precondition). It would consume all three JSONs together and emit a **recreation plan**, not
audio: "bass is a single-note ostinato on the root, 8ths, root motion i–VI–III–VII (from
`chords.json`); drums are a four-on-floor kick with an offbeat hat (from `notes/drums.csv`);
Logic recipe — Session Player 'Bass Player' following the Chord Track, Drummer with the hat
density at 60%." That plan is text a human executes in Logic, which is the correct division
of labour: **we do analysis and structure, Logic's own AI does performance.**

**Design rule that follows from §2.4/§2.5: do not rebuild what Logic 12 already has.**
Stem Splitter is 6-way and free in the DAW; Chord ID transcribes harmony natively;
Session Players perform from the Chord Track. Our value is the *tempo map, the marker-named
structure, the beat-accurate onset list, and the JSON an agent can reason over* — none of
which Logic produces. Ship a kit that Apple's own AI can then chew on.

---

## 6 · Build plan

Test track for every phase: **`direkta-modules/test/dracula-reel-31s.m4a`** — 31.324 s,
already analyzed (`test/analysis/dracula-reel-31s.json`): BPM 114.84, `bpm_confidence` 1.0,
`tempo_stability` "stable", 59 beats, 14 downbeats, 2 sections, 122 onsets,
`frames_per_beat` 15.674 @ 30 fps, `decode_normalized: true`. Short enough to iterate in
seconds, and every number is already pinned so a regression is unambiguous. Scale-out
validation uses `dracula-jennie-remix.m4a` (209.58 s) once a phase passes on the clip.

### Phase 0 — The marker spike (half a day, blocking)

Before any pipeline code. Write a 3-marker, 1-tempo-change SMF by hand with
`pretty_midi` + `mido`, open it in the Logic version Direkta targets **via `File > Open`**,
and confirm the Marker track populates and the tempo reads back.

**Test criteria:** markers visible and correctly positioned; tempo = 114.84; the same file
via `File > Import > MIDI` demonstrably loses them (proving the doc's warning is real).
**If `File > Open` also drops markers, this whole architecture pivots to the `.logicx`
spike in Phase 4 and Phase 1 ships without markers.** Record the result in `SKILL.md`.

### Phase 1 — Minimal kit: stems + tempo-map SMF + markers

**Deliverables:** `--logic-kit` flag; stage 2 rewritten onto `audio-separator` (4-stem:
Roformer vocals → SCNet-XL instrumental); `kit.mid` with tempo map, time signature, key, and
0x06 markers from `sections[]`; the kit folder layout; `manifest.json`; `README.txt`;
`SKILL.md` §3 install ladder updated; `requirements.txt` gains an `audio-separator` rung and
a "NOT ADOPTED" entry for `facebookresearch/demucs` (archived), UVR GUI, AAF and FCPXML.

**Test criteria** (all on the 31 s clip):
1. `audio-separator --env_info` prints `CoreMLExecutionProvider` on this host.
2. Four stems written, all exactly 31.324 s, sample-identical lengths.
3. `kit.mid` opens in Logic via `File > Open`; project tempo reads 114.84; markers
   `segment_1` @ 0.000 and `segment_2` @ 4.168 appear in the Marker track.
4. Stems dragged in with Smart Tempo "On + Align Bars and Beats" sit at 0:00 and stay
   phase-locked; downbeat #9 lands within one frame of the beat map.
5. **Measured** stage-2 wall-clock recorded for both the 31 s clip and the 209 s track,
   replacing the §4 estimates.
6. Uninstalling `audio-separator` degrades to the current full-mix path with a warning, not
   a crash.

**Note the honest limitation to write into the kit README:** markers will read
`segment_1…segment_N`, not `verse`/`chorus`, until `allin1` is installed
(`section_labels: "unlabeled"`, `section_source: "foote_novelty"` on both test tracks today).

### Phase 2 — Transcription

**Deliverables:** drum MIDI built from our existing classified onsets (kick→GM 36,
snare→38, hi-hat→42, `drum_other`→41) written to channel 9; `basic-pitch` in its own
Python 3.10 venv, invoked per pitched stem via subprocess; `midi/<stem>.mid` per stem plus
merged tracks in `kit.mid`; `notes/<stem>.csv` from `--save-note-events`;
`NeuralNote` documented in `SKILL.md` as the sanctioned manual-fix step.

**Test criteria:**
1. `basic-pitch` runs on the bass stem under Python 3.10 on this host and emits notes.
2. Drum MIDI note count matches the count of `onsets[]` entries of type kick/snare/hihat
   in the existing JSON (122 total onsets on the clip) — an exact, checkable invariant.
3. `kit.mid` remains Type 1 with one named track per stem, drums on channel 9, notes merged
   into one continuous region per track (per Apple's "no region division" rule).
4. Opening in Logic assigns each MIDI track to a software instrument with no repair prompt.
5. Basic-pitch's bass output and NeuralNote's in-Logic output on the same stem agree on
   ≥80% of note onsets — the cheap cross-check, since they share a model.

### Phase 3 — Chords, key, refinements

**Deliverables:** CREMA integration behind a Keras-compat probe with a chroma+triad
fallback; in-house Krumhansl–Schmuckler key detection on the chroma already computed;
`chords.json`; chord names written to `kit.mid` as text events *and* documented as
"regenerate with Logic Chord ID for best results"; `torchcrepe` pitch-curve refinement on
monophonic vocal/bass passages; drum classifier extended with toms/cymbals classes.

**Test criteria:**
1. CREMA imports and runs on macOS arm64, **or** the fallback fires with a warning and
   `chords.json` is still valid — never a hard failure.
2. Detected key on the clip is musically plausible and consistent between the 31 s clip and
   the parent 209 s track (same source material, same key).
3. `torchcrepe` with `device='mps'` either works or falls back to CPU cleanly with
   `PYTORCH_ENABLE_MPS_FALLBACK=1` — **record which, since maintainers have not confirmed
   MPS.**
4. Chord timeline boundaries land on downbeats more often than not (sanity check against
   the 14 downbeats already in the clip's JSON).

### Phase 4 — `.logicx` spike (timeboxed, non-blocking)

1–2 days against `jonkubis/LogicProFormatWriter` using our own Phase-1 kit as input. **Gate:
does the generated `.logicx` open in the Logic version Direkta targets — not 11.2.2 — with
no repair prompt, correct tempo, correct markers, correct audio region placement?** If yes,
ship it as an *additional* artifact beside the SMF kit, never as a replacement (dual
delivery: if the reverse-engineered writer breaks on a Logic point release, the SMF path
still works). If no, close it and revisit when the project has community validation.

---

## 7 · Risks & licenses

**Copyleft / non-commercial blockers (all avoided by the §4 stack):**

- **AGPL-3.0** — `essentia`. Already rejected in `requirements.txt`; key detection routes
  around it via in-house Krumhansl–Schmuckler.
- **GPL-3.0** — `YourMT3+`. **GPL-2.0** — `chord-extractor`/Chordino, `Aud2Stm2Mdi`.
  GPL CLIs are tolerable as isolated subprocesses, but **do not vendor or import their
  modules** into the skill without legal review.
- **CC-BY-NC-SA-4.0 model weights bundled in a BSD package** — `madmom` ships
  `models/chords`, `models/downbeats`, `models/key`, `models/notes`, `models/onsets` as
  `package_data`. This is the subtle one: the *code* license is clean and the *weights* are
  not. **`allin1` pulls madmom transitively**, so the section-labeling upgrade we want most
  carries an NC dependency — resolve this before shipping labeled markers commercially.
- **CC-BY-NC-4.0 weights** — `MuScriptor` (code MIT, checkpoints gated on HF under NC).
- **No license file at all** — `ZZWaang/audio2midi` (= all rights reserved),
  `awesome-music-informatics`. `ADTOF` is `NOASSERTION`.

**Clean:** `audio-separator`, `pretty_midi`, `mido`, `torchcrepe`, `adefossez/demucs`,
`bitwig/dawproject`, `LogicProFormatWriter`, `daw2logic`, `logic2ableton`, `all-in-one`,
`mir-aidj` — MIT. `basic-pitch`, `NeuralNote`, `partitura`, BandIt — Apache-2.0.
`crema` — ISC. Stem separation as a field is a genuinely clean licensing space.

**Hosted-API ToS on commercial tracks:**

- **Music.ai** — prohibits using Output to train AI/ML models without written
  authorization, and runs **Audible Magic Content-ID** against uploads (Sony/UMG/WMG have
  reserved-rights entries). Content may be deleted at any time without notice and retained
  indefinitely in anonymized form. **Do not route label-owned reference tracks through it.**
- **Klangio** — 30-day retention, accepts commercial input, provides a rights-holder
  retraction channel (`retract@klangio.com`). No AI-training prohibition found.
- **LALAL.ai / AudioShake** — both push the full rights burden onto the uploader via
  indemnification. LALAL.ai states it does not train on uploads.
- **General:** running a label-owned track through *any* hosted API is a data-transfer
  decision, not just a technical one. The local-first architecture in §4 exists partly so
  this question never has to be answered for the default path.

**Operational risks:**

- **Format fragility.** `.logicx` writing is pinned to Logic 11.2.2's binary layout by its
  own author's admission. Logic 12.3 is current. Phase 4 is a spike for this reason.
- **Marker import is unverified.** Three sources agree on `File > Open`, none could be
  fetched directly. Phase 0 exists to settle it.
- **Unbenchmarked runtimes.** No public CoreML seconds-per-song number exists for
  `audio-separator`. Every §4 timing is an estimate until Phase 1 measures it.
- **`htdemucs_6s` is likely CPU-bound** even inside `audio-separator`, because that model
  goes through the PyTorch backend rather than ONNX/CoreML. Unconfirmed either way.
- **Piano/guitar separation quality is the industry-wide weak link.** State this in the kit
  README as a known limitation of the field, not a Direkta bug.
- **Disk/compute.** Multi-GB model weights on first run for every separator; stems roughly
  quadruple per-track storage. `basic-pitch` needs its own Python 3.10 venv on M-series.
- **Dependency staleness watchlist:** `all-in-one` (dormant since 2024-05), `autochord`
  (2023-04), UVR GUI (2025-03 + 1,505 open issues), `crema`'s pre-Keras-3 pins.
- **Samplab shuts down 2026-09-17.** Any integration path through it is dead on arrival.

---

## 8 · Sources

**Stem separation.** [nomadkaraoke/python-audio-separator](https://github.com/nomadkaraoke/python-audio-separator) · [PyPI audio-separator](https://pypi.org/project/audio-separator/) · [adefossez/demucs](https://github.com/adefossez/demucs) · [facebookresearch/demucs (archived)](https://github.com/facebookresearch/demucs) · [ssmall256/demucs-mlx](https://github.com/ssmall256/demucs-mlx) · [Anjok07/ultimatevocalremovergui](https://github.com/Anjok07/ultimatevocalremovergui) · [ZFTurbo/Music-Source-Separation-Training](https://github.com/ZFTurbo/Music-Source-Separation-Training) + [pretrained_models.md](https://github.com/ZFTurbo/Music-Source-Separation-Training/blob/main/docs/pretrained_models.md) · [MVSEP multisong leaderboard](https://mvsep.com/quality_checker/multisong_leaderboard) · [lucidrains/BS-RoFormer](https://github.com/lucidrains/BS-RoFormer) · [kwatcharasupat/bandit-v2](https://github.com/kwatcharasupat/bandit-v2)

**Transcription / chords / melody.** [spotify/basic-pitch](https://github.com/spotify/basic-pitch) · [DamRsn/NeuralNote](https://github.com/DamRsn/NeuralNote) · [muscriptor/muscriptor](https://github.com/muscriptor/muscriptor) · [mimbres/YourMT3](https://github.com/mimbres/YourMT3) · [magenta/mt3](https://github.com/magenta/mt3) · [omnizart](https://github.com/Music-and-Culture-Technology-Lab/omnizart) + [issue #38](https://github.com/Music-and-Culture-Technology-Lab/omnizart/issues/38) · [CarlSouthall/ADTLib](https://github.com/CarlSouthall/ADTLib) · [MZehren/ADTOF](https://github.com/MZehren/ADTOF) · [CPJKU/madmom setup.py `package_data`](https://raw.githubusercontent.com/CPJKU/madmom/main/setup.py) · [bmcfee/crema](https://github.com/bmcfee/crema) · [cjbayron/autochord](https://github.com/cjbayron/autochord) · [ohollo/chord-extractor](https://github.com/ohollo/chord-extractor) · [maxrmorrison/torchcrepe](https://github.com/maxrmorrison/torchcrepe) · [marl/crepe](https://github.com/marl/crepe) · [Krumhansl–Schmuckler gist (bmcfee)](https://gist.github.com/bmcfee/1f66825cef2eb34c839b42dddbad49fd) · [librosa issue #366](https://github.com/librosa/librosa/issues/366)

**MIDI writing.** [craffel/pretty-midi](https://github.com/craffel/pretty-midi) + [pretty_midi.py](https://raw.githubusercontent.com/craffel/pretty-midi/main/pretty_midi/pretty_midi.py) · [mido/mido](https://github.com/mido/mido) + [meta.py (`MetaSpec_marker`, 0x06)](https://raw.githubusercontent.com/mido/mido/main/mido/midifiles/meta.py) · [CPJKU/partitura](https://github.com/CPJKU/partitura)

**Logic Pro.** [Apple — Standard MIDI files](https://support.apple.com/guide/logicpro/standard-midi-files-lgcpdf6a3851/mac) · [Apple — Smart Tempo](https://support.apple.com/en-gb/guide/logicpro/lgcp9281e70c/10.7/mac/11.0) · [Apple — Match tempo automatically](https://support.apple.com/en-us/102165) · [Apple — Time & key signature overview](https://support.apple.com/guide/logicpro/time-and-key-signature-overview-lgcp6409cfb7/mac) · [Apple — AAF export](https://support.apple.com/guide/logicpro/export-a-project-as-an-aaf-file-lgcp7355bedf/mac) · [Apple — Final Cut Pro XML](https://support.apple.com/guide/logicpro/final-cut-pro-xml-files-lgcp9b2d2456/mac) · [Apple — Stem Splitter](https://support.apple.com/guide/logicpro/extract-vocal-instrumental-stems-stem-lgcp61bae908/mac) · [Apple — Session Players](https://support.apple.com/guide/logicpro/session-players-overview-lgcpbf624405/mac) · [Apple — Chords & Session Players](https://support.apple.com/guide/logicpro/chords-and-session-players-lgcp70dd5af3/mac) · [Apple — Scripter](https://support.apple.com/guide/logicpro/use-scripter-lgce728c68f6/mac) · [Apple Developer Forums — no Logic scripting dictionary](https://developer.apple.com/forums/thread/115355) · [logicprohelp — AAF missing tempo changes](https://www.logicprohelp.com/forums/topic/124568-exporting-aaf-missing-tempo-changes/) · [Gearspace — SMF markers not imported](https://gearspace.com/board/apple-logic-pro/1439450-logic-will-import-standard-midi-file-but-not-markers.html) · [logicprohelp — importing markers from a MIDI file](https://www.logicprohelp.com/forums/topic/140300-how-can-i-import-markers-from-a-midi-file/) *(the last three 403'd on direct fetch — verify empirically, see §3)* · [Library of Congress — Logic project format note](https://www.loc.gov/preservation/digital/formats/fdd/fdd000640.shtml)

**`.logicx` / DAWproject.** [jonkubis/LogicProFormatWriter](https://github.com/jonkubis/LogicProFormatWriter) · [audiohacking/daw2logic](https://github.com/audiohacking/daw2logic) + [WASM converter](https://audiohacking.github.io/daw2logic/) · [bitwig/dawproject](https://github.com/bitwig/dawproject) · [roex-audio/dawproject-py](https://github.com/roex-audio/dawproject-py) · [Evilander/logic2ableton](https://github.com/Evilander/logic2ableton) · [WG DAW Converter](https://wg-apps.com/daw/)

**Hosted APIs & products.** [music.ai pricing](https://music.ai/pricing/) · [music.ai API reference](https://music.ai/docs/api/reference/) · [music.ai terms](https://music.ai/terms/) · [AudioShake server-to-server](https://developer.audioshake.ai/legacy-api/server-to-server) · [AudioShake terms](https://www.audioshake.ai/terms) · [LALAL.ai terms](https://www.lalal.ai/terms-and-conditions/) · [klang.io API](https://klang.io/api/) + [api-docs.klang.io](https://api-docs.klang.io/) + [terms](https://klang.io/terms/) · [Moises Extension API](https://extensions.moises.ai/api-reference) · [Moises stems in Logic Pro](https://help.moises.ai/hc/en-us/articles/11229285820316-Using-Moises-Stems-in-Logic-Pro) · [songscription.ai pricing](https://www.songscription.ai/pricing) · [hitnmix.com/ripx-daw](https://hitnmix.com/ripx-daw/) · [samplab.com (shutdown notice)](https://samplab.com/) · [scalermusic.com/products/scaler-3](https://scalermusic.com/products/scaler-3/)

**OSS pipelines.** [mir-aidj/all-in-one](https://github.com/mir-aidj/all-in-one) + [WASPAA 2023 paper](https://arxiv.org/abs/2307.16425) · [ever-oli/Aud2Stm2Mdi](https://github.com/ever-oli/Aud2Stm2Mdi) · [BizaNator/StemToMidi](https://github.com/BizaNator/StemToMidi) · [ZZWaang/audio2midi](https://github.com/ZZWaang/audio2midi) · [yamathcy/awesome-music-informatics](https://github.com/yamathcy/awesome-music-informatics)

**Logic 12 release coverage.** [production-expert — Logic Pro 12](https://www.production-expert.com/production-expert-1/apple-announce-logic-pro-12-pushes-deeper-into-ai-and-appears-to-leaves-intel-macs-behind) · [synthanatomy — Logic Pro 12.3](https://synthanatomy.com/2026/06/apple-logic-pro-12.html) · [logicstudiotraining — Chord ID tutorial](https://logicstudiotraining.com/logic-pro-chord-id-tutorial/) · [Sound on Sound — Stem Splitter](https://www.soundonsound.com/techniques/logic-pro-how-use-stem-splitter)

**In-repo cross-references.** `direkta-modules/skills/music-analysis/music_analysis.py` · `.../SKILL.md` · `.../requirements.txt` (the "NOT ADOPTED" section) · `direkta-modules/research/music-analysis-skill.md` · `direkta-modules/agents/amv-music-video-agent.md` · `direkta-modules/agents/trailer-agent.md` · `direkta-modules/test/analysis/dracula-reel-31s.json` · `direkta-modules/test/analysis/dracula-jennie-remix.json`
