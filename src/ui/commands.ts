import { PrimitiveType } from '@scene/Scene';
import { useEditorStore } from '@core/EditorStore';
import { useOverlayStore } from '@core/OverlayStore';
import { useWorkspaceStore } from '@core/WorkspaceStore';
import { pluginManager } from '@core/PluginSystem';

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

export interface CommandDef {
  id: string;
  label: string;
  keys?: string;
  group: string;
  run: () => void;
}

/** Build the full command registry. Safe to call on every palette open. */
export function buildCommands(): CommandDef[] {
  const S = () => useEditorStore.getState();
  const cmds: CommandDef[] = [];
  const push = (id: string, label: string, group: string, run: () => void, keys?: string) =>
    cmds.push({ id, label, group, run, keys });

  // Primitives
  const prims: [PrimitiveType, string, string?][] = [
    ['cube', 'Add Cube', '1'],
    ['sphere', 'Add Sphere', '2'],
    ['plane', 'Add Plane', '3'],
    ['cylinder', 'Add Cylinder'],
    ['cone', 'Add Cone'],
  ];
  for (const [t, label, keys] of prims) {
    push(`add.${t}`, label, 'Create', () => S().addPrimitive(t), keys);
  }

  // Views
  const views: [string, string, string?][] = [
    ['front', 'View: Front', 'Numpad 1'],
    ['right', 'View: Right', 'Numpad 3'],
    ['top', 'View: Top', 'Numpad 7'],
    ['back', 'View: Back'],
    ['left', 'View: Left'],
    ['bottom', 'View: Bottom'],
  ];
  for (const [v, label, keys] of views) {
    push(`view.${v}`, label, 'Camera',
      () => window.dispatchEvent(new CustomEvent('viewport-view-preset', { detail: v })), keys);
  }
  push('view.iso', 'View: Isometric (frame all)', 'Camera',
    () => window.dispatchEvent(new CustomEvent('viewport-frame-all')), 'Home');
  push('view.projection', 'Toggle Perspective/Orthographic', 'Camera',
    () => window.dispatchEvent(new CustomEvent('viewport-toggle-projection')), 'Numpad 5');
  push('camera.frameSelected', 'Frame Selected', 'Camera', () => S().frameSelected(), 'F');

  // Gizmo modes
  push('gizmo.translate', 'Gizmo: Move', 'Tools', () => S().setGizmoMode('translate'), 'W');
  push('gizmo.rotate', 'Gizmo: Rotate', 'Tools', () => S().setGizmoMode('rotate'), 'E');
  push('gizmo.scale', 'Gizmo: Scale', 'Tools', () => S().setGizmoMode('scale'), 'R');

  // Scene files
  push('scene.new', 'New Scene', 'File', () => S().newScene());
  push('scene.save', 'Save Scene to Browser', 'File', () => {
    const s = S();
    s.saveScene(s.sceneName);
  }, 'Ctrl+S');
  push('scene.load', 'Load Scene from Browser', 'File', () => {
    const s = S();
    s.loadScene(s.sceneName);
  });
  push('scene.downloadJson', 'Download Scene JSON', 'File',
    () => { const s = S(); s.downloadScene(s.sceneName); });
  push('export.obj', 'Export OBJ', 'Export', () => S().exportOBJ());
  push('export.json', 'Export JSON', 'Export', () => S().exportJSON());
  push('export.png', 'Export PNG Screenshot', 'Export', () => S().exportPNG());

  // Toggles
  push('toggle.grid', 'Toggle Grid', 'View', () => S().toggleGrid(), 'Ctrl+G');
  push('toggle.mode2d', 'Toggle 2D/3D Mode', 'View', () => S().toggleEditorMode());
  push('toggle.physics', 'Toggle Physics', 'View', () => S().togglePhysics());
  push('toggle.physicsDebug', 'Toggle Physics Debug', 'View', () => S().togglePhysicsDebug());
  push('help.shortcuts', 'Keyboard Shortcuts', 'Help',
    () => useOverlayStore.getState().toggleShortcutHelp(), '?');

  // Workspaces
  for (const w of ['layout', 'modeling', 'shading', 'animation', 'rendering'] as const) {
    push(`ws.${w}`, `Workspace: ${w.charAt(0).toUpperCase() + w.slice(1)}`, 'View', () =>
      useWorkspaceStore.getState().setActive(w));
  }

  // Plugin tools
  for (const { pluginId, tool } of pluginManager.getTools()) {
    push(`plugin.${pluginId}.${tool.id}`, `Plugin: ${tool.name}`, 'Plugins', () => {
      pluginManager.toolLogHandler = (msg) =>
        useEditorStore.getState().log('info', `[plugin] ${msg}`);
      pluginManager.executeTool(tool.id);
    });
  }

  return cmds;
}

/** Simple fuzzy rank: substring index, else subsequence, else -1. */
export function fuzzyRank(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const idx = t.indexOf(q);
  if (idx >= 0) return idx;
  // subsequence
  let ti = 0;
  for (const ch of q) {
    ti = t.indexOf(ch, ti);
    if (ti < 0) return -1;
    ti += 1;
  }
  return 1000 + ti;
}

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

