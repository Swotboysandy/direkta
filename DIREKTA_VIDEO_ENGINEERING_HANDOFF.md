# Direkta — Video Generation Engineering Handoff

**For the developer taking over / extending Direkta's MiniMax H3 pipeline.**
Written 2026-08-30 after a full production day. Everything here was found by actually running
the pipeline and paying for the failures — treat the "must not happen" rules as hard-won, not
theoretical.

**Goal this document serves:** produce ads that look like they had a real budget behind them —
deliberate camera, believable performance, consistent subjects, clean frames — not "AI video".

---

## 1. What the system is

| Piece | Detail |
|---|---|
| Model | MiniMax H3, open-weight `fl2va` checkpoint (first/last frame → video **+ audio**) |
| Runtime | ComfyUI on a rented RunPod A100 80GB — **not** the hosted MiniMax API |
| App | Direkta (Next.js) at `https://direkta.147.93.168.21.nip.io` |
| Integration | `lib/agents/minimax-h3.ts` |
| API route | `app/api/stitch/nodes/[id]/animate/route.ts` |
| Prompt expander | `lib/agents/h3-prompt-expander.ts` |
| Storage | RunPod network volume `rk8cd3sbe1`, 120 GB, holds all model weights |

**Critical distinction:** most H3 documentation online describes MiniMax's *hosted* API
(`platform.minimax.io`). Its limits do **not** apply here — different duration rules, no prompt
character cap, different reference-mode restrictions, and it says nothing about sampling steps,
which is the single biggest quality lever locally.

---

## 2. Bugs found and fixed — do not reintroduce these

Each of these cost real money before it was found.

### 2.1 Sampling steps set to 8 instead of 20 — *the "cheap quality" bug*

`steps: 8` was carried over from an early test. **8 is the Turbo LoRA's operating point, not the
base model's.** Running the base checkpoint at 8 steps undersamples it: soft edges, plastic skin,
flat lighting. The client rejected an entire section over this.

- **Fix:** `steps = input.steps ?? (input.turbo ? 8 : 20)`
- **Rule:** never lower base steps to save money without saying so. The saving is ~7 min of GPU;
  the cost is the entire look. If speed is genuinely needed, use the Turbo LoRA (distilled for low
  step counts) rather than starving the base model.
- **Impact:** 20 steps ≈ 9–10 min/shot vs ~5 min at 8. Roughly **$0.28/shot** either way in
  practice, because the cheap one gets rejected and re-run.

### 2.2 Generation timeout shorter than the generation

`submitAndWait` polled for 8 minutes. A 20-step shot takes 9–10. Every healthy render died at
8 m 09 s, and the cleanup then stopped the pod.

- **Fix:** 30-minute timeout on the history poll.
- **Rule:** whenever you change steps, resolution or duration, **check the timeout still exceeds
  the new render time.** They are coupled.

### 2.3 Cold-start timeout too short

`ensureH3PodRunning` waited 4 minutes for health. A real cold start is pod boot + `pip install`
(deps do **not** survive a RunPod restart) + ComfyUI launch + model load — routinely 6–10 min.
Every batch that followed a pod stop failed on its first shot.

- **Fix:** 12-minute health-check timeout.

### 2.4 `pgrep` matching its own command — *silent, nasty*

Bootstrap used `pgrep -f 'main.py --listen' || start_comfyui`. Over SSH, that pattern **matches the
ssh command string itself**, so pgrep always "found" ComfyUI, and it was never started. The pod sat
idle and billing while every request timed out.

- **Fix:** probe the port instead —
  `curl -s -m 3 -o /dev/null http://127.0.0.1:8188/system_stats || (start it)`
- **Rule:** never use `pgrep -f` / `pkill -f` with a pattern that appears in the command you are
  running. This has bitten this project more than once.

### 2.5 Error messages that hid the real failure

Every `waitFor` call shared the message *"Timed out waiting for MiniMax H3 pod to come online."*
So a generation that timed out mid-render looked like a pod that never booted — and sent debugging
to the wrong end of the pipeline for an hour.

- **Fix:** `waitFor(fn, timeout, interval, what)` — each caller names what it is waiting for, and
  the message includes the elapsed limit.
- **Rule:** shared generic error strings are a debugging tax. Name the actual wait.

---

## 3. On-screen text — the recurring defect

