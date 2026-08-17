import { useEffect } from 'react';
import { useEditorStore } from '@core/EditorStore';

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
        if (e.key === 'a') {
          e.preventDefault();
          useEditorStore.getState().selectAllNodes();
          return;
        }
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
