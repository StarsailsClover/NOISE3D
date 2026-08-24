import { useRef } from 'react';
import { useEditorStore } from '@core/EditorStore';
import { useOverlayStore } from '@core/OverlayStore';

export function AssetPanel() {
  const assets = useEditorStore((s) => s.assets);
  const importOBJ = useEditorStore((s) => s.importOBJ);
  const importTexture = useEditorStore((s) => s.importTexture);
  const addCustomMeshNode = useEditorStore((s) => s.addCustomMeshNode);
  const objInputRef = useRef<HTMLInputElement>(null);
  const texInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="panel asset-panel">
      <div className="panel-header">
        <span className="panel-title">Assets</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={() => objInputRef.current?.click()} title="Import OBJ">OBJ</button>
          <button className="panel-btn" onClick={() => texInputRef.current?.click()} title="Import Texture">Tex</button>
        </div>
      </div>
      <div className="panel-body">
        {assets.length === 0 ? (
          <div className="asset-empty">No assets. Import OBJ or textures.</div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="asset-item"
              onDoubleClick={() => asset.type === 'mesh' && addCustomMeshNode(asset.id, asset.name)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const { openMenu } = useOverlayStore.getState();
                const items = [];
                if (asset.type === 'mesh') {
                  items.push({
                    label: 'Add to Scene',
                    action: () => addCustomMeshNode(asset.id, asset.name),
                  });
                }
                items.push({
                  label: 'Remove Asset',
                  danger: true,
                  separatorBefore: items.length > 0,
                  action: () => useEditorStore.getState().removeAsset(asset.id),
                });
                openMenu(e.clientX, e.clientY, items);
              }}
              title={asset.type === 'mesh' ? 'Double-click to add to scene' : 'Texture asset'}
            >
              <span className={`asset-type-icon asset-${asset.type}`}>
                {asset.type === 'mesh' ? 'MESH' : 'TEX'}
              </span>
              <span className="asset-label">{asset.name}</span>
            </div>
          ))
        )}
      </div>
      <input
        ref={objInputRef}
        type="file"
        accept=".obj"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importOBJ(file);
          e.target.value = '';
        }}
      />
      <input
        ref={texInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importTexture(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

