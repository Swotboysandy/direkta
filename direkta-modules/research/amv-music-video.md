# AMV / Music Video Module — Research

Definitive research dossier for the Direkta AMV / music-video module. Synthesised from three researcher passes: (a) AMV & music-video editing craft, (b) beat-sync technical craft (shared engine, also used by trailer/montage modules), (c) music-analysis tooling. Written to be distilled into an agent skill rule-file — §9 is the payload; §1–§8 are the justification and the numbers the rules depend on.

**Confidence tags used throughout:** `[M]` measured/quantitative source · `[P]` practitioner rule-of-thumb corroborated across multiple sources · `[S]` single or weak source, treat as heuristic · `[D]` derived arithmetic (checkable).

---

## 1. Format landscape

### 1.1 What it is

A music video is picture cut **to** a fixed audio timeline. This inverts the normal post-production order: the audio edit is finished before picture is touched, and the song's architecture — not a screenplay — supplies the act structure. "Some projects, such as music videos, will start with the audio edit, as the composition needs to be timed to the music." ([Frame.io](https://workflow.frame.io/guide/))

An **AMV** (Anime Music Video) is the fan-editing tradition of the same form: pre-existing animation re-cut to a chosen track. Origin: **1982, Jim Kaposztas** cut *Star Blazers* to The Beatles on two VCRs (recreated 1984 after the tape was damaged). Mid-'90s convention contests formalised it; early-2000s `animemusicvideos.org` + DVD rips + BitTorrent + Windows Movie Maker produced the "golden age"; *AMV Hell* established the gag-compilation subgenre; 2010s–20s migration went YouTube → TikTok/Reels-native vertical "anime edits" (velocity/shake/phonk aesthetics). ([sabukaru](https://sabukaru.online/articles/visual-remix-culture-the-legacy-of-amv), [Wikipedia](https://en.wikipedia.org/wiki/Anime_music_video), [Fanlore](https://fanlore.org/wiki/Anime_Music_Video))

For Direkta the AMV lineage matters more than the commercial-MV lineage, because **AMV editors work with footage they did not direct** — exactly the position an AI-generation pipeline is in when a generated clip comes back not quite as prompted. The AMV craft vocabulary (internal sync, flow, masking, source-hunting) is the closest existing discipline to "edit what the model gave you."

### 1.2 The three video modes

1. **Performance** — artist performs in a defined space. Coverage: **4–6 framings minimum per setup** (wide/master, medium, close-up, detail — hands/mouth/eyes, profile or ¾). The structural backbone; narrative is "garnish."
2. **Narrative** — story-driven, film-like. Plot beats must be placed on section boundaries so story cuts land musically.
3. **Concept** — abstract, texture/mood, no plot. Lives or dies on rhythm and image invention (Gondry lineage: one-shot, split-screen, in-camera trickery).

