# Anime Production — Launch video (Higgsfield Launch)  ★★★ THE PROMPT ARCHITECTURE
63,557 views · 440 generations · **42,087 credits (~$1,914)** · 6.7 GB

## Stack
**Seedream 5.0 Pro 64.8%** · Seedance 2.0 27.0% · Higgsfield Soul V2 5.0% · Soul Cinematic 3.2%

## What it is
Claude (via Higgsfield MCP) drives Seedream 5.0 Pro: generate a consistent anime
character sheet from one prompt, write a story, turn it into manga/anime panels.
Cozy slice-of-life escalating into horror-action. Proves one character sheet holds
across wildly different genres and tones.

## PROMPT ARCHITECTURE  ← adopt this wholesale
```
STYLE LOCK   ← immutable — the medium (cel-shaded 2D anime/manga)
CONTINUITY   ← immutable — character design, palette, world rules
DIRECTION    ← immutable — camera language, pacing, sound cues
SHOT         ← the ONLY variable block — one unique beat per shot
```

## Their actual template (verbatim)
STYLE_LOCK = """STYLE LOCK
Modern cel-shaded 2D anime, studio-quality linework, clean flat color fills with
two-to-three value cel shading. Cool grey-teal classroom palette for calm beats,
shifting to saturated hot-pink ichor and deep crimson for horror beats. Not
painterly, not 3D, no photobash, no CGI smoothness — traditional anime cel look
throughout."""

CONTINUITY = """CONTINUITY
Blue-haired girl (scythe) and black-haired boy (hammer) must stay visually
identical across every shot — same hair color, uniform, weapon, and proportions
established in the character sheet. Monster stays horned, white-boned, single
central eye, hot-pink ichor only — never red. Classroom geography (desks,
chalkboard, windows, door) stays fixed across cuts."""

DIRECTION = """DIRECTION
Camera moves are explicit per shot: static, tilt, whip-pan, dutch angle, tracking,
or slow-mo — never left ambiguous. Dialogue is anchored to a clear physical beat
(e.g. back-to-back stance) so it isn't cut as a transition. Sound/impact cues
(cracking, roar, splintering) called out per shot to reinforce timing."""

SHOT = """SHOT
[the one variable per image — e.g. "Shot 13: slow-mo descent, scythe driving
through shoulder and eye, hot-pink ichor bursting upward"]"""

## Notes
- Negative style constraints are explicit and repeated ("not painterly, not 3D,
  no photobash, no CGI smoothness")
- Set geography is named as a continuity item, not left implicit
- Colour is pinned per emotional beat (grey-teal calm → hot-pink/crimson horror)
- A specific colour is FORBIDDEN to prevent drift ("hot-pink ichor only — never red")
