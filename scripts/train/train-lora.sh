#!/usr/bin/env bash
# H3 character LoRA, via Fizgig. Run ON the pod.
#
#   train-lora.sh <dataset-dir> <output-name> [epochs]
#
# Everything here is the pipeline proven on the "unlit_v1" run. The three steps
# must run in order — training reads caches the first two steps write.
set -euo pipefail

DATASET="${1:?usage: train-lora.sh <dataset-dir> <output-name> [epochs]}"
NAME="${2:?usage: train-lora.sh <dataset-dir> <output-name> [epochs]}"
EPOCHS="${3:-60}"

DATA=/data
FIZGIG=$DATA/Fizgig
MODELS=$DATA/ComfyUI/models
OUT=$DATA/lora_out/$NAME
LOG=$DATA/train_$NAME.log

DIT=$MODELS/diffusion_models/minimax_h3_fl2va_pruned_fp8_scaled.safetensors
VVAE=$MODELS/vae/minimax_h3_video_vae_fp16.safetensors
AVAE=$MODELS/vae/minimax_h3_audio_vae_fp32.safetensors
# NOT the int8_convrot file used for generation — that one dies here with
# `KeyError: weight_scale_2`. This is a separate ~15GB download.
TENC=$MODELS/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors
TOML=$DATASET/dataset.toml

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

say "preflight"
missing=0
for f in "$DIT" "$VVAE" "$AVAE" "$TOML"; do
  if [ -s "$f" ]; then printf '  ok      %s\n' "$(basename "$f")"
  else printf '  MISSING %s\n' "$f"; missing=1; fi
done
if [ -s "$TENC" ]; then
  printf '  ok      %s\n' "$(basename "$TENC")"
else
  printf '  MISSING %s\n' "$TENC"
  cat <<'EOF'
          Download it before training — the int8 encoder will NOT work:
          huggingface-cli download Comfy-Org/MiniMax-H3 \
            text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors \
            --local-dir /data/ComfyUI/models
          (note: no split_files/ prefix on this path)
EOF
  missing=1
fi
clips=$(ls "$DATASET"/*.mp4 2>/dev/null | wc -l)
caps=$(ls "$DATASET"/*.txt 2>/dev/null | wc -l)
printf '  clips %s · captions %s\n' "$clips" "$caps"
[ "$clips" -gt 0 ] && [ "$clips" -eq "$caps" ] || { echo "  every clip needs a matching .txt"; missing=1; }
[ "$missing" -eq 0 ] || { echo; echo "preflight failed — nothing started, no GPU time spent"; exit 1; }

if [ ! -d "$FIZGIG" ]; then
  say "cloning Fizgig"
  git clone --depth 1 https://github.com/shootthesound/Fizgig "$FIZGIG"
fi
# Fizgig has no pyproject.toml, so it is never pip-installable — it runs off
# PYTHONPATH or not at all.
export PYTHONPATH="$FIZGIG/src"
mkdir -p "$OUT"

say "1/3  caching video + audio latents"
python3 -u -m fizgig.scripts.minimax_cache_latents \
  --dataset_config "$TOML" --vae "$VVAE" --audio_vae "$AVAE" 2>&1 | tee -a "$LOG"

say "2/3  caching text embeddings"
python3 -u -m fizgig.scripts.minimax_cache_text \
  --dataset_config "$TOML" --text_encoder "$TENC" 2>&1 | tee -a "$LOG"

say "3/3  training — $EPOCHS epochs"
# --gradient_checkpointing takes auto|on|off, not a bare flag. There is no --sdpa.
python3 -u -m fizgig.scripts.minimax_train \
  --dit "$DIT" --vae "$VVAE" --audio_vae "$AVAE" --text_encoder "$TENC" \
  --dataset_config "$TOML" --output_dir "$OUT" --output_name "$NAME" \
  --network_dim 16 --network_alpha 16 --learning_rate 1e-4 \
  --max_train_epochs "$EPOCHS" --save_every_n_epochs 20 \
  --optimizer_type adamw8bit --gradient_checkpointing auto 2>&1 | tee -a "$LOG"

say "done"
ls -la "$OUT" | sed 's/^/  /'
cat <<EOF

  To use it: copy the .safetensors into /data/ComfyUI/models/loras/ and insert a
  LoraLoaderModelOnly between UNETLoader and MiniMaxH3SigmaShift.

  Trigger phrase: "the gcap gamer"

  Before trusting it, A/B at a FIXED SEED against no-LoRA on a scene it never
  saw, with a DELIBERATELY VAGUE prompt. With a paragraph-long description base
  H3 already gets ~90% there, so a rich prompt hides whether the LoRA did
  anything. That was the honest finding from the last run.
EOF
