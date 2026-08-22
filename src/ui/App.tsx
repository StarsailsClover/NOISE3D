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

export function App() {
  useKeyboardShortcuts();

  return (
    <div className="app-layout">
      <Toolbar />
      <div className="app-body">
        <div className="app-left">
          <HierarchyPanel />
          <LightPanel />
          <EnvironmentPanel />
          <ParticlePanel />
          <AssetPanel />
          <PluginManagerPanel />
        </div>
        <div className="app-center">
          <ViewportPanel />
          <TimelinePanel />
          <ConsolePanel />
        </div>
        <div className="app-right">
          <InspectorPanel />
          <MeshEditPanel />
          <CurveEditorPanel />
          <RenderSettingsPanel />
          <CodeEditorPanel />
          <MaterialEditorPanel />
        </div>
      </div>
    </div>
  );
}