**Symptom:** garbled lettering. Neon signs reading `SNOI`, `DINN`. Gibberish logos on clothing.

**Root cause:** H3 renders any text it was not given *verbatim* as letter-shaped noise. It has a
strong prior that certain scenes contain signage — a rainy neon street "should" have signs — and
**a negative instruction does not reliably override a strong visual prior.**

### What did NOT work
- A vague rule ("don't describe text") while the scene description said *"neon signage reflecting
  in the puddles"*. The specific description won.
- Even a hardened, explicit prohibition in every prompt. Signage still appeared on a night city
  street.

### What DOES work, in order of reliability
1. **Change the setting.** An environment with no reason for signage — residential street, studio,
   interior, landscape, abstract space. This is the only near-certain fix, and it is what finally
   solved it (summer suburban street → zero text across 6 shots).
2. **Frame it out.** Tighter shots, backgrounds thrown well out of focus.
3. **Fix in post.** Blur or patch. Cheap for stills, tedious for video.

### Current implementation
`AUDIO_DIRECTION` in `minimax-h3.ts` appends a hard constraint to **every** generation, and the
prompt expander actively **rewrites** signage out of source directions rather than passing it
through. Both are necessary but, per above, **not sufficient** — the setting choice still matters
most.

### Titles and logos
Never ask H3 for them. Compose the final shot with deliberate empty space and burn text in with
ffmpeg afterwards — always sharp, always correct, free:

```bash
ffmpeg -i shot06.mp4 -vf "drawtext=fontfile=/path/font.ttf:text='BRAND':\
fontcolor=white:fontsize=64:x=(w-text_w)/2:y=h*0.15" -c:a copy titled.mp4
```

---

## 4. Continuity, cuts, and the join problem — **needs engineering work**

### How it works now
Multi-shot sequences chain: each clip's final frame is extracted (`ffmpeg -sseof -1`) and passed as
the next shot's `referenceImageUrl` (the node's `first_frame`).

### The measured problem — read the correction
An initial measurement showed **12.9 dB** PSNR between shot 1's last frame and shot 2's first
frame, and this document originally concluded from that H3 must be reinterpreting the reference.
**That conclusion was wrong.**

Re-measured against the *correctly extracted* final frame, the same footage scores **34.76 dB** —
a close match. The real culprit was the frame-extraction step: the old ffmpeg call grabbed the
first frame of the final *second* rather than the actual final frame, so every chained shot was
being seeded from a stale reference roughly a second early. That is what produced the visible jump.

The extraction helper now decodes through EOF and keeps the true last frame. **This fix has not yet
been validated with a new paid render** — verify it before trusting it.

Residual, genuinely model-side: end pinning can condition a plausible ending but does not promise
identical pixels, speed, lighting or sound across a join. Identity still drifts across ~6 chained
shots.

Contributing factors:
- **Frame extraction was seeding from the wrong frame** (see above) — the dominant cause, now fixed
  but unvalidated.
- `uploadReferenceImage()` center-crops the reference to the target canvas. Necessary (H3
  force-resizes with no aspect preservation, which otherwise stretches the image — see 5.2), but it
  can shift framing relative to the source clip. Note the canvases are **7:4 / 4:7**, not exact
  16:9 / 9:16 — preserve aspect when preparing references; never stretch.
- Identity drifts progressively across ~6 chained shots; shot 6 resembles the anchor noticeably
  less than shot 2.

### Recommended fixes for the developer
1. **Pin both ends.** `lastFrameImageUrl` is already implemented (`last_frame` on the node — our
   checkpoint is `fl2va`, so it is native) but **never tested**. H3 interpolating between two known
   frames should bound the drift. **Test this first — highest expected value.**
2. **Trim the boundary.** Drop 1–2 frames at each join before concatenating, after visually
   checking playback. Do not remove frames blind.
3. **Decide cut vs. continuity per join.** Chaining is for continuity *within* a continuous action.
   Where the edit actually wants a cut, generate fresh instead — chaining a real cut produces a
   half-match that reads as an error rather than a choice.
4. **Consider `ref2va`.** The separate reference-to-video checkpoint supports full omni-reference
   (up to 9 images, 3 videos, 3 audio, each with a declared role) which is the documented path for
   strong subject consistency. Requires a different ~20 GB checkpoint download. Not installed.

---

## 5. Other hard-won rules

