# MiniMax H3 — Production Scripts
> **Historical script pack — operational rules superseded 31 August 2026.** Use [DIREKTA_CLAUDE_MASTER_HANDOFF.md](DIREKTA_CLAUDE_MASTER_HANDOFF.md) for the expanded scripts, verified status and current research. The old “ready” label below is historical, not spending authorization. Five-second H3 requests produce 124 frames (~5.167 s); the 768×1344/1344×768 canvases are approximate delivery ratios. Choose Cut/Continue explicitly, extract the actual EOF frame, composite exact text, and obtain a fresh cost estimate. The original creative text below is preserved; its prices, automatic chaining and quoted-text reliability advice must not be reused as current instructions.

**Ready to generate.**

**Ads (9:16 mobile):** Clothing · App · Game
**Trailers (16:9 full screen):** Anime · Live-action · Pixar-style

All six are 6 shots × 5s = **30 seconds each**. No dialogue anywhere — music and sound design only.

---

## Before you start — the rules these scripts already follow

1. **Never leave text to chance.** H3 renders any text it wasn't given *verbatim* as
   letter-shaped noise — that's what garbled our earlier runs. Two valid options:
   **(a)** don't mention text at all and burn titles in with ffmpeg afterwards (what these
   scripts do — safest, always sharp), or **(b)** if you want H3 to render a word, spell it
   exactly in double quotes, keep it short, large and still. Never describe vague "text appears"
   moments.
2. **One continuous take per shot.** Never ask for cuts inside a single generation — it produces
   scene-breaks and character drift.
