# NOISE3D Roadmap: v26.1-09.0 through v26.1-XX.0

## Overview

This document outlines the next 10 versions of NOISE3D, addressing gaps compared to Unity and Blender editors. Each version delivers significant, user-visible improvements.

---

## v26.1-09.0 -- Camera System Overhaul

### Problem
- Initial camera angle is skewed and unintuitive
- No view presets (front/back/left/right/top/iso)
- No orthographic/perspective toggle
- Frame-selected is incomplete

### Changes
- Fix initial camera to standard 45-degree isometric view looking at origin
- Add view preset buttons: Front, Back, Left, Right, Top, Bottom, Isometric
- Keyboard shortcuts: Numpad 1/3/7 (front/right/top), Numpad 5 (perspective/ortho toggle), Numpad . (frame selected)
- Smooth camera transitions between views (lerp over 0.3s)
- Orthographic camera mode with zoom-to-cursor
- Improved orbit sensitivity with configurable speed
- Pan uses screen-space projection (not camera-space)
- Zoom focuses on cursor position, not viewport center
- Camera state serialization in scene files

### Tests
- Camera starts at isometric angle
- View preset buttons switch angles correctly
- Numpad shortcuts work
- Ortho/perspective toggle works
- Frame selected zooms to correct distance

---

## v26.1-10.0 -- Transform Gizmo Implementation

### Problem
- Gizmo mode buttons exist but gizmo is not actually draggable in viewport
- Cannot move/rotate/scale objects by dragging in 3D space

### Changes
- Implement interactive translate gizmo (X/Y/Z axis arrows + center plane handle)
- Implement interactive rotate gizmo (X/Y/Z rotation rings)
- Implement interactive scale gizmo (X/Y/Z scale handles + uniform center)
- Ray-test against gizmo handles to determine drag axis
- Screen-space to world-space projection for drag delta
- Snap-to-grid option (Ctrl key)
- Gizmo size scales with distance to maintain constant screen size
- Gizmo drawn on top of scene (depth test disabled)
- Hover highlight on gizmo axes

### Tests
- Translate gizmo visible when node selected
- Dragging X axis moves only X
- Dragging Y axis moves only Y
- Rotate gizmo rotates around correct axis
- Scale gizmo scales correctly
- Snap-to-grid works with Ctrl
- Gizmo maintains screen size at different distances

---

## v26.1-11.0 -- Multi-Select & Scene View Modes

### Problem
- Only single selection supported
- No wireframe/solid/rendered view modes
- No multi-object operations

### Changes
- Box select (drag in empty space to select multiple)
- Shift+click to add/remove from selection
- Ctrl+A select all
- Multi-select transform (group gizmo)
- Scene view modes: Wireframe, Solid (unlit), Material Preview, Rendered
- View mode toggle in viewport toolbar
- Selection outline rendering (stencil-based or post-process)
- Selection list in inspector showing all selected nodes
- Batch operations: delete all, duplicate all, group

### Tests
- Box select selects multiple objects
- Shift+click toggles selection
- Select all works
- View mode switches change rendering
- Multi-select gizmo moves all selected
- Batch delete removes all selected
- Selection outline visible

---

## v26.1-12.0 -- Component System & Prefabs

### Problem
- No Unity-style component architecture
- No prefab (reusable object template) system
- Nodes are flat with no behavior attachment

### Changes
- Component interface: onUpdate(dt), onRender(), onInspector()
- Built-in components: MeshFilter, MeshRenderer, Collider, Rigidbody, Camera, AudioSource
- Component panel in Inspector (add/remove components per node)
- Prefab system: save node subtree as prefab (.prefab.json)
- Instantiate prefab from asset browser
- Prefab overrides: modify instance properties, sync to all instances
- Component serialization in scene files
- Script component: attach .js script to node, auto-invoke onUpdate

### Tests
- Components list visible in inspector
- Can add/remove components
- Prefab creation from selected node
- Prefab instantiation from browser
- Prefab override and sync
- Script component runs onUpdate
- Components serialize/deserialize

---

## v26.1-13.0 -- Physics Engine (Rigid Body Dynamics)

### Problem
- No physics simulation
- No collision detection
- Gravity and forces not applied

### Changes
- Custom physics engine: AABB and sphere collision detection
- RigidBody component with mass, velocity, angular velocity
- Collision response (impulse-based)
- Gravity field
- Box collider and sphere collider components
- Physics world step (fixed timestep with interpolation)
- Raycast for picking and physics queries
- Collision events (onCollisionEnter, onCollisionExit)
- Physics debug visualization (wireframe colliders)
- Play mode triggers physics simulation

### Tests
- Box falls under gravity
- Box collides with floor
- Sphere collider works
- Raycast hits correct object
- Collision events fire
- Physics debug overlay toggles
- Physics pauses when not in play mode

---

## v26.1-14.0 -- Node-Based Material Editor

### Problem
- Materials are hardcoded parameter lists
- No visual shader graph
- Cannot create custom shading effects

### Changes
- Node graph editor UI (drag nodes, connect pins)
- Material node types: Output, Color, Texture, Mix, Math, Vector, Normal
- Shader graph compilation to GLSL/WGSL
- Real-time material preview sphere
- Save/load material graphs (.mat.json)
- Material asset browser integration
- Node search and categorization
- Connection validation (type checking)

