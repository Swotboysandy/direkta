# Higgsfield AI-Filmmaking Playbook
Scraped 2026-07-29 from higgsfield.ai — community projects, Academy syllabus, and the
official Seedance 2.0 short-film prompt library. Everything here is from their own
material, not inference.

---

## 1. THE CANONICAL PIPELINE (Academy: "The AI Filmmaking Pipeline", 22 lessons)
Taught by the Hell Grind team. Skills billed as: AI Direction, Character Consistency,
Pipeline Design, Asset Management, **Slop Control**, Agentic Workflows.
Tools: Cinema Studio + **Claude** + Claude Cowork.
Models: Cinematic Cameras, GPT Image 2, Nano Banana Pro, Seedance 2.0.

Order of operations:
1. Work in Claude — turn thoughts into a prompt
2. **Name your assets** (a naming system for reusable Elements)
3. Set up the project → choose your image model
4. "Proof, not promises" — verify before scaling
5. **Generate LOCATIONS FIRST**, then edit them
6. **THEN characters**, then edit them
7. **Test in Seedance** (short test before committing)
8. **"Spot the slop"** — a dedicated QA lesson
9. Capstone: set up production → cast → build location → **dress the scene** → shoot

> Their explicit teaching order is "Start with locations." We built Kasansur
> characters-first. Cat Story independently found set drift was worse than character
> drift. Two sources, same conclusion: LOCATIONS FIRST.

---

## 2. THE PROMPT ARCHITECTURE (from their flagship anime project)
```
STYLE LOCK   ← immutable — the medium
CONTINUITY   ← immutable — character design, palette, world rules, SET GEOGRAPHY
DIRECTION    ← immutable — camera language, pacing, sound cues
SHOT         ← the ONLY variable block — one unique beat per shot
```
Rules they follow inside it:
- Negative style constraints stated explicitly and repeatedly
  ("not painterly, not 3D, no photobash, no CGI smoothness")
- Camera move named per shot, **never left ambiguous**
- Dialogue anchored to a physical beat so the editor can't read it as a transition
- Sound/impact cues called out per shot to fix timing
- A wrong colour can be explicitly forbidden ("hot-pink ichor only — never red")
- Set geography listed as a continuity item (desks, chalkboard, windows, door)

---

## 3. THE SINGLE BIGGEST LESSON (Cat Story, 1,142 generations)
> "The model's own instinct to *helpfully* widen a room or add furniture it wasn't
> shown was the most consistent source of drift between clips — **more than anything
> to do with the characters themselves.**"

Therefore every prompt carries: *"Identity and environment anchors match their
reference photos exactly; no new furniture, walls, or room layout invented beyond
what a reference shows."*

Also from Cat Story:
- Every character, prop AND room locked to a real reference photo, tagged @Image1…@ImageN
- Day and night versions of a room are SEPARATE references
- ONE identifiable light source per shot; ban decorative sunbeams / unearned golden hour
- Ban mid-morph transformations — silhouette or cut around them
- No dialogue + SFX only → sidesteps lip-sync entirely (fast + cheap)

---

## 4. TIMECODED SHOT DIRECTION (official Seedance 2.0 guide)
One 15s clip is directed as timed movements, not one description:
```
(0–4s):   what happens, framed — shot size, action, expression
(4–9s):   next movement + how the camera answers
(9–13s):  the turn / escalation
(13–15s): the button — last image before the cut
```
Then a style tail: `Style: <medium>, <palette>, 2.35:1 widescreen, 24fps.`

Chaining clips (this is how their scenes feel continuous):
- `Extend @video1. Continue exactly from the white flash of the last frame.`
- Every scene ends on a designed handoff (white flash) the next scene resumes from
- Reference roles stated explicitly:
  `@image2 is the visual style reference ONLY — DO NOT use the character from @image2`
- Recurring props get a **multi-angle orthographic prop sheet** (front/side/back/top
  + exploded view) so they survive across styles

---

## 5. MODEL STACK — what they actually reach for
| Model | Used for | Seen in |
|---|---|---|
| **Seedance 2.0** | animation, image-to-video; Native 4K | Cat Story 88%, everywhere |
| **Seedream 5.0 Pro** | stills, character sheets, multi-reference style lock | Anime Production 65%, Hollowrider 58% |
| **Nano Banana Pro** | prop sheets, character edits, title cards (good text) | guide + academy |
| GPT Image 2.0 | fill-in stills | Cat Story, Hollowrider |
| Soul / Soul Cinematic / Cinematic Studio 3.0 | keyframes, hero shots | various |

Editing beats regenerating: they fix a character inside an existing keyframe with
Nano Banana Pro ("change hair to brown, replace outfit… preserve lighting,
environment, camera angle, depth of field, surrounding characters exactly").

---

## 6. REAL COSTS (why we stay on Unlimited)
| Project | Generations | Credits | ≈USD |
|---|---|---|---|
| Cat Story (4 episodes) | 1,142 | 393,028 | ~$17,000 |
| Anime Production (launch) | 440 | 42,087 | ~$1,914 |
| Hollowrider (stills series) | 12 | 1,410 | ~$65 |

Community-verified rate: 25,000 credits = $1,125 (already −40%).

---

## 7. ANIME / KIDS CONTENT — what the evidence says works
- **No dialogue, SFX only** — Cat Story's format. No lip-sync, no voice casting,
  no language barrier, travels globally. Fastest path to finished episodes.
- **Episode length 55s–1:30**, 4 episodes in ~3 weeks solo.
- **One room, two lighting states** — a tiny locked world beats a big loose one.
- **A cute non-human lead** (cat) carries story without dialogue and dodges the
  hardest consistency problem (human faces).
- Anime style lock must name the era/medium and negate the alternatives
  ("1990s cel OVA … not modern digital, not soft airbrush").
- Cap references at 2 per generation (Hollowrider) — more than 2 bleeds styles.

---

## 8. FREE MONEY
**Higgsfield Filmmaker Grant — 100,000 credits.** Finish the Academy course + claim
certificate → cut a showreel (any tools) → post it with a pitch → if selected:
100,000 credits, private crew Discord, live trainings, 2-week program with daily credits.
