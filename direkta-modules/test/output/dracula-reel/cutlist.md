# NOCTURNE — Cutlist
fps 30 · BPM 114.84 · frames_per_beat 15.674 · **cut_offset_frames 0 (applied to every row)** · meter 4/4 · 15 bars · picture 0–940 f (31.324 s)
`frame = round(raw_t × fps) + cut_offset_frames` — **absolute, taken from the emitted `beats[].t`; never accumulated**

> **Why the offset is 0 and stays 0.** The map emits `cut_offset_frames: 0` with `frame_accuracy.cut_offset_basis: "detector_error_dominant"` — detector error (±70 ms = **3 frames** at 30 fps) exceeds the perceptual correction, so §3's −1…−3 early-cut band is **NOT re-applied over it**. Cut tolerance is widened to **±3 frames** instead. Any row may be micro-nudged ±1–3 frames for image rhythm (§5.3) without re-opening the grid.
>
> **Why absolute positioning is mandatory here.** `frames_per_beat = 15.67398` is **not rounding-clean** (`|15.67398 − 16| = 0.326 ≥ 0.01`). Chaining relative offsets across this clip's 59 beats would accumulate **19.2 frames (0.64 s)** of drift.
>
> **Cross-check column `f§5.2`** carries `round(beat_index × 15.674)` — §5.2's absolute-grid formula — beside the frame derived from the emitted beat time. **Max divergence across the whole piece: 1 frame**, inside the 3-frame detector tolerance. See DQ-17.

---

## CUTS

| # | movement | bar.beat | beat | raw t | off | frame | f§5.2 | tc (reel) | tc (full track) | shot | in→out | sync type | transition | effect |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | M1 pickup | 1.1 | 0* | 0.000 | 0 | **0** | 0 | 00:00:00:00 | 00:01:05:02 | M1.1 | 1.400→2.445 | cut (HOOK — motion already in progress) | hard (reel in) | — |
| 2 | M2 line A | 1.3 | 2 | 1.045 | 0 | **31** | 31 | 00:00:01:01 | 00:01:06:03 | M2.1 | 1.900→5.023 | cut (**SYNC CONTRACT**) + lip | hard | — |
| 3 | M2 line A | 3.1 | 8 | 4.168 | 0 | **125** | 125 | 00:00:04:05 | 00:01:09:07 | M2.2 | 1.500→2.545 | cut (scale/angle break) | hard | RGB split 3f @148 |
| 4 | M3 line B | 3.3 | 10 | 5.213 | 0 | **156** | 157 | 00:00:05:06 | 00:01:10:08 | M3.1 | 1.900→5.023 | cut + lip | hard | — |
| 5 | M3 line B | 5.1 | 16 | 8.336 | 0 | **250** | 251 | 00:00:08:10 | 00:01:13:12 | M3.2 | 1.000→3.090 | motion (rake ENDS on 5.2) | hard | shake 5f @265 · flash 2f @297 |
| 6 | M4 build | 6.1 | 20 | 10.426 | 0 | **313** | 313 | 00:00:10:13 | 00:01:15:15 | M4.1 | 1.000→3.113 | cut (ladder step 1 — 2 bars out) | hard | shake 4f @328 |
| 7 | M4 build | 7.1 | 24 | 12.539 | 0 | **376** | 376 | 00:00:12:16 | 00:01:17:18 | M4.2 | 1.100→3.166 | cut (ladder step 2 — 1 bar out); held passage begins | hard | flash 2f @391 · strobe @406 · zoom @422 · ramp @430 |
| 8 | M5 DROP | 8.1 | 28 | 14.605 | 0 | **438** | 439 | 00:00:14:18 | 00:01:19:20 | M5.1 | 2.800→4.890 | cut (**WOW**) | hard | flash 3f + light leak 14f @438 · shake 6f @453 |
| 9 | M5 chorus | 9.1 | 32 | 16.695 | 0 | **501** | 502 | 00:00:16:21 | 00:01:21:23 | M5.2a | 1.000→3.078 | internal (motif re-entry) | hard | — |
| 10 | M5 chorus | 10.1 | 36 | 18.773 | 0 | **563** | 564 | 00:00:18:23 | 00:01:23:25 | M5.2b | 4.100→6.190 | internal (motif re-entry) | hard | RGB split 3f @546 · zoom punch 6f @579 |
| 11 | M5 chorus | 11.1 | 40 | 20.863 | 0 | **626** | 627 | 00:00:20:26 | 00:01:25:28 | M5.2c | 7.200→9.290 | internal (motif re-entry, tightest scale) | hard | — |
| 12 | M6 chorus | 12.1 | 44 | 22.953 | 0 | **689** | 690 | 00:00:22:29 | 00:01:28:00 | M6.1a | 1.000→3.090 | motion (door swing ENDS on the bar line) | hard | zoom punch 6f @703 |
| 13 | M6 chorus | 13.1 | 48 | 25.043 | 0 | **751** | 752 | 00:00:25:01 | 00:01:30:03 | M6.1b | 3.590→5.680 | motion (hand turn ENDS on the bar line) | hard | flash 2f @751 · zoom punch 8f @782 |
| 14 | M7 turn | 14.1 | 52 | 27.133 | 0 | **814** | 815 | 00:00:27:04 | 00:01:32:06 | M7.1 | 1.000→3.089 | cut (release-valve wide) | hard | flash 2f @829 · shake 4f @860 |
| 15 | M7 button | 15.1 | 56 | 29.222 | 0 | **877** | 878 | 00:00:29:07 | 00:01:34:09 | M7.2 | 1.000→3.102 | motion → **BUTTON** | **MATCH CUT** (graphic; first/last-frame controlled) | RGB split 3f @934 · flash 3f @939 |
| — | M7 button | **16.1** | 60* | 31.289 | 0 | **939** | 940 | 00:00:31:09 | 00:01:36:11 | M7.2 | (key frame) | **PROTECTED KEY FRAME — title word.** Not a cut. | — | flash 3f |
| — | out | — | — | 31.324 | 0 | **940** | — | 00:00:31:10 | 00:01:36:12 | — | — | picture out | hard out | see DQ-13 (freeze-extend) |