### 5.1 Sampling settings that work
`cfg 1.0` · `euler` · `simple` · `MiniMaxH3SigmaShift(shift_video 12.0, shift_audio 3.0)` ·
**steps 20** (base) · frame grid `17k+5` via `alignFrames()` · dimensions snapped to /32.

A requested 5 s becomes **124 frames at 24 fps = 5.167 s** (indices 0–123) — read the actual
duration back after snapping rather than assuming. Canvases are 768×1344 (portrait) and 1344×768
(landscape), which are **4:7 and 7:4** — *not* exact 9:16 / 16:9. VRAM peak ≈ **50.6 GB** on the
workload measured, so an 80 GB card runs exactly one generation at a time; there is no way to
parallelise on one GPU.

### 5.2 Reference images are force-resized
H3's `first_frame` is stretched to the generation canvas with **no aspect preservation**. An
off-ratio still comes out visibly squashed. `uploadReferenceImage()` center-crops via ffmpeg first
(`scale=W:H:force_original_aspect_ratio=increase,crop=W:H`). **This must not regress.**

### 5.3 Audio is generated jointly with picture
There is no audio parameter. "No dialogue, music only" is a **prompt instruction**. Specify each
sound *and when it enters* ("low cello from 0s; a door creak at 2.5s") or the mix is left to chance.

### 5.4 Pod restarts wipe Python packages
Only `/workspace` survives. ComfyUI must be re-bootstrapped (`pip install -r requirements.txt`)
after every restart.

### 5.5 RunPod capacity failures
Stopped pods intermittently cannot restart: *"not enough free GPUs on the host machine"*. Costs
nothing, but blocks. Resolved via the RunPod console's **migrate** flow, not the API. A migrated
pod comes back with a **new pod ID, a new SSH port, and port 8188 missing** — all three must be
fixed before it works. **Never create a replacement pod or volume without explicit user approval.**

### 5.6 Face realism is a lighting problem
Dark, heavily-graded scenes are where AI faces look worst — shadow lets the model fake detail.
Bright daylight forces real skin texture. This single change fixed a rejected "looks AI" shot.
Specify: frontal daylight, eyes catching a highlight, visible pores and small imperfections, no
plastic smoothing.

---

## 6. Prompt architecture — the six-block format

Reverse-engineered from MiniMax's own published prompts. H3 reads a prompt like production
paperwork, not prose.

```
STYLE CONTRACT: medium, texture, palette, era — one sentence.
<subject and setting — one vivid sentence, with identity anchors restated compactly>

Timeline:
[0.0s-1.6s] concrete physical action + what the camera does
[1.6s-3.2s] ...
[3.2s-5.0s] ...

Camera: the move, or an explicit refusal ("locked off, no push-in"). One continuous take.

Audio: every sound and WHEN it enters.

Avoid: clichés to refuse + the hard no-text constraint.
```

### Prompt quality rules
- **Actions, not adjectives.** "She catches a sleeve on her wrist, pulls it into place, lets her
  arm fall so the fabric settles" beats "luxurious, cinematic, mesmerizing".
- **Every camera move needs a reason** — follow a hand, reveal what it uncovers, tighten as
  tension rises. *"Dynamic cinematic camera"* is not a usable instruction.
- **One dominant idea per sequence.** A fashion film shows how a garment moves. Six attractive but
  interchangeable poses is not a commercial — this was a rejected first attempt.
- **Manageable action density.** Allow time to reach, grasp, lift, react, recover.
- **Restate identity anchors compactly** every shot (face, hair, build, wardrobe) rather than
  relying on the chain alone.
- **Physical honesty.** A person holding a selfie phone cannot two-hand a task. Track who holds
  what.

### The expander
`h3-prompt-expander.ts` turns a short beat direction into the above, using Direkta's configured
LLM. **Currently inert — no LLM API key is set in the Key Vault**, so it silently falls back to the
raw prompt (`.catch(() => prompt)`). Add an Anthropic/OpenAI key to activate. Note the silent
fallback is deliberate but easy to miss — consider surfacing a warning.

---

## 7. What to build next in Direkta

Ordered by value:

1. **Test `lastFrameImageUrl`** (already coded, never run). Best available fix for join precision.
2. **Surface a warning when the prompt expander falls back** — silent degradation is worse than an
   error.
3. **Join trimming in the assembler** — configurable N-frame trim at concat boundaries, with a
   preview.
