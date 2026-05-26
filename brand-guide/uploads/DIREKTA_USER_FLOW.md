# DIREKTA — User Flow & Interaction Design Document
### direkta.ai | For Interactive UI Mockup Generation

---

## HOW TO READ THIS DOCUMENT

Every screen in Direkta has three layers:
- **States** — what the screen looks like at each moment (empty, loading, active, complete, error)
- **User actions** — what the user can click, type, drag, select, or confirm
- **Agent actions** — what the AI crew is doing in the background and how it communicates

Every agent interaction follows the Propose-Don't-Commit pattern:
1. Agent analyses
2. Agent proposes in plain language
3. Agent asks if anything is unclear
4. Agent generates options
5. User picks
6. Agent commits

Nothing is ever saved without user confirmation. Nothing ever surprises the user.

---

## GLOBAL NAVIGATION & LAYOUT

### Persistent Top Navigation Bar
Always visible across all screens. Contains:
- **Direkta logo** — top left. Clicking returns to Dashboard
- **Project name** — centre left. Clicking opens project switcher dropdown
- **Agent status row** — centre. A row of 9 small dots, one per agent. Each dot has three states:
  - Grey = idle
  - Amber pulsing = working
  - Green = complete
  - Red = needs attention
- **Key Vault icon** — top right. Opens a slide-in panel showing connected API keys (Fal.ai, Higgsfield, etc.) and their status. Green = connected. Red = missing or expired.
- **User avatar** — far right. Opens account dropdown.

### Persistent Left Sidebar
Always visible. Contains:
- **Project list** — scrollable list of all user projects. Each project shows: title, last edited date, a tiny progress bar showing how many of the 5 workspaces are complete
- **Active project** — highlighted with accent colour left border
- **+ New Project button** — always at the top of the sidebar. Opens the new project modal.
- **Workspace navigation** — below the project list, when a project is active, shows 5 workspace items: Screenplay, Casting, Storyboard, Stitch, Export. Each has an icon, a label, and a completion indicator (empty circle = not started, half circle = in progress, filled circle = complete)

### Workspace Progression Logic
Workspaces unlock sequentially but can be revisited freely:
- Screenplay — always unlocked
- Casting — unlocks after script is submitted
- Storyboard — unlocks after at least one Soul ID is trained
- Stitch — unlocks after at least one storyboard frame is selected
- Export — unlocks after at least one Stitch node exists

Locked workspaces show a lock icon and a tooltip explaining what needs to happen first.

---

## FLOW 1 — FIRST TIME USER / ONBOARDING

### Screen: Landing / Empty Dashboard

**What the user sees:**
- Top nav is present but project name shows "No project selected"
- Left sidebar shows empty project list with only the + New Project button
- Main area shows a large empty state:
  - Direkta logo centred
  - Headline: "Your crew is ready. Where's the script?"
  - Subtext: "Start a new project to bring your AI production crew online."
  - Single large CTA button: "Start Your First Project"
  - Below the button, three small icons with labels showing the workflow: Script → Frames → Film

**User action:** Clicks "Start Your First Project" or "+ New Project"

---

### Modal: New Project Setup

A centred modal overlays the screen. Dark background with subtle film-frame border detail.

**Step 1 of 2 — Project Details**
Fields:
- Project Title (text input, required) — placeholder: "Untitled Project"
- Logline (text area, optional) — placeholder: "One sentence. What's the story?"
- Format selector (pill buttons): Short Film / Music Video / Ad / Series / Feature / Other
- Estimated length selector (pill buttons): Under 5 min / 5–15 min / 15–30 min / 30+ min

CTA: "Continue" button — disabled until Project Title is filled

**Step 2 of 2 — API Keys**
Header: "Connect your crew's tools"
Subtext: "Direkta uses your own API keys. You pay only for what you generate. Your keys are stored encrypted and never shared."

Key input rows (each has a label, an input field, a paste button, a test connection button):
- Fal.ai API Key — for image generation
- Higgsfield API Key — for video generation

