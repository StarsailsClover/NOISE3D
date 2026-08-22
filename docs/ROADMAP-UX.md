# NOISE3D UX Roadmap: v26.1-19.0 through v26.1-28.0

## Motivation

Phase 2 (v09-v18) delivered feature breadth, but interaction quality still lags Unity/Blender badly.
Diagnosed core gaps:

1. **Panel disaster** - 6 panels stacked left, 6 right, all always visible, cramped. No workspaces/tabs.
2. **Half-finished gizmos** - no drag planes, weak hover feedback, drag produces many undo steps instead of one.
3. **Primitive number inputs** - no drag-to-scrub, no arrow nudging, no commit/revert semantics.
4. **No context menus** - no right-click anywhere, no shortcut reference, inconsistent Escape behavior.
5. **Missing feedback loops** - no status bar hints, no hover highlights, no toasts, no drag-drop.

This phase contains zero new "features" - every version only deepens interaction quality.

---

## v26.1-19.0 -- Workspace System

**Problem:** All panels always visible; irrelevant panels steal space from the viewport.

### Specification
- Workspace tabs centered in toolbar: `Layout | Modeling | Shading | Animation | Rendering`
- Per-workspace panel visibility:
  - Layout: Hierarchy, Viewport, Timeline, Console, Inspector
  - Modeling: Hierarchy, Viewport, MeshEdit, Inspector
  - Shading: Viewport, MaterialEditor, RenderSettings, Inspector
  - Animation: Hierarchy, Viewport, Timeline, CurveEditor
  - Rendering: Viewport, RenderSettings, CodeEditor
- Active workspace persisted in localStorage
- Every panel collapsible by clicking its header (chevron indicator)
- Collapse state persisted per workspace
- Panels never overlap or overflow; center column keeps >= 50% width

### Acceptance tests
- Switching workspace changes visible panel set
- Workspace choice survives page reload
- Collapsed panel shows header-only strip
- Viewport occupies >= 50% height in every workspace

---

## v26.1-20.0 -- Gizmo Interaction Polish

**Problem:** Axis drags only; no plane handles; each mousemove creates an undo entry.

### Specification
- Translate gizmo gains 3 quad plane handles (XY, XZ, YZ) for two-axis dragging
- Rotate gizmo gains screen-facing outer ring for camera-relative rotation
- Hover state: hovered axis/plane brightens + cursor becomes `grab`
- Active drag: cursor `grabbing`; axis line extends as guide rail across viewport
- Undo coalescing: one snapshot per gesture (snapshot on mousedown, none during move)
- Hold Ctrl = snap to 0.5 units (translate) / 15 degrees (rotate); snap indicator tick shown
- Gizmo size constant in screen pixels regardless of camera distance

### Acceptance tests
- Plane handle drag moves object on both axes simultaneously
- One drag gesture = exactly one undo step
- Ctrl held during drag quantizes values
- Hovered part visually distinct within 50ms of pointer enter

---

## v26.1-21.0 -- Numeric Input UX

**Problem:** Bare number inputs; typing required for every tweak.

### Specification
- New shared `<NumberField>` component used by ALL numeric inputs:
  - Click-drag horizontally on field label scrubs value (cursor `ew-resize`)
  - Up/Down arrows nudge by step; Shift x10; Alt x0.1
  - Enter commits; Escape reverts to pre-edit value
  - Double-click selects full text
  - Invalid input rejected silently (keeps last valid value), red flash border
- Slider+number combo: dragging slider updates number live and vice versa
- Transform fields get step 0.1; material sliders keep own ranges

### Acceptance tests
- Dragging label 100px right increases value by expected step count
- Escape after edit restores original value exactly
- Arrow key focus navigation works without mouse
- Red flash visible on invalid entry

---

## v26.1-22.0 -- Context Menus & Keyboard Semantics

**Problem:** No right-click menus; Escape behaves inconsistently; shortcuts undiscoverable.

### Specification
- Right-click context menus:
  - Viewport empty: Add Cube/Sphere/Plane/Cylinder/Cone
  - Viewport on object: Duplicate / Delete / Focus (F) / Isolate
  - Hierarchy item: Rename / Duplicate / Delete / Move to Root
  - Asset item: Add to Scene / Remove Asset
- Menu closes on click-away, Escape, or action execution
- Unified Escape chain: cancel gizmo drag > close menu > close palette > deselect
- `?` (Shift+/) opens keyboard shortcut cheat-sheet modal, grouped by category
- All menus keyboard navigable (arrows + Enter)

### Acceptance tests
- Each menu opens at cursor with correct entries for its target type
- Escape closes menu before deselecting node
- Cheat-sheet lists every registered shortcut
- Menu items executable via keyboard alone

---

## v26.1-23.0 -- Drag & Drop Flow

**Problem:** Assets require double-click; files require dialog browse; hierarchy drops have no affordance.

### Specification
- Drag asset item -> drop on viewport instantiates mesh at raycast hit point (or origin if no hit)
- Drag OS file (.obj/.json/.png) onto window imports via existing pipelines
- Drop overlay highlights whole window with dashed border while OS file hovers
- Hierarchy drag shows insertion indicator: line above / below (reorder) or box around (re-parent)
- Invalid drop targets show `not-allowed` cursor

