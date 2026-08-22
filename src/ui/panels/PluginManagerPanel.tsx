import { useState } from 'react';
import { pluginManager, registerBuiltinPlugins } from '@core/PluginSystem';
import { useEditorStore } from '@core/EditorStore';

export function PluginManagerPanel() {
  const [, setRefresh] = useState(0);
  const log = useEditorStore((s) => s.log);
  const plugins = pluginManager.getPlugins();

  const togglePlugin = (id: string) => {
    if (pluginManager.isEnabled(id)) {
      pluginManager.disable(id);
      log('info', `Plugin disabled: ${id}`);
    } else {
      pluginManager.enable(id);
      log('info', `Plugin enabled: ${id}`);
    }
    setRefresh((n) => n + 1);
  };

  const installBuiltin = () => {
    registerBuiltinPlugins(log);
    setRefresh((n) => n + 1);
    log('info', 'Built-in plugins installed');
  };

  const runTool = (toolId: string) => {
    pluginManager.toolLogHandler = (msg) => log('info', `[plugin] ${msg}`);
    if (pluginManager.executeTool(toolId)) {
      setRefresh((n) => n + 1);
    }
  };

  return (
    <div className="panel plugin-manager-panel">
      <div className="panel-header">
        <span className="panel-title">Plugins</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={installBuiltin} title="Install built-in plugins">Install</button>
        </div>
      </div>
      <div className="panel-body">
        {plugins.length === 0 ? (
          <div className="plugin-empty">No plugins installed. Click Install.</div>
        ) : (
          plugins.map((plugin) => (
            <div key={plugin.manifest.id} className="plugin-item">
              <div className="plugin-item-header">
                <span className={`plugin-status-dot ${pluginManager.isEnabled(plugin.manifest.id) ? 'on' : 'off'}`} />
                <span className="plugin-name">{plugin.manifest.name}</span>
                <button
                  className="plugin-toggle"
                  onClick={() => togglePlugin(plugin.manifest.id)}
                >
                  {pluginManager.isEnabled(plugin.manifest.id) ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="plugin-meta">
                v{plugin.manifest.version} by {plugin.manifest.author}
              </div>

              {pluginManager.isEnabled(plugin.manifest.id) && (
                <>
                  {pluginManager.getPanels().filter((p) => p.pluginId === plugin.manifest.id).map(({ panel }) => (
                    <div key={panel.id} className="plugin-panel-preview">
                      <div className="plugin-panel-title">{panel.title}</div>
                      <div className="plugin-panel-content">{panel.render()}</div>
                    </div>
                  ))}
                  {pluginManager.getTools().filter((t) => t.pluginId === plugin.manifest.id).map(({ tool }) => (
                    <button
                      key={tool.id}
                      className="mesh-op-btn"
                      onClick={() => runTool(tool.id)}
                    >
                      {tool.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