Each key shows one of three states after testing:
- Testing... (spinner)
- Connected ✓ (green)
- Invalid key ✗ (red with retry option)

Note below inputs: "You can skip this step and add keys later from the Key Vault. You won't be able to generate images or video until keys are connected."

Two CTAs: "Skip for now" (secondary) and "Create Project" (primary)

**After Create Project:**
- Modal closes
- Project appears in left sidebar as active
- User lands on the Dashboard for that project
- A brief agent greeting appears as a toast notification: "Your crew is assembled. Start with your script."

---

## FLOW 2 — DASHBOARD

### Screen: Project Dashboard

**Layout:**
- Left sidebar: project list + workspace nav
- Main area: three zones

**Zone 1 — Project Header**
- Project title (large, editable on click)
- Logline (smaller, editable on click)
- Format and length tags
- Edit project settings icon

**Zone 2 — Production Pipeline**
A horizontal progress tracker showing all 5 workspaces as connected stages:

[SCREENPLAY] → [CASTING] → [STORYBOARD] → [STITCH] → [EXPORT]

Each stage shows:
- Icon
- Label
- Status: Not Started / In Progress / Complete
- If complete: a small count (e.g. "47 beats" or "6 Soul IDs" or "23 frames selected")
- Clicking any stage navigates to that workspace

**Zone 3 — Quick Access Cards**
Five cards in a row, one per workspace. Each card shows:
- Workspace icon and name
- Current status
- Last activity timestamp
- Primary action button:
  - Screenplay: "Write Script" (if empty) or "Review Breakdown" (if done)
  - Casting: "Add Characters" or "Manage Soul IDs"
  - Storyboard: "Generate Frames" or "Review Board"
  - Stitch: "Build Animatic" or "Review Canvas"
  - Export: "Export Project"
- If locked: card is dimmed, lock icon, tooltip on hover

**Zone 4 — Activity Feed**
A scrollable log of recent agent activity:
- "Script Reader completed analysis — 47 scenes, 12 characters, 8 locations" — timestamp
- "Bible Builder created production bible — 3,200 words" — timestamp
- "Cinematographer generated frames for Beat 4 — 4 variants ready for review" — timestamp
- Each item has an icon matching the agent that produced it

---

## FLOW 3 — SCREENPLAY WORKSPACE

### Screen 3A: Screenplay — Empty State

**What the user sees:**
- Split layout: left panel (60% width) is the script area, right panel (40% width) is the breakdown area
- Left panel shows empty state: large text input area with placeholder "Paste your script here, or start writing." and two buttons below: "Paste Script" and "Write from Scratch"
- Right panel shows locked state: "Beat breakdown will appear here once your script is submitted." with a greyed out example of what it will look like

---

### Screen 3B: Screenplay — Script Entry

**User pastes or types script.**

As they type/paste:
- Character counter appears bottom right of script area
- Format auto-detected (if it looks like Final Draft / Fountain format, a small banner appears: "Screenplay format detected. Your scene headings and action lines will be preserved.")
- A "Submit Script" button appears at the top right of the left panel, disabled until more than 100 words are present

**User action:** Clicks "Submit Script"

---

### Screen 3C: Screenplay — Agent Analysis in Progress

**Left panel:** Script is now locked (read-only). A subtle overlay with very low opacity and a small "Analysing..." label at the top. The script text is still fully visible and readable.

**Right panel:** Shows the Script Reader agent working. Three animated phases, each appearing sequentially:

Phase 1 — Reading
- Agent card appears: "Script Reader"
- Status: "Reading your script..."
- Animated progress line

Phase 2 — Categorising
- Progress updates: "Found 47 scenes, 12 speaking characters, 8 distinct locations"
- Small list building in real time showing scene headings as they are processed

Phase 3 — Proposing
- Agent switches to a proposal card:
  - Header: "Script Reader — Analysis Complete"
  - Summary stats: 47 scenes / 12 characters / 8 locations / Estimated screen time: 22 minutes
  - Format confirmed: Screenplay
  - Tone detected: Thriller / Drama
  - "I'm ready to build your beat breakdown and production bible. Shall I proceed?"
  - Two buttons: "Yes, build the breakdown" (primary) and "Let me review first" (secondary)

