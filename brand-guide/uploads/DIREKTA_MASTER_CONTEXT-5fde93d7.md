# DIREKTA — Master Context Document
### direkta.ai

---

## The Name

**Direkta** — from *Direkto*, the Spanish and Filipino word for Director. Rooted in the act of directing. Global in pronunciation — works in English, Spanish, Italian, French, Hindi, Tagalog. Clean to say, clean to spell, clean to own.

The tagline direction: **"You direct. AI delivers."**

---

## What Is Direkta?

Direkta is an AI-powered film production platform built for directors and indie creators. It lives entirely in the browser — no downloads, no plugins — and lets a single person do the work of an entire pre-production crew using AI.

It is not a generic AI tool. It is a filmmaker's platform, built with filmmaker vocabulary. You don't "generate images" — you direct a Cinematographer. You don't "write prompts" — you write a script and the Screenplay Agent breaks it down. Every piece of the product speaks the language of film.

---

## The Core Philosophy

**You are the Director. The AI is your crew.**

Direkta gives every user a full production crew of AI agents — each one specialising in a craft. The user directs. The crew executes. Nothing gets saved or committed without the user's approval. This is called the **Propose-Don't-Commit** principle — every agent shows you options, you pick winners, then it moves forward.

**BYOK — Bring Your Own Keys.**
Direkta connects to third-party AI APIs using the user's own API keys. This means Direkta itself has near-zero running costs, and users only pay for what they actually generate. It's like owning a studio — you pay for the equipment you use, not a subscription to someone else's studio.

---

## Who It's For

- **Indie directors and filmmakers** who want to move faster in pre-production
- **Content creators** making high-quality Reels, Shorts, music videos, and branded content
- **Ad agencies and production companies** running multiple projects simultaneously
- **Film students and emerging directors** who can't afford a full crew

The tone is professional but accessible. Direkta respects filmmaking as a craft. It doesn't dumb it down or gamify it — it elevates the creator's capability.

---

## What Direkta Does — The Five Workspaces

Direkta is built as five separate workspaces that share one underlying database. Each workspace is purpose-built for one phase of production.

---

### 1. SCREENPLAY
*Where the story lives.*

The user writes or pastes their script. The Screenplay Agent reads the entire script, then automatically breaks it down into:

- **Beats** — the key dramatic moments, scene by scene
- **The Bible** — character profiles, location descriptions, tone, themes, world rules
- **Scene categorisation** — INT/EXT, day/night, cast present, props needed, emotional register

If anything in the script is unclear or contradictory, the agent asks the user before proceeding — it never assumes. Once confirmed, the Bible and Beat breakdown become the shared source of truth that feeds every other workspace.

The Screenplay workspace looks like a writer's room — the script on one side, the living breakdown on the other, updating in real time as the agent works.

---

### 2. CASTING
*Where characters and locations get their visual identity.*

Before a single image is generated, the user defines the visual DNA of every character and every key location:

- Uploading reference photos (face references for characters, mood boards for locations)
- Writing a casting brief (age, ethnicity, physicality, wardrobe direction, personality)
- Training a **Soul ID** — a visual fingerprint for that character/location that stays consistent across every image and video generated in the project

This solves the number one problem with AI film content: character inconsistency. In Direkta, your lead actor looks the same in every single frame, because every frame is generated using their Soul ID.

---

### 3. STORYBOARD
*Where the script becomes images.*

The Cinematographer Agent takes each beat from the Screenplay breakdown and generates 4–6 visual variants for it — different angles, compositions, lighting moods. These are shown in a grid where rows are beats and columns are variants.

The user picks the winner for each beat. Rejected options disappear. Selected frames build up into the visual storyboard for the entire film.

The interface feels like a film production board — not a gallery, not a grid of thumbnails. Each row is a beat, labelled with its scene number, location, and characters present.

---

### 4. STITCH
*Where images become a film.*

The Stitch workspace is a node-based canvas — like a visual flowchart where each node is a storyboard frame, and the connections between nodes are video clips. The user arranges their selected frames in narrative order, then the system generates video transitions between each pair of frames.

The result is an **animatic** — a moving version of the storyboard, with rough video motion between key frames. This is the deliverable for Phase 1 of any production. In Phase 2, each clip can be upgraded to full-quality AI video.

The Stitch canvas is cinematic in feel — dark, wide, like an editing suite. Nodes have thumbnail previews. Connections pulse with the direction of narrative flow.

