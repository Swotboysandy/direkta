#!/usr/bin/env python3
"""Generate the 12 varied clips the LoRA dataset is missing.

The eight clips we already have are all the same man, at the same desk, at
night, in the same blue RGB. A LoRA trained only on those learns "that room"
as much as it learns "that person" — so every shot here deliberately breaks one
of those constants: daylight, a different room, standing, outdoors, a different
shirt, a different camera height.

Identity is held constant by the reference image and by one fixed sentence, so
the only thing repeated across the set is the man himself.

Run ON the pod:  python3 -u gen-lora-clips.py
Outputs:         /data/ComfyUI/output/lora_XX_<slug>.webm  (+ .flac)
"""
import json, time, urllib.request, urllib.error, uuid, sys

H = "http://127.0.0.1:8188"
# Matches the existing HD clips so the dataset is one resolution, one frame count.
W, H_, LENGTH, STEPS = 896, 1568, 124, 30
REF = "gcap_ref.png"          # must already be in /data/ComfyUI/input/

HERO = ("A young Indian man in his early twenties, short black hair, light "
        "stubble. Image 1 defines his face, hair and build.")

GRAIN = ("Cinematic live-action, full-frame camera, 35mm lens, shallow depth of "
         "field, soft natural film grain, high dynamic range. Extremely detailed: "
         "skin texture and stubble, fabric weave, crisp specular highlights. "
         "No text, no letters, no numbers, no writing anywhere in frame.")

# (slug, prompt) — each breaks at least one constant of the existing eight.
SHOTS = [
 ("day_window",
  HERO + " He stands at a window in a bright bedroom in the middle of the day, "
  "warm daylight across his face, holding a phone and reading it. He looks up "
  "and out of the window, then back down. Soft white daylight only, no RGB. "
  "The camera pushes in slowly from a medium distance."),
 ("day_kitchen",
  HERO + " He leans against a kitchen counter in the daytime in a plain white "
  "t-shirt, drinking from a steel glass, then lowers it and laughs at something "
  "off camera. Bright natural daylight from a window behind him. Static camera."),
 ("stand_talk",
  HERO + " He stands in a plain room facing the camera directly in a dark grey "
  "t-shirt, talking naturally to the lens, using one hand to gesture. Even soft "
  "light from the front. Medium close-up, static camera, no background clutter."),
 ("profile_turn",
  HERO + " He stands in profile against a plain wall and slowly turns his head "
  "to face the camera, neutral expression, then a small smile. Even soft studio "
  "light. Close-up. The camera holds still."),
 ("outdoor_street",
  HERO + " He walks along a quiet Indian residential street in the early "
  "evening, phone in one hand, looking down at it and then ahead. Warm low "
  "sunlight from the side, shop lights beginning to come on. Handheld tracking "
  "shot from the front-left, keeping him centred."),
 ("outdoor_balcony",
  HERO + " He leans on a balcony railing at dusk looking out over rooftops, "
  "elbows on the rail, relaxed. Warm orange sky behind him, cool ambient light "
  "on his face. Slow arc around him from the side."),
 ("desk_daylight",
  HERO + " He sits at a computer desk in the daytime with the curtains open, "
  "daylight flooding the room, hands on a keyboard, concentrating. No RGB "
  "lighting at all. Over-the-shoulder view, slow push in."),
 ("laugh_couch",
  HERO + " He sits sideways on a couch in a living room holding a phone, laughs "
  "hard at something on the screen and tips his head back, then wipes his eye. "
  "Warm lamp light. Medium shot, static camera."),
 ("headset_on",
  HERO + " He pulls black over-ear gaming headphones down onto his head with "
  "both hands and settles them, then looks forward and exhales, focused. Cool "
  "blue light. Tight close-up, slight low angle, camera static."),
 ("low_angle_stand",
  HERO + " He stands with arms crossed in a dim room, looking down at the "
  "camera which is positioned low near the floor. One warm practical light "
  "behind him rims his shoulders. Slow push in from the low angle."),
 ("mirror",
  HERO + " He stands in front of a bathroom mirror in the morning, looks at his "
  "own reflection, runs a hand through his hair, then leans closer. Cool white "
  "overhead light. The camera is behind his shoulder framing the reflection."),
 ("night_lamp_read",
  HERO + " He sits on the edge of a bed at night in a plain t-shirt reading his "
  "phone, the only light a warm yellow bedside lamp beside him. He rubs the back "
  "of his neck and sets the phone down. Static camera, medium shot."),
]


def post(path, payload):
    req = urllib.request.Request(
        H + path, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())


def get(path):
    return json.loads(urllib.request.urlopen(H + path, timeout=60).read())


def graph(prompt, prefix, seed):
    return {
     "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "minimax_h3_fl2va_pruned_fp8_scaled.safetensors", "weight_dtype": "default"}},
     "2": {"class_type": "MiniMaxH3SigmaShift", "inputs": {"model": ["1", 0], "shift_video": 12.0, "shift_audio": 3.0}},
     "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_32b_minimax_h3_int8_convrot.safetensors", "type": "minimax"}},
     "4": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_video_vae_fp16.safetensors"}},
     "5": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_audio_vae_fp32.safetensors"}},
     "13": {"class_type": "LoadImage", "inputs": {"image": REF}},
     "6": {"class_type": "MiniMaxH3ReferenceToVideo", "inputs": {
            "clip": ["3", 0], "prompt": f"{GRAIN}\n\nSHOT\n{prompt}",
            "width": W, "height": H_, "length": LENGTH,
            "ref_image_size": "match", "vae": ["4", 0],
            "ref_images": [{"ref_image": ["13", 0]}]}},
     "7": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["6", 0]}},
     "8": {"class_type": "KSampler", "inputs": {
            "model": ["2", 0], "positive": ["6", 0], "negative": ["7", 0],
            "latent_image": ["6", 1], "seed": seed, "steps": STEPS, "cfg": 1.0,
            "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
     "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["4", 0]}},
     "10": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["8", 0], "vae": ["5", 0]}},
     "11": {"class_type": "SaveWEBM", "inputs": {"images": ["9", 0], "filename_prefix": prefix, "codec": "vp9", "fps": 24.0, "crf": 20.0}},
     "12": {"class_type": "SaveAudio", "inputs": {"audio": ["10", 0], "filename_prefix": prefix}},
    }


# Queue everything up front so the GPU never waits on this script between jobs.
pending = []
for i, (slug, prompt) in enumerate(SHOTS):
    prefix = f"lora_{i+1:02d}_{slug}"
    try:
        r = post("/prompt", {"prompt": graph(prompt, prefix, 6100 + i),
                             "client_id": str(uuid.uuid4())})
        pending.append((prefix, r["prompt_id"]))
        print(f"queued {prefix}", flush=True)
    except urllib.error.HTTPError as e:
        print(f"REJECTED {prefix}: {e.read().decode()[:200]}", flush=True)

if not pending:
    sys.exit("nothing queued — check that ComfyUI is up and gcap_ref.png is in input/")

t0 = time.time()
for prefix, pid in pending:
    while True:
        time.sleep(10)
        hist = get(f"/history/{pid}")
        if pid in hist:
            status = hist[pid].get("status", {}).get("status_str")
            print(f"  {prefix}: {status}  (+{time.time()-t0:.0f}s)", flush=True)
            break
        if time.time() - t0 > 14400:
            print(f"  {prefix}: timeout", flush=True)
            break
print("LORA CLIPS DONE", flush=True)
