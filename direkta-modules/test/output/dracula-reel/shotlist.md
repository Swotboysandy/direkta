# NOCTURNE — Shotlist
Track `dracula-reel-31s` · 114.84 BPM · 4/4 · 30 fps · 15 bars / 31.324 s · 9:16 1080×1920
Phrase sizing at this tempo: **1 bar = 2.090 s · 2 bars = 4.180 s · 4 bars = 8.360 s.** With ~1 s handles per end (§5.5): **1-bar clip → 4.2 s · 2-bar clip → 6.2 s · 4-bar clip → 10.4 s.** (§5.5's table gives 7/12 s @100 and 6/10 s @120; 114.84 interpolates to 6.2/10.4 — consistent.) **Never generated at exactly the phrase length.**

> ⛔ **CREDIT GATE — NOTHING IN THIS FILE IS AUTHORISED.** Per §2.6 this is a proposal carrying a generation count and cost. Generation is **section-gated**: one movement generated, reviewed and signed off before the next is queued. Nothing was generated in this dry-run and nothing was spent.
>
> ⚠️ **NO UPSTREAM BIBLE EXISTS.** §2.2 and §3 require look, cast, world, look-lock, palette and aspect to come from a Movie Bible or concept brief. There is none. Per §2.3 (*evidence or ask — never invent*) the two blocks below are **PROPOSALS minted by this agent from the track's own imagery**, not cited evidence. They are the answer to **DQ-06**, and every prompt in this file inherits their provisional status.

---

## LOOK-LOCK BLOCK — *[PROPOSED — DQ-06/DQ-07 — not director-signed]*
*Byte-identical text, appended verbatim as layer 4 of every prompt below. Do not paraphrase per shot.*

```
LOOK-LOCK v1 / NOCTURNE.
Lighting philosophy: night-for-night, single hard key from one in-frame practical (sodium street lamp,
then car headlight, finally dawn), placed three-quarter back; wet-asphalt bounce as the only fill; no
ambient lift anywhere. Every frame carries exactly one hot rim and one true black. Shadow detail is
retained on the face and nowhere else.
Palette: sodium amber #FFA24B (key, bars 1-7) / tungsten headlight white #FFF1DC (key, bars 8-13) /
neon magenta #FF2E88 (background practicals only) / night blue-black #070B14 (blacks) /
wet-asphalt slate #1B2A3A (ground) / velvet blood #8B0F1D (one accent, wardrobe lining) /
dawn grey #B9C2CC (bars 14-15 ONLY - the first and only cold full-spectrum light in the piece).
Lens & grade character: 35mm, shallow, anamorphic-adjacent horizontal falloff; heavy halation blooming
off every practical; fine organic grain; crushed blacks; no decorative lens flare; no colour in the
shadows.
Motif: THE SHADOW THAT DOES NOT MATCH - the figure's cast shadow is taller and shaped wrong. Minted
bar 3, paid at the drop, closed on the button.
Motif: SUNLIGHT AS THREAT - warm-white appears only in the last two bars, and it drives the figure
backward.
Format tail: vertical 9:16, 1080x1920, cinematic, filmic contrast, photoreal.
```

## CAST IDENTITY BLOCK — *[PROPOSED — DQ-06/DQ-15 — not director-signed]*
*Dense descriptors, appended verbatim as layer 2 of every prompt in which the subject appears. There is no Bible to quote; these are minted.*

```
THE FIGURE (single subject, unnamed, present in every shot):
mid-twenties, androgynous night-glamour; hair wet-slicked straight back off a high forehead, not a
strand loose; skin lit to porcelain against sodium amber, blue-cast in the shadow half; heavy-lidded
unhurried eyes that hold the lens roughly half a beat longer than is comfortable; a long unstructured
dark overcoat, open, over a bare collarbone; one plain silver band on the right index finger; NO fangs,
NO cape, NO prosthetics, NO period costume. Walks like the street is already theirs - heel strikes
first, shoulders dead still, head level, hands loose and never gesturing.

THE DRIVER (never seen, never framed):
represented only by a headlight beam, an open passenger door, and - once - a hand on a wheel in the
extreme background, out of focus. Arrives at the drop. Is refused.
```

**Shared identity control.** One **identity-anchor still** is generated first (an image, not a video) at medium-close, three-quarter sodium key, neutral expression. It is passed as the reference/Soul-ID anchor into **all twelve** video generations, alongside a single shared seed per movement. This is the highest-risk axis in the piece — twelve shots of one face, six of them medium-close or tighter.

---

## SECTION BLOCKS

### Movement M1 — pickup / hook · grid 1 shot, no internal cut · **1 cut from 1 shot**

**M1.1 — [FLOW] "Already Walking"**  covers bar 1.1 (HOOK / cold open)  **expected slices: 1**
```
generate   4.2 s (1 bar @114.84 = 2.090 s + 1.0 s / 1.1 s handles) · model Kling (5 s tier, trim to 4.2)
in→out     1.400 → 2.445  (used span 1.045 s)
event at   n/a — flow clip. Continuous motion already in progress at the in-point (§5.3 vertical rule).
direction  in · slow  |  first shot of the piece — no adjacency constraint
positive   1) FRAMING wide, 35mm, camera at chest height, static-with-slow-push, deep focus falling off
              at 12 m; subject occupies ~1/6 of frame height, dead centre of the 9:16 column
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — the figure is SHARP; nothing else is
           3) SETTING a narrow wet city street at 3 a.m., rain just stopped, standing water holding
              inverted lamp reflections, sodium lamps receding in a line, one magenta sign far back,
              no cars, no people, no signage text
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>
           5) MOOD + FORMAT TAIL unhurried, predatory calm, nocturne; vertical 9:16 1080x1920,
              cinematic, filmic contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, logo,
           fangs, cape, gothic castle, bats, coffin, daylight, ambient fill, blown highlights,
           other pedestrians, visible camera crew, subtitles
aspect     9:16 1080×1920 (delivery instruction; no Bible aspect exists — DQ-08) · seed/identity
           M1 seed + identity-anchor still · frame ctrl **last frame → first frame of M2.1** (stride
           phase must carry across the cut; the cut reads as a scale jump, not a jolt)
audio cond n/a (Kling is audio-unaware — sync imposed downstream)
```

### Movement M2 — meme line A, lip-sync #1 · grid 1 bar → held 1.5 bars → 0.5-bar insert · **2 cuts from 2 shots**

**M2.1 — [EVENT · LIP-SYNC 1 of 2] "Line A — To Lens"**  covers bars 1.3–3.1 (SYNC CONTRACT)  **expected slices: 1**
```
generate   6.2 s (2 bars = 4.180 s + 1.0 s handles) · model Seedance 2.5 (audio-aware, native
           lip-sync co-generation; §5.5 execution order step 1, kept well under the ~30 s guidance)
in→out     1.900 → 5.023  (used span 3.123 s)
event at   ~4.000 s (64.5 % of clip) — the lens-lock: the eyes come up and HOLD the camera, landing at
           timeline 3.145 s = bar 2.3. Pre-roll builds the walk into it, post-roll gives 1.18 s to cut
           away from. Tolerance ±0.5 s of model timing error absorbed by the handles.
direction  in · med  |  prev M1.1 in · slow → direction MATCHES (flow join), speed steps up one
positive   1) FRAMING medium-close, 35mm at eye height, slow dolly-in matching the walk so the framing
              stays constant while the background compresses; face in the upper third of the 9:16 column
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — near-frontal, head STABLE, no head
              rotation and no whip during the line (§5.5 lip-sync eligibility); mouth clearly visible
           3) SETTING same wet street, lamps now closer and larger, magenta sign bokeh over the
              right shoulder, breath faintly visible
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>  — see DQ-12: the single hard key contradicts
              §5.5's "even lighting" lip-sync eligibility criterion; a +1 stop soft bounce on the
              shadow side is proposed for THIS SHOT AND M3.1 ONLY
           5) MOOD + FORMAT TAIL insolent, amused, unhurried; vertical 9:16 1080x1920, cinematic,
              filmic contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, fangs,
           cape, exaggerated mouth shapes, head turning during speech, motion blur on the mouth,
           daylight, teeth glow, singing-face grimace
aspect     9:16 1080×1920 · seed/identity M2 seed + identity-anchor still · frame ctrl first frame
           inherits M1.1's stride phase; **no** last-frame control (cut 3 is a deliberate hard break)
audio cond "one continuous dolly-in across two bars at 114.84 BPM; the eyes rise to camera on the
           third beat of the second bar and do not leave it" + 14.617 s window (clip t 8.336→22.953)
```

**M2.2 — [FLOW] "The Shadow That Does Not Match"**  covers bar 3.1  **expected slices: 1**
```
generate   4.2 s (1 bar = 2.090 s + handles) · model Kling
in→out     1.500 → 2.545  (used span 1.045 s)
event at   n/a — flow clip; the wrongness is a state, not an action
direction  in · med  |  prev M2.1 in · med → MATCHES exactly (flow join); the cut sells on the
           scale/angle break, not on momentum
positive   1) FRAMING low-angle insert, camera 20 cm off the wet asphalt, 35mm, gliding forward with
              the feet; the boots enter and leave the top of the 9:16 column; the SHADOW is the subject
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — only boots and coat hem are in frame;
              the cast shadow stretching toward camera is TALLER than the body and shaped wrong —
              longer at the shoulder, a silhouette the coat cannot account for. No creature, no wings.
           3) SETTING standing water, oil rainbow, lamp reflection breaking as the boot lands
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>
           5) MOOD + FORMAT TAIL wrongness noticed a half-second late; vertical 9:16 1080x1920,
              cinematic, filmic contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, wings,
           claws, monster silhouette, CG bats, obvious VFX shadow, two shadows, daylight
aspect     9:16 1080×1920 · seed/identity M2 seed (shared with M2.1) · frame ctrl none
audio cond n/a (audio-unaware)
```

### Movement M3 — meme line B, lip-sync #2 · grid 1.5 bars held → 1 bar · **2 cuts from 2 shots**

**M3.1 — [EVENT · LIP-SYNC 2 of 2] "Line B — The Car"**  covers bars 3.3–5.1  **expected slices: 1**
```
generate   6.2 s (2 bars = 4.180 s + 1.0 s handles) · model Seedance 2.5 (native lip-sync)
in→out     1.900 → 5.023  (used span 3.123 s)
event at   ~3.990 s (64.4 % of clip) — a headlight blooms into frame from screen-LEFT and rakes the
           figure's cheek, landing at timeline 7.303 s = bar 4.3. The figure does not look at it.
direction  in · med  |  prev M2.2 in · med → MATCHES (flow join)
positive   1) FRAMING medium-close, 35mm at eye height, continued slow dolly-in; face upper third
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — near-frontal, head STABLE through the
              line; eyes stay on lens even as the headlight arrives; a single slow blink after it
           3) SETTING same street; a hard white beam enters from the left edge two-thirds through and
              travels across the face; wet lens-side halation blooms; the sodium key survives on the
              right side of the face
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim> — +1 stop shadow-side bounce, THIS SHOT ONLY (DQ-12)
           5) MOOD + FORMAT TAIL bored contempt; vertical 9:16 1080x1920, cinematic, filmic contrast,
              photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, subject
           turning toward the light, squinting, head turn during speech, lens flare stars, daylight
aspect     9:16 1080×1920 · seed/identity M3 seed + identity-anchor still · frame ctrl **last frame →
           first frame of M3.2**; brightness and dominant colour matched across the join (§5.5 — a
           dark→light mismatch would expose the cut)
audio cond "one continuous dolly-in across two bars at 114.84 BPM; a hard white light enters frame
           left on the third beat of the second bar and crosses the face in one beat" + 14.617 s window
```

**M3.2 — [FLOW] "Headlights Rake"**  covers bar 5.1  **expected slices: 1**
```
generate   4.2 s (1 bar + handles) · model Kling
in→out     1.000 → 3.090  (used span 2.090 s)
event at   n/a — flow clip; the rake's MOTION ENDS on bar 5.2 (§5.3 motion sync: time where the
           motion ends, not where it starts) and is punctuated by a 5f decaying shake
direction  in · med  |  prev M3.1 in · med → MATCHES (flow join, brightness-matched)
positive   1) FRAMING medium-wide, 35mm, low-ish, tracking backward at walking pace so the figure holds
              size while the geometry slides
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — full figure, coat moving with the walk
           3) SETTING the beam sweeps the wet road; the figure walks through it without breaking
              stride or turning; the car itself stays out of frame — only its light
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>
           5) MOOD + FORMAT TAIL an offer being ignored; vertical 9:16 1080x1920, cinematic, filmic
              contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, visible
           car body, visible driver, brake lights, headlight starbursts, daylight, subject reacting
aspect     9:16 1080×1920 · seed/identity M3 seed · frame ctrl none
audio cond n/a (audio-unaware)
```

### Movement M4 — breath / build → collapse · grid 1 bar → 1 bar, ladder spent on effects · **2 cuts from 2 shots**

**M4.1 — [FLOW] "The Lamps Go Out"**  covers bar 6.1  **expected slices: 1**
```
generate   4.2 s (1 bar + handles) · model Kling
in→out     1.000 → 3.113  (used span 2.113 s)
event at   n/a — flow clip
direction  in · slow  |  prev M3.2 in · med → direction MATCHES, speed steps DOWN one (deceleration
           into the silence). No 90° change.
positive   1) FRAMING wide, 35mm, camera slowing to near-stop; the receding lamp line is the subject
              as much as the figure
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — figure small again, still walking
           3) SETTING the sodium lamps switch off one at a time, nearest to farthest, each kill
              swallowing another twenty metres of street; the reflections in the water die with them
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>
           5) MOOD + FORMAT TAIL the world being switched off; vertical 9:16 1080x1920, cinematic,
              filmic contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, flicker
           strobing, all lamps dying at once, daylight, fog machine haze
aspect     9:16 1080×1920 · seed/identity M4 seed · frame ctrl **last frame → first frame of M4.2**
audio cond n/a (audio-unaware)
```

**M4.2 — [EVENT] "The Silence"**  covers bar 7.1 — the documented low reference  **expected slices: 1**
```
generate   4.2 s (1 bar + handles) · model Seedance 2.5 (audio-aware — the stop must sit inside the
           music's floor, which the model can hear)
in→out     1.100 → 3.166  (used span 2.066 s)
event at   ~2.800 s (66.7 % of clip) — THE STOP. The figure's last footfall plants and the walk ends,
           landing at timeline 14.239 s, i.e. 0.366 s (11 frames) before the drop. The stillness, not
           the stop, is what the drop cuts away from.
direction  out · slow  |  prev M4.1 in · slow → **180° OPPOSE on the beat** (§5.5 impact join). The
           camera retreats while the world goes dark.
positive   1) FRAMING medium, 35mm, slow pull-back; the figure is the only thing resolvable
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — walks two more paces, plants, stops,
              head still level; chest rises once; a slow blink
           3) SETTING total darkness except one dying sodium rim on the left shoulder and the wet
              ground catching almost nothing; no background
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>
           5) MOOD + FORMAT TAIL held breath; vertical 9:16 1080x1920, cinematic, filmic contrast,
              photoreal
negative   inconsistent face, wrong wardrobe, frozen frame, extra fingers, text, watermark, pitch
           black with no subject, subject looking around, nervousness, daylight, digital noise
aspect     9:16 1080×1920 · seed/identity M4 seed + identity-anchor still · frame ctrl **NONE into
           M5.1 — deliberate.** §5.5's brightness-matching rule governs *disguised* joins; the drop is
           the opposite, and the dark→bright mismatch is the point.
audio cond "the subject walks for one bar at 114.84 BPM then stops dead one beat before the music
           returns; hold absolutely still through the silence" + 14.617 s window (clip t 8.336→22.953)
```

### Movement M5 — THE DROP / chorus entry · grid every 1 bar · **4 cuts from 2 shots**

**M5.1 — [EVENT] "The Reveal"**  covers bar 8.1 — **WOW SHOT**  **expected slices: 1**
```
generate   6.2 s (2 bars = 4.180 s + handles) · model Seedance 2.5 (audio-aware — the drop must be
           heard by the model; §5.5 "on the drop at N s, snap from wide to extreme close-up")
in→out     2.800 → 4.890  (used span 2.090 s)
event at   ~3.845 s (62.0 % of clip) — the coat completes its lift and the figure takes the first step
           of the new walk, landing at timeline 15.650 s = bar 8.3.
           **KEY-FRAME NOTE (§5.5 "protect the key frame"):** the *revealed state* — full beams up,
           figure centred, glamour legible — must already be present on the shot's FIRST frame
           (f 438), because that frame is what lands on the drop. The 60–70 % event is the coat/step
           beat *inside* the reveal, not the reveal itself. This is the one place the two §5.5 rules
           pull in different directions — logged as **RF-09**.
direction  in · fast  |  prev M4.2 out · slow → **180° OPPOSE on the drop downbeat** (the hardest
           impact join in the piece)
positive   1) FRAMING medium-wide slamming forward, 35mm, camera accelerating in; figure dead-centre
              in the 9:16 column, full-length at the in-point
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — front-on, chin level, coat lifting
              behind on the air, walking directly at the lens; the WRONG SHADOW is now cast forward
              past camera, unmistakable
           3) SETTING every street lamp dead; the only light is a car's full beams from screen-RIGHT,
              hard and white, throwing the figure's silhouette huge on the wet road; steam off the
              asphalt
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim> — key source and key direction CHANGE here and only
              here and at M7.1 (DQ-10)
           5) MOOD + FORMAT TAIL arrival, total ownership of frame; vertical 9:16 1080x1920,
              cinematic, filmic contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, fangs,
           cape flapping, superhero landing, slow motion, lens flare stars, daylight, crowd
aspect     9:16 1080×1920 · seed/identity M5 seed + identity-anchor still · frame ctrl **last frame →
           first frame of M5.2 slice A** (the push continues unbroken across cut 9)
audio cond "on the drop at 2.8 s, everything lights at once and the camera accelerates from a stand;
           one full 100→140 % push every two bars at 114.84 BPM" + 14.617 s window (clip t 8.336→22.953)
```

**M5.2 — [FLOW] "Chorus Walk — Motif"**  covers bars 9.1, 10.1, 11.1 — re-entered per bar  **expected slices: 3**
```
generate   10.4 s (4 bars = 8.360 s + 1.0 s handles) · model Seedance 2.5 (Kling's 10 s ceiling is
           too short) · continuous dolly-in, TEMPO-LOCKED — one full 100→140 % push per 2 bars at
           114.84 BPM → the clip is sliceable on bar lines for free
in→out     slice A 1.000 → 3.078 (cut 9, 2.078 s) · slice B 4.100 → 6.190 (cut 10, 2.090 s) ·
           slice C 7.200 → 9.290 (cut 11, 2.090 s). Source ranges are deliberately NON-contiguous —
           the 1.02 s and 1.01 s gaps are what make each re-entry read as a cut rather than as
           uncut continuity. Scale arc lives inside the clip: medium-wide → medium → close.
event at   n/a — flow clip. Internal sync carries the beats between the three cuts (§5.3: one clip
           containing motion carries 2–4 beats without a cut).
direction  in · fast (all three slices)  |  prev M5.1 in · fast → MATCHES; slices match each other
positive   1) FRAMING continuous dolly-in, 35mm, locked to the walk; figure holds centre of the 9:16
              column while scale tightens across the clip
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — walking straight at lens, unbroken
              stride, no gesture, eyes on lens throughout
           3) SETTING dead street, headlight key from screen-right, steam, standing water throwing the
              beam back up under the coat
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>
           5) MOOD + FORMAT TAIL relentless, unhurried, inevitable; vertical 9:16 1080x1920,
              cinematic, filmic contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, stride
           stutter, foot sliding, camera shake, speed changes, daylight, background pedestrians
aspect     9:16 1080×1920 · seed/identity M5 seed (shared with M5.1) · frame ctrl first frame inherits
           M5.1's last frame; no control between slices (the jumps are wanted)
audio cond "one full camera push every two bars at 114.84 BPM, restarting cleanly on each bar line;
           subject's footfalls land on beats 1 and 3" + 14.617 s window (clip t 8.336→22.953)
```

### Movement M6 — chorus continuation · grid every 1 bar · **2 cuts from 1 shot**

**M6.1 — [FLOW] "The Open Door"**  covers bars 12.1 and 13.1 — re-entered per bar  **expected slices: 2**
```
generate   6.2 s (2 bars = 4.180 s + handles) · model Seedance 2.5
in→out     slice A 1.000 → 3.090 (cut 12, 2.090 s) · slice B 3.590 → 5.680 (cut 13, 2.090 s).
           Non-contiguous by 0.500 s. Slice A is the door; slice B pushes to the hand and the ring.
event at   n/a — flow clip, but the door's swing and the hand's turn are both timed so the MOTION
           ENDS on the bar line (§5.3 motion sync), not begins there
direction  in · med (both slices)  |  prev M5.2 in · fast → direction MATCHES, speed steps DOWN one
positive   1) FRAMING slice A medium, 35mm, gliding past an open passenger door; slice B closer, the
              same glide, racked to a hand on a wheel far back and out of focus
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> + <THE DRIVER descriptor verbatim> —
              the figure enters frame from behind camera-left, walks PAST the open door without
              slowing, and the silver ring catches the interior light for two frames
           3) SETTING a dark car, passenger door standing open, interior black; rain on the roof; the
              beam from its headlights still raking forward past frame
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>
           5) MOOD + FORMAT TAIL an exit offered and declined without comment; vertical 9:16
              1080x1920, cinematic, filmic contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, visible
           driver's face, licence plate, car brand badging, subject getting in, subject hesitating,
           daylight, modern dashboard glow
aspect     9:16 1080×1920 · seed/identity M6 seed + identity-anchor still · frame ctrl none
audio cond "the door is fully open and still by the bar line; the hand completes its turn on the
           following bar line at 114.84 BPM" + 14.617 s window
```

### Movement M7 — chorus turn + button · grid every 1 bar, decelerating internally · **2 cuts from 2 shots**

**M7.1 — [EVENT] "First Light"**  covers bar 14.1 — the release-valve wide  **expected slices: 1**
```
generate   4.2 s (1 bar + handles) · model Seedance 2.5
in→out     1.000 → 3.089  (used span 2.089 s)
event at   ~2.567 s (61.1 % of clip) — the figure stops and turns the face AWAY from the light,
           landing at timeline 28.700 s = bar 14.4 (where a 4f shake is layered on the same transient)
direction  out · med  |  prev M6.1 in · med → **180° OPPOSE on the beat** (the light pushes; the
           camera and the figure both give ground)
positive   1) FRAMING wide, 35mm, camera pulling back and slightly down; the street mouth fills the
              top half of the 9:16 column; the figure is small again for the first time since bar 6
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — walks three paces into the light,
              stops, and turns the face out of it; the shoulders lose their stillness for the only
              time in the piece
           3) SETTING the end of the street opens onto a grey pre-dawn sky; the first cold
              full-spectrum light in the entire reel floods low along the wet road toward camera
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim> — SUNLIGHT AS THREAT: this is the only warm-white/
              cold-white in the piece, and it is the second and final permitted key change (DQ-10)
           5) MOOD + FORMAT TAIL the first thing that has ever cost this figure something; vertical
              9:16 1080x1920, cinematic, filmic contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, sunburst,
           god rays, smoke/steam burn-off VFX, skin burning, panic, running, fangs, hissing
aspect     9:16 1080×1920 · seed/identity M7 seed + identity-anchor still · frame ctrl **last frame →
           first frame of M7.2 — MATCH CUT.** The dark doorway mass at frame-left of M7.1's last frame
           must register exactly onto the silhouette-shaped void M7.2 opens on. Brightness and dominant
           colour matched across the join. This is the piece's only designed transition; it cannot be
           discovered in the timeline (§5.5).
audio cond "the subject walks three paces then stops on the last beat of the bar at 114.84 BPM and
           turns the face away from the light" + 14.617 s window
```

**M7.2 — [EVENT] "Back Into Shadow"**  covers bar 15.1 — **THE BUTTON**  **expected slices: 1**
```
generate   4.6 s (1 bar = 2.090 s + 1.0 s pre-handle + 1.5 s post-handle — the post-handle is
           oversized on purpose to serve the freeze-extend option in DQ-13) · model Seedance 2.5
in→out     1.000 → 3.102  (used span 2.102 s)
event at   ~3.067 s (66.7 % of clip) — **THE BUTTON.** The figure's last edge is absorbed by the black
           and the frame is empty, landing on timeline 31.289 s = f 939 = the emitted weight-1.0 kick
           that carries the title word. This is a PROTECTED KEY FRAME (§5.5), not a cut.
direction  out · med  |  prev M7.1 out · med → MATCHES exactly (match-cut flow join)
positive   1) FRAMING medium, 35mm, continued pull-back; the black doorway/void occupies frame-left and
              grows across the 9:16 column as the figure walks backward into it
           2) SUBJECTS+IDENTITY <CAST IDENTITY BLOCK verbatim> — walking BACKWARD, eyes still on lens,
              still level, still unhurried; the dawn rises on the abandoned street behind
           3) SETTING dawn grey #B9C2CC filling the street; the figure recedes into a shadow that does
              not have a light source; the wrong shadow is the last thing to disappear
           4) LOOK-LOCK <LOOK-LOCK BLOCK verbatim>
           5) MOOD + FORMAT TAIL withdrawal, not defeat; vertical 9:16 1080x1920, cinematic, filmic
              contrast, photoreal
negative   inconsistent face, wrong wardrobe, static frame, extra fingers, text, watermark, dissolve,
           dust/ash disintegration, VFX vanish, jump scare, turning to run, sunrise flare, end card
aspect     9:16 1080×1920 · seed/identity M7 seed + identity-anchor still · frame ctrl first frame
           inherits M7.1's last frame (match cut); **out at f 940**
audio cond "the subject walks backward for one bar at 114.84 BPM and the frame is empty exactly on
           the final downbeat" + 14.617 s window
```

---

## GENERATION INDEX

| Movement | cuts | shots | event / flow | slices supplied | model(s) |
|---|---|---|---|---|---|
| M1 | 1 | 1 | 0 / 1 | 1 | Kling |
| M2 | 2 | 2 | 1 / 1 | 1 + 1 | Seedance 2.5, Kling |
| M3 | 2 | 2 | 1 / 1 | 1 + 1 | Seedance 2.5, Kling |
| M4 | 2 | 2 | 1 / 1 | 1 + 1 | Kling, Seedance 2.5 |
| M5 | 4 | 2 | 1 / 1 | 1 + **3** | Seedance 2.5 ×2 |
| M6 | 2 | 1 | 0 / 1 | **2** | Seedance 2.5 |
| M7 | 2 | 2 | 2 / 0 | 1 + 1 | Seedance 2.5 ×2 |
| **TOTAL** | **15** | **12** | **6 / 6** | **15** | Seedance 2.5 ×8, Kling ×4 |

**The three numbers (§5.5), never one:**

| | value | note |
|---|---|---|
| `total_cuts` | **15** | |
| `unique_shots` | **12** | |
| `generations` | **15 video** | 12 unique shots + a **20 %** regeneration allowance (2.4 → **3**), the top of §5.5's 15–20 % band. See DQ-14 — the walk-dominant format argues for more than the band permits. |
| identity plate | **+1 image** | the Soul-ID anchor still, generated first and referenced by all twelve |
| **billable calls** | **16** | 15 video + 1 image |
| `total_cuts ÷ unique_shots` | **1.25×** | §5.5 states this blend "averages ~3–4×" for a 3.5-minute piece. At 31 s it is structurally unreachable: 3.5× would mean **4 unique images** carrying the whole reel. Logged as **RF-10**. |
| credit estimate | **NOT COMPUTABLE** | §4 Pass 4 and §5.5 both require a cost; the rule file publishes **no credit rates** for Seedance 2.5, Kling, Runway or Pika, and none were supplied. See **DQ-14**. |

**Slice-mix vs §5.5's per-piece plan.** §5.5 budgets ~15–20 event clips, ~15 connective flow clips and ~9–12 reused chorus motifs — figures calibrated for a 3.5-minute piece of 150–200 cuts. Scaled to 31.3 s this piece runs **6 event / 5 connective / 1 reused motif (M5.2, 3 slices)**, roughly a 1/7 scaling. Reported for transparency; the absolute numbers in §5.5 are not applicable at this runtime (**RF-10**).

**Audio-conditioning window (§5.5).** All eight Seedance generations are fed the **same 14.617 s window: clip t 8.336 → 22.953** (7 bars, build → collapse → drop → chorus). Never the full clip and never the full track — §5.5 warns that full uploads default to the rhythmically weak intro.

**Motion audit (§5.5 "every shot must contain motion").** All 12 shots carry camera motion; none is a static frame. Slowest is M4.2, and even there the camera pulls back through the stop.

**Direction/speed adjacency audit (§5.5 — no accidental 90° change).**

| cut | shot | direction · speed | join to previous |
|---|---|---|---|
| 1 | M1.1 | in · slow | — |
| 2 | M2.1 | in · med | match dir, +1 speed ✓ |
| 3 | M2.2 | in · med | match ✓ |
| 4 | M3.1 | in · med | match ✓ |
| 5 | M3.2 | in · med | match ✓ |
| 6 | M4.1 | in · slow | match dir, −1 speed ✓ |
| 7 | M4.2 | **out** · slow | **180° oppose on the beat** ✓ |
| 8 | M5.1 | **in** · fast | **180° oppose on the drop** ✓ |
| 9–11 | M5.2 a/b/c | in · fast | match ✓ |
| 12–13 | M6.1 a/b | in · med | match dir, −1 speed ✓ |
| 14 | M7.1 | **out** · med | **180° oppose on the beat** ✓ |
| 15 | M7.2 | out · med | match ✓ |

**0 accidental 90° changes. 3 designed 180° opposes, all on beats.** §5.5 defines the oppose rule on *direction* and is silent on what speed should do across an oppose; all three of ours also change speed, which is deliberate — logged as **RF-12**.

---

## DIRECTOR QUESTIONS — PASS 4
*★ = recommended default, which is what this file is written against.*

**DQ-12 — Lip sync is required by the format but this look fails §5.5's eligibility test.** §5.5 lists eligibility as: frontal/near-frontal ✓, stable head ✓, close/medium-close framing ✓, sharp focus ✓, **and even lighting ✗**. The proposed look-lock is a single hard key with crushed blacks — the opposite of even lighting. Meanwhile the whole trend rests on these two lines.
- ★ **(a)** Break the look for two shots only: +1 stop soft bounce on the shadow side of M2.1 and M3.1. Costs internal consistency (§5.5 says hold lighting constant within a section) and buys two usable lip-sync shots. **This is what is written.**
- (b) Keep the look pure, accept the lip-sync failure risk, and apply §5.5's fallback when it doesn't land: *cut, don't regenerate blind* — frame the mouth out, back-of-head staging, or an off-beat cutaway.
- (c) One lip-sync shot only (line A). Halves the risk; weakens the trend read.
- (d) Post-pass specialist lip-sync (§5.5 execution order step 2) on a stylized still, so the generation keeps the hard key.

**DQ-13 — The button lands 1 frame before picture out.** The title word sits on f 939 and the audio runs to f 940. There is no post-roll for the button to register, and IG loops the reel straight back into a wide night street.
- ★ **(a)** Extend picture **12 frames (0.40 s)** past the audio out with a freeze on f 939. The oversized post-handle on M7.2 already covers it. Deliberately outside the audio clip's bounds, so it needs your call.
- (b) Hard out at f 940, flush with the audio. Cleanest loop, weakest button.
- (c) Move the button to the D-STRUCT literal 31.05 s (f 932), leaving 8 frames of hold inside the audio.

**DQ-14 — Credit ceiling and rates.** §4 Pass 4 makes the go here the credit gate and requires a cost; the rule file publishes no rates. I need: per-generation credit cost for **Seedance 2.5 (Higgsfield)** at 4.2 / 4.6 / 6.2 / 10.4 s, for **Kling** at the 5 s tier, and your **ceiling**. Separately: §5.5 caps the regeneration allowance at **15–20 %**, but §5.5 also warns that *"walking, dancing, turning and prop interaction are where AI video fails most visibly"* and says to **confine those demands to the event shots and generate extra takes for them**. This piece is a walking reel — **all twelve shots** carry a walk. The band and the warning are incompatible here (**RF-13**).
- ★ **(a)** 20 % allowance → 15 video generations, and accept re-rolls out of contingency if the walk cycles fail.
- (b) Override the band to 50 % → 18 video generations, budgeted up front for the six most walk-critical shots (M2.1, M3.1, M5.1, M5.2, M7.1, M7.2).
- (c) Restage as camera-toward-a-static-subject to satisfy §5.5 — which destroys the trend format and is not recommended.

**DQ-15 — Are the minted cast descriptors locked?** With no Bible, the CAST IDENTITY block is my invention. §2.2 would normally forbid me authoring it at all. Nothing should be seeded until you lock it, because the identity anchor propagates into all twelve generations.
- ★ **(a)** Lock as written; I generate the identity plate first and send it for approval before any video.
- (b) You rewrite the descriptors; I re-issue the block and re-run Pass 4.
- (c) Cast from an existing reference image you supply; the descriptors become captions for it.

**DQ-16 — Literal-sync ledger.** §5.3 caps literal/lyric sync at *"the hook's first syllable plus a handful of designed moments"* and calls literal illustration the #1 amateur tell — while the trend format is two full lines of lip-sync. My reading: the two lip-sync shots are governed by §5.5's separate 2–4 cap (which explicitly says it is *"independent of the §5.3 literal-lyric cap"*), leaving **2** literal moments under §5.3 — first light on the "sunlight" line, and the button on the title word. The car imagery is displaced ~3 s past its word on purpose.
- ★ **(a)** Accept: 2 lip-sync (§5.5) + 2 literal (§5.3). Confirm this reading of the two caps.
- (b) Drop the "first light" literalism and let the turn be purely a lighting change → 1 literal moment.
- (c) Treat all four as literal against a single cap → over budget; would require dropping one lip-sync line.
