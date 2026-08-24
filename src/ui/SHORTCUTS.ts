export interface ShortcutEntry {
  keys: string;
  description: string;
  group: string;
}

export const SHORTCUTS: ShortcutEntry[] = [
  // Tools
  { keys: 'W', description: 'Move gizmo', group: 'Tools' },
  { keys: 'E', description: 'Rotate gizmo', group: 'Tools' },
  { keys: 'R', description: 'Scale gizmo', group: 'Tools' },
  { keys: 'Q', description: 'Fly speed down (in fly)', group: 'Tools' },

  // Camera
  { keys: 'Alt+LMB Drag', description: 'Orbit camera', group: 'Camera' },
  { keys: 'MMB Drag', description: 'Pan camera', group: 'Camera' },
  { keys: 'Wheel', description: 'Zoom', group: 'Camera' },
  { keys: 'Hold RMB', description: 'Flythrough (WASD move, Q/E down/up)', group: 'Camera' },
  { keys: 'Shift (fly)', description: 'Fast fly', group: 'Camera' },
  { keys: 'F', description: 'Frame selected', group: 'Camera' },
  { keys: 'Home', description: 'Frame all (isometric)', group: 'Camera' },
  { keys: 'Numpad 1 / 3 / 7', description: 'Front / Right / Top view', group: 'Camera' },
  { keys: 'Numpad 5', description: 'Perspective / Orthographic', group: 'Camera' },

  // Editing
  { keys: 'Ctrl+Z', description: 'Undo', group: 'Editing' },
  { keys: 'Ctrl+Y / Ctrl+Shift+Z', description: 'Redo', group: 'Editing' },
  { keys: 'Ctrl+D', description: 'Duplicate selected', group: 'Editing' },
  { keys: 'Delete / Backspace', description: 'Delete selected', group: 'Editing' },
  { keys: '1 / 2 / 3', description: 'Add Cube / Sphere / Plane', group: 'Editing' },
  { keys: 'Ctrl+G', description: 'Toggle grid', group: 'Editing' },
  { keys: 'Ctrl (drag)', description: 'Snap: 0.5u move / 15deg rotate / 0.1 scale', group: 'Editing' },

  // Fields
  { keys: 'ArrowUp / ArrowDown', description: 'Nudge field value by step', group: 'Number Fields' },
  { keys: 'Shift+Arrow', description: 'Nudge x10', group: 'Number Fields' },
  { keys: 'Alt+Arrow', description: 'Nudge x0.1', group: 'Number Fields' },
  { keys: 'Enter / Esc', description: 'Commit / revert field edit', group: 'Number Fields' },
  { keys: 'LMB-drag field', description: 'Scrub value (Shift precision, Ctrl snap)', group: 'Number Fields' },
  { keys: 'Ctrl+Wheel (field)', description: 'Step value', group: 'Number Fields' },
  { keys: 'Minus (hover)', description: 'Negate field value', group: 'Number Fields' },
];