4. **Store-frame export** — 768×1344 → 1080×1920 is an exact 1.40625× scale, clean lanczos resize,
   no crop. Script exists (`extract_frames.sh`); make it a UI action. Each 5 s clip yields 124
   candidate stills for free.
5. **Budget guard** — refuse to start a batch whose estimated cost exceeds the RunPod balance, and
   show projected spend before launch. Two batches died mid-run today from running out.
6. **Pod lifecycle hardening** — the migrate flow (new ID, new SSH port, missing 8188) is manual
   and error-prone. Detect and repair automatically.
7. **`ref2va` checkpoint** for true multi-reference identity locking.

---

## 8. Cost model (measured, not estimated)

| Item | Cost |
|---|---|
| A100 80 GB | **$1.39/hr** |
| One 5 s shot @ 20 steps | **~$0.28** (9–10 min) |
| One 6-shot / 31 s ad | **~$1.70** |
| Network volume, 120 GB | **$8.40/month — bills 24/7 even when stopped** |

The storage floor is most of the bill at low usage. Cold starts cost ~$0.15 each, so **keep the pod
warm across a batch** (`keepWarm: true`) and **stop it explicitly at the end**. An idle running pod
bills at the full hourly rate.

Buying hardware instead is not viable: H3 needs >51 GB VRAM, so the cheapest capable card plus a
machine is ~₹7 lakh — roughly a 24-year break-even against cloud at this usage.

---

## 9. Access the developer needs

| Need | Detail |
|---|---|
| Direkta | `https://direkta.147.93.168.21.nip.io` |
| VPS | `root@147.93.168.21` — app at `/home/claudebot/direkta`, service `direkta` |
| Deploy | `scp` → `chown claudebot` → `npm run build` → `systemctl restart direkta` |
| Output | `/home/claudebot/direkta/data/oss/` (videos, frames, assets) |
| DB | `/home/claudebot/direkta/data/zinema.sqlite` — `projects`, `beats`, `stitch_nodes` |
| RunPod | API key in `/home/claudebot/direkta/.env` as `RUNPOD_API_KEY` |
| Pod SSH | `/home/claudebot/.ssh/runpod_h3` |
| LLM key | **Missing** — must be added in the Key Vault for the expander to work |

### Security — please read before granting access
Direkta's Key Vault holds live API keys, and `.env` holds the RunPod key. Anyone with this access
**can spend GPU money and read every stored credential.**

Recommended before handing it over:
- Issue the developer a **separate RunPod API key** you can revoke independently, on a sub-account
  with its own spend cap.
- Rotate any keys you do not want shared.
- Set a RunPod **spend limit** so a runaway loop cannot drain the balance.
- Keep the pod stopped when not in active use.

I have not shared or moved any credentials — this is a checklist for you, not something already
done.

---

## 10. Quality bar — what "$20k-looking" actually requires

The pipeline can now produce this; the earlier failures were craft, not capability.

**Non-negotiable per shot**
- 20 steps, base model
- A setting with no reason for signage
- Lighting that flatters real skin (daylight or motivated practicals, not crushed shadow)
- One clear action with cause and result
- A camera move with a reason, or a deliberate lock-off
- Specified audio with entry times
- Identity anchors restated

**Non-negotiable per sequence**
- One dominant idea
- Six *different* actions, distances and angles — not six poses
- A real ending (a hero shot), not an empty frame
- Titles burned in post, never generated

**Review before delivery** — watch playback, do not judge from stills alone:
opening hook · action readability · causal progression · identity and prop continuity · camera
path · exposure · join precision · payoff · audio.

State plainly what was verified and what was not. A successful API response does not mean the video
is good — that mistake was made today and corrected.

---

## Appendix — today's output

Four finished 31-second pieces, all music-only, no garbled text:
`H3_Hoodie_FINAL.mp4` (9:16) · `H3_App_FINAL.mp4` (9:16) · `H3_Game_FINAL.mp4` (9:16) ·
`H3_DeepField_FINAL.mp4` (16:9)

Scripted, hardened, not yet generated: **D** — anime trailer *(The Last Signal)*,
**F** — Pixar trailer *(The Last Lamplighter)*. 12 shots, ~$3.40.

A reusable directing skill also lives at `.claude/skills/video-direction/`, including
`references/local-comfyui-setup.md`, which documents this local rig as distinct from the hosted API.