**If user clicks "Let me review first":**
- Script unlocks for editing
- A diff view appears if they make changes
- Resubmit button appears

**If user clicks "Yes, build the breakdown":**
- Beat Writer and Bible Builder agents activate simultaneously

---

### Screen 3D: Screenplay — Breakdown Building

**Left panel:** Script remains visible. Scene headings are now highlighted with subtle accent colour as they are processed. The highlight moves down the script in real time.

**Right panel:** Beat breakdown builds in real time. Each beat appears as a card as it is generated:

**Beat Card anatomy:**
- Beat number (e.g. "Beat 01")
- Scene heading (e.g. "INT. WAREHOUSE — NIGHT")
- Beat title (agent-generated summary: "Marcus discovers the body")
- Character tags (coloured pills: MARCUS, DETECTIVE REYES)
- Location tag (WAREHOUSE — INT — NIGHT)
- Emotional register tag (TENSION, DISCOVERY)
- Props noted (if any)
- A small expand arrow

**As beats generate:** They appear one by one with a subtle fade-in. A progress indicator at the top of the right panel shows "Building breakdown... 12 of 47 beats complete"

---

### Screen 3E: Screenplay — Agent Clarification

At any point during breakdown building, the agent may pause and surface a clarification card. This appears at the top of the right panel, above the beats being generated. Generation pauses until resolved.

**Clarification card anatomy:**
- Agent name: "Beat Writer"
- Flag icon
- The question in plain language:
  "Beat 12: Marcus refers to 'what happened in Lisbon' — this event is not defined anywhere in the script. How should I treat it?"
- Three option buttons:
  - "Add as backstory in the Bible" — agent will note it as implied backstory
  - "Flag as a plot gap" — agent will mark it for the writer's attention
  - "It's intentionally vague" — agent will treat it as a deliberate mystery element
- A text field below: "Or tell me more..." for the user to type a custom instruction

After the user responds, the card collapses, and generation resumes. A small resolved tag appears on the relevant beat card.

Multiple clarification cards can queue. They appear one at a time.

---

### Screen 3F: Screenplay — Complete State

**Left panel:** Full script, now with scene-by-scene highlighting. Each scene has a small beat number badge in the margin. Clicking a scene heading in the script scrolls the right panel to the corresponding beat.

**Right panel:** Full beat breakdown. 

**Top of right panel — Bible summary card:**
- "Production Bible — Built"
- Character count, location count, word count
- "View Full Bible" button — opens a slide-over panel with the complete bible content

**Beat cards — full state:**
Each beat is a card with:
- Beat number and scene heading
- Agent-generated beat title
- Character tags
- Location tag
- Emotional register
- Props
- Notes (if clarifications were resolved here)
- A small camera icon — "This beat will generate storyboard frames in the Storyboard workspace"

**Bottom action bar:**
- "Script breakdown complete — 47 beats ready"
- "Continue to Casting →" button
- "Edit Script" button (secondary) — unlocks script for edits, triggers re-analysis of changed sections only

---

## FLOW 4 — CASTING WORKSPACE

### Screen 4A: Casting — Empty State

Grid layout. Header shows "Casting — Define your characters before generating a single frame."

Subtext: "Every character and location needs a Soul ID — a visual fingerprint that keeps them consistent across every image Direkta generates."

Two placeholder cards:
- "Add a Character +" card
- "Add a Location +" card

A small info banner: "Direkta found 12 characters and 8 locations in your script. Would you like to import them?" with an "Import from Script" button.

---

### Screen 4B: Casting — Import from Script

**User clicks "Import from Script"**

A modal appears showing two columns:

Left column — Characters (12 found):
Each character listed with:
- Name
- Number of scenes they appear in
- Speaking role indicator
- Checkbox (all pre-checked)

Right column — Locations (8 found):
Each location listed with:
- Name
- INT or EXT tag
- Number of scenes
- Checkbox (all pre-checked)

