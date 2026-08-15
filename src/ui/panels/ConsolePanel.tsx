import { useEditorStore } from '@core/EditorStore';

export function ConsolePanel() {
  const messages = useEditorStore((s) => s.consoleMessages);
  const clearConsole = useEditorStore((s) => s.clearConsole);

  return (
    <div className="panel console-panel">
      <div className="panel-header">
        <span className="panel-title">Console</span>
        <div className="panel-actions">
          <button className="panel-btn" onClick={clearConsole} title="Clear">
            Clear
          </button>
        </div>
      </div>
      <div className="panel-body console-body">
        {messages.length === 0 ? (
          <div className="console-empty">Console is empty</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`console-message console-${msg.level}`}>
              <span className="console-time">
                {new Date(msg.time).toLocaleTimeString()}
              </span>
              <span className="console-level">[{msg.level.toUpperCase()}]</span>
              <span className="console-text">{msg.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
