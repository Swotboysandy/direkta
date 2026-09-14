# H3 character LoRA — GamingCap gamer

Trainer is **Fizgig**, not musubi-tuner: Fizgig is the pipeline we have actually
proven end-to-end on this model (see the "unlit_v1" run). musubi-tuner also
supports H3 and is the fallback if Fizgig breaks.

## Dataset reality check

The 15 clips we have cover only **8 distinct scenes** — the `hd_*` set and the
`gc_*` set are the same seven shots re-rendered at higher settings, so training
on both teaches the same eight setups twice and invites overfitting rather than
generalisation.

So the dataset is built from the 7 HD clips plus `g4_alone_v2` (8 distinct
scenes), and `gen-lora-clips.py` generates **12 more deliberately varied** clips
— different angles, lighting, times of day, actions, and one daylight scene — to
reach 20. Community guidance for H3 is 10–20 varied clips minimum; 8 near-identical
night-at-the-desk shots is not enough to be worth the GPU hours.

## Order of operations — one pod bring-up, no idle time

    1  scripts/train/gen-lora-clips.py     on the pod   ~70 min   generate the 12 new clips
    2  scripts/train/build-dataset.sh      anywhere     ~1 min    conform + caption + TOML
    3  scripts/train/train-lora.sh         on the pod   ~5 h      cache latents, cache text, train

Write and verify all three BEFORE starting the pod. The last run wasted about
Rs 115 on an idle GPU because work was prepared while the meter ran.

## Hard-won constraints (do not "fix" these)

- **Text encoder must be `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`.** The
  `int8_convrot` file we use for *generation* fails training with
  `KeyError: weight_scale_2`. Separate ~15GB download, path `text_encoders/...`
  with no `split_files/` prefix.
- Dataset spec is strict: `.mp4`, **exactly 24fps**, frame count in
  {5,22,39,56,73,90,107,124}, dims a multiple of 32, audio 32kHz stereo or none,
  and a same-named `.txt` caption beside every clip.
- `--gradient_checkpointing` takes `auto|on|off`, not a bare flag. There is no `--sdpa`.
- Fizgig is not pip-installable — `export PYTHONPATH=/workspace/Fizgig/src`.
- **Audio is trained too** (~57–72% of the loss on the proven run), so clips keep
  their sound.

## Cost

The proven run was 6 clips × 768px, 60 epochs = 360 steps at 45.6 s/step ≈ 4h34m
on an A100. Our Blackwell is ~5.9× faster on inference; assume it is faster here
too but **do not promise a number** — measure the first ten steps and multiply.
