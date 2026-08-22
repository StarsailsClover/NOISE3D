import { create } from 'zustand';

export type WorkspaceId = 'layout' | 'modeling' | 'shading' | 'animation' | 'rendering';

export type PanelId =
  | 'hierarchy' | 'light' | 'environment' | 'particle' | 'asset' | 'plugin-manager'
  | 'viewport' | 'timeline' | 'console'
  | 'inspector' | 'mesh-edit' | 'curve-editor' | 'render-settings' | 'code-editor' | 'material-editor';

export interface WorkspaceDef {
  id: WorkspaceId;
  label: string;
  left: PanelId[];
  center: PanelId[];
  right: PanelId[];
}

export const WORKSPACES: WorkspaceDef[] = [
  {
    id: 'layout',
    label: 'Layout',
    left: ['hierarchy'],
    center: ['viewport', 'timeline', 'console'],
    right: ['inspector', 'plugin-manager'],
  },
  {
    id: 'modeling',
    label: 'Modeling',
    left: ['hierarchy', 'asset', 'particle'],
    center: ['viewport', 'console'],
    right: ['inspector', 'mesh-edit'],
  },
  {
    id: 'shading',
    label: 'Shading',
    left: ['hierarchy', 'environment'],
    center: ['viewport', 'console'],
    right: ['inspector', 'render-settings', 'material-editor'],
  },
  {
    id: 'animation',
    label: 'Animation',
    left: ['hierarchy', 'particle'],
    center: ['viewport', 'timeline', 'console'],
    right: ['inspector', 'curve-editor'],
  },
  {
    id: 'rendering',
    label: 'Rendering',
    left: ['hierarchy', 'light', 'environment'],
    center: ['viewport', 'console'],
    right: ['render-settings', 'code-editor'],
  },
];

const LS_ACTIVE = 'noise3d:workspace';
const LS_COLLAPSED = (ws: string) => `noise3d:workspace-collapsed:${ws}`;

function loadActive(): WorkspaceId {
  try {
    const params = new URLSearchParams(window.location.search);
    const ws = params.get('ws');
    if (ws && WORKSPACES.some((w) => w.id === ws)) return ws as WorkspaceId;
    const raw = localStorage.getItem(LS_ACTIVE);
    if (raw && WORKSPACES.some((w) => w.id === raw)) return raw as WorkspaceId;
  } catch { /* ignore */ }
  return 'layout';
}

function loadCollapsed(ws: WorkspaceId): Set<string> {
  try {
    const raw = localStorage.getItem(LS_COLLAPSED(ws));
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

interface WorkspaceState {
  active: WorkspaceId;
  collapsed: Record<WorkspaceId, Set<string>>;
  setActive: (id: WorkspaceId) => void;
  togglePanelCollapsed: (panelId: string) => void;
  isPanelVisible: (column: 'left' | 'center' | 'right', panelId: PanelId) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  active: loadActive(),
  collapsed: {
    layout: loadCollapsed('layout'),
    modeling: loadCollapsed('modeling'),
    shading: loadCollapsed('shading'),
    animation: loadCollapsed('animation'),
    rendering: loadCollapsed('rendering'),
  },

  setActive: (id) => {
    localStorage.setItem(LS_ACTIVE, id);
    set({ active: id });
  },

  togglePanelCollapsed: (panelId) => {
    const ws = get().active;
    const current = new Set(get().collapsed[ws]);
    if (current.has(panelId)) current.delete(panelId);
    else current.add(panelId);
    try {
      localStorage.setItem(LS_COLLAPSED(ws), JSON.stringify([...current]));
    } catch { /* ignore */ }
    set({ collapsed: { ...get().collapsed, [ws]: current } });
  },

  isPanelVisible: (column, panelId) => {
    const def = WORKSPACES.find((w) => w.id === get().active);
    if (!def) return true;
    return def[column].includes(panelId);
  },
}));
