# Second instance + NeevCloud GPU — plan

Written 2026-09-06. Everything here is measured from the RunPod run, not estimated.

---

## 0. Done already

`unlit_v1` and its training set are on the new box, checksum-verified:

```
/opt/fylmer-models/lora_models/     893 MB, 15 files
  unlit_v1.safetensors          296 MB  sha256 3ea603b2cf235aa5…  (final, 60 epochs)
  unlit_v1-000040.safetensors   296 MB  sha256 345145bf75988290…
  unlit_v1-000020.safetensors   296 MB  sha256 c3a08302ece390af…
  + the 6 training clips and their caption .txt files
```

All three hashes match the source on the deploy VPS exactly. The training clips came
too — a v2 run needs them, and re-cutting them is hours of work.

**The LoRA does nothing on this box.** It is a file that a GPU loads at render
time. It lives here so it survives, and so the GPU can pull it on demand.

---

## 1. The new box is not what the app expects

`103.39.134.210:22331` — Ubuntu 24.04, **2 cores, 7.9 GB RAM, 8 GB swap, 74 GB free.**

It is **already a live production server**: nginx and MySQL, up 106 days, serving
something on :80 and :443. Treat it as occupied.

Four things block a Fylmer deploy today:

| | found | needed | why it matters |
|---|---|---|---|
| Node | **18.19.1** | **24** | `node:sqlite` is the entire data layer. It does not exist in Node 18 — the app will not start, not "run slowly". |
| ffmpeg | missing | required | every render, the score mux, and the reference-image centre-crop shell out to it |
| :80 / :443 | nginx, in use | a vhost | do **not** point Caddy at them. Add an nginx `server` block proxying to Fylmer's port, or you take the existing site down |
| build headroom | 2 cores / 7.9 GB | — | the current VPS is 6 cores / 11 GB and still got OOM-killed at Node's default heap. Build with `--max-old-space-size=4096`, or build elsewhere and ship `.next`. The 8 GB swap will save you, slowly. |

The database is `node:sqlite` on a file — the MySQL already running is unrelated
and Fylmer will not touch it.

---

## 2. Where the money actually went

Measured on RunPod, A100 80 GB PCIe at **$1.39/hr**:

| what | cost | note |
|---|---|---|
| one shot | ~$0.90 | **~$0.40 of it was cold start** |
| LoRA train, 6 clips × 768px × 60 epochs | $6.35 | 4h34m, 45.6 s/step, 44 GB VRAM |
| wrong model repo (`unsloth`, `.pt` for diffusers) | 45 GB download | unusable in ComfyUI |
| wrong text encoder (int8 instead of nvfp4) | 15 GB download | training died on `KeyError: weight_scale_2` |

**The single biggest waste was cold start.** 44% of every shot was the machine
waking up and loading 53 GB of weights, not rendering. Ten shots rolled one at a
time cost `10 × $0.90 = $9.00`. The same ten in one warm session cost
`$0.40 + 10 × $0.50 = $5.40`. **That is 40% for changing nothing but the batching.**

Second biggest: **nothing survived a pod restart except `/workspace`.** Every
container-disk reset meant re-installing ComfyUI's deps and re-pulling weights —
53 GB at ~50 MB/s is ~18 min of billed GPU time, ~$0.42, for zero output. There
is a commit in this repo named *"Reinstall ComfyUI's deps when the container disk
has been reset"*, which tells you how often it happened.

Then: failed jobs bill exactly like successful ones. Content-filter refusals,
stretched off-ratio references, and garbled on-screen text all cost full price.

And the balance ran to **-$0.01** mid-project, which is how the Kaliyug trailer
ended up one shot short.

---

## 3. Rules for the NeevCloud instance

**Size it to 50.6 GB, not to the biggest number on the menu.**
Real measured peak during sampling was **50.6 GB** — not the 36.97 GB the README
claims, and not the naive ~50 GB static-weights guess. A 46 GB RTX A6000 is
**proven insufficient**. So: 80 GB (A100/H100) is the floor that works, and a
64 GB card would work if offered. Do not pay for 2×80 GB or an 8-GPU node — H3
does not shard across them in this graph, so the second card bills and idles.

**Then, in order of how much each saves:**

1. **Never render one shot at a time.** Queue the whole beat list, start once,
   render all, stop once. This is the 40%.
2. **Put the 53 GB of weights on a persistent volume** that survives restarts,
   and mount it at the same path every time. Never on container disk. Verify
   with a checksum before the first render, not after a failed one.