\* beat 0 and beat 60 are **implied** bar lines, not rows in `beats[]` (which runs 1…59, t 0.511…30.790). Beat 0 is implied by beat 1 carrying `position_in_bar: 2`; beat 60 is corroborated by an emitted `kick` onset of **weight 1.0 at 31.289** and by full-track downbeat 96.363. Neither is grid-extrapolated. See DQ-05.

## EFFECT CALLS (transient-triggered, not cut-triggered — §5.4)

| # | bar.beat | onset t | onset type · weight | frame | tc | effect | duration | rule check |
|---|---|---|---|---|---|---|---|---|
| E1 | 3.2+ (offbeat) | 4.923 | snare 0.6 | 148 | 00:00:04:28 | RGB split | 3f | §5.4 2–5f ✓ · offbeat, permitted as a mask/reveal accent (§5.3) — **RF-14** |
| E2 | 5.2 | 8.847 | kick 1.0 | 265 | 00:00:08:25 | camera shake, decaying | 5f | §5.4 3–8f ✓ · beat 2 ✓ |
| E3 | 5.4 | 9.903 | kick 1.0 | 297 | 00:00:09:27 | flash | 2f | §5.4 1–3f ✓ · beat 4 ✓ |
| E4 | 6.2 | 10.948 | kick 1.0 | 328 | 00:00:10:28 | camera shake | 4f | ✓ · beat 2 ✓ |
| E5 | 7.2 | 13.026 | kick 1.0 | 391 | 00:00:13:01 | flash | 2f | ✓ · beat 2 ✓ |
| E6 | 7.3 | 13.537 | drum_other **0.2** | 406 | 00:00:13:16 | **strobe** 1–2f A/B | 16f total | §5.4 8–24f ✓ · build peak only ✓ · **ladder step 3; 0.2 spill forced by §5.4 against §5.3 — RF-05** |
| E7 | 7.4 | 14.060 | drum_other **0.2** | 422 | 00:00:14:02 | **zoom punch** 100→106 %, ease-out | 8f | §5.4 4–8f ✓ · beat 4 ✓ · ladder step 4 |
| E8 | 7.4+ (riser) | 14.327 | kick 1.0 | 430 | 00:00:14:10 | **speed ramp** | 18f | §5.4 12–24f ✓ · full speed returns at f 438, so cut 8 lands **at** full speed ✓ |
| E9 | 8.1 | 14.605 | downbeat 1.0 (beat conf **1.0**) | 438 | 00:00:14:18 | flash + **light leak** | 3f + 14f | §5.4 1–3f / 8–16f ✓ · light leak sanctioned for chorus entry ✓ · layered **after** the cut was locked (§2.7) |
| E10 | 8.2 | 15.105 | snare 0.6 | 453 | 00:00:15:03 | camera shake, decaying | 6f | ✓ · beat 2 ✓ |
| E11 | 9.4 | 18.216 | snare 0.6 | 546 | 00:00:18:06 | RGB split | 3f | ✓ · beat 4 ✓ |
| E12 | 10.2 | 19.284 | kick 1.0 | 579 | 00:00:19:09 | zoom punch | 6f | ✓ · beat 2 ✓ |
| E13 | 12.2 | 23.441 | snare 0.6 | 703 | 00:00:23:13 | zoom punch | 6f | ✓ · beat 2 ✓ |
| E14 | 13.1 | 25.031 | kick 1.0 | 751 | 00:00:25:01 | flash | 2f | ✓ · on a cut (§6 precedent) ✓ |
| E15 | 13.3 | 26.076 | kick 1.0 | 782 | 00:00:26:02 | zoom punch 100→106 % | 8f | ✓ · **clip energy maximum (1.000 @ t 26.0)** spent as an effect on a beat-3 position §5.3 nominally reserves for cuts — **RF-11** |
| E16 | 14.2 | 27.632 | kick 1.0 | 829 | 00:00:27:19 | flash | 2f | ✓ · beat 2 ✓ |
| E17 | 14.4 | 28.677 | kick 1.0 | 860 | 00:00:28:20 | camera shake | 4f | ✓ · beat 4 ✓ |
| E18 | 15.4+ (offbeat) | 31.138 | snare 0.6 | 934 | 00:00:31:04 | RGB split | 3f | ✓ · offbeat — **RF-14** |
| E19 | 16.1 | 31.289 | kick 1.0 | 939 | 00:00:31:09 | flash (button) | 3f | ✓ · protects the key frame (§5.5) |