Most real videos are hybrids. Multiple locations/looks is the standard escalation lever. ([Storybirdie](https://storybirdie.com/blog/how-to-storyboard-a-music-video), [BRAEID Music Video Masterclass](https://www.braeid.com/article/music-video-masterclass), [Sound on Sound](https://www.soundonsound.com/techniques/video-editing-music-promos))

### 1.3 Platforms & audience expectations

| Platform | Expectation | Spec |
|---|---|---|
| YouTube (standard MV) | Full-song, 3:00–4:30, 16:9 | 1920×1080, H.264 |
| Vevo | Commercial delivery | 16:9 / 1.85:1 / 2:1 / 2.35:1 / 2.39:1 / 2.4:1; .mov or .mp4; 23.976/24/25/29.97/30/48/50/60 fps; H.264 or ProRes; **min 7,500 kbps, 20 Mbps recommended**; no interlacing; 1440p or 2160p native ([Vevo specs](https://support.vevo.com/hc/en-us/articles/360033310854-Music-Video-Specs)) |
| TikTok / Reels ("anime edit") | 7–15 s, vertical, hook in 2–3 s | 9:16, 1080×1920, 1080p60 export |
| AMV convention contest | 1:00–5:00 hard limit; judged on separate technical/sync/flow axes | MP4/MKV/AVI/MPG; **min 1280×720 widescreen or 960×720 fullscreen**; no watermarks or software logos (small corner creator credit allowed); max 2 entries/person, 1 per category; hentai/full nudity/extreme gore = automatic DQ |
| MEP (multi-editor project) | Long track split across **4+ editors**, host-made intro/outro brackets the parts | Host sets resolution/fps/deadline |

AMV contest rules cross-checked at [Otakuthon](https://www.otakuthon.com/2026/en/amv-contest), [ACen](https://www.acen.org/video-programming/amv-contests/), [Anime NYC](https://animenyc.com/applications/amv-contest/), [Delta H Con](https://deltahcon.com/home/a-m-v-contest/), [Anime Expo](https://www.anime-expo.org/activity/amv_competition/), [Kotae Expo](https://kotae.fi/en/program/amv-competition/).

Contest rule worth encoding as a quality gate: *"Entries that require a strange or unusual degree of difficulty to work with shall be considered technically flawed."*

### 1.4 Contest judging axes (= the de-facto rubric)

- **Best Technical** — judged on "the editor's **cuts, effects, flow and audio work**. The video doesn't have to have a story."
- **Best of Show / Best in Competition** — "high-level editing, compelling storytelling or concept and atmosphere."
- **Best Visual Effects / Video Editing.**
- AMV League axes: **Best Concept, Best Technical, Most Rewatchable, Best Flow/Editing, Best Sync, Best Emotion**, each scored **out of 20 points** (raised from 10 so a minor flaw doesn't cost 10% of a category). ([AMV League scoring thread](https://www.animemusicvideos.org/forum/viewtopic.php?t=128179))

Design implication: **sync and flow are scored separately.** An edit can be perfectly on-beat and still fail. Flow is what happens *between* sync points.

### 1.5 Runtimes at a glance

| Form | Duration |
|---|---|
| Commercial music video | 3:00–4:30 (driven by song length; radio/streaming songs cluster 3–4 min) `[P]` |
| MTV-era playlist ceiling | 4–5 min `[P]` |
| AMV contest entry | **1:00–5:00** (hard limit at most cons) `[M]` |
| MEP part (per editor) | one song section, ~15–30 s `[S]` |
| Short-form anime edit (TikTok/Reels) | **7–15 s** `[S]` |
| AMV Hell–style gag | 3–15 s per gag, compiled `[P]` |

([Musician Wave — song length](https://www.musicianwave.com/how-long-should-a-song-be/), [Velocity edits guide](https://thealightmotions.com/velocity-edits-tutorial/))

---

## 2. Anatomy & structure

### 2.1 Song form is the act structure

Canonical modern pop form: **Intro – Verse – Pre-chorus – Chorus – Verse 2 – Pre-chorus – Chorus – Bridge – Final Chorus – Outro** (ABABCB). Each section has a distinct visual job:

| Section | Typical length | Visual job | Cut behaviour |
|---|---|---|---|
| Intro | 8–16 bars (~15 s) | Establish world + sonic palette; plant the hook | Slow-in, accelerate into V1 |
| Verse | 16 bars (~30 s) | Narrative/context; "room to breathe" | Cut **every bar or two** (4–8 beats) |
| Pre-chorus | 4–8 bars | Escalation ramp; tighten scale, add motion | Halve shot length progressively |
| Chorus | 16 bars (~30 s) | Emotional payoff, the "wow" image | Cut **every 1–2 beats**; widest coverage variety |
| Bridge | 8–16 bars (~20 s) | Hard reset: new palette, new location, new energy | **4+ bar holds**, slowest ASL in the piece |
| Drop (EDM) | 8–16 bars | Peak; visual density max | Sub-beat / double-time cutting permitted |
| Outro | 4–16 bars | Resolution; return to the opening image | Decelerate to longest shots |

The rule editors state most consistently: **the "wow" moment lands on the first downbeat of the FIRST chorus, not later.**

Phrase hierarchy: bars group into 4- and 8-bar phrases (4-bar = 16 beats, 8-bar = 32 beats). Most pop is built in 8-bar chunks, so natural stopping points fall on **8, 16, or 32-bar boundaries**. **4-bar phrase = section-transition unit; 8-bar phrase = narrative-arc unit** — a new *idea* should appear every 8 bars, not every bar. ([MusicRadar](https://www.musicradar.com/how-to/song-sections-explained-intro-verse-chorus-middle8-outro-tag-bridge), [Ace Studio](https://acestudio.ai/blog/song-structure-explained/), [Pro Audio Files — phrasing](https://theproaudiofiles.com/phrasing/), [DJing Tips](https://www.djingtips.com/how-to-dj/track-structure/), [ReelMind](https://reelmind.ai/blog/intro-verse-chorus-bridge-outro-songwriting-structure-explained))

### 2.2 Two parallel arcs

Plan these separately, then reconcile:

- **Cut-rate arc** (cuts/min) — steps up at each chorus, resets down at the bridge.
- **Scale/motion arc** — wide+static in V1 → medium+moving in pre-chorus → close+kinetic in chorus.

Chorus 2 must out-escalate Chorus 1 (add a new location, costume, or lighting state). Chorus 3 (post-bridge) is the maximum. **Anti-pattern: flat maximum energy from bar 1** — without a low reference, the chorus reads as nothing.

Empirically, professional videos vary pace **with loudness**: shorter segments when the music is loud, longer when soft. Reported 2024 chart-topper averages: **~3.5 s clip length in choruses vs ~5–6 s in verses** `[M]` — note this is *looser* than the practitioner prescriptions in §2.3, because chart videos average across performance holds: an artist's face or a held scene structurally cannot cut every beat without running out of distinct footage. This is not noise to be reconciled away — it is the **measured band for one video mode** (performance/narrative commercial MV) and coexists with a much faster **prescribed band for another** (AMV/action/short-form). §2.3 gives the selector rule. ([VashiVisuals](https://vashivisuals.com/music-video-editing-stats/), [Sound on Sound](https://www.soundonsound.com/techniques/video-editing-music-promos), [CapCut pacing](https://www.capcut.com/create/music-video-pacing-emotional-montage-rhythm))

### 2.3 Cut density by section — the core dial

| Section | Cut grid | Shot length @120 BPM `[D]` |
|---|---|---|
| Intro | every 2 bars | 4.0 s |
| Verse | every 1–2 bars (4–8 beats) | 2.0–4.0 s |
| Pre-chorus / build | 1 bar → 2 beats → 1 beat (accelerando) | 2.0 → 1.0 → 0.5 s |
| Chorus | every 1–2 beats | 0.5–1.0 s |
| Drop | every beat, with 1–4 sub-beat bursts | 0.5 s, bursts at 0.25 s |
| Bridge | every 4+ bars | 8.0 s+ |
| Outro | decelerate to longest shot in the piece | 4–12 s |

Practitioner shorthand: **~3 s for verses, ≤1 s for choruses, with occasional 2 s "breaths" for clarity.** ([Storybirdie](https://storybirdie.com/blog/how-to-storyboard-a-music-video), [Moozix](https://moozix.com/blog/frame-accurate-editing-rhythms-that-make-your-music-video-pulse-68e7a415ca2ba), [ClipMusic](https://clipmusic.ai/blog/bpm-video-editing-guide))

**Mode selector — which band applies (resolves the §2.2 vs §2.3 gap).** This table's 0.5–1.0 s chorus grid runs **3–7× faster** than §2.2's measured chart-topper corpus (~3.5 s chorus / ~5–6 s verse). Both are correct — for different video modes (§1.2) — and the doc must pick one per project rather than silently shipping the prescription everywhere:

| Video mode | Standard that applies | Why |
|---|---|---|
| **Performance / narrative commercial MV** — artist or actor holds carry the shot; coverage is 4–6 framings per setup (§1.2) | **Measured band, §2.2:** ~3.5 s chorus, ~5–6 s verse | Structurally footage-limited — you cannot cut every beat on a finite set of performance takes without repeating awkwardly |
| **AMV, action-cut, and short-form vertical edit modes** — clips are plentiful (sourced from an existing show, or generated on demand), and the mode is judged explicitly on cut density (§1.4: "Best Technical" = *cuts*, effects, flow) | **Beat-grid prescription, §2.3/rule 7:** chorus every 1–2 beats, verse every 1–2 bars | Not footage-limited; the grid, not the coverage, sets the pace |

Resolve at the sync-map stage (§7 step 3), before any clip length is committed — clip length (§8.3) and generation count (§8.2) both depend on which band was selected. Rule 8 gives the acceptance check once cutting is done.

### 2.4 Measured ASL benchmarks

| Content | ASL | Cuts/min `[D]` |
|---|---|---|
| Music video, MTV norm (30+ yrs) | **1.0–2.0 s**, ~1.2 s cited as house style | 30–60 |
| MTV VMA nominee sample | **median ASL 1.6 s; 63.23% of videos ≤ 2.0 s** | ~37 |
| "Slow" music video (now rare) | 3–5 s | 12–20 |
| Extreme strobe-cut video | as low as **0.3 s** | 200 |
| Modern feature film | ~2.5 s (vs ~12 s in 1930) | ~24 |
| Action feature | — | 10–15+ |
| Art film | — | 2–4 |
| *Mad Max: Fury Road* | ~2 s | ~30 |

([FILM-SHOT-COUNTER database](https://www.academia.edu/41152064/FILM_SHOT_COUNTER_A_Database_for_Quantitative_Analysis_of_Cinema_Shot_Counts_and_Average_Lengths_UPDATED_11th_FEBRUARY_2025_), [VashiVisuals](https://vashivisuals.com/music-video-editing-stats/), [HardMatte metrics](https://www.hardmatte.com/info/metrics), [Cinemetrics](http://www.cinemetrics.lv/), [Filmmakers Academy — ASL](https://www.filmmakersacademy.com/glossary/average-shot-length-asl/))

**Methodological caveat to encode:** Nick Redfern (*Wide Screen* 9.1, 2022) argues **ASL is not a measure of cutting rate**; cutting rate = cuts ÷ time (CPM), and shot-length distributions in fast-cut media are heavily right-skewed, so **median shot length + CPM** describe an edit better than ASL. For an AI director: **do not target a mean — target a per-section grid.** ([Redfern PDF](https://widescreenjournal.org/wp-content/uploads/2022/08/formatted-cutting-rates.pdf))

### 2.5 Shot-count budgets — the economics insight

- 3.5-minute video: **40–60 unique shots** (distinct setups/clips), of which **15–20 are "designed" key moments** worth boarding.
- 30-second chorus at fast cutting: **8–12 distinct setups**, reused/intercut to fill ~30–60 cuts.
- 30-second verse at medium cutting: **~4 setups**.

**Cuts ≫ shots.** A chorus with 60 cuts uses ~10 unique clips re-entered at different in/out points. **"Shots" here always means unique setups, never cuts** — the two numbers differ by 3–7× and must be tracked separately (§8.2 works the full arithmetic for a reference track and names all three quantities: total cuts, unique shots, and generations). This is the single most important economics fact for AI generation. ([Storybirdie](https://storybirdie.com/blog/how-to-storyboard-a-music-video))

### 2.6 Aspect ratios & frame-rate hygiene

- Two working frame rates dominate AMV work: **23.976/24 fps** and **29.97 fps**. Telecined 29.97 anime must be **IVTC'd back to 23.976** — a telecine cycle is 5 frames reduced to 4.
- **Do not deinterlace telecined content.** Deinterlacing splits frames into fields and interpolates, "throwing out half the vertical resolution." Field-matching (IVTC) reconstructs the original progressive frames losslessly. Deinterlace only when post-processing has broken the pattern.
- **Disable resampling/frame-blending** in the NLE when mixing sources; blended frames on a beat cut look like mud.
- Mixed-source projects must be conformed to **one project frame rate and one aspect ratio** before editing; letterbox/pillarbox rather than stretch; crop to a common ratio, or masked/blurred side-fill for vertical delivery.
- Anime is animated **on 2s or 3s** (≈12 fps or ≈8 fps of unique drawings) inside a 23.976 container. Consequence: interpolation tools need the *animation* rate (**23.976/3 ≈ 8 fps**, **23.976/2 ≈ 12 fps**), and internal-motion sync targets land on drawing changes, not container frames.

([Doom9 IVTC tutorial](https://www.doom9.org/ivtc-tut.htm), [Wobbly telecine primer](https://wobbly.encode.moe/gettingstarted/primer.html), [Crows AMV Team — FPS basics](https://crowsamvteam.forumotion.com/t162-amv-basics-some-minor-fps-talk-disable-resample-deinterlacing-23fps-29fps-vfr-constant), [AMV.org Twixtor thread](https://www.animemusicvideos.org/forum/viewtopic.php?t=120400))

---

## 3. Hooks

### 3.1 The retention numbers `[S]` — directional, creator-blog sourced

- **~20% of viewers leave inside 10 s** if the opening fails; some creator-side measurements put total early drop as high as 70%.
- Diagnostic thresholds: **<50% retention at 0:10–0:15 = the hook is broken**; **>70% = solid**; **>80% = exceptional**.
- A **pattern interrupt within the first 5 s** correlates with **+23% retention**; an **open loop** (unanswered visual question) with **+32% watch time**.
- **A 3-second logo/title animation costs 8–15% of the audience.**

([Artiphik](https://artiphik.com/blog/the-first-10-seconds-retention-playbook), [Retention Rabbit](https://www.retentionrabbit.com/blog/youtube-hook-strategy-to-keep-viewers-watching), [Videomaker](https://www.videomaker.com/article/c05/18826-how-to-use-the-first-10-seconds-of-your-video-to-hook-your-audience-and-increase-views/))

### 3.2 Conventions by format

**All formats**
- **Cold open on the strongest image, not the establishing shot.** The most striking frame in the whole piece appears inside the first 10 s — as the hook itself, or as a **6–12 frame flash-forward**.
- **Establish the sync contract early.** The audience must learn "this video cuts on the beat" within the first **8–16 bars**, or later hits read as coincidence. One unmistakable hard sync inside the **first 4 bars** is the cheapest way to do it.
- **Silence/black as a pattern interrupt:** **6–12 frames** of black or a freeze immediately before the first downbeat makes that downbeat hit harder.

**Commercial MV**
- **Pre-music cold open** (Cunningham's *Windowlicker* pattern): dialogue / ambience / silence over picture, then the music crashes in — the drop into the track *is* the hook. Budget **4–10 s max** before the first musical event.

**AMV contest**
- Reels are watched by fatigued judges. The **first sync moment** and the **source-quality impression in the first 5 s** dominate scoring perception. Lead with a clean, high-resolution frame and a hard sync.

**Vertical (9:16, TikTok/Reels)**
- Hook window compresses to **~2–3 s**. Open on **motion already in progress** — no ramp-in, no fade-up, no title card.
- Whole-piece runtime **7–15 s** means the structure is: hook (0–2 s) → escalation (2–8 s) → payoff hit (8–13 s). There is no bridge.

---

## 4. Editing grammar

### 4.1 Where the cut goes relative to the beat

| Placement | Effect | Use when |
|---|---|---|
| **Cut 1–2 frames BEFORE the transient** | Reads as *more* on-beat — the eye is slower than the ear, so the new image is already up when the hit lands | **Default** for hard hits, kicks, snares, drops `[P]`, corroborated across guides |
| Cut exactly ON the transient frame | Mechanically correct, occasionally reads a hair late | Slow BPM (<80) / long shots |
| Cut 2–4 frames AFTER | Lag, drag; deliberately weak/dreamy | Ballads, dissolves, drugged/underwater feels |
| Deliberately off-grid (offbeat/syncopated) | "Helps the viewer focus on the content of the shot itself, with a little less focus on the music" | Verses, narrative passages, when the image must be read |
| Micro-nudge ±1–3 frames from the grid | Invisible to viewers; fixes *image* rhythm (entry pose, eye-line) | Final polish pass |

Implementation note: apply the early offset as a **single global phase offset** to the whole beat grid (`cut_offset_frames: -2`), not as per-cut hand adjustment.

**Two technical traps:**
1. **Never snap to waveform peaks.** In a compressed/limited master the visual peak does not sit on the true beat. Derive positions from BPM math or a detector grid.
2. **Hand-tapped markers run 100–250 ms late** relative to true transients (human reaction time). This is the single biggest source of "almost right but drunk-feeling" cuts. Seed the grid from automatic transient/beat detection, never tap-tempo.

([Beat2Cut](https://beat2cut.com/blog/beat-sync-video-editing-complete-guide/), [Tools for Film](https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide), [Bitcut](https://bitcut.app/blog/beat-sync-video-editing), [ClipMusic](https://clipmusic.ai/blog/bpm-video-editing-guide))

### 4.2 Pacing curves — BPM → frame math

```
seconds_per_beat = 60 / BPM
bar_duration_sec = beats_per_bar × (60 / BPM)      // 4/4 → 4 × 60/BPM
frames_per_beat  = (fps × 60) / BPM
```

Frames per beat:

| BPM | 23.976 | 24 | 25 | 29.97 |
|---|---|---|---|---|
| 100 | 14.386 | 14.4 | **15.0** | 17.982 |
| 120 | 11.988 | **12.0** | 12.5 | 14.985 |
| 128 | 11.238 | 11.25 | 11.719 | 14.048 |
| 140 | 10.277 | 10.286 | 10.714 | 12.844 |

**Zero-rounding-error pairings:** 120 BPM @ 24 fps (12 f/beat); 100 BPM @ 25 fps (15 f/beat); 160 BPM @ 24 fps (9 f/beat). Other integer-clean BPMs at 24 fps `[D]`: {60, 72, 80, 90, 96, 120, 144, 160, 180}. At 30 fps: {60, 72, 75, 80, 90, 100, 120, 125, 144, 150, 180}.

**Drift:** 128 BPM @ 24 fps = 11.25 f/beat → naive rounding accumulates **~16 frames (~0.67 s) over 64 beats**. 140 BPM @ 23.976 fps = 10.277 f/beat → **~26 frames (>1 s) over 96 cuts**. Always compute absolute positions (`beat N = round(N × frames_per_beat)`); never chain relative offsets.

Irregular meters: `bar = beats_per_bar × frames_per_beat` (5/4 @ 120 BPM/24 fps = 5 × 12 = **60 frames/bar**).

**Bar-duration table `[D]` — the key table for planning AI clip lengths:**

| BPM | 1 beat | 1 bar (4/4) | 2 bars | 4 bars | 8 bars |
|---|---|---|---|---|---|
| 70 | 0.857 s | 3.43 s | 6.86 s | 13.7 s | 27.4 s |
| 80 | 0.750 | 3.00 | 6.00 | 12.0 | 24.0 |
| 90 | 0.667 | 2.67 | 5.33 | 10.7 | 21.3 |
| 100 | 0.600 | 2.40 | 4.80 | 9.60 | 19.2 |
| 110 | 0.545 | 2.18 | 4.36 | 8.73 | 17.5 |
| **120** | 0.500 | **2.00** | **4.00** | **8.00** | 16.0 |
| 128 | 0.469 | 1.875 | 3.75 | 7.50 | 15.0 |
| 140 | 0.429 | 1.71 | 3.43 | 6.86 | 13.7 |
| 150 | 0.400 | 1.60 | 3.20 | 6.40 | 12.8 |
| 160 | 0.375 | 1.50 | 3.00 | 6.00 | 12.0 |
| 174 (DnB) | 0.345 | 1.379 | 2.76 | 5.52 | 11.0 |

**Half-time / double-time.** Half-time feel (emphasis on 2 and 4 — trap, dubstep, doom): compute the grid at **BPM ÷ 2**. A 140 BPM trap beat edits like 70 BPM — shots ~1.7 s, not 0.43 s. Double-time (driving 16ths, DnB, breakcore): compute at **BPM × 2** for burst passages only. Trap/DnB/dubstep are *written* at 140–175 BPM but *feel* like 70–88 BPM `[P]`, and analysis software "regularly tags half-time genres at the wrong octave: a 170 BPM drum & bass track gets detected at 85, a 140 BPM trap track shows up as 70" ([Mixgraph](https://www.mixgraph.io/tools/half-time-double-time)) — the error runs both directions, so the resolution has to be a signal-side test, not a coin flip against a picture that doesn't exist yet at this pipeline stage (rule 1 runs the beat map before the script).

**Deterministic audio-side octave test (no picture required):**
1. **Backbeat-period test (primary).** Cluster onsets into a low band (<150 Hz, kick candidates) and a mid/snare band (200 Hz–2 kHz, noise-heavy transients), then take the **modal inter-onset interval of the snare-band cluster** (`T_backbeat`). Backbeat placement repeats every **2 felt beats** in both normal time (hits on 2 and 4) and half-time feel (a single hit on felt-beat 3, which is still 2 felt-beats after the previous one) — so the felt beat period is `T_backbeat ÷ 2` regardless of what the autocorrelation tempo detector reported. Compare the derived tempo (`60 / (T_backbeat/2)`) against the detector's `global_bpm`: ratio ≈1 → no correction; ≈0.5 → detector ran double, apply half-time; ≈2 → detector ran half, apply double-time. This is the audio-domain analogue of "metrical profile" octave-error correction used in beat-tracking research ([Beat Tracking Octave Error Identification by Metrical Profile Analysis, ISMIR 2010](https://archives.ismir.net/ismir2010/paper/000019.pdf)).
2. **Onset-density corroboration.** Count low-band onsets per candidate beat cell across the track. A candidate grid averaging well under **~0.5 kick onsets per beat** is almost always the too-fast octave — real kick patterns cluster near 1-per-beat or a clean subdivision even when the pattern is sparse and syncopated.
3. **Genre-BPM prior (fallback only, when signal is too weak for 1–2 — ambient low-percussion passages, low `bpm_confidence`).** Trap (written 130–150 BPM) and dubstep/half-time DnB (written 140–176 BPM) with a sparse, syncopated kick default to half-time, ~65–88 felt BPM ([SampleFocus](https://samplefocus.com/blog/ultimate-guide-to-tempo-and-bpm-the-best-bpms-for-hip-hop-trap-dnb-and-more/), [ZIPDJ](https://www.zipdj.com/blog/what-bpm-is-dubstep)).

**Emit the chosen octave and the rejected alternative as explicit fields** (`resolved_bpm`, `rejected_bpm`, `octave_test`) — see the §5.4 schema. This lets the picture/script stage *override* with visual-energy judgement once shots exist, rather than re-deriving tempo blind at a stage where no picture does.

**Contrast is the point:** the most effective drop is preceded by a half-time or held passage. Never arrive at maximum density having already been there.

### 4.3 Transitions catalog — what, and when

| Technique | What it is | Musical moment it suits |
|---|---|---|
| **Hard cut** | Straight splice | **90% of everything.** Default on every downbeat. |
| **Match cut** | Connects frames by similarity — composition, camera movement, character/object movement, silhouette, even music | Section boundaries (verse→chorus); disguises a location jump so energy carries |
| **Graphic/shape match** | Circle→circle, eye→moon | Bridge entry, conceptual pivots |
| **Whip pan** | Camera pans hard and blurs; next shot begins with matching blur; the two blurs cut as one move | Fast rock/electronic; snare hits; travelling between locations without losing momentum |
| **Smash cut** | Abrupt jump loud/busy → quiet/empty (or reverse) | The bar *after* a drop ends; false ending; comedy AMV punchline |
| **J-cut** (audio leads picture) | Hear the next scene before you see it | Pre-chorus — bring the chorus stem/riser in under the last verse shot |
| **L-cut** (picture leads audio) | Outgoing audio continues over new picture | Outros, dialogue-over-montage, AMV trailer category |
| **Masked / matte transition** | Shape or luma mask wipes one shot into another | Chorus entry, reveals; core AMV/After Effects skill |
| **Luma / glow / light-leak** | Blow out to white through highlights, resolve into the next shot | Key change, chorus lift, emotional peak, memory/flashback |
| **Speed ramp** | Gradual accel/decel of clip speed | Ramp *down* into the bar before a drop, *up* through it. **The cut must land at or just after the return to full speed** |
| **Twixtor / optical-flow slow-mo** | Frame interpolation faking high FPS | Half-time passages, "60 fps" anime edits. Set input framerate to the *animation* rate (23.976/3 ≈ 8 fps on 3s, 23.976/2 ≈ 12 fps on 2s), not the container rate, or it smears |
| **Strobe cut / flicker** | 1–2 frame A/B alternation, **8–24 frames total** | Build peaks, drop entries only. Wrecks measured ASL (can hit 0.3 s) |
| **Invisible / hidden cut** | Cut concealed by whip blur, darkness, a foreground wipe, a textureless surface, or matched movement + digital morph | Fake one-take verses; Gondry aesthetic. Must be **planned in generation, not discovered in post**. Match brightness and texture across the join — dark→light contrast exposes it |
| **Cross dissolve / fade-to-colour** | Standard blend | Slow cinematic tracks; verse→bridge; sentimental AMV |
| **Jump cut (same-axis)** | Time removed inside one framing | Deadpan/comedy; performance-only videos; stutter on vocal chops |

Universal caution repeated in every source: **"Overusing flashy transitions looks amateurish."** Working ratio: **≥85% hard cuts, ≤15% everything else**, with designed transitions concentrated at section boundaries.

([StudioBinder](https://www.studiobinder.com/blog/match-cuts-creative-transitions-examples/), [Filmustage](https://filmustage.com/blog/essential-editing-transitions-explained/), [Plotwit — invisible editing](https://plotwit.com/invisible-editing-techniques/), [4K Shooters — hidden cuts](https://www.4kshooters.net/2022/09/10/how-to-pull-off-a-long-take-with-hidden-cuts/), [Kapwing — speed ramp](https://www.kapwing.com/resources/how-to-use-the-speed-ramp-effect/), [Editors Keys](https://www.editorskeys.com/blogs/news/how-to-edit-music-videos-like-a-pro-sync-techniques-creative-effects-transitions))

### 4.4 Audio-driven effects (transient-triggered, not cut-triggered)

| Effect | Duration | Trigger |
|---|---|---|
| White/black flash frame | 1–3 frames | Kick or downbeat |
| Camera shake / bump | 3–8 frames, decaying | Snare, impact |
| Zoom punch (scale 100→106%) | 4–8 frames, ease-out | Vocal stab, bass hit |
| RGB / chromatic split | 2–5 frames | Glitch hit, snare-roll end |
| Speed ramp down→up | 12–24 frames | Riser into drop |
| Strobe cut (1–2 frame A/B) | 8–24 frames total | Build peak, transition into drop |
| Light leak / glow bloom | 8–16 frames | Chorus entry, key change |

**Build pattern:** place quick cuts, flashes, or zooms on pre-drop peaks in **halving chunks — 2 bars → 1 bar → 2 beats → 1 beat → drop.** ([Splice](https://spliceapp.com/blog/best-video-editor-for-beat-drops-1/), [Editors Keys](https://www.editorskeys.com/blogs/news/how-to-edit-music-videos-like-a-pro-sync-techniques-creative-effects-transitions), [Velocity edit tutorial](https://thealightmotions.com/velocity-edits-tutorial/))

---

## 5. Music & sound integration

### 5.1 Accent hierarchy — which hits deserve a cut

Cut weight, strongest to weakest:

1. **Non-metrical sound-design "hit"/"boom"** (trailer tier — sub-bass stinger, riser payoff, whoosh landing). Overrides the musical grid entirely for the single most important moment. `weight 1.0, non_metrical: true`
2. **Kick / downbeat (beat 1)** — foundational anchor; "cutting on a downbeat will almost always lead to a seamless transition." Reserved for scene changes, reveals, title cards, biggest shot-scale jumps. `weight 1.0`
3. **Lyric-hook onset** — first syllable of the hook functions like a downbeat; forced cut/effect point regardless of the grid. `weight ~0.85`
4. **Snare / backbeat (beats 2 & 4)** — secondary accent, "punchy." Best used for **effects** (flash, shake, zoom pop) rather than cuts. `weight 0.6`
5. **Hi-hat / 8ths / 16ths** — texture. Too dense to cut on; drives internal motion, camera pushes, mask reveals, graphic pops. Cuts here only inside a drop. `weight 0.2`
6. **Sustained/tonal material** — never a cut point; this is what you cut *through*.

A **transient** is the short, high-amplitude attack at the start of a sound — "usually very short but contains a lot of energy" and "responsible for much of the perceived impact." Beat detectors listen for exactly this. ([Whipped Cream Sounds](https://www.whippedcreamsounds.com/what-are-transients-in-music-why-are-they-important-explained/), [SoundCy](https://soundcy.com/article/what-is-a-transient-sound), [Mystic Alankar](https://mysticalankar.com/blogs/blog/hi-hat-and-snare-patterns-a-guide-for-beatmakers), [Audible Genius](https://audiblegenius.com/blog/the-roles-of-the-kick-snare-and-hi-hat-in-a-drum-pattern), [No Film School](https://nofilmschool.com/how-to-edit-trailer-music), [Derek Lieu](https://www.derek-lieu.com/blog/2018/1/6/what-im-thinking-when-i-edit-a-trailer))

### 5.2 Sync types — the AMV community's central taxonomy

> **Internal sync**: "synchronization that happens within a scene, such as a punch hitting someone on the beat (as opposed to doing a scene change). Internal sync is useful because a single scene can be used to sync multiple beats without the need to constantly cut to a new one." — [AnimeMusicVideos.org](https://www.animemusicvideos.org/forum/viewtopic.php?t=129162)

Strongest to weakest:

1. **Impact sync** — a punch/impact/explosion lands on the transient. Strongest; **no cut needed**.
2. **Cut sync** — the shot change lands on the transient.
3. **Motion sync** — a head turn, whip pan, step, or camera hit lands on the beat. Rule of thumb: **"think about where the motion *ends*, not where it starts — the landing is what the viewer feels."**
4. **Effect sync** — flash / shake / zoom / RGB split on the beat. Adds a rhythmic accent **without spending a cut**.
5. **Lyric (literal) sync** — image illustrates the word ("fire" → fire). *"If you say it, show it."* **Risk: literal-sync overuse is the #1 amateur tell in AMV critique.**
6. **Lip sync / "lip flap"** — the character appears to sing the lyric. High-effort, high-reward; masking is used to *stop* a mouth moving when it shouldn't in **source footage**. For AI-generated shots, masking doesn't apply — see §8.7 for how a singing shot is actually produced, and rule 39 for the per-piece cap.
7. **Microsync** — sub-beat detail (hi-hat → blink; synth arp → sparkles).

**Mickey Mousing** is the scoring-world name for beat-for-beat action matching; trailer/promo editors deliberately vary how tightly they Mickey-Mouse to avoid monotony.

**Flow** = "the progression of clips throughout the AMV — hard to categorize but pleasing when done well." It is matched direction of movement, matched compositional weight, continuity of colour and energy — everything *between* sync points. Contests award **BEST FLOW/EDITING** and **BEST SYNC** as separate prizes. ([amv.tools glossary](https://amv.tools/resources/glossary), [WeVideo glossary](https://www.wevideo.com/glossary/sync), [Movavi](https://www.movavi.io/syncing-audio-and-visuals-to-create-engaging-videos/), [Opus](https://www.opus.pro/blog/best-ai-beat-sync), [Manga Wiki](https://manga.fandom.com/wiki/Anime_music_video))

### 5.3 Restraint and budgeting

"Not every beat needs a cut. Some of the most powerful moments in a music-driven edit come from holding a single shot across multiple beats, then cutting right on a big downbeat after a build-up or silence." Cutting on every detected beat "usually feels frantic."

**Two-tier cutting strategy:** bar-length cuts (every 4 beats) for verses/builds ("calm, comfortable pacing"), collapsing to beat or half-beat cuts (every 1–2 beats) only at choruses/drops/payoffs. **"The strongest edits shift between the two: bars for the build, beats for the payoff."** ([Tools for Film](https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide), [Creative COW discussion](https://creativecow.net/forums/thread/music-videos-edit-to-the-beat-or-lyrics-2/))

### 5.4 The beat map — required input artifact

A usable beat map contains:

1. Global and segment-local **BPM** with confidence, plus an explicit half/double-time ambiguity flag.
2. **Beat times**, frame-quantised.
3. **Downbeats** (bar-1 subset) with meter.
4. **Section boundaries + labels + energy (0–1)**.
5. **Notable non-metrical transients** (riser payoff, ad-lib, scratch, stinger) — these often outrank ordinary beats.

Reference schema (flattened so the downstream agent never does meter math):

```json
{
  "track_id": "string", "duration_sec": 187.42,
  "global_bpm": 128.0, "bpm_confidence": 0.93,
  "tempo_octave": {
    "resolved_bpm": 70, "rejected_bpm": 140,
    "test": "backbeat_period | onset_density | genre_prior",
    "backbeat_interval_sec": 1.714
  },
  "tempo_stability": "stable | drifting | rubato",
  "time_signature": [4, 4], "fps": 24, "cut_offset_frames": -2,
  "beats": [{ "t": 0.469, "index": 1, "position_in_bar": 1, "is_downbeat": true, "confidence": 0.97 }],
  "downbeats": [0.469, 2.344, 4.219],
  "sections": [
    { "label": "intro",  "start": 0.0,  "end": 14.06, "bars": 8, "energy": 0.22,
      "rms_mean": 0.08, "instrumentation": ["synth_pad","kick_sparse"], "target_avg_shot_sec": [4.0, 6.0] },
    { "label": "chorus", "start": 46.9, "end": 65.6,  "bars": 8, "energy": 0.91,
      "rms_mean": 0.34, "instrumentation": ["full_mix","vocal_hook"], "target_avg_shot_sec": [0.5, 1.2] }
  ],
  "onsets": [
    { "t": 46.9,  "type": "downbeat", "weight": 1.0 },
    { "t": 47.37, "type": "snare",    "weight": 0.6 },
    { "t": 47.58, "type": "hihat",    "weight": 0.2 },
    { "t": 45.1,  "type": "riser_payoff", "weight": 1.0, "non_metrical": true },
    { "t": 46.9,  "type": "lyric_hook_onset", "word": "run", "weight": 0.85 }
  ]
}
```

**Cut-list generation logic from this map:**
1. **Budget cuts per section**, not per beat: `n_cuts = round(section.duration_sec / avg(target_avg_shot_sec))`.
2. **Rank candidate sync points** by `weight` descending, restricted first to `is_downbeat=true` or `weight ≥ 0.6`; only spill into hi-hat/subdivision onsets if the budget exceeds high-weight candidate count.
3. **Select top-N**, enforcing minimum spacing ≥ 1 beat (`60/bpm` s) so cuts don't cluster.
4. **Assign shots**: hero/reveal shots → downbeats and `non_metrical` hits; story/action beats → `lyric_hook_onset`; connective/B-roll → remaining bar-level downbeats.
5. **Apply `cut_offset_frames`** to every timestamp, quantised to the nearest frame at target `fps`.
6. **Insert deliberate holds**: where `energy` drops sharply vs the previous section (bridge/breakdown), cut the budget by **~50%** and prefer motion-sync over cut-sync.
7. **Trailer-mode override**: a `non_metrical` `weight 1.0` hit near a title-card/hero-reveal shot always wins the slot over the musical grid.

### 5.5 Detection tooling — what the beat map comes from

Pipeline shared by all libraries: `raw audio → onset/novelty function → periodicity estimation (tempo) → beat phase-locking → downbeat/meter tracking → structural segmentation`.

| Tool | Gives | Cost / caveat |
|---|---|---|
| **librosa** (ISC) | tempo (single global value), beat times, onsets, RMS energy. `onset_strength()` = spectral-flux from mel-spectrogram, `hop_length=512` (~23 ms @ 22050 Hz); `beat_track()` = onset envelope → autocorrelation tempo → dynamic-programming beat picking (`start_bpm=120`, `tightness=100`) | **No downbeats. No sections.** Assumes one steady tempo; degrades on rubato. Trivial install |
| **beat_this** (MIT, CPJKU, ISMIR 2024) | beats **+ downbeats** via transformer, no DBN postprocessing | No BPM output — derive from beat spacing. `pip install beat-this`, CPU-fine. **Best-maintained downbeat option today** |
| **madmom** (BSD-ish) | beats, downbeats, onsets, tempo, key, chords. `RNNDownBeatProcessor` outputs P(beat)/P(downbeat) at **100 fps**; `DBNDownBeatTrackingProcessor(beats_per_bar=[3,4], fps=100)` resolves position-in-bar via HMM | **Liability.** Last PyPI release **0.16.1, Nov 2018**; chronic NumPy/Cython ABI breakage. ([arXiv:1605.07008](https://arxiv.org/abs/1605.07008)) |
| **allin1** (MIT) | the only library giving **labeled sections** (intro/verse/chorus/bridge/outro) + bpm + beats + downbeats + beat_positions in one JSON | Heaviest: PyTorch + NATTEN + madmom. Repo stale (last push 2024-05-09). MP3 decoder timing-offset quirk — **use WAV for frame-accurate work** |
| **Essentia** (AGPL-3.0) | `RhythmExtractor2013` (`multifeature` = accurate/slow, `degara` = fast) → BPM, beat times, **per-beat confidence** | **No downbeat algorithm.** AGPL is a real constraint for a commercial product; arm64 gaps reported |
| **aubio** (GPL) | onsets (`hfc` default, also `energy/complex/phase/specdiff/kl/mkl/specflux`), tempo (`specflux`), pitch. Real-time capable | Older/simpler; not used for downbeats or sections |
| **demucs** (MIT) | stem separation — preprocessing aid to isolate drums before beat-tracking a dense mix | Stock PyTorch is CPU-only on Apple Silicon; `demucs-mlx` (~73× realtime) / `mlx-demucs` (34× on M4 Max) are fast forks |

**Segmentation methods:** self-similarity matrix (SSM) over chroma/timbre + **Foote novelty curve** (2000) for boundaries — implemented in **MSAF** (Nieto & Bello 2016); newer **Correlation Block-Matching (CBM)** DP segmentation; supervised chorus detection via **CNN multi-task learning** (boundaries + chorus/non-chorus). Generic SSM finds *that* a change happened, not *what kind*.

**Accuracy ceiling `[M]`:** top systems reach **~86.4% Accuracy2** on raw GiantSteps annotations, **~94.0%** after crowd-corrected annotations; accuracy on the high-tempo-variability SMC dataset improves **+18.4 percentage points** when restricted to stable-tempo tracks. Jive/Quickstep/Viennese Waltz (30% of Ballroom, all high-BPM) concentrate most octave errors. Metrics: **F-measure at ±70 ms tolerance**; **Accuracy1** = within 4% of ground truth; **Accuracy2** = within 4% *or* a 2×/3×/½×/⅓× octave multiple.

**Hosted APIs are all dead ends:** Spotify killed `audio-features`/`audio-analysis` on **2024-11-27** (403 for new apps, no replacement); AcousticBrainz shut down **2022-02-16**; Cyanite (€290/mo) gives 15-second-bucket mood/energy tags, **no beat grid**; Musiio/Bridge.audio give a single BPM value; GetSongBPM only covers catalogued commercial tracks. **No hosted API replaces local signal analysis for frame-accurate beat matching.**

**Recommendation for Direkta:** a **custom `skills/music-analysis/` skill** — Python CLI (`librosa` for tempo/beats/RMS + `beat_this` for downbeats; `allin1` only if labeled sections justify the PyTorch/NATTEN cost), invoked via Bash at authoring time, output cached to `analysis/<track-id>.json`. Heavy native Python has no place in a Vercel serverless function. For in-app client-side needs, `essentia.js` (WASM, but AGPL) or `realtime-bpm-analyzer` (TS, zero-dep, ±1–2 BPM on steady beats). Do not adopt `hugohow/mcp-music-analysis` — real and maintained, but librosa-only, so no downbeats and no sections.

NLE-side references: DaVinci Resolve **"Show Music Beats"** (AI Detect Music Beats) auto-drops beat markers, struggles on ambient/rubato; Premiere **Essential Sound** BPM detection, or **BeatEdit** (aescripts) which writes sequence+clip markers and supports Automate to Sequence; FCP has no first-party detector. Professional editors treat **Logic/Ableton tempo analysis as the authoritative BPM source**.

([librosa beat_track](https://librosa.org/doc/0.11.0/generated/librosa.beat.beat_track.html), [librosa dynamic beat example](http://librosa.org/doc/0.11.0/auto_examples/plot_dynamic_beat.html), [madmom downbeats](https://madmom.readthedocs.io/en/v0.16/modules/features/downbeats.html), [beat_this](https://github.com/CPJKU/beat_this), [allin1](https://github.com/mir-aidj/all-in-one), [BeatNet](https://github.com/mjhydri/BeatNet), [Essentia](https://essentia.upf.edu/algorithms_reference.html), [aubio CLI](https://aubio.org/manual/latest/cli.html), [Foote novelty](https://www.researchgate.net/publication/3863771_Automatic_audio_segmentation_using_a_measure_of_audio_novelty), [CBM](https://transactions.ismir.net/articles/10.5334/tismir.167), [chorus CNN](https://arxiv.org/pdf/2103.14253), [Tempo Estimation: Are We Done Yet?](https://transactions.ismir.net/articles/10.5334/tismir.43), [MIREX beat tracking](https://www.music-ir.org/mirex/wiki/2019:Audio_Beat_Tracking), [Resolve beat detector](https://jayaretv.com/edit/davinci-resolve-ai-beat-detector-explained/), [BeatEdit](https://aescripts.com/beatedit-for-premiere-pro/), [hugohow/mcp-music-analysis](https://github.com/hugohow/mcp-music-analysis))

### 5.6 Sound design beyond the track

- **Pre-music cold open** needs its own designed audio: ambience, dialogue, or foley, ending on the first musical event.
- **Silence is an effect.** 6–12 frames of dropout before a downbeat is a legitimate transient in its own right.
- **J-cut the chorus stem** in under the last verse shot — an audio-side transition that costs no picture.
- Non-metrical stingers (whoosh, sub-boom, riser payoff) are the *only* sound events allowed to override the musical grid, and only for the piece's single most important reveal.

---

## 6. Genre / mood variations

### 6.1 AMV subgenre taxonomy (from convention contest categories — these ARE the genre labels)

| Category | Definition (near-verbatim from con rules) | Musical fit |
|---|---|---|
| **Action / Intensity** | "High-energy, fast-paced fighting, epic battles, or climactic sports scenes" | Rock/metal/DnB/phonk, **140–180 BPM** |
| **Drama** | "Dramatic or theatrical scenes that evoke intense feelings of tension, excitement, or empathy" | Cinematic / build-heavy |
| **Romance / Sentimental** | "Emotional sentiments such as romance, platonic expression, character growth" | **60–90 BPM** ballad |
| **Comedy / Parody / "crack"** | "Content designed to make the audience laugh" | Gag-driven; **timing beats jokes, not beats** |
| **Dance / Rhythm / Fun-Upbeat** | Characters dancing/playing/singing to strong beats | **110–130 BPM**, lyric + lip-sync heavy |
| **Trailer** | Fake-trailer structure with narration and title cards | Trailer-music stem structure; non-metrical hits dominate |
| **Originality / Freestyle / Concept** | "Unique, creative, or experimental concepts, editing styles, and visual effects" | Anything |
| **MEP** | Multi-editor project; host splits the song and stitches parts. Commonly **4+ editors** | Long tracks, 3–6 min |
| **Iron Chef** | "A timed editing contest or event. Commonly timed in hours or days." | Assigned source + song |

### 6.2 BPM → energy → cut-pace mapping

| BPM | Feel | Suits | Shot-length band |
|---|---|---|---|
| 60–80 | Ballad, sentimental | Sentimental/Drama AMV; dissolves, long holds | 3–6 s |
| 80–100 | Chill, unhurried | Lifestyle, storytelling, narrative MV, dialogue-driven | 2.5–5 s |
| 100–120 | Groove, easy momentum | Fashion, performance, day-in-life, tutorials, product | 1.5–3 s |
| 120–140 | Energetic, driving | Travel, transitions, dance/rhythm AMV, most pop MV, reveals | 0.8–2 s |
| 140+ | Hype, relentless | Action AMV, sports, gaming, phonk edits | 0.4–1 s |

Generalised mapping for the agent: **`section.energy` 0.3 → 4–6 s shots; energy 0.9 → 0.5–1.5 s shots**, with documented extreme cases at ASL ≈ 0.3 s in hyper-cut choruses. Let the beat grid quantise actual cut points inside the band. ([ClipMusic](https://clipmusic.ai/blog/bpm-video-editing-guide))

### 6.3 Mood-specific grammar shifts

- **Sentimental/ballad:** dissolves permitted at up to ~20% of joins; cut ON or 2–4 frames AFTER the transient (lag reads as tenderness); no strobe, no RGB split; bridge is the emotional low, not a palette flip.
- **Action:** whip pans + impact sync carry the piece; strobe only at build peaks; internal sync on hits saves generations; shot scale should jump hard (wide→ECU) on downbeats.
- **Comedy:** the grid serves the joke — smash cuts and jump cuts on punchlines, deliberate off-grid timing, 3–15 s per gag in compilation form.
- **Dance/rhythm:** lyric + lip sync are the point; hold shots across 2–4 beats and sync the choreography, not the cuts. Budget lip sync per §8.7/rule 39 even here — the subgenre wants it most, but the 2–4-shot cap and eligibility checklist still apply.
- **Trailer:** non-metrical hits outrank the musical grid; title card lands on the biggest boom; L-cuts carry narration over picture.
- **Vertical/phonk edit:** velocity ramps, shake, RGB split, half-time trap grid (BPM ÷ 2), everything in 7–15 s.

---

## 7. Production pipeline (professional order, adapted to Direkta)

The professional order and the Direkta pipeline stage that owns it.

| # | Professional step | What happens | Direkta stage |
|---|---|---|---|
| 1 | **Music breakdown / marker pass** — *before any picture exists* | Get true BPM from a DAW-grade detector (never eyeball). Lay bar markers, section markers, and named event markers (drop, riser start, vocal entry, key change, final hit). Anchor at **bar 1 beat 1**. Segment and re-anchor per tempo section if variable. Emit a **beat-position table** (beat #, timecode, whole frame, cumulative drift) | **New pre-stage: `music-analysis`.** Runs before the script. Output: `analysis/<track-id>.json` (§5.4 schema) |
| 2 | **Concept / mode choice** | Performance vs narrative vs concept vs hybrid; locations; escalation levers | **Script stage.** The "script" for an AMV is a section-by-section treatment keyed to the beat map, not a screenplay |
| 3 | **Sync map** | Per section: cut grid, shot-scale range, energy L/M/H, dominant sync type (beat/lyric/internal/lip). Decide the *one* wow image and put it on Chorus 1 downbeat | **Movie Bible.** Add per-section entries: `cut_grid`, `scale_range`, `energy`, `dominant_sync`, `palette`, `lighting_direction` |
| 4 | **Selects / logging** *(AMV-specific inversion)* | You cannot direct coverage — you can only find it. Watch the source with the song playing; log timecodes of (a) clean impacts, (b) strong directional camera/character moves, (c) held expressions, (d) clean single-character frames usable for masking. Tag each by *what beat type it can hit*. Bin by **type** (performance / cutaway / atmospheric / detail), not by camera roll — one editor reports doing this for 196 clips and calling it the biggest time saver | **Shotlist stage, inverted.** In Direkta the "source" is the generated-clip library. Log every returned clip by beat-type affordance before assembling |
| 5 | **Rough cut / assembly** | Layer by type on separate video tracks (performance V1, cutaway V2, atmos V3), flatten when a section locks. Version incrementally with descriptive names ("— 25 (before chorus swap)") | **Stitch board.** Track lanes per clip type; named versions |
| 6 | **Refine pass** | Micro-nudge ±1–3 frames for image rhythm; break monotony with occasional two-beat and two-bar cuts inside a steady grid; insert offbeat passages where the image must be read | **Stitch board.** Frame-level nudge control required |
| 7 | **Effects / VFX pass** | Transitions, masks, speed ramps, transient-triggered flashes/shakes — **after** the cut is rhythmically locked, never as a substitute for it | Post-stitch effects layer |
| 8 | **Conform / online** | Relink full-res, insert VFX, error/metadata check | Render pipeline |
| 9 | **Grade** | LUT/base look, then per-section grading that reinforces the arc (the bridge gets a different palette **by design**) | Per-section grade tokens carried from the Bible |
| 10 | **Master / deliver** | ProRes 422 master; H.264 per platform; build the vertical variant as a **re-frame with its own hook**, not a crop | Export presets per §1.3 |

**Direkta-specific ordering constraint:** because generation is the expensive step, steps 3 and 4 swap relative to live-action. The **sync map must be complete before any clip is generated**, because the sync map determines clip *length*, *event placement within the clip*, and *screen-direction tokens* (§8).

**AMV source-craft principles worth importing wholesale:**
- Kaposztas's founding principle: **"the key to a good AMV is to match up a song that works with the images to tell a story."**
- **Reuse is legitimate.** Returning to the same shot at a later chorus is a structural rhyme, not laziness — treat repeated shots as a chorus motif.
- Pull only the compelling fragments of long takes ("lens flares, really nice expressions").

**MEP convention, if Direkta ever supports collaborative edits:** host picks the song, splits it into parts on *musical boundaries* (one section per editor), posts rules (software, resolution, deadline, theme), assigns parts, then joins them "by transitions and compiled into one AMV." Host-made intro and outro bracket the parts; the joining transitions are the host's craft problem. ([Fanlore](https://fanlore.org/wiki/MEP), [Fan Video Wiki](https://fanvideo.fandom.com/wiki/Multi-Editor_Project), [AMV.org MEP forum](https://www.animemusicvideos.org/forum/viewforum.php?f=37))

**Masking/compositing vocabulary the module should speak** (from [amv.tools glossary](https://amv.tools/resources/glossary)): Masking, Keying ("isolating certain pixel values, like color or brightness, and turning that into transparency"), Keyframe, Easing, Transformation, Opacity, Light leaks, CC vs Color Grading, RAM-preview, Beta ("a render of a work in progress, usually meant to be evaluated by other editors"), Source, NLE, Flow, Sync. Signature composite moves: rotoscoped character onto a new plate; multi-source crossover comps; frame-by-frame character extraction; **masking a mouth to stop lip flap** so a character appears to sing a different lyric; 60 fps interpolation as a stylistic marker.

---

## 8. AI-generation implications

### 8.1 Generator constraints

| Model | Max clip | Notes |
|---|---|---|
| **Seedance 2.0 / 2.5** (Higgsfield) | **up to 15 s per shot** (8 s on Plus monthly; 15 s on annual/Ultra/Max) | Multimodal: up to **9 images + 3 video refs (≤15 s ea) + 3 audio clips (≤15 s ea)** + text. **Audio-aware** — analyses beat positions, dynamic contour, timbre, structural sections |
| **Kling** | 5 s and 10 s | Strongest general model for demanding physical motion (walking, dancing, prop interaction) |
| **Runway** | 10 s | Not audio-aware |
| **Pika** | 5 s | Not audio-aware |

([Higgsfield — Seedance 2.5](https://higgsfield.ai/blog/seedance-2-5-on-higgsfield-2026), [Seedance 2.0](https://higgsfield.ai/seedance/2.0), [freebeat comparison](https://freebeat.ai/articles/best-ai-music-video-generators-in-2026-8-tools-tested-for-beat-sync-visual-quality-and-full-song-output), [SimilarLabs](https://similarlabs.com/blog/kling-vs-seedance-vs-veo-3-vs-higgsfield))

### 8.2 The central planning insight — three numbers, not one

**A 5–10 s generated clip is not one shot in the edit — it is a shot-source that yields between 1 and 20 cuts**, sliced at different in/out points, depending on clip type:

| Clip type | Slices-per-clip it can supply | Why |
|---|---|---|
| **Event clip** — one dramatic action (punch lands, turn completes, drop hits) | **1–2** | The event happens once; shown at full value once, occasionally reprised as a callback |
| **Flow clip** — continuous camera move (dolly, orbit, push, pan) placed in a **verse/pre-chorus/bridge/intro/outro** (cut every 1–4 bars) | **2–4** | Low reuse — the section's own cut grid is sparse |
| **Flow clip** placed **inside a beat-cut chorus/drop** (cut every 1–2 beats), especially when deliberately reused as a recurring motif across multiple choruses (rule 11) | **up to 15–20** | The same continuous move can be re-entered at a new in/out point on almost every beat — nothing in the shot is "used up" by being cut into |

Getting from a cut grid to a generation count therefore requires **three separate quantities**, not one number wearing two hats:

- **`total_cuts`** — the number of cut points the finished edit actually has (what the §2.3 grid produces).
- **`unique_shots`** — the number of distinct clips used as sources (§2.5's "40–60").
- **`generations`** — the number of AI generation calls needed to produce those `unique_shots`.

**Worked example — reference 3.5-min / 120 BPM track, 208 s, ABABCB form (§2.1):**

*Step 1 — `total_cuts`, via the rule 9 formula (`n_cuts = round(section_duration / avg(target_avg_shot_sec))`) applied per section using the §2.3 grid:*

| Section | Bars | Duration | Grid avg shot | Cuts |
|---|---|---|---|---|
| Intro | 8 | 16.0 s | 4.0 s | 4 |
| Verse 1 | 16 | 32.0 s | 3.0 s | 11 |
| Pre-chorus 1 | 4 | 8.0 s | 1.2 s | 7 |
| Chorus 1 | 16 | 32.0 s | 0.75 s | 43 |
| Verse 2 | 8 | 16.0 s | 3.0 s | 5 |
| Pre-chorus 2 | 4 | 8.0 s | 1.2 s | 7 |
| Chorus 2 | 16 | 32.0 s | 0.75 s | 43 |
| Bridge | 8 | 16.0 s | 8.0 s | 2 |
| Final chorus | 16 | 32.0 s | 0.75 s | 43 |
| Outro | 8 | 16.0 s | 8.0 s | 2 |
| **Total** | **104** | **208 s** | — | **`total_cuts` ≈ 167** |

This is the number the doc's own grid actually produces over ~208 s — it lands inside the 105–210 implied range, and it is **not** 40–60.

*Step 2 — `unique_shots` needed to supply 167 cuts, split by clip type:*

- **~18 event clips** (§2.5's 15–20 designed moments) at ~1.3 slices/clip average ≈ **23 cuts** — mostly landing on the wow-moment and other named beats (rule 10, rule 20).
- **~9 chorus-flow clips**, reused as motifs across all three choruses (rule 11's "reuse is legitimate" / structural rhyme) at **~12 slices/clip** average (below the 15–20 ceiling) ≈ **108 cuts**, covering most of the 129 raw chorus-section cuts — the remaining chorus cuts are event-clip slices (the wow moment, the final hit).
- **~15 connective-flow clips** (verse/pre-chorus/intro/bridge/outro) at ~2.4 slices/clip ≈ **36 cuts**.
- Check: `23 + 108 + 36 = 167` ✅ matches `total_cuts` exactly.

**`unique_shots` = 18 + 9 + 15 = 42** — inside §2.5's independently-stated 40–60, and now it's clear *why* that figure is a range: it tracks a **reuse-strategy choice**, not measurement slop. A production that reuses fewer chorus motifs harder (this example: 9 setups) needs ~42 unique shots; one that generates fresh chorus setups per chorus instead (§2.5's own "8–12 distinct setups" *per* 30 s chorus) needs closer to 60, at correspondingly lower slices/clip (3.6–7.75, per §2.5). Both strategies produce the same `total_cuts` ≈ 167.

*Step 3 — `generations`:* plan roughly one generation call per targeted `unique_shots`, plus the same **+15–20% regeneration allowance** used elsewhere in this codebase for AI clip budgets (`micro-drama` module, §8.2 equivalent) to cover rejects — **`generations` ≈ 42 × 1.15–1.2 ≈ 48–50** for this reference track, or **~35–45** for a shorter/simpler piece and **~50–60** for a denser one. This is where rule 31's generation range comes from.

**Stated without the ambiguity:** for a 3.5-minute piece, plan **~35–50 `generations`**, producing **~40–60 `unique_shots`**, sliced into **~150–200 `total_cuts`** at the §2.3 grid. The ratio `total_cuts ÷ unique_shots` averages **~3–4×**, but it is never a flat multiplier — it is the weighted blend of 1–2× (event clips) and up to 15–20× (chorus-flow motifs), and treating it as one number is exactly the error this section replaces.

### 8.3 Clip-length planning `[D]`

Pick generation length as **nearest musical phrase + ~1 s of handle at each end**:

| BPM | 2 bars | Generate at | 4 bars | Generate at |
|---|---|---|---|---|
| 90 | 5.33 s | 8 s | 10.67 s | 13 s (or split) |
| 100 | 4.80 s | 7 s | 9.60 s | 12 s |
| 120 | 4.00 s | 6 s | 8.00 s | 10 s |
| 128 | 3.75 s | 6 s | 7.50 s | 10 s |
| 140 | 3.43 s | 5.5 s | 6.86 s | 9 s |
| 160 | 3.00 s | 5 s | 6.00 s | 8 s |

**Never generate exactly the phrase length.** With zero handles, any drift or a bad first/last frame forces a regeneration instead of a trim.

**Event clips:** prompt so the event lands **~60–70% into the clip** — pre-roll to build into the beat, post-roll to cut away from, and survives ±0.5 s of model timing error.

### 8.4 Consistency and flow across generated clips

The named failure mode: **"The direction and acceleration of camera motion can differ between merged clips, and this sudden change in directional momentum results in a jarring visual jolt."**

- **Screen-direction + speed tokens.** Tag every shot with direction (L→R, R→L, in, out, up, down, static) and speed (slow/med/fast). Adjacent shots must either **(a) match** direction+speed (flow / invisible-cut feel) or **(b) oppose by 180°** (deliberate impact cut on a beat). **Never differ by 90° accidentally** — that is the jolt that reads as "AI slop."
- **Whip-pan joins:** generate shot A ending in a fast L→R pan and shot B beginning with a fast L→R pan, **matched in brightness and dominant colour**. Dark→light mismatches expose the cut.
- **First/last-frame control** is the reliable mechanism for constrained transitions and match cuts: set shot B's start frame = shot A's end frame (morph/continuation), or shot B's start = a graphic match of shot A's end.
- **Lighting direction and colour temperature** specified per shot and held constant within a section. The bridge is where you're *allowed* to change them.
- **Protect the key frame:** identify the single frame carrying the shot's information. The opening should prepare it; the ending should not erase it too quickly. **That frame is the one that lands on the beat.**

([Stage and Cinema](https://stageandcinema.com/2026/07/25/directors-turn-ai-clips-into-scenes/), [Dreamina — start/end frame control](https://dreamina.capcut.com/ai-video/ai-video-motion-control), [tellers.ai — camera motion controls](https://tellers.ai/blog/camera_motion_controls_for_ai_video_generation_2026-04-14))

### 8.5 Prompting with musical intent (audio-aware models)

Patterns that work with `@Audio`-style conditioning:

- **Timed event:** *"At the beat drop at approximately 6 seconds in @Audio1, snap the camera from a wide shot to an extreme close-up."*
- **Tempo-locked motion:** *"Camera orbital speed should match the 120 BPM tempo of @Audio1 — one complete revolution every two bars."* → mathematically exact A/V lock, and the clip becomes **loopable and sliceable on bar lines**.
- **Density matching:** *"Minimal, single subject, calm lighting during the sparse verse; multiple planes of motion and dynamic lighting during the full chorus."*
- **Counter-rhythm:** deliberately place visual events *between* beats for sophistication in verses.
- **Layered audio conditioning:** one audio track for rhythm (drives timing), a second for atmosphere (drives lighting/palette).
- Choose audio segments with **clear structural features** (build→drop, verse→chorus) rather than flat-energy passages. Corroborating practitioner rule: extract a **15-second build→drop window** (pre-chorus→chorus, or verse-climax→bridge) rather than uploading a full track — full-track uploads default to the rhythmically weak intro.

([OpusClip — Seedance 2.0 beat sync](https://www.opus.pro/blog/sync-video-to-music-beats-seedance), [higgsfield-audio SKILL.md](https://github.com/keithwalsky-ship-it/UGC-ai-prompt-skill/blob/main/skills/higgsfield-audio/SKILL.md))

### 8.6 Practical caveats

- **Runway / Pika / Kling / Veo are audio-unaware** — "production engines, not automatic music-video directors." Beat sync must be imposed downstream in the stitch stage.
- **Motion and physics are where AI music videos fail most visibly**: walking, dancing, turning, prop interaction. Prefer **camera motion over subject locomotion**; put subject-motion demands only on the 15–20 event shots and generate extra takes for those.
- **Every shot must contain motion.** At 0.5–1.0 s cut lengths a static generated frame reads as a still photograph.
- **Prior-art calibration:** CutClaw (agentic video editing via music synchronization, [GVCLab/CutClaw](https://github.com/GVCLab/CutClaw)) keypoints on `["downbeat", "pitch", "mel_energy"]` and constrains cut segments to a **3.0–5.0 s** default range — a sane narrative-paced default. The `browser-use/video-use` SKILL.md sets **0.5–2 s per accent cut** for music-video/fast-montage pacing (vs 3–14 s for narration-paced explainer cuts), plus a "hold final frame ≥1 s before cut" rule. ([video-use SKILL.md](https://github.com/browser-use/video-use/blob/main/SKILL.md))

### 8.7 Singing shots — the lip-sync execution path

§5.2 ranks lip sync as sync type #6 ("high-effort, high-reward") and §6.1/§6.3 make Dance/Rhythm a first-class AMV subgenre where "lyric + lip sync are the point," but nothing above says how a singing shot actually gets *produced* from a generated clip. The masking technique named in §5.2 ("masking a mouth to stop lip flap") is a **source-footage trick** — it removes unwanted mouth movement from existing anime frames. It does not transfer to generation, where the problem runs the opposite direction: producing mouth movement that doesn't exist yet, matched to the track.

**Production path, in order of preference:**

1. **Native co-generation, where the model supports it.** Higgsfield's LipSync Studio generates the vocal performance and the audio-driven face animation together rather than as a post-pass — it drives mouth, jaw, eyes, and head motion from the same audio simultaneously, and carries identity across shots via **Soul ID** so the singer doesn't drift between generations. Requires sharp-focus, evenly lit, front-facing source geometry; keep clips under **~30 s per generation** — longer clips accumulate repeated gesture patterns. Since Direkta already routes through Higgsfield for Seedance (§8.1), this is the default path. ([Higgsfield](https://higgsfield.ai/blog/make-ai-lipsync-videos))
2. **Specialist lip-sync pass on a generated or stylized still**, for an anime/stylized singer where the general video model's camera and character freedom costs mouth precision — route the hero vocal shot through a dedicated tool (the HeyGen Avatar IV / Hedra Character 3 class) instead. ([Elser AI — AMV lip-sync tool comparison](https://www.elser.ai/blog/best-ai-video-generators-lip-sync-anime-music-videos-2026))
3. **Open-source post-pass**, as a cost-sensitive or self-hosted fallback: LatentSync (audio-conditioned latent diffusion with a TREPA module for frame-to-frame consistency) or Wav2Lip (free, more hands-on), applied to an already-generated clip when neither of the above is in the pipeline. ([magichour.ai — AI lip-sync tools 2026](https://magichour.ai/blog/best-ai-lip-sync-tools))

**Shot eligibility for visible lip sync** — accuracy drops sharply outside this envelope, so restrict lip-synced generation to shots that meet it:
- Frontal or near-frontal face — side angles and partial obscuring measurably reduce accuracy.
- Stable head position — no whip pans, no extreme angle changes, no rapid head motion *during* the sung line.
- Close-up or medium-close framing, where the mouth reads clearly on delivery.
- Sharp focus and even lighting on the source frame or reference image.

**Escape hatches — when a lip-synced generation doesn't land, cut, don't regenerate blind:**
- **Frame the mouth out.** Profile silhouette, environmental insert, or a wide/establishing shot for the line.
- **Cut to a reaction, hands, or the instrument.** If one word or phrase fails, cut away rather than regenerating the whole line.
- **Back-of-head or over-the-shoulder staging** for lines that don't need to carry the emotional close-up.
- **Off-beat cutaway before a sustained note.** Sustained vowels are where mouth-slip reads worst — cut away *before* the note lands, not through it.
- **End the clip earlier** if the final frames of a generation drift out of sync — a trimmed clip that ends clean beats a full clip that ends wrong.

"Smart coverage is cheaper than demanding one flawless generation" — the same escape-hatch logic §8.6 already applies to motion and physics failures applies here. Rule 39 caps how much of the piece this budget can consume. ([Elser AI](https://www.elser.ai/blog/best-ai-video-generators-lip-sync-anime-music-videos-2026))

---

## 9. Skill rules

Numbered, imperative decision rules for the Direkta AMV/music-video agent. Grouped by topic. These are the distillation target.

### A. Music analysis (do this first, always)

1. **Analyse the music before writing a single shot.** Extract BPM from a DAW-grade or ML detector (never estimation or tap-tempo), plus time signature and a labelled section map with start timecodes: intro / verse / pre-chorus / chorus / bridge / drop / outro. Emit the §5.4 beat-map JSON as a cached artifact before the script stage runs.
2. **Anchor at bar 1, beat 1 and compute every beat position absolutely** (`beat N = round(N × frames_per_beat)`). Never chain relative offsets. A wrong anchor compounds into drift.
3. **Choose the project frame rate to minimise beat drift.** Prefer 24 fps for BPM ∈ {60, 72, 80, 90, 96, 120, 144, 160, 180}; 25 fps for {100, 125, 150}. If forced off-grid (128 BPM @ 24 fps = 11.25 f/beat), round each beat independently — naive accumulation costs ~16 frames over 64 beats, ~26 frames over 96 cuts at 140 BPM @ 23.976.
4. **Resolve the tempo octave on the audio alone, before any picture exists.** Run the backbeat-period test: cluster snare-band onsets, take the modal inter-onset interval (`T_backbeat`), and set felt tempo = `60 / (T_backbeat/2)` — backbeats repeat every 2 felt beats in both normal and half-time feel, so this needs no picture to resolve. Cross-check with onset density (kick onsets per beat cell; well under ~0.5/beat flags the too-fast octave) and, only if both signals are weak, the genre-BPM prior (140–175 BPM + sparse kick → default half-time, ~65–88 felt BPM). Emit `resolved_bpm` and `rejected_bpm` as explicit fields in the beat map (§5.4) — this lets the picture/script stage override with visual-energy judgement later, instead of re-deriving tempo blind at a stage where no picture exists yet.
5. **Segment and re-anchor per locally-stable tempo region** for drifting or rubato tracks. Never extrapolate one grid across a rubato passage.
6. **Gate on detector confidence.** Low `bpm_confidence` or `tempo_stability: rubato` → widen cut tolerance, fall back to downbeat-only cutting, or request manual markers. Do not trust a low-confidence grid blindly.

### B. Structure and pacing

7. **Set the cut grid per section, not per video — and only once the video mode confirms this beat-grid standard applies** (AMV, action-cut, short-form vertical; rule 8 selects). Chorus/drop = every **1–2 beats**; verse = every **1–2 bars**; pre-chorus = accelerando (2 bars → 1 bar → 2 beats → 1 beat); bridge = **4+ bar holds**; intro = every 2 bars; outro = decelerate to the longest shot in the piece.
8. **Select the cutting standard by video mode before cutting, then use ASL only as a post-hoc acceptance check — never as a target.** Performance/narrative commercial MV (artist/actor holds carry the shot) → the measured band, §2.2: ~3.5 s median chorus shot, ~5–6 s median verse shot. AMV / action / short-form edit modes (clips are plentiful, not footage-limited) → the beat-grid prescription, rule 7. After cutting, check **median shot length + cuts-per-minute** against whichever band the mode selected, per §2.4's Redfern caveat — not a mean. A piece landing 3–7× outside its mode's band has the wrong grid applied, not a pacing nuance.
9. **Budget cuts per section from energy, then let the grid quantise them:** `n_cuts = round(section_duration / avg(target_avg_shot_sec))`, with energy 0.3 → 4–6 s shots and energy 0.9 → 0.5–1.5 s shots. Never "cut on every detected beat" as a default.
10. **Land the designed "wow" moment on the first downbeat of the FIRST chorus.** Not the second chorus, not the bridge. Everything before is a ramp; everything after must escalate past it.
11. **Escalate each chorus.** Chorus 2 adds a variable Chorus 1 didn't have (new location, lighting state, costume, tighter scale). Chorus 3 is maximum. If Chorus 2 equals Chorus 1, remove a shot from Chorus 1 rather than adding to Chorus 2.
12. **Make the bridge a hard reset** — new palette, new location, new energy, longest shots in the piece, cut budget reduced ~50%, motion-sync preferred over cut-sync. Without the trough there is no peak.
13. **Introduce a new idea every 8 bars, not every bar.** 4-bar phrase = section-transition unit; 8-bar phrase = narrative-arc unit.
14. **Escalate shot scale with energy.** Verse = wide/medium, static or slow move. Pre-chorus = medium, moving. Chorus = close/extreme-close, kinetic, plus one big wide as the release valve. Never run an entire section at one scale.
15. **Never start at maximum energy.** Flat-max from bar 1 destroys the chorus. Every peak needs a documented low reference immediately before it.

### C. Sync craft

16. **Cut 1–2 frames BEFORE the transient by default**, applied as a single global grid offset (`cut_offset_frames: -2`). Exceptions: ballads under 80 BPM cut on-frame; dreamlike/lagged passages cut 2–4 frames after.
17. **Never snap to waveform peaks, and never seed the grid from hand-tapped markers** (peaks lie in compressed masters; taps run 100–250 ms late). Snap to the computed grid, then micro-adjust ±1–3 frames for image rhythm — that range is invisible to viewers.
18. **Reserve beats 1 and 3 for cuts; beats 2 and 4 for effects.** Downbeats get shot changes and shot-scale jumps; backbeats get flashes, shakes, zoom punches. Offbeats and 16ths get internal motion and mask reveals, never cuts — except inside a drop.
19. **Rank sync candidates by weight, not by position:** non-metrical sound-design hit (1.0) ≈ downbeat (1.0) > lyric-hook onset (0.85) > snare (0.6) > hi-hat (0.2) > sustained material (never). Spill into subdivision onsets only when the section's cut budget exceeds the count of high-weight candidates.
20. **Let a non-metrical stinger override the musical grid** for the single most important reveal (title card, hero moment) — and only for that.
21. **Prefer internal sync to cut sync whenever the shot can carry it.** If a clip contains an impact, head turn, step, or camera hit, land *that* on the beat and hold the shot across 2–4 beats. One well-synced held shot beats four arbitrary cuts, and costs one generation instead of four. For motion sync, time where the motion *ends*, not where it starts.
22. **Establish the sync contract in the first 4 bars.** One unmistakable hard sync inside the opening 8 seconds, or the audience reads later hits as coincidence.
23. **Cap literal/lyric sync.** Illustrating the word is the #1 amateur tell. Use it for the hook's first syllable and at most a handful of designed moments; carry the rest on internal, motion, and effect sync.

### D. Hooks and openings

24. **Put the strongest image of the whole piece in the first 10 seconds** — as the cold open, or as a 6–12 frame flash-forward. No logo cards, no slow fade-ups: a 3-second title animation costs 8–15% of the audience. If a title is required, put it over motion after the first chorus.
25. **Budget a pre-music cold open at 4–10 s maximum**, ending on the first musical event; optionally precede that downbeat with 6–12 frames of black or freeze as a pattern interrupt.
26. **Compress the hook to 2–3 s for vertical delivery, opening on motion already in progress.** Build the 9:16 variant as a re-framed edit with its own hook, never as a centre-crop of the 16:9.

### E. Transitions and effects

27. **Ration transitions: ≥85% hard cuts, ≤15% everything else**, with designed transitions concentrated at section boundaries and named events. Overused transitions are the single clearest amateur signal in every practitioner source.
28. **Match the transition to the musical moment.** Whip pan → snare / fast rock. Match cut → verse→chorus boundary. J-cut → pre-chorus (chorus stem under the last verse shot). L-cut → outro / narration. Dissolve → ballad, sentimental, verse→bridge. Speed ramp → riser, with the cut landing at or just after the return to full speed. Smash cut → the bar after a drop ends, or a comedy punchline. Strobe cut → 8–24 frames at the build peak only. Jump cut → deadpan/comedy or a vocal-chop stutter.
29. **Build every drop with halving intervals** — 2 bars → 1 bar → 2 beats → 1 beat → drop — placing quick cuts, flashes, or zooms on the pre-drop peaks. Effect durations: flash 1–3 frames; shake 3–8 frames decaying; zoom punch 4–8 frames with ease-out; RGB split 2–5 frames; speed ramp 12–24 frames; light leak 8–16 frames.
30. **Lock the cut before touching effects, grade, or transitions.** Effects layered onto a rhythmically wrong cut cannot rescue it — and contest judges score cuts, effects, flow, and audio work as separate axes precisely because they separate cleanly.

### F. AI generation

31. **Generate for coverage, not for duration — and keep three numbers separate.** `total_cuts` (what the §2.3 grid actually produces per section, via the rule 9 formula — ~150–200 for a 3.5-minute piece) is not `unique_shots` (~40–60 distinct clips, §2.5) is not `generations` (~35–50 calls: unique_shots plus a ~15–20% regeneration allowance). Plan ~15–20 "event" generations (one dramatic beat each, 1–2 slices/clip) plus ~20–30 "flow" generations (slow continuous camera moves) to supply the rest — chorus-placed flow clips reused as a motif can be sliced 15–20× per clip; verse/bridge-placed flow clips typically supply only 2–4 slices. See §8.2 for the worked reference-track arithmetic. Treat a repeated shot at a later chorus as a structural rhyme, not laziness.
32. **Size each generation to the nearest musical phrase plus ~1 s of handle at each end** — at 120 BPM, 6 s for a 2-bar shot and 10 s for a 4-bar shot; at 140 BPM, 5.5 s and 9 s. Never generate exactly the phrase length.
33. **In event clips, place the event at ~60–70% of the clip's duration** — pre-roll to build into the beat, post-roll to cut away from, and tolerance for ±0.5 s of model timing error.
34. **Tag every shot with screen direction and speed, and enforce adjacency.** Consecutive shots must either match direction+speed (flow) or oppose by 180° on a beat (impact). Accidental 90° changes produce the directional-momentum jolt. Hold lighting direction and colour temperature constant within a section; change them only at the bridge.
35. **Construct every designed transition with first/last-frame control** — match cuts, morphs, invisible cuts, and whip joins set shot B's start frame from shot A's end frame. Match brightness and dominant colour across the join; dark→light contrast exposes the cut. Never hope to discover these in the timeline.
36. **When the model is audio-aware, pass the audio and prompt in musical units** — "one complete camera revolution every two bars at 120 BPM"; "on the drop at 6 s, snap from wide to extreme close-up"; "sparse single subject in the verse, multi-plane motion in the chorus." Feed a 15-second build→drop window rather than a full track. Tempo-locked camera motion makes clips sliceable on bar lines for free.
37. **Every shot must contain motion.** At 0.5–1.0 s cut lengths a static generated frame reads as a still. If a clip has no camera or subject movement, add a slow push or reject it.
38. **Prefer camera motion to subject locomotion.** Walking, dancing, turning, and prop interaction are where AI video fails most visibly — confine those demands to the 15–20 event shots and generate extra takes for them.
39. **Cap lip-synced shots to 2–4 per piece**, mirroring the micro-drama module's "money lines" rule — reserve visible lip sync for the reveal/hook lines that must carry it, produced via the §8.7 execution path (native co-generation preferred, specialist pass or open-source post-pass as fallback), restricted to shots meeting the §8.7 eligibility checklist (frontal, stable head, close/medium-close, sharp and evenly lit). Carry every other lyric on internal sync, reaction cuts, hands/instrument inserts, back-of-head staging, or off-beat cutaways — the §8.7 escape hatches, not regeneration. This is independent of rule 23's cap on *literal/illustrative* lyric sync; a shot can fail one cap, both, or neither.

### G. Technical hygiene and delivery

40. **Conform everything to one project frame rate and one aspect ratio before editing.** IVTC telecined 29.97 back to 23.976 (5-frame cycle → 4); never deinterlace telecined content; disable resampling and frame-blending; letterbox/pillarbox rather than stretch. When interpolating animation, set the input rate to the animation rate (≈8 fps on 3s, ≈12 fps on 2s), not the container rate.
41. **Deliver to the target spec.** YouTube 1920×1080 16:9 H.264. Vevo 16:9–2.4:1, .mov/.mp4, 23.976–60 fps, H.264 or ProRes, min 7,500 kbps (20 Mbps recommended), no interlacing, 1440p/2160p native. TikTok/Reels 1080×1920 9:16 60 fps. AMV contest 1:00–5:00, ≥1280×720 (or 960×720 4:3), no watermarks or software logos, no artifacting. Master to ProRes 422 first.

---

## 10. Sources

### Highest-value (read these first when extending the module)
- [Tools for Film — BPM and Picture: Editors' Guide](https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide) — best frame-math source
- [Storybirdie — How to Storyboard a Music Video](https://storybirdie.com/blog/how-to-storyboard-a-music-video) — best cut-grid and shot-budget source
- [Sound on Sound — Video Editing: Music Promos](https://www.soundonsound.com/techniques/video-editing-music-promos) — best working-editor account
- [amv.tools glossary](https://amv.tools/resources/glossary) + [AMV.org — "What exactly is internal sync?"](https://www.animemusicvideos.org/forum/viewtopic.php?t=129162) — AMV vocabulary of record
- [OpusClip — Sync AI video to beats with Seedance 2.0](https://www.opus.pro/blog/sync-video-to-music-beats-seedance) — AI-native beat-sync prompting
- [Redfern, "Analysing Motion Picture Cutting Rates," Wide Screen 9.1 (2022)](https://widescreenjournal.org/wp-content/uploads/2022/08/formatted-cutting-rates.pdf) — why to target per-section grids, not a mean ASL

**Format, structure, contests** — [Otakuthon AMV rules](https://www.otakuthon.com/2026/en/amv-contest) · [ACen AMV contests](https://www.acen.org/video-programming/amv-contests/) · [Anime NYC](https://animenyc.com/applications/amv-contest/) · [Delta H Con](https://deltahcon.com/home/a-m-v-contest/) · [Anime Expo](https://www.anime-expo.org/activity/amv_competition/) · [Kotae Expo](https://kotae.fi/en/program/amv-competition/) · [AMV League scoring](https://www.animemusicvideos.org/forum/viewtopic.php?t=128179) · [Fanlore — MEP](https://fanlore.org/wiki/MEP) · [Fan Video Wiki — MEP](https://fanvideo.fandom.com/wiki/Multi-Editor_Project) · [AMV.org MEP forum](https://www.animemusicvideos.org/forum/viewforum.php?f=37) · [Musician Wave — song length](https://www.musicianwave.com/how-long-should-a-song-be/) · [MusicRadar — song sections](https://www.musicradar.com/how-to/song-sections-explained-intro-verse-chorus-middle8-outro-tag-bridge) · [Ace Studio — song structure](https://acestudio.ai/blog/song-structure-explained/) · [ReelMind — song structure](https://reelmind.ai/blog/intro-verse-chorus-bridge-outro-songwriting-structure-explained) · [Pro Audio Files — phrasing](https://theproaudiofiles.com/phrasing/) · [DJing Tips — track structure](https://www.djingtips.com/how-to-dj/track-structure/) · [BRAEID — Music Video Masterclass](https://www.braeid.com/article/music-video-masterclass)

**History** — [sabukaru — Visual Remix Culture](https://sabukaru.online/articles/visual-remix-culture-the-legacy-of-amv) · [Wikipedia — Anime music video](https://en.wikipedia.org/wiki/Anime_music_video) · [Fanlore — AMV](https://fanlore.org/wiki/Anime_Music_Video) · [Manga Wiki — AMV](https://manga.fandom.com/wiki/Anime_music_video)

**Hooks and retention** — [Artiphik — first 10 seconds](https://artiphik.com/blog/the-first-10-seconds-retention-playbook) · [Retention Rabbit](https://www.retentionrabbit.com/blog/youtube-hook-strategy-to-keep-viewers-watching) · [Videomaker](https://www.videomaker.com/article/c05/18826-how-to-use-the-first-10-seconds-of-your-video-to-hook-your-audience-and-increase-views/)

**Beat sync and cutting craft** — [Beat2Cut](https://beat2cut.com/blog/beat-sync-video-editing-complete-guide/) · [Bitcut](https://bitcut.app/blog/beat-sync-video-editing) · [ClipMusic — BPM guide](https://clipmusic.ai/blog/bpm-video-editing-guide) · [Moozix — frame-accurate rhythms](https://moozix.com/blog/frame-accurate-editing-rhythms-that-make-your-music-video-pulse-68e7a415ca2ba) · [Editors Keys](https://www.editorskeys.com/blogs/news/how-to-edit-music-videos-like-a-pro-sync-techniques-creative-effects-transitions) · [Splice — beat drops](https://spliceapp.com/blog/best-video-editor-for-beat-drops-1/) · [CapCut — pacing](https://www.capcut.com/create/music-video-pacing-emotional-montage-rhythm) · [Velocity edits tutorial](https://thealightmotions.com/velocity-edits-tutorial/) · [WeVideo — sync glossary](https://www.wevideo.com/glossary/sync) · [Movavi — syncing audio and visuals](https://www.movavi.io/syncing-audio-and-visuals-to-create-engaging-videos/) · [Opus — AI beat sync](https://www.opus.pro/blog/best-ai-beat-sync) · [Creative COW — beat vs lyrics](https://creativecow.net/forums/thread/music-videos-edit-to-the-beat-or-lyrics-2/) · [No Film School — trailer music](https://nofilmschool.com/how-to-edit-trailer-music) · [Derek Lieu — trailer editing](https://www.derek-lieu.com/blog/2018/1/6/what-im-thinking-when-i-edit-a-trailer)

**Tempo-octave resolution (half-time/double-time)** — [Beat Tracking Octave Error Identification by Metrical Profile Analysis, ISMIR 2010](https://archives.ismir.net/ismir2010/paper/000019.pdf) · [Mixgraph — half-time/double-time BPM converter](https://www.mixgraph.io/tools/half-time-double-time) · [SampleFocus — tempo/BPM guide (hip-hop, trap, DnB)](https://samplefocus.com/blog/ultimate-guide-to-tempo-and-bpm-the-best-bpms-for-hip-hop-trap-dnb-and-more/) · [ZIPDJ — dubstep BPM guide](https://www.zipdj.com/blog/what-bpm-is-dubstep)

**Transitions** — [StudioBinder — match cuts](https://www.studiobinder.com/blog/match-cuts-creative-transitions-examples/) · [Filmustage — essential transitions](https://filmustage.com/blog/essential-editing-transitions-explained/) · [Plotwit — invisible editing](https://plotwit.com/invisible-editing-techniques/) · [4K Shooters — hidden cuts](https://www.4kshooters.net/2022/09/10/how-to-pull-off-a-long-take-with-hidden-cuts/) · [Kapwing — speed ramp](https://www.kapwing.com/resources/how-to-use-the-speed-ramp-effect/)

**Pacing measurement** — [FILM-SHOT-COUNTER database](https://www.academia.edu/41152064/FILM_SHOT_COUNTER_A_Database_for_Quantitative_Analysis_of_Cinema_Shot_Counts_and_Average_Lengths_UPDATED_11th_FEBRUARY_2025_) · [VashiVisuals — music video editing stats](https://vashivisuals.com/music-video-editing-stats/) · [HardMatte metrics](https://www.hardmatte.com/info/metrics) · [Cinemetrics](http://www.cinemetrics.lv/) · [Filmmakers Academy — ASL](https://www.filmmakersacademy.com/glossary/average-shot-length-asl/)

**Technical / AMV hygiene** — [Doom9 IVTC tutorial](https://www.doom9.org/ivtc-tut.htm) · [Wobbly telecine primer](https://wobbly.encode.moe/gettingstarted/primer.html) · [Crows AMV Team — FPS basics](https://crowsamvteam.forumotion.com/t162-amv-basics-some-minor-fps-talk-disable-resample-deinterlacing-23fps-29fps-vfr-constant) · [AMV.org Twixtor thread](https://www.animemusicvideos.org/forum/viewtopic.php?t=120400) · [Vevo Music Video Specs](https://support.vevo.com/hc/en-us/articles/360033310854-Music-Video-Specs)

**Music analysis: libraries, papers, datasets** — [librosa beat_track](https://librosa.org/doc/0.11.0/generated/librosa.beat.beat_track.html) · [librosa dynamic beat example](http://librosa.org/doc/0.11.0/auto_examples/plot_dynamic_beat.html) · [DeepWiki — librosa beat tracking](https://deepwiki.com/librosa/librosa/5.2-beat-tracking-and-tempo-estimation) · [madmom downbeats docs](https://madmom.readthedocs.io/en/v0.16/modules/features/downbeats.html) · [madmom arXiv:1605.07008](https://arxiv.org/abs/1605.07008) · [madmom NumPy ABI issue](https://github.com/CPJKU/madmom/discussions/536) · [beat_this](https://github.com/CPJKU/beat_this) · [allin1](https://github.com/mir-aidj/all-in-one) · [BeatNet](https://github.com/mjhydri/BeatNet) · [Essentia algorithms](https://essentia.upf.edu/algorithms_reference.html) · [DeepWiki — Essentia rhythm](https://deepwiki.com/MTG/essentia/5.4-rhythm-and-beat-analysis) · [aubio CLI manual](https://aubio.org/manual/latest/cli.html) · [aubio onset method issue](https://github.com/aubio/aubio/issues/106) · [Foote — audio novelty segmentation](https://www.researchgate.net/publication/3863771_Automatic_audio_segmentation_using_a_measure_of_audio_novelty) · [CBM segmentation (ISMIR TISMIR)](https://transactions.ismir.net/articles/10.5334/tismir.167) · [Chorus detection CNN (arXiv:2103.14253)](https://arxiv.org/pdf/2103.14253) · [MSA overview](https://www.emergentmind.com/topics/music-structure-analysis-msa) · [Tempo Estimation: Are We Done Yet?](https://transactions.ismir.net/articles/10.5334/tismir.43) · [MIREX Audio Beat Tracking](https://www.music-ir.org/mirex/wiki/2019:Audio_Beat_Tracking) · [Unison Audio — RMS](https://unison.audio/what-is-rms-in-audio/) · [Analytics Vidhya — RMS vs amplitude envelope](https://www.analyticsvidhya.com/blog/2022/05/comparison-of-the-rms-energy-and-the-amplitude-envelope/) · [Whipped Cream Sounds — transients](https://www.whippedcreamsounds.com/what-are-transients-in-music-why-are-they-important-explained/) · [SoundCy — transient sound](https://soundcy.com/article/what-is-a-transient-sound) · [Mystic Alankar — hi-hat/snare patterns](https://mysticalankar.com/blogs/blog/hi-hat-and-snare-patterns-a-guide-for-beatmakers) · [Audible Genius — kick/snare/hat roles](https://audiblegenius.com/blog/the-roles-of-the-kick-snare-and-hi-hat-in-a-drum-pattern) · [osu! file format (timing points)](https://osu.ppy.sh/wiki/en/Client/File_formats/osu_\(file_format\))

**NLE / MCP / skill tooling** — [BeatEdit for Premiere Pro](https://aescripts.com/beatedit-for-premiere-pro/) · [Wondershare — BeatEdit guide](https://filmora.wondershare.com/ai-efficiency/beatedit-premiere-pro.html) · [JayAreTV — Resolve AI Beat Detector](https://jayaretv.com/edit/davinci-resolve-ai-beat-detector-explained/) · [PulseEdit — auto beat markers in Resolve](https://pulseedit.com/blog/auto-place-beat-markers-davinci-resolve.html) · [hugohow/mcp-music-analysis](https://github.com/hugohow/mcp-music-analysis) · [xlights-mcp-server](https://github.com/JohnBreault/xlights-mcp-server) · [anthropics/skills](https://github.com/anthropics/skills) · [browser-use/video-use SKILL.md](https://github.com/browser-use/video-use/blob/main/SKILL.md) · [higgsfield-audio SKILL.md](https://github.com/keithwalsky-ship-it/UGC-ai-prompt-skill/blob/main/skills/higgsfield-audio/SKILL.md) · [GVCLab/CutClaw](https://github.com/GVCLab/CutClaw) · [Loooom — identify song parts](https://www.mager.co/blog/2026-03-26-loooom-identify-song-parts/) · [mcpmarket — music analysis skill](https://mcpmarket.com/tools/skills/music-analysis-audio-insights)

**AI generation & post workflow** — [Higgsfield — Seedance 2.5](https://higgsfield.ai/blog/seedance-2-5-on-higgsfield-2026) · [Higgsfield — Seedance 2.0](https://higgsfield.ai/seedance/2.0) · [freebeat — AI music video generator comparison](https://freebeat.ai/articles/best-ai-music-video-generators-in-2026-8-tools-tested-for-beat-sync-visual-quality-and-full-song-output) · [SimilarLabs — Kling vs Seedance vs Veo 3 vs Higgsfield](https://similarlabs.com/blog/kling-vs-seedance-vs-veo-3-vs-higgsfield) · [Stage and Cinema — directors turn AI clips into scenes](https://stageandcinema.com/2026/07/25/directors-turn-ai-clips-into-scenes/) · [Dreamina — start/end frame control](https://dreamina.capcut.com/ai-video/ai-video-motion-control) · [tellers.ai — camera motion controls](https://tellers.ai/blog/camera_motion_controls_for_ai_video_generation_2026-04-14) · [Frame.io — post workflow guide](https://workflow.frame.io/guide/) · [Motion Array — post-production workflow](https://motionarray.com/learn/post-production/post-production-workflow/)

**AI lip sync (§8.7)** — [Higgsfield — realistic AI talking/lip-sync videos](https://higgsfield.ai/blog/make-ai-lipsync-videos) · [Elser AI — best AI video generators/lip-sync for AMVs 2026](https://www.elser.ai/blog/best-ai-video-generators-lip-sync-anime-music-videos-2026) · [magichour.ai — best AI lip-sync tools 2026](https://magichour.ai/blog/best-ai-lip-sync-tools)

---

## Appendix: gaps and low-confidence items to re-verify before shipping

- **Retention percentages (§3.1)** come from creator-marketing blogs, not platform data. Directional only; do not encode as thresholds in user-facing copy.
- **"Median ASL 1.6 s / 63.23% ≤ 2.0 s" (§2.4)** arrived via a search summary of the Academia.edu FILM-SHOT-COUNTER database; the underlying dataset was not opened directly.
- **No source gave measured verse-vs-chorus ASL from a real AMV or fast-cut-mode corpus** — the one measured cross-check (VashiVisuals: ~3.5 s chorus / ~5–6 s verse) is from 2024 chart-topper *commercial* MVs, which are disproportionately performance/narrative mode. §2.3's per-section grid remains practitioner prescription plus derivation for AMV/action/short-form modes specifically. The two are now reconciled by video mode (§2.3's mode-selector table, rule 8) rather than treated as competing ground truths, but a **measured cutting-rate corpus for AMV/short-form content itself** (as opposed to commercial MVs) would still strengthen §2.3 — still open.
- **`animemusicvideos.org`, `fanlore.org`, `viddertips.tumblr.com`, `cliptoolkit.net` block automated fetch (403/418).** Their content here came via search summaries; the deepest AMV craft threads remain unread.
- **The MCP registry returned zero results** for every music/audio/beat query tried — that space is not indexed, so the MCP findings in §5.5 came from web search + GitHub verification, not registry lookup.
- **`allin1` repo last pushed 2024-05-09** with 18 open issues; **madmom's last PyPI release is 0.16.1, Nov 2018.** Re-check both before depending on them.
- **Essentia is AGPL-3.0** (including `essentia.js`). Treat as a licensing decision, not a technical one, for a commercial product.
