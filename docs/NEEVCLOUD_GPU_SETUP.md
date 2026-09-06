# NeevCloud GPU — what to buy, and where to start

Written 2026-09-07, against the real console pricing. Supersedes §3–4 of
`GPU_MIGRATION_PLAN.md` now that the actual catalogue is known.

---

## 1. There is only one card worth buying, and it happens to be the right one

Everything except one option shows **Notify Me** — unavailable. Available now:

| card | ₹/hr | VRAM | RAM | verdict |
|---|---|---|---|---|
| **RTX PRO 6000 Blackwell** | **113.41** | **96 GB** | 56 GB | **buy this** |
| A100 80 GB | 124.76 | 80 GB | 125 GB | unavailable, and dearer |
| H100 80 GB | 188.08 | 80 GB | 125 GB | unavailable, 66% dearer for no gain here |
| H200 141 GB | 225.88 | 141 GB | 192 GB | unavailable, twice the price, pointless |
| RTX A6000 48 GB | 79.39 | 48 GB | 128 GB | **would not work** — 48 GB is below our measured peak |
| Tesla T4 16 GB | 27.41 | 16 GB | 128 GB | not remotely enough |

The choice is forced, and it is lucky:

- **96 GB against a measured 50.6 GB peak.** Nearly double the headroom. The
  A6000 at 48 GB would fail exactly as the 46 GB one already did.
- **₹113.41/hr is what we were already paying.** RunPod's A100 was $1.39/hr,
  which is about ₹116. So this is marginally *cheaper* than before, with 16 GB
  more VRAM and a two-generation newer chip. All the cost maths in the other
  plan carries over unchanged.
- **Blackwell runs fp8 natively.** Our checkpoint is
  `minimax_h3_fl2va_pruned_fp8_scaled`. The A100 is Ampere and has **no native
  fp8**, so those weights were being widened at load and sampled in a wider
  format the whole time. On Blackwell they run as they were quantised. The
  A100's 206 s for 8 steps should improve — I am not going to guess by how much,
  but it will not get worse.

**Take 1 GPU, not more.** The graph is single-GPU; a second card bills and idles.

### The one spec that is worse
56 GB system RAM, against the A100 config's 125 GB. Weights load through
`safetensors` mmap so this should hold, but a 27 GB text encoder on a 56 GB host
has less slack than we have been used to. If loading dies with an OOM that is
*not* a CUDA OOM, this is why — add swap on `/data` rather than resizing the pod.

---

## 2. Can the VPS be the persistent storage? — partly, and the split matters

Both machines are in India: the VPS is Contabo **Mumbai**, the GPU is
**Indore (as-south-1)**. That is a short, fast hop — the 893 MB LoRA transfer
ran at ~30 MB/s.

**For the 53 GB of base weights: no.** Even at 30 MB/s that is ~30 minutes of
pulling, and at ₹113.41/hr each pull burns **~₹57 of GPU time**. Use NeevCloud's
own network storage: Step 3 offers **100 GB mounted at `/data`, and it survives
the pod being stopped *or deleted*.** That single box is the fix for the biggest
leak we had — on RunPod nothing but `/workspace` survived, so every container
reset meant re-downloading everything.

Also: the VPS has 68 GB free of 193 GB. It could technically hold 53 GB. It would
then be nearly full, for no benefit.

**For the LoRA and the outputs: yes, and it already is.** `unlit_v1` and its
training clips are on the app box now. 300 MB copies in seconds when a pod
starts, and the LoRA is the part that actually changes.

So the split is:

| what | where | why |
|---|---|---|
| 53 GB base weights, ComfyUI, venv | **NeevCloud `/data`** | local to the GPU, survives delete, free |
| LoRAs (300 MB each) | **VPS**, pushed to `/data` on start | small, changes often, needs a home that outlives the pod |
| rendered outputs | **pull to the VPS, then delete** | `/data` is only 100 GB |
| canonical backup of everything trained | **VPS** | already checksum-verified there |

⚠️ The storage panel reads "100 GB free/year · 0 GB remaining", which is
ambiguous. **Confirm it is actually ₹0 before deploying** — the summary says
Disk ₹0/GB/mo and Total ₹0/mo, but "0 GB remaining" may mean the free allowance
is spent.

