# Version History

## v26.1-23.0 (2026-08-24) - LTS Release

### Added
- Asset browser -> viewport drag & drop: mesh assets spawn at the raycast
  hit point (lifted +0.6) or at origin over empty space; payload via
  `application/x-noise3d-asset`
- OS file drag & drop onto window: .obj -> mesh import, .png/.jpg ->
  texture import, .json -> scene import; dashed overlay highlights while
  hovering (Files-type detection with enter/leave depth counting)
- Hierarchy drag-drop zones: top/bottom edges = reorder as sibling
  (indexed), middle or container nodes = re-parent inside; visual
  indicators (accent lines above/below, outline box inside); invalid
  targets show `none` drop effect and are rejected (parent into own
  descendant leaves structure unchanged)
- Store: `reorderNode` (one undo snapshot per gesture), `addCustomMeshNode`
  accepts optional spawn position; Scene: public `canReparent`,
  `reparentAt(id, parentId, index)`
- Vite `optimizeDeps.include` pre-bundling (stops cold-start reload races
  that flaked early-alphabet E2E files)

### Tested
- 6 new drag & drop E2E tests
- Full suite: 337 E2E passed / 0 failed + 6 unit passed

## v26.1-22.0 (2026-08-23) - LTS Release

### Added
- Right-click context menus with keyboard navigation (arrows + Enter):
  - Viewport empty: Add Cube/Sphere/Plane/Cylinder/Cone
  - Viewport object: Duplicate (Ctrl+D) / Delete (Del, danger) / Focus (F) /
    Isolate / Un-isolate
  - Hierarchy item: Rename (focuses Inspector name field) / Duplicate /
    Move to Root / Delete
  - Asset item: Add to Scene / Remove Asset
- Menu closes on click-away, Escape, or action execution; clamped to viewport
- Unified Escape chain: close menu > close cheat sheet > cancel gizmo drag >
  deselect
- `?` opens grouped keyboard shortcut cheat sheet modal (Esc closes);
  SHORTCUTS registry shared with future command palette
- Isolate mode: hide all but chosen node, toggle to restore
- removeAsset store action (Asset Manager integration)

### Tested
- 12 new E2E tests (menus, isolate, Escape chain, cheat sheet, keyboard nav)
- Full suite: 331 E2E passed / 0 failed + 6 unit passed

## v26.1-21.0 (2026-08-23) - LTS Release

### Added
- Shared `NumberField` component implementing the Blender binding table
  (INTERACTION-REFERENCE §2) across all numeric inputs:
  - Hover `<` `>` steppers; click to step; Ctrl+Wheel steps without focus
  - LMB-drag horizontal scrub (cursor ew-resize); Ctrl quantizes to field
    step; Shift = precision (0.1x rate)
  - Plain click = text entry; Enter or click-outside commits; Esc reverts;
    invalid input flashes red and reverts silently
  - ArrowUp/Down nudge by step (Shift x10, Alt x0.1); Minus negates
- Integrated into Inspector (Position/Rotation/Scale via `Vec3Row`,
  texture tiling/offset) and LightPanel (light position/direction)
- Scrub gestures coalesce into ONE undo entry (`onDragStart` fires
  `takeSnapshot` at first movement — Blender modal-operator rule)

### Fixed
- Legacy specs migrated: value reads target `.numfield-display`;
  writes use click-type-Enter helper with `.numfield-editing` wait
  (removes rAF focus race)

### Tested
- 12 new NumberField E2E tests (nudge/scrub/quantize/edit/revert/flash/
  wheel/arrows/negate/undo-coalescing)
- Full suite: 319 E2E passed / 0 failed + 6 unit passed

## v26.1-20.1 (2026-08-23) - LTS Release (Critical Math Fix)

### Root Cause Found
A fundamental matrix-math bug silently broke all CPU-side transform math since v1:
- `Mat4.multiply` matched neither A·B nor B·A (verified against textbook reference)
- `Mat4.lookAt` stored the rotation basis transposed, so V·eye != origin

GPU rendering masked both (GLSL multiplied P·V·M itself), but every JS-side
consumer was wrong: ray-picking/unprojection (object selection!), gizmo screen
projection, zoom-to-cursor, and model composition (fromTRS dropped rotation and
scale contributions). This is why entities "could not be selected" and the
camera felt broken.

