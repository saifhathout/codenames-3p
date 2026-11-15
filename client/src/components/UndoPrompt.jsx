import React, { useEffect, useState } from 'react';
import { actions } from '../hooks/useActions';

export default function UndoPrompt({ state, playerId }) {
  const pending = state.pendingUndo;
  const [timeLeft, setTimeLeft] = useState(5000);

  useEffect(() => {
    if (!pending || !pending.expiresAt) return;
    const tick = () => {
      const left = Math.max(0, pending.expiresAt - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        actions.resolveUndo(false);
      }
    };
    tick();
    const int = setInterval(tick, 200);
    return () => clearInterval(int);
  }, [pending]);

  if (!pending || !pending.expiresAt) return null;

  return (
    <div className="undo-overlay">
      <div className="undo-card">
        <h3>⚠️ Neutral Word!</h3>
        <p>Undo your mistake? ({Math.ceil(timeLeft / 1000)}s)</p>
        <div className="undo-actions">
          <button
            className="primary"
            onClick={() => actions.resolveUndo(true)}
          >
            ↩️ Undo
          </button>
          <button
            className="ghost"
            onClick={() => actions.resolveUndo(false)}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}