### Acceptance tests
- Asset dropped on object's screen position places new node at that world position
- OBJ dropped onto window appears in assets without dialog
- Indicator distinguishes re-order vs re-parent visually
- Failed drops leave scene unchanged

---

## v26.1-24.0 -- Selection & Hover Feedback

**Problem:** Only selected wireframe exists; no hover state; multi-select invisible.

### Specification
- Hover outline (thin, 30% opacity orange) on object under cursor, throttled raycast (~30Hz)
- Selected objects: solid orange outline; multi-selection adds translucent AABB box around group
- Selecting in viewport scrolls hierarchy item into view + 300ms background flash
- Selecting in hierarchy draws a temporary ground marker under the object
- Deselect-all on empty-space click already works; add double-click empty = frame all

### Acceptance tests
- Hover outline appears/disappears with pointer movement
- Multi-select shows enclosing box
- Cross-panel selection sync observable in both directions
- Double-click empty space reframes camera

---

## v26.1-25.0 -- Status Bar, Tooltips & Onboarding

**Problem:** Users cannot tell what mouse buttons do; no guidance for first-run.

### Specification
- Persistent status bar (bottom, 24px):
  - Left: contextual mouse hints (`LMB Select | RMB Orbit | MMB Pan | Wheel Zoom`)
  - Center: scene name + dirty flag dot when unsaved changes exist
  - Right: node count | light count | FPS
- Styled tooltips (dark card, 300ms delay) replace native titles on all toolbar/gizmo/cam buttons
- First-run tour: 4-step spotlight overlay (Toolbar > Hierarchy > Viewport > Inspector),
  "Skip" always available, completion flag in localStorage

### Acceptance tests
- Hint text changes when gizmo mode changes (e.g., `LMB Drag X/Y/Z`)
- Dirty dot appears after first edit, clears on save
- Tour shows once; skipping sets permanent flag
- FPS readout updates ~2x/sec

---

## v26.1-26.0 -- Command Palette & Search

**Problem:** Every action requires knowing where its button lives.

### Specification
- `Ctrl+K` opens fuzzy-search command palette:
  - Sources: all primitives, view presets, projection toggle, save/load/new/export, gizmo modes, grid/play toggles, plugin tools
  - Fuzzy match on name + keywords; Enter runs top hit; arrows navigate
  - Shows shortcut badge next to commands that have one
- Hierarchy search box filters tree live (case-insensitive substring)
- Palette remembers last 5 executed commands under "Recent"

### Acceptance tests
- Typing "cub" surfaces "Add Cube"
- Running command via palette has identical effect to button
- Recent section populated after usage
- Palette closes without action on Escape

---

## v26.1-27.0 -- Safety Nets: Toasts, Modals & Autosave

**Problem:** Feedback buried in console; destructive actions unguarded; crash loses work.

### Specification
- Toast system (top-right stack): info/success/warn/error, auto-dismiss 3s, max 5 stacked
  - Replace high-value console logs: saved/loaded/exported/plugin events
- Unsaved-changes guard: New Scene / Load / window close prompt confirmation modal when dirty
- Confirmation modal component replaces any `confirm()` usage
- Autosave: every 60s to `noise3d:autosave` slot; on boot with autosave newer than last manual save,
  offer "Recover autosave?" toast with Restore/Discard buttons

### Acceptance tests
- Save triggers success toast; error path triggers error toast
- Dirty + New Scene shows modal; Cancel aborts cleanly
- Simulated crash (reload mid-session) presents recovery option
- Max 5 toasts visible; oldest removed

---

## v26.1-28.0 -- Performance & Responsiveness

**Problem:** Unknown frame budget; UI jank with many objects; hierarchy renders all rows.

### Specification
- Status bar FPS turns amber < 45, red < 30
- React.memo on all panel bodies; store selectors narrowed to primitive slices
- Hover raycast throttled to 30Hz and skipped entirely during orbit/drag
- Virtualized hierarchy list (render only visible rows +/- overscan)
- Import operations async with progress bar in status bar
- Target: 1000-node scene stays >= 55 FPS on integrated GPU, hierarchy scroll smooth

### Acceptance tests
- 1000-cube scene maintains interactive framerates in test harness
- Hierarchy virtualization verified with DOM row count assertion
- No hover raycasts during camera drag (instrumented counter)
- Progress bar visible during large OBJ import

---

## Summary Table

| Version | Theme | Core Interaction Fixed |
|---------|-------|------------------------|
| v26.1-19.0 | Workspaces | Panel clutter |
| v26.1-20.0 | Gizmo Polish | Precise 3D manipulation |
| v26.1-21.0 | Numeric UX | Value editing speed |
| v26.1-22.0 | Context Menus | Discoverability |
| v26.1-23.0 | Drag & Drop | Object creation flow |
| v26.1-24.0 | Selection Feedback | Situational awareness |
| v26.1-25.0 | Status Bar & Onboarding | Guidance |
| v26.1-26.0 | Command Palette | Action reach |
| v26.1-27.0 | Safety Nets | Trust & data safety |
| v26.1-28.0 | Performance | Scale confidence |

Dependency order matters: 19 (workspaces) reshapes layout everything else lives in;
20-21 are independent interaction upgrades; 22-27 build feedback loops; 28 hardens at scale.