---

## CLOSE-OUT CHECKS

### Transition ration (§5.4 — target ≥85 % hard cuts, ≤15 % everything else)

| | count | share | verdict |
|---|---|---|---|
| Hard cuts | **14** | **93.3 %** | ✓ ≥85 % |
| Designed transitions | **1** (match cut, cut 15) | **6.7 %** | ✓ ≤15 % |
| Dissolves | 0 | 0 % | ✓ (not ballad mode) |

The **speed ramp (E8)** and the **light leak (E9)** appear in §5.4's *transition* table **and** in its *effect-duration* list. Both are counted here as **effects**, not transitions, because neither joins two shots — the ramp lives inside shot M4.2 and the leak is layered over an already-locked hard cut. If they were counted as transitions the ration would be 12/15 = 80 % hard, **failing the gate**. The double-listing is a genuine ambiguity in §5.4 — **RF-07**, and it is the difference between passing and failing this check.

### Median shot length + cuts-per-minute, per movement (§5.1 — never a mean ASL)

Band: **1.5–3.0 s** (§5.1 BPM band 100–120; the label-keyed grid table is suspended by the provenance gate).

| movement | shots | shot lengths (s) | **median** | **CPM** | verdict |
|---|---|---|---|---|---|
| M1 | 1 | 1.045 | 1.045 | 57.4 | ✗ — a 0.5-bar movement cannot hold a 1.5 s median (**RF-08**) |
| M2 | 2 | 3.123 · 1.045 | 2.084 | 28.8 | ✓ |
| M3 | 2 | 3.123 · 2.090 | 2.607 | 23.0 | ✓ |
| M4 | 2 | 2.113 · 2.066 | 2.090 | 28.7 | ✓ |
| M5 | 4 | 2.090 · 2.078 · 2.090 · 2.090 | 2.090 | 28.8 | ✓ |
| M6 | 2 | 2.090 · 2.090 | 2.090 | 28.7 | ✓ |
| M7 | 2 | 2.089 · 2.102 | 2.096 | 28.6 | ✓ |
| **PIECE** | **15** | — | **2.090** | **28.73** | **✓ inside band** |