User can uncheck any they don't want to cast yet.

"Import Selected" button at bottom. Imports create empty Soul ID cards in the grid.

---

### Screen 4C: Casting — Soul ID Card States

**The casting grid shows all imported characters and locations as cards.**

**Card states:**

State 1 — Not Started (empty):
- Character name
- Role tag (Lead / Supporting / Featured / Background)
- Large dashed border area: "Add reference photos"
- "Write casting brief" text link
- Soul ID status: "Not Started" in grey
- "Begin Casting" button

State 2 — In Progress:
- Reference photos visible (thumbnails in a small carousel)
- Casting brief text visible (truncated)
- Soul ID status: "Training..." with progress bar (0–100%)
- Agent: Casting Director is shown as active (amber dot)

State 3 — Trained:
- Reference photos carousel
- Brief visible
- Soul ID status: "Trained ✓" in green
- "Test Consistency" button
- "Edit" button
- A small generated preview showing 3 consistent face variants

State 4 — Failed:
- Soul ID status: "Training Failed" in red
- Error message: "Not enough visual consistency in reference photos. Try photos with similar lighting and angle."
- "Retry" button
- "Add more references" button

---

### Screen 4D: Casting — Soul ID Creation Flow

**User clicks "Begin Casting" on an empty card.**

A full-screen slide-over opens (the card expands to fill the main area, sidebar remains).

**Step 1 — Reference Photos**
Header: "MARCUS — Add Reference Photos"
Subtext: "Upload 3–10 photos of your reference. Use consistent lighting. Avoid heavy filters. Multiple angles help."

Upload zone: large drag-and-drop area. Accepts JPG, PNG, WEBP.
As photos upload they appear as thumbnails. Each thumbnail has an X to remove.
A quality indicator appears per photo: Good / Blurry / Too dark / Heavily filtered

Below photos: "Photo quality score: 7/10 — Good enough to train. Adding more photos with varied angles will improve consistency."

"Next: Write Casting Brief →" button (enabled after at least 1 photo uploaded)

**Step 2 — Casting Brief**
A structured form with fields:
- Age range (text: "e.g. 35–45")
- Ethnicity / background (text, optional)
- Physical build (text: "e.g. lean, athletic, weathered")
- Distinguishing features (text: "e.g. scar on left cheek, grey temples")
- Wardrobe direction (text: "e.g. worn leather jacket, dark jeans, always looks underdressed")
- Personality in appearance (text: "e.g. looks like someone who hasn't slept in days but still commands a room")
- Emotional register in this project (pill selector: Protagonist / Antagonist / Morally complex / Comic relief / etc.)

Below the form: a live preview of what the brief will tell the Cinematographer agent.

"Train Soul ID →" button

**Step 3 — Training**
The form collapses. A training animation plays:
- Progress bar filling from 0% to 100%
- Status messages updating:
  - "Analysing reference photos..."
  - "Extracting visual features..."
  - "Building consistency model..."
  - "Testing variations..."
  - "Soul ID trained."

When complete:
- Three generated face variants appear: "Your character, consistent across angles"
- "Test in a scene" button — generates a quick test frame of this character in a generic scene
- "Save and return to Casting" button

---

### Screen 4E: Casting — Test Consistency

**User clicks "Test Consistency" on a trained card.**

A modal opens showing 6 generated test frames of the character in different contexts:
- Different lighting conditions
- Different angles
- Different expressions

Below each frame: a small consistency score (1–10) and a note on what varied.

Overall consistency rating shown: "Consistency: 8.4 / 10 — High"

"Approved — use this Soul ID" button (primary)
"Retrain with more photos" button (secondary)

---

### Screen 4F: Casting — Complete State

All character and location cards show "Trained ✓" status.

Bottom action bar: "6 Soul IDs trained — ready for Storyboard"
"Continue to Storyboard →" button

---

## FLOW 5 — STORYBOARD WORKSPACE

### Screen 5A: Storyboard — Empty State

Header: "Storyboard — Your Cinematographer is ready."
Subtext: "Each beat from your script will generate 4 image variants. You pick one winner per beat. Your picks become the storyboard."