### Tests
- Material editor opens with node graph
- Can add nodes from palette
- Can connect node pins
- Compile generates valid shader
- Preview sphere updates in real-time
- Material save/load works
- Type mismatch prevents connection

---

## v26.1-15.0 -- Terrain & Environment System

### Problem
- No terrain editing
- No skybox/environment
- No fog or atmosphere

### Changes
- Terrain mesh with heightmap (height brush, smooth brush, flatten)
- Terrain texture splatting (up to 4 layers)
- Heightmap import/export (16-bit PNG)
- Brush size and strength controls
- Skybox: gradient sky, cubemap, equirectangular
- Procedural sky (sun position, atmospheric scattering)
- Fog: linear and exponential
- Environment lighting (IBL from skybox)
- Terrain LOD for large landscapes

### Tests
- Terrain creates with default heightmap
- Height brush raises terrain
- Smooth brush works
- Texture splatting shows layers
- Skybox renders
- Fog affects distant objects
- Heightmap export works

---

## v26.1-16.0 -- UV Editing & Procedural Geometry

### Problem
- No UV editing
- Only basic primitives, no procedural mesh generation
- Cannot create custom geometry in-editor

### Changes
- UV unwrap for selected mesh (planar, box, spherical projections)
- UV editor viewport (2D UV space with mesh overlay)
- UV transform (move, rotate, scale UV islands)
- Procedural geometry: extrude, bevel, subdivide, boolean ops
- Mesh edit mode: vertex/edge/face selection
- Custom mesh saving as OBJ from editor
- Geometry node system (parametric shapes)

### Tests
- UV unwrap generates valid UVs
- UV editor shows mesh overlay
- UV transform works
- Extrude creates new faces
- Subdivide increases poly count
- Vertex selection in edit mode
- Custom mesh exports to OBJ

---

## v26.1-17.0 -- Animation System V2 (Curves & Rigging)

### Problem
- Animation is basic keyframe only
- No animation curves
- No skeletal/armature rigging
- No animation layers

### Changes
- Animation curve editor (bezier interpolation between keyframes)
- Curve manipulation: tangent handles, easing presets
- Skeletal rigging: bone hierarchy, skinning
- Bone weight painting
- Inverse kinematics (IK) solver
- Animation layers (base + additive)
- Animation blend trees
- Root motion support
- Animation events (trigger callbacks at keyframe time)

### Tests
- Curve editor shows bezier handles
- Tangent manipulation changes interpolation
- Bone hierarchy creates correctly
- Skinning deforms mesh
- IK solver reaches target
- Animation layers blend
- Animation events fire at correct time

---

## v26.1-18.0 -- Plugin System & Extensibility

### Problem
- No way for users to extend the editor
- No custom panels, tools, or components
- Everything is hardcoded

### Changes
- Plugin API: registerPanel, registerTool, registerComponent, registerNodeType
- Plugin manifest format (.plugin.json)
- Plugin manager UI (enable/disable, install from URL)
- Built-in plugin examples (screenshot tool, CSV importer)
- Event system (onSceneLoad, onNodeSelect, onRender, onUpdate)
- Plugin sandboxing (limited API access)
- Plugin hot-reload during development
- Scripting API expansion (full editor control from scripts)

### Tests
- Plugin manager shows installed plugins
- Custom panel from plugin renders
- Custom tool from plugin works
- Plugin enable/disable works
- Plugin events fire correctly
- Hot-reload updates plugin without page refresh

---

## Summary Table

| Version | Theme | Key Deliverable |
|---------|-------|------------------|
| v26.1-09.0 | Camera Overhaul | View presets, ortho mode, smooth transitions |
| v26.1-10.0 | Transform Gizmo | Interactive drag-to-move/rotate/scale in 3D |
| v26.1-11.0 | Multi-Select & View Modes | Box select, wireframe/solid/rendered |
| v26.1-12.0 | Components & Prefabs | Unity-style component architecture |
| v26.1-13.0 | Physics Engine | Collision detection, rigidbody, raycast |
| v26.1-14.0 | Node Material Editor | Visual shader graph with GLSL/WGSL compile |
| v26.1-15.0 | Terrain & Environment | Heightmap terrain, skybox, fog |
| v26.1-16.0 | UV & Procedural Geo | UV unwrap, mesh edit mode, boolean ops |
| v26.1-17.0 | Animation V2 | Bezier curves, skeletal rigging, IK |
| v26.1-18.0 | Plugin System | Extensible editor with third-party plugins |

## Priority Order

1. **Camera** (v09) -- most immediately noticeable, blocks effective use of all other features
2. **Gizmo** (v10) -- core editing interaction, can't build scenes without it
3. **Multi-Select** (v11) -- essential workflow feature
4. **Components** (v12) -- architectural foundation for physics and scripting
5. **Physics** (v13) -- depends on components
6. **Material Editor** (v14) -- visual quality improvement
7. **Terrain** (v15) -- scene building capability
8. **UV/Procedural** (v16) -- geometry authoring
9. **Animation V2** (v17) -- depends on good curve editing
10. **Plugins** (v18) -- extensibility for long-term growth