3. **Set a hard spend cap and an idle auto-stop** on the provider side, before
   the first render. The `finally`-block auto-stop in `minimax-h3.ts` works, but
   it only protects you from *our* code paths — not from a crashed process or a
   session you forget.
4. **Dry-run before a batch.** One shot at 512px proves the graph, the LoRA path
   and the ffmpeg mux for ~$0.10 before you commit to twenty at 768px.
5. **Test the Turbo LoRA once.** `minimax_h3_turbo_v4_step600_ema.safetensors` is
   already coded as opt-in `turbo: true` and has **never been run**. It targets
   fewer steps per shot. If it works it cuts every future shot; if the base
   checkpoint mismatches, you want to find out on one cheap shot, not mid-batch.
6. **Keep a cost log** — date, shots, wall-clock, dollars. Without it you cannot
   tell an expensive night from a leak.

---

## 4. Bring-up runbook

Everything below is already paid for once. Do not rediscover it.

**Weights — the exact manifest.** Source is **`Comfy-Org/MiniMax-H3`** on
HuggingFace (ComfyUI-native `.safetensors`). **Not `unsloth/MiniMax-H3-FP8`** —
those are `.pt` for diffusers+torchao and cost a 45 GB download to learn.

```
diffusion_models/minimax_h3_fl2va_pruned_fp8_scaled.safetensors   ~20 GB
text_encoders/qwen3vl_32b_minimax_h3_int8_convrot.safetensors     ~27 GB   ← generation
vae/minimax_h3_video_vae_fp16.safetensors                         ~4.9 GB
vae/minimax_h3_audio_vae_fp32.safetensors                         ~0.6 GB
text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors        ~15 GB   ← training only
```

The last one is the trap: **training needs nvfp4, generation needs int8_convrot.**
Using int8 for training fails with `KeyError: weight_scale_2`.

**Downloading:** set `HF_HUB_DISABLE_XET=1` (the Xet backend throws
`RuntimeError: Background writer channel closed`) and always pass a valid
`HF_TOKEN` — unauthenticated pulls run at 2-3 MB/s. Verify the token with
`whoami(token=...)` first; a stale one fails silently and slowly.

**ComfyUI:** native H3 support ships in v0.34.0+ (`comfy_extras/nodes_minimax_h3.py`).
No custom nodes. `git clone comfyanonymous/ComfyUI` +
`pip install -r requirements.txt --break-system-packages`.

**Graph** (POST `/prompt`, not the web UI): `UNETLoader` → `MiniMaxH3SigmaShift`
(shift_video 12.0, shift_audio 3.0) → KSampler(steps 8, cfg 1.0, euler, simple).
`CLIPLoader` **type="minimax"**. `MiniMaxH3ImageToVideo` at 768×448, length 124
(~5 s @ 24 fps). `ConditioningZeroOut` for the negative. Decode video and audio
VAEs in parallel from the same latent. ComfyUI **does not mux** — download both
and `ffmpeg -i v.webm -i a.flac -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest`.
206 s for 8 steps on the A100.

**Expose ComfyUI on `8188/http`** if the app calls it over the internet.

**Two shell traps that cost a session each:**
- `pkill -f <pattern>` from an SSH one-liner matches its **own** argv and kills
  your session. Use `ps aux` and kill by PID.
- Same self-match makes `pgrep -f … | wc -l` return one phantom.

**Content rules, learned the expensive way:** never ask H3 for readable on-screen
text (it garbles — burn it in with ffmpeg afterwards), and centre-crop any
off-ratio reference still before upload or H3 stretches it.

---

## 5. Security — do this first

The root password for the new box was sent in plain chat, so treat it as public:

1. Add an SSH key and set `PasswordAuthentication no`.
2. **Rotate that password.**
3. Keep the non-standard port 22331 — it is already cutting the noise.

I can do steps 1 and 2 whenever you want; I have not changed any auth settings.

---

## 6. Order of work

1. Rotate the password, install keys.
2. Node 18 → 24. Install ffmpeg. *(Nothing else can start before this.)*
3. nginx vhost → Fylmer's port. Do not touch the existing site's config.
4. Deploy the app, `DATA_DIR` pointing at a path that includes
   `/opt/fylmer-models`, so the LoRA is where the render code expects it.
5. **Only then** buy the GPU — with the cap and idle-stop set before the first
   render, and the weights on a persistent volume.
6. Dry-run one 512px shot. Then test the Turbo LoRA on one shot. Then batch.