The beat list is imported from the Screenplay breakdown. Shown as a table:
- Beat number
- Beat title
- Scene heading
- Characters present
- Location
- Status: "Not Generated" for all
- Generate button per beat
- "Generate All Beats" button at the top right

---

### Screen 5B: Storyboard — Generation Controls

**User clicks "Generate All Beats" or individual beat "Generate" button.**

A settings panel slides in from the right before generation starts:

**Cinematographer Style Direction:**
- Visual style (pill selector): Naturalistic / High contrast / Noir / Documentary / Stylised / Hyperreal
- Aspect ratio (pill selector): 16:9 / 2.39:1 Anamorphic / 4:3 / 1:1 / 9:16
- Colour temperature (slider): Cool ←→ Warm
- Lighting mood (pill selector): Natural / Golden hour / Overcast / Hard shadows / Low key / High key
- Camera proximity (pill selector): Wide / Medium / Close / Extreme close-up / Mixed
- Additional direction (text field): free text for specific visual instructions

"Apply and Generate" button
"Generate with defaults" button (secondary, skips this panel)

---

### Screen 5C: Storyboard — Generation in Progress

The main area becomes the storyboard grid.

**Grid structure:**
- Rows = beats
- Each row has a left label column showing: beat number, beat title, scene heading, character tags, location tag
- Right of label: 4 frame slots in cinematic aspect ratio

**States per row:**

Waiting (not yet started):
- 4 empty frame slots with dashed borders
- "Waiting..." label

Generating:
- 4 frame slots show loading animation (subtle shimmer)
- Progress indicator: "Cinematographer is composing..."
- Agent thought shown: "Using Soul IDs for Marcus and Detective Reyes. Applying noir lighting. Composing for dramatic tension."

Complete:
- 4 generated images appear with a fade-in
- No frame is selected yet (all have equal weight)

**Top bar:**
- "Cinematographer — 34 beats remaining"
- Pause button
- Style settings icon (reopens style panel)
- Amber agent dot pulsing

---

### Screen 5D: Storyboard — Frame Selection

**For each completed row, user selects one winner.**

**Hovering over a frame:**
- Frame scales up very slightly
- Four icon buttons appear at bottom of frame:
  - Select (checkmark) — picks this frame as the winner
  - Zoom (magnifier) — opens lightbox view
  - Regenerate (refresh) — regenerates just this single variant
  - Reject (X) — removes this variant from the row

**Selecting a frame:**
- Selected frame gets a bright accent colour border (glowing)
- The other 3 frames dim slightly
- A small checkmark badge appears on the selected frame
- The beat row label gets a "Selected" green indicator
- The selected frame is added to the storyboard sequence in the bottom thumbnail strip

**Bottom thumbnail strip:**
A horizontal scrollable strip at the bottom of the screen showing all selected frames in order. This is the evolving storyboard. Empty slots show where beats have not yet been decided.

**Regenerating a variant:**
- The slot shows a loading state
- New variant generates in place
- User can regenerate unlimited times

**Regenerating an entire row:**
- All 4 slots return to loading state
- 4 new variants generate
- Previously selected frame is deselected

---

### Screen 5E: Storyboard — Complete State

All beats have a selected frame. Bottom strip shows full storyboard sequence.

Top bar: "Storyboard complete — 47 frames selected"

"View as slideshow" button — plays the storyboard as a sequence of images with beat titles
"Continue to Stitch →" button

---

## FLOW 6 — STITCH WORKSPACE

### Screen 6A: Stitch — Empty State

A dark wide canvas (full width minus sidebar). Grid lines very subtle.

Header message centred: "Your frames are ready. Connect them to build your animatic."

A "Load Frames to Canvas" button. Clicking populates the canvas with nodes.

---

### Screen 6B: Stitch — Canvas Populated

All selected storyboard frames appear as nodes on the canvas, arranged in a left-to-right horizontal sequence in narrative order.

