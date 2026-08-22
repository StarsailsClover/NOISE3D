import { useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import {
  MaterialGraph,
  ShaderNodeType,
  ShaderNode,
  createNode,
  createDefaultGraph,
  addConnection,
  removeNodeFromGraph,
  compileGraph,
} from '@renderer/MaterialGraph';

const PALETTE: { type: ShaderNodeType; label: string }[] = [
  { type: 'color', label: 'Color' },
  { type: 'texture', label: 'Texture' },
  { type: 'mix', label: 'Mix' },
  { type: 'multiply', label: 'Multiply' },
  { type: 'add', label: 'Add' },
  { type: 'subtract', label: 'Subtract' },
  { type: 'vector', label: 'Vector' },
  { type: 'normal', label: 'Normal' },
  { type: 'uv', label: 'UV' },
];

export function MaterialEditorPanel() {
  const [graph, setGraph] = useState<MaterialGraph>(createDefaultGraph());
  const [compiled, setCompiled] = useState<string | null>(null);
  const [pendingSocket, setPendingSocket] = useState<{
    nodeId: string;
    socketId: string;
    isOutput: boolean;
  } | null>(null);

  const log = useEditorStore((s) => s.log);

  const addNode = (type: ShaderNodeType) => {
    setGraph((g) => {
      const node = createNode(type, 40 + Math.random() * 120, 40 + Math.random() * 100);
      return { ...g, nodes: [...g.nodes, node] };
    });
  };

  const removeNode = (nodeId: string) => {
    setGraph((g) => {
      const next = { ...g };
      removeNodeFromGraph(next, nodeId);
      return { ...next, nodes: [...next.nodes], connections: [...next.connections] };
    });
  };

  const handleSocketClick = (node: ShaderNode, socketId: string, isOutput: boolean) => {
    if (!pendingSocket) {
      setPendingSocket({ nodeId: node.id, socketId, isOutput });
      return;
    }

    // Complete or reset connection
    if (pendingSocket.nodeId === node.id && pendingSocket.socketId === socketId) {
      setPendingSocket(null);
      return;
    }

    let result = false;
    setGraph((g) => {
      const next = { ...g, connections: [...g.connections] };
      if (pendingSocket.isOutput && !isOutput) {
        result = addConnection(next, pendingSocket.nodeId, pendingSocket.socketId, node.id, socketId);
      } else if (!pendingSocket.isOutput && isOutput) {
        result = addConnection(next, node.id, socketId, pendingSocket.nodeId, pendingSocket.socketId);
      }
      return next;
    });

    setTimeout(() => {
      if (result) {
        log('info', 'Nodes connected');
      } else {
        log('warn', 'Cannot connect: incompatible types');
      }
    }, 0);
    setPendingSocket(null);
  };

  const isConnectedInput = (nodeId: string, socketId: string) =>
    graph.connections.some((c) => c.toNodeId === nodeId && c.toSocketId === socketId);

  const isConnectedOutput = (nodeId: string, socketId: string) =>
    graph.connections.some((c) => c.fromNodeId === nodeId && c.fromSocketId === socketId);

  const compile = () => {
    const code = compileGraph(graph);
    setCompiled(code);
    log('info', 'Shader graph compiled');
  };

  const saveMaterial = () => {
    localStorage.setItem(`noise3d:matgraph:${Date.now()}`, JSON.stringify(graph));
    log('info', 'Material saved to browser storage');
  };

  return (
    <div className="panel material-editor-panel">
      <div className="panel-header">
        <span className="panel-title">Material Graph</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={compile}>Compile</button>
          <button className="panel-btn" onClick={saveMaterial}>Save</button>
        </div>
      </div>
      <div className="panel-body material-editor-body">
        <div className="node-palette">
          {PALETTE.map((p) => (
            <button
              key={p.type}
              className="node-palette-btn"
              onClick={() => addNode(p.type)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="shader-canvas">
          {graph.nodes.map((node) => (
            <div
              key={node.id}
              className="shader-node-card"
              style={{ left: node.x, top: node.y }}
            >
              <div className="shader-node-header">
                <span className="shader-node-title">{node.title.toLowerCase()}</span>
                {node.type !== 'output' && (
                  <button
                    className="shader-node-remove"
                    onClick={() => removeNode(node.id)}
                  >
                    x
                  </button>
                )}
              </div>
              <div className="shader-node-sockets">
                <div className="socket-column">
                  {node.inputs.map((input) => (
                    <div key={input.id} className="socket-row">
                      <span
                        className={`socket-input ${isConnectedInput(node.id, input.id) ? 'connected' : ''}`}
                        onClick={() => handleSocketClick(node, input.id, false)}
                      >
                        {input.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="socket-column">
                  {node.outputs.map((output) => (
                    <div key={output.id} className="socket-row">
                      <span
                        className={`socket-output ${isConnectedOutput(node.id, output.id) ? 'connected' : ''}`}
                        onClick={() => handleSocketClick(node, output.id, true)}
                      >
                        {output.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {compiled && (
            <pre className="compiled-code">{compiled}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
