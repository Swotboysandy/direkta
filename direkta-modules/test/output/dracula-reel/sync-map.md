# NOCTURNE — Sync Map
Track `dracula-reel-31s` · runtime 0:31.324 (31.324 s / 15 bars) · resolved_bpm 114.84 (rejected `null`; octave_resolution.reason `no_octave_error_detected`, test `backbeat_period`, action `kept`, off_on_ratio 0.304, alternate_ratio 0.992, beats_per_bar_raw 4) · meter 4/4
fps 30 · frames_per_beat 15.674 (**NOT rounding-clean** — direct test `|30×60/114.84 − round(…)| = |15.67398 − 16| = 0.32602 ≥ 0.01`; 114.84 ∉ 30 fps clean set {60,72,75,90,100,120,150,180}; naive accumulation would drift **19.2 frames (0.64 s) over the 59 beats** of this clip → **every position below is absolute, never chained**) · cut_offset_frames **0** (basis `detector_error_dominant`) · bpm_confidence 1.0 · tempo_stability `stable`
downbeat_source `estimated` · section_source/labels `foote_novelty` / `unlabeled` · onset_source `full_mix` (122 onsets; schema emits a string here, §6's header spec asks for `<n>` — see RF-16) · lyric_alignment_mode `none`
Mode **AMV / action-cut / short-form vertical** → band **beat-grid prescription (§5.1)**, evaluated against the §5.1 **BPM band 100–120 → 1.5–3 s** because the label-keyed grid table is suspended · platform **9:16 vertical, 1080×1920, IG Reel**

---

## PASS 1 — MUSIC-ANALYSIS REVIEW (restated, not re-derived)

| Field | Emitted value |
|---|---|
| `track_id` | `dracula-reel-31s` |
| `source_file` | `direkta-modules/test/dracula-reel-31s.m4a` (full-track t=65.062 → 96.363, director-fixed, **not re-derived**) |
| `duration_sec` | 31.324 |
| `global_bpm` / `resolved_bpm` | 114.84 / 114.84 |
| `rejected_bpm` | `null` |
| `bpm_confidence` | 1.0 |
| `tempo_stability` | `stable` (`provenance.tempo.stability_iqr_ratio` 0.0) |
| `time_signature` | [4, 4] |
| `fps` | 30 |
| `frames_per_beat` | 15.674 |
| `cut_offset_frames` | 0 |
| `frame_accuracy.cut_offset_basis` | `detector_error_dominant` |
| `frame_accuracy.detector_tolerance_ms / _frames` | 70.0 ms / 3 frames |
| `frame_accuracy.median_beat_confidence` | 0.243 |
| `beats` / `downbeats` / `onsets` | 59 / 14 / 122 |

**Derived numbers (formulae only, §5.2).** `seconds_per_beat = 60/114.84 = 0.522466` · `frames_per_beat = 30×60/114.84 = 15.67398` (matches emitted 15.674) · `bar_duration_sec = 4 × 0.522466 = 2.089864` · clip = **15 bars** (14 emitted downbeats + the implied bar-1 line at t≈0.000, see below).

**`cut_offset_frames` handling — 0 is authoritative, NOT a bug.** The map emits `0` with `cut_offset_basis: "detector_error_dominant"` and the rationale *"detector error (±70 ms = 3 frames at 30 fps) dominates the perceptual offset."* Per §3, the −1…−3 perceptual band is **not re-applied over it**. Instead: **cut tolerance is widened to ±3 frames** and every cut is authored on an emitted beat time. Applied verbatim to every row of `cutlist.md`.

**Accent-weight hierarchy in force (§3).** non-metrical sound-design hit 1.0 = downbeat 1.0 > lyric-hook onset 0.85 > snare/backbeat 0.6 > hi-hat/subdivision 0.2 > sustained material never. **This clip contains ZERO `non_metrical` onsets and zero `sound_design_hit` onsets** — so §5.3's "a `non_metrical` weight-1.0 stinger overrides the musical grid for the single most important reveal" has **no candidate**; the reveal is placed on grid instead (see WOW below). Emitted weights present: 1.0 (`downbeat`, `kick`), 0.6 (`snare`), 0.2 (`drum_other`). No `hihat` class was emitted.

**Trust gates (§3).** `bpm_confidence` 1.0 and `tempo_stability: stable` do **not** trip §3's stated gate. But `frame_accuracy.rationale` asserts *"confidence or stability is below the gate … median beat confidence=0.243."* The two statements conflict (**RF-03**). Conservative resolution adopted, pending DQ-03: **downbeat-only cutting** as the default candidate restriction, ±3-frame tolerance, with sub-bar positions used **only** where §5.4's drop-build ladder mandates them.

---

## PASS 1 (cont.) — PROVENANCE GATE

**`warnings[]` read in full, verbatim:**

1. *"beat-this not installed — beats from librosa.beat.beat_track and downbeats ESTIMATED (every 4th beat). Install with `pip install beat-this` for real downbeat detection."*
2. *"demucs not installed — onsets are detected on the FULL MIX instead of an isolated drum stem, so kick/snare/hihat labels are less reliable and sections[].instrumentation is empty. Install with `pip install -U demucs`."*
3. *"allin1 not installed — sections come from Foote-novelty segmentation and are UNLABELED. Narrative rules keyed on a specific label (e.g. 'wow-shot on Chorus 1') do not apply. Install with `pip install allin1` for labeled sections."*
4. *"whisperx not installed and no forced aligner available — lyric_hook_onset entries are omitted (lyric_alignment_mode='none'). §7 step 4 must reassign dialogue/action slots to downbeats."*

**Modes disclosed and branches honored:**

- **`section_labels: "unlabeled"` / `section_source: "foote_novelty"` → §5.1's label grid and the label-keyed structural laws are SUSPENDED.** A `segment_2` is not a chorus. Specifically suspended: *wow-on-first-chorus-downbeat*, *chorus-2-adds-a-variable*, *bridge-is-a-hard-reset / budget ×0.5*, the per-label cut-grid table, and the outro deceleration rule. Fallback in force: **energy → `target_avg_shot_sec` budget only**, cross-checked against the §5.1 BPM band.
  - **The two emitted segments are structurally useless here** and are recorded as such: `segment_1` 0.0–4.168 (2 bars, energy 0.755, target [1.35, 2.59]) and `segment_2` 4.168–31.324 (12 bars, energy 0.704, target [1.65, 2.97]). The boundary at 4.168 falls **mid-vocal-line**, and the clip's single largest musical event — the drop — falls **inside** `segment_2`, not on a boundary. Budgets are still taken from these `target_avg_shot_sec` ranges as the gate requires; **act structure** is taken from the director-supplied timeline (below), recorded as a director decision, never as beat-map data (§7).
- **`downbeat_source: "estimated"` → bar phase is a guess** (`provenance.downbeats.rule`: *"every 4th beat, phase-anchored on the strongest onset among the first 16 beats"*). **Director must verify bar-1 phase against the audio before this sync map is committed — DQ-01.**
  - *Corroborating evidence offered, not a substitute for verification:* the clip's beat 1 (t = 0.511) carries `position_in_bar: 2`, implying a bar line at t ≈ **0.000** — i.e. the clip opens exactly on a bar line. Independently, every clip beat time equals a full-track beat time + 65.062 s, and the full-track map marks **65.062 (index 125)**, **69.230 (133)**, **79.668 (153)** and **96.363 (185)** as `is_downbeat: true` → clip 0.000, 4.168, 14.605 and 31.301. The two runs' phase anchors were computed over different windows and **agree**. Both still used the same `estimated` rule, so the gate is **not** discharged.
- **`lyric_alignment_mode: "none"` → there are no `lyric_hook_onset` candidates and no 0.85-weight slots exist.** Those slots are reassigned to downbeats per the gate. **The director has since supplied `dracula-reel-31s.structure.md`** (Whisper small, ±0.3 s, roles only). Per §7 this is logged as a **DIRECTOR DECISION (D-STRUCT)**, not as beat-map data, and every anchor is **snapped to an emitted beat** with the snap delta recorded (table below). No vocal position anywhere in these artifacts is estimated by ear, tapped, or inferred from genre.
- **`onset_source: "full_mix"`** → per warning 2, `kick`/`snare`/`drum_other` labels are heuristic and less reliable; `sections[].instrumentation` is empty. Effect assignment leans on **weight** (1.0 / 0.6 / 0.2), not on the class name, wherever the two could disagree.

### D-STRUCT — director-supplied structure, snapped to emitted beats

| Role (director) | Given t | Snapped to (emitted) | bar.beat | pib | Δ | Within Whisper ±0.3 s? |
|---|---|---|---|---|---|---|
| Pickup bar ends / **meme line A** in | 1.14 | beat 2 @ **1.045** | 1.3 | 3 (cut-eligible) | −0.095 s (−2.9 f) | yes |
| **Meme line B** in | 5.46 | beat 10 @ **5.213** | 3.3 | 3 (cut-eligible) | −0.247 s (−7.4 f) | yes |
| Instrumental breath in | 10.02 | downbeat @ **10.426** | 6.1 | 1 | +0.406 s (+12.2 f) | **no** — soft boundary, see DQ-04 |
| **Chorus entry / THE DROP** | 14.90 | downbeat @ **14.605** | 8.1 | 1 | −0.295 s (−8.9 f) | yes |
| Chorus continuation | 22.50 | downbeat @ **22.953** | 12.1 | 1 | +0.453 s (+13.6 f) | **no** — soft boundary, see DQ-04 |
| Chorus turn | 26.49 | downbeat @ **27.133** | 14.1 | 1 | +0.643 s (+19.3 f) | **no** — largest snap, see DQ-04 |
| **Title-word BUTTON** | ~31.05 | onset `kick` w1.0 @ **31.289** | 16.1 (implied) | 1 | +0.239 s (+7.2 f) | yes |

Two independent evidences confirm the drop snap to **14.605**, not 14.90: beat 28 is the **only beat in the clip with `confidence: 1.0`** and `is_downbeat: true`; and `energy_curve` reads **13.5 → 0.092, 14.0 → 0.000, 14.5 → 0.622, 15.0 → 0.905**. 14.605 / 31.324 = **46.6 %**, matching the director's own "~47 % of runtime". The music is at absolute floor at t=14.0 and back to 0.905 by t=15.0.

The **button** anchor is the one position beyond the last emitted downbeat (29.222). It is **not** grid-extrapolated: it sits on an emitted `kick` onset of weight 1.0 at **31.289** (frame 939), which is also the full-track downbeat 96.363. Flagged anyway — DQ-05.

---

## PASS 2 — STRUCTURE MAP

**Video mode: AMV / action-cut / short-form vertical** → beat-grid band. Proceeded without asking (§7 PROCEED): the delivery instruction — IG Reel, 9:16, 1080×1920 — determines it, and the source is generated-on-demand, not footage-limited.

**Concept (from the track, no upstream Bible — see DQ-06/DQ-07).** *NOCTURNE.* A single figure walks a wet night street toward camera; the two meme lines are delivered straight to lens with unhurried movie-star insolence; on the drop the street goes black and the figure is revealed in full night-glamour under a car's headlights; the piece turns at the end toward the first grey of dawn and the figure walks **backward** into shadow as the title word lands. Vampirism is **lighting and behaviour, never costume**. Trend-native (walk-toward-camera, lip-sync to lens), song-native (nocturne, fleeing sunlight, the car, movie-star shadows).

**Act structure = D-STRUCT (director), budgets = beat map.** Seven **movements**, named neutrally because labels are suspended; each is bounded by snapped emitted beats.

| # | Movement (role per D-STRUCT) | bars | start → end | emitted segment · energy · `target_avg_shot_sec` | local `energy_curve` |
|---|---|---|---|---|---|
| M1 | Pickup / hook | 0.5 | 0.000 → 1.045 | `segment_1` · 0.755 · [1.35, 2.59] | 0.150 → 0.839 |
| M2 | Meme line A (lip-sync #1) | 2 | 1.045 → 5.213 | `segment_1`→`segment_2` · 0.755/0.704 · blended | 0.775 → 0.850 |
| M3 | Meme line B (lip-sync #2) | 2.5 | 5.213 → 10.426 | `segment_2` · 0.704 · [1.65, 2.97] | 0.808 → 0.853 |
| M4 | Breath / build → collapse | 2 | 10.426 → 14.605 | `segment_2` · 0.704 · [1.65, 2.97] | 0.853 → **0.000** (trough t=13.5, prom **0.714**) |
| M5 | **THE DROP** / chorus entry | 4 | 14.605 → 22.953 | `segment_2` · 0.704 · [1.65, 2.97] | 0.622 → 0.905 → 0.737 |
| M6 | Chorus continuation | 2 | 22.953 → 27.133 | `segment_2` · 0.704 · [1.65, 2.97] | 0.633 → **1.000** (clip max @ t=26.0) |
| M7 | Chorus turn + button | 2 | 27.133 → 31.324 | `segment_2` · 0.704 · [1.65, 2.97] | 0.841 → 0.151 |

**Two arcs (§5.1), planned separately.**
- **Cut-rate arc:** effectively **flat at ~28.7 CPM** across every movement. This is what the emitted data produces: the two Foote segments carry near-identical `target_avg_shot_sec` ([1.35, 2.59] vs [1.65, 2.97]), and the "steps up at each chorus / resets at the bridge" law is label-keyed and suspended. Recorded as a deliberate, evidenced outcome — **not** an oversight. See **RF-06** and **DQ-09**.
- **Scale/motion arc — this carries the escalation instead.** wide (M1) → medium-close, locked-off-feeling for the lip-sync holds (M2–M3) → wide release + decelerating push (M4) → **slam to medium on the drop** (M5 in) → continuous 100→140 % push through M5 → medium/close on the door and the hand (M6) → release-valve **wide** at the first light (M7) → figure exits frame to black. No movement runs at one scale.
- **Reconciliation:** because the cut-rate is flat, escalation is delivered by scale, by camera speed (slow → med → **fast** at the drop → med at the turn), and by **effect density**, which rises from 0 calls in M1–M2 to 5 calls in M4 and 6 in M5.

**8-bar narrative-arc units (§5.1 "a new *idea* every 8 bars").** Bars 1–8 = *the walk and the two lines* (idea: charisma held in one unbroken stride). Bars 8–15 = *the reveal and the retreat* (idea: what the light does to it). The hinge is exactly the drop at bar 8.1.

---

## DESIGNED-MOMENT REGISTER

| Designed moment | Position (bar.beat / tc) | What it is | Why here |
|---|---|---|---|
| **WOW SHOT** | 8.1 — t 14.605 — f **438** — 00:00:14:18 | The drop reveal: street lamps dead, car full-beams up, figure dead-centre in full nocturne glamour, coat lifting | **§5.1's "first downbeat of the FIRST chorus" law is SUSPENDED** (`section_labels: unlabeled`) — the beat map contains no chorus. Placed instead on converging **evidence**: the only `confidence: 1.0` beat in the clip; `is_downbeat: true`; `energy_curve` 0.000 → 0.905 across it; and D-STRUCT (director) names 14.90 "chorus entry (the drop)". The chorus label is the **director's**, not the map's. |
| **HOOK / cold open** | 1.1–1.3 — t 0.000–1.045 — f 0–31 | Figure already mid-stride, far end of a wet sodium street, walking at us. No fade-up, no card. | §5.3 vertical: hook compresses to **2–3 s** and opens **on motion already in progress**. Ours is 1.045 s to first vocal — inside the band. Strongest image of the piece is held for the drop, not spent here (§5.3's "strongest image in the first 10 s" is served by the line-A lens-lock at 1.045). |
| **SYNC CONTRACT** | 1.3 — t 1.045 — f **31** — 00:00:01:01 | First hard cut, landing on the meme line's first syllable, straight into a lens-lock | §5.3: one unmistakable hard sync inside the first 4 bars / ~8 s. Ours is at **1.045 s**. Onset evidence at that position: `kick` weight **1.0** @ 1.033. |
| **BRIDGE RESET** | **none — declared, not invented** | The label-keyed bridge law is SUSPENDED, and §5.3 states a vertical piece has **no bridge**. | The structural analogue is logged instead: the **held silence at 12.539–14.605** (bar 7), sitting on the clip's deepest emitted trough (t=13.5, energy 0.155, **prominence 0.714** — nearly 5× the next-largest) and an `energy_curve` floor of **0.000**. It is the documented low reference §5.1 requires immediately before the peak. It is **not** called a bridge and carries **no ×0.5 budget cut**. |
| **TITLE** | 16.1 (implied) — t 31.289 — f **939** — 00:00:31:09 | The title word is **in the lyric**. Button = the figure fully absorbed into black + an optional 1-line burn-in over motion. **No card, no logo, no fade.** | §5.3: a 3-second title animation costs **8–15 %** of the audience; required titles go over motion. See DQ-11 and DQ-13 (the button lands 35 frames before picture end — a freeze-extend is proposed). |

---

## SECTION BLOCKS

Budget formula applied throughout: `n_cuts = round(movement_duration / avg(target_avg_shot_sec))`, `avg(segment_1) = 1.970`, `avg(segment_2) = 2.310`. **Bridge ×0.5 not applied anywhere** — suspended. Candidate restriction: `is_downbeat = true` OR `weight ≥ 0.6`; min spacing ≥ 1 beat (0.522466 s); spill to 0.2 only if budget > high-weight candidate count.

### Movement M1 — pickup / hook (bars 0.5, 0.000–1.045, segment_1 energy 0.755, local energy 0.150→0.839)
Visual job **Open on motion already in progress; establish street, wetness, distance, and the walk — nothing else.**  · Cut grid **1 shot, no internal cut**
Cut budget round(1.045 / 1.970) = 0.53 → **1** (floor of 1: it is the reel's opening shot) [no bridge ×0.5 — suspended]  · Scale **wide, figure small, slow push**
Dominant sync **internal (the stride)** · Palette/light **held** — sodium key from a practical at ¾ back, wet-asphalt bounce fill, key direction screen-left
Escalation **n/a (baseline)** · Sync budget **2** cands ≥0.6 · **1** selected · spill to 0.2 **n** · min spacing 1 beat

| bar.beat | t (s) | onset type | weight | assignment |
|---|---|---|---|---|
| 1.1 | 0.000 | *(implied bar line; clip in-point, `position_in_bar:2` on beat 1 implies a downbeat here)* | 1.0 | **CUT 1** — reel in, figure already walking |
| — | 0.836 | snare | 0.6 | *unassigned — hook kept clean of effects by design* |
| 1.2 | 0.511 | *(no onset ≥0.6)* | — | — |

### Movement M2 — meme line A, lip-sync #1 (bars 2, 1.045–5.213, segment_1→2, local energy 0.775→0.850)
Visual job **The charisma line, unbroken, to lens. Establish that this face knows it is being watched.** · Cut grid **1 bar → held 1.5 bars → 0.5-bar insert**
Cut budget (3.123 / 1.970) + (1.045 / 2.310) = 1.585 + 0.452 = 2.04 → **2**  · Scale **medium-close (lens-lock) → low-angle asphalt insert** (never one scale)
Dominant sync **lip / lyric** (capped — this is 1 of exactly 2 lip-sync shots, §5.5) · Palette/light **held** — same sodium key, same direction
Escalation **n/a** · Sync budget **7** cands ≥0.6 · **2** selected · spill to 0.2 **n** · min spacing 1 beat (min actual 1.045 s = 2 beats)

| bar.beat | t (s) | onset type | weight | assignment |
|---|---|---|---|---|
| 1.3 | 1.045 | kick @1.033 + **D-STRUCT line A in** | 1.0 | **CUT 2** — SYNC CONTRACT; lens-lock begins |
| 2.1 | 2.090 | downbeat | 1.0 | held — internal sync only (lip-sync protection) |
| 2.3 | 3.135 | *(kick @3.634 nearest ≥0.6)* | 1.0 | held — designed event of SH-2 lands here (see shotlist) |
| 3.1 | 4.168 | downbeat + kick @4.156 | 1.0 | **CUT 3** — insert: the shadow that doesn't match |
| — | 3.866 | snare | 0.6 | *unassigned — no effects across a lip-sync line* |
| — | 4.923 | snare | 0.6 | effect only — RGB split 3f (motif mint) |

### Movement M3 — meme line B, lip-sync #2 (bars 2.5, 5.213–10.426, segment_2 energy 0.704, local energy 0.808→0.853)
Visual job **The "car" line to lens; let the headlight arrive LATE, not on the word.** · Cut grid **1.5 bars held → 1 bar**
Cut budget round(5.213 / 2.310) = 2.26 → **2** · Scale **medium-close (lens-lock) → medium-wide (headlight rake)**
Dominant sync **lip / lyric**, then **motion** (the rake ends on the beat, not starts) · Palette/light **held** + a **second source enters** (headlight, screen-left) — a source addition, not a temperature change
Escalation **the frame gains a light it did not have** · Sync budget **13** cands ≥0.6 · **2** selected · spill to 0.2 **n** · min spacing 1 beat (min actual 2.090 s)

| bar.beat | t (s) | onset type | weight | assignment |
|---|---|---|---|---|
| 3.3 | 5.213 | kick @5.201 + **D-STRUCT line B in** | 1.0 | **CUT 4** — lens-lock #2 |
| 4.1 | 6.258 | downbeat + kick @6.293 | 1.0 | held |
| 4.3 | 7.303 | snare @7.210 | 0.6 | held — designed event of SH-4 lands here (headlight bloom) |
| 5.1 | 8.336 | downbeat + snare @8.290 | 1.0 | **CUT 5** — headlights rake |
| 5.2 | 8.870 | kick @8.847 | 1.0 | effect only — shake 5f decay |
| 5.4 | 9.915 | kick @9.903 | 1.0 | effect only — flash 2f |

### Movement M4 — breath / build → collapse (bars 2, 10.426–14.605, segment_2 energy 0.704, local energy 0.853 → **0.000**)
Visual job **Take the world away. Lamps die one by one; the figure stops; the music hits absolute floor.** · Cut grid **1 bar → 1 bar, then the §5.4 halving ladder spent on EFFECTS**
Cut budget round(4.179 / 2.310) = 1.81 → **2** · Scale **wide (the street) → medium, near-static, decelerating**
Dominant sync **effect** (the ladder) over **cut** — §5.4 explicitly permits *"quick cuts, flashes **or zooms** on the pre-drop peaks"*, which is how the ladder is reconciled with a 2-cut budget (**RF-05**) · Palette/light **held, then subtractive** — sources are removed, none added; colour temperature unchanged (§5.5 constraint respected)
Escalation **the documented low reference for the drop** — emitted trough t=13.5, energy 0.155, prominence **0.714** · Sync budget **6** cands ≥0.6 · **2** selected · spill to 0.2 **y — forced, ladder only** · min spacing 1 beat (min actual 2.066 s between cuts)

**§5.4 halving ladder, realised (2 bars → 1 bar → 2 beats → 1 beat → drop):**

| bar.beat | t (s) | onset type | weight | assignment |
|---|---|---|---|---|
| 6.1 | 10.426 | downbeat | 1.0 | **CUT 6** — ladder step 1 (2 bars out) |
| 6.2 | 10.948 | kick | 1.0 | effect only — shake 4f |
| 7.1 | 12.539 | downbeat | 1.0 | **CUT 7** — ladder step 2 (1 bar out); the held passage begins |
| 7.2 | 13.050 | kick @13.026 | 1.0 | effect only — flash 2f |
| 7.3 | 13.560 | drum_other @13.537 | **0.2** | ladder step 3 (2 beats out) — **STROBE** 1–2f A/B, 16f total. *Spill to 0.2 forced by §5.4; §5.3 would not authorise it (budget 2 < 6 candidates) — logged as RF-05.* |
| 7.4 | 14.095 | drum_other @14.060 | **0.2** | ladder step 4 (1 beat out) — **ZOOM PUNCH** 8f, 100→106 %, ease-out. §5.3-compliant position (beat 4 gets effects). |
| — | 14.327 | kick (offbeat riser) | 1.0 | **SPEED RAMP** 18f — full speed returns at 14.605 (§5.4) |
| **8.1** | **14.605** | **downbeat, beat `confidence: 1.0`** | **1.0** | **THE DROP — see M5** |

### Movement M5 — the drop / chorus entry (bars 4, 14.605–22.953, segment_2 energy 0.704, local energy 0.622 → 0.905 → 0.737)
Visual job **Reveal, then ride. The strongest image of the piece lands on the first frame of this movement.** · Cut grid **every 1 bar**
Cut budget round(8.348 / 2.310) = 3.61 → **4** · Scale **medium-wide slam → continuous 100→140 % push to close** (one clip carries the whole scale arc)
Dominant sync **cut** on the entry, then **internal** — one tempo-locked clip carries 3 cuts across 3 bars without new coverage (§5.3: internal sync is the cheapest craft you own) · Palette/light **CHANGED — the one permitted change point**: the sodium practicals are gone, replaced by hard tungsten-white headlights from screen-right. *§5.5 reserves temperature changes for "the bridge"; that label is suspended, so the change is anchored on the emitted evidence instead (energy 0.000→0.905, the only `confidence: 1.0` beat) — DQ-10.*
Escalation **new key source, new key direction (left→right flip), new scale, +2 speed steps** · Sync budget **21** cands ≥0.6 · **4** selected · spill to 0.2 **n** · min spacing 1 beat (min actual 2.078 s)

| bar.beat | t (s) | onset type | weight | assignment |
|---|---|---|---|---|
| **8.1** | **14.605** | **downbeat (beat conf 1.0)** | **1.0** | **CUT 8 — WOW.** Hard cut. Flash 3f + light leak 14f layered after the cut is locked (§2.7) |
| 8.2 | 15.116 | snare @15.105 | 0.6 | effect only — shake 6f decay |
| 9.1 | 16.695 | downbeat + snare @16.649 | 1.0 | **CUT 9** — motif re-entry (same source clip, new source range) |
| 9.4 | 18.251 | snare @18.216 | 0.6 | effect only — RGB split 3f |
| 10.1 | 18.773 | downbeat + snare @18.715 | 1.0 | **CUT 10** — motif re-entry |
| 10.2 | 19.284 | kick | 1.0 | effect only — zoom punch 6f |
| 11.1 | 20.863 | downbeat | 1.0 | **CUT 11** — motif re-entry, tightest scale |

### Movement M6 — chorus continuation (bars 2, 22.953–27.133, segment_2 energy 0.704, local energy 0.633 → **1.000** @ t=26.0)
Visual job **The car is right there, open, waiting — and the figure walks past it.** · Cut grid **every 1 bar**
Cut budget round(4.180 / 2.310) = 1.81 → **2** · Scale **medium (the open door) → close (the hand, the ring)**
Dominant sync **motion** — the door's swing and the hand's turn are timed to **end** on the beat, not start · Palette/light **held from M5** (headlight key, screen-right); the clip's energy maximum (1.000 at t=26.0) is spent on an **effect**, not a cut
Escalation **the variable this movement adds: an offered exit, refused** · Sync budget **11** cands ≥0.6 · **2** selected · spill to 0.2 **n** · min spacing 1 beat (min actual 2.090 s)

| bar.beat | t (s) | onset type | weight | assignment |
|---|---|---|---|---|
| 12.1 | 22.953 | downbeat | 1.0 | **CUT 12** — the open door |
| 12.2 | 23.475 | snare @23.441 | 0.6 | effect only — zoom punch 6f |
| 13.1 | 25.043 | downbeat + kick @25.031 | 1.0 | **CUT 13** — close: the hand, the ring |
| 13.3 | 26.088 | kick @26.076 | 1.0 | effect only — zoom punch 8f, 100→106 %. **Clip energy maximum (1.000).** §5.3 nominally gives beat 3 a cut, not an effect; spent as an effect deliberately so the peak is felt without buying a generation — logged as **RF-11** |

### Movement M7 — chorus turn + button (bars 2, 27.133–31.324, segment_2 energy 0.704, local energy 0.841 → 0.151)
Visual job **Sunlight as threat. The only cold white in the piece drives the figure backward, and the title word lands on the last frame.** · Cut grid **every 1 bar, decelerating internally**
Cut budget round(4.191 / 2.310) = 1.81 → **2** · Scale **release-valve WIDE (the street mouth, first light) → medium, figure exiting frame to black**
Dominant sync **motion** into **effect**; the button is a **protected key frame**, not a cut (§5.5) · Palette/light **CHANGED — dawn**: the piece's first and only cold full-spectrum white, from screen-centre depth. Second and final permitted change point.
Escalation **maximum, then withdrawal** — the retreat is the point · Sync budget **9** cands ≥0.6 · **2** selected · spill to 0.2 **n** · min spacing 1 beat (min actual 2.089 s)

| bar.beat | t (s) | onset type | weight | assignment |
|---|---|---|---|---|
| 14.1 | 27.133 | downbeat + kick @27.121 | 1.0 | **CUT 14** — wide: first light at the street mouth |
| 14.2 | 27.643 | kick @27.632 | 1.0 | effect only — flash 2f |
| 14.4 | 28.700 | kick @28.677 | 1.0 | effect only — shake 4f |
| 15.1 | 29.222 | downbeat | 1.0 | **CUT 15** — MATCH CUT (the only designed transition in the piece); the retreat into shadow |
| — | 31.138 | snare (offbeat) | 0.6 | effect only — RGB split 3f (pre-button) |
| **16.1** (implied) | **31.289** | **kick** | **1.0** | **BUTTON — protected key frame, f 939.** Flash 3f. Not a cut. |

---

## SYNC-POINT BUDGET — WHOLE PIECE

| | value |
|---|---|
| Candidates with `is_downbeat` or `weight ≥ 0.6` | **71** of 122 onsets |
| Cuts selected | **15** (21.1 % of candidates) |
| Spill to weight-0.2 | **1** position (13.560, forced by §5.4's ladder — RF-05) |
| Min spacing enforced | ≥ 1 beat = 0.522466 s · **min actual 1.045 s (2 beats)** · **0 violations** |
| Sync-type mix | cut ×15 · internal ×5 (M2, M5 motif re-entries) · motion ×4 · effect ×20 calls · lip ×2 · literal/lyric ×2 (§5.3-capped, see below) |
| Literal/lyric sync ledger (§5.3 cap) | **2** designed moments outside the lip-sync pair: *first light* on the "sunlight" line (14.1) and *the button* on the title word (16.1). The car imagery is deliberately **delayed ~3 s past the word** (headlight arrives 8.336, line B ran 5.213–10.426) so it reads as consequence, not illustration. The 2 lip-sync shots are counted separately per §5.5. |

## ACCEPTANCE CHECK (§5.1 — median shot length + CPM, never a mean ASL)

Band: **1.5–3.0 s** (§5.1 BPM band 100–120; the label-keyed grid table is suspended).

| Movement | shots | median shot (s) | CPM | in band? |
|---|---|---|---|---|
| M1 | 1 | 1.045 | 57.4 | **no** — a 2-beat movement cannot hold a 1.5–3 s median (RF-08); folded into M1+M2 for the real check |
| M1+M2 | 3 | 1.045 / **median 1.045**… see note | 43.2 | see RF-08 |
| M2 | 2 | 2.084 | 28.8 | yes |
| M3 | 2 | 2.607 | 23.0 | yes |
| M4 | 2 | 2.090 | 28.7 | yes |
| M5 | 4 | 2.090 | 28.8 | yes |
| M6 | 2 | 2.090 | 28.7 | yes |
| M7 | 2 | 2.096 | 28.6 | yes |
| **WHOLE PIECE** | **15** | **2.090** | **28.73** | **yes** |

Nothing lands 3–7× outside the band, so the grid choice is sound. The two 1.045 s shots (cuts 1 and 3) are deliberate short punctuation against two 3.123 s holds; the piece-level median is unaffected.

---

## DIRECTOR QUESTIONS — PASSES 1–3
*Autonomous dry-run: each of these is a gate I would have STOPPED at. ★ = my recommended default, which is what the artifacts are written against.*

**DQ-01 — Bar-1 phase verification (gate-mandated, §4 Pass 1).** `downbeat_source: "estimated"` — the §4 gate requires you to verify bar-1 phase against the audio **before this sync map is committed**. Everything downstream (all 15 cut positions, the ladder, the button) is phase-dependent.
- ★ **(a)** Accept t = 0.000 as bar 1 beat 1 and mark the map PROVISIONAL. Evidence: beat 1 carries `position_in_bar: 2`; the full-track map independently marks 65.062 / 69.230 / 79.668 / 96.363 as downbeats, which map to clip 0.000 / 4.168 / 14.605 / 31.301. Both runs agree.
- (b) Shift phase +2 beats (backbeat-anchored) and re-cut — this moves every cut by 1.045 s.
- (c) `pip install beat-this`, re-run the music-analysis skill, re-run Pass 1. Cleanest; costs a re-run of Passes 1–3.

**DQ-02 — Tempo-octave override (your call per §4 Pass 1).** `resolved_bpm` 114.84, `rejected_bpm` `null`, `octave_resolution.reason: no_octave_error_detected`, `action: kept`, `off_on_ratio` 0.304, `alternate_ratio` **0.992**. That 0.992 means on-beats and alternate-beats are near-indistinguishable in energy — the octave test barely discriminated, even though it did not fire.
- ★ **(a)** Keep 114.84 → shot band 1.5–3 s. Supported by `bpm_confidence` 1.0 and `stability_iqr_ratio` 0.0.
- (b) Half-time 57.42 → shot band 3–6 s; the whole reel becomes ~7 cuts. Argues for the track's *lean-back* swagger; contradicts the trend format's cut density.
- (c) Double-time 229.68 → burst passages only, drop-adjacent.

**DQ-03 — Which confidence gate governs?** The map contradicts itself: top-level `bpm_confidence: 1.0` + `tempo_stability: "stable"` do not trip §3's trust gate, but `frame_accuracy.rationale` says *"confidence or stability is below the gate … median beat confidence = 0.243."*
- ★ **(a)** Downbeat-only cutting + ±3-frame tolerance — matches the map's own stated basis and its `detector_tolerance_frames: 3`. **This is what is written.**
- (b) Full beat grid (beats 1 and 3), ±3-frame tolerance — would allow ~30 cuts instead of 15.
- (c) You supply manual markers for the 15 cut positions.

**DQ-04 — Three D-STRUCT anchors fall outside their own ±0.3 s tolerance when snapped.** Breath-in +0.406 s, chorus continuation +0.453 s, chorus turn +0.643 s. All three are *soft* role boundaries (vocal absence/presence), not transients, so I snapped each **forward to the next downbeat** rather than backward onto a beat-4 (which §5.3 reserves for effects).
- ★ **(a)** Accept the forward snaps as written (10.426 / 22.953 / 27.133).
- (b) Snap backward to the nearest emitted beat regardless of `position_in_bar` (9.915 / 22.430 / 26.610) — tighter to the vocal, but puts cuts on beat 4, against §5.3.
- (c) You re-time those three boundaries by ear against the audio and I re-cut.

**DQ-05 — The button sits past the last emitted downbeat.** `downbeats[]` ends at 29.222; the title word lands at ~31.05 per D-STRUCT. I anchored it on the emitted `kick` weight-1.0 onset at **31.289** (frame 939) — which is also the full-track downbeat 96.363 — rather than extrapolating the grid to 31.312.
- ★ **(a)** Button key frame at f 939 (t 31.289), picture out at f 940. Confirm.
- (b) Button at the literal D-STRUCT number 31.05 (f 932), giving 8 frames of hold after it.
- (c) Extrapolate the grid to 31.312 (f 939 — same frame after rounding; differs only on paper).

**DQ-06 — NO UPSTREAM BIBLE — this is the largest open gap.** §2.2 (strict handoff) requires look, cast, world and look-lock to come from a Bible or brief; §3 lists a Bible/brief as a **required** input. There is none. Per §2.3 I have **proposed** rather than fabricated, and every look claim below is marked as mine, not as evidence. **Nothing in `shotlist.md` should be generated until this is signed off.**
- ★ **(a)** Adopt the *NOCTURNE* look-lock and cast identity in `shotlist.md` as-is; I mint them as a one-page brief and you sign it.
- (b) You supply a real brief/Bible; I re-run Pass 2 onward against it.
- (c) Reduce scope: keep the sync map (which is Bible-independent) and defer the shotlist until a brief exists.

**DQ-07 — Palette hexes.** The §6 shotlist spec demands **palette hexes** in the look-lock block. With no Bible there is nothing to cite, so these are proposals, not evidence.
- ★ **(a)** sodium amber `#FFA24B` · neon magenta `#FF2E88` · night blue-black `#070B14` · wet-asphalt slate `#1B2A3A` · velvet blood `#8B0F1D` · dawn grey `#B9C2CC` (last two bars only).
- (b) Colder set: mercury-vapour green `#7FE0B0` replacing the amber — reads more "synth", less "street".
- (c) You supply hexes.

**DQ-08 — Aspect and frame rate vs §5.6.** §5.6's Reels row says **9:16, 60 fps, 7–15 s**. The delivery instruction and the beat map both say **30 fps**, and the piece is **31.324 s**. I conformed to the beat map's `fps: 30` (§2.2, strict handoff) and to your runtime.
- ★ **(a)** 1080×1920, 9:16, **30 fps**, 31.324 s, natively generated at 9:16 (§5.3: *never a centre-crop*). Master ProRes 422.
- (b) Finish at 60 fps by frame-doubling — **rejected on sight**: §5.6 forbids resampling/frame-blending, and a doubled 15.674 f/beat grid drifts identically.

**DQ-09 — The cut-rate arc is flat (~28.7 CPM everywhere).** The emitted `target_avg_shot_sec` ranges are near-identical between the two Foote segments, and §5.1's "steps up at each chorus" law is suspended. 15 cuts in 31.3 s is restrained for the format.
- ★ **(a)** 15 cuts as computed. Median 2.090 s, inside the band; escalation carried by scale, speed and effect density. Cheapest in generations, and matches §1's temperament (*one well-synced held shot beats four arbitrary ones*).
- (b) Step the arc by hand: M5 to every 2 beats (8 cuts) and M6 to every 2 beats (4 cuts) → **23 cuts**, piece median ~1.3 s. **Falls below the 1.5–3 s band** — the acceptance check would fail, and it costs ~5 more generations.
- (c) 19 cuts: add one mid-bar cut to M5 and M6 each. Median ~1.7 s, still in band.

**DQ-10 — Two lighting/colour-temperature changes.** §5.5 says hold lighting direction and colour temperature constant within a section and that *"the bridge is the only place you may change them"* — a label-keyed permission that the gate suspended. I changed twice: at the drop (14.605, sodium → tungsten headlight, key flips left→right) and at the turn (27.133, → cold dawn white).
- ★ **(a)** Both changes stand, anchored on emitted energy evidence rather than on a label.
- (b) One change only (the drop); keep the dawn as a *level* shift, not a temperature shift.

**DQ-11 — Title treatment.** The title word is sung; §5.3 bans cards and puts required titles over motion.
- ★ **(a)** No card. Optional single-word burn-in appearing over motion in bar 15 and resolving on the button frame.
- (b) No text at all — let the lyric be the title.
- (c) End card after picture out (costs 8–15 % of the audience per §5.3).

*(DQ-12 through DQ-16 are in `shotlist.md`; DQ-17 through DQ-19 are in `cutlist.md`.)*

---

## RULE-FRICTION MARKERS RAISED IN THIS FILE
RF-03 (confidence-gate self-contradiction) · RF-05 (§5.4 ladder forces a 0.2 spill §5.3 forbids) · RF-06 (no cut-rate arc is derivable from the emitted data) · RF-08 (a sub-bar movement cannot satisfy the median-length band) · RF-11 (energy maximum spent as effect on a beat-3 cut position) · RF-16 (§6 header spec asks for `onset_source <n>`; schema emits a string). Full analysis is in the test report, not here.