### Fixed
- `Mat4.multiply`: correct column-major triple loop (verified 0-error vs reference)
- `Mat4.lookAt`: basis vectors stored transposed; V·eye == origin verified
- Verified via new unit suite: multiply == textbook A·B (0 err), invert ==
  Gauss-Jordan reference (exact), roundtrip ~1e-8

### Added
- Flythrough camera: hold RMB + WASD move / Q-E down-up / Shift x3 speed /
  wheel adjusts fly speed; orbit params resync on exit
- Alt+LMB orbit (Unity-style) restored after RMB repurposed for flythrough
- Home / ISO now frame scene bounding box (frameAllIso) instead of rotating
  in place around a stale target
- `__noise3d_cam` debug hook; Home key shortcut; frameAll event
- View-mode buttons restored (lost in v20.1 controls rewrite)

### Fixed (selection)
- Gizmo plane handles no longer intercept clicks on object bodies: left-click
  raycasts meshes first; plane quads only intercept over empty space
- Plane handle hit/visual size reduced 0.42 -> 0.30 of gizmo scale
- updateNodeTransform bumps undoRevision so Inspector reflects gizmo drags

### Tested
- New: mat4-vs-reference + mat4-invert unit suites (6 tests)
- New: v23 camera/selection E2E (6 tests: cross-object select, deselect,
  flythrough move>1u, Home/ISO reframe, cam hook)
- Full suite: 307 E2E passed / 0 failed + 6 unit passed

## v26.1-20.0 (2026-08-20) - LTS Release

### Added
- Gizmo interaction fully wired into viewport (v10 classes were orphaned)
- Plane handles (XY/XZ/YZ quads) for two-axis translate with correct masking
- Screen-facing outer ring for rotate mode + three axis rings
- Hover highlighting: hovered part brightens, cursor becomes grab; dragging = grabbing
- Undo coalescing: exactly one snapshot per drag gesture (Blender modal-operator rule)
- Ctrl snapping: 0.5 units translate / 15-degree rotate / 0.1 scale steps
- Constant screen-size gizmo: world scale computed per-frame from camera distance (arms ~45 css px)
- `__noise3d_gizmo` debug hooks (state/pick/project) enabling deterministic E2E picking tests

### Fixed
- Rotate ring pick used world-units radius as pixels (never hit); now converts via pxPerWorld
- updateNodeTransform bumps undoRevision so Inspector reflects programmatic drags live

### Tested
- 7 new deterministic gizmo E2E tests (hover/cursor/translate/undo-count/snap/plane/ring/scale)
- Full suite: 300 passed, 0 failed

## v26.1-19.0 (2026-08-20) - LTS Release

### Added
- Workspace system: Layout / Modeling / Shading / Animation / Rendering tabs centered in toolbar
- Per-workspace panel visibility sets; viewport present in every workspace
- Panel collapse via header click with chevron indicator
- Workspace choice + per-workspace collapse state persisted to localStorage
- `?ws=` URL parameter for direct workspace deep-linking
- WorkspaceStore (zustand) with WORKSPACES registry and PanelId union

### Fixed
- Panel sizing regressions from slot wrapping: removed legacy descendant rules
  (`.app-left .panel.light-panel` max-height resolved against wrong base and collapsed bodies)
- Slot-level layout ownership: explicit heights/flex per [data-panel-id]
- v15 physics Play-button strict-mode ambiguity (toolbar vs timeline)
- v16 material editor socket clicks now scrollIntoViewIfNeeded (flaky under load)

### Tested
- 17 new Playwright E2E tests for workspaces/collapse/persistence
- Full suite: 293 passed, 0 failed
- Legacy specs migrated to workspace-aware URLs (?ws=modeling/shading/animation/rendering)

## v26.1-18.0 (2026-08-19) - LTS Release

### Added
- Plugin system with PluginManager (register/unregister/enable/disable)
- PluginContext API: registerPanel, registerTool, log, getSceneStats
- Plugin manifest format (id/name/version/author/description)
- Event hooks (onSceneLoad, onNodeSelect, onRender)
- Inline plugin panel rendering in manager UI
- Tool execution with editor console integration
- Built-in plugins: Screenshot Tool, CSV Importer
- 11 Playwright E2E tests

## v26.1-17.0 (2026-08-18) - LTS Release