---

### 5. EXPORT
*Where the project leaves the platform.*

The user exports their animatic, storyboard PDF, shot list, or Bible document. Export options are tailored to the use case — a pitch deck for investors, a production brief for a crew, a deliverable for a client.

---

## The Agent Crew

Direkta runs nine specialised AI agents. Each one has a defined role, a defined scope, and one rule: they never act outside their lane.

| Agent | Role | What It Does |
|---|---|---|
| **Script Reader** | Reads and categorises the full script | Scene types, cast lists, location inventory, emotional register |
| **Beat Writer** | Breaks script into dramatic beats | Numbered beats with context for every scene |
| **Bible Builder** | Builds the production bible | Character profiles, world rules, tone document |
| **Casting Director** | Manages visual identity | Trains Soul IDs, maintains character consistency |
| **Cinematographer** | Generates storyboard images | 4–6 variants per beat, using Soul IDs and scene context |
| **Continuity Checker** | Flags inconsistencies | Catches costume/location/character contradictions between frames |
| **Editor** | Manages Stitch canvas order | Suggests narrative flow, flags pacing issues |
| **Video Director** | Generates video transitions | Clip-by-clip video generation |
| **Export Agent** | Formats deliverables | Animatic assembly, PDF export, shot list generation |

---

## The Propose-Don't-Commit Pattern

Every agent follows this rule:

1. **Analyse** — read all available context
2. **Propose** — show the user what it intends to do, in plain language
3. **Ask** — if anything is ambiguous, ask one clear question before proceeding
4. **Generate** — produce options, not decisions
5. **Wait** — hold until the user picks a winner
6. **Commit** — only save after user confirmation

This makes Direkta feel like working with a thoughtful crew, not a vending machine.

---

## The Technical Stack

- **Frontend:** Next.js 15
- **Database:** Supabase
- **Background Jobs:** Trigger.dev
- **Image Generation:** Fal.ai with Flux Pro
- **Video Generation:** Higgsfield Cloud API
- **Video Assembly:** FFmpeg
- **Deployment:** Vercel

---

## The Emotional Feel of the Product

Direkta should feel like:
- Walking into a high-end post-production studio — professional, purposeful, calm
- Having a crew that respects your vision — nothing happens without your direction
- Tools built for filmmakers, not adapted from generic software

It should NOT feel like:
- A chatbot
- A creative writing app with video features
- A social media content tool
- Anything built for casual consumers

---

## Visual and Aesthetic Direction

**The name Direkta** carries authority. The brand should match — confident, direct, no decoration for decoration's sake. Every visual choice should feel like it was made by a director who knows exactly what they want.

**Tonally:** Dark, cinematic, precise. The visual language of independent cinema — raw ambition, refined taste. Not playful. Not corporate. Not startup-cute.

**Colour instincts:** Deep darks as the base — near-black, ink, film negative. One commanding accent colour. Candidates: exposed-film amber, projector white, anamorphic lens flare blue, film-leader red. Not neon. Not gradients for their own sake.

**Typography instincts:** The word DIREKTA in all-caps already looks like a film title card. The brand should lean into that. A display face with the authority of a title sequence, paired with a precise UI font for the interface.

**Logo instincts:** The D as a lens aperture. The K as a clapperboard hinge. Or pure typographic confidence — DIREKTA in the right typeface needs nothing else. Explore both directions.

**Motion instincts:** Shutter-speed transitions. Frame cuts. Nothing floats or morphs — everything cuts, snaps, or pulls into focus.

**The wordmark** should work equally well on a dark cinema screen and a white pitch deck page.

---

## Key Differentiators

1. **Character consistency across every frame** — Soul ID system solves the number one AI video problem
2. **Built in filmmaking language** — directors feel at home immediately
3. **Propose-Don't-Commit** — the user is always in control, never surprised
4. **BYOK economics** — zero variable cost for the platform, transparent costs for the user
5. **Workspace architecture** — each workspace is purpose-built, not a tab in a dashboard
6. **Full pipeline in one place** — script to storyboard to animatic to export, no tool-switching

---

## What Direkta Is NOT

- Not a social media scheduler or content calendar
- Not a text-to-video tool — it is a full production workflow
- Not a subscription SaaS with usage limits — BYOK model
- Not built for non-filmmakers — it uses real production vocabulary
- Not a mobile app — browser-first, designed for wide screens