3. **Continuity is chained, not described.** Shot 1's last frame becomes shot 2's reference image.
   Fylmer does this automatically (`lastFrameUrl` → next shot's `referenceImageUrl`).
   **Anti-drift:** you can now also pin a shot's *end* frame via `lastFrameImageUrl` — our
   checkpoint is fl2va (first/last to video+audio), so H3 interpolates between two known frames
   instead of free-running from one. Use this on the last shot of a section, pinning back to the
   anchor still, to stop the character drifting by shot 6.
4. **Anchor image first.** Generate one still, lock the character/look to it, then animate. This
   is what stops faces and clothing changing between shots.
5. **Music only** unless the speech test (Section D) passes.
6. **9:16 (768×1344)** for the ads (Sections A–C). **16:9 (1344×768)** for the trailers
   (Sections D–F).
7. **No dialogue in any of these.** H3 generates audio jointly with picture, so the audio line in
   each shot is an instruction, not a separate step. If you ever do want a voice, H3 can produce
   one — it just has to be asked for explicitly.

---

## Cost & run order

Do **one shot of Section A first** as a smoke test — it proves the new prompt-expander and the
reference chaining are working before you commit to a full run.

| Step | What | Shots | Cost |
|---|---|---|---|
| 1 | Smoke test — A1 only, check the output before continuing | 1 | $0.15 |
| 2 | Anchor stills (6, one per campaign) | 6 images | $0.60 |
| 3 | Clothing ad (9:16) | 6 | $0.90 |
| 4 | App ad (9:16) | 6 | $0.90 |
| 5 | Game ad (9:16) | 6 | $0.90 |
| 6 | Anime trailer (16:9) | 6 | $0.90 |
| 7 | Live-action trailer (16:9) | 6 | $0.90 |
| 8 | Pixar trailer (16:9) | 6 | $0.90 |
| | **Total** | 43 | **~$6.15** |

Run in that order and stop after any section that looks wrong, rather than burning the whole
budget in one pass. Top up **$10** to have comfortable headroom for retries.

Keep the pod warm across the whole run (`keepWarm: true`) — cold starts cost ~$0.15 each.
**Stop the pod when finished.**

---

# SECTION A — CLOTHING BRAND
*Premium minimal outerwear. Editorial, quiet, expensive-feeling.*

### A0 — Anchor still (generate as image first)

A female model, late twenties, sharp cheekbones, dark hair pulled back into a low tight bun,
wearing an oversized cream wool coat over a black turtleneck and wide charcoal trousers. She
stands in a wide empty concrete gallery, low winter sun raking in from a tall window on the left.
Editorial fashion photography, shallow depth of field, cold grey concrete and bone-cream palette,
one warm amber shaft of light, dust suspended in the beam. Three-quarter body framing.

> Lock this image. Every shot below uses it (A1 directly, A2–A6 via chaining).

---

### A1 — The stand
The model from the reference stands centre-frame in the empty concrete gallery, winter sun raking
from the tall window on her left, dust suspended in the beam.

Timeline:
[0.0s–1.5s] Static wide. She stands three-quarters to camera, weight on her back foot, hands in
coat pockets, coat hanging open. Light catches the wool texture along her left shoulder. Only the
dust moves.
[1.5s–3.2s] She turns her head slowly toward the window. The coat hem swings once and settles.
Camera begins an almost imperceptible push-in.
[3.2s–5.0s] She lifts her chin into the light, exhale fogging faintly. Push-in settles to a
medium shot, coat filling the lower third.

Camera: single unbroken gimbal push-in. Shallow focus, background falling soft.
HANDOFF: she is in medium shot, chin raised, face lit, about to lower her gaze.
Audio: no dialogue. One sustained cello note under soft room tone.

---

### A2 — The turn
CONTINUES FROM the previous shot — she stands in medium shot, chin still raised in the same light,
in the identical coat and pose.

Timeline:
[0.0s–1.4s] She lowers her gaze from the window back toward camera, eyes settling directly on lens.
[1.4s–3.0s] She takes one slow step forward and turns her body square to camera; the coat opens
wider, revealing the black turtleneck and the trousers' drape.
[3.0s–5.0s] She stops. Her hands come out of the pockets and fall naturally at her sides. The coat
settles around her in a slow, heavy motion.

Camera: static, eye level, medium shot. No movement.
HANDOFF: she stands square to camera, arms at her sides, coat open and settled.
Audio: no dialogue. The cello note joined by a low sustained bass drone.

---

### A3 — Fabric detail
CONTINUES FROM the previous shot — same gallery, same light, camera now close on the coat's
shoulder and lapel as she stands square and still.

Timeline:
[0.0s–2.0s] Extreme close-up travelling slowly across the cream wool weave, individual fibres
catching the amber light, the shoulder seam passing through frame.
[2.0s–3.6s] The camera continues down the open lapel edge, the fabric's thickness and the way it
holds its shape clearly visible.
[3.6s–5.0s] It reaches the black turtleneck's ribbed collar against her throat and holds.

Camera: slow continuous macro dolly, left to right and downward. Very shallow focus.
HANDOFF: framed tight on the turtleneck collar and her jawline above it.
Audio: no dialogue. Quiet cello, and a soft close-mic rustle of wool.

---

### A4 — The walk
CONTINUES FROM the previous shot — pulling back from her collar to reveal her full body again in
the same gallery.

Timeline:
[0.0s–1.5s] Camera pulls back smoothly from the close collar framing to a wide full-body shot.
[1.5s–3.5s] She begins walking directly toward camera, unhurried, the coat swinging open with each
stride, the light band crossing her as she passes through the sunbeam.
[3.5s–5.0s] She walks out of the beam into cooler shadow, still approaching, now framed from the
knees up.

Camera: pull-back into a slow backward tracking move, staying ahead of her. One continuous take.
HANDOFF: she is mid-stride in cool shadow, knees-up framing, still walking toward camera.
Audio: no dialogue. Cello swells slightly; soft, real footsteps on concrete.

---

### A5 — Stillness
CONTINUES FROM the previous shot — she is mid-stride in the cooler shadow, knees-up framing.

Timeline:
[0.0s–1.2s] She takes two final steps and stops. The coat swings forward, then settles back.
[1.2s–3.0s] She stands completely still, looking just past the camera. The gallery's depth falls
away behind her into soft grey.
[3.0s–5.0s] A slow blink. Her shoulders drop a fraction as she relaxes. Nothing else moves.

Camera: static medium-wide, eye level.
HANDOFF: she stands still and relaxed, centred, looking slightly off-lens.
Audio: no dialogue. Cello resolves to a single held note; room tone only.

---

### A6 — Close on the coat *(title card shot — text added in post)*
CONTINUES FROM the previous shot — she stands still and centred exactly as she ended.

Timeline:
[0.0s–2.0s] Camera drifts slowly to a clean centred medium shot, her figure held in the left third
of frame, empty grey concrete filling the right third.
[2.0s–4.0s] She remains still; the amber light dims slowly as if the sun is passing behind cloud.
[4.0s–5.0s] The light settles low and cool. Frame holds, composed and quiet, with clear empty
negative space on the right.

Camera: slow lateral drift, settling to static. Composition deliberately leaves the right third
empty and uncluttered.
Audio: no dialogue. Final cello note fading to silence.

> **The empty right third is where the brand name gets burned in with ffmpeg.**

---

# SECTION B — APP ADVERTISEMENT
*Abstract glowing UI. No fake screenshots, no readable labels.*

### B0 — Anchor still
A single glowing violet rounded rectangle floating at centre in a deep charcoal void, softly
pulsing, with fine cyan light-threads trailing off into the darkness behind it. Sleek tech-noir
product visualisation, high contrast, volumetric glow, near-black background, violet and cyan
palette, no text or labels anywhere.

---

### B1 — Alone
The glowing violet rounded rectangle from the reference hovers alone at centre in the charcoal
void, fine cyan threads drifting behind it.

Timeline:
[0.0s–1.5s] The rectangle breathes with a slow pulse of light. Threads drift lazily in the dark.
[1.5s–3.2s] Its pulse quickens slightly, as if waking. The threads straighten and begin to point
outward toward the frame edges.
[3.2s–5.0s] The rectangle glows brighter and holds steady, threads now taut and aimed outward.

Camera: extremely slow orbital drift, left to right.
HANDOFF: rectangle glowing bright and steady at centre, threads taut and pointing outward.
Audio: no dialogue. Low synth pad, a single soft electronic pulse.

---

### B2 — The rush
CONTINUES FROM the previous shot — the rectangle glows steady at centre with taut threads, exactly
as it ended.

Timeline:
[0.0s–1.2s] Six smaller glowing tiles rush inward from the frame edges along the threads, trailing
light.
[1.2s–3.0s] They decelerate as they approach, each one blooming softly as it slows.
[3.0s–5.0s] The six tiles settle into a loose, uneven orbit around the central rectangle, still
drifting slightly out of alignment.

Camera: continues the slow orbital drift.
HANDOFF: six tiles orbiting loosely and unevenly around the glowing centre.
Audio: no dialogue. Rising synth swell, six soft whooshes landing in sequence.

---

### B3 — The lock
CONTINUES FROM the previous shot — six tiles orbit loosely around the central rectangle in the
same uneven positions.

Timeline:
[0.0s–1.8s] The orbit tightens; the tiles pull inward and begin correcting into even spacing.
[1.8s–3.4s] Each tile snaps into perfect alignment on a clean ring, one after another, each snap
producing a small bright bloom.
[3.4s–5.0s] The completed ring holds, perfectly even, glowing in unison with the centre.

Camera: orbital drift slows to almost still as the ring locks.
HANDOFF: a perfect, evenly spaced glowing ring around the centre, all pulsing in unison.
Audio: no dialogue. Six satisfying low clicks in rhythm, resolving into a warm sustained chord.

---

### B4 — The pulse
CONTINUES FROM the previous shot — the perfect ring holds, glowing in unison.

Timeline:
[0.0s–1.5s] A bright pulse of light is born at the central rectangle.
[1.5s–3.2s] The pulse travels outward through every thread simultaneously, lighting each tile in
turn as it passes.
[3.2s–5.0s] The pulse continues past the ring into the dark, fading as it goes; the ring settles
back to its steady glow.

Camera: static, centred, no movement.
HANDOFF: the ring glowing steadily, pulse dissipating into the surrounding dark.
Audio: no dialogue. One deep resonant swell travelling outward, then settling.

---

### B5 — Multiply
CONTINUES FROM the previous shot — the ring glows steadily at centre.

Timeline:
[0.0s–1.6s] Camera begins pulling back; the ring becomes smaller in frame.
[1.6s–3.4s] Three more identical glowing rings fade into view in the dark around it, at different
depths, each pulsing on its own gentle rhythm.
[3.4s–5.0s] The camera continues back to reveal all four rings suspended in the void, connected by
faint cyan threads.

Camera: smooth continuous pull-back.
HANDOFF: four glowing rings suspended at different depths, connected by faint threads.
Audio: no dialogue. The chord widens as each new ring appears.

---

### B6 — Settle *(title card shot — text added in post)*
CONTINUES FROM the previous shot — four connected glowing rings suspended in the void.

Timeline:
[0.0s–2.0s] The rings drift slowly into a balanced composition in the lower two-thirds of frame.
[2.0s–4.0s] They settle and hold, pulsing together in slow unison, the upper third of frame left
as clean empty darkness.
[4.0s–5.0s] The glow dims slightly to a calm resting state. Frame holds.

Camera: static, composition weighted low with clean empty space above.
Audio: no dialogue. Chord resolves and fades.

> **The empty upper third is where the app name and CTA get burned in.**

---

# SECTION C — MOBILE GAME (Play Store / App Store)
*Stylised 3D, Pixar-adjacent, character-led.*

### C0 — Anchor still
A tiny round glowing orange creature with big dark friendly eyes, short stubby limbs and small
pointed ears, standing on a floating moss-covered stone island drifting in a soft teal sky full of
slow-moving cream clouds. Glossy stylised 3D animation, Pixar-like character design, soft rim
lighting, warm orange and teal palette, shallow depth of field, no text anywhere.

---

### C1 — Meet
The orange creature from the reference stands centre-frame on its floating moss island, teal sky
and cream clouds drifting behind it.

Timeline:
[0.0s–1.4s] It stands still, blinking once, its inner glow pulsing gently. Grass sways in a light
breeze.
[1.4s–3.0s] It looks around slowly, ears rotating, taking in the empty sky.
[3.0s–5.0s] Its ears perk sharply toward something off-frame right; it leans in that direction,
curious.

Camera: locked-off wide, no movement.
HANDOFF: creature leaning right, ears perked, about to move.
Audio: no dialogue. Light marimba, soft wind, a small curious chime on the ear-perk.

---

### C2 — The hop
CONTINUES FROM the previous shot — the creature leans right with ears perked, in the identical
pose and position.

Timeline:
[0.0s–1.2s] It hops twice toward the island's right edge, each landing with a soft
squash-and-stretch bounce, glow flaring on impact.
[1.2s–3.0s] It reaches the edge and skids to a stop, small stones tumbling off into the sky below.
[3.0s–5.0s] It peers down over the edge, body tilted forward, ears angled down.

Camera: slow pan right following the hops, settling as it stops.
HANDOFF: creature at the island's edge, tilted forward, peering down.
Audio: no dialogue. Two playful marimba hops, a small skid, tumbling pebbles.

---

### C3 — The friend
CONTINUES FROM the previous shot — the creature peers over the island's edge, tilted forward.

Timeline:
[0.0s–1.3s] A second, smaller blue creature pops up over the edge directly in front of it.
[1.3s–2.8s] The orange one startles backward with a comic squash, landing on its rear.
[2.8s–5.0s] It pauses, then leans in curiously. The blue creature tilts its head. They regard each
other.

Camera: static medium shot holding both creatures.
HANDOFF: both creatures facing each other, orange one sitting, blue one at the edge.
Audio: no dialogue. A surprised chime, comic low bounce, then a warm gentle motif as they meet.

---

### C4 — Play
CONTINUES FROM the previous shot — both creatures face each other in the same positions.

Timeline:
[0.0s–1.5s] The orange one gets up. Both creatures' glows brighten and sync into the same rhythm.
[1.5s–3.2s] They hop in a circle around each other, delighted, trailing small light motes.
[3.2s–5.0s] They stop side by side, both facing out toward the open sky.

Camera: slow orbit around the pair, ending square behind them.
HANDOFF: both creatures side by side, facing out at the sky.
Audio: no dialogue. Marimba and plucked strings pick up into a playful rhythm.

---

### C5 — The world
CONTINUES FROM the previous shot — both creatures stand side by side facing the open sky.

Timeline:
[0.0s–1.6s] Camera begins pulling back and rising above them.
[1.6s–3.4s] Three more floating moss islands fade into view in the distance, each with its own
faint coloured glow, drifting slowly through the clouds.
[3.4s–5.0s] The camera continues rising to reveal the full archipelago spread across the teal sky.

Camera: continuous crane up and back. One unbroken move.
HANDOFF: wide aerial of the island archipelago, the two creatures small on their island below.
Audio: no dialogue. Music opens up wide — strings and soft brass, a sense of scale.

---

### C6 — Hold *(title card shot — text added in post)*
CONTINUES FROM the previous shot — wide aerial of the archipelago in the teal sky.

Timeline:
[0.0s–2.0s] The camera settles into a stable wide composition, the islands arranged across the
lower half of frame.
[2.0s–4.0s] Clouds drift slowly through the upper half, which stays open and uncluttered.
[4.0s–5.0s] The scene holds, calm and inviting; the creatures' glows twinkle faintly below.

Camera: static wide, composition weighted low, clean sky filling the upper half.
Audio: no dialogue. Music resolves warmly and holds.

> **The clean upper half is where the game logo and store badges get burned in.**

---

# SECTION D — ANIME TRAILER
### *"THE LAST SIGNAL"* — 16:9, 6 shots
*Tone: Makoto Shinkai skies meets end-of-the-world urgency. Beautiful, then devastating.*

### D0 — Anchor still
A teenage girl with short black hair and a fraying red scarf stands on a Tokyo rooftop at dusk,
city lights beginning to wake below her, an impossible second moon hanging huge and cracked in a
violet sky. Modern anime film style, hand-painted skies, dense detailed cityscape, dramatic rim
lighting, cinematic 16:9 composition.

---

### D1 — The sky is wrong
The girl from the reference stands on the rooftop, wind pulling at her red scarf, staring up at
the cracked second moon dominating the violet dusk sky.

Timeline:
[0.0s–1.6s] Wide shot from behind her. She is small against the enormous sky. Her scarf snaps in
the wind; the city glitters far below.
[1.6s–3.4s] Slow camera arc around to her profile. Her eyes are wide, reflecting the moon's light.
A single fracture on the moon's surface glows brighter.
[3.4s–5.0s] She takes one step toward the roof edge, hand rising slightly, as if reaching.

Camera: continuous slow arc from behind to profile. Epic scale.
HANDOFF: she stands at the roof edge in profile, hand half-raised toward the sky.
Audio: no dialogue. A lone piano note under rising wind; a deep sub-bass hum from the moon.

---

### D2 — The city below
CONTINUES FROM the previous shot — she stands at the roof edge, hand half-raised, in the identical
pose.

Timeline:
[0.0s–1.4s] Camera drops away from her, plunging down the side of the building toward the street.
[1.4s–3.2s] It races through the city canyon past neon signs and train lines, everything glowing
in the strange violet light.
[3.2s–5.0s] It levels out at street level in a crowded intersection where every person has stopped
walking and is looking up at the sky.

Camera: one continuous vertical dive into a horizontal rush. No cuts.
HANDOFF: street-level crowd frozen mid-step, all faces turned upward.
Audio: no dialogue. Piano accelerates; the crowd's ambient noise drops suddenly to silence.

---

### D3 — Everything stops
CONTINUES FROM the previous shot — the crowded intersection, everyone frozen and looking up.

Timeline:
[0.0s–1.8s] Slow push through the motionless crowd. A dropped phone hangs in mid-air. Rain begins
falling upward.
[1.8s–3.4s] The light drains from the scene, colour bleeding to near-monochrome except the girl's
red scarf, now visible far above on the rooftop.
[3.4s–5.0s] Every light in the city goes out at once, from the horizon inward, leaving only the
cracked moon.

Camera: slow steady push forward through the frozen crowd.
HANDOFF: the city in near-total darkness, only the moon and a single red scarf visible.
Audio: no dialogue. Total silence except one held violin note and a single heartbeat.

---

### D4 — She runs
CONTINUES FROM the previous shot — the darkened city under the cracked moon.

Timeline:
[0.0s–1.2s] Snap back to the rooftop. She is already running, scarf streaming behind her.
[1.2s–3.0s] Camera tracks alongside at speed as she leaps a gap between buildings, the dead city
rushing past below.
[3.0s–5.0s] She lands hard, rolls, comes up running without breaking stride, jaw set.

Camera: fast lateral tracking shot, kinetic, staying level with her.
HANDOFF: she is sprinting flat-out across a rooftop toward a distant tower.
Audio: no dialogue. Full percussion enters — driving taiko drums and strings.

---

### D5 — The tower
CONTINUES FROM the previous shot — she sprints across the rooftop toward the distant tower.

Timeline:
[0.0s–1.6s] Camera cranes up and ahead of her, revealing the enormous broadcast tower she is
running toward, its antenna pulsing with the same light as the moon's fracture.
[1.6s–3.4s] She reaches the tower's base and begins to climb, hand over hand up the exterior
ladder, wind tearing at her.
[3.4s–5.0s] Camera rises with her, the whole dead city spreading out below, the moon filling the
sky above.

Camera: continuous crane up, following her ascent. Enormous sense of scale.
HANDOFF: she is high on the tower, city far below, moon enormous above.
Audio: no dialogue. Music builds toward a peak; wind roars.

---

### D6 — Reach *(title card shot)*
CONTINUES FROM the previous shot — she clings high on the tower, city below, moon above.

Timeline:
[0.0s–1.8s] She reaches the top platform and stands, small and alone against the vast sky.
[1.8s–3.4s] She raises one hand toward the cracked moon. The fracture responds — light spilling
down toward her in a single beam.
[3.4s–5.0s] The beam reaches her. Everything floods to white, then falls to black, leaving clean
empty frame.

Camera: slow pull-back to an extreme wide, her figure tiny at centre.
Audio: no dialogue. Music cuts out sharply at the white flash. Silence, then one low boom.

> **The black frame at the end is the title card. Burn the film name in there.**

---

# SECTION E — LIVE-ACTION TRAILER
### *"DEEP FIELD"* — 16:9, 6 shots
*Tone: Villeneuve. Vast, quiet, weighty. Scale over spectacle.*

### E0 — Anchor still
A lone astronaut in a weathered white exosuit with an amber-tinted visor stands on a windswept
grey dust plain, facing an enormous black monolithic structure half-buried in the ground. Overcast
alien sky, volumetric dust, muted desaturated palette, extreme sense of scale, photorealistic
cinematic film still, anamorphic 16:9.

---

### E1 — Arrival
The astronaut from the reference stands alone on the vast grey dust plain, the enormous black
structure looming ahead through drifting dust.

Timeline:
[0.0s–2.0s] Extreme wide. The figure is almost lost in the frame, dwarfed by the structure. Dust
moves in slow sheets across the ground.
[2.0s–3.6s] Slow push in. The scale becomes clear — the structure is hundreds of metres tall.
[3.6s–5.0s] The astronaut takes a single step forward. Dust swirls around their boots.

Camera: very slow, steady push-in on a long lens. Anamorphic, wide.
HANDOFF: astronaut mid-step, facing the structure, dust swirling at their feet.
Audio: no dialogue. Deep sub-bass drone, wind, one distant metallic groan.

---

### E2 — The surface
CONTINUES FROM the previous shot — the astronaut steps toward the structure in the same dust.

Timeline:
[0.0s–1.6s] Camera moves ahead of them and turns to face the structure's surface up close.
[1.6s–3.2s] The black surface is revealed as impossibly smooth, reflecting the overcast sky and
the small distorted figure of the approaching astronaut.
[3.2s–5.0s] Their gloved hand enters frame and stops just short of touching it. It hovers.

Camera: continuous move from wide to extreme close, ending static on the hand.
HANDOFF: gloved hand hovering millimetres from the black reflective surface.
Audio: no dialogue. Drone deepens; a high, almost inaudible tone appears.

---

### E3 — Contact
CONTINUES FROM the previous shot — the gloved hand hovers at the surface.

Timeline:
[0.0s–1.4s] The hand closes the gap and touches. Contact.
[1.4s–3.0s] A ring of pale light spreads outward from the point of contact across the black
surface, silent and fast.
[3.0s–5.0s] Camera whips back to a wide shot as the light races up the entire structure and out
across the ground beneath the astronaut.

Camera: static close, then a fast pull-back to extreme wide.
HANDOFF: the structure fully lit with spreading pale light, astronaut small before it.
Audio: no dialogue. The drone stops dead on contact. Then one enormous low impact.

---

### E4 — It opens
CONTINUES FROM the previous shot — the structure glows with spreading light, astronaut before it.

Timeline:
[0.0s–1.8s] A seam appears down the structure's face. It begins to separate, grinding open.
[1.8s–3.4s] Light floods out from within — warm, golden, in total contrast to the grey world.
[3.4s–5.0s] The astronaut is silhouetted against the opening, unmoving, as golden light washes
over the dust plain behind them.

Camera: slow push in from behind the astronaut, framing them against the opening.
HANDOFF: astronaut silhouetted against a tall opening flooding with golden light.
Audio: no dialogue. Grinding stone; then a rising, almost choral tone.

---

### E5 — Inside
CONTINUES FROM the previous shot — the astronaut stands silhouetted in the golden opening.

Timeline:
[0.0s–1.6s] They step through. Camera follows into the light.
[1.6s–3.4s] The interior resolves: an impossible vertical space, endless, filled with slowly
rotating geometric forms suspended in golden haze.
[3.4s–5.0s] Camera cranes upward, revealing the space continues far beyond sight, the astronaut a
speck on the floor below.

Camera: continuous follow-through into a dramatic crane up.
HANDOFF: extreme wide of the vast golden interior, astronaut tiny below.
Audio: no dialogue. Full orchestral swell, deep and reverberant.

---

### E6 — Look up *(title card shot)*
CONTINUES FROM the previous shot — the vast golden interior, astronaut small on the floor.

Timeline:
[0.0s–2.0s] Camera descends slowly back toward the astronaut, who stands motionless, head tilted
back.
[2.0s–3.6s] Reverse to their visor: the golden geometry reflected across the amber glass, their
eyes just visible behind it, wide.
[3.6s–5.0s] The light dims rapidly. The frame falls to near-black, holding on the faint reflection
in the visor.

Camera: slow descent, then settling to a static close-up on the visor.
Audio: no dialogue. Orchestra cuts to a single sustained note, then silence.

> **Near-black final frame — title burns in over the visor reflection.**

---

# SECTION F — PIXAR-STYLE TRAILER
### *"THE LAST LAMPLIGHTER"* — 16:9, 6 shots
*Tone: Up's opening. Warm, wordless, emotional. Small character, big heart.*

### F0 — Anchor still
A small elderly man with a round face, white moustache, tiny round spectacles and a patched blue
coat, carrying a long brass lamplighting pole over one shoulder, standing on a cobbled street in a
storybook European town at dusk. Glossy stylised 3D animation, Pixar character design, warm amber
streetlamps against deep blue evening, soft rim lighting, cinematic 16:9.

---

### F1 — His round
The little lamplighter from the reference walks along the cobbled street at dusk, brass pole over
his shoulder, warm lamps glowing ahead of him.

Timeline:
[0.0s–1.6s] Tracking shot alongside him. His short legs work briskly; he hums to himself, breath
visible in the cold.
[1.6s–3.2s] He stops at a lamppost, reaches up with the pole — he has to stand on his toes — and
lights it. It blooms warm gold.
[3.2s–5.0s] He nods once, satisfied, and walks on. The lit lamp glows behind him.

Camera: smooth lateral tracking, settling for the lighting, then resuming.
HANDOFF: he walks on down the street, one lamp glowing behind him.
Audio: no dialogue. Gentle accordion and pizzicato strings; soft footsteps on cobbles.

---

### F2 — The last one
CONTINUES FROM the previous shot — he walks on down the cobbled street.

Timeline:
[0.0s–1.4s] He arrives at the final lamppost at the end of the street, on a small bridge over a
canal.
[1.4s–3.0s] He raises the pole and lights it. This lamp glows brighter and warmer than the others.
[3.0s–5.0s] He lowers the pole, leans on the bridge rail beside it, and looks out over the water
where all his lamps are reflected in a long golden line.

Camera: static wide on the bridge, warm and composed.
HANDOFF: he leans on the rail beside the last lamp, looking at the reflections.
Audio: no dialogue. The melody opens up warmly; water laps softly.

---

### F3 — Morning takes them
CONTINUES FROM the previous shot — he leans on the bridge rail beside the glowing lamp.

Timeline:
[0.0s–1.6s] Time lapses. The sky lightens to pale dawn behind him; he does not move.
[1.6s–3.2s] One by one, far down the street, the lamps go out on their own as morning arrives.
[3.2s–5.0s] The last lamp beside him flickers and dies. He straightens up slowly, looking at it.

Camera: static, holding the same composition as the world changes around him.
HANDOFF: he stands upright beside the extinguished lamp in cold morning light.
Audio: no dialogue. The melody thins to a single music-box line.

---

### F4 — Something new
CONTINUES FROM the previous shot — he stands beside the dead lamp in morning light.

Timeline:
[0.0s–1.4s] A harsh white electric light flickers on somewhere behind him. He turns.
[1.4s–3.0s] Camera reveals a row of tall modern electric lamps being installed down the far side
of the canal, cold and bright and identical.
[3.0s–5.0s] He looks down at the brass pole in his hands. His shoulders drop.

Camera: slow turn to follow his eyeline, then a push in to a close shot on him.
HANDOFF: close on him, looking down at his pole, shoulders low.
Audio: no dialogue. Music darkens; an electric hum intrudes over the melody.

---

### F5 — A small hand
CONTINUES FROM the previous shot — he looks down at his pole, shoulders low.

Timeline:
[0.0s–1.4s] A small hand enters frame and takes hold of the pole beside his.
[1.4s–3.0s] Camera pulls back to reveal a little girl, six or seven, in a red knitted hat, looking
up at him hopefully.
[3.0s–5.0s] He looks at her. A slow smile spreads under the white moustache. He crouches to her
height.

Camera: static close, then a gentle pull-back to a two-shot.
HANDOFF: the two of them crouched together, both holding the pole.
Audio: no dialogue. The music-box melody returns, joined by warm strings.

---

### F6 — Together *(title card shot)*
CONTINUES FROM the previous shot — the two crouched together holding the pole.

Timeline:
[0.0s–1.8s] He stands and lifts her up so she can reach. Together they raise the pole to the dead
lamp.
[1.8s–3.4s] The lamp catches and blooms gold — warmer and brighter than any before it — pushing
back the cold electric light.
[3.4s–5.0s] Camera pulls back wide as, one by one down the whole street, every old lamp relights
by itself. The upper third of frame is left as open dawn sky.

Camera: continuous pull-back to a wide storybook composition, clean sky above.
Audio: no dialogue. Full warm orchestral resolution — the main theme, complete.

> **Open sky in the upper third — title burns in there.**

---

# POST-PRODUCTION — burning in text

Never ask H3 for titles. Add them after, where they will be perfectly sharp:

```bash
ffmpeg -i shot06.mp4 -vf "drawtext=fontfile=/path/to/font.ttf:\
text='YOUR BRAND':fontcolor=white:fontsize=64:\
x=(w-text_w)/2:y=h*0.15:alpha='min(1,max(0,(t-1)*2))'" \
-c:a copy titled.mp4
```

Every final shot was deliberately composed with empty space for this:

| Section | Where the text goes |
|---|---|
| Clothing (A6) | right third |
| App (B6) | upper third |
| Game (C6) | upper half |
| Anime (D6) | full black frame at the end |
| Live-action (E6) | near-black frame over the visor |
| Pixar (F6) | open dawn sky, upper third |

### Assembling a finished ad
```bash
printf "file 'shot01.mp4'\nfile 'shot02.mp4'\n..." > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy final.mp4
```
Six shots × 5s = **30 second ad**.
