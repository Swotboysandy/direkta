# Direkta × NeevCloud — MiniMax H3 GPU pod setup
## Handoff brief for the agent doing this work

You are standing up a **dedicated NeevCloud GPU pod for Direkta**, duplicating a
setup that is already proven on a different instance. Everything below was
measured on a live pod, not read from documentation. Where a number appears, it
is real.

**Read the whole brief before running anything.** Several steps are ordered
specifically to avoid spending money on a mistake, and the most expensive
mistakes here are all made in the first ten minutes.

---

## 0 · WHICH APP THIS IS FOR

| | |
|---|---|
| **Target app** | **Direkta** — the original instance |
| Host | `147.93.168.21`, SSH alias `maxgood-vps` |
| App path | `/home/claudebot/direkta` |
| Service | systemd unit `direkta`, Next on `127.0.0.1:3002` |
| Public URL | `https://direkta.147.93.168.21.nip.io` (Caddy) |

**This is NOT the Fylmer instance** (`103.39.134.210`). That one already has its
own pod. You are building a second, independent pod so the two do not contend.

---

## 1 · READ THIS FIRST — THE INTEGRATION GAP

**Direkta's GPU code is written against RunPod, not NeevCloud.**

`lib/agents/minimax-h3.ts` contains:

```
RUNPOD_API           = "https://rest.runpod.io/v1"
RUNPOD_API_KEY       env
RUNPOD_H3_POD_ID     env
ensureH3PodRunning() -> starts the pod via RunPod REST
stopH3Pod()          -> stops it, called in a finally block
```

There is **no NeevCloud integration yet — but one can now be written.** NeevCloud
exposes its API as an MCP server at `https://mcp.ai.neevcloud.com/mcp`,
authenticated with a personal access token (`Authorization: Bearer pat-nc-…`,
created in the console). It speaks plain JSON-RPC over HTTP, so no MCP client is
required. Verified tools include `airuntime-v1beta1-listAIRuntimes`,
`getAIRuntime`, `getAIRuntimeMetrics`, `createAIRuntime` and `deleteAIRuntime`.

Note there is **no start/stop** — only create and delete, matching the console.
An adapter therefore means `ensureH3PodRunning()` → create a pod and
`stopH3Pod()` → delete it, with `/data` surviving on the network volume. Never
commit the token; keep it in `.env`.

**What works right now:** the module reads an override —

```
proxyBase()  ->  process.env.RUNPOD_H3_PROXY_BASE
```

Set that to the NeevCloud pod and **generation works end to end**. What does not
work is automatic start/stop: `ensureH3PodRunning()` and `stopH3Pod()` will still
call RunPod and fail.

**So the operating model is manual.** The pod is started by a human in the
NeevCloud console and deleted by a human when the work is done. Plan the workflow
around that; do not promise the app can manage the pod's lifecycle.

**Worth doing first:** phone NeevCloud on **1800-309-1433** or mail
`support@neevcloud.com` and ask them to enable API access. If they do, a proper
adapter becomes possible and this whole constraint disappears.

---

## 2 · PROVISION

| Setting | Value | Why |
|---|---|---|
| GPU | **RTX PRO 6000 Blackwell, 96 GB** | H3 peaks at **50.6 GB** on a real render. 80 GB works; 46 GB is **proven insufficient**. |
| Template | PyTorch, Ubuntu 24.04 | ships torch with `sm_120` |
| **Network Storage** | **new 100 GB volume — see §2a** | **Non-negotiable — see §3** |
| Custom port | **8188 / TCP, external** | Direkta calls ComfyUI over the internet |
| Region | `as-south-1` | lowest latency to the VPS |
| Rate | **₹113.46 / hr** | bills continuously, see §8 |

### 2a · Network Storage is a SEPARATE step — do not skip it

**"Disk 100 GB" in the deploy summary is the container disk. It is not the
network volume, and it does not survive deletion.**

Network Storage is configured in its own step of the deploy wizard
(**Step 3 · Configure Network Storage**). If you deploy without completing that
step, the pod comes up with no `/data` mount, everything you install dies with
the container, and you re-download 50 GB of weights on every single start.

**Create a NEW volume for Direkta.** The Fylmer pod already uses
`neev-storage-1788731479`; do not attach that one. Two pods sharing a volume will
fight over `ComfyUI/output`, the logs and the cost-guard stamps.

Budget the consequence honestly: a new volume means a **fresh ~50 GB model
download**, roughly 30–60 minutes of paid pod time (₹57–₹113) before anything can
render. That is a one-time cost — every later start reuses the volume for free.

**Verify before doing anything else**, and stop if it fails:

```bash
mountpoint -q /data && echo "OK: /data is a mount" || echo "STOP: no network volume"
df -h /data
```

`h3-bringup.sh` performs this check itself and refuses to download until it
passes. Trust it over the console summary.