### Added
- KeyframeV2 with per-key interpolation (linear/bezier/step/ease-in/out/in-out)
- Hermite spline evaluation with tangent handles
- Skeletal rig: bone hierarchy + humanoid preset (7 bones)
- Forward kinematics world position computation
- Analytic 2-bone IK solver (law of cosines)
- CurveEditorPanel with clip management and key insertion
- 12 Playwright E2E tests

## v26.1-16.0 (2026-08-18) - LTS Release

### Added
- UVUnwrapper: planar/box/spherical/cylindrical projections
- MeshOperations: midpoint subdivision, face extrusion, edge bevel
- Normal recomputation from face cross products
- MeshEditPanel with target display and op controls
- Edit mode selector (Vertex/Edge/Face)
- 10 Playwright E2E tests

## v26.1-15.0 (2026-08-18) - LTS Release

### Added
- Terrain heightmap editing (raise/smooth/flatten brushes)
- Procedural terrain generation (4-octave value noise)
- Terrain mesh builder with computed normals
- Environment settings: gradient/solid/procedural sky types
- Sky color pickers, fog controls (enable/density/color)
- EnvironmentPanel UI
- 12 Playwright E2E tests

## v26.1-14.0 (2026-08-18) - LTS Release

### Added
- Node-based material editor with 9 node types
- Socket click-to-connect with type validation
- Shader graph compilation to GLSL (topological DFS)
- Implicit conversions (float broadcast, vec3-to-vec4)
- Compiled code preview and material save
- 12 Playwright E2E tests

## v26.1-13.0 (2026-08-17) - LTS Release

### Added
- Physics engine: AABB/sphere collision detection
- RigidBody component with mass/velocity/angular velocity
- Impulse-based collision response, gravity field
- Fixed timestep stepping with raycast queries
- Physics debug visualization toggle
- Physics tests

## v26.1-12.0 (2026-08-17) - LTS Release

### Added
- Component system (MeshFilter/MeshRenderer/Collider/Rigidbody/Camera/AudioSource)
- Component panel in Inspector (add/remove/edit properties)
- Prefab system (save node subtree, instantiate, overrides)
- Script components with auto-invoked onUpdate
- Component/prefab serialization

## v26.1-11.0 (2026-08-17) - LTS Release

### Added
- Box select, shift+click multi-select, Ctrl+A select all
- Multi-select transform operations
- Scene view modes: Wireframe/Solid/Material Preview/Rendered
- Selection outline rendering
- Batch delete/duplicate operations

## v26.1-10.0 (2026-08-16) - LTS Release

### Added
- Interactive translate gizmo (X/Y/Z arrows + plane handles)
- Interactive rotate gizmo (axis rings)
- Interactive scale gizmo (handles + uniform center)
- Ray-test against gizmo handles, screen-space drag projection
- Snap-to-grid with Ctrl, distance-scaled gizmo sizing
- Hover highlight on axes

## v26.1-09.0 (2026-08-18) - LTS Release

### Added
- **View Preset Buttons**: Quick navigation to Front, Right, Top, ISO, Back, Left, Bottom views
- **Projection Mode Toggle**: Switch between Perspective and Orthographic projection
- **Smooth Camera Transitions**: Animated transitions when switching views
- **Keyboard Shortcuts**: Numpad 1/3/7 for view presets, Numpad 5 for projection toggle
- **Improved Camera Controls**: Better orbit, pan, and zoom with configurable sensitivity
- **Frame Selected**: F key frames the selected object in viewport

### Improved
- OrbitCamera now supports both perspective and orthographic projection modes
- Added projection matrix support to Renderer and WebGPURenderer
- Ray picking updated to work with both projection modes
- Camera state serialization support

### Tested
- 14 Playwright E2E tests for camera system
- All v1-v9 and v26.1-08.0 tests passing (140 total)

## v26.1-09.0.RC (2026-08-18) - Pre-Release

## v26.1-08.0 (2026-08-17) - LTS Release

### Added
- WebGPU rendering backend with WGSL shaders (full PBR pipeline)
- Dual-backend architecture: WebGL2 (fallback) + WebGPU (preferred)
- Runtime backend detection and async upgrade to WebGPU
- Backend badge in toolbar showing active renderer
- Embedded script editor with JavaScript sandbox execution
- Script API: scene, nodes, lights, log() globals
- Script error handling with output panel
- Code editor with Run/Reset buttons and default API documentation
- Version control reform: calendar-semantic hybrid scheme (vYY.MAJOR-MM.MINOR.TYPE)
- Versioning policy documentation (VERSIONING.md / VERSIONING_zh.md)
- @webgpu/types for TypeScript WebGPU type definitions

