# Version History

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
