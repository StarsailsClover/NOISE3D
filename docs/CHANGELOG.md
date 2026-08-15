# Version History

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
