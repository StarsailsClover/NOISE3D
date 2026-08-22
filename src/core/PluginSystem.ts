export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
}

export interface PluginContext {
  registerPanel: (panel: RegisteredPanel) => void;
  registerTool: (tool: RegisteredTool) => void;
  log: (level: 'info' | 'warn' | 'error', text: string) => void;
  getSceneStats: () => { nodes: number; lights: number };
}

export interface RegisteredPanel {
  id: string;
  title: string;
  render: () => string;
}

export interface RegisteredTool {
  id: string;
  name: string;
  execute: () => void;
}

export interface Plugin {
  manifest: PluginManifest;
  enabled: boolean;
  activate: (ctx: PluginContext) => void;
  deactivate?: () => void;
}

type PluginEvent = 'onSceneLoad' | 'onNodeSelect' | 'onRender';

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private panels: Map<string, RegisteredPanel[]> = new Map();
  private tools: Map<string, RegisteredTool[]> = new Map();
  private eventHandlers: Map<PluginEvent, Set<() => void>> = new Map();

  register(plugin: Plugin): boolean {
    if (this.plugins.has(plugin.manifest.id)) return false;
    this.plugins.set(plugin.manifest.id, plugin);
    this.panels.set(plugin.manifest.id, []);
    this.tools.set(plugin.manifest.id, []);
    return true;
  }

  public toolLogHandler: ((msg: string) => void) | null = null;

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin?.deactivate) plugin.deactivate();
    this.plugins.delete(pluginId);
    this.panels.delete(pluginId);
    this.tools.delete(pluginId);
  }

  enable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || plugin.enabled) return;

    const ctx: PluginContext = {
      registerPanel: (panel) => {
        this.panels.get(pluginId)?.push(panel);
      },
      registerTool: (tool) => {
        this.tools.get(pluginId)?.push(tool);
      },
      log: (level, text) => {
        console[level](`[plugin:${plugin.manifest.id}] ${text}`);
      },
      getSceneStats: () => ({ nodes: 0, lights: 0 }),
    };

    plugin.activate(ctx);
    plugin.enabled = true;
  }

  disable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) return;
    plugin.deactivate?.();
    plugin.enabled = false;
    this.panels.set(pluginId, []);
    this.tools.set(pluginId, []);
  }

  isEnabled(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.enabled ?? false;
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPanels(): { pluginId: string; panel: RegisteredPanel }[] {
    const result: { pluginId: string; panel: RegisteredPanel }[] = [];
    for (const [pluginId, panels] of this.panels) {
      if (!this.isEnabled(pluginId)) continue;
      for (const panel of panels) result.push({ pluginId, panel });
    }
    return result;
  }

  getTools(): { pluginId: string; tool: RegisteredTool }[] {
    const result: { pluginId: string; tool: RegisteredTool }[] = [];
    for (const [pluginId, tools] of this.tools) {
      if (!this.isEnabled(pluginId)) continue;
      for (const tool of tools) result.push({ pluginId, tool });
    }
    return result;
  }

  executeTool(toolId: string): boolean {
    for (const [, tools] of this.tools) {
      const tool = tools.find((t) => t.id === toolId);
      if (tool) {
        tool.execute();
        return true;
      }
    }
    return false;
  }

  emitEvent(event: PluginEvent): void {
    this.eventHandlers.get(event)?.forEach((h) => h());
  }

  on(event: PluginEvent, handler: () => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }
}

export const pluginManager = new PluginManager();

// ---- Built-in example plugins ----

export function registerBuiltinPlugins(logFn: (l: 'info' | 'warn' | 'error', t: string) => void): void {
  pluginManager.register({
    manifest: {
      id: 'builtin.screenshot-tool',
      name: 'Screenshot Tool',
      version: '1.0.0',
      author: 'NOISE3D',
      description: 'Adds a scene statistics panel and screenshot helper tool',
    },
    enabled: false,
    activate: (ctx) => {
      ctx.registerPanel({
        id: 'scene-stats',
        title: 'Scene Stats',
        render: () => `Nodes: ${ctx.getSceneStats().nodes}`,
      });
      ctx.registerTool({
        id: 'log-stats',
        name: 'Log Scene Stats',
        execute: () => {
          ctx.log('info', 'Screenshot tool executed');
          pluginManager.toolLogHandler?.('Screenshot tool executed');
        },
      });
      ctx.log('info', 'Screenshot Tool activated');
    },
  });

  pluginManager.register({
    manifest: {
      id: 'builtin.csv-importer',
      name: 'CSV Importer',
      version: '1.0.0',
      author: 'NOISE3D',
      description: 'Imports numeric CSV data as keyframe values',
    },
    enabled: false,
    activate: (ctx) => {
      ctx.registerTool({
        id: 'csv-import',
        name: 'Import CSV Keyframes',
        execute: () => ctx.log('info', 'CSV importer ready'),
      });
      ctx.log('info', 'CSV Importer activated');
    },
  });

  void logFn;
}
