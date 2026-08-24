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
  openMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  closeMenu: () => void;
  toggleShortcutHelp: () => void;
  setShortcutHelp: (open: boolean) => void;
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  menu: null,
  shortcutHelpOpen: false,
  openMenu: (x, y, items) => set({ menu: { open: true, x, y, items } }),
  closeMenu: () => set({ menu: null }),
  toggleShortcutHelp: () => set({ shortcutHelpOpen: !get().shortcutHelpOpen }),
  setShortcutHelp: (open) => set({ shortcutHelpOpen: open }),
}));