### Budget for `/data`
```
53 GB  base weights
15 GB  ComfyUI + torch venv
 1 GB  LoRAs
─────
69 GB  → ~31 GB left for outputs. Ship them off and delete, or you will fill it.
```

---

## 3. The thing that will cost you money if you get it wrong

**Blackwell is `sm_120`. The RunPod recipe will not work unchanged.**

The A100 is `sm_80`, which every PyTorch build has supported for years. Blackwell
needs **CUDA 12.8+ and a PyTorch built for it (2.7+, cu128)**. A stock
`pip install torch` — or an image built around CUDA 12.1 — gives you a torch with
no `sm_120` kernels. ComfyUI will then either refuse to use the GPU or crawl,
and you will be paying ₹113/hr to work that out.

So, when picking the image in Step 2: **CUDA 12.8 or newer, PyTorch 2.7 or newer.**
If the template list offers nothing that new, take the newest plain Ubuntu 22.04/24.04
CUDA image and install torch from the cu128 index yourself.

**Verify it before downloading 53 GB.** This is the single most valuable two
minutes of the whole setup — the RunPod lesson was that we discovered problems
*after* paying to download:

```bash
python3 -c "import torch; print(torch.__version__, torch.version.cuda); \
print(torch.cuda.get_device_name(0)); \
print('arch list:', torch.cuda.get_arch_list()); \
x=torch.randn(4096,4096,device='cuda'); print('matmul ok:', (x@x).sum().item())"
```

`get_arch_list()` **must contain `sm_120`**, and the matmul must return a number
rather than throwing. If either fails, fix torch before anything else. Do not
start the download.

---

## 4. Where to start — the actual order

**Before you click Deploy**

1. **Generate a dedicated SSH key** (the form blocks deploy without one — same
   pattern as the `runpod_h3` key). Keep the private half on the VPS so the app
   can bootstrap the pod itself later.
2. **Create the network storage first**, 100 GB at `/data`, in the same
   deployment — not afterwards. Confirm the ₹0 (see the warning above).
3. **Pick a CUDA 12.8+ / PyTorch 2.7+ image.**
4. **On-Demand, not a savings plan.** The 1-month plan saves ₹4,082 but only
   pays off above ~693 hours of use in the month. We used single-digit hours on
   RunPod. Reserve only once a month of real logs says otherwise.

**First boot, in this order**

5. Run the `sm_120` check above. **Stop here if it fails.**
6. Install ComfyUI *into `/data`*, never the container disk:
   `/data/ComfyUI`, `/data/venv`, `/data/ComfyUI/models/…`. This is what makes
   every future start free.
7. Download the manifest into `/data` — exact files, exact repo, in
   `GPU_MIGRATION_PLAN.md` §4. `HF_HUB_DISABLE_XET=1`, valid `HF_TOKEN`, and
   **Comfy-Org, not unsloth**.
8. Copy the LoRA from the VPS:
   `scp /opt/fylmer-models/lora_models/unlit_v1.safetensors → /data/ComfyUI/models/loras/`
9. Checksum the big files once, now, while nothing depends on them.
10. **Dry-run one shot at 512px.** Proves graph, LoRA path and the ffmpeg mux for
    a few rupees before committing to a batch.
11. Test `turbo: true` on exactly one shot — it is coded and has never been run.
12. Point the app at the new pod: swap `RUNPOD_*` in the VPS `.env` for the
    NeevCloud host, keep the `finally`-block auto-stop.

**Then, and only then, batch.** Queue every beat, start once, render all, stop once.

---

## 5. What a Kaliyug-sized run should cost

18 shots, using the A100's measured 206 s per 8-step shot as the pessimistic case
(Blackwell's native fp8 should beat it):

| | ₹ |
|---|---|
| one-time setup (image, 53 GB download, verify) ~2 hr | ~230 |
| 18 shots, **one warm session** (load once + 18 × 3.4 min) | ~125 |
| 18 shots, **cold-started one at a time** | ~260 |

**Batching is worth about half the bill, every time.** And with `/data`, the ~₹230
setup is paid once ever, not once per container reset — which is where the RunPod
money actually went.

Set a spend cap and an idle auto-stop in the console **before** the first render.
The `finally` block in `minimax-h3.ts` only protects you from our own code paths,
not from a crash or a forgotten session.
