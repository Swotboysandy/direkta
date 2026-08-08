# Micro Drama Module — Research

> Research dossier for the Direkta micro-drama module. Purpose: seed an agent skill rule-file that can drive
> Direkta's pipeline (script → Movie Bible → shotlist → AI-generated 5–10s clips → stitched edit) to produce
> vertical short dramas at professional structural quality.
> Every number below is sourced. Conflicts between sources are flagged explicitly rather than averaged away.
> Section 9 is the distillation target — everything above it exists to justify the rules in it.

---

## 0. Vocabulary (use the industry's own words)

| Term | Meaning |
|---|---|
| **Duanju (短剧) / weiduanju (微短剧)** | Chinese term for the format. "Wei" = micro. Western labels: **vertical / microdrama / microseries**. "Vertical" is the trade shorthand — "30–40 vertical series shoot in LA every month" ([VerticalWriters](https://www.verticalwriters.com/)) |
| **Vertical-native** | Composed for 9:16 from script stage, *not* cropped from horizontal |
| **Shudian (竖店)** | Pun on Hengdian (横店, "horizontal store") → "vertical store"; purpose-built vertical studio complexes |
| **Explosion point / 爆点** | The first 15s. Chinese showrunners' literal term |
| **Beat Engine** | The 4-part episode chassis: **Hook / Friction / Spike / Button**. **Button** = the final 5–10s cliffhanger cut, cutting mid-revelation; the purchase prompt |
| **Episode wall / paywall** | Where free ends and coin unlocks begin |
| **Timestamp skeleton** | Writing the episode as 0:00 / 0:32 / 1:18 / 1:50 marks *before* any dialogue |
| **爽点 (shuǎng diǎn)** · **反转 (fǎnzhuǎn)** · **打脸 (dǎliǎn)** | "Satisfaction point" (cathartic payoff beat) · reversal/twist · "face-slapping," public humiliation of the antagonist — the core revenge unit |
| **Conflict density** | Dramatic turns per minute |
| **Zeigarnik effect** | Psych mechanism cliffhangers exploit (fixation on unfinished tasks) |
| **Binge cluster** | 20+ episodes per sitting, multiple short sessions daily |
| **Tag stack** | Character defined by Job tag + Social tag + Contrast tag (replaces character bible) |
| **Engine / Wall / Witness / Nuke** | The four *functional* character roles (§6.2) |
| **Character lock** | Freezing a character's visual identity with reference assets across 60+ eps (AI pipelines) |
| **Model routing** · **Usable-take rate** | Choosing generation model per shot type · share of generated shots passing review |
| **S-class production** · **投流 (tóuliú)** | Premium tier, ~$400–600K budget · paid traffic buying / UA spend, the dominant cost line in China |

Sources: [MinionArts 40-term glossary](https://www.minionarts.com/blogs/microdrama-glossary-40-terms-producers) · [Real Reel](https://www.real-reel.com/vertical-drama-script-guide-film-tv-creators/) · [Filmustage](https://filmustage.com/blog/how-to-write-a-vertical-drama-script/)

---

## 1. Format landscape

### 1.1 What it is
A vertical, mobile-native serialized drama: **60–100 episodes of 60–120 seconds each**, totalling **90–150 minutes** of finished runtime — "a feature sliced into 70–100 pieces." Consumed in the feed or in a dedicated coin-unlock app. Structurally it is not "a short film"; it is a **compulsion loop with a paywall inside it**. Practitioner framing to internalise: *"You're not building immersion, you're triggering a compulsion."* ([Real Reel](https://www.real-reel.com/vertical-drama-script-guide-film-tv-creators/))

### 1.2 Market scale (what each figure measures — do not conflate)

| Figure | Scope | Source |
|---|---|---|
| **$11B (2025) → $14B (2026)** | Total global microdrama revenue | [Omdia via Variety](https://variety.com/2026/tv/global/microdramas-online-video-growth-global-media-omdia-1236635447/) |
| **$3.8B (2025) → $7.8B (2026)** | **In-app revenue only** | [Deloitte TMT Predictions 2026](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/short-form-video-series.html) |
| **¥50.4B (~$7B) 2024 → ¥63–65B 2025 → ¥120B (~$16.5B) 2026** | China domestic | [Wikipedia/Duanju](https://en.wikipedia.org/wiki/Duanju), [TNW](https://thenextweb.com/news/china-micro-drama-ai-state-funding) |
| **$3B of the 2026 $14B is ex-China; US = 50% of ex-China at $1.5B** | Regional | Omdia |
| **~$750M global IAP in Q1 2026 (+20% YoY)**; ~$700M Q1 2025; $178M Q1 2024 | Quarterly IAP | [Sensor Tower](https://sensortower.com/blog/state-of-short-drama-apps-2026-report) |
| **851M unique global users (May 2026)**; **662M China users (2024)** | Users | Sensor Tower / Wikipedia |
| **>600,000 jobs created** in China | Employment | Wikipedia/Duanju |

China's duanju revenue **surpassed the Chinese theatrical box office in 2024**.

### 1.3 Platforms

| App | Owner | MAU | Revenue |
|---|---|---|---|
| **ReelShort** | Crazy Maple Studio | 40–50M (70% women, ~half US) | ~$400M (2024); **$1.2B gross consumer spend 2025 (+119%)**; ~$140M Q1 2026 IAP |
| **DramaBox** | Dianzhong Tech | 44M | $323M (2024, $10M net profit); ~$140M Q1 2026 IAP; 100M+ Google Play installs |
| **NetShort · FreeReels** | — | FreeReels 100M+ installs | NetShort +196% QoQ downloads Q1 2026; FreeReels +123% QoQ, **#8 app worldwide by downloads** Q1 2026 |
| **PineDrama** | ByteDance / TikTok | launched **16 Jan 2026** (US, Brazil → MX/ID/VN/TH) | ad-free at launch; TikTok drama rev-share payouts hit **$15M/month by April 2026**, >60% of its entire Q1 total ([Dexerto](https://www.dexerto.com/tiktok/tiktok-quietly-launches-pinedrama-a-new-app-built-entirely-around-micro-tv-shows-3307106/)) |
| Also | ShortMax, GoodShort, DramaWave, FlickReels, MoboReels, Kalos TV, My Drama, Melolo · **China domestic:** Douyin 红果 Red Fruit (20,000+ native short dramas in 2024), Kuaishou 喜番, WeChat Video Accounts | | |

- ReelShort + DramaBox ≈ **70% of global microdrama IAP**; six short-drama apps in the **worldwide Top 40 by downloads**, Q1 2026
- **850M+ global downloads Q1 2026 (+140% YoY)**; SE Asia 32%, LatAm 23%, India 22%; 200+ platforms globally

### 1.4 Audience expectations
- **~70% women** on Western apps, skewing **30–65**; men's segment reads revenge / rags-to-riches
- Daily engagement: **25 min/day globally (April 2026, +85% since Jan 2025)**, ~**40 min/day in SE Asia**, versus **~35 min/day flat for OTT streaming** ([Sensor Tower](https://sensortower.com/blog/state-of-short-drama-apps-2026-report)); Filmustage cites ReelShort-specific **35.7 min/day**
- Consumption shape is **binge clusters** — 20+ eps a sitting, then churn — even though platforms publish **daily drops at fixed times with push notifications** ([Deloitte](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/short-form-video-series.html))
- Rewarded-ad economy typically grants **~6 free episode unlocks per 24 hours**
- **~80% watch muted.** Captions are not an accessibility nicety, they are the delivery channel

### 1.5 Regulatory note
China's NRTA ran a **June 2026 campaign** against lowbrow / harmful / pirated duanju — targeting wealth-flaunting, over-sexualisation, child-harmful content, copyright infringement. Assume content guardrails on extreme wealth-porn and sexual content for any China-facing distribution.

### 1.6 Labour baseline (for budgeting live-action comparisons)
**SAG-AFTRA Verticals Agreement** (Oct 2025) covers productions **under $300K**, 9:16, serialized. 2026 minimums: lead **$250/day ($468.75 for a 12-hr day)**; other performers **$164/day ($307.50 for 12 hrs)**; background **$144/day**. **30 consecutive shoot days max.** P&H at full TV rate (**22% from 1 Jul 2026**). **Sunsets 30 Jun 2026 unless extended.** ([SAG-AFTRA](https://www.sagaftra.org/turning-industry-its-side-sag-aftra-goes-vertical-new-agreement) · [Deadline](https://deadline.com/2025/10/sag-aftra-micro-drama-verticals-agreement-1236584116/)) Market rates above scale: leads **$600–$1,000/day**, top performers **$10K/week**; China unknowns ¥500/day, mid ¥2,000–5,000/day, top ¥30,000/day. Leads do **~2 projects/month**, supporting **5–7/month**.

---

## 2. Anatomy & structure

### 2.1 Episode length — cross-checked

| Source | Episode length |
|---|---|
| [Filmustage](https://filmustage.com/blog/how-to-write-a-vertical-drama-script/) | 60–120s (= 1–2 script pages) |
| [Deloitte TMT 2026](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/short-form-video-series.html) | 60–90s |
| [Wikipedia/Duanju](https://en.wikipedia.org/wiki/Duanju) | 1–2 min |
| [cnblogs CN production guide](https://www.cnblogs.com/VisionGo/p/19822779) | Douyin 1–2 min; **Kuaishou 2–3 min**; WeChat mini-program 1.5–2.5 min |
| [InkTip](https://www.inktip.com/article_single.php?a_id=259) | 2–3 min |
| [Emmy magazine / Television Academy](https://www.televisionacademy.com/features/emmy-magazine/articles/micro-dramas-noah-fearnley-yaxing-lin) | 60–90s |

**Converged default: 90 seconds.** Floor 60s, ceiling 120s. Western apps cluster 60–90s; Chinese platform-native runs longer.

### 2.2 Season length
- **60–100 episodes** commercial sweet spot; **70 is modal**
- Duanju range 20–100 eps; some seasons 50–150+
- Total finished runtime **90–150 min**
- Real titles: *How to Tame a Silver Fox* 71 eps · *Bound by Honor* 93 eps · *The Virgin and the Billionaire* 76 eps

### 2.3 Script volume math (derived — use for Direkta planning)
- 70 eps × 90s = **105 min finished**
- Script total **70–140 pages** → **1–2 pages/episode**
- **400–600 words per episode script** ([Axis AI](https://www.axisaistudios.com/blog/how-vertical-micro-dramas-are-produced-complete-2026-guide))
- **200–400+ micro-scenes per season** ([Filmustage breakdown](https://filmustage.com/blog/how-to-break-down-a-vertical-drama-script-for-production/))
- **15–30 named characters tracked per season**, but only **3–5 core** carry the story
- Chinese rule: **dialogue lines must not exceed 3 lines of text** — split anything longer ([Tencent industry report](https://news.qq.com/rain/a/20231216A08NRF00))
- Chinese rule: **one storyline only (单线)** — minimises comprehension cost
- Density benchmark: short-drama scripts carry **~2.4× the effective information per 1,000 characters** vs long-form drama

### 2.4 The episode chassis — Beat Engine (write to timestamps, not pages)

```
0:00–0:15   HOOK / "explosion point" — detonate, don't ease in.
            Answer in 3s: what world, why now, what's the image.
0:15–0:60   FRICTION — the engine room. A PHYSICAL obstacle, not
            emotional subtext ("a badge that won't scan," not "she feels torn").
0:60–0:90   SPIKE — the largest jolt; visibly re-prices the stakes.
last 5–10s  BUTTON — cut on the QUESTION, not the answer.
            "Two seconds earlier than feels safe."
```
Alternate skeleton for ~2-min eps: **0:00 ignition · 0:32 first jolt · 1:18 spike · 1:50 button.** Three-act 90s Chinese variant: **first 30s oppression (压抑) · middle 30s super-reversal · final 30s catharsis explosion.**

**Precision finding (single-sourced, treat as strong heuristic not gospel):** ReelShort engineering reportedly found retention spikes when the freeze/button lands **between seconds 55–58 of a 60-second episode** — i.e. the button at **~92–97% of runtime** ([Filmustage](https://filmustage.com/blog/how-to-write-a-vertical-drama-script/)).

Mid-season per-episode skeleton: **recap-hook 0–5s → escalation / core scene 5–45s → cliffhanger cut, final 5s.**

### 2.5 Season arc template (70–100 eps)

| Block | Function |
|---|---|
| **E1–E10** | "Golden window." Premise + 2–3 strong emotional peaks *before* the paywall. Tentpoles at **E5** and **E10** |
| **E11–E30/40** | Stabilise + escalate; tangible plot progress every episode |
| **E31/41–E70** | "Dark middle" → rising conflict density; the situation gets worse |
| **E71–end** | Resolution, cascading paybacks |

E5 tentpole = **re-price the premise with new rules.** E10 tentpole = **collide the season's two biggest secrets.** Strategic rule: *"Spend early. Don't save your best beats for episode eight."* Budget corollary: *"The first ten episodes are the commercial product. Everything else is delivery."* ([Filmustage budget guide](https://filmustage.com/blog/how-to-produce-a-vertical-drama-on-a-budget/)) — cast, sound and colour budgets are deliberately front-loaded into E1–E10.

### 2.6 Paywall placement — the single most important structural decision

| Source | Free episodes before wall |
|---|---|
| [MinionArts](https://www.minionarts.com/blogs/microdrama-glossary-40-terms-producers) | 5–10 |
| [Axis AI](https://www.axisaistudios.com/blog/how-vertical-micro-dramas-are-produced-complete-2026-guide) | 1–4 free, wall at 5–10 |
| [Filmustage](https://filmustage.com/blog/how-to-write-a-vertical-drama-script/) | ~episode 10 |
| [Unstar app comparison](https://unstar.app/blog/reelshort-dramabox-shortmax-goodshort-flextv-short-drama-apps-ranked-2026) | ReelShort 10–15 free; DramaBox 10 free |
| [cnblogs (China)](https://www.cnblogs.com/VisionGo/p/19822779) | Douyin 6–10; Kuaishou 10–15; **WeChat mini-program 3–5** |

**Design rule: assume the wall at E8–E12; build paywall-grade tentpoles at E5 and E10.**
- **"Cliffhanger paywalls convert at 2–4× the rate of mid-scene paywalls"** ([Axis AI monetization](https://www.axisaistudios.com/blog/vertical-drama-app-monetization-coins-subscriptions-and-ads)) — the highest-leverage editorial decision in the whole format
- **Major revelations land 1–2 episodes *after* the wall** — you pay, you are immediately rewarded
- Standard practice is to **A/B test the cutoff episode per title**
- **Cross-reference:** §2.7 relays Asia TV Forum's own E10–15 bracket for the wall, drawn from a different source base than this cross-check table. Per this doc's own policy of flagging conflicts rather than averaging them, that figure is treated as corroborating the *upper half* of this E8–E12 design rule, not superseding it — **E8–E12 remains the planning number** (also rule 2).

### 2.7 Retention cliffs — the three moments that decide everything, with denominators
([Asia TV Forum](https://www.asiatvforum.com/en-gb/blog/industry-insights/beyond-views-the-critical-microdrama-metrics-the-industry-still-isnt-measuring.html))

Each row is stated against a different population — made explicit here because the source doesn't always repeat it, and this doc's preamble commits to flagging conflicts rather than averaging them away.

| Cliff | Loss | Measured against |
|---|---|---|
| **First 3 seconds** | **50–60%** of all eventual drop-off | Share of total churn across the whole runtime — most of it front-loads into the first 3s |
| **Episodes 1–3** | **>60%** of viewers stop watching | Viewers who started episode 1 |
| **First paywall — IAP-model titles** | **>90% exit immediately** on seeing the payment window; episode completion falls to **15–20%** | Viewers who *reach* the paywall, IAP titles specifically |
| **First paywall — free/ad-supported titles** | Audience churn ≈ **40%** at the same wall point | Viewers who reach the wall *in the free-series model* — the source states this as a separate figure for a separate monetization mechanic, not a third slice of the IAP row above |

**Wall episode, reconciled:** this section's own source brackets the wall at **E10–15**; §2.6's cross-checked design rule (MinionArts, Axis AI, Filmustage, Unstar, cnblogs) converges on **E8–E12**, also rule 2. **Use E8–E12 as the planning number** — treat E10–15 as corroborating its upper half, not a competing figure to average in.

**Payer conversion — 5–15% of *all viewers who start the series*** (Axis AI's stated denominator), not of viewers who specifically reach the wall ([Axis AI](https://www.axisaistudios.com/blog/vertical-drama-app-monetization-coins-subscriptions-and-ads)). A contradicting Filmustage claim of ">50% of ReelShort users pay" should be read as *of engaged/registered* users — **use 5–15% of series-starters as the planning number.** **ARPU $20–40 per series**; full-series completion costs **$25–50** (or $10–15 on cheaper tiers).

**Planning targets (synthesized from the ranges above — not independently sourced; this is the pass/fail bar rules 33/34 need and previously lacked):**
- **Wall conversion ≥10%** of viewers who reach the paywall (midpoint of the 5–15% band); **≥15%** for top performers (top of the band)
- **Post-wall episode completion ≥15%** of viewers who reach the wall (floor of the sourced 15–20% IAP range) — treat anything below 15% as a defect in the paywall UX or the wall episode's cliffhanger, not just a pricing question

Algorithmic feed benchmarks for AI-drama distribution: **TikTok ~78% (algorithmic boost triggers above 70%), YouTube Shorts ~73%, Instagram Reels ~65%** ([Genra](https://genra.ai/blog/ai-short-drama-tools-workflow-2026)). The recommender infers preference from **completion rate, dwell time, replays, shares**.

### 2.8 9:16 framing grammar (structural, not decorative)
- **The face is the environment.** Depth (Z-axis) replaces width as the primary compositional axis. **Close-ups + mediums = 50%+ of all content** ([cnblogs](https://www.cnblogs.com/VisionGo/p/19822779))
- Horizontal two-shots are structurally broken in 9:16 — faces pushed to the edges, dead space between → replace with **alternating singles staged at depth**. Vertical architecture is an asset: doorframes, windows, staircases, tall interiors, confrontations at layered depths
- **Eyes in the upper third**, never centred. **Headroom ~20% tighter** than widescreen. **"Rule of fifths"** — divide the vertical frame into five bands for eyeline placement
- **Lenses:** 85mm FF prime = dialogue workhorse; 50mm for two-person depth compositions; **24–28mm only** for vertical-architecture establishers and Z-axis movement. **Aperture f/2.0–f/2.8** for dialogue CUs — separation without claustrophobia
- **Camera height:** eye-level default; shoulder-height for "eavesdropping"; slight low angle = power/threat; high angle = vulnerability. Avoid extremes — disorienting in a narrow frame
- **Movement:** push-in on emotional escalation; pull-back for isolation/consequence; vertical tilt face→object exploits frame height. **Ban lateral tracking** (no horizontal room) and **ban handheld** (reads as production instability, not documentary energy). Hengdian crew constraint: *"Action movements cannot be too large or performers exit frame"* ([Huxiu](https://www.huxiu.com/article/4691856.html))
- **Lighting:** grade hotter contrast than broadcast for OLED phones; warm skin tones (phones cool them); consistent colour temp within scenes; position units further out/above/below. **Judge every setup on an actual phone, live**

Sources: [Axis AI cinematography guide](https://www.axisaistudios.com/blog/how-to-shoot-for-the-vertical-frame-a-cinematography-guide) · [Vertical Film Festival](https://verticalfilmfestival.org/9-16-tips-and-tricks)

### 2.9 Platform / delivery specs — hard numbers
- **9:16, 1080×1920, H.264, MP4, 30fps, AAC 128–256kbps, Rec.709**; TikTok bitrate **10–15 Mbps** ([Conbersa](https://www.conbersa.ai/learn/vertical-video-export-settings-by-platform)). China spec floor: **1080×1920, ≥25fps, ≥4 Mbps, no watermark, no letterboxing**
- **TikTok safe zones @ 1080×1920** ([Zeely](https://zeely.ai/blog/tiktok-safe-zones/), [Kreatli](https://kreatli.com/guides/tiktok-safe-zone)): **top 130px** clear · **bottom 484px** danger zone (reserve **300–320px minimum** free of text) · **right 140px** clear (like/comment/share rail) · **left 44px** clear → effective clean title area ≈ **896×1306px**; subtitles must sit **above the bottom 484px band**

---

## 3. Hooks

### 3.1 The first-3-seconds rule — hard data
- **50–60% of all drop-off occurs inside the first 3 seconds** ([OpusClip retention data](https://www.opus.pro/blog/ideal-youtube-shorts-length-format-retention))
- Target **3-second hold rate ≥60%**; top performers **70–80%**
- A strong **2-second** hook retains **~19% more viewers**; captions lift engagement **up to 40%**; **~80% watch muted** ([Genra](https://genra.ai/blog/ai-short-drama-tools-workflow-2026))
- **~30% of viewers will not click through** from a promo clip if it fails in 3 seconds ([Asia TV Forum](https://www.asiatvforum.com/en-gb/blog/industry-insights/beyond-views-the-critical-microdrama-metrics-the-industry-still-isnt-measuring.html))
- Chinese framing: **黄金3秒** ("golden 3 seconds") — the universal underlying framework of every hit

### 3.2 The three canonical hook types (China) — pick exactly ONE per episode open
1. **强冲突 — direct confrontation.** Public slap, betrayal caught live, a physical shove. Immediate, no context needed
2. **强悬念 — hard suspense.** Mystery call, DNA result, a name on a screen that shouldn't be there
3. **强反差 — extreme contrast.** Status reversal in a single frame: the janitor's badge opens the CEO's door

### 3.3 The hook cadence is LAYERED — four simultaneous tiers
The popular "hook every 30 seconds" claim is a flattening of a four-tier cadence. Sources agree on the tiers, not on one number.

| Tier | Interval | What changes | Source |
|---|---|---|---|
| **Micro (visual)** | every **2–3s** | pattern interrupt: angle change, punch-in, text overlay, SFX, motion | [Genra](https://genra.ai/blog/ai-short-drama-tools-workflow-2026), [PodcastVideos](https://www.podcastvideos.com/instagram-reels-retention-strategies-2026/) |
| **Meso (information)** | every **15s** | new visual or emotional information | [cnblogs](https://www.cnblogs.com/VisionGo/p/19822779) |
| **Meso (emotional beat)** | every **20–30s** | a 爽点 / 反转 — satisfaction point or small twist | [163/NetEase teardown of 100+ hits](https://www.163.com/dy/article/L30RCS1005340TH8.html) |
| **Macro (episode)** | every **45–90s** | a *major* hook; every episode ends on a cliffhanger | Genra ("major hook every 45–60s"), [Real Reel](https://www.real-reel.com/vertical-drama-script-guide-film-tv-creators/) ("twist/cliffhanger/emotional punch every 60–90s") |
| **Series** | small reversal every **3–5 eps**; major every **10 eps** | identity / relationship / status reversal | [Hongguo screenwriting tutorial #05](https://www.juben.pro/a/1-1783.html); [Sohu teardown](https://www.sohu.com/a/899468839_693376) says small twist every 5–10 eps, major every 20–30 |

**Verdict: "a hook every 30 seconds" is directionally true at the emotional-beat tier and materially wrong at the visual tier (2–3s) and the episode tier (60–90s). Run all four tiers simultaneously.**

### 3.4 Recap convention — there is no "previously on"
- The recap is **diegetic and 5 seconds long**: the cliffhanger **resolves in the first 10 seconds of the next episode**, with the new hook planted in the **final 5 seconds** ([Genra](https://genra.ai/blog/ai-short-drama-tools-workflow-2026))
- **Cold open rule:** episodes begin mid-action. No establishing shots, no exposition runway, no logos, no titles

### 3.5 Episode 1 vs mid-season

| | Episode 1 | Mid-season (E11+) |
|---|---|---|
| Job | Stop a scroll from a cold feed / paid ad | Sustain an already-hooked binge |
| Opening | Most cinematic beat of the whole season — doubles as the built-in trailer | 5s cliffhanger resolution |
| Exposition | Zero. Premise carried by *trope shorthand* | Zero |
| Ending | Identity reveal or maximal question — "right where the paywall needs to cash curiosity" | Standard button |
| Craft budget | Front-loaded: best cast, pro sound mixer, real colorist | Delivery-grade |
| Characters on screen | 2, max 3 | 2–3 |

### 3.6 What kills the hook (practitioner consensus on drop-off causes)
1. Any establishing shot, logo, or title before the hook
2. Exposition longer than **10 seconds** at the top
3. A constraint that repeats instead of escalating — *"if it doesn't escalate, it loops; loops lose viewers"*
4. Cutting *after* resolution — *"if viewers feel satisfied, you cut too late"*
5. Nihilism / unrelieved suffering with no hope loop
6. More than 3–5 trackable characters
7. Silent or caption-less delivery (80% muted)
8. Over-explained cliffhangers

### 3.7 The promo cut — the format's other trailer
Episode content and paid-ad creative are not the same deliverable, and until now this doc specified only the former. **UA spend runs ~9× production spend** (§7.4) and **60–70% of installs arrive via Facebook/TikTok ads** (§7.4); **hook-to-install conversion is the first metric tracked per title** (§8.10). E1's opening is already framed as the *"built-in trailer"* (§3.5), and **~30% of viewers will not click through** if a promo clip fails its first 3 seconds (§3.1, [Asia TV Forum](https://www.asiatvforum.com/en-gb/blog/industry-insights/beyond-views-the-critical-microdrama-metrics-the-industry-still-isnt-measuring.html)) — the same hook discipline that governs the episode governs the ad.

- **Harvest, don't re-cut.** Source the promo from **E1's hook** and the **E5/E10 tentpole beats** (§2.5) only — never mid-season filler, never a full-episode re-edit. Open on the same 强冲突/强悬念/强反差 hook type (§3.2) the source episode uses
- **Length band:** primary cut **6–15s**, matching the 2026 short-form paid-social norm ([Meta/TikTok short-form ad trend, ~7–15s](https://shopifyecommerceapps.com/best-video-ads-meta-tiktok-2026)); optional **15–30s** long-form variant carrying the complete E1 hook beat (0:00–0:15) for placements that support longer video
- **Variant volume:** operators competitive at scale cut **hundreds of cliffhanger variants per week** across a slate ([Naavik](https://naavik.co/digest/the-microdrama-volume-vs-value-paradox/)); at single-title level, standard paid-social testing cadence is **2–3 hook variants per concept**, refreshed weekly ([RocketshipHQ](https://www.rocketshiphq.com/how-to-test-ad-creatives-on-tiktok/)) — vary only the first 3 seconds and hold the rest constant so the test isolates the hook
- **Sound-off by default.** Paid-social feeds default to muted playback the same way organic drama does (§1.4); burn in captions on every variant to the same legibility spec as rule 27 (§4.3)
- **Delivery:** same export spec as the episode (rule 32) plus each platform's safe zones (§2.9)
- **Feeds hook-to-install** (§8.10) — the metric this format tracks first, ahead of any retention number, because the ad is the actual point of sale for ~60–70% of installs

---

## 4. Editing grammar

### 4.1 Pacing curve — the numbers
- Modern film ASL ≈ **2.5s** (down from 12s in 1930); Hollywood drama fell from ~10s (1960s) to ~4s (mid-2000s) — Cornell/Cutting data via [Film Editing Pro](https://www.filmeditingpro.com/fast-vs-slow-video-editing-pacing-tips/)
- **Duanju fast scenes** (conflict escalation, 爽点, chases, reversals): **1–2 seconds per shot**, close/medium only, wides minimised ([CSDN short-drama craft guide](https://damodev.csdn.net/69a656c354b52172bc5eb002.html))
- **Pattern interrupt every 2–3 seconds** — angle, punch-in, overlay, SFX, or emotional shift
- **"3-Second Rule":** something new roughly every 3 seconds — motion, angle, sound, graphic, or emotion shift
- Micro-pacing: **clip the silence before the next word**; a "cinematic" wide earns **3–4 seconds and no more**
- **Cut on action or emotion — never let a shot linger**

**Working ASL target for micro-drama:**

| Beat | ASL |
|---|---|
| HOOK (0:00–0:15) | **1.0–2.0s** |
| FRICTION (0:15–0:60) | **1.5–2.5s** |
| Release / breath beat | **2.5–4.0s** (max one or two per episode) |
| SPIKE (0:60–0:90) | **1.0–2.0s**, tightening into the button |
| BUTTON | one held frame / freeze at ~92–97% runtime |

**Never let a shot run past ~4s without a camera or sound event.** **Derived shot count — from the table's own per-beat bands above, not the flat 2.0–2.5s ASL this line previously borrowed from nowhere in the table:** HOOK 15s ÷ 1.0–2.0s ≈ 7.5–15 shots · FRICTION 45s ÷ 1.5–2.5s ≈ 18–30 shots · SPIKE 30s ÷ 1.0–2.0s ≈ 15–30 shots → **~41–75 shots** at the per-beat extremes, tightening to **roughly 41–70** once the 1–2 release beats (2.5–4.0s, sitting inside FRICTION/SPIKE) swap out a few of the fastest-cut shots. **Working range: ~41–70 shots per 90s episode** — call it 40–70 for planning. A 70-ep season (the doc's default, rule 1) ≈ **2,900–4,900 shots**; scaled to the 50-ep season used for cross-reference in §8.2/§8.8 ≈ **2,000–3,500 shots**.

### 4.2 Transitions catalogue — when to use each

| Transition | Use when | Notes |
|---|---|---|
| **Hard cut** | Default. ~85–90% of all joins | Cut on action or on the emotion turn |
| **Punch-in** (same axis, tighter size) | Escalation, the moment a line lands, a realisation | **The format's primary intensifier.** Does the work a dolly does in features, at zero cost, and is legible on a 6-inch screen. In AI pipelines it is a *free extra shot* derived from one generation |
| **Pull-back** | Isolation, consequence, a character left alone with the cost | Sparing — one per episode at most |
| **Reverse / shot-reverse-shot** | All dialogue. The listener CU carries the line | The listener reaction is often the better shot |
| **Insert cut** (object) | Every reveal. Evidence is always an *object* | Reveal grammar: **wide-ish → CU on the reactor → insert of the evidence → CU of the reactor's changed face** |
| **Whoosh / reverse-reverb flash** | Entering or leaving a 2–5s flashback | Always paired with a grade shift, never used alone |
| **Speed ramp / frame-blend** | Flashback entry, impact moment of a 打脸 | Max ~2 per episode; more reads as amateur |
| **Freeze frame** | The BUTTON | Freeze at ~92–97% of runtime, on the question |
| **Match cut / loop-back** | Final frame of the episode echoing the opening frame | Cheap, high-perceived-craft; use where the beat allows |
| **Dissolve** | Almost never | Reads as slow and "old TV" in this format |
| **Wipes, spins, zoom-blur "TikTok" transitions** | Never in-drama | They belong to creator content, not drama; they break diegesis |

### 4.3 On-screen text & captions
- **Captions are mandatory.** ~80% watch muted; captions lift engagement up to **40%**
- Place subtitles **above the bottom 484px UI band**; centred; line spacing ~**1.3×**; avoid thin fonts and long wrapping phrases
- **Legibility spec** (precedent: the trailer module's hard floor, [legibility.info](https://legibility.info/rules-for-text-in-videos), applied here for cross-module consistency):
  - **Reading-rate floor: ≥13 characters/second of dwell time.** Never let a caption's on-screen duration undercut `characters ÷ 13`. Industry subtitle practice for adult dialogue runs faster — Netflix caps English adult content at **20 cps** (17 cps for children's) ([Netflix Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements)) — so 13 cps is a conservative floor for a 6-inch screen at arm's length, not a target to cut toward
  - **Max 32 characters per line, max 2 lines per caption.** Tighter than Netflix's 42-char/2-line TV spec because vertical format runs a larger font on a narrower effective width; matches social/vertical caption practice (~20–32 chars/line) rather than broadcast subtitle practice ([OpusClip TikTok caption guide](https://www.opus.pro/blog/tiktok-caption-subtitle-best-practices))
  - **Minimum dwell: 0.8s per caption regardless of length** (matches Netflix's ~5/6s floor), even when the line itself is short
  - **Caption timing follows the dialogue phrase, not the picture cut.** A caption may legitimately outlive the shot it started on and continue unchanged across a hard cut, a punch-in, or a reverse — never truncate, re-render, or restart a caption purely because the picture cut. Reset the caption only at a genuine dialogue-phrase boundary (new speaker, new sentence, end of line). At ASL 1.0–2.0s and dialogue capped at 3 lines (§2.3), a single caption will routinely span 2–4 shots — this is expected, not a defect
- Chinese convention adds **特效字幕 (FX titles)** for: system/game-mechanic text, inner monologue, time-and-place stamps ("三年后" / "3 YEARS LATER"), and shouted key words at reversals
- **Never open with logos, titles, or a card.** Title cards, if any, go *after* the first hook beat

### 4.4 Flashback formatting
Duanju flashbacks are **short (2–5s), high-contrast, unmistakable**: desaturated or heavily colour-shifted grade, slight speed ramp or frame-blend, whoosh / reverse-reverb transition, usually a text stamp. They function as **evidence inserts, not scenes** — you flash the memory of *the line that was said*, not the whole earlier conversation. Because the format prohibits setup, **the flashback is the legal loophole for delivering setup at the moment of payoff.**

### 4.5 Coverage pattern — the repeatable unit
The standard duanju dialogue scene is a **4-slot loop**: **(1)** establishing "geography" shot — often skipped entirely, or 1 second · **(2) CU A** (over-shoulder or clean single) · **(3) CU B** (reverse) · **(4) insert** — hands signing, gripping, a phone screen, a document, a ring. Then **punch in tighter on each** for the reversal. Shot menu: close-ups **>50%**, hand CUs (signing / gripping / contact), over-shoulder for two-hander confrontations, angle psychology as §2.8.

---

## 5. Music & sound integration

### 5.1 Core principles
- **The sting is the load-bearing sound cue.** Music forced in at high volume on the reveal frame; **the reveal's emotional meaning is created in the mix, not the performance** — this matters doubly for AI-generated performance
- **Sudden silence on the biggest reveal is the highest-impact move**: drop everything for **0.5–1s**, then sting. **Heartbeat SFX** signals danger / tension; **off-screen voice** builds suspense; **BGM must never obscure dialogue**
- Music is **cue-based, not continuous score.** It enters on beats and exits on cuts

### 5.2 Chinese post-production standard (concrete numbers)
- **~3 BGM cues per episode with 2 explicit emotional transition points**
- Sound libraries built around **5,000+ ambience** and **800+ emotion** cues
- Standardised template kits of **10 transitions and 8 rhythm templates**
- A visual/audio **"burst point" at fixed intervals**

### 5.3 Beat-sync rules
- Sync the **cut to the transient**, not the beat grid — micro-drama is dialogue-led, so the music conforms to the cut, not the reverse
- The **only** hard beat-sync moments: (a) the sting on the reveal frame, (b) the percussive stab on the 打脸, (c) the button freeze. Land these on the frame of recognition, ±2 frames
- Montage / status-progression sequences (wardrobe upgrade, training, money accumulating) are the one place to cut *on* the beat grid — typically 8–12 shots at **0.5–1.0s each**
- Score palette by emotion: **warm/major for intimacy · cold/minor drone for isolation · percussive stab for the 打脸**

### 5.4 Budget & practical
- Most series use **royalty-free libraries**; original score / sync clearance materially raises budget. **Post = only ~6% of total budget**
- Live-action budget priority: **hire a real boom op + mixer for E1–E10**; dialogue editing is a mandatory platform deliverable
- Direkta/AI equivalent: **spend the audio budget on E1–E10 mix quality and on locked voice IDs**, not on more generations

Sources: [cnblogs](https://www.cnblogs.com/VisionGo/p/19822779) · [2048AI CapCut audio workflow](https://2048ai.net/69a1207054b52172bc5de23d.html) · [Filmustage budget](https://filmustage.com/blog/how-to-produce-a-vertical-drama-on-a-budget/)

---

## 6. Genre / mood variations

### 6.1 Trope taxonomy

**Western apps (ReelShort / DramaBox), audience ~70% women, 30–65:**
- Billionaire / CEO romance (the spine)
- **Werewolf / Alpha-Luna / vampire romantasy** — ReelShort's all-time #1 crosses werewolf fantasy *with* billionaire CEO
- Revenge / comeback ("she came back rich")
- Hidden identity / secret heiress / "hidden boss"
- Second-chance romance, contract marriage, secret baby, fake dating, enemies-to-lovers
- Mafia / mob romance, reverse harem
- **Emerging and outperforming: thriller (~40% higher retention than romance), horror-mystery (growing ~2× faster than romance), survival / game-of-choice** ([Filmustage](https://filmustage.com/blog/vertical-drama-explained-what-you-need-to-know-in-2026/))

**Chinese duanju adds:** 穿越 chuanyue (transmigration), 重生 rebirth, 系统 (system / game-mechanic), xianxia, wuxia, 战神 ("war god returns"), 赘婿 (humiliated son-in-law), family/ethics money-drama.

**Gender split:** women → "Prince Charming" / romance / romantasy; men → revenge and rags-to-riches power fantasy ([The Conversation](https://theconversation.com/werewolf-exes-and-billionaire-ceos-why-cheesy-short-dramas-are-taking-over-our-social-media-feeds-259385)).

**Trope stacking is the norm:** most billionaire-CEO series combine **2–3 tropes** into one plot. Tropes are **load-bearing structure** — "established emotional contracts," not shortcuts. The craft question is never *which trope* but **"what specific emotional payload am I delivering through this infrastructure?"**

### 6.2 Genre dials — conflict frequency ([Hongguo official](https://www.juben.pro/a/1-1783.html))

| Genre | Conflict rhythm |
|---|---|
| **Revenge / upgrade** | small climax every **3–5 eps**, major every **10** |
| **Sweet romance** | misunderstanding → jealousy → reconciliation → escalation; moderate pacing |
| **Slow-burn prestige** | only viable with superior cinematography / performance to justify it — avoid in an AI pipeline until quality supports it |

### 6.3 Genre dials — emotional shape ([Real Reel](https://www.real-reel.com/vertical-drama-script-guide-film-tv-creators/))

| Genre | Shock | Hurt | Release |
|---|---|---|---|
| **Romance** | small shocks | lingering hurt | **public selection** |
| **Revenge** | sharp | extended humiliation | **one massive** payback |
| **Power fantasy** | sharp | short | **quiet** — one move flips the whole room undetected |
| **Family ethics** | financial | money math + moral math simultaneously | restitution made public |
| **Thriller / horror-mystery** | information shock | dread accumulation | survival + revelation |

### 6.4 Mood → craft mapping (for Direkta's Movie Bible fields)

| Mood | Lens/frame | ASL | Grade | Sound |
|---|---|---|---|---|
| Confrontation / 打脸 | 85mm CU, low angle on the winner | 1.0–1.5s | high contrast, warm skin | percussive stab, 0.5s pre-silence |
| Intimacy | 85mm CU, f/2.0, eye-level | 2.5–4.0s | warm, soft rolloff | warm major cue, low bed |
| Isolation / consequence | 50mm, pull-back, subject low in frame | 3.0–4.0s | cool, desaturated | cold minor drone |
| Suspense / thriller | 85mm CU + off-screen voice | 1.5–2.5s | cool, crushed blacks | heartbeat SFX, ambience-forward |
| Status reveal | insert → CU → punch-in | 1.0–2.0s | hot contrast | sting on the recognition frame |

---

## 7. Production pipeline (professional order, mapped to Direkta)

### 7.1 The professional order
1. **IP incubation** — most series adapt proven web-novel IP with pre-validated demand (Qidian → duanju pipeline; fiction since ~2002, video form since ~2018). ReelShort's parent, Crazy Maple Studio, sits on a web-fiction platform
2. **Season bible** — characters, arcs, and **placement of major reveals *relative to the paywall***. This is the defining difference from a TV bible
3. **Beat sheet per episode** — the per-episode turn breakdown, explicitly described as **"the structured input for AI generation pipelines"**
4. **Timestamp skeleton** → dialogue written last
5. **Script breakdown** — 200–400+ scenes, **40+ elements per scene**, 15–30 named characters → **30+ hours of 1st AD work** manually (+4–6 hrs to compile master sheets); AI-assisted breakdown runs **~2 minutes/script at up to 86% tagging accuracy** ([Filmustage](https://filmustage.com/blog/how-to-break-down-a-vertical-drama-script-for-production/))
6. **Schedule by standing set, never story order**
7. **Shoot** — see §7.3
8. **Post** — assembly, captions, mix, delivery

### 7.2 Writers' room reality (adopt the posture, not the org chart)
- Rooms are **algorithmically informed**: "plots are generated based on what has previously performed well"; the work is described as **"solving a puzzle" rather than traditional scriptwriting**
- **Heavy note-giving on E1–E10, near-zero oversight after** — mirroring the commercial reality
- Roles have collapsed: micro-drama creators commonly handle scripting + directing + editing + planning simultaneously. New titles: **traffic operation manager, content optimization specialist, localization screenwriter** ([arXiv 2602.14045, n=28 practitioner study](https://arxiv.org/html/2602.14045v1))
- **AI policy is contested:** a ReelShort exec states AI has "no place" in her writers' room and is "extremely strict" that no writer uses it for concepts — while the same company uses AI for VFX. Expect a firewall between AI-in-craft and AI-in-post
- **Writers:** ReelShort runs **20+ US writers producing 15–20 scripts/month** and still can't meet demand. Reported pay **$22/hr (ReelShort)** to **~$40/hr / ~$1,540/wk with benefits** at a larger vertical company ([John August](https://johnaugust.com/2025/writing-for-microdramas-aka-verticals)); AI-native studios quote **$40–$100 per finished minute/episode**. Some Chinese writers produce **20–30 episodes/day**; a full series script in about a week

### 7.3 Live-action speed benchmarks (the bar Direkta must beat)

| Metric | Value | Source |
|---|---|---|
| Shooting window, US vertical | **7–10 days** (some 6–10; studio tier 14–21) | [Filmustage](https://filmustage.com/blog/how-to-produce-a-vertical-drama-on-a-budget/), [Streaming Radar](https://lens.streaming-radar.com/micro-drama-production-costs) |
| Shooting window, China | **5–7 days for 80–100 eps** | [Huxiu](https://www.huxiu.com/article/4691856.html) |
| Documented record | **76 episodes in 9 days** (*The Virgin and the Billionaire*, dir. Casey Jackson) | [Emmy magazine](https://www.televisionacademy.com/features/emmy-magazine/articles/micro-dramas-noah-fearnley-yaxing-lin) |
| Pages/day | **10–22** typical (vs 3–5 feature, 4–6 conventional drama); **up to 25** with virtual production; **ReelShort documented 29 pages** on a dialogue-heavy day | Filmustage |
| Dialogue pages/day on set | **15–20 pages, 12-hour days** | Emmy magazine |
| Velocity multiplier | **2–4× conventional film** | |
| China daily rhythm | 100 eps ÷ 5–6 days = **~16–20 episodes shot per day** | [Tencent](https://news.qq.com/rain/a/20231216A08NRF00) |
| Derived shot rate | ~2,900–4,900 shots ÷ 8 days ≈ **360–610 shots/day** | derived (§4.1, corrected) |

Only survivable because coverage is a **repeating 4-slot template on standing sets**.

### 7.4 Location & budget economics
- Standard standing-set roster: **luxury penthouse · CEO office · hospital · jail · courtroom · mansion staircase · banquet hall**
- Budget tactic: **one anchor location with 2–3 specialty rooms**
- China budget rule: **80% of scenes cheap (interior / single location), 15% mid, 5% expensive** (climaxes only). At the ¥50–200K tier, **90% of scenes are interiors**
- Banquet/gala scenes recur because they bundle three things: status made public, witnesses trapped in the room, reversal with a built-in audience

| Tier | Budget | Eps | Shoot days | Crew |
|---|---|---|---|---|
| China low-end | **$12K–$30K** | 80–100 | 5–7 | 8–15 |
| China premium | $50K–$150K | 80–100 | 10–15 | 20–40 |
| US indie | $30K–$80K | 60–80 | 7–12 | 15–25 |
| US studio | **$100K–$300K** | 60–80 | 14–21 | 30–60 |
| "S-class" | $400K–$600K | | | |
| India | $12K–$18K (45 eps in 3 days) | | | |
| Nigeria | $5K–$15K | | | |

([Streaming Radar](https://lens.streaming-radar.com/micro-drama-production-costs)) Budget allocation (US): **Cast 22% · Locations 20% · ATL crew 17% · BTL crew 18% · Gear 12% · Post 6% · Contingency 5%.** Alternate line-item view: Script/IP 5–10% · Cast 15–25% · Production 35–45% · Post 10–15%. **Marketing (投流) is the real cost: ~9× production spend on UA**; 60–70% of installs come via Facebook/TikTok ads; 68% of US category ad spend goes to social. **Hit economics:** *The Divorced Billionaire Heiress* — under **$200K**, grossed **~$35M in North America**. Top series earn **$200K–$1M+** in unlock revenue. Chinese reality check: **8 of 10 productions lose money; 1–2 carry the slate**, ~20% margin on a hit ([Huxiu](https://www.huxiu.com/article/4691856.html)).

### 7.5 Direkta mapping — script → Movie Bible → shotlist → clips → stitch

| Direkta stage | Micro-drama content it must carry |
|---|---|
| **Script** | Premise with **structural conflict baked in before line one**. One storyline. 3–5 core characters. Per-episode **timestamp skeleton first** (`0:00 HOOK · 0:15 FRICTION · 0:60 SPIKE · 0:82 BUTTON`), dialogue written into the marks last. 400–600 words/episode. Dialogue capped at 3 lines |
| **Movie Bible** | The **paywall map** (wall episode + E5/E10 tentpoles + the post-wall revelation at E+1/E+2) — this is the field a TV bible does not have. Plus: the 4 functional roles (Engine / Wall / Witness / Nuke) as **tag stacks**; the standing-set library (6–8 locations max); character **lock sheets** (multi-angle refs, wardrobe states keyed to the status-progression arc); **voice IDs**; 1–2 signature objects per character; the mood→craft table (§6.4) instantiated for this title |
| **Shotlist** | Built from the **4-slot coverage loop** (CU-A · CU-B reverse · insert · punch-in), not from prose. Each row carries: shot size, lens equivalent, ASL target, Z-axis blocking note, which generation is the *source* clip and which shots are **punch-in crops of it**, lip-sync flag (2–4 per episode), and the sound event (sting / silence / heartbeat) |
| **AI clip generation** | 12–20 **unique** 5s generations per 90s episode, model-routed by tier (§8.4). Generate at the highest available resolution so punch-in crops stay 1080×1920-clean |
| **Stitched edit** | Trim generations to 1.5–3.0s. Reuse A-side/B-side singles across the scene. Derive extra cuts via punch-in crops. Burn captions above the 484px band. 3 BGM cues + 2 transitions. Sting + 0.5–1s silence on the reveal. Freeze button at 92–97%. Loop the last frame toward the first. Export 1080×1920 H.264 30fps ≥10 Mbps |

### 7.6 Timeline benchmarks
- Live-action: script→launch **~2 months** (dev 3–4 weeks, shoot 6–10 days, post ~1 week). Competent operators run a **3–6 month** cycle end-to-end; Chinese houses ship **3–4 series/month** off one-week shoots
- Wardrobe as narrative device: status progression **plain/loose → refined/fitted → dominant**. Each character needs **1–2 signature objects**, introduced subtly on first appearance, questioned on second, explained on third
- Contracting tactic: **flat-fee prep contracts** (1st AD, art, costume, locations) instead of day rates
- Chinese teams prefer **batch shooting with analytics-driven evaluation** over continuous shoot-and-release

---

## 8. AI-generation implications

### 8.1 The industry is already doing this at industrial scale
- **470 AI-produced short-drama titles per day in China (Jan 2026)**; **~50,000 AI-native episodes hit Douyin in March 2026 alone**; **10,000+ AI-generated animated microdramas going live per month** ([TechTimes](https://www.techtimes.com/articles/317008/20260522/chinas-ai-short-drama-boom-hit-industrial-scale-470-titles-day-faces-stolen-jobs-gone.htm), [TNW](https://thenextweb.com/news/china-micro-drama-ai-state-funding))
- AI Short Drama market Jan–May 2026 alone: **>¥22B**
- Cost collapse: Seedance 2.0 / Kling 3.0 compress 3–4 months into **<1 month** and drop series cost from **~$200K to $7K–$14K**; some directors report **$30 per finished minute** (a 50-ep × 90s season ≈ **$2,250 in generation cost**)
- Model pricing anchors: **Kling 3.0 ≈ $0.50–$2.50 per 10s clip at 1080p**; **Veo-tier ≈ $0.40/sec (~$2.00 per 5s clip)**

### 8.2 Clip-count arithmetic — and a discrepancy to resolve
[MinionArts](https://www.minionarts.com/blogs/produce-50-episode-ai-microdrama-lean-budget) states a 50-ep season = **300–500 generated clips at 3–5s average**. **These numbers do not reconcile:** 50 × 90s = 4,500s; 400 clips would require 11s average on screen.

**Correct planning math at a real duanju cut rate:**
- 90s episode cut to the pacing table's own per-beat bands (§4.1), not a flat 2.0–2.5s ASL the table never prescribes: **~41–70 shots per episode**
- Generated clips are **5–10s and get trimmed to 1.5–3s in the edit**, and many are **reused within the episode** (A-side/B-side singles re-cut across the scene) or punched-in for 2–3 derived shot sizes per generation
- Applying that same ~2–3-cuts-per-unique-clip multiplier this section already uses (12–20 clips → 36–45 cuts implies clips ≈ 0.33–0.44 × shot count) to the corrected shot range: **~15–30 *unique* generated clips per episode**, each ~5s, yielding the ~41–70 cuts above through trimming, punch-in reframes, and reuse
- Season at the doc's 70-episode default (rule 1): **~1,000–2,100 unique clips.** Scaled to the 50-ep season MinionArts uses as its comparison point: **~750–1,500 clips.** Budget **+15–20% for regeneration** on top of either
- Blended per-clip generation cost at the §8.4 model-routing mix (10% premium / 60% mid / 30% value): premium ≈ $2.00/5s (Veo-tier, $0.40/s) · mid ≈ $0.25–$1.25/5s (Kling 3.0, $0.50–$2.50/10s) · value ≈ $0.75/5s at 1080p ([Wan 2.5 pricing, EvoLink](https://evolink.ai/blog/wan-api-pricing-guide)) → **~$0.60–$1.20 blended per clip**. A 70-ep season's 1,000–2,100 clips therefore run **~$600–$2,500** in raw generation spend, **~$700–$3,000** with the regeneration buffer; the 50-ep comparison case runs **~$450–$1,800** raw. Both are the same order of magnitude as the independent "$30/finished-minute" claim in §8.1 (≈$2,250 for 50 eps, near the top of that 50-ep range) — a rough cross-check, not an exact match. This is the number the §8.8 cost table was under-stating
- **Punch-in from a single high-res generation is the highest-ROI trick in AI micro-drama**: generate above 1080×1920, derive 2–3 shot sizes from one clip. This is exactly how the format's punch-in grammar works anyway

### 8.3 Dialogue / lip-sync — the decision
State of the art: *"Real-time mouth-to-dialogue alignment is coming soon; for now, use tight editing cuts."* ([Genra](https://genra.ai/blog/ai-short-drama-tools-workflow-2026))

**Recommended hybrid, which this format uniquely permits:**
1. **Cut away from the speaker on most lines.** Vertical grammar already privileges the *reaction* over the speaker; the listener CU carries the line. This eliminates most lip-sync surface area at zero narrative cost
2. **Lip-sync only the "money lines"** — the reveal, the button, the 打脸. Typically **2–4 lip-synced shots per episode**
3. Use **inserts** (hands, phone screens, documents, evidence) under dialogue — the format demands them anyway
4. Use **off-screen voice** (a native duanju suspense device) and **inner monologue with on-screen text**
5. **Burned-in captions are mandatory regardless** (80% muted), which further masks imperfect sync
6. **Never write a villain monologue** — the format bans it and AI can't sustain it

> Do NOT choose "VO-only, no on-screen speech." Silent AI video underperforms; the requirement is
> *dialogue with restricted lip-sync exposure*, not absence of dialogue.

### 8.4 Model routing (published allocation)

| Shot class | Share | Model tier |
|---|---|---|
| Hero moments, paid-social hooks (E1 open, paywall button) | **10%** | Premium (Veo-tier, ~$0.40/s) |
| Dialogue + action | **60%** | Mid (Kling 3.0 / Seedance 2.0) |
| B-roll, inserts, context | **30%** | Value (Wan-tier) |

### 8.5 Why the format suits AI unusually well
- **Close-up-dominant framing** → minimal background, minimal continuity surface, fewer objects to drift
- **Depth-axis blocking** avoids lateral tracking, which video models handle worst; **no handheld** (already prohibited) removes the hardest motion class
- **1–3s shots** stay inside the temporal window where models hold identity
- **Standing sets** → a small, reusable location library (penthouse, office, hospital, courtroom, staircase); **3–5 core characters** → a tractable character-lock roster
- **90-second episodes** cap error accumulation per unit

### 8.6 Consistency discipline
- **Character lock:** build a reference-asset set per character (multiple angles, lighting states, wardrobe states). Budget **8–12 hours** of design labour for the lock phase. **Test with 3–5 shots in different settings before committing credits**
- **Priority rule: enforce consistency *within* an episode above consistency *between* episodes** — viewers forgive cross-episode drift far more than intra-scene drift
- Wardrobe is a *feature*: the format's status-progression rule gives a legitimate narrative reason for controlled appearance change
- **Voice lock:** pre-established voice IDs per character; localisation then costs only **$50–$150/language** in voice + lipsync **with no video regeneration**
- **Usable-take rate:** mature pipelines report **>90%**. Structured, reference-anchored prompting vs open-ended prompting is **the** primary cost lever

### 8.7 What to decide at prompt time (before any generation)
**(1)** Shot size and lens equivalent (85mm CU default; 24–28mm only for the one architectural establisher). **(2)** Whether this generation is a **source** for punch-in crops — if so, generate at max resolution and stage the subject to survive a 2× crop. **(3)** Z-axis blocking: who moves toward/away from camera; **no lateral movement, no handheld, no large actions**. **(4)** Which character-lock reference set and wardrobe state applies. **(5)** Lip-sync flag (only 2–4 per episode) vs reaction-carry vs insert. **(6)** The **object** in frame if this shot is evidence-adjacent — plant it *before* the reveal. **(7)** Duration of the trimmed usage (1.5–3.0s), so the generation contains a usable 2s of stable identity. **(8)** The sound event landing on this shot (sting / 0.5–1s silence / heartbeat / stab).

### 8.8 AI production timeline & cost (50 eps × 90s — comparison case; see §8.2 for the doc's 70-ep default)

| Phase | Duration |
|---|---|
| Season bible + beat sheets | 5–7 days |
| Character + location lock | 3–4 days |
| Batch video generation | 10–14 days |
| Lipsync, music, assembly | 5–7 days |
| QC + delivery | 3–5 days |
| **Total S1** | **4–6 weeks** (subsequent seasons 3–4 weeks) |

Cost: video gen **$450–$1,800** (50-ep season at the corrected clip count, §8.2 — was $700–$1,100 under the retired 12–20-clip figure) · voice + lipsync **$100–$200** · music/SFX **$50–$100** · tools **$100–$300** → **$700–$2,400 all-in generation.** Human QC: **2–3 hrs/episode** initially, dropping to **1–2 hrs** after templates lock (**100–150 hrs/season**). Solo-operator benchmark from a competing pipeline: **25–35 min per episode** (script 5–10 · generation 10–15 · audio 5 · edit/export 5), **1–2 weeks for an 80-episode series**.

### 8.9 Episode assembly checklist (AI)
Recap resolution (0–5s) → escalation (5–45s) → button (last 5s) · captions burned above the 484px UI band · 3 BGM cues with 2 transition points · sting on the reveal + 0.5–1s silence before it · punch-in derived crops for extra cuts · loop the last frame toward the first · export **1080×1920 H.264 30fps ≥10 Mbps**.

### 8.10 Instrumentation & iteration
- Metrics tracked per title: **hook-to-install conversion · episode-1 completion · episode-3 retention · first unlock · completion + drop-off per episode and per rail · refund risk · localisation cost.** Reposts/tagging are treated by practitioners as truer empathy signals than likes
- Teams release **highlight test clips before full publication** and monitor the **first ~30 minutes** of release data to trigger secondary algorithmic recommendation
- Studios use **AI-assisted scripting to produce alternate cold opens** and generative video to test poster/trailer direction
- Documented comment-driven rewrite (*Mr. Li, please sign for your twins*): boosting a secondary actor's screen time after comments → **+115% likes, +70% comments, +263% shares by episode four** ([arXiv 2602.14045](https://arxiv.org/html/2602.14045v1))

---

## 9. Skill rules — decision rules for the Direkta micro-drama agent

### A. Season shape & commercial structure

1. **Default the season to 70 episodes × 90 seconds.** Accept 60–100 eps and 60–120s only when the brief demands it. Target 100–110 minutes of finished runtime.
2. **Set the paywall at E8–E12 and land it on a cliffhanger, never mid-scene** (2–4× conversion); record the wall episode as an explicit Movie Bible field. Build two paywall-grade tentpoles — **E5 re-prices the premise with new rules, E10 collides the season's two biggest secrets** — and deliver a major revelation **1–2 episodes after** the wall so payment is immediately rewarded.
3. **Front-load everything into E1–E10.** They are the commercial product; the rest is delivery. Spend the best beats, best generations, best mix, best grade there. Never save a beat for E8+.
4. **Shape the arc in four blocks:** E1–E10 golden window · E11–E30/40 stabilise and escalate with tangible progress every episode · E31/41–E70 dark middle with rising conflict density · E71–end cascading paybacks. **Dial conflict frequency by genre:** revenge/upgrade = small climax every 3–5 eps, major every 10; sweet romance = misunderstanding → jealousy → reconciliation → escalation at moderate pace; reject slow-burn prestige unless generation quality can carry it.

### B. Episode construction

5. **Write every episode as a timestamp skeleton before a single line of dialogue:** `0:00 HOOK · 0:15 FRICTION · 0:60 SPIKE · 0:82–0:90 BUTTON`. Dialogue *carries* those marks; it never creates them. **Treat FRICTION as a physical obstacle, never emotional subtext** — "a badge that won't scan," not "she feels torn."
6. **Place the button at 92–97% of runtime and cut on the question, not the answer** — roughly two seconds earlier than feels safe. If the viewer feels satisfied, you cut too late.
7. **Open every episode mid-action.** Ban establishing shots, logos, title cards, and any exposition before 0:10. Mid-season episodes resolve the prior cliffhanger inside 0:00–0:05 and plant the new one in the final 0:05. No "previously on."
8. **Give the episode's HOOK exactly one of the three canonical types** — 强冲突 direct confrontation, 强悬念 hard suspense, or 强反差 extreme contrast. Never blend two; blending reads as neither.
9. **Run the four-tier hook cadence simultaneously:** visual pattern-interrupt every **2–3s** · new information every **~15s** · emotional beat (爽点 or 反转) every **20–30s** · one major hook per **45–90s** · small reversal every **3–5 eps** · major reversal every **10 eps**.

### C. Story, character, dialogue

10. **Make the conflict structural, present in the premise before line one, and escalating by construction.** If conflict must be manufactured scene by scene, the premise is wrong. Setup is a tax the audience did not agree to pay. A forced-intimacy or captivity premise that repeats instead of tightening becomes a loop, and loops lose viewers.
11. **Stack 2–3 tropes and name the emotional payload each one delivers.** Tropes are load-bearing infrastructure and established emotional contracts, not shortcuts.
12. **Cap the core cast at 3–5 trackable characters, 2–3 on screen at once.** Assign all four functions: **Engine** (whose choices generate episodes), **Wall** ("a price tag with a face"), **Witness** (audience surrogate), **Nuke** ("the truth that keeps almost exploding"). Build them as **tag stacks** (job + social + contrast), not bibles.
13. **Reject any "pain-sponge."** Every 10-episode block must give each character a real hit, a tilt action, and a behavioural shift.
14. **Structure every emotional arc as Shock → Hurt → Release, and make the release public.** Intensity = accumulated injustice × publicness of reversal. Keep a hope loop running — nihilism converts once and never retains.
15. **Deliver shocks as objects, not accusations** — text thread, bank transfer, wedding invite, engraving, receipt corner. Specificity is credibility. Plant the evidence *visibly in frame before* the reveal, then stage it as **wide-ish → CU on the reactor → insert of the object → CU of the reactor's changed face.**
16. **Every line advances conflict or reveals character under pressure. Cap dialogue at 3 lines and split anything longer. One storyline only.** No small talk, no exposition-through-conversation, no villain monologue, no over-explained cliffhanger — trust the cut. Write scene description operationally: location + time of day, lighting tone, character positioning, nothing else.

### D. Vertical framing & shotlisting

17. **Frame vertically-native: eyes in the upper third, ~20% tighter headroom than widescreen, 85mm-equivalent for dialogue, f/2.0–2.8, close-ups + mediums >50% of screen time.** Never a horizontal two-shot — use alternating singles staged at depth.
18. **Block on the Z-axis:** movement toward/away from camera, confrontations at layered depths, foreground anchors (hand, shoulder, object). **Ban lateral tracking, handheld, extreme high/low angles, and large physical actions that exit the narrow frame.**
19. **Build coverage from the repeating 4-slot unit: CU-A · CU-B reverse · insert · punch-in.** Reserve wide / architectural setups (24–28mm, doorways, staircases, tall interiors) for at most one shot per episode.
20. **Keep the standing-set library to 6–8 locations for the whole season** (penthouse, CEO office, hospital, jail, courtroom, staircase, banquet hall) and schedule generation by set, never by story order. Keep 80% of scenes cheap/interior, 15% mid, 5% expensive and reserved for climaxes.

### E. Editing grammar

21. **Cut at ASL 1.0–2.0s in hook and spike, 1.5–2.5s in friction, 2.5–4.0s in the one or two release beats. Never let a shot run past ~4s without a camera or sound event.** Trim the silence before every line. Cut on action or emotion. **These bands compose to ~41–70 shots per 90-second episode (§4.1) — plan and budget generation against that figure, not a flat 2.0–2.5s ASL.**
22. **Use the punch-in as the primary intensifier** — and in the AI pipeline as a free extra shot derived from a single high-resolution generation.
23. **Use hard cuts for ~85–90% of joins. Ban dissolves, wipes, spins and zoom-blur creator transitions.** Permit whoosh/reverse-reverb only on flashback entry/exit, speed ramps at most twice per episode, one freeze on the button, and a loop-back match cut where the beat allows.
24. **Format flashbacks as 2–5s evidence inserts** — desaturated or colour-shifted grade, whoosh transition, text stamp. Never a flashback *scene*. This is the only legal way to deliver setup at the moment of payoff.

### F. Sound & captions

25. **Design the reveal in the mix:** 0.5–1s of total silence, then a music sting on the frame of recognition (±2 frames). Percussive stab on the 打脸. Heartbeat SFX for danger, off-screen voice for suspense. **BGM never masks dialogue.**
26. **Use ~3 BGM cues per episode with 2 explicit emotional transition points**, cue-based rather than continuous score — music enters on beats and exits on cuts. Beat-grid cutting is permitted only in montage/status-progression sequences (8–12 shots at 0.5–1.0s each).
27. **Burn in captions on every episode**, centred, above the bottom **484px** UI band, keeping **130px** clear top, **140px** right, **44px** left at 1080×1920 (clean area ≈ 896×1306px), line spacing ~1.3×, no thin fonts. **Hold every caption ≥ max(0.8s, characters ÷ 13 cps); cap at 32 characters per line and 2 lines; time captions to the dialogue phrase, not the cut** — let a caption run unchanged across hard cuts, punch-ins and reverses underneath it, and reset it only at a real phrase boundary (§4.3). Assume 80% muted and run a sound-off pass before locking.

### G. AI generation

28. **Plan ~15–30 unique ~5s generations per 90s episode (~1,000–2,100 per 70-ep season, the doc's default per rule 1 — scale to ~750–1,500 for a 50-ep season), add a 15–20% regeneration buffer, and route models by tier: 10% premium on hero/hook/button shots, 60% mid on dialogue and action, 30% value on inserts and B-roll.** Generate above delivery resolution so punch-in crops stay clean.
29. **Restrict lip-sync to 2–4 "money lines" per episode** (the reveal, the button, the 打脸). Carry all other dialogue on reaction CUs, inserts, off-screen voice, and inner-monologue text. **Never produce silent video** — always generate character VO with locked voice IDs (localisation then costs $50–$150/language with no video regeneration).
30. **Lock characters before generating anything:** multi-angle reference sets with lighting and wardrobe states (8–12 hrs of design labour), 3–5 cross-setting test shots before committing credits, and a target usable-take rate **>90%**. **Enforce intra-episode consistency above cross-episode consistency.** Use the format's status-progression wardrobe rule (plain/loose → refined/fitted → dominant) to legitimise controlled appearance change, and give each character 1–2 signature objects introduced on first appearance, questioned on second, explained on third.
31. **Fix at prompt time, before any generation:** shot size and lens equivalent · whether this clip is a punch-in source · Z-axis blocking · character-lock reference and wardrobe state · lip-sync flag · the evidence object if any · the trimmed usage duration (1.5–3.0s) · the sound event landing on the shot.

### H. Delivery & iteration

32. **Deliver 9:16 · 1080×1920 · H.264/MP4 · 30fps · AAC 128–256kbps · Rec.709 · ≥10 Mbps · no watermark, no letterbox** (China floor: ≥25fps, ≥4 Mbps).
33. **Instrument and iterate on the three cliffs — 3 seconds, 3 episodes, first paywall.** A/B the cold open and the paywall episode per title; target **≥60% 3-second hold** (70–80% for top performers); **target wall conversion ≥10% of viewers reaching the paywall (≥15% for top performers) and post-wall episode completion ≥15% of viewers who reach the wall** (§2.7 — synthesized planning targets; revise once title-level data exists); monitor the first 30 minutes post-release; be willing to rewrite downstream episodes from comment signal (a documented case moved shares **+263% by E4**).
34. **Run the pre-lock episode audit:** mid-action open · one hook type · four-tier cadence met · ≤3 characters on screen · every line load-bearing · evidence is an object · release is public · button at 92–97% on a question · captions above 484px, ≥13 cps dwell, ≤32 chars/2 lines, timed to the dialogue phrase not the cut · sting + silence on the reveal · ASL in band · no banned transition · export spec correct. **On the episode carrying the paywall specifically, also confirm:** the wall lands on the cliffhanger cut, never mid-scene · the wall episode number matches the Movie Bible field set under rule 2 · wall-conversion and post-wall-completion instrumentation (rule 33 targets) is wired before release.

### I. Paid promotion & the hook-ad

35. **Cut a dedicated promo asset per platform, harvested only from E1's hook and the E5/E10 tentpole beats** (§2.5, §3.5) — never a re-cut full episode, never mid-season filler. Open it on the episode's own hook type (§3.2) and hold it to the same **3-second hook requirement** as the episode itself (**~30% of viewers won't click through** past a failed first 3s, §3.1). Cut the primary asset **6–15s**; add an optional **15–30s** long-form variant carrying the full E1 hook beat (0:00–0:15) for placements that support it. Produce **at minimum 3–5 hook-only variants per promo** — vary the first 3 seconds only, hold the rest constant — and refresh on a weekly A/B cadence. Caption every variant **sound-off-safe** to the rule-27 legibility spec, since paid-social feeds default to muted playback same as organic drama (§1.4). Deliver to the rule-32 export spec plus each platform's safe zones (§2.9). Route every variant's result into the **hook-to-install** metric (§8.10, the first metric this format tracks) and kill/replace losers on the same weekly cadence as the creative refresh.

---

## 10. Sources

**Craft & writing** — [Filmustage: Write a Vertical Drama Script](https://filmustage.com/blog/how-to-write-a-vertical-drama-script/) · [Filmustage: Break Down a Vertical Drama Script](https://filmustage.com/blog/how-to-break-down-a-vertical-drama-script-for-production/) · [Filmustage: Produce on a Budget](https://filmustage.com/blog/how-to-produce-a-vertical-drama-on-a-budget/) · [Filmustage: Vertical Drama Explained 2026](https://filmustage.com/blog/vertical-drama-explained-what-you-need-to-know-in-2026/) · [Real Reel: Vertical Drama Script Guide](https://www.real-reel.com/vertical-drama-script-guide-film-tv-creators/) · [InkTip: Writing for Vertical Video](https://www.inktip.com/article_single.php?a_id=259) · [John August: Writing for Microdramas](https://johnaugust.com/2025/writing-for-microdramas-aka-verticals) · [VerticalWriters](https://www.verticalwriters.com/) · [MinionArts: Microdrama Glossary, 40 Terms](https://www.minionarts.com/blogs/microdrama-glossary-40-terms-producers)

**Cinematography & post** — [Axis AI: Shooting for the Vertical Frame](https://www.axisaistudios.com/blog/how-to-shoot-for-the-vertical-frame-a-cinematography-guide) · [Vertical Film Festival: 9:16 Tips](https://verticalfilmfestival.org/9-16-tips-and-tricks) · [Film Editing Pro: Fast vs Slow Pacing](https://www.filmeditingpro.com/fast-vs-slow-video-editing-pacing-tips/) · [2048AI: CapCut audio workflow](https://2048ai.net/69a1207054b52172bc5de23d.html) · [CSDN/damodev: short-drama craft guide](https://damodev.csdn.net/69a656c354b52172bc5eb002.html)

**Production & economics** — [Axis AI: How Vertical Micro-Dramas Are Produced](https://www.axisaistudios.com/blog/how-vertical-micro-dramas-are-produced-complete-2026-guide) · [Axis AI: Monetization — Coins, Subscriptions, Ads](https://www.axisaistudios.com/blog/vertical-drama-app-monetization-coins-subscriptions-and-ads) · [Streaming Radar: Micro-Drama Production Costs](https://lens.streaming-radar.com/micro-drama-production-costs) · [Emmy magazine / Television Academy](https://www.televisionacademy.com/features/emmy-magazine/articles/micro-dramas-noah-fearnley-yaxing-lin) · [SAG-AFTRA: Verticals Agreement](https://www.sagaftra.org/turning-industry-its-side-sag-aftra-goes-vertical-new-agreement) · [Deadline: SAG-AFTRA Verticals](https://deadline.com/2025/10/sag-aftra-micro-drama-verticals-agreement-1236584116/)

**Market data** — [Sensor Tower: State of Short Drama Apps 2026](https://sensortower.com/blog/state-of-short-drama-apps-2026-report) · [Deloitte TMT Predictions 2026](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/short-form-video-series.html) · [Variety/Omdia](https://variety.com/2026/tv/global/microdramas-online-video-growth-global-media-omdia-1236635447/) · [Wikipedia: Duanju](https://en.wikipedia.org/wiki/Duanju) · [TNW: China's $16.5B micro-drama industry](https://thenextweb.com/news/china-micro-drama-ai-state-funding) · [Unstar: ReelShort vs DramaBox 2026](https://unstar.app/blog/reelshort-dramabox-shortmax-goodshort-flextv-short-drama-apps-ranked-2026) · [Dexerto: TikTok launches PineDrama](https://www.dexerto.com/tiktok/tiktok-quietly-launches-pinedrama-a-new-app-built-entirely-around-micro-tv-shows-3307106/) · [The Conversation: Werewolf exes and billionaire CEOs](https://theconversation.com/werewolf-exes-and-billionaire-ceos-why-cheesy-short-dramas-are-taking-over-our-social-media-feeds-259385)

**Retention & metrics** — [Asia TV Forum: Critical Microdrama Metrics](https://www.asiatvforum.com/en-gb/blog/industry-insights/beyond-views-the-critical-microdrama-metrics-the-industry-still-isnt-measuring.html) · [OpusClip: Shorts Length & Retention](https://www.opus.pro/blog/ideal-youtube-shorts-length-format-retention) · [PodcastVideos: Reels retention 2026](https://www.podcastvideos.com/instagram-reels-retention-strategies-2026/) · [arXiv 2602.14045: Audience in the Loop (n=28)](https://arxiv.org/html/2602.14045v1)

**AI production** — [Genra: AI Short Drama Tools & Retention](https://genra.ai/blog/ai-short-drama-tools-workflow-2026) · [MinionArts: 50-Episode AI Microdrama on a Lean Budget](https://www.minionarts.com/blogs/produce-50-episode-ai-microdrama-lean-budget) · [TechTimes: 470 AI titles/day](https://www.techtimes.com/articles/317008/20260522/chinas-ai-short-drama-boom-hit-industrial-scale-470-titles-day-faces-stolen-jobs-gone.htm)

**Platform specs** — [Conbersa: Vertical Video Export Settings](https://www.conbersa.ai/learn/vertical-video-export-settings-by-platform) · [Zeely: TikTok Safe Zones 2026](https://zeely.ai/blog/tiktok-safe-zones/) · [Kreatli: TikTok Safe Zone](https://kreatli.com/guides/tiktok-safe-zone)

**Chinese-language primary** — [Huxiu 我在横店拍短剧](https://www.huxiu.com/article/4691856.html) · [Tencent News 7天拍100集](https://news.qq.com/rain/a/20231216A08NRF00) · [Hongguo tutorial #05 短剧节奏的设计密码](https://www.juben.pro/a/1-1783.html) · [NetEase 拆解100+部爆款短剧后的单集节奏公式](https://www.163.com/dy/article/L30RCS1005340TH8.html) · [Sohu teardown](https://www.sohu.com/a/899468839_693376) · [cnblogs 短剧制作指南](https://www.cnblogs.com/VisionGo/p/19822779)

**Captions, paid promotion & model pricing (added for §3.7, §4.3, §8.2, rules 27/34/35)** — [Netflix Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements) · [OpusClip: TikTok Caption & Subtitle Best Practices](https://www.opus.pro/blog/tiktok-caption-subtitle-best-practices) · [EvoLink: Wan API Pricing Guide](https://evolink.ai/blog/wan-api-pricing-guide) · [Naavik: The Microdrama Volume vs. Value Paradox](https://naavik.co/digest/the-microdrama-volume-vs-value-paradox/) · [RocketshipHQ: How to Test Ad Creatives on TikTok](https://www.rocketshiphq.com/how-to-test-ad-creatives-on-tiktok/) · [Shopify Ecommerce Apps: Best Video Ads for Meta and TikTok 2026](https://shopifyecommerceapps.com/best-video-ads-meta-tiktok-2026)