### Improved
- RendererFactory with createRendererSync and createRendererAsync
- WebGPURenderer with ready promise and initialized flag
- ViewportPanel gracefully falls back to WebGL2 if WebGPU fails
- IRenderer interface for backend-agnostic rendering

### Tested
- 14 Playwright E2E tests for WebGPU and scripting
- All v1-v9 tests still passing (126 tests total)

## v26.1-08.0.RC (2026-08-17) - Pre-Release

## v9.0.0 (2026-08-16) - LTS Release (legacy versioning)

### Added
- Animation system with keyframe tracks (position, rotation, scale)
- Animation clip creation and management
- Timeline panel with play/pause and time scrubber
- Keyframe insertion at current time for selected node
- Animation playback with looping and linear interpolation
- Particle system with emission rate, lifetime, speed, gravity
- Particle panel UI with per-emitter controls
- Particle simulation (spawn, update, color/size interpolation)
- 2D/3D editor mode toggle in toolbar
- Play button drives animation ticking and particle updates

### Improved
- Store manages animation clips, particle emitters, editor mode
- Timeline shows track list with keyframe counts
- Multiple clips can be created and switched

### Tested
- 18 Playwright E2E tests for animation, particles, and 2D mode
- All v1-v8 tests still passing (112 tests total)

## v9.0.0-rc.1 (2026-08-16) - Pre-Release

## v8.0.0 (2026-08-16) - LTS Release

### Added
- Post-processing shader pipeline (ACES tone mapping, bloom bright pass, gamma correction)
- Post-processing shader sources (vertex, fragment, shadow, depth debug)
- Render settings panel with exposure, bloom threshold, bloom intensity sliders
- Scene export to OBJ format
- Scene export to JSON format (full scene metadata)
- Scene export to PNG (viewport screenshot)
- Export options in File menu (OBJ, JSON, PNG)
- Render canvas registration in store for PNG export

### Improved
- Renderer exposes post-processing parameters (exposure, bloomThreshold, bloomIntensity)
- ViewportPanel applies post settings to renderer reactively
- SceneExporter class with OBJ/JSON/PNG download methods

### Tested
- 13 Playwright E2E tests for export and post-processing
- All v1-v7 tests still passing (94 tests total)

## v8.0.0-rc.1 (2026-08-16) - Pre-Release

## v7.0.0 (2026-08-16) - LTS Release

### Added
- OBJ mesh file parser (vertices, normals, UVs, faces with triangulation)
- Asset management system (AssetManager class)
- Asset panel UI with mesh and texture listing
- OBJ import via file dialog
- Texture import via file dialog
- Custom mesh node type ('custom') with mesh asset binding
- Double-click asset to add custom mesh to scene
- Custom mesh upload to WebGL renderer (uploadCustomMesh)
- SceneNode extended with meshAssetId and textureAssetId

### Improved
- Renderer supports custom mesh rendering alongside primitives
- Mesh cache keys now distinguish custom vs primitive meshes
- OBJ parser handles v/vn/vt/f commands and quad-to-triangle fan triangulation

### Tested
- 12 Playwright E2E tests for asset management
- All v1-v6 tests still passing (81 tests total)

## v7.0.0-rc.1 (2026-08-16) - Pre-Release

## v6.0.0 (2026-08-16) - LTS Release

### Added
- Undo/Redo system with snapshot-based state history (max 50 steps)
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y/Ctrl+Shift+Z (redo), Ctrl+D (duplicate)
- Undo/Redo toolbar buttons with disabled state
- Node duplication (button and keyboard)
- Drag-and-drop hierarchy reordering
- Hierarchy per-item duplicate button on hover
- UndoManager class with full serialize/deserialize state snapshots
- Undo revision tracking for React reactivity

### Improved
- Hierarchy panel supports drag-to-reparent
- Snapshot taken before mutations (add, remove, duplicate, move)
- Console logs undo/redo/duplicate actions

### Tested
- 15 Playwright E2E tests for undo/redo and hierarchy
- All v1-v5 tests still passing (69 tests total)

## v6.0.0-rc.1 (2026-08-16) - Pre-Release

## v5.0.0 (2026-08-16) - LTS Release

