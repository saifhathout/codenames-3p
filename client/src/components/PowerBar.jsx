import React, { useState } from 'react';
import { socket } from '../socket';
import { actions } from '../hooks/useActions';

const POWER_META = {
  blockTurn: { icon: '🚫', name: 'Block Turn', needs: null },
  safeMistake: { icon: '🛡️', name: 'Safe Mistake', needs: null, passive: true },
  doublePoints: { icon: '×2', name: 'Double Points', needs: null, beforeGuess: true },
  spyVision: { icon: '👁️', name: 'Spy Vision', needs: 'card' },
  undo: { icon: '↩️', name: 'Undo', needs: null, reactive: true },
  stealPoints: { icon: '🦹', name: 'Steal Points', needs: null },
  lockWord: { icon: '🔒', name: 'Lock Word', needs: 'card' },
  jackpot: { icon: '💰', name: 'Jackpot', needs: null, passive: true },
};

export default function PowerBar({ state, playerId, onSelectingPower, onDoublePointsToggle }) {
  const me = state.players.find(p => p.id === playerId);
  if (!me || me.role === 'spymaster' || !me.powerState) return null;

  const [pending, setPending] = useState(null);
  const [doubleActive, setDoubleActive] = useState(false);

  const usePower = async (powerId, payload = {}) => {
    const res = await actions.usePower(powerId, payload);
    if (!res.ok) alert(res.error);
    setPending(null);
  };

  return (
    <div className="power-bar">
      <div className="power-bar-label">⚡ Your Powers:</div>
      <div className="power-bar-items">
        {me.powers.map(id => {
          const meta = POWER_META[id];
          const st = me.powerState[id];
          if (!meta) return null;
          const available = st?.available;
          const isPending = pending === id;

          return (
            <button
              key={id}
              className={`power-btn ${available ? '' : 'used'} ${isPending ? 'pending' : ''} ${doubleActive && id === 'doublePoints' ? 'active' : ''}`}
              disabled={!available || state.pendingUndo}
              title={meta.name}
              onClick={() => {
                if (id === 'doublePoints') {
                  const next = !doubleActive;
                  setDoubleActive(next);
                  if (onDoublePointsToggle) onDoublePointsToggle(next);
                  return;
                }
                if (meta.needs === 'card') {
                  setPending(id);
                  if (onSelectingPower) onSelectingPower(id);
                } else {
                  usePower(id);
                }
              }}
            >
              <span className="power-emoji">{meta.icon}</span>
              <span className="power-mini-name">{meta.name}</span>
              {!available && <span className="power-used-badge">used</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}