**Node anatomy:**
- Rounded rectangle, dark background
- Top: frame thumbnail (cinematic aspect ratio)
- Below thumbnail: beat number (small, grey)
- Scene label (e.g. "INT. WAREHOUSE — NIGHT")
- Character tags (small pills)
- Duration indicator (e.g. "3s" — editable)
- Bottom: two connection ports (left = incoming, right = outgoing)

**Edge anatomy (connection between nodes):**
Directed arrow connecting right port of one node to left port of next.

Edge states:
- Pending: dashed line, grey, with a "Generate Video" button on the edge midpoint
- Generating: animated dashed line, amber colour, "Generating..." label
- Complete: solid line, accent colour, play button on midpoint, duration shown

**Canvas controls (bottom right):**
- Zoom in / zoom out
- Fit to screen
- Mini-map (small overview of full canvas in corner)

**Canvas interactions:**
- Drag nodes to reorder
- Click a node to select it (right panel opens)
- Click an edge midpoint button to generate video for that transition
- Drag from one node's output port to another's input port to create a new connection
- Right-click a node: options — Remove from canvas / Duplicate / Replace frame

---

### Screen 6C: Stitch — Node Selected (Right Panel)

**Right panel opens when a node is clicked.**

Shows:
- Frame thumbnail (large)
- Beat title
- Scene heading
- Characters present
- Location
- Duration slider (0.5s to 30s) — affects how long this frame holds before the next transition
- "Replace Frame" button — opens storyboard to pick a different frame for this beat
- "Generate video for this clip" button — generates a video clip just for this node (not a transition, but the clip itself holding and moving slightly)

---

### Screen 6D: Stitch — Video Generation

**User clicks "Generate Video" on an edge (transition between two nodes).**

The edge animates to amber pulsing state. A generation card appears floating near the edge:

"Video Director — Generating transition"
- From: Beat 04 frame (thumbnail)
- To: Beat 05 frame (thumbnail)
- Estimated time: 18 seconds
- Style: Match scene — hard cut / dissolve / push / whip pan (user selects)
- Cancel button

When complete:
- Edge turns solid accent colour
- A small play button appears on the edge
- Clicking play shows a preview of just that transition in a small floating player

---

### Screen 6E: Stitch — Animatic Preview

**"Preview Animatic" button at top of canvas.**

Opens a full-screen video player overlay.

Shows the animatic — all selected frames in sequence with generated transitions stitched together by FFmpeg.

Playback controls:
- Play / Pause
- Scrub bar
- Speed control: 0.5x / 1x / 1.5x / 2x
- Beat markers on scrub bar — clicking jumps to that beat
- Frame counter

After preview: "Looks good — continue to Export" button and "Back to canvas" button.

---

### Screen 6F: Stitch — Complete State

All transitions generated. Timeline scrubber at bottom shows full animatic with all clips.

Top bar: "Animatic complete — 3m 42s"
"Continue to Export →" button

---

## FLOW 7 — EXPORT WORKSPACE

### Screen 7A: Export — Options

Header: "Export — What do you need?"

Four export cards:

**Card 1 — Animatic Video**
- Format: MP4
- Resolution options: 1080p / 4K
- With or without beat titles overlaid
- With or without timecode
- "Export Animatic" button

**Card 2 — Storyboard PDF**
- Layout options: 1 frame per page / 2 per page / 4 per page
- Include beat descriptions: yes / no
- Include character tags: yes / no
- Include scene headings: yes / no
- "Export Storyboard PDF" button

**Card 3 — Shot List**
- Auto-generated from all beats
- Columns: beat number, scene heading, location, characters, props, notes
- Format: PDF or CSV
- "Export Shot List" button

**Card 4 — Production Bible**
- The full bible built by Bible Builder
- Character profiles, location descriptions, world rules, tone document
- Format: PDF
- "Export Bible" button

---

### Screen 7B: Export — In Progress

Each export card shows a progress state when generating:
- Spinner
- "Preparing your export..."
- Progress bar
- Estimated time

When complete:
- Download button appears
- File size shown
- Copy shareable link option
- "Open in new tab" option

---