### Added
- Scene serialization and deserialization (JSON format)
- Save/Load to browser localStorage
- Scene download as .json file
- Scene import from .json file
- New scene creation
- File menu UI with scene name input
- Scene name display in toolbar
- SceneSerializer class with full round-trip serialization
- Node ID counter persistence across save/load
- Light serialization (all light types and properties)
- Material serialization (all PBR properties)

### Fixed
- Deserialized scene now correctly rebuilds root node child references

### Tested
- 14 Playwright E2E tests for serialization
- All v1-v4 tests still passing (54 tests total)

## v5.0.0-rc.1 (2026-08-16) - Pre-Release

## v4.0.0 (2026-08-16) - LTS Release

### Added
- Multi-light system supporting up to 8 concurrent lights
- Three light types: Directional, Point, Spot
- Per-light properties: position, direction, color, intensity, range
- Spot light cone angles (inner/outer)
- Light enable/disable toggle
- Light panel UI with light list and inspector
- Default Sun (directional light) in new scenes
- Multi-light PBR shader with attenuation and spot cone

### Improved
- Fragment shader refactored for per-light contribution loop
- Light state management with immutable array updates
- Scene now holds lights array and ambient color

### Tested
- 15 Playwright E2E tests for lighting system
- All v1/v2/v3 tests still passing (39 tests total)

## v4.0.0-rc.1 (2026-08-16) - Pre-Release

## v3.0.0 (2026-08-16) - LTS Release

### Added
- PBR-based material shader with Cook-Torrance BRDF (GGX distribution, Smith geometry, Schlick fresnel)
- Metallic and roughness material parameters with sliders
- Emissive color and intensity controls
- Texture support (UV tiling, offset, checker texture)
- Material presets: Default, Metal, Plastic, Emissive, Glass-like
- Double-sided rendering toggle
- Texture loading infrastructure (loadTextureFromImage, createCheckerTexture)
- Enhanced Inspector with full material editing UI

### Improved
- Fragment shader upgraded from Blinn-Phong to physically-based rendering
- Material state uses immutable Map updates for proper React reactivity
- Inspector panel reorganized with collapsible sections

### Tested
- 13 Playwright E2E tests for material system
- All v1/v2 tests still passing (26 tests)

## v3.0.0-rc.1 (2026-08-16) - Pre-Release

## v2.0.0 (2026-08-16) - LTS Release

### Added
- Orbit camera controller with rotate, pan, and zoom
- Ray-based object picking via screen-to-world ray casting
- Selection highlight with wireframe overlay
- Gizmo mode controls (Translate, Rotate, Scale)
- Keyboard shortcuts (W/E/R for gizmo modes, F for frame, 1/2/3 for primitives, Delete for removal)
- Frame selected object functionality
- Context menu prevention on viewport canvas

### Improved
- Camera state managed via OrbitCamera class with spherical coordinates
- Viewport mouse interaction (left-click select, right-drag orbit, middle-drag pan, wheel zoom)

### Tested
- 14 Playwright E2E tests for viewport navigation and selection
- All v1 tests still passing (12 tests)

## v2.0.0-rc.1 (2026-08-16) - Pre-Release

## v1.0.0 (2026-08-16) - LTS Release

### Added
- Project scaffold with React + Vite + TypeScript
- Custom math library: Vec2, Vec3, Vec4, Color, Mat4
- Scene graph with SceneNode and Scene classes
- WebGL2 renderer with Blinn-Phong shading
- Procedural geometry: Cube, Sphere, Plane, Cylinder, Cone
- Material system with base color
- Grid rendering for spatial reference
- Editor UI: Toolbar, Hierarchy, Viewport, Inspector, Console
- Zustand-based state management
- ESLint, Prettier, Vitest, Playwright configuration

### Tested
- 12 Playwright E2E tests passing
- TypeScript strict mode compliance
- Production build verification

## v1.0.0-rc.1 (2026-08-16) - Pre-Release
- Project scaffold with React + Vite + TypeScript
- Custom math library: Vec2, Vec3, Vec4, Color, Mat4
- Scene graph with SceneNode and Scene classes
- WebGL2 renderer with Blinn-Phong shading
- Procedural geometry: Cube, Sphere, Plane, Cylinder, Cone
- Material system with base color
- Grid rendering for spatial reference
- Editor UI: Toolbar, Hierarchy, Viewport, Inspector, Console
- Zustand-based state management
- ESLint, Prettier, Vitest, Playwright configuration

