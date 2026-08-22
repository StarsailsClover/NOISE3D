# Interaction Reference: Blender & Unity Patterns

Research sources: Blender developer docs (operator system), `blender/blender`
`wm_operators.c`, Blender Manual (Input Fields, Navigation), Unity Manual
(Scene View Navigation). This document maps verified behaviors from both tools
onto NOISE3D's UX phase (v26.1-19.0 .. v26.1-28.0). Where the two tools
disagree we choose per-version and note it.

---

## 1. Modal Operator Pattern (Blender) -- foundation for gizmo drags

Blender's core interaction primitive. Every drag-type operation follows:

```
invoke()  -> snapshot state, register modal handler -> RUNNING_MODAL
modal()   <- receives every event until terminal event
  MOUSEMOVE          : apply delta to working copy
  LEFTMOUSE / ENTER  : return FINISHED   (commit + single undo push)
  RIGHTMOUSE / ESC   : return CANCELLED  (restore snapshotted state, NO undo push)
```

Key properties we must replicate (`ModalDragSession` in our codebase):

| Rule | Implementation |
|------|----------------|
| One gesture = at most ONE undo entry | Snapshot on mousedown; no snapshots during move |
| Cancel restores exactly | Keep pre-drag values; Esc/RMB writes them back |
| Confirm commits | LMB-up / Enter finalizes |
| Live numeric feedback during drag | Status bar shows delta like Blender's header ("D: 1.20 along X") |
| Axis constraint DURING drag | X/Y/Z pressed mid-drag locks axis (v26.1-22 scope) |

Source evidence: `WM_generic_select_modal` distinguishes click (select) vs
drag-beyond-threshold (tweak) -- adopt as `click vs drag threshold = 4px` so
clicking a selected object never jitters into a micro-move.

---

## 2. Number Field Behavior (Blender Manual, verified)

Applies to v26.1-21.0 `<NumberField>`:

| Interaction | Behavior |
|-------------|----------|
| Hover | `<` `>` step arrows visible at field edges |
| Click arrows | Step by unit amount |
| Ctrl+Wheel over field | Step value without click |
| LMB-drag horizontal | Continuous scrub |
| Ctrl during scrub | Snap to discrete steps |
| Shift during scrub | Precision mode (~10x slower) |
| Click / Return | Switch to text entry |
| Return / click outside | Apply typed value |
| Esc / RMB while typing | Cancel, restore previous |
| Tab / Shift+Tab | Next / previous field |
| Minus (hover) | Negate current value |

Extra Blender feature worth copying later: multi-field vertical drag edit
(press on X, drag down through Y and Z, scrub all three together).
Deferred to post-v28 unless cheap.

---

## 3. Viewport Navigation Model (merged Blender + Unity)

Current NOISE3D uses RMB-orbit which conflicts with Unity-style flythrough.
Adopted standard (Unity primary, since our users are game-dev oriented;
document Blender alternative in cheat sheet):

| Action | Binding |
|--------|---------|
| Frame selected | F (already) ; Lock-follow: Shift+F (new) |
| Frame all | Home |
| Orbit | Alt+LMB drag OR MMB drag (keep MMB free-orbit) |
| Pan | MMB+Shift drag OR Alt+MMB |
| Zoom | Wheel ; Alt+RMB drag (fine zoom) |
| Flythrough | Hold RMB: mouse look + WASD move, Q/E down/up, Shift fast, wheel sets speed |
| Ortho toggle | Numpad 5 (already) |
| View presets | Numpad 1/3/7 front/right/top; Ctrl+Numpad opposite side |
| Arrow keys | Walk camera on ground plane, Shift faster |

RMB currently opens nothing in viewport, so flythrough claim is safe.
Orbit via plain RMB is REMOVED (was nonstandard); MMB + Alt+LMB cover orbit.

---

## 4. Selection Semantics (both tools agree)

- Click empty = deselect all
- Click object = select only it
- Shift+Click toggles membership (extend/reduce)
- Click selected-only object and dragging < threshold = keep selection
  (from `wait_to_deselect_others` logic in Blender's generic select)
- Ctrl+A select all; Alt+A / Escape deselect all
- Double-click hierarchy item = rename inline (Outliner behavior)

---

## 5. Workspaces (Blender topbar)

Blender facts: workspaces are tabs in the topbar; each bundles areas+panels;
switching preserves per-workspace state. Our mapping (v26.1-19.0):
tabs centered in toolbar, per-workspace panel list, collapse state persisted
per workspace, localStorage persistence. Blender additionally remembers last
workspace on open -- copy that.

---

## 6. Status Bar (Blender)

Blender's status bar left half = contextual keymap hints that CHANGE with
mode/modal-operator; right half = resource counts + version. During modal
drags it shows live values ("Dx: 1.2 Dy: 0"). Our v26.1-25.0 status bar must
update hints when: gizmo mode changes, modal drag active (live delta), hover
over canvas vs panels.

---

## 7. Undo System Rules (Blender)

- Undo push happens ONLY after successful operator completion
- Cancelled operators push nothing
- Modal running blocks autosave (prevents mid-gesture saves) -- mirror this:
  pause autosave timer while any ModalDragSession active
- Redo popup ("Adjust Last Operation") deferred; our console-log of applied
  deltas serves the same audit role initially

---

## Version Mapping Summary

| Reference Section | Feeds Into |
|-------------------|------------|
| 1 Modal operators | v20 gizmo polish, v27 autosave pause |
| 2 Number fields | v21 NumberField spec (exact binding table above) |
| 3 Navigation | v20 (remove RMB-orbit), v25 status hints |
| 4 Selection | v24 selection feedback, v22 menus |
| 5 Workspaces | v19 exact panel lists |
| 6 Status bar | v25 hint context rules |
| 7 Undo rules | v20 coalescing, v27 autosave guard |