## FLOW 8 — AGENT STATES (GLOBAL)

### Agent Notification System

Agents communicate through a unified notification layer. These appear as:

**Toast notifications** (bottom right, auto-dismiss after 5 seconds):
- Info: "Script Reader has started analysing your script"
- Success: "Bible Builder has completed your production bible — 3,200 words"
- Warning: "Cinematographer needs your input on Beat 12"

**Agent cards** (inline, inside the relevant workspace):
- Appear where the agent is working
- Show agent name, current action, and any proposal or question

**Agent dot in top nav:**
- Grey = idle
- Amber pulsing = working
- Green = just completed (returns to grey after 3 seconds)
- Red = needs attention (stays red until user resolves)

---

### Agent Error States

If an API key fails mid-generation:
- Generation pauses
- Error card appears: "Cinematographer paused — Fal.ai key returned an error"
- Options: "Retry" / "Check Key Vault" / "Skip this beat"

If generation times out:
- "This is taking longer than expected. Still working — you can leave this page and come back."
- Progress saves automatically

If agent produces something the continuity checker flags:
- A warning badge appears on the relevant frame
- Tooltip: "Continuity issue — Marcus is wearing a leather jacket in Beat 04 but was in a suit in Beat 03. Same scene. Flag or proceed?"
- Options: "Flag for review" / "Regenerate Beat 04" / "Ignore"

---

## FLOW 9 — EMPTY STATES (ALL SCREENS)

Every empty state in Direkta follows the same pattern:
- A simple icon (never decorative, always functional)
- One clear headline telling the user what this space is for
- One sentence explaining what needs to happen
- One primary action button
- Never a wall of text

Examples:
- Screenplay empty: "Your crew is waiting for the script."
- Casting empty: "No characters cast yet. Import from your script or add manually."
- Storyboard empty: "No frames generated. Cast your characters first, then come back."
- Stitch empty: "No frames on canvas. Select frames in Storyboard first."
- Export empty: "Nothing to export yet. Build your animatic in Stitch first."

---

## FLOW 10 — SETTINGS & KEY VAULT

### Key Vault Panel (slide-in from right)

Triggered by the Key Vault icon in top nav.

Shows:
- Fal.ai API Key — status / edit / test
- Higgsfield API Key — status / edit / test
- A cost estimator: "Based on your current project, estimated generation cost: $4.20 at current usage"
- A usage log: last 10 API calls with cost per call
- "Add another key" option for future integrations

### Account Settings

- Display name
- Email
- Password change
- Delete account (destructive, confirmation required)
- Export all project data (GDPR)

---

## INTERACTION DESIGN RULES

These rules apply to every interactive element across Direkta:

1. **Every destructive action requires confirmation** — delete, reset, replace. Always a two-step: click → confirm modal → execute.

2. **Every loading state shows progress** — never a spinning wheel with no context. Always: what is loading, how far along, estimated time if possible.

3. **Every agent action is interruptible** — pause, cancel, or skip. The user is always in control.

4. **Every error is actionable** — never just "Something went wrong." Always: what went wrong, why it might have happened, what to do next.

5. **Every completed action is undoable where possible** — frame selection, node reordering, beat edits. Undo is always available via Cmd+Z.

6. **Hover states on every interactive element** — buttons, cards, frames, nodes, edges. Nothing is ambiguous about what can be clicked.

7. **Keyboard shortcuts for power users** — Space to play/pause animatic, Cmd+Enter to confirm agent proposals, Arrow keys to navigate between beats in storyboard, Escape to close any modal or panel.

8. **Autosave always on** — a subtle "Saved" indicator in the top nav updates every 30 seconds. Never ask the user to save manually.

9. **Mobile is not supported** — if accessed on a screen under 1024px wide, show a friendly message: "Direkta is built for wide screens. Open on a laptop or desktop for the full experience." No broken layout, just a clean message.

10. **The product never speaks in AI clichés** — no "As an AI..." no "I understand you want to..." no "Certainly!" Every agent message is direct, brief, and uses filmmaker vocabulary.
