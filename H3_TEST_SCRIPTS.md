# MiniMax H3 — Test Scripts

Four single-shot tests (~$0.15 each, ~$0.60 total). Each is 5 seconds, 9:16 mobile.

Rules baked in: no readable text in-scene (H3 garbles it — burn titles in with ffmpeg after),
one continuous take, every frame specified.

---

## TEST 1 — Clothing brand

A lone model in an oversized cream wool coat stands in the centre of a wide, empty concrete
gallery, low winter sun raking in from a tall window on the left, dust suspended in the beam.

Timeline:
[0.0s-1.5s] Static wide. She stands three-quarters to camera, weight on her back foot, hands in
pockets, coat hanging open. The light catches the wool's texture along her left shoulder. Nothing
moves but the dust.
[1.5s-3.0s] She turns her head slowly toward the window. The coat's hem swings once and settles.
Camera begins an almost imperceptible push-in.
[3.0s-5.0s] She lifts her chin slightly into the light; her exhale fogs faintly. The push-in
settles into a medium shot framing her from the waist up, the coat filling the lower third.

Camera: one unbroken slow push-in on a gimbal, no cuts. Shallow depth of field, background
falling soft.
Palette: cream, bone, cold grey concrete, one warm shaft of amber light.
Audio: no dialogue, no narration. A single sustained cello note under soft room tone.

---

## TEST 2 — App advertisement (abstract UI, no literal screenshots)

In a deep charcoal void, a single glowing violet rounded rectangle floats at centre, softly
pulsing, with fine cyan light-threads trailing off into the dark behind it.

Timeline:
[0.0s-1.2s] The rectangle hovers alone, breathing with a slow glow. Thin cyan threads drift
lazily behind it.
[1.2s-2.8s] Six smaller glowing tiles rush in from the frame edges and snap into a neat orbit
around the central rectangle, each landing with a small bloom of light.
[2.8s-4.2s] The orbit tightens and locks; every tile aligns to a perfect ring. A soft pulse of
light travels outward through the threads.
[4.2s-5.0s] Camera pulls back slightly to reveal the full assembled ring glowing steadily,
suspended in the dark.

Camera: slow orbital drift left to right, ending on a gentle pull-back. One continuous move.
Palette: near-black charcoal, violet, cyan, white light bloom.
No readable text, no numbers, no UI labels — shapes and light only.
Audio: no dialogue, no narration. Clean electronic pulse, soft synth pad, one satisfying
low click as the tiles lock into place.

---

## TEST 3 — Mobile game (Play Store / App Store)

A tiny round glowing orange creature with big dark eyes stands on a floating moss-covered stone
island, drifting in a soft teal sky full of slow-moving clouds, stylised 3D like a Pixar short.

Timeline:
[0.0s-1.3s] The creature stands centre-frame, blinking once, its glow gently pulsing. Grass on
the island sways in a light breeze.
[1.3s-2.6s] It notices something off-screen right, ears perking, and hops twice toward the
island's edge, landing with a small squash-and-stretch bounce.
[2.6s-4.0s] A second, smaller blue creature pops up over the island's edge. The orange one
startles back a step, then leans in curiously.
[4.0s-5.0s] Both settle side by side looking out at the sky; camera pulls back to reveal three
more floating islands drifting in the distance behind them.

Camera: locked-off wide, then a smooth pull-back on the final beat. No cuts.
Palette: warm orange, soft teal sky, moss green, cream clouds.
Style: glossy stylised 3D animation, soft rim lighting, shallow depth of field.
Audio: no dialogue, no narration. Playful light marimba and plucked strings, soft whoosh on
each hop, a gentle chime when the second creature appears.

---

## TEST 4 — SPEECH QUALITY TEST (the only one with a voice)

Run this one to judge whether H3's speech is usable. If the voice sounds robotic, mispronounced,
or out of sync, keep every real ad music-only.

A woman in her late twenties sits in a warmly lit café by a rain-streaked window, holding a
ceramic mug in both hands, looking directly at camera with a relaxed half-smile.

Timeline:
[0.0s-1.0s] She lifts the mug, takes a small sip, and lowers it, eyes staying on camera.
[1.0s-4.0s] She speaks one clear line to camera: "This is the easiest thing I've used all year."
Her mouth movements match the words; she gives a small nod on the last word.
[4.0s-5.0s] She smiles a little wider and glances down at the mug as the rain blurs behind her.

Camera: static medium close-up, eye level, shallow focus. No movement.
Palette: warm amber interior, cool blue-grey rain outside.
Audio: ONE spoken English line, natural conversational female voice, clearly articulated and
lip-synced: "This is the easiest thing I've used all year." Soft café ambience and light rain
underneath. No music bed.

### What to check on Test 4
- Do the lips actually match the words?
- Does it sound like a person or a robot?
- Is it clearly English, no accent drift mid-sentence?
- Any garbled or invented words?

If any of those fail → stay music-only for all real client work.

---

## How to run

Each is one Stitch node in Fylmer with `model: minimax_h3`.
For a full multi-shot ad, chain them: shot 1's last frame becomes shot 2's reference image
(Fylmer does this automatically via `lastFrameUrl`).

Titles, logos and pricing must be added in post with ffmpeg — never ask H3 to render them.