**SSH key.** Generate a dedicated keypair, register the public half at deploy
time, and keep the private half on the VPS so Direkta can reach the pod:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/direkta_h3 -N "" -C "direkta-h3-neevcloud"
```

---

## 3 · THE MOST EXPENSIVE MISTAKE

**Only `/data` survives.** The container disk is wiped when the pod is deleted,
and NeevCloud's console has **no Stop button — only Delete**. So a pod is deleted
often.

Anything installed outside `/data` must be reinstalled every single time,
including 53 GB of model weights at roughly ₹57 of GPU time per download.

Therefore:
- ComfyUI → `/data/ComfyUI`
- Models → `/data/ComfyUI/models`
- Python packages → **`/data/pylibs`**, used via `PYTHONPATH=/data/pylibs`
- Scripts and logs → `/data`

`scripts/h3-bringup.sh` in the Direkta repo already does all of this and
**refuses to download anything until it has verified `/data` is a real mount
point with ≥75 GB free and that torch can actually drive the card.** Run it
rather than improvising:

```bash
HF_TOKEN=hf_xxx bash /data/h3-bringup.sh
```

---

## 4 · THE MODELS — EXACT FILES

Use **`Comfy-Org/MiniMax-H3`** on HuggingFace. These are ComfyUI-native
`.safetensors`.

**Do NOT use `unsloth/MiniMax-H3-FP8`** — those `.pt` files are for diffusers +
torchao and are incompatible with ComfyUI. That mistake cost a 45 GB download.

| File | Size | Destination |
|---|---|---|
| `diffusion_models/minimax_h3_fl2va_pruned_fp8_scaled.safetensors` | 19.5 GB | `models/diffusion_models/` |
| `text_encoders/qwen3vl_32b_minimax_h3_int8_convrot.safetensors` | 25.3 GB | `models/text_encoders/` |
| `vae/minimax_h3_video_vae_fp16.safetensors` | 4.85 GB | `models/vae/` |
| `vae/minimax_h3_audio_vae_fp32.safetensors` | 0.56 GB | `models/vae/` |

**≈ 50 GB.** Download notes that matter:

- `export HF_HUB_DISABLE_XET=1` — the Xet backend fails with
  `RuntimeError: Background writer channel closed`
- **Always pass a valid `HF_TOKEN`.** Unauthenticated downloads run at 2–3 MB/s.
  Verify it first with `huggingface_hub.whoami(token=...)` — a stale token from
  another project silently degrades rather than erroring.

**If you later train a LoRA** you need a *different* text encoder:
`qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` (~15 GB, path has no
`split_files/` prefix). The int8 file above fails training with
`KeyError: weight_scale_2`.

---

## 5 · COMFYUI

ComfyUI has **first-party native H3 support** (`comfy_extras/nodes_minimax_h3.py`,
v0.34.0+). No custom nodes.

```bash
git clone --depth 1 https://github.com/comfyanonymous/ComfyUI /data/ComfyUI
pip install --break-system-packages --target=/data/pylibs -r /data/ComfyUI/requirements.txt
```

`--break-system-packages` is required — the pod runs as root under PEP 668.

**Start it like this, every time:**

```bash
cd /data/ComfyUI && export PYTHONPATH=/data/pylibs && \
setsid python3 main.py --listen 0.0.0.0 --port 8188 --preview-method auto \
  > /data/comfy.log 2>&1 < /dev/null &
```

**`--preview-method auto` is not optional.** Without it ComfyUI never emits the
binary latent frames, so Direkta's generation monitor shows a progress bar but
never the picture forming — a 15-minute render looks like a stalled spinner.

Verify: `curl -s http://127.0.0.1:8188/system_stats` should return JSON, and
`http://<POD_IP>:8188/system_stats` must work from the VPS too.

---

## 6 · THE WORKING NODE GRAPH

Submitted via `POST /prompt`, not the web UI.

```
UNETLoader(minimax_h3_fl2va_pruned_fp8_scaled, weight_dtype=default)
  -> MiniMaxH3SigmaShift(shift_video=12.0, shift_audio=3.0)   -> KSampler.model

CLIPLoader(qwen3vl_32b_..._int8_convrot, type="minimax")
VAELoader(minimax_h3_video_vae_fp16)
  -> MiniMaxH3ImageToVideo(prompt, width, height, length)      -> (positive, latent)
     or MiniMaxH3ReferenceToVideo(... ref_image_size="match",
                                  ref_images=[{"ref_image": ["13",0]}])

ConditioningZeroOut(positive) -> KSampler.negative
KSampler(steps=20, cfg=1.0, sampler_name="euler", scheduler="simple", denoise=1.0)

VAEDecode(video vae)      -> images -> SaveWEBM(codec="vp9", fps=24)
VAEDecodeAudio(audio vae) -> audio  -> SaveAudio
```

