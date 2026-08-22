import type { ReactNode } from 'react';
import { Toolbar } from './Toolbar';
import { ViewportPanel } from './panels/ViewportPanel';
import { HierarchyPanel } from './panels/HierarchyPanel';
import { InspectorPanel } from './panels/InspectorPanel';
import { ConsolePanel } from './panels/ConsolePanel';
import { LightPanel } from './panels/LightPanel';
import { AssetPanel } from './panels/AssetPanel';
import { RenderSettingsPanel } from './panels/RenderSettingsPanel';
import { TimelinePanel } from './panels/TimelinePanel';
import { ParticlePanel } from './panels/ParticlePanel';
import { CodeEditorPanel } from './panels/CodeEditorPanel';
import { MaterialEditorPanel } from './panels/MaterialEditorPanel';
import { EnvironmentPanel } from './panels/EnvironmentPanel';
import { MeshEditPanel } from './panels/MeshEditPanel';
import { CurveEditorPanel } from './panels/CurveEditorPanel';
import { PluginManagerPanel } from './panels/PluginManagerPanel';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import {
  useWorkspaceStore,
  WORKSPACES,
  type PanelId,
} from '@core/WorkspaceStore';

const PANEL_COMPONENTS: Record<Exclude<PanelId, 'viewport'>, () => ReactNode> = {
  hierarchy: HierarchyPanel,
  light: LightPanel,
  environment: EnvironmentPanel,
  particle: ParticlePanel,
  asset: AssetPanel,
  'plugin-manager': PluginManagerPanel,
  timeline: TimelinePanel,
  console: ConsolePanel,
  inspector: InspectorPanel,
  'mesh-edit': MeshEditPanel,
  'curve-editor': CurveEditorPanel,
  'render-settings': RenderSettingsPanel,
  'code-editor': CodeEditorPanel,
  'material-editor': MaterialEditorPanel,
};

function PanelSlot({ id }: { id: Exclude<PanelId, 'viewport'> }) {
  const collapsed = useWorkspaceStore(
    (s) => s.collapsed[s.active].has(id),
  );
  const toggleCollapsed = useWorkspaceStore((s) => s.togglePanelCollapsed);
  const Component = PANEL_COMPONENTS[id];

  const handleHeaderClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.panel-header')) return;
    if (target.closest('button') || target.closest('input')) return;
    toggleCollapsed(id);
  };

  return (
    <div
      className={`panel-slot ${collapsed ? 'slot-collapsed' : ''}`}
      data-panel-id={id}
    >
      <div className="panel-slot-inner" onClick={handleHeaderClick}>
        <span className={`collapse-chevron ${collapsed ? 'closed' : ''}`} aria-hidden>
          {'\u25BE'}
        </span>
        <Component />
      </div>
    </div>
  );
}

export function App() {
  useKeyboardShortcuts();
  const active = useWorkspaceStore((s) => s.active);
  const def = WORKSPACES.find((w) => w.id === active) ?? WORKSPACES[0];

  return (
    <div className="app-layout" data-workspace={active}>
      <Toolbar />
      <div className="app-body">
        <div className="app-left">
          {def.left.map((id) => (
            <PanelSlot key={id} id={id as Exclude<PanelId, 'viewport'>} />
          ))}
        </div>
        <div className="app-center">
          {def.center.includes('viewport') && <ViewportPanel />}
          {def.center
            .filter((id): id is Exclude<PanelId, 'viewport'> => id !== 'viewport')
            .map((id) => (
              <PanelSlot key={id} id={id} />
            ))}
        </div>
        <div className="app-right">
          {def.right.map((id) => (
            <PanelSlot key={id} id={id as Exclude<PanelId, 'viewport'>} />
          ))}
        </div>
      </div>
    </div>
  );
}