Nothing lands 3–7× outside the band, so the grid choice is sound (§5.1's failure test). M1's miss is structural, not a grid error: it is a 1.045 s movement, shorter than the band's own minimum shot. Folded into M2 it reads 3 shots / 4.168 s / median 1.045 s / 43.2 CPM — still short, because the hook is deliberately the fastest thing in the piece (§5.3 vertical: hook compresses to 2–3 s).

### Effect-call count by type

| effect | calls | frame range used | §5.4 spec | ✓ |
|---|---|---|---|---|
| flash | **6** | 2–3f | 1–3f | ✓ |
| camera shake (decaying) | **4** | 4–6f | 3–8f | ✓ |
| zoom punch (100→106 %, ease-out) | **4** | 6–8f | 4–8f | ✓ |
| RGB split | **3** | 3f | 2–5f | ✓ |
| speed ramp | **1** | 18f | 12–24f | ✓ |
| strobe (1–2f A/B) | **1** | 16f total | 8–24f, build peak only | ✓ |
| light leak | **1** | 14f | 8–16f | ✓ |
| **total** | **20** | | | |

20 effect calls across 31.324 s = **0.64/s**. §5.4 rations *transitions* but sets **no ceiling on effect density**, so this number is unchecked by the rule file — see **DQ-18**.

### Minimum-spacing audit (§5.3 — ≥1 beat = 0.522466 s between cuts)

| smallest gaps | |
|---|---|
| cuts 1→2 and 3→4 | **1.045 s = 2.000 beats** |
| all other adjacent pairs | 2.066–3.123 s = 3.95–5.98 beats |
| **violations** | **0** |

### Screen-direction audit (§5.5 — no accidental 90° change)

| | |
|---|---|
| Matched joins (direction identical) | **11** |
| Designed 180° opposes, all landing on a beat | **3** — cut 7 (in→out, the retreat), cut 8 (out→in, **the drop**), cut 14 (in→out, the light pushes back) |
| **Accidental 90° changes** | **0** |
| Speed changes across an oppose | 3 of 3 — §5.5 defines the oppose rule on *direction* and is silent on speed (**RF-12**); flagged, not a violation |

### Delivery / technical hygiene (§5.6)

| item | value | note |
|---|---|---|
| Project frame rate | **30 fps**, single rate, conformed before editing | From the beat map's `fps: 30` and the delivery instruction. §5.6's Reels row says 60 fps — **not** followed; see DQ-08 and RF-15. |
| Aspect | **9:16, 1080×1920**, generated natively at 9:16 | §5.3: *never a centre-crop*. No Bible aspect exists to reconcile against. |
| Runtime | **31.324 s** (940 frames) | §5.6's Reels row says 7–15 s — **not** followed; the director fixed the window. RF-15. |
| Resampling / frame-blending | **disabled** | §5.6 — blended frames on a beat cut look like mud |
| Letterbox / pillarbox | n/a | native 9:16, nothing to fit |
| IVTC / deinterlace | n/a | all sources are progressive AI generations |
| Master | **ProRes 422** first, then H.264 for upload | §5.6 |
| Watermarks / software logos | none | §5.6 |

---

## DIRECTOR QUESTIONS — PASS 5
*★ = recommended default, which is what this file is written against.*

**DQ-17 — Which position source is authoritative: the emitted beat times, or §5.2's grid formula?** §2.2 (strict handoff) says take beats from the map **as given**; §5.2 says compute every position absolutely as `round(beat_index × frames_per_beat)`. The two disagree by up to **1 frame** in this clip (columns `frame` and `f§5.2` above), because the emitted librosa beat times jitter ±25 ms around a rigid grid. Both are inside the 3-frame detector tolerance, so no cut moves perceptibly either way.
- ★ **(a)** Use the **emitted `beats[].t`** (the `frame` column). Zero accumulation error by construction, and it honours strict handoff. **This is what is cut.**
- (b) Use §5.2's rigid grid (the `f§5.2` column) — cuts land on a perfectly even 15.674 f/beat lattice; nine of fifteen rows shift by +1 frame.
- (c) Rigid grid re-anchored per movement — unnecessary here; `tempo_stability` is `stable` with `stability_iqr_ratio` 0.0.

**DQ-18 — Is 20 effect calls in 31 s too many?** §5.4 rations *transitions* (≥85 % hard cuts) but publishes **no effect-density ceiling**, and §2.8 bans *"flashy transitions as personality"* without defining the line. Effect density is also carrying the escalation arc here, because the cut-rate arc is flat (DQ-09).
- ★ **(a)** 20 as listed. Density rises 0 → 1 → 2 → 5 → 6 → 3 → 4 across M1…M7, so the effects *are* the arc.
- (b) Trim to ~12 by dropping the four zoom punches outside M4/M5 — quieter, and closer to the restraint §1 describes.
- (c) Strip everything except the drop stack (E6–E10) and the button — 6 calls, maximum severity.

**DQ-19 — How does the picture conform to Instagram's own copy of the licensed audio?** This is outside the rule file entirely. On IG the reel is published against the platform's licensed sound, not against `dracula-reel-31s.m4a`; the platform's copy has its own start offset and may be re-encoded. Every frame number in this file is relative to **our** extract (full-track 65.062 s = reel f 0).
- ★ **(a)** Publish with our audio embedded and *also* attach the platform sound, then nudge the platform track's start to full-track 65.062 s in the IG editor, verifying against the drop at reel f 438.
- (b) Publish with embedded audio only — loses the trending-sound distribution, which is the entire reason for this edit.
- (c) Re-conform the picture after upload against whatever offset the platform gives, treating this cutlist's frames as relative and re-slipping globally. Requires a director check on the drop.

---

## OPEN VIOLATIONS AND EXCEPTIONS FLAGGED FOR THE DIRECTOR

1. **§5.3 spill rule breached once, under §5.4's orders.** E6 sits on a weight-**0.2** onset (13.560). §5.3 authorises a 0.2 spill only when the movement budget exceeds the high-weight candidate count — here the budget is 2 and there are 6 candidates, so it is **not** authorised. §5.4's mandatory halving ladder requires a beat there. §5.4 was followed. (RF-05)
2. **§5.3 beat-1/3 convention breached once, deliberately.** E15 spends the clip's energy maximum (t 26.0, energy 1.000) as an effect on bar 13.3 — a position §5.3 reserves for cuts. Spending it as a zoom punch costs no generation. (RF-11)
3. **§5.5 lip-sync eligibility breached by design on two shots.** M2.1 and M3.1 require "even lighting" that the proposed look-lock does not provide; a shot-local bounce is proposed. (DQ-12)
4. **§5.5's "event at 60–70 % of clip" and "protect the key frame" pull opposite ways on the WOW shot.** M5.1's revealed state must be present on its *first* frame (which lands on the drop) while its designed event sits at 62 %. Both are satisfied by treating the reveal as a *state* and the coat/step as the *event*. (RF-09)
5. **M1's median shot length (1.045 s) sits below the 1.5–3 s band.** Structural — the movement is 0.5 bars long. Piece median is 2.090 s and passes. (RF-08)
6. **The button falls 1 frame before picture out.** No post-roll. A 12-frame freeze-extend past the audio is proposed. (DQ-13)
7. **§5.6's Reels row (60 fps, 7–15 s) was not followed** — the beat map's `fps: 30` and the director's fixed 31.324 s window govern. (RF-15)
