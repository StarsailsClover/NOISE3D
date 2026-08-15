import { useState, useRef } from 'react';
import { useEditorStore } from '@core/EditorStore';

export function FileMenu() {
  const [open, setOpen] = useState(false);
  const [sceneName, setSceneName] = useState('Untitled');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sceneNameRef = useRef(sceneName);
  const saveScene = useEditorStore((s) => s.saveScene);
  const loadScene = useEditorStore((s) => s.loadScene);
  const downloadScene = useEditorStore((s) => s.downloadScene);
  const loadSceneFromFile = useEditorStore((s) => s.loadSceneFromFile);
  const newScene = useEditorStore((s) => s.newScene);
  const currentName = useEditorStore((s) => s.sceneName);

  const handleSave = () => {
    saveScene(sceneNameRef.current || 'Untitled');
    setOpen(false);
  };

  const handleLoad = () => {
    loadScene(sceneNameRef.current || 'Untitled');
    setOpen(false);
  };

  const handleDownload = () => {
    downloadScene(sceneNameRef.current || 'Untitled');
    setOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadSceneFromFile(file);
    }
    setOpen(false);
  };

  return (
    <>
      <button
        className="toolbar-btn"
        onClick={() => setOpen(!open)}
      >
        File
      </button>
      {open && (
        <>
          <div className="file-menu-overlay" onClick={() => setOpen(false)} />
          <div className="file-menu">
            <div className="file-menu-item" onClick={() => { newScene(); setOpen(false); }}>
              New Scene
            </div>
            <div className="file-menu-divider" />
            <div className="file-menu-row">
              <input
                className="file-menu-input"
                type="text"
                value={sceneName}
                onChange={(e) => {
                  setSceneName(e.target.value);
                  sceneNameRef.current = e.target.value;
                }}
                placeholder="Scene name"
              />
            </div>
            <div className="file-menu-item" onClick={handleSave}>
              Save to Browser
            </div>
            <div className="file-menu-item" onClick={handleLoad}>
              Load from Browser
            </div>
            <div className="file-menu-divider" />
            <div className="file-menu-item" onClick={handleDownload}>
              Download .json
            </div>
            <div className="file-menu-item" onClick={() => fileInputRef.current?.click()}>
              Import .json
            </div>
            <div className="file-menu-divider" />
            <div className="file-menu-info">
              Current: {currentName}
            </div>
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.scene.json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </>
  );
}
