import { useState, useRef } from 'react';
import { useEditorStore } from '@core/EditorStore';

const DEFAULT_SCRIPT = `// NOISE3D Script API
// Available globals:
//   scene     - The current Scene
//   nodes     - All scene nodes
//   lights    - All lights
//   log(msg)  - Log to console

// Example: move all cubes up by 1
// for (const node of nodes) {
//   if (node.type === 'cube') {
//     node.position.y += 1;
//   }
// }

// Example: rotate first sphere
// const sphere = nodes.find(n => n.type === 'sphere');
// if (sphere) {
//   sphere.rotation.y += 0.5;
// }
`;

export function CodeEditorPanel() {
  const [code, setCode] = useState(DEFAULT_SCRIPT);
  const [output, setOutput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scene = useEditorStore((s) => s.scene);
  const log = useEditorStore((s) => s.log);

  const runScript = () => {
    setOutput('');
    const logs: string[] = [];
    const nodes = scene.getAllNodes();
    const lights = scene.lights;

    const sandboxLog = (msg: string) => {
      logs.push(msg);
      log('info', `[script] ${msg}`);
    };

    try {
      const fn = new Function('scene', 'nodes', 'lights', 'log', code);
      fn(scene, nodes, lights, sandboxLog);
      useEditorStore.setState({ scene, undoRevision: useEditorStore.getState().undoRevision + 1 });
      setOutput(logs.length > 0 ? logs.join('\n') : 'Script executed successfully.');
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setOutput(`Error: ${errMsg}`);
      log('error', `[script] ${errMsg}`);
    }
  };

  const clearCode = () => {
    setCode(DEFAULT_SCRIPT);
    setOutput('');
  };

  return (
    <div className="panel code-editor-panel">
      <div className="panel-header">
        <span className="panel-title">Script Editor</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={runScript} title="Run Script">Run</button>
          <button className="panel-btn" onClick={clearCode} title="Reset">Reset</button>
        </div>
      </div>
      <div className="panel-body code-editor-body">
        <textarea
          ref={textareaRef}
          className="code-textarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          placeholder="// Write JavaScript here..."
        />
        {output && (
          <div className="code-output">
            <div className="code-output-header">Output:</div>
            <pre className="code-output-text">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
