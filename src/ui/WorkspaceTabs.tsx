import { useWorkspaceStore, WORKSPACES, type WorkspaceId } from '@core/WorkspaceStore';

export function WorkspaceTabs() {
  const active = useWorkspaceStore((s) => s.active);
  const setActive = useWorkspaceStore((s) => s.setActive);

  return (
    <div className="workspace-tabs">
      {WORKSPACES.map((ws) => (
        <button
          key={ws.id}
          className={`workspace-tab ${active === ws.id ? 'active' : ''}`}
          onClick={() => setActive(ws.id as WorkspaceId)}
        >
          {ws.label}
        </button>
      ))}
    </div>
  );
}
