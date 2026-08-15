# NOISE3D

A WebGL2-based 3D/2D scene editor inspired by Unity and Blender, built with React and Vite. This editor provides a full scene editing experience with a custom rendering engine -- no third-party 3D libraries (Three.js, Babylon.js, etc.) are used.

## Features

- Custom WebGL2 rendering engine with GLSL shaders
- Scene hierarchy with parent-child relationships
- Transform editing (position, rotation, scale)
- Basic material system with color properties
- Grid rendering for spatial reference
- Console panel for editor logging
- Primitive geometry: Cube, Sphere, Plane, Cylinder, Cone

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in a WebGL2-compatible browser.

## Build

```bash
npm run build
npm run preview
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |

## Architecture

```
src/
  math/           Math library (Vec2, Vec3, Vec4, Color, Mat4)
  scene/          Scene graph (SceneNode, Scene)
  renderer/       WebGL2 renderer, geometry, materials, shaders
  core/           Editor state management (Zustand store)
  ui/             React UI components
    panels/       Editor panels (Viewport, Hierarchy, Inspector, Console)
```

## License

MIT
