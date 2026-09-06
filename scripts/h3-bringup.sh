#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# MiniMax H3 + ComfyUI bring-up for a NeevCloud RTX PRO 6000 (Blackwell) pod.
#
# Everything lands in /data — the network volume that survives the pod being
# stopped or deleted. That is the whole point: on RunPod only /workspace
# survived, so every container reset re-downloaded 53GB of weights at ~₹57 a
# time. Run this once; every later start is free.
#
#   HF_TOKEN=hf_xxx bash h3-bringup.sh
#
# It refuses to download anything until the GPU is proven usable.
# ---------------------------------------------------------------------------
set -euo pipefail

DATA=/data
COMFY=$DATA/ComfyUI
VENV=$DATA/venv
MODELS=$COMFY/models

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
die() { printf '\n\033[31mSTOP: %s\033[0m\n' "$*" >&2; exit 1; }

# --- 0. the volume actually exists -----------------------------------------
say "Checking /data is the network volume"
mountpoint -q $DATA || die "/data is not a mount point. The pod was deployed without
     network storage, so anything written here dies with the container. Fix the
     pod before continuing — this is the single most expensive mistake to make."
df -h $DATA | awk 'NR==2{print "  /data: "$2" total, "$4" free"}'
avail=$(df -BG --output=avail $DATA | tail -1 | tr -dc '0-9')
[ "$avail" -ge 75 ] || die "only ${avail}GB free on /data; the weights alone are 53GB.
     Grow the volume, or this run will die halfway through a download."

# --- 1. the GPU is real AND this torch can speak to it ---------------------
# Blackwell is sm_120. A torch without those kernels either refuses the card or
# crawls — and finding that out AFTER a 53GB download is how money gets burned.
say "Verifying the GPU before downloading anything"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader || die "no nvidia-smi"
python3 - <<'PY' || die "torch cannot use this GPU — fix torch before downloading 53GB"
import sys, torch
print(f"  torch {torch.__version__}  cuda {torch.version.cuda}")
if not torch.cuda.is_available():
    print("  CUDA NOT AVAILABLE"); sys.exit(1)
name = torch.cuda.get_device_name(0)
archs = torch.cuda.get_arch_list()
cap = torch.cuda.get_device_capability(0)
print(f"  device: {name}   capability: sm_{cap[0]}{cap[1]}")
print(f"  arch list: {archs}")
want = f"sm_{cap[0]}{cap[1]}"
if want not in archs:
    print(f"  {want} IS MISSING from this torch build.")
    print("  Install a matching build, e.g.:")
    print("    pip install --force-reinstall torch --index-url https://download.pytorch.org/whl/cu128")
    sys.exit(1)
x = torch.randn(4096, 4096, device="cuda")
print(f"  matmul on device: {(x @ x).sum().item():.1f}  <- kernels work")
free, total = torch.cuda.mem_get_info()
print(f"  VRAM: {total/2**30:.1f} GiB total, {free/2**30:.1f} GiB free")
if total/2**30 < 55:
    print("  WARNING: H3 peaked at 50.6GB on a real render. This card is marginal.")
PY

# --- 2. ComfyUI, into /data ------------------------------------------------
say "Installing ComfyUI into $COMFY (not the container disk)"
mkdir -p "$MODELS"/{diffusion_models,text_encoders,vae,loras}
if [ ! -d "$COMFY/.git" ]; then
  git clone --depth 1 https://github.com/comfyanonymous/ComfyUI "$COMFY"
else
  git -C "$COMFY" pull --ff-only || true
fi
# H3 support is first-party from v0.34.0 — no custom nodes needed.
[ -d "$VENV" ] || python3 -m venv --system-site-packages "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q -r "$COMFY/requirements.txt"
"$VENV/bin/pip" install -q "huggingface_hub[cli]"
"$VENV/bin/python" -c "import torch;print('  venv torch:', torch.__version__, 'cuda', torch.cuda.is_available())"

# --- 3. the weights --------------------------------------------------------
# Comfy-Org, NOT unsloth: unsloth ships .pt for diffusers+torchao, which
# ComfyUI cannot read. That mistake cost a 45GB download once already.
say "Fetching the model manifest (~53GB) from Comfy-Org/MiniMax-H3"
[ -n "${HF_TOKEN:-}" ] || die "HF_TOKEN is not set. Unauthenticated HuggingFace pulls run at
     2-3 MB/s — 53GB would take ~6 hours of billed GPU time (~₹680) instead of
     ~30 minutes (~₹57). Get a read token from huggingface.co/settings/tokens."

export HF_HUB_DISABLE_XET=1          # the Xet backend throws mid-transfer
export HF_HOME=$DATA/.hfcache

"$VENV/bin/python" -c "
from huggingface_hub import whoami
print('  HF token belongs to:', whoami(token='$HF_TOKEN')['name'])
" || die "that HF_TOKEN is invalid or revoked — a stale token fails silently and slowly"

get() {  # repo-path -> destination dir
  local path="$1" dest="$2" name; name=$(basename "$path")
  if [ -s "$dest/$name" ]; then echo "  have $name"; return; fi
  echo "  pulling $name"
  "$VENV/bin/hf" download Comfy-Org/MiniMax-H3 "$path" \
      --local-dir "$DATA/_dl" --token "$HF_TOKEN" >/dev/null
  mv "$DATA/_dl/$path" "$dest/$name"
}
get diffusion_models/minimax_h3_fl2va_pruned_fp8_scaled.safetensors "$MODELS/diffusion_models"
get text_encoders/qwen3vl_32b_minimax_h3_int8_convrot.safetensors   "$MODELS/text_encoders"
get vae/minimax_h3_video_vae_fp16.safetensors                        "$MODELS/vae"
get vae/minimax_h3_audio_vae_fp32.safetensors                        "$MODELS/vae"
rm -rf "$DATA/_dl" "$HF_HOME"        # reclaim the cache; /data is only 100GB

say "What landed"
find "$MODELS" -name '*.safetensors' -printf '  %-70p %10s\n' | numfmt --to=iec --field=2 || \
  find "$MODELS" -name '*.safetensors' -exec ls -lh {} \;
df -h $DATA | awk 'NR==2{print "  /data now: "$4" free"}'

say "Done. Start ComfyUI with:"
cat <<EOF
  cd $COMFY && $VENV/bin/python main.py --listen 0.0.0.0 --port 8188
EOF
