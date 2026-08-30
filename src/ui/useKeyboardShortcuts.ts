import { useEffect } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { useOverlayStore } from '@core/OverlayStore';

export function useKeyboardShortcuts() {
  const addPrimitive = useEditorStore((s) => s.addPrimitive);
  const setGizmoMode = useEditorStore((s) => s.setGizmoMode);
  const removeNode = useEditorStore((s) => s.removeNode);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const frameSelected = useEditorStore((s) => s.frameSelected);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const ov = useOverlayStore.getState();

      // '?' (Shift+/) opens the shortcut cheat sheet
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        ov.toggleShortcutHelp();
        return;
      }

      // Ctrl+K opens the command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ov.setPaletteOpen(!ov.paletteOpen);
        return;
      }

      // Unified Escape chain: close menu > close help > close palette >
      // cancel gizmo > deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        if (ov.menu?.open) {
          ov.closeMenu();
          return;
        }
        if (ov.shortcutHelpOpen) {
          ov.setShortcutHelp(false);
          return;
        }
        if (ov.paletteOpen) {
          ov.setPaletteOpen(false);
          return;
        }
        const g = (window as any).__noise3d_gizmo;
        if (g?.state?.().dragging) {
          g.cancel();
          return;
        }
        useEditorStore.getState().selectNode(null);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
          return;
        }
        if (e.key === 'd' && selectedNodeId !== null) {
          e.preventDefault();
          duplicateNode(selectedNodeId);
          return;
        }
        if (e.key === 'g') {
          e.preventDefault();
          toggleGrid();
          return;
        }
      }

      // View preset shortcuts (Numpad keys)
      if (e.code === 'Numpad1') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('viewport-view-preset', { detail: 'front' }));
        return;
      }
      if (e.code === 'Numpad3') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('viewport-view-preset', { detail: 'right' }));
        return;
      }
      if (e.code === 'Numpad7') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('viewport-view-preset', { detail: 'top' }));
        return;
      }
      if (e.code === 'Numpad5') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('viewport-toggle-projection'));
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w':
          setGizmoMode('translate');
          break;
        case 'e':
          setGizmoMode('rotate');
          break;
        case 'r':
          setGizmoMode('scale');
          break;
        case 'f':
          frameSelected();
          break;
        case 'home':
          window.dispatchEvent(new CustomEvent('viewport-frame-all'));
          break;
        case 'delete':
        case 'backspace':
          if (selectedNodeId !== null) {
            e.preventDefault();
            removeNode(selectedNodeId);
          }
          break;
        case '1':
          addPrimitive('cube');
          break;
        case '2':
          addPrimitive('sphere');
          break;
        case '3':
          addPrimitive('plane');
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addPrimitive, setGizmoMode, removeNode, selectedNodeId, toggleGrid, frameSelected, undo, redo, duplicateNode]);
}

