# Movie / Anime Trailer Module — Research

> Definitive research base for the Direkta "Trailer" module. Distil §9 into the agent skill rule-file; §1–8 are the reasoning corpus behind those rules.
> Confidence markers: **[H]** cross-confirmed by 2+ practitioner/industry sources · **[M]** single credible practitioner source · **[L]** inferred/synthesized — validate before hard-coding.

---

## 1. Format landscape

### 1.1 What the form is
A trailer is **not a compressed film** — it is a *visual synopsis* engineered as an advertisement, built from deliberately non-contiguous material, whose energy arc is the **inverse** of a feature's. A feature starts small and builds; a trailer **starts big, drops to a trough, and ends bigger**. The governing law: *"If a trailer feels high energy all the time, then none of it will feel high energy."* ([Derek Lieu](https://www.derek-lieu.com/blog/2017/9/10/the-matrix-is-a-trailer-editors-dream); echoed by [Film Editing Pro](https://www.filmeditingpro.com/how-to-begin-your-trailer-music-editing-process/)) **[H]**

Trailer runtime is ~**2% of a 2-hour film's runtime** ([Filmsupply](https://www.filmsupply.com/articles/how-to-cut-the-perfect-film-trailer/)).

### 1.2 Delivery surfaces and what each demands
| Surface | Demand | Consequence |
|---|---|---|
| **Theatrical** | Rating band card, studio logos, billing block; captive audience; ≤2:00 NATO guideline | Full 4-act structure; no bumper (premium context) |
| **YouTube (pre-roll + owned channel)** | 5-second skip window; **55%+ of viewers gone within 60s**; retention falls ~95% @0:03 → **~65% @0:30** ([vidIQ](https://vidiq.com/blog/post/increase-audience-retention-youtube/), [humbleandbrag](https://humbleandbrag.com/blog/youtube-audience-retention-benchmarks)) **[H]** | 3–5s pre-hook bumper; hook by 0:03 |
| **TikTok / Reels / Shorts** | Vertical native, sound-on, thumb-stop | Whole arc compressed to **20–25s**; 9:16 framing decided at generation time |
| **TV / digital spot** | 5–90s, standard **:15 / :30** | **One idea only**, 3 compressed acts |
| **Anime PV (YouTube / 番宣CM broadcast)** | Announcement bulletin; dense text payload | Teaser 16–30s → Main PV 60–115s → Character PV 17–24s → 番宣CM :15/:30 |

### 1.3 Audience expectations — the comprehension contract
Minimum viable comprehension set: **main character → genre → character motivation** ([CreativeCOW practitioner thread](https://creativecow.net/forums/thread/length-of-shots-in-trailers-2/)). Expanded trade checklist: **World → Character → Conflict → Stakes → Date**. A trailer house's brief is to "communicate the tone, give just enough plot to entice without spoiling, and get audiences to care — all in two minutes or less" ([Wrapbook / Ignition Creative](https://www.wrapbook.com/blog/movie-trailer-house)). **[H]** Fail any of the five and the piece is a sizzle reel, not a trailer.

### 1.4 Japanese vs Hollywood rhetoric — the axis that changes everything
| Axis | Hollywood trailer | Anime PV |
|---|---|---|
| Persuasion mode | **Withhold + intrigue** — visual synopsis, not an info dump | **Disclose + credential** — the PV *is* an announcement bulletin; the text cards are the payload |
| Text on screen | 3–6 copy cards, terse, poster-copy register | Dense: staff credits, cast credits, song title + artist, broadcast date, network list, streaming platforms, ©-line |
| Music | Bespoke trailer cue or trailerized needle-drop | **The OP/ED song itself** is both score *and* news |
| Voice | VO effectively dead post-2008 | Character monologue / ナレーション still common; the *seiyuu voice* is a selling point |
| Spoilers | Contested; studios test toward "more" | Openly permissive — PVs routinely summarize whole episodes ([TV Tropes: Trailers Always Spoil — Anime](https://tvtropes.org/pmwiki/pmwiki.php/TrailersAlwaysSpoil/AnimeAndManga)) |
| Climax button | Joke/sting after the title | **Song chorus drop + title logo + 放送日 card**, often with a final sakuga flourish |

**Rule this generates:** for adaptation content (manga/novel/sequel/franchise), spoiler-avoidance is the *wrong objective function*; **fidelity-signalling** ("we animated THAT scene, and it looks like THIS") is the right one. For anime originals, revert to Hollywood withholding. **[H]**

### 1.5 Spoiler etiquette — the actual industry position
Studios test **dozens of versions** against demographically mixed audiences of hundreds; **audiences reliably ask for *more*** — more action, more beats, more spoilers. Spoiler-heavy cuts are **risk management, not incompetence** ([The Ringer](https://www.theringer.com/2018/07/23/movies/movie-trailer-editors-marvel-pixar-how-made), [Mental Floss](https://www.mentalfloss.com/article/643997/why-do-movie-trailers-give-so-much-away)). **[H]** Counter-movement: Spielberg, Nolan, Peele withhold third acts; **A24 markets premise + mood with zero plot specifics** ([thefilmnewsblitz](https://thefilmnewsblitz.com/2026/07/14/films/film-analysis-are-film-trailers-revealing-too-much-the-great-spoiler-debate/)) **[M]**. Encode spoiler tolerance as a **genre/brand parameter, never a universal**.

---

## 2. Anatomy & structure

### 2.1 The canonical grammar — 4 acts (the cold open counts)
1. **Cold open** — high-energy, humorous or dramatic beat "that requires very little context to understand, or quickly provides its own context." Hit the ground running.
2. **Act 1 — Setup** — world + protagonist + premise, delivered via exposition lines, rhetorical questions, or a "perfect line" that works narratively *and* as marketing copy.
3. **Act 2 — Escalation** — antagonist/problem enters; character responds; rising action into crisis.
4. **Act 3 — Climax** — the "wow" factor: set pieces, percussion, cymbal crashes, big hits.
([Derek Lieu, Basic Trailer Story Structure](https://www.derek-lieu.com/blog/2017/9/10/the-matrix-is-a-trailer-editors-dream)) **[H]**

### 2.2 Four named pacing shapes — pick exactly one per trailer
([Derek Lieu, How Trailers Tell a Story With Pacing](https://www.derek-lieu.com/blog/2020/1/20/how-trailers-tell-a-story-with-pacing)) **[M]**

| Shape | Curve | Use for |
|---|---|---|
| **Slow Burn** | low → gradual build → climax | mystery, revelation, prestige drama |
| **Hero's Journey** | big hook → drop to premise → build → climax | **default blockbuster shape** |
| **The Assault** | starts big, never lets up | action/horror sizzle, short spots |
| **The Dream** | peaks mid-trailer, winds down gently | romance, A24-style mood pieces |

### 2.3 Format lengths — hard numbers
| Format | Length | Acts | Source |
|---|---|---|---|
| Theatrical (MPAA-era cap) | ≤ **2:30** (150s), 1 exception/studio/year | 3–4 | [todayifoundout](https://www.todayifoundout.com/index.php/2010/09/the-color-of-the-background-preceding-movie-trailers-actually-means-something/) **[M]** |
| Theatrical (NATO guideline, eff. **Oct 1 2014**) | ≤ **2:00**; **2 exceptions per distributor per year**; trailers may run in-theatre from **5 months** out, posters **4 months** | 3–4 | [We Minored in Film](https://weminoredinfilm.com/2014/01/27/u-s-theater-owners-officially-enact-guidelines-to-limit-film-marketing-lead-time-trailer-length/), [THR](https://www.hollywoodreporter.com/movies/movie-news/theater-owners-seek-new-rules-559164/) **[H]** — voluntary |
| Empirical average trailer | **114.2s** (~1:54); alt Follows dataset **122.8s**; ~⅓ of all trailers fall in the 2:00–2:30 band | — | [Stephen Follows](https://stephenfollows.com/p/long-average-movie-trailer) **[H]** |
| Practitioner sweet spot | **90–120s** ("Hollywood runs 2'30" but that's often excessive") | 3–4 | Ross Evison via [Chris Jones Blog](https://chrisjonesblog.com/2012/02/how-to-edit-a-trailer-for-your-movie%E2%80%A6-but-the-guy-who-cuts-trailers-for-movies.html) **[M]** |
| Teaser | **60–90s** | **2** (context+setup → one set-piece) | [Film Editing Pro](https://www.filmeditingpro.com/trailers-teasers-promos-lengths-formats-tips/) **[H]** |
| TV/digital spot | **5–90s**, typically **:15 / :30** | 3, compressed | same **[H]** |
| Vertical social cut | **20–25s**, whole arc compressed | 3, collapsed | [Epikton](https://epikton.net/a-quick-guide-to-pacing-in-trailers/) **[M]** |
| Recorded extremes | shortest teaser **11s** (*Dawn of the Planet of the Apes*); longest **504s** (*Girl with the Dragon Tattoo*) | — | [Follows](https://stephenfollows.com/p/long-average-movie-trailer) |

Genre skew: documentaries, sports and historical films get the **longest** trailers (more information to convey); **horror and sci-fi the shortest** (mystery is the product). **[M]**

*NATO — the National Association of Theatre Owners — rebranded as **Cinema United** in March 2025; the ≤2:00 theatrical guideline is unchanged under the new name ([Deadline](https://deadline.com/2025/03/nato-rebrands-as-cinema-united-1236329732/), [Cinema United — In-Theater Marketing Guidelines](https://cinemaunited.org/wp-content/uploads/2014/01/NATO-In-Theater-Marketing-Guidelines-1.7.14.pdf)). Later sections refer to it as "Cinema United (formerly NATO)."* **[H]**

### 2.4 Anime PV durations and the release ladder
Empirical durations scraped from [LiveChart.me video index](https://www.livechart.me/videos) **[M]**:
- **Teaser PV** 0:16 – 0:30 · **Character PV (キャラクターPV)** 0:17 – 0:24 · **Main PV / 本PV** **1:01 – 1:54** (e.g. *Look Back* Main Trailer 1:31) · **番宣CM** :15 and :30 as a standard pair, cut from PV material ([animatetimes](https://www.animatetimes.com/news/details.php?id=1766735726)).

**The ladder — each rung is a new *information payload*, not merely new footage** **[H]**:
1. **Announcement / Teaser PV** — often *motion-manga*: manga panels, key visual, sparse animation, logo, "20XX 放送開始". Reveals: title logo, studio, main staff (監督 / シリーズ構成 / キャラクターデザイン / 音楽).
2. **PV第1弾** — first real animation; reveals main cast (CV names), key visual #2, season/cour.
3. **PV第2弾** — reveals **OP or ED theme song ("主題歌解禁") with an audio snippet**, **additional cast**, and the **exact broadcast date + networks**. Confirmed: *Kirei ni Shite Moraemasu ka* PV2 = 4 new CVs + ED「若葉のころ」first airing + Jan 5 TOKYO MX/AT-X ([animatetimes](https://www.animatetimes.com/news/details.php?id=1766735726)); *Samurai Troopers* 本PV第2弾 = ED「POWER」+ 5 new antagonists with CVs + Jan 6 broadcast / Jan 7–10 streaming ([V-Storage](https://v-storage.jp/anime/etc-anime/264632/)).
4. **Character PVs** — one per hero, 17–24s, each ending on that character's name + CV name + date card.
5. **Final PV / 直前PV + 番宣CM :15/:30** in premiere week.

**Why the ladder exists (economics, directly transferable to AI):** a **motion-manga PV takes 7–14 days** to produce vs **4–6 weeks for a 30-second fully-animated trailer** ([Magic Motion Studio](https://magicmotionstudio.com/how-long-does-anime-animation-take/)) **[M]**. Rung 1 costs almost nothing — the same is true of a stills/pan-based AI teaser.

### 2.5 Per-act shot budget — proportional model, instantiated per runtime **[L — synthesized; validate before shipping]**
Fitted from the ~100-cut action figure and the long→medium→short progression ([Epikton](https://epikton.net/a-quick-guide-to-pacing-in-trailers/), [Pexo](https://pexo.ai/tutorial/how-to-make-a-movie-trailer)).

**Precedence rule — the musical grid always wins.** Every timecode below (and in §2.6) is an *advisory target*, not a literal cut point. Quantize every act boundary to the nearest 4- or 8-bar phrase boundary of the actually-selected cue (§5.6): `act_boundary_time = nearest_phrase_boundary(target_time, phrase_bars ∈ {4,8}, cue_downbeats)`. This matters because the numbers don't reconcile on their own: at this doc's 95–120 BPM epic-cue cluster a 16-bar phrase runs ~32–40s and an 8-bar phrase ~16–20s, so a boundary nominally "at 0:45" will rarely land on an actual phrase edge of the chosen cue — snap to whichever phrase boundary falls closest (typically a few seconds off the printed target) and never split a phrase mid-bar. That is exactly the failure §5.6 calls "the edit fights the music's architecture." Phrase-boundary quantization of scene/section changes is standard beat-sync practice, not a Direkta invention ([Wideframe](https://try.wideframe.com/blog/how-to-use-ai-to-match-cuts-to-music-beats/)). **[M]**

**Reference instantiation at 2:00** (shot counts are ASL-window-derived — `window_duration ÷ target_ASL` — so they recompute automatically at other runtimes from the proportional model below):

| Act | Window (advisory — quantize to nearest phrase) | Target ASL | Shot count |
|---|---|---|---|
| Cold open | 0:00–0:12 | 2.5–4.0s | 3–5 |
| Logos / bumper | 0:12–0:17 | — | 1–2 cards |
| Act 1 Setup | 0:17–0:45 | 2.0–3.0s | 10–14 |
| Act 2 Escalation | 0:45–1:20 | 1.2–2.0s | 20–28 |
| Pre-climax dropout | 1:20–1:26 | 1 held shot + black | 1–2 |
| Act 3 Climax montage | 1:26–1:50 | **0.5–1.2s, decelerating shot length** | 25–40 |
| Title + button | 1:50–2:00 | title 2–3s, button 3–5s | 2–4 |
| **Total** | **2:00** | — | **~65–95 shots** |

**Proportional model** — the same table re-expressed as % of runtime, so it instantiates at any length instead of only 2:00:

| Section | % of runtime | Notes |
|---|---|---|
| Cold open | ~10% | |
| Logos / bumper | ~4% | Fixed ~2–5s dwell (§3.3) — doesn't scale with runtime; the % shrinks at very short lengths |
| Act 1 Setup | ~23% | |
| Act 2 Escalation | ~29% | |
| Pre-climax dropout | ~5% | The *window*, not the silence itself — the silence is 1–3 beats (rule 26), independent of runtime |
| Act 3 Climax montage | ~20% | |
| Title + button | ~8% | |

**Worked instantiations at the doc's other two reference runtimes** (rule 1: 114s default, 90s practitioner floor):

| Section | 114s (doc default) | 90s |
|---|---|---|
| Cold open | 0:00–0:11 | 0:00–0:09 |
| Logos / bumper | 0:11–0:17 | 0:09–0:14 |
| Act 1 Setup | 0:17–0:43 | 0:14–0:35 |
| Act 2 Escalation | 0:43–1:16 | 0:35–1:01 |
| Pre-climax dropout | 1:16–1:22 | 1:01–1:05 |
| Act 3 Climax montage | 1:22–1:45 | 1:05–1:23 |
| Title + button | 1:45–1:54 | 1:23–1:30 |
| **Total shots** | **~62–90** | **~49–71** |

Total shot count scales at **0.54–0.79 cuts/second** (the 65–95-in-120s ratio, held constant). All boundaries above remain subject to the precedence rule — quantize toward these seconds, never cut on them literally.

### 2.6 Published beat maps (timecodes) — illustrative shape, not binding cut points ([Epikton](https://epikton.net/a-quick-guide-to-pacing-in-trailers/)) **[M]**
Same precedence rule as §2.5: these are the *shape* to aim for, not literal timecodes. Quantize every listed beat to the nearest phrase boundary of the actual chosen cue before treating it as a cut point.
- **2:00 full trailer:** `0:03 hook · 0:20 premise · 0:45 first escalation · 1:20 twist · 1:40 climax · 1:55 brand tag`
- **0:30 teaser:** `0:02 hook · 0:08 montage · 0:20 tone shift · 0:28 tag`
- **Climax duration:** **20–40 seconds** of sustained peak.

### 2.7 Aspect ratios & platform specs
- **16:9 = 1920×1080** (letterbox to 2.39:1 for theatrical feel).
- **9:16 = 1080×1920** — universal short-form standard across TikTok / Reels / Shorts ([Aeon](https://project-aeon.com/blogs/a-guide-to-vertical-video-dimensions)) **[H]**.
- **4:5 = 1080×1350** for feed placements.
- Audio: **24-bit/48 kHz theatrical; 16-bit/44.1 kHz for digital ad distribution** ([SyncPlacement](https://syncplacement.com/blog/trailer-music-licensing/)).
- **Frame for the tightest crop first (9:16), then verify the wide** — if both hold, everything between holds ([picturesmith](https://picturesmith.com/notes/aspect-ratio-marketing-videos/)) **[M]**. **Generate vertical natively rather than cropping** where the model supports it; auto-reframe introduces subject-framing failures **[H]**.

### 2.8 Card taxonomy, mandatories and dwell times
| Card | Function |
|---|---|
| **Rating band** (green/red/yellow) | Head of trailer; regulatory |
| **Studio / distributor logos** | Head, ~2s each |
| **Pedigree card** | "FROM THE DIRECTOR OF…", star names — credibility + excitement |
| **Copy card** | Story beats in poster copy; tells story "quickly and efficiently" |
| **Title card** | Main title, on the biggest hit |
| **Date card** | Release date / 放送開始日 |
| **End card / billing block** | Legal credit block, contractual **mandatory** |
([Film Editing Pro — visual devices](https://www.filmeditingpro.com/hollywood-trailer-editing-basics-top-visual-devices/)) **[H]**

Band history: **green** = approved for general audiences (pre-2009 "appropriate audiences"; **April 2009** wording change; **May 2013** changed to "THE FOLLOWING PREVIEW HAS BEEN APPROVED TO ACCOMPANY THIS FEATURE" when attached to a feature). **Red** = restricted audiences. **Yellow** introduced **2007** for internet-hosted restricted trailers, PG-13-and-above only. ([MPA rating system](https://en.wikipedia.org/wiki/Red_band_trailers)) **[H]**

**Dwell-time numbers:**
- General rule: **3–5s per card**; 1-line short title 3–4s; 3-line card 5–6s; character title card on a freeze **2–5s** ([Dark Skies](https://darkskiesfilm.com/how-to-make-a-movie-title-card/), [PremiumBeat](https://www.premiumbeat.com/blog/stylize-video-with-character-title-cards/)) **[H]**
- **Legibility floor: ≥ 13 characters per second.** A 30-character line needs **≥ 2.3s**. Increase if the preceding cutting speed was fast, the animation elaborate, the font small, or contrast poor ([legibility.info](https://legibility.info/rules-for-text-in-videos)) **[H]**
- Word-count bands: **1–3 words → 2.5–4s; 4–8 words → 4–7s.**
- Trailer practice runs shorter than these general rules because cards are cut *on music hits* and are usually 1–3 words: treat 13 chars/s as the **hard floor**, the music grid as the **actual determinant**. **[L]**

Vocabulary to keep: **money shot** (the disproportionately expensive/marketable image the campaign depends on), **slug** (empty black picture or blank audio) ([Wikipedia: Money shot](https://en.wikipedia.org/wiki/Money_shot), [Storyblocks glossary](https://www.storyblocks.com/resources/blog/video-editing-terms)).

### 2.9 Anime tail-card stack
`title logo → 「2026年1月5日(月)より放送開始」 → network list (TOKYO MX / BS11 / AT-X …) → streaming platforms → ©-line`. Streaming dates typically land 1–5 days after broadcast and are listed separately (V-Storage: broadcast Jan 6, streaming Jan 7–10). Cour/episode-count (「全12話」「分割2クール」) appears when it is a selling point. **[H]**
Staff card order: **原作 → 監督 → シリーズ構成/脚本 → キャラクターデザイン → 音楽 → アニメーション制作 (studio)**. Cast card format: **character name +「CV: 声優名」** overlaid on that character's cut.

---

## 3. Hooks

### 3.1 The pre-hook bumper ("trailer before the trailer") — hard spec
- **Length: 3–5 seconds, 5s standard** — deliberately sized to the green-band card slot and the **YouTube 5-second pre-roll skip window** ([SlashFilm, Trailers Before Trailers](https://slashfilm.com/trailers-before-trailers)) **[H]**
- **Sony's internal data: bumpers lifted retention and interest by ~4× vs. the identical trailer without one.** Sony made them standard; WB and Paramount use them selectively; **Disney and Universal do not use them at all.** **[M — single-source but specific]**
- Practitioner rationale: *"When people see the green band, they check out."*

### 3.2 First-seconds numbers, per format
| Format | Hook deadline | Core idea by |
|---|---|---|
| Social-native (TikTok/Reels/Shorts/YT pre-roll) | **0:03** | **0:07** ([Epikton](https://epikton.net/a-quick-guide-to-pacing-in-trailers/)) **[M]** |
| TV/digital spot | **first 5–7 seconds** must contain an interesting moment ([Film Editing Pro](https://www.filmeditingpro.com/trailers-teasers-promos-lengths-formats-tips/)) **[H]** | one idea only |
| Full trailer (YouTube/theatrical) | cold open lands by **0:03**, premise by **0:20** | 0:20 |
| Anime teaser PV (16–30s) | key visual / logo reveal is the hook; sakuga proof-flash ≤1s inside the first 3s | 0:08 |

Named killers of the first 5s: **a slow or branded cold open, and logo animations or preambles.** **[H]**

### 3.3 Logo placement doctrine ([Derek Lieu, "No Logo"](https://www.derek-lieu.com/blog/2019/1/19/no-logo)) **[M]**
- Order is **cold open → logos → body**, never logos first.
- Logos get **~2 seconds, static or near-static**. Play a full logo animation only when the audience is genuinely happy to see that logo (Marvel/Ufotable-tier brand equity).
- Unknown label? Put logos **at the tail** — the credit still exists for anyone who wants to look you up.

### 3.4 Head-of-trailer card stack (US theatrical order)
`Rating band card → studio logo(s) → [bumper, if used] → cold open`

### 3.5 Hook content patterns that work
- **A question is the standard on-ramp to an action sequence** — pair rhetorical/straightforward questions with abstract imagery, exposition with literal illustrative visuals ([Lieu](https://www.derek-lieu.com/blog/2017/9/10/the-matrix-is-a-trailer-editors-dream)).
- **Anime's highest-yield hook** is the **manga panel → animated version of the same frame** comparison — famous panel, then the animated cut of it. Structurally a **match cut**, hence directly reproducible in an AI pipeline. **[M/L]**
- **No establishing shots.** Establishing shots are usually dispensed with in trailers, and opening on a stack of them establishes far less than editors think ([Lieu](https://www.derek-lieu.com/blog/2020/1/12/game-trailer-establishing-shots-dont-establish-much)).

---

## 4. Editing grammar

### 4.1 Pacing baselines to calibrate against
| Metric | Value | Source |
|---|---|---|
| Feature ASL, pre-1960 | 8–11s | [Widescreen Journal](https://widescreenjournal.org/wp-content/uploads/2022/08/formatted-cutting-rates.pdf) **[H]** |
| Feature ASL, recent decades | **4–6s** | same |
| Media-wide ASL trend | ~12s (1930s) → **~2.5s today** | [Filmmakers Academy](https://www.filmmakersacademy.com/glossary/average-shot-length-asl/) |
| Avg shots per film | ~1,132 (Cutting 2010, n=150) / ~1,250 typical; action blockbusters **3,000+** | [ResearchGate](https://www.researchgate.net/publication/362833910_ANALYSING_MOTION_PICTURE_CUTTING_RATES) **[H]** |
| Fastest-cutting directors | Paul W.S. Anderson ASL **2.4s**; *EEAAO* **1.5s** | [World of Reel](https://www.worldofreel.com/blog/2026/7/25/film-directors-and-average-shot-length) **[M]** |
| Trailer shot length | "often **less than one second**" | [Filmsupply](https://www.filmsupply.com/articles/how-to-cut-the-perfect-film-trailer/) **[M]** |
| Action-thriller trailer cut count | **~100 cuts** in a 2-minute piece | [Pexo](https://pexo.ai/tutorial/how-to-make-a-movie-trailer) **[M]** |
| Music-video clip length (2024 chart-toppers) | **~3.5s in choruses vs ~5–6s in verses**; documented hyper-cut extremes ASL ≈ 0.3s | [VashiVisuals](https://vashivisuals.com/music-video-editing-stats/) **[M]** |

### 4.2 The deceleration ladder (implementable acceleration curve)
Montage clip lengths stepping **2.5s → 2.0s → 1.5s → 1.0s → 0.5s** into the climax ([Seedance 2.5 trailer guide](https://www.seedance.tv/blog/seedance-movie-trailer-guide-2026)) **[M]**. Constraint: **no Act-3 shot may exceed the shortest Act-2 shot.**

### 4.3 Straight cut vs dip to black — the decision rule
([Lieu, Why to Make More Straight Cuts](https://www.derek-lieu.com/blog/2021/9/27/why-to-make-more-straight-cuts-in-trailers) + [The Dip to Black](https://www.derek-lieu.com/blog/2019/3/27/the-dip-to-black)) **[H]**
- **Straight cut = assertion of connection.** "The individual ideas contained within each shot join to create a third idea which only exists because they were spliced together." Use for: starting/reinforcing a single idea, cause→effect, thematic build.
- **Dip to black = permission to be unrelated.** It's a blink, a palate cleanser. "If there was a fade to black between these two shots, you wouldn't even consider trying to find a connection." Use when the next idea must feel *separate*.
- **Warning:** "Excessive use of dips to black can be a sign of a less experienced editor." Ration them.
- **Rhythmic black-slug pulse:** the *Attack of the Clones* "Breathing" teaser pattern — **fade in → cut → fade out → repeat**, the black interval itself locked to the music pulse. The canonical black-slug rhythm ([TrailerMade, Anatomy of a Trailer: Fade to Black](https://medium.com/@TrailerMadeTV/anatomy-of-a-trailer-fade-to-black-41c33fee48e0)).
- Fades buy **cognitive processing time** — extending the interval lets the viewer file the previous image before the next arrives, which is why a fade-segmented montage of unrelated shots doesn't read as disjointed (*Two Towers* trailer alternates day-block → black → night-block).

### 4.4 Transitions catalog — device, spec, when to use
| Device | Spec | Use when |
|---|---|---|
| **Straight cut** | 0 frames | Default. Two shots must read as one idea |
| **Dip / fade to black** | 4–16 frames each way; length locked to music pulse | Next idea must feel separate; act break; hiding an irreconcilable AI seam |
| **Black slug pulse** | fade in → cut → fade out, interval = 1 bar or 1 beat | Mood/teaser passages, breathing rhythm, Slow Burn shape |
| **Flash frame (white matte)** | starts on the cut, **fades out over 8–12 frames** ([indietalk](https://indietalk.com/archive/index.php/t-34499.html)) | Accent on a music hit only — never decorative |
| **Single-frame black/white** | 1 frame; visible only when stepping frame-by-frame ([CreativeCOW](https://creativecow.net/forums/thread/length-of-shots-in-trailers-2/)) | Subliminal punctuation inside a fast montage |
| **Picture push** | 6–12 frames | Card-to-card, graphic energy |
| **Swish pan** | 4–10 frames | Motion-matched hand-off between two moving shots |
| **Glow / bloom** | on the hit | Reveal, magic/power beat |
| **Inverse image** | 1–4 frames | Shock accent, horror |
| **Flutter cut** (rapid alternating frames) | 2–6 alternations | Psychological instability, glitch, panic |
| **Speed ramp** | ramp into/out of the hit | Money shot emphasis; also a cheap way to derive a "new" cut from one AI clip |
| **Cross-dissolve** | 12–24 frames | Time passage, dream/memory; rare in trailers |
| **Smash cut to black** | 0 frames | Buttoning a joke or a scare; end of piece |
| **Button / stinger** | 3–5s after the main title | Last joke, action flourish, or whispered line |
([Film Editing Pro — visual devices](https://www.filmeditingpro.com/hollywood-trailer-editing-basics-top-visual-devices/)) **[M]**

**Universal glue rule: attach a whoosh to *every* dip to black, dip to white, cross-dissolve or lens flare.** The SFX is what makes the transition read as intentional rather than defaulted ([Lieu, Secrets to Trailer Sound Design](https://www.derek-lieu.com/blog/2022/1/17/secrets-to-trailer-sound-design)). **[H]**

### 4.5 The Grid, match cuts, and manufactured causality
([MovieTrailers101](http://www.movietrailers101.com/trailer-editing-just-like-feature-film-editing-only-more-so/)) **[M]**
- **"The Grid"** — a trailer-specific parallel montage intercutting *non-continuous* scenes to "compress and accelerate the presentation of story information, emotion and excitement." It relies on the **Kuleshov effect**: viewers manufacture the relationship.
- **Match cuts** are disproportionately powerful in trailers because they "establish pattern, connection and thematic unity among shots pulled from opposite ends of the film" — they let you fake causality between unrelated material. **This is the single most valuable technique for AI-generated trailers** (see §8).

### 4.6 Endings
- **Button / stinger** = "one last joke, action flourish or powerful line that occurs **after the main title, right before the trailer ends**" — the colloquial **~5-second tag**; structurally the *"Two bits!"* answering the trailer's *"Shave and a haircut…"* ([Tropedia, The Stinger](https://tropedia.fandom.com/wiki/The_Stinger)) **[H]**
- **Smash to black** buttons the joke — a hard cut, not a fade ([Backstage](https://www.backstage.com/magazine/article/smash-cut-film-example-76088/)).
- **Genre-match the last frame:** "horror ends darkly, comedy on a laugh, romance with warmth." The ending is often the only part the audience remembers (Evison, [Chris Jones Blog](https://chrisjonesblog.com/2012/02/how-to-edit-a-trailer-for-your-movie%E2%80%A6-but-the-guy-who-cuts-trailers-for-movies.html)). **[H]**

### 4.7 Reveal/withhold ladder per act
| Act | Reveal | Withhold |
|---|---|---|
| Cold open | Tone, one striking image, genre | Any name, any plot mechanics |
| Act 1 | World, protagonist, ordinary-life premise, **1–2 copy cards** | Antagonist identity, twist |
| Act 2 | Inciting incident, antagonist *presence* (not identity), stakes | Third act, deaths, reveals |
| Act 3 | Scale/spectacle, best 3–5 money shots, pedigree | Resolution, who wins |
| Tail | Title, date, button | — |

**Character-intro order:** protagonist first and alone → the world/normalcy → the disruptor/antagonist → the ensemble as a group shot → **the antagonist's face last**. Don't name-check unknown performers; pedigree cards only carry weight for names the audience knows. Hard don'ts from the same source: don't explain A-to-Z; don't introduce too many characters or motifs; don't include disconnected random moments; don't let scenes overstay. ([Evison](https://chrisjonesblog.com/2012/02/how-to-edit-a-trailer-for-your-movie%E2%80%A6-but-the-guy-who-cuts-trailers-for-movies.html)) **[M]**

---

## 5. Music & sound integration

### 5.1 The cue itself — deliverable spec
([SyncPlacement, 2026 trailer-music guide](https://syncplacement.com/blog/trailer-music-licensing/)) **[H]**
- A theatrical trailer cue runs **60–120 seconds** and contains **4–8 discrete sections**: *intro, build, midpoint reveal, action drop, climax, outro*.
- Ships with **8–16 stems** + alt mixes (**no-vocal, no-drums, underscore/no-melody, percussion-only, drumless**) — **20–30 files per cue** once alts are counted.
- Pre-cut edits at **:30, :60, :90, :120**, plus **isolated hits, risers and stings** as drop-on-a-beat assets.
- *"The cue that is easiest to edit usually wins."*

### 5.2 Section-length template — proportional model, instantiated per runtime
Richard Pryn's 4-act cue template ([source](https://richardpryn.com/how-to-structure-trailer-music/)) **[M]** is a **155s piece (5×30s + 5s button ≈ 2:35, commonly rounded to "2:30")** — i.e. it is fitted to the legacy MPAA-era cap (§2.3), not to Cinema United's (formerly NATO's) current **≤2:00** guideline or to this doc's own **~114s default runtime** (rule 1). Used as-is, its flat 30-second sections have no defined relationship to a 114s or 90s trailer — that is the gap this section closes. Re-expressed as proportions, each of the 5 acts is **~19.4% of total runtime** and the button is **~3.2%**:
```
Act 1  Mood/setup        (19.4%)
Act 2a Exposition        (19.4%)
Act 2b Action/response   (19.4%)  ← rhythmic device enters, consistent pulse
Act 3a Building drama    (19.4%)
Act 3b Maximum intensity (19.4%)  ← drums, driving strings, brass/synth
Act 4  Logo/title button (3.2%)   "take 5 seconds from your third act and
                                   make it feel like a succinct musical sentence"
```
**Worked instantiations:**

| Section | 155s (legacy 2:30 — exceeds current guideline) | 114s (doc default) | 90s |
|---|---|---|---|
| Act 1 Mood/setup | 30s | ~22s | ~17s |
| Act 2a Exposition | 30s | ~22s | ~17s |
| Act 2b Action/response | 30s | ~22s | ~18s |
| Act 3a Building drama | 30s | ~22s | ~17s |
| Act 3b Maximum intensity | 30s | ~22s | ~18s |
| Act 4 button | 5s | ~4s | ~3s |
| **Total** | **155s** | **114s** | **~90s** |

These five music-side acts aren't a separate structure from the picture-side act budget in §2.5 — they're a coarser, composer-facing view of the same timeline. Act 1/2a here roughly span §2.5's Cold Open + Setup; 2b/3a span Escalation through the pre-climax dropout; 3b is the Climax montage; Act 4 is Title + button. Brief the composer in these five even sections (composers think in cue structure, not shot budgets); quantize the actual picture edit to §2.5's finer, uneven proportions and to the phrase grid (§2.5's precedence rule), not to this even 5-way split.

Editor-facing structural formula ([Evenant](https://evenant.com/10-essential-trailer-music-tips/)) **[M]**:
`INTRO – # – BUILDUP – # – CLIMAX I – # – CLIMAX II – # – OUTRO`, where `#` = a short break/gap deliberately left for the editor to cut on. **Compose the gaps.**

**Cue count:** select **2–3 cues** (one per act); **single-cue trailers work for 1–2 minute pieces with a gradual build**. Reserve the strongest cue for the finale so the piece "reaches its peak of energy at the very end" ([Film Editing Pro](https://www.filmeditingpro.com/how-to-begin-your-trailer-music-editing-process/)). **[H]**

**Tempo:** no single industry number. Library convention buckets: Very Slow <60 / Slow 60–90 / Medium 90–110 / Upbeat 110–140 / Fast 140–160 / Very Fast 160+. Representative epic-trailer cues cluster at **95–120 BPM**, fast variants to ~155. **[L — infer, don't assert]**

### 5.3 Named sonic elements (vocabulary the sound module must implement)
**Braam** (booming brass/synth hit; the *Inception* signature — [Lieu](https://www.derek-lieu.com/blog/2017/12/3/the-inception-braaaaaaam-sound)) · **Riser** (pitched-up sweep/filtered-noise build; **short risers = anticipation into a cut, long risers double as music into the climax**) · **Downer / reverse-riser** · **Whoosh** (transition glue; blend of suckback + hit) · **Suckback** (tension pulled *into* a beat) · **Sub drop / boom** · **Drone** (sustained ambient floor) · **Hit / impact / stinger** · **Stopdown** (a big hit **followed by a pause**, explicitly engineered "to create drama and give editors a natural cut point") · **Button** (final musical punctuation after the title).
Cross-confirmed: [No Film School](https://nofilmschool.com/how-to-edit-trailer-music), [SyncPlacement](https://syncplacement.com/blog/trailer-music-licensing/), [ModWheel](https://modwheel.net/cinematic/best-trailer-music-vst). **[H]**

### 5.4 The pre-climax dropout — the single most reliable trick
*"Silence before a title is the oldest trick in trailer editing and it still works, because the ear notices absence faster than volume."* Canonical shape: **music + motion peak → everything stops → hard cut to black → single boom / sub-bass hit → title.** Horror's 3-part convention is the same idea: *gentle calm → silence → disruption*. ([Movie Marker](https://www.moviemarker.co.uk/giving-film-trailers-a-clearer-identity-using-proper-sound-design-strategies/), [A2 Media codes & conventions](http://jlhaughton.blogspot.com/2010/10/codes-conventions-of-film-trailers.html)) **[H]** **Duration, expressed on the grid, not the clock: 1–3 beats (roughly a half-bar) of near-silence, extending to a full bar for slower cues — never a flat second count.** At this doc's 95–120 BPM epic-cue cluster that converts to ~0.5–1.9s, which is where the earlier flat "0.5–1.5s" figure came from; recompute from the cue's actual BPM outside that cluster. The silence must end, and the boom land, exactly on a downbeat — or on a non-metrical trailer hit (§5.6 accent hierarchy, weight 1.0) if the boom is scored as one, in which case that hit is the target instead of the nearest downbeat. See rule 26 for where the title card lands relative to this beat.

### 5.5 Cutting picture to a music grid — the manual technique
([No Film School](https://nofilmschool.com/how-to-edit-trailer-music); [Lieu, How Trailer Editors Edit Dialogue to Music](https://www.derek-lieu.com/blog/2022/3/14/how-trailer-editors-edit-dialogue-to-music)) **[M]**
1. **Mark every beat.** **Colour-code the downbeat of every 4-bar phrase differently** — those coloured markers are the legal splice points for extending/shortening the cue.
2. **Peaks and troughs:** mark the notable musical hits (peaks). **Never place dialogue on a peak** — it kills the hit. Dialogue lives in the **troughs** (the beat map's `troughs` array, §5.6, is the machine-computable version of this step).
3. **Choose the line by the length of the trough.** Same idea, two lengths: *"I love my cat so much!"* for a short trough vs *"I love my cat more than anything in the world!"* for a long one. Write/select coverage to fit the hole — query `troughs[i].duration_sec` (§5.6) rather than eyeballing the waveform.
4. **No dead air:** *"Everything needs to butt up against each other"* unless the silence is deliberate.
5. **If nothing fits:** loop/extend the cue to widen a trough, or excise notes to tighten it — ideally undetectably. With a bespoke cue defer to the composer's pacing: *"it's generally more difficult to take out a musical phrase than add or extend shots."*
6. **Spot shortcut:** *"Start your spot with the beginning of the music, end it with the climax of the music, and custom-edit the middle to connect the two."*
7. **Reverb as a tone knob:** the same track re-verbed reads "bigger and grander" or darker. Stack a **drone** under a licensed track for menace.
8. **Work in stems, not mixes** — vocal stem from track A over instrumental from track B, aligned on beat markers, blended with reverb.

### 5.6 Beat-sync engine — the shared math (applies to trailer, music video, any beat-cut module)
**Units, largest to smallest:** Section → Phrase (4/8/16 bars) → Bar → Beat → Subdivision. In 4/4 (overwhelming majority of pop/trailer music), 4 beats = 1 bar; a 4-bar phrase = 16 beats; an 8-bar phrase = 32 beats. Natural stopping points land on **8, 16, or 32-bar boundaries** — respect them or the edit fights the music's architecture ([DJing Tips](https://www.djingtips.com/how-to-dj/track-structure/), [Pro Audio Files](https://theproaudiofiles.com/phrasing/)).

```
seconds_per_beat = 60 / BPM
bar_duration_sec = beats_per_bar × (60 / BPM)      // 4/4 → 4 × 60/BPM
frames_per_beat  = (fps × 60) / BPM
```
Worked: 120 BPM → 0.5 s/beat, 1 bar = 2.0s · 100 BPM → 0.6 s/beat · 90 BPM → 0.667 s/beat ([ClipMusic](https://clipmusic.ai/blog/bpm-video-editing-guide)).

**Frame-grid drift — non-integer frames/beat accumulates error** ([Tools for Film](https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide)):
- 120 BPM @ 24 fps = exactly **12 frames/beat** (zero error) · 100 BPM @ 25 fps = **15 f/beat** · 160 BPM @ 24 fps = **9 f/beat**
- 128 BPM @ 24 fps = 11.25 f/beat → over 64 beats, **~16 frames (~0.67s) drift**
- 140 BPM @ 23.976 fps = 10.277 f/beat → over 96 cuts, **~26 frames (>1s) drift**
- **Rule:** for drifting/non-integer tracks, segment by locally-stable tempo and recompute the grid per segment. Never extrapolate one grid across a rubato passage.
- **Irregular meters:** bar length = beats_per_bar × frames_per_beat (5/4 @ 120 BPM/24 fps = 60 frames/bar). **Half/double-time:** recompute at BPM/2 and BPM×2 and pick the grid matching *visual* energy — trap/dubstep/DnB are written 140–175 BPM but *feel* 70–88.

**BPM energy bands** ([ClipMusic](https://clipmusic.ai/blog/bpm-video-editing-guide)): 80–100 chill (lifestyle/B-roll, dialogue) · 100–120 groove (fashion, product) · 120–140 driving (fitness, travel montage, reveals) · 140+ hype (sports, gaming, fast compilation).

**Three sync modes** — spend the right one:
- **Cut sync** — the shot change lands on/near a beat or transient ([WeVideo glossary](https://www.wevideo.com/glossary/sync)).
- **Motion sync** — on-screen motion *resolves* on the beat, independent of the shot boundary. Rule of thumb: "think about where the motion ends, not where it starts, since the landing is what the viewer feels" ([Movavi](https://www.movavi.io/syncing-audio-and-visuals-to-create-engaging-videos/)). A shot can hold across several beats with only its internal motion synced.
- **Effect sync** — a treatment (flash frame, glitch, whip-pan blur, colour pop, screen shake, VFX hit) triggers on a beat without spending a cut ([Opus](https://www.opus.pro/blog/best-ai-beat-sync)).
Scoring literature calls beat-for-beat action matching **"Mickey Mousing"**; trailer editors deliberately vary how tightly they do it to avoid monotony ([No Film School](https://nofilmschool.com/how-to-edit-trailer-music)).

**Accent hierarchy → cut weight** (highest first):
`non-metrical trailer HIT/BOOM (weight 1.0, overrides the grid) > downbeat kick (1.0) > lyric-hook onset (~0.85) > snare backbeat, beats 2 & 4 (0.6) > sub-bass drop / riser landing > hi-hat / 8th subdivisions (0.2, effect-sync only) > sustained tonal material (never a cut point — cut *through* it, not *to* it).`
Transients (kick thump, snare crack, hi-hat tick, plosive/pluck) are "short but contain a lot of energy" and are "responsible for much of the perceived impact"; sustained content is what you cut through ([Whipped Cream Sounds](https://www.whippedcreamsounds.com/what-are-transients-in-music-why-are-they-important-explained/), [SoundCy](https://soundcy.com/article/what-is-a-transient-sound), [Audible Genius](https://audiblegenius.com/blog/the-roles-of-the-kick-snare-and-hi-hat-in-a-drum-pattern)).

**Cut early, not on.** Place the cut **1–3 frames before the audio transient**. Visual and auditory processing latencies differ: dead-on or late reads "mushy," 1–3 frames early reads tight — "the viewer sees the new shot and then hears the beat, making the impact feel stronger." Apply as a **global phase offset** on the whole grid, not per cut ([Tools for Film](https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide)). Related failure mode: **hand-tapped markers run 100–250ms late** vs true transients — the single biggest source of "almost right but drunk-feeling" cuts. Seed the grid from automatic transient detection, never from tap-tempo.

**Sync-point budgeting — never cut on every beat.** Two-tier strategy: **bar-length cuts (every 4 beats)** for verses/builds; collapse to **beat or half-beat cuts (every 1–2 beats)** only at choruses/drops/payoffs. "The strongest edits shift between the two: bars for the build, beats for the payoff." Editing to every beat "usually feels frantic." A well-placed **hold across a phrase** makes the next cut hit harder by contrast. ([Tools for Film](https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide), [Creative COW](https://creativecow.net/forums/thread/music-videos-edit-to-the-beat-or-lyrics-2/))

**Lyric sync:** *"if you say it, show it"* — literal or abstract visual pairing on sung/spoken hits; a hook's **first syllable functions like a downbeat** and is a forced cut/effect point regardless of the underlying grid ([Lieu](https://www.derek-lieu.com/blog/2018/1/6/what-im-thinking-when-i-edit-a-trailer)).

**Beat map — required fields** (what the Direkta music-analysis step must emit):
1. Global/segment-local **BPM** + confidence, with explicit half/double-time ambiguity flag
2. **Beat times**, quantized to frames
3. **Downbeats** (subset marking bar-1s) + time signature
4. **Section boundaries + labels + energy 0–1** (intro/verse/chorus/bridge/drop/outro)
5. **Non-metrical transients/FX/hits** (riser payoff, ad-lib, stinger) — these often outrank ordinary beats
6. **Troughs** — the low-energy windows between peaks, with `start`, `end`, `duration_sec` and floor RMS relative to the enclosing section's mean. This is the field rules 14–15 query to place and length-fit dialogue; peaks and beats alone cannot answer "where is the next gap and how long is it."

**Trough detection — the executable rule.** A trough is a maximal contiguous interval where the smoothed RMS envelope (the same ~50ms-block RMS used for the energy→pace mapping below, further smoothed with a ~200–300ms moving average to suppress the micro-gaps between individual hits) drops to or below **40% of the enclosing section's `rms_mean`**, sustained for **≥300ms** — shorter dips are inter-transient gaps, not usable dialogue pockets, and should not be emitted. Threshold and minimum duration are evaluated per-section, not globally: a chorus's floor and a verse's floor sit at very different absolute loudness, so `floor_rms_rel` is computed against that section's own `rms_mean`, never the whole track's ([Unison Audio — RMS](https://unison.audio/what-is-rms-in-audio/); valley-relative-to-local-peak detection is standard practice in onset/segmentation literature). **[L — threshold synthesized from general RMS-silence-detection practice; tune per genre/mix before shipping]**

**Beat-map JSON (canonical shape):**
```json
{
  "track_id": "string", "duration_sec": 187.42,
  "global_bpm": 128.0, "bpm_confidence": 0.93,
  "tempo_stability": "stable | drifting | rubato",
  "time_signature": [4, 4], "fps": 24, "cut_offset_frames": -2,
  "beats": [{ "t": 0.469, "index": 1, "position_in_bar": 1, "is_downbeat": true, "confidence": 0.97 }],
  "downbeats": [0.469, 2.344, 4.219],
  "sections": [
    { "label": "intro",  "start": 0.0,  "end": 14.06, "bars": 8, "energy": 0.22,
      "rms_mean": 0.08, "target_avg_shot_sec": [4.0, 6.0] },
    { "label": "chorus", "start": 46.9, "end": 65.6,  "bars": 8, "energy": 0.91,
      "rms_mean": 0.34, "target_avg_shot_sec": [0.5, 1.2] }
  ],
  "troughs": [
    { "start": 5.2, "end": 7.8, "duration_sec": 2.6, "section": "intro",
      "floor_rms": 0.03, "floor_rms_rel": 0.375 },
    { "start": 30.1, "end": 31.9, "duration_sec": 1.8, "section": "verse",
      "floor_rms": 0.05, "floor_rms_rel": 0.31 }
  ],
  "onsets": [
    { "t": 46.9, "type": "downbeat", "weight": 1.0 },
    { "t": 45.1, "type": "riser_payoff", "weight": 1.0, "non_metrical": true },
    { "t": 47.37, "type": "snare", "weight": 0.6 },
    { "t": 46.9, "type": "lyric_hook_onset", "word": "run", "weight": 0.85 },
    { "t": 47.58, "type": "hihat", "weight": 0.2 }
  ]
}
```

**Cut-list generation from the beat map:**
1. `n_cuts(section) = round(section.duration_sec / avg(section.target_avg_shot_sec))` — budget per section, not per beat.
2. Rank candidates in the section by `weight` desc, restricted to `is_downbeat` or `weight ≥ 0.6` first; spill into subdivisions only if the budget exceeds high-weight candidate count.
3. Select top-N with minimum spacing ≥ 1 beat (`60/bpm` s) so cuts don't cluster.
4. Assign shots in narrative order: **reveal/hero shots → downbeats & `non_metrical` payoffs; dialogue/action beats → `lyric_hook_onset`; connective B-roll → remaining bar downbeats.**
5. Apply `cut_offset_frames` to every timestamp before writing the EDL, quantized to the nearest frame at target fps.
6. **Deliberate holds:** where `energy` drops sharply from the previous section (bridge/breakdown), cut the budget ~50% and prefer motion-sync over cut-sync.
7. **Trailer-mode override:** a `non_metrical` hit of weight 1.0 near a title card or hero reveal **always wins the slot**, regardless of the musical grid.

**Energy → pace mapping:** `energy 0.3 → 4–6s shots; energy 0.9 → 0.5–1.5s shots` (documented extremes reach ASL ≈ 0.3s in hyper-cut choruses). Section energy backbone = **RMS over ~50ms blocks**: `RMS = sqrt(mean(amplitude² over frame))` ([Unison Audio](https://unison.audio/what-is-rms-in-audio/)).

**Detection stack and its limits** (for whoever implements the analysis step):
- **librosa** `beat_track()`: onset envelope (`onset_strength`, mel, `hop_length=512` ≈23ms @22050 Hz) → global tempo via autocorrelation/tempogram → dynamic programming. Params: `start_bpm=120.0`, `tightness=100` (400 = stricter, 10 = flexible). Fits a **single global tempo** by default ([docs](https://librosa.org/doc/0.11.0/generated/librosa.beat.beat_track.html), [dynamic-tempo example](http://librosa.org/doc/0.11.0/auto_examples/plot_dynamic_beat.html)).
- **madmom** (best for downbeats): `RNNDownBeatProcessor` emits P(beat)/P(downbeat) at **100 frames/sec**; `DBNDownBeatTrackingProcessor(beats_per_bar=[3,4], fps=100)` resolves position-in-bar via an HMM-approximated DBN ([docs](https://madmom.readthedocs.io/en/v0.16/modules/features/downbeats.html), [arXiv:1605.07008](https://arxiv.org/abs/1605.07008)).
- **aubio** (lightweight, real-time/causal): onset methods `energy, hfc (default), complex, phase, wphase, specdiff, kl, mkl, specflux`; `aubiotrack` defaults to `specflux` ([manual](https://aubio.org/manual/latest/cli.html)).
- **Essentia**: `RhythmExtractor2013` with `multifeature` (accurate, slower, per-beat confidence) or `degara` (fast) ([reference](https://essentia.upf.edu/algorithms_reference.html)).
- **Structure/chorus detection:** self-similarity matrix + Foote novelty curve (MSAF); newer **Correlation Block-Matching** ([ISMIR](https://transactions.ismir.net/articles/10.5334/tismir.167)); chorus-specific SOTA is supervised CNN multi-task ([arXiv:2103.14253](https://arxiv.org/pdf/2103.14253)). Not a stock library call.
- **Accuracy ceiling:** top systems reach **~86.4% Accuracy2** on raw GiantSteps annotations, **~94.0%** after crowd-correction; stable-tempo restriction improves SMC by **+18.4 pp**. Metrics: F-measure at **±70ms**, Accuracy1 = within 4%, Accuracy2 = within 4% of ground truth *or* a 2×/3×/½×/⅓× octave multiple ([ISMIR — Are We Done Yet?](https://transactions.ismir.net/articles/10.5334/tismir.43), [MIREX](https://www.music-ir.org/mirex/wiki/2019:Audio_Beat_Tracking)).
- **Gate on confidence:** low detector confidence should widen cut tolerance to ±1–3 frames or force manual markers, never blind trust.

### 5.7 Licensed songs and "trailerization"
**Trailerization** = an existing song **slowed down, re-keyed (often minor), stripped to piano/solo-vocal, rebuilt as a build-and-explode arrangement, lyrics intact.** The industry verb is literally *"trailerizing"* ([Variety](https://variety.com/2021/music/news/trailers-using-new-versions-classic-songs-1235048795), [Collider](https://collider.com/movie-trailer-songs-popular-covers/), [TV Tropes: Moody Trailer Cover Song](https://tvtropes.org/pmwiki/pmwiki.php/Main/MoodyTrailerCoverSong)). **[H]** Why it works: recognizable melody + unexpected ominous treatment = maximal emotional contrast at minimal setup cost. **Legal:** a trailerized cover **still needs a sync licence from the original composition's publisher** — you avoid the *master* licence, not the *publishing*. Needle-drop discipline: the **lyric hook must land on a picture beat** — classic needle-drops sync the song's title word to the title card or the money shot.

### 5.8 The death of "trailer voice"
Don LaFontaine died **1 Sept 2008** after **5,000+ trailers**; VO was already declining and is now effectively extinct in wide-release marketing ([CNN obit](https://www.cnn.com/2008/SHOWBIZ/Movies/09/02/obit.lafontaine/index.html), [The Lost Art of Trailer VO](https://andrewmoodie.co.uk/the-lost-art-of-trailer-voiceover-narration/)). **[H]** Replacements in order of load-bearing importance: **(1) big bold title/copy cards punctuating the edit's rhythm** — cards do the narration's job silently; **(2) sound design (braam/riser/impact) carrying emotional signposting; (3) selected in-film dialogue treated as copy — the "perfect line."** Structural driver: **music and cards need no translation** — international marketing economics, not taste, killed VO. **[M]**
**Consequence for Direkta: do not generate a narrator TTS voice.** Cards + score + 3–6 dialogue lines is the modern register; a booming VO reads as parody.

### 5.9 Sound-design layering
Trailer sound design runs **well over a dozen SFX tracks** (Lieu). Techniques: **audio pre-lap** (start the next scene's audio before the previous shot ends) as the primary bridging device; whooshes on every non-straight transition; impacts on every card slam; a drone under everything; sweetening punches harder and impacts boomier than reality ([Lieu, Secrets to Trailer Sound Design](https://www.derek-lieu.com/blog/2022/1/17/secrets-to-trailer-sound-design)). **[H]**

---

## 6. Genre / mood variations

| Genre | Pacing shape | Length skew | Music | Ending frame | Spoiler policy |
|---|---|---|---|---|---|
| **Action / blockbuster** | Hero's Journey | 2:00–2:30, ~100 cuts | 2–3 cues, percussion-forward, 110–140 BPM | Action flourish + button | Disclose (franchise/sequel) |
| **Horror** | The Assault, or Slow Burn into Assault | **Shortest** — mystery is the product | Gentle calm → **silence** → disruption; drone floor | Dark; whispered line without a face | **Withhold** — never show the creature fully |
| **Sci-fi** | Slow Burn | Short | Braam-forward, sub drops | Scale reveal | Withhold the premise twist |
| **Comedy** | Hero's Journey with joke-density in Act 2 | 2:00–2:30 | Upbeat needle-drop, 110–140 BPM | **On a laugh**, smash to black | Disclose (jokes sell) |
| **Romance / A24 mood piece** | **The Dream** (peaks mid, winds down) | 1:30–2:00 | Trailerized song, piano/solo-vocal, 60–100 BPM | Warm | Premise + mood only, no plot |
| **Prestige drama / mystery** | Slow Burn | Longer | Single cue, gradual build | Held image + title | **Withhold third act** |
| **Documentary / sports / historical** | Slow Burn | **Longest** — most information to convey | Underscore + interview beds | Statement card | Disclose |
| **Anime adaptation PV** | Hero's Journey slaved to OP/ED | Main PV 1:01–1:54 | **The theme song itself**; climax = chorus entry | Title logo → 放送日 card + sakuga flourish | **Disclose — fidelity-signalling** |
| **Anime original PV** | Slow Burn / Hero's Journey | Same durations | Trailer cue or theme song | Same tail stack | **Withhold** (Hollywood mode) |

**Anime-specific mood mechanics:**
- **Sakuga** = a burst of drastically elevated animation quality, usually in high-intensity action or any moment demanding fluid motion ([LiveAbout](https://www.liveabout.com/sakuga-animation-in-anime-144807)). **[H]** PV footage is often finished earlier and receives concentrated attention from senior staff — which is why PVs look more polished than broadcast, and why "the trailer betrayed us" discourse exists ([thedigitalweekly](https://thedigitalweekly.com/when-an-anime-can-t-quite-live-up-to-its-incredible-trailer-why-hype-fails/)) **[M]**. Some PVs contain **PV-exclusive animation** cut only for the promo ([WithTheWill / Digimon example](https://withthewill.net/threads/digimon-adventure-beyond-pv-announced-premieres-in-march-everyone-is-grown-up-director-kakudou-returns.32557/)).
- **Sakuga placement convention:** 1 flash in the cold open (0.5–1s "we can animate" proof), the **best cut held longest at the song drop**, and a final flourish under the logo. **[L]**
- **主題歌解禁** (theme-song unveiling) is often the marketing *event* the PV exists to deliver — "ED主題歌の一部音源も初解禁". The picture edit is therefore slaved to the song, not to a trailer cue. Anime songs are engineered for this: J-pop/J-rock hybridized with orchestral and EDM textures, **hook-forward structures with instantly memorable choruses** ([Melodigging](https://www.melodigging.com/genre/anime)) — a 90s OP arrangement already contains a trailer-shaped build. Two 番宣CMs are commonly cut, **one on the OP and one on the ED** ([例](https://topics.smt.docomo.ne.jp/article/thetv/entertainment/thetv-1404186)).

---

## 7. Production pipeline

### 7.1 How trailer houses actually work (the commercial shape)
([The Ringer](https://www.theringer.com/2018/07/23/movies/movie-trailer-editors-marvel-pixar-how-made)) **[M — best single source]**
- A studio briefs **3–4 trailer houses** simultaneously; each returns **2–3 initial cuts**; often **5+ pass muster**.
- Initial work pays **~$50,000 with 1–2 revision rounds**; winning the "finish" (theatrical + teaser + TV spots + online) can pay **millions**.
- Editors get **4–5 days** to screen dailies and find the pacing.
- **"Most trailers are getting up past 30 versions"**; some exceed **100 versions** over months of notes.
- Source material is watermarked dailies, "hours and hours" of it; for animation, **storyboards and animatics** long before finished frames.
- Trailer Park runs a **24-hour graveyard shift** for post-9pm emergency recuts.
- Music is frequently **not** the film's score — bespoke covers (e.g. a friend's Mexican-guitar cover that became *Coco*'s trailer bed).
- Team: **creative director, editor, music supervisor/coordinator, graphics/design, producer**. Music supervisors audition cues **against picture**, request alt mixes or custom edits from libraries, and manage clearance on day-scale deadlines ([SyncPlacement](https://syncplacement.com/blog/trailer-music-licensing/)). **[H]**

### 7.2 The editorial order of operations — "radio cut first"
([Film Editing Pro](https://www.filmeditingpro.com/how-to-begin-your-trailer-music-editing-process/)) **[H]**
1. **Lay visual anchors first** — studio logos, date card, copy cards, main title graphic as timeline landmarks.
2. **Open the music bin second.** "Block out the moods of the trailer and imagine how the story flows from one section to the next." Select **2–3 cues** mapped to acts.
3. **Rough the music arrangement to the anchors and perfect it before touching picture.** *"It might take you an entire day to find the right flow."*
4. **Build a radio cut** — *"a lot of trailer editors think of the early stages of a cut almost like a radio spot: telling a story and creating emotion using only sound."* Dialogue + music + SFX, no picture committed. **This is the inverse of feature editing.**
5. **Cut picture to the radio cut**, filling troughs (§5.5).
6. **Layer sound design** (a dozen-plus SFX tracks), sweeten, mix.
7. Notes, notes, notes.

### 7.3 The A/V script (the artifact to emit before generation)
Two columns, one row per beat, with running timecode:
`AUDIO (VO/dialogue/lyrics/SFX/music cue + section) | VIDEO (shot description, card copy, duration)`
This is the artifact Direkta's "Trailer Bible" should emit — **the VIDEO column doubles as the shot-generation prompt queue.** **[L — standard ad-industry format, apply directly]**

### 7.4 Mapped onto Direkta's script → bible → shotlist → AI clips → stitch
| Direkta stage | Trailer-module job | Output artifact |
|---|---|---|
| **Script / source** | Mine dialogue into 4 buckets: exposition · rhetorical questions · context statements · the "perfect line". Break each line into segments. | Dialogue bank, tagged |
| **Movie Bible** | Freeze the continuity locks the whole trailer will repeat verbatim: character physical descriptions, palette words, lighting logic, world nouns. Set format (runtime, pacing shape, spoiler policy, aspect ratios). | **Trailer Bible** = format spec + continuity locks + card copy |
| **Beat/music pass** (new, before shotlist) | Select or generate 1–3 cues; produce the beat map (§5.6); build the **radio cut** — dialogue + music + SFX at full length, zero picture. | `beat_map.json` + radio cut WAV + A/V script with timecodes |
| **Shotlist** | Convert the A/V script's VIDEO column into hero-clip prompts. Apply noun→image mapping. Reserve negative space where cards will sit. Assign each shot a target sync point and a target duration from the cut budget. | Shotlist rows: `{t_in, duration, sync_point_type, prompt, aspect, card_overlay?}` |
| **AI generation** | Generate hero clips per the **§8.2 cut-budget formula** — typically **~24–40 for a 2:00 trailer**, scaling with runtime (not a flat 12–20, and not 65–95) — at 5–10s each. Reference-image lock every character. | Clip bank |
| **Stitch / edit** | Harvest 2–4 cuts per clip via sub-range selection, punch-in, speed ramp, mirror. Quantize to beat map with `cut_offset_frames`. Insert cards, black slugs, dropout, title, button. | Master 16:9 + 9:16 + :30 spot |
| **Sound finish** | Whoosh on every non-straight transition, impact on every card slam, drone bed, pre-lap bridges, 1–3 beat (~0.5–1.9s at 95–120 BPM) dropout before title, landing on the downbeat (rule 26). | Final mix (24-bit/48 kHz master, 16-bit/44.1 kHz for digital) |

---

## 8. AI-generation implications

### 8.1 Why the trailer form is *unusually* friendly to 5–10s AI clips
- **Trailer ASL is 0.5–2.5s**, far under the 5–10s a model produces per clip — **harvest 2–4 usable cuts from a single generation** by selecting sub-ranges, as a blended baseline. §8.2 splits this further into 1–2 cuts/clip for setup-class shots and 4–8 cuts/clip for climax-montage shots — a single flat multiplier under-produces the cut budget at either extreme.
- **The Grid / Kuleshov principle means shots need not be continuous.** Continuity failure is the trailer form's *native condition*, not a defect ([MovieTrailers101](http://www.movietrailers101.com/trailer-editing-just-like-feature-film-editing-only-more-so/)).
- **Establishing shots are dispensed with anyway** — no need to generate coherent geography.
- **Dip-to-black explicitly licenses discontinuity:** "if there was a fade to black between these two shots, you wouldn't even consider trying to find a connection" ([Lieu](https://www.derek-lieu.com/blog/2019/3/27/the-dip-to-black)). Every seam the pipeline can't hide, a black slug legitimizes.
- **Cards reset the viewer's continuity expectation** — the shot after a card is not required to relate to the shot before it.

### 8.2 Shot budget and derivation
**Derive the hero-clip count from the cut budget — do not assert it.** An earlier version of this guide claimed both "a complete AI trailer wants 6–12 well-chosen shots, not 40+" and, one sentence later, "generate ~12–20 hero clips" ([Seedance guide](https://www.seedance.tv/blog/seedance-movie-trailer-guide-2026)) — two different numbers for two different things (visual concepts vs. generation count) presented as if reconciled. Neither reaches the §2.5 cut budget: even 20 clips at the doc's own general-baseline **2–4 cuts/clip** (§8.1) tops out at 80 cuts against a 65–95 requirement, and the low end (12 × 2 = 24) is roughly a third of the floor. **[L — synthesized correction]**

**Formula:**
```
required_picture_cuts = total_cut_budget − card_moments      // §2.5 total minus §8.6 count
minimum_clips          = required_picture_cuts ÷ cuts_per_clip
```
`cuts_per_clip` is not uniform — it tracks the target ASL for that act (§2.5):
- **Setup-class clips** (cold open, Act 1, Act 2, the dropout hold — ASL 1.2s and up): **1–2 cuts/clip.** Mostly used as one continuous take, occasionally split into an in/out pair.
- **Climax-montage clips** (ASL 0.5–1.5s, the deceleration ladder in §4.2, harvested via sub-range selection + 2× punch-in crops + speed ramps per rule 33): **4–8 cuts/clip.** Practitioner guides independently support treating climax/hook shots differently from the rest of the piece — generating **3–5 prompt variants** for the opening hook and climax specifically, vs. a single pass elsewhere ([Picasso — AI movie trailer guide, 2026](https://blog.picassoia.com/how-to-make-a-movie-trailer-with-ai-video)). **[M]**

**Worked instantiation at 2:00**, using §2.5's own shot-count table:
- Total cut budget **65–95** (rule 18) minus card moments **6–10** (§8.6) → required picture cuts **55–89**.
- Non-climax shots (cold open 3–5 + Act 1 10–14 + Act 2 20–28 + dropout 1–2 = **34–49**) ÷ 1–2 cuts/clip → **17–49 clips**.
- Climax-montage shots (**25–40**) ÷ 4–8 cuts/clip → **4–10 clips**.
- **Minimum hero-clip floor: ~21–59**, narrowing to a realistic operating band of **~24–40 hero clips** at typical harvesting efficiency — scale proportionally at other runtimes (§2.5).

Reserve the highest generation budget (most prompt variants, tightest reference-image lock) for the **3–5 money shots** and, for anime, the **three sakuga positions**.

### 8.3 Continuity discipline — three locks
1. **Anchor characters with reference images + verbatim-repeated physical descriptions** across every prompt.
2. **Lock the palette in words** ("teal and orange", "desaturated blue night") in *every* prompt.
3. **Lock the lighting logic** — don't jump night-rain → bright day unless the story demands it.
*"Consistency comes from repetition, not hope."* ([Seedance guide](https://www.seedance.tv/blog/seedance-movie-trailer-guide-2026)) **[M]**

### 8.4 Per-shot prompt formula (5 parts)
`shot type & lens → subject & action → setting & atmosphere → camera movement → lighting + audio cue`
Example: *"anamorphic lens, slow cinematic crane-up, cold blue and magenta tones, audio: distant city hum, light rain, low sustained drone."*

### 8.5 What to plan at prompt time (not fixable later)
- **Negative space** where the title/copy card will sit — decide before generating.
- **Aspect ratio** — frame the action inside a centre-safe 9:16 zone even in 16:9 generations; generate natively vertical where supported.
- **Motion direction and speed** — a motion-sync beat needs a motion that *lands*, so prompt for an action that resolves (a head turn completing, a door slamming shut, an impact) rather than an ambient loop.
- **A repeated shape/gesture/graphic across two prompts** so a match cut is available at each act break.
- **Held-frame candidates** — at least one shot prompted as slow/static to serve the pre-climax dropout hold.
- **Audio cue in the prompt** so native audio, where produced, is a usable sweetening layer.

### 8.6 Cards are free real estate
Cards cost **zero generation credits**, occupy **2–5s each**, and a 2:00 trailer legitimately carries **6–10 card moments** (rating band, logos, 2–4 copy cards, pedigree, title, date, button tag). That is **15–30 seconds of runtime needing no AI video at all** — roughly a fifth of the piece.

### 8.7 Sound design carries the credibility
Model-generated video is visually plausible but **acoustically thin**. Sound design is where an AI trailer earns credibility: layered risers, whooshes on every transition, impacts on every card slam, drones under everything, and **audio pre-lapping** the picture. Treat any native clip audio as a layer to sweeten, never the final mix. **Silence is the cheapest premium effect in the toolkit** — a 1–3 beat (~0.5–1.9s at 95–120 BPM, rule 26) full dropout before the title costs nothing and is the format's most reliable move.

### 8.8 Failure-mode playbook (what to do when a seam won't reconcile)
| Symptom | First response (cheap) | Escalate to regenerate only if |
|---|---|---|
| Character identity drift between shots | Insert a card or black slug between them; or reframe to exclude the face | It's the same continuous action inside the climax montage |
| Palette / lighting jump | Colour-grade both toward the locked palette; or dip to black | The two shots must read as one continuous space |
| Geography break | Do nothing — trailers have no establishing shots | Never |
| Motion doesn't land on the beat | Speed-ramp the clip to fit the trough; or switch to effect-sync | The shot is a designated money shot |
| Clip too short for its slot | Reverse-and-loop, or hold the last frame under a card | Visible freeze artefact |
| Clip visually weak but structurally needed | Cut it to ≤0.5s inside the climax montage where nothing registers individually | It's a money shot |

---

## 9. Skill rules

> Numbered, imperative decision rules for the Direkta trailer agent. Grouped by topic. These are the distillation target for the skill rule-file.

### A. Format & planning (1–5)
1. **Pick a runtime and pacing shape before anything else.** Teaser → **60–90s, 2 acts**. Standard trailer → **100–120s, 4 acts**. Spot → **:15 or :30, one idea**. Vertical social cut → **20–25s, whole arc compressed**. Anime Main PV → **60–115s**. Never exceed **150s**; default to **~114s** (empirical mean). **150s is the legacy MPAA-era cap (§2.3) and already breaches Cinema United's (formerly NATO's) current ≤2:00 theatrical guideline — treat it as the outer bound for a distributor's 1–2 yearly exceptions, not a target.** Then choose exactly one of: Slow Burn · Hero's Journey (default) · The Assault · The Dream.
2. **Build the 4-act skeleton before generating a single frame:** Cold Open → Setup → Escalation → Climax. Emit the **A/V script** (two columns, running timecode) first; the VIDEO column *is* the shot-generation queue. **Treat §2.5/§2.6's timecodes as advisory targets only — quantize every act boundary to the nearest 4/8-bar phrase boundary of the selected cue (§5.6); the musical grid always overrides the clock.**
3. **Enforce the dynamic-range law.** Assign each act an intensity 0–10. Reject any plan where Act-1 intensity ≥ Act-2 intensity, or where intensity never drops below 4 between the cold open and Act 2. "If it's high energy all the time, none of it is high energy."
4. **Satisfy the comprehension checklist before shipping: World, Character, Conflict, Stakes, Date.** If any is missing it's a sizzle reel, not a trailer. If more than **4 named characters** appear, cut characters — not runtime.
5. **Plan for the tightest aspect ratio first.** Compose action inside a centre-safe **9:16 (1080×1920)** zone even when generating **16:9 (1920×1080)**; generate natively vertical where the model allows rather than auto-reframing. Ship 16:9, 9:16 and a :30 spot from the same shot bank. Master audio at 24-bit/48 kHz; deliver digital at 16-bit/44.1 kHz.

### B. Hooks & head-of-piece (6–8)
6. **Front-load a hook inside 3 seconds** and land the core idea by **0:07** (spots: an interesting moment inside **5–7s**). Never open on a logo, a slow branded cold open, or a preamble.
7. **Order the head as cold open → logos → body.** Logos get **~2s, static or near-static**; play a full logo animation only for a brand the audience is happy to see. Put unknown-label logos at the **tail** instead.
8. **Add a 3–5s pre-hook bumper** for any cut destined for a social feed or YouTube pre-roll (fills the 5s skip window; reported ~4× retention lift). Omit it for theatrical/premium-brand contexts.

### C. Music-first workflow (9–13)
9. **Choose music before picture.** Select **2–3 cues** (one per act), or **1 cue** if runtime ≤120s with a gradual build. Reserve the strongest cue for the finale — the energy peak must sit at the very end.
10. **Cut a radio edit before a picture edit.** Assemble dialogue + music + SFX to full length with no picture committed. If the radio cut doesn't tell the story with your eyes closed, the picture edit will not save it.
11. **Structure the cue as `INTRO – # – BUILD – # – CLIMAX I – # – CLIMAX II – # – OUTRO`,** with a deliberate gap at each `#`. The legacy reference template runs **5 equal ~19.4%-of-runtime sections + a ~3.2% button** (the 155s = 30/30/30/30/30 + 5s form in §5.2, itself a ~2:35 piece that already exceeds Cinema United's ≤2:00 guideline — do not default to it). **Instantiate proportionally at the chosen runtime instead:** ~22s ×5 + ~4s button at the 114s default; ~17–18s ×5 + ~3s button at 90s. Require stems (minimum: full mix, percussion-only, underscore, drumless) so the cue can be rebuilt to picture.
12. **Grid the music before cutting.** Detect beats automatically — never tap-tempo (hand taps run **100–250ms late**). Flag the downbeat of every 4-bar phrase as a legal splice point. Respect 8/16/32-bar section boundaries. **Act boundaries are quantized to this grid, never read literally off a fixed timecode table — see §2.5's precedence rule.**
13. **Apply a global early-cut offset of −1 to −3 frames** (`cut_offset_frames`) to every beat-quantized cut; on-the-beat or late reads mushy, 1–3 frames early reads tight. Verify frames/beat is near-integer for the chosen fps; if not, segment by locally-stable tempo and recompute the grid per segment rather than extrapolating one grid.

### D. Dialogue, cards & copy (14–17)
14. **Place dialogue only in troughs, never on musical peaks.** Query the beat map's `troughs` array (§5.6) for the next trough's `start`/`end`/`duration_sec`; choose or rewrite each line to fit inside that duration exactly (§5.5's "choose the line by the length of the trough," now executable rather than manual). Never place a line where an onset's `weight ≥ 0.6`. Leave no dead air unless the silence is deliberate.
15. **Map nouns to images.** For every selected dialogue line, extract the concrete nouns and generate one shot per noun. This is the default picture-to-dialogue binding rule. Pair exposition with literal visuals and rhetorical questions with abstract imagery; a question is the standard on-ramp to an action sequence.
16. **Budget 6–10 card moments per 2:00 trailer.** Hold each **≥ 13 characters/second** (a 30-char line ≥ 2.3s); 1–3 words = 2.5–4s; 4–8 words = 4–7s. Cut cards **on** musical hits. Generate hero shots with negative space reserved for title placement.
17. **Never generate a narrator VO.** Cards + score + 3–6 dialogue lines is the modern register; a booming trailer voice reads as parody. Cards do the narration's job silently and need no translation.

### E. Cutting & pacing (18–23)
18. **Accelerate shot length monotonically into the climax.** Cold open **2.5–4.0s** → Act 1 **2.0–3.0s** → Act 2 **1.2–2.0s** → Act 3 montage stepping **2.5 → 2.0 → 1.5 → 1.0 → 0.5s**. **No Act-3 shot may exceed the shortest Act-2 shot.** Total ~**65–95 cuts** in 2:00; scale linearly with runtime (§2.5) for other formats — e.g. ~62–90 at the 114s default, ~49–71 at 90s.
19. **Budget cuts per section, not per beat:** `n_cuts = round(section_duration / avg(target_avg_shot_sec))`, mapping energy → pace (energy 0.3 → 4–6s shots; energy 0.9 → 0.5–1.5s). Use **bar-length cuts (every 4 beats) for builds, beat/half-beat cuts only at payoffs.** Enforce minimum spacing ≥ 1 beat.
20. **Spend the cheapest sync mode that works:** cut-sync for structural beats, **motion-sync** (hold the shot, land the internal motion on the beat) for held moments, **effect-sync** (flash, shake, glitch) for high-frequency hits you don't want to spend a cut on. Vary tightness deliberately — perfect beat-for-beat matching ("Mickey Mousing") becomes monotonous.
21. **Rank sync points by accent weight:** non-metrical trailer hit/boom (1.0, overrides the grid) > downbeat kick (1.0) > lyric-hook onset (0.85) > snare backbeat (0.6) > hi-hat/subdivision (0.2, effect-sync only) > sustained tonal material (never a cut point). A weight-1.0 non-metrical hit near a title card or hero reveal **always wins the slot**.
22. **Default to straight cuts; ration dips to black.** Straight cut when the next shot builds on the previous idea; dip to black only when the next idea must feel *separate*. Cap dips at roughly **one per act break plus the black-slug pulse section** — overuse reads as amateur.
23. **Manufacture a match cut at each act break.** Repeat an action, gesture, shape or graphic across two unrelated shots. This is the cheapest way to imply thematic unity in material that has none, and the highest-value technique available to an AI pipeline. Do not open on establishing shots — omit them entirely.

### F. Transitions & sound design (24–26)
24. **Put a whoosh on every non-straight transition** (dip to black, dip to white, dissolve, flare, speed ramp) and an impact on every card slam. A transition without a sound effect reads as a mistake. Bridge scene changes by **pre-lapping** the next shot's audio under the outgoing one.
25. **Use white flash frames of 8–12 frames** and single black/white frames as accent-only devices, locked to music hits — never decoratively.
26. **Insert a mandatory pre-climax dropout, sized in bars/beats, not seconds: 1–3 beats (≈ half a bar) of near-total silence, up to a full bar for slower cues, after a hard cut to black.** The silence ends and the sub-bass boom lands exactly on the next downbeat — or on a non-metrical trailer hit (§5.6, weight 1.0) if the boom is scored as one. **The title card appears in the same frame as the boom** (i.e., on that same downbeat or hit), never floating free of the grid. At the doc's 95–120 BPM epic-cue cluster this is ~0.5–1.9s of silence. Non-negotiable; it is the format's highest-yield move and costs nothing.

### G. Endings (27–28)
27. **End with a title card, then a button.** The button is **3–5s**, arrives *after* the title, and lands on a smash cut to black.
28. **Genre-match the final frame:** horror ends dark, comedy ends on a laugh, romance ends warm, action ends on a flourish, prestige ends on a held image. The ending is often the only part the audience remembers.

### H. Content policy & anime mode (29–32)
29. **Set spoiler policy by content type, not by taste.** Adaptation of known source (manga/novel/sequel/franchise) → **disclose**, optimize for fidelity-signalling ("we animated THAT scene"). Original / horror / prestige / mystery → **withhold** the third act, market premise and mood. Never reveal a death, a twist identity, or a resolution in an original property.
30. **Introduce characters in this order:** protagonist alone → the world/normalcy → the disruptor → the ensemble group shot → **the antagonist's face last**. Don't name-check performers the audience doesn't know.
31. **For anime PVs, ship the release ladder as separate deliverables:** Teaser PV **16–30s** (motion-manga/stills legal) → Main PV **60–115s** → Character PVs **17–24s each** → 番宣CM **:15 / :30**. Each rung must carry a *new information payload* (staff → cast → theme song + date), not merely new footage. Cast reveals use `character name +「CV: 声優名」` over that character's cut; staff cards run 原作 → 監督 → シリーズ構成 → キャラデザ → 音楽 → 制作.
32. **In an anime PV, slave the climax to the theme song's chorus entry** rather than to a trailer cue, and stack the tail as: title logo → broadcast date → networks → streaming platforms → ©-line. Place **sakuga money shots at three fixed positions**: a ≤1s proof-of-quality flash in the cold open, the longest-held shot at the song drop, and a final flourish under the logo — and reserve the highest generation budget for exactly those three.

### I. AI generation & repair (33–35)
33. **Derive the hero-clip count from the cut budget — never assert a flat number.** `required_picture_cuts = total_cut_budget − card_moments; minimum_clips = required_picture_cuts ÷ cuts_per_clip`, computed separately for setup-class clips (**1–2 cuts/clip**) and climax-montage clips (**4–8 cuts/clip** via sub-range harvesting, 2× punch-in crops, speed ramps, reversals and mirrors). Typically **~24–40 hero clips for a 2:00 trailer** (not 12–20, and not 65–95); scale with runtime per §2.5. Reserve top budget for the 3–5 money shots.
34. **Lock consistency by repetition, not hope:** reference images plus verbatim-identical character descriptions in every prompt; the palette named in words in every prompt; a single lighting logic across the piece. Use the 5-part prompt formula: `shot type & lens → subject & action → setting & atmosphere → camera movement → lighting + audio cue`. Prompt at least one static/slow shot for the dropout hold, and a repeated shape/gesture for each act-break match cut.
35. **When two AI shots cannot be reconciled (identity drift, palette jump, geography break), do not regenerate first — insert a black slug or a title card.** Both are licensed by the form to sever the continuity contract, and cards cost zero credits. Regenerate only when the seam falls inside the climax montage, where black slugs would kill momentum, or when the shot is a designated money shot.

---

## 10. Sources

**Trailer craft — Derek Lieu Creative**
[Basic Trailer Story Structure](https://www.derek-lieu.com/blog/2017/9/10/the-matrix-is-a-trailer-editors-dream) · [How Trailers Tell a Story With Pacing](https://www.derek-lieu.com/blog/2020/1/20/how-trailers-tell-a-story-with-pacing) · [How Trailer Editors Edit Dialogue to Music](https://www.derek-lieu.com/blog/2022/3/14/how-trailer-editors-edit-dialogue-to-music) · [Why to Make More Straight Cuts](https://www.derek-lieu.com/blog/2021/9/27/why-to-make-more-straight-cuts-in-trailers) · [The Dip to Black](https://www.derek-lieu.com/blog/2019/3/27/the-dip-to-black) · [Secrets to Trailer Sound Design](https://www.derek-lieu.com/blog/2022/1/17/secrets-to-trailer-sound-design) · [No Logo](https://www.derek-lieu.com/blog/2019/1/19/no-logo) · [The Inception BRAAAM](https://www.derek-lieu.com/blog/2017/12/3/the-inception-braaaaaaam-sound) · [Establishing Shots Don't Establish Much](https://www.derek-lieu.com/blog/2020/1/12/game-trailer-establishing-shots-dont-establish-much) · [What I'm Thinking When I Edit a Trailer](https://www.derek-lieu.com/blog/2018/1/6/what-im-thinking-when-i-edit-a-trailer) · [Essays index](https://www.derek-lieu.com/essays)

**Trailer craft — Film Editing Pro & trade**
[Music Editing Process](https://www.filmeditingpro.com/how-to-begin-your-trailer-music-editing-process/) · [Top Visual Devices](https://www.filmeditingpro.com/hollywood-trailer-editing-basics-top-visual-devices/) · [Lengths & Formats](https://www.filmeditingpro.com/trailers-teasers-promos-lengths-formats-tips/) · [The Ringer — inside trailer houses](https://www.theringer.com/2018/07/23/movies/movie-trailer-editors-marvel-pixar-how-made) · [Wrapbook — movie trailer house](https://www.wrapbook.com/blog/movie-trailer-house) · [Chris Jones Blog — Ross Evison interview](https://chrisjonesblog.com/2012/02/how-to-edit-a-trailer-for-your-movie%E2%80%A6-but-the-guy-who-cuts-trailers-for-movies.html) · [MovieTrailers101 — The Grid & match cuts](http://www.movietrailers101.com/trailer-editing-just-like-feature-film-editing-only-more-so/) · [Filmsupply — cutting the perfect trailer](https://www.filmsupply.com/articles/how-to-cut-the-perfect-film-trailer/) · [Epikton — pacing beat maps](https://epikton.net/a-quick-guide-to-pacing-in-trailers/) · [Pexo — how to make a movie trailer](https://pexo.ai/tutorial/how-to-make-a-movie-trailer) · [TrailerMade — Fade to Black](https://medium.com/@TrailerMadeTV/anatomy-of-a-trailer-fade-to-black-41c33fee48e0) · [SlashFilm — Trailers Before Trailers](https://slashfilm.com/trailers-before-trailers) · [Backstage — smash cuts](https://www.backstage.com/magazine/article/smash-cut-film-example-76088/) · [Tropedia — The Stinger](https://tropedia.fandom.com/wiki/The_Stinger) · [Movie Marker — trailer sound design](https://www.moviemarker.co.uk/giving-film-trailers-a-clearer-identity-using-proper-sound-design-strategies/) · [A2 Media — codes & conventions](http://jlhaughton.blogspot.com/2010/10/codes-conventions-of-film-trailers.html) · [indietalk — flash frame spec](https://indietalk.com/archive/index.php/t-34499.html) · [CreativeCOW — shot lengths in trailers](https://creativecow.net/forums/thread/length-of-shots-in-trailers-2/)

**Length, regulation & data**
[Stephen Follows — trailer length data](https://stephenfollows.com/p/long-average-movie-trailer) · [We Minored in Film — NATO 2014 guidelines](https://weminoredinfilm.com/2014/01/27/u-s-theater-owners-officially-enact-guidelines-to-limit-film-marketing-lead-time-trailer-length/) · [THR — NATO proposal](https://www.hollywoodreporter.com/movies/movie-news/theater-owners-seek-new-rules-559164/) · [Deadline — NATO rebrands as Cinema United (2025)](https://deadline.com/2025/03/nato-rebrands-as-cinema-united-1236329732/) · [Cinema United — In-Theater Marketing Guidelines PDF](https://cinemaunited.org/wp-content/uploads/2014/01/NATO-In-Theater-Marketing-Guidelines-1.7.14.pdf) · [todayifoundout — band colours](https://www.todayifoundout.com/index.php/2010/09/the-color-of-the-background-preceding-movie-trailers-actually-means-something/) · [MPA rating/band system](https://en.wikipedia.org/wiki/Red_band_trailers) · [Wikipedia — Money shot](https://en.wikipedia.org/wiki/Money_shot) · [Storyblocks — video editing glossary](https://www.storyblocks.com/resources/blog/video-editing-terms) · [Widescreen Journal — cutting rates](https://widescreenjournal.org/wp-content/uploads/2022/08/formatted-cutting-rates.pdf) · [ResearchGate — analysing motion picture cutting rates](https://www.researchgate.net/publication/362833910_ANALYSING_MOTION_PICTURE_CUTTING_RATES) · [World of Reel — director ASL](https://www.worldofreel.com/blog/2026/7/25/film-directors-and-average-shot-length) · [Filmmakers Academy — ASL](https://www.filmmakersacademy.com/glossary/average-shot-length-asl/) · [VashiVisuals — music video editing stats](https://vashivisuals.com/music-video-editing-stats/)

**Music, sound & licensing**
[SyncPlacement — trailer music licensing/deliverables](https://syncplacement.com/blog/trailer-music-licensing/) · [Richard Pryn — cue structure](https://richardpryn.com/how-to-structure-trailer-music/) · [Evenant — 10 trailer music tips](https://evenant.com/10-essential-trailer-music-tips/) · [No Film School — edit trailer music](https://nofilmschool.com/how-to-edit-trailer-music) · [ModWheel — trailer music VSTs](https://modwheel.net/cinematic/best-trailer-music-vst) · [Variety — trailerized songs](https://variety.com/2021/music/news/trailers-using-new-versions-classic-songs-1235048795) · [Collider — trailer cover songs](https://collider.com/movie-trailer-songs-popular-covers/) · [TV Tropes — Moody Trailer Cover Song](https://tvtropes.org/pmwiki/pmwiki.php/Main/MoodyTrailerCoverSong) · [CNN — LaFontaine obituary](https://www.cnn.com/2008/SHOWBIZ/Movies/09/02/obit.lafontaine/index.html) · [The Lost Art of Trailer VO](https://andrewmoodie.co.uk/the-lost-art-of-trailer-voiceover-narration/) · [Melodigging — anime music genre](https://www.melodigging.com/genre/anime)

**Beat-sync engine (shared)**
[Tools for Film — BPM and Picture](https://www.toolsforfilm.com/blog/bpm-and-picture-editors-guide) · [ClipMusic — BPM for video editors](https://clipmusic.ai/blog/bpm-video-editing-guide) · [WeVideo — sync glossary](https://www.wevideo.com/glossary/sync) · [Movavi — syncing audio and visuals](https://www.movavi.io/syncing-audio-and-visuals-to-create-engaging-videos/) · [Opus — AI beat sync](https://www.opus.pro/blog/best-ai-beat-sync) · [Wideframe — AI cuts-to-beat matching, phrase boundaries](https://try.wideframe.com/blog/how-to-use-ai-to-match-cuts-to-music-beats/) · [Creative COW — edit to beat or lyrics](https://creativecow.net/forums/thread/music-videos-edit-to-the-beat-or-lyrics-2/) · [MusicRadar — song sections](https://www.musicradar.com/how-to/song-sections-explained-intro-verse-chorus-middle8-outro-tag-bridge) · [Ace Studio — song structure](https://acestudio.ai/blog/song-structure-explained/) · [Pro Audio Files — phrasing](https://theproaudiofiles.com/phrasing/) · [DJing Tips — track structure](https://www.djingtips.com/how-to-dj/track-structure/) · [Whipped Cream Sounds — transients](https://www.whippedcreamsounds.com/what-are-transients-in-music-why-are-they-important-explained/) · [SoundCy — transient sound](https://soundcy.com/article/what-is-a-transient-sound) · [Mystic Alankar — hi-hat/snare patterns](https://mysticalankar.com/blogs/blog/hi-hat-and-snare-patterns-a-guide-for-beatmakers) · [Audible Genius — kick/snare/hi-hat roles](https://audiblegenius.com/blog/the-roles-of-the-kick-snare-and-hi-hat-in-a-drum-pattern) · [Unison Audio — RMS](https://unison.audio/what-is-rms-in-audio/) · [Analytics Vidhya — RMS vs amplitude envelope](https://www.analyticsvidhya.com/blog/2022/05/comparison-of-the-rms-energy-and-the-amplitude-envelope/) · [osu! wiki — file format timing points](https://osu.ppy.sh/wiki/en/Client/File_formats/osu_(file_format))

**Beat/tempo detection libraries & MIR literature**
[librosa — beat_track](https://librosa.org/doc/0.11.0/generated/librosa.beat.beat_track.html) · [librosa — dynamic beat example](http://librosa.org/doc/0.11.0/auto_examples/plot_dynamic_beat.html) · [DeepWiki — librosa beat tracking](https://deepwiki.com/librosa/librosa/5.2-beat-tracking-and-tempo-estimation) · [madmom — downbeats module](https://madmom.readthedocs.io/en/v0.16/modules/features/downbeats.html) · [madmom — arXiv:1605.07008](https://arxiv.org/abs/1605.07008) · [aubio — CLI manual](https://aubio.org/manual/latest/cli.html) · [aubio — onset method issue](https://github.com/aubio/aubio/issues/106) · [Essentia — algorithms reference](https://essentia.upf.edu/algorithms_reference.html) · [DeepWiki — Essentia rhythm](https://deepwiki.com/MTG/essentia/5.4-rhythm-and-beat-analysis) · [Foote — audio novelty segmentation](https://www.researchgate.net/publication/3863771_Automatic_audio_segmentation_using_a_measure_of_audio_novelty) · [ISMIR — Correlation Block-Matching segmentation](https://transactions.ismir.net/articles/10.5334/tismir.167) · [Emergent Mind — music structure analysis](https://www.emergentmind.com/topics/music-structure-analysis-msa) · [arXiv:2103.14253 — chorus detection CNN](https://arxiv.org/pdf/2103.14253) · [ISMIR — Music Tempo Estimation: Are We Done Yet?](https://transactions.ismir.net/articles/10.5334/tismir.43) · [MIREX — Audio Beat Tracking](https://www.music-ir.org/mirex/wiki/2019:Audio_Beat_Tracking)

**NLE tooling**
[aescripts — BeatEdit for Premiere Pro](https://aescripts.com/beatedit-for-premiere-pro/) · [Wondershare — BeatEdit guide](https://filmora.wondershare.com/ai-efficiency/beatedit-premiere-pro.html) · [JayAreTV — Resolve AI Beat Detector](https://jayaretv.com/edit/davinci-resolve-ai-beat-detector-explained/) · [PulseEdit — auto beat markers in Resolve](https://pulseedit.com/blog/auto-place-beat-markers-davinci-resolve.html)

**Anime PV specifics**
[LiveChart.me — PV durations index](https://www.livechart.me/videos) · [animatetimes — PV第2弾 / 主題歌解禁](https://www.animatetimes.com/news/details.php?id=1766735726) · [V-Storage — 本PV第2弾](https://v-storage.jp/anime/etc-anime/264632/) · [ANN — PV announcement corpus](https://www.animenewsnetwork.com/news/2026-03-29/sparks-of-tomorrow-tv-anime-promo-video-reveals-theme-songs-july-5-debut-more-cast/.235891) · [Magic Motion Studio — anime production timelines](https://magicmotionstudio.com/how-long-does-anime-animation-take/) · [LiveAbout — sakuga](https://www.liveabout.com/sakuga-animation-in-anime-144807) · [thedigitalweekly — when anime can't live up to its trailer](https://thedigitalweekly.com/when-an-anime-can-t-quite-live-up-to-its-incredible-trailer-why-hype-fails/) · [WithTheWill — PV-exclusive animation example](https://withthewill.net/threads/digimon-adventure-beyond-pv-announced-premieres-in-march-everyone-is-grown-up-director-kakudou-returns.32557/) · [TV Tropes — Trailers Always Spoil (Anime)](https://tvtropes.org/pmwiki/pmwiki.php/TrailersAlwaysSpoil/AnimeAndManga) · [TV Tropes — Spoiler Opening (Anime)](https://tvtropes.org/pmwiki/pmwiki.php/SpoilerOpening/AnimeAndManga) · [docomo topics — 番宣CM corpus](https://topics.smt.docomo.ne.jp/article/thetv/entertainment/thetv-1404186)

**Retention, text legibility & format specs**
[vidIQ — YouTube retention](https://vidiq.com/blog/post/increase-audience-retention-youtube/) · [humbleandbrag — retention benchmarks](https://humbleandbrag.com/blog/youtube-audience-retention-benchmarks) · [legibility.info — rules for text in videos](https://legibility.info/rules-for-text-in-videos) · [Dark Skies — movie title cards](https://darkskiesfilm.com/how-to-make-a-movie-title-card/) · [PremiumBeat — character title cards](https://www.premiumbeat.com/blog/stylize-video-with-character-title-cards/) · [Aeon — vertical video dimensions](https://project-aeon.com/blogs/a-guide-to-vertical-video-dimensions) · [picturesmith — aspect ratio for marketing video](https://picturesmith.com/notes/aspect-ratio-marketing-videos/)

**AI-generation practice**
[Seedance 2.5 — AI movie trailer guide](https://www.seedance.tv/blog/seedance-movie-trailer-guide-2026) · [Picasso IA — how to make a movie trailer with AI video (2026)](https://blog.picassoia.com/how-to-make-a-movie-trailer-with-ai-video)

**Spoiler debate**
[Mental Floss — why trailers give so much away](https://www.mentalfloss.com/article/643997/why-do-movie-trailers-give-so-much-away) · [thefilmnewsblitz — the great spoiler debate](https://thefilmnewsblitz.com/2026/07/14/films/film-analysis-are-film-trailers-revealing-too-much-the-great-spoiler-debate/)
