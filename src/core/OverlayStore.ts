import { create } from 'zustand';

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  separatorBefore?: boolean;
}

interface OverlayState {
  menu: {
    open: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null;
  shortcutHelpOpen: boolean;
  paletteOpen: boolean;
  recentCommands: string[];
  openMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  closeMenu: () => void;
  toggleShortcutHelp: () => void;
  setShortcutHelp: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  pushRecentCommand: (id: string) => void;
}

const RECENT_KEY = 'noise3d:recent-commands';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* ignore */ }
  return [];
}

// GitHub@NDBlockConnect | BlockConnect@StarsailsClover

export const useOverlayStore = create<OverlayState>((set, get) => ({
  menu: null,
  shortcutHelpOpen: false,
  paletteOpen: false,
  recentCommands: loadRecent(),
  openMenu: (x, y, items) => set({ menu: { open: true, x, y, items } }),
  closeMenu: () => set({ menu: null }),
  toggleShortcutHelp: () => set({ shortcutHelpOpen: !get().shortcutHelpOpen }),
  setShortcutHelp: (open) => set({ shortcutHelpOpen: open }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  pushRecentCommand: (id) => {
    const next = [id, ...get().recentCommands.filter((r) => r !== id)].slice(0, MAX_RECENT);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    set({ recentCommands: next });
  },
}));
