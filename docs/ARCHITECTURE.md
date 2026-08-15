# NOISE3D Architecture

## Overview

NOISE3D is a browser-based 3D/2D scene editor built on WebGL2. It does not use any third-party 3D rendering library. All rendering, math, and scene management code is written from scratch.

## Module Structure

### Math Library (`src/math/`)

- **Vec2, Vec3, Vec4**: Vector types with common operations (add, sub, scale, dot, cross, normalize, lerp).
- **Color**: RGBA color type with hex conversion utilities.
- **Mat4**: 4x4 matrix for transformations, perspective/orthographic projection, lookAt, TRS composition, and inversion.

### Scene Graph (`src/scene/`)

- **SceneNode**: A node in the scene tree with transform (position, rotation, scale), visibility, and parent-child links.
- **Scene**: Container managing all nodes, supporting add, remove, move, and serialization.

### Renderer (`src/renderer/`)

- **Renderer**: Core WebGL2 rendering class. Manages shader programs, mesh buffers, camera, lighting, and grid rendering.
- **GeometryGenerator**: Procedural mesh generation for cube, sphere, plane, cylinder, cone.
- **Material**: Material definition with base color, metallic, roughness, wireframe properties.
- **Shaders**: GLSL ES 3.00 shader sources for mesh rendering, grid, and line drawing.

### Core (`src/core/`)

- **EditorStore**: Zustand-based global state store. Manages scene data, selection, materials, camera, console messages, and all editor actions.

### UI (`src/ui/`)

- **App**: Root layout with three-column design (Hierarchy | Viewport+Console | Inspector).
- **Toolbar**: Top toolbar with primitive creation, grid toggle, play/stop.
- **ViewportPanel**: Canvas container that initializes and drives the WebGL2 renderer.
- **HierarchyPanel**: Tree view of scene nodes with selection and deletion.
- **InspectorPanel**: Property editor for selected node (transform, material).
- **ConsolePanel**: Log output panel.

## Rendering Pipeline

1. Clear color and depth buffers
2. Set up perspective projection and view matrix (lookAt)
3. Render grid (if enabled) using grid shader program
4. For each visible scene node:
   - Get or create cached GL mesh for primitive type
   - Compute model matrix from TRS
   - Compute normal matrix (inverse of model)
   - Set uniforms (model, view, projection, normal, material, lighting)
   - Draw elements

## Shader Details

The main shader implements Blinn-Phong lighting with:
- Ambient term (configurable ambient color)
- Diffuse term (directional light)
- Specular term (Blinn-Phong half-vector model)

## State Management

The editor uses Zustand for global state. The store holds:
- Scene graph instance
- Selected node ID
- Material map (node ID to material)
- Camera position and target
- Console messages
- UI state (grid visibility, play mode)

React components subscribe to store slices and re-render on changes. The render loop runs independently via requestAnimationFrame, reading current state each frame.
