# Version History

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
