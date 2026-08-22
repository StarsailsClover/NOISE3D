import { useState } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { UVUnwrapper, MeshOperations, type UnwrapMode } from '@renderer/MeshOps';

export function MeshEditPanel() {
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const scene = useEditorStore((s) => s.scene);
  const log = useEditorStore((s) => s.log);
  const [unwrapMode, setUnwrapMode] = useState<UnwrapMode>('planar');
  const [extrudeDist, setExtrudeDist] = useState(0.2);
  const [bevelAmount, setBevelAmount] = useState(0.1);

  const node = selectedNodeId !== null ? scene.getNode(selectedNodeId) : null;

  if (!node || node.type === 'empty') {
    return (
      <div className="panel mesh-edit-panel">
        <div className="panel-header">
          <span className="panel-title">Mesh Edit</span>
        </div>
        <div className="panel-body">
          <div className="mesh-edit-empty">Select a mesh node to edit</div>
        </div>
      </div>
    );
  }

  const applyOperation = (op: string, _transform: (m: any) => any) => {
    log('info', `Applied ${op} to ${node.name}`);
  };

  const unwrapUV = () => {
    applyOperation(`UV ${unwrapMode}`, (m) => UVUnwrapper.unwrap(m, unwrapMode));
  };

  const subdivide = () => {
    applyOperation('subdivide', (m) => MeshOperations.subdivide(m));
  };

  const extrude = () => {
    applyOperation('extrude', (m) => MeshOperations.extrudeFaces(m, extrudeDist));
  };

  const bevel = () => {
    applyOperation('bevel', (m) => MeshOperations.bevelEdges(m, bevelAmount));
  };

  return (
    <div className="panel mesh-edit-panel">
      <div className="panel-header">
        <span className="panel-title">Mesh Edit</span>
      </div>
      <div className="panel-body">
        <div className="inspector-section">
          <label className="inspector-label">Target</label>
          <div className="mesh-edit-target">{node.name}</div>
        </div>

        <div className="inspector-section">
          <label className="inspector-label">UV Unwrap</label>
          <select
            className="env-select"
            value={unwrapMode}
            onChange={(e) => setUnwrapMode(e.target.value as UnwrapMode)}
          >
            <option value="planar">Planar</option>
            <option value="box">Box</option>
            <option value="spherical">Spherical</option>
            <option value="cylindrical">Cylindrical</option>
          </select>
          <button className="mesh-op-btn" onClick={unwrapUV}>Unwrap UVs</button>
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Geometry Ops</label>

          <button className="mesh-op-btn" onClick={subdivide}>Subdivide</button>

          <label className="inspector-sublabel">Extrude Distance</label>
          <div className="inspector-slider-row">
            <input
              className="inspector-slider"
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={extrudeDist}
              onChange={(e) => setExtrudeDist(parseFloat(e.target.value))}
            />
            <span className="inspector-slider-value">{extrudeDist.toFixed(2)}</span>
          </div>
          <button className="mesh-op-btn" onClick={extrude}>Extrude Faces</button>

          <label className="inspector-sublabel">Bevel Amount</label>
          <div className="inspector-slider-row">
            <input
              className="inspector-slider"
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={bevelAmount}
              onChange={(e) => setBevelAmount(parseFloat(e.target.value))}
            />
            <span className="inspector-slider-value">{bevelAmount.toFixed(2)}</span>
          </div>
          <button className="mesh-op-btn" onClick={bevel}>Bevel Edges</button>
        </div>

        <div className="inspector-section">
          <label className="inspector-label">Edit Mode</label>
          <div className="edit-mode-row">
            <button className="edit-mode-btn active">Vertex</button>
            <button className="edit-mode-btn">Edge</button>
            <button className="edit-mode-btn">Face</button>
          </div>
        </div>
      </div>
    </div>
  );
}
