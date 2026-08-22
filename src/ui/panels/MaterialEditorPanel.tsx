import { useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import {
  createShaderNode, createEmptyShaderGraph, compileShaderGraph,
  canConnect, serializeShaderGraph,
  type ShaderGraph, type ShaderGraphNode, type ShaderNodeType,
} from '@renderer/ShaderGraph';

const NODE_TYPES: { type: ShaderNodeType; label: string }[] = [
  { type: 'color', label: 'Color' },
  { type: 'texture', label: 'Texture' },
  { type: 'mix', label: 'Mix' },
  { type: 'math', label: 'Math' },
  { type: 'vector', label: 'Vector' },
  { type: 'normal', label: 'Normal' },
  { type: 'multiply', label: 'Multiply' },
  { type: 'add', label: 'Add' },
  { type: 'subtract', label: 'Subtract' },
];

export function MaterialEditorPanel() {
  const log = useEditorStore((s) => s.log);
  const [graph, setGraph] = useState<ShaderGraph>(() => createEmptyShaderGraph());
  const [compiling, setCompiling] = useState(false);
  const [compiledCode, setCompiledCode] = useState('');

  const addNode = (type: ShaderNodeType) => {
    const node = createShaderNode(type, 100 + Math.random() * 200, 100 + Math.random() * 100);
    setGraph({ ...graph, nodes: [...graph.nodes, node] });
  };

  const removeNode = (nodeId: string) => {
    setGraph({
      ...graph,
      nodes: graph.nodes.filter((n) => n.id !== nodeId),
      connections: graph.connections.filter((c) => c.fromNode !== nodeId && c.toNode !== nodeId),
    });
  };

  const connect = (fromNode: string, fromSocket: string, toNode: string, toSocket: string) => {
    const fromNodeObj = graph.nodes.find((n) => n.id === fromNode);
    const toNodeObj = graph.nodes.find((n) => n.id === toNode);
    if (!fromNodeObj || !toNodeObj) return;

    const fromSocketObj = fromNodeObj.outputs.find((s) => s.id === fromSocket);
    const toSocketObj = toNodeObj.inputs.find((s) => s.id === toSocket);
    if (!fromSocketObj || !toSocketObj) return;

    if (!canConnect(fromSocketObj, toSocketObj)) {
      log('warn', `Cannot connect ${fromSocketObj.type} to ${toSocketObj.type}`);
      return;
    }

    const conn = {
      id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromNode, fromSocket, toNode, toSocket,
    };
    setGraph({ ...graph, connections: [...graph.connections, conn] });
    log('info', `Connected ${fromNode}:${fromSocket} -> ${toNode}:${toSocket}`);
  };

  const disconnect = (connId: string) => {
    setGraph({ ...graph, connections: graph.connections.filter((c) => c.id !== connId) });
  };

  const compile = () => {
    setCompiling(true);
    const code = compileShaderGraph(graph);
    setCompiledCode(code);
    setCompiling(false);
    log('info', `Shader graph compiled: ${code.split('\n').length} lines`);
  };

  const save = () => {
    const json = serializeShaderGraph(graph);
    log('info', `Material saved (${json.length} bytes)`);
  };

  return (
    <div className="panel material-editor-panel">
      <div className="panel-header">
        <span className="panel-title">Material Editor</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={compile} disabled={compiling}>
            {compiling ? 'Compiling...' : 'Compile'}
          </button>
          <button className="panel-btn" onClick={save}>Save</button>
        </div>
      </div>
      <div className="panel-body">
        <div className="node-palette">
          {NODE_TYPES.map((nt) => (
            <button
              key={nt.type}
              className="node-palette-btn"
              onClick={() => addNode(nt.type)}
            >
              {nt.label}
            </button>
          ))}
        </div>

        <div className="node-graph-canvas">
          {graph.nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              connections={graph.connections}
              onRemove={removeNode}
              onConnect={connect}
              onDisconnect={disconnect}
            />
          ))}
          {graph.nodes.length === 0 && (
            <div className="node-graph-empty">No nodes. Add from palette above.</div>
          )}
        </div>

        {compiledCode && (
          <div className="compiled-output">
            <label className="inspector-label">Compiled Shader</label>
            <pre className="compiled-code">{compiledCode}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeCard({ node, connections, onRemove, onConnect, onDisconnect }: {
  node: ShaderGraphNode;
  connections: { id: string; fromNode: string; fromSocket: string; toNode: string; toSocket: string }[];
  onRemove: (id: string) => void;
  onConnect: (fromNode: string, fromSocket: string, toNode: string, toSocket: string) => void;
  onDisconnect: (connId: string) => void;
}) {
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const handleOutputClick = (socketId: string) => {
    if (connectingFrom) {
      setConnectingFrom(null);
    } else {
      setConnectingFrom(socketId);
    }
  };

  const handleInputClick = (socketId: string) => {
    if (connectingFrom) {
      onConnect(node.id, connectingFrom, node.id, socketId);
      setConnectingFrom(null);
    }
  };

  return (
    <div
      className="shader-node-card"
      style={{ left: node.position.x, top: node.position.y }}
    >
      <div className="shader-node-header">
        <span className="shader-node-title">{node.type}</span>
        {node.type !== 'output' && (
          <button className="shader-node-remove" onClick={() => onRemove(node.id)}>x</button>
        )}
      </div>
      <div className="shader-node-body">
        {node.inputs.length > 0 && (
          <div className="shader-node-inputs">
            {node.inputs.map((input) => {
              const conn = connections.find((c) => c.toNode === node.id && c.toSocket === input.id);
              return (
                <div key={input.id} className="shader-socket-row">
                  <button
                    className={`shader-socket socket-input ${conn ? 'connected' : ''}`}
                    onClick={() => handleInputClick(input.id)}
                    title={input.type}
                  >
                    {input.name}
                  </button>
                  {conn && (
                    <button className="socket-disconnect" onClick={() => onDisconnect(conn.id)}>x</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {node.outputs.length > 0 && (
          <div className="shader-node-outputs">
            {node.outputs.map((output) => (
              <button
                key={output.id}
                className={`shader-socket socket-output ${connectingFrom === output.id ? 'connecting' : ''}`}
                onClick={() => handleOutputClick(output.id)}
                title={output.type}
              >
                {output.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
