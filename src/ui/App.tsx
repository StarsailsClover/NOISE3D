import { Toolbar } from './Toolbar';
import { ViewportPanel } from './panels/ViewportPanel';
import { HierarchyPanel } from './panels/HierarchyPanel';
import { InspectorPanel } from './panels/InspectorPanel';
import { ConsolePanel } from './panels/ConsolePanel';
import { LightPanel } from './panels/LightPanel';
import { AssetPanel } from './panels/AssetPanel';
import { RenderSettingsPanel } from './panels/RenderSettingsPanel';
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
          <AssetPanel />
        </div>
        <div className="app-center">
          <ViewportPanel />
          <ConsolePanel />
        </div>
        <div className="app-right">
          <InspectorPanel />
          <RenderSettingsPanel />
        </div>
      </div>
    </div>
  );
}