**ComfyUI does not mux the two.** Download both and combine locally:

```bash
ffmpeg -i video.webm -i audio.flac -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest out.mp4
```

**Frame count must sit on the H3 grid:** `{5, 22, 39, 56, 73, 90, 107, 124}`.
124 frames at 24 fps = 5.17s. Dimensions must be multiples of 32.

**Measured timings** on this card at 124 frames:

| Settings | Per shot |
|---|---|
| 768×1344 · 20 steps | **~220 s** (≈ ₹7) |
| 896×1568 · 30 steps | **~490 s** (≈ ₹15) |

First render of a session adds ~90 s of model load.

---

## 7 · WIRE IT INTO DIREKTA

On the VPS, in `/home/claudebot/direkta/.env`:

```
RUNPOD_H3_PROXY_BASE=http://<POD_IP>:8188
```

Then `systemctl restart direkta`.

That single variable routes generation to NeevCloud. The live generation monitor
(`/api/minimax-h3/stream` → `useH3Live`) then works: step count, ETA, queue depth
and latent previews, provided §5's `--preview-method` flag is set.

**Two cautions.**

The client id must match. ComfyUI addresses progress and preview events **only to
the submitting client**. Direkta submits each person's jobs as
`direkta-h3-<their user id>` (`h3ClientId()`), and each person's live monitor
listens on that same id, so testers only ever see their own previews. A listener
on any other id — including a hand-run script using plain `direkta-h3` — sees
queue counts and nothing else.

Port 8188 is **plain HTTP and open to the internet with no authentication** while
the pod is up. The SSE relay is server-side so the browser mixed-content rule is
not an issue, but anyone who learns the IP can drive that ComfyUI. Delete the pod
promptly, and do not post the IP anywhere.

---

## 8 · COST CONTROL — READ THIS

**₹113.46/hr, billed continuously, whether or not the GPU is doing anything.**
No Stop button. No usable API. Nothing can halt the meter automatically.

On a previous run this cost **₹115 of pure idle time in a single session** —
41% of samples at 0% utilisation — because the pod stayed up while a human
thought, wrote and debugged.

**The rule: write and verify the entire job queue BEFORE the pod exists, then
delete the pod the moment the queue drains.**

`scripts/h3-costguard.sh` samples the queue and GPU every 60s and pushes a phone
notification via ntfy.sh the instant work finishes:

```bash
setsid bash /data/h3-costguard.sh <your-ntfy-topic> 113.46 5 >/dev/null 2>&1 &
```

**Reset the billing stamps on every bring-up.** They live on `/data`, which
outlives the pod, so a stale stamp reports a wildly wrong figure — it once
claimed ₹3832 for a 20-minute session:

```bash
date +%s > /data/.billing_start
date +%s > /data/.costguard/started
rm -f /data/gpu.csv /data/costguard.csv
```

---

## 9 · GOTCHAS THAT COST REAL TIME

- **`pkill -f <pattern>` from an SSH one-liner matches its own command line** and
  kills your session (exit 255). Use `pgrep` then kill by PID.
- **`cp` and `>` may prompt or refuse** — `cp` can be aliased to `-i`, and
  `noclobber` blocks redirects. Use `rm -f` first.
- **Write a remote script, verify it with `wc -c` and a syntax check, and only
  then launch it.** Chaining `cat > file && … &` backgrounds the whole chain and
  the write races the run — that produced a 0-byte script that "ran" three times
  and cost ~₹40.
- **NeevCloud bakes a host key into their pod image.** Two different pods
  presented an identical SSH host key, and a third changed key mid-session. Host
  verification there is close to meaningless; treat a changed key as "check the
  console", not as proof of anything.
- **Negative instructions are weak with H3.** It rendered a HUD after being told
  not to, twice. Prefer describing what you want present.
- **H3 garbles digits and multi-line text** but renders **one short word**
  reliably when it is spelled out letter by letter and is the sole subject of the
  frame. Burn all numbers in with ffmpeg.

---

## 10 · DONE WHEN

- [ ] `/data` is a real mount with ≥75 GB free
- [ ] `nvidia-smi` shows the Blackwell card; torch lists `sm_120`
- [ ] All four model files present at the sizes in §4
- [ ] ComfyUI answers on `127.0.0.1:8188` **and** on `<POD_IP>:8188` from the VPS
- [ ] It was started with `--preview-method auto`
- [ ] One test render completes in ~220 s and produces a webm plus a flac
- [ ] `RUNPOD_H3_PROXY_BASE` set on the VPS; `direkta` restarted
- [ ] A generation triggered from Direkta's UI shows live progress **and a latent preview**
- [ ] Cost guard running; billing stamps reset
- [ ] The operator knows the pod must be **deleted by hand**, and that `/data` survives it
