import React, { useState } from 'react';
import { actions } from '../hooks/useActions';

const POWER_ORDER = [
  'blockTurn', 'safeMistake', 'doublePoints', 'spyVision',
  'undo', 'stealPoints', 'lockWord', 'jackpot',
];

export default function PowerSelection({ state, playerId }) {
  const me = state.players.find(p => p.id === playerId);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!me || me.role === 'spymaster') {
    return (
      <div className="power-screen">
        <div className="power-card-large">
          <h2>👁️ You are the Spymaster</h2>
          <p className="muted center">
            Waiting for operatives to pick their powers...
          </p>
          <div className="waiting-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="power-screen">
        <div className="power-card-large">
          <h2>✅ Powers Locked</h2>
          <p className="muted center">
            Waiting for opponent...
          </p>
          <div className="waiting-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  const toggle = (powerId) => {
    setError('');
    setSelected(prev => {
      if (prev.includes(powerId)) return prev.filter(p => p !== powerId);
      if (prev.length >= 3) return prev;
      return [...prev, powerId];
    });
  };

  const submit = async () => {
    if (selected.length !== 3) return;
    const res = await actions.choosePowers(selected);
    if (!res.ok) return setError(res.error || 'Failed');
    setSubmitted(true);
  };

  const powers = state.powersList || {};

  return (
    <div className="power-screen">
      <div className="power-card-large">
        <h2>🎯 Choose 3 Powers</h2>
        <p className="muted center">
          Secret from your opponent. Choose wisely.
        </p>

        <div className="power-grid">
          {POWER_ORDER.map(id => {
            const p = powers[id];
            if (!p) return null;
            const isSelected = selected.includes(id);
            return (
              <button
                key={id}
                className={`power-tile ${isSelected ? 'selected' : ''}`}
                onClick={() => toggle(id)}
              >
                <div className="power-icon">{p.icon}</div>
                <div className="power-name">{p.name}</div>
                <div className="power-desc">{p.description}</div>
                {isSelected && <div className="power-check">✓</div>}
              </button>
            );
          })}
        </div>

        <div className="power-footer">
          <span className={`power-count ${selected.length === 3 ? 'full' : ''}`}>
            {selected.length} / 3 selected
          </span>
          <button
            className="primary"
            disabled={selected.length !== 3}
            onClick={submit}
          >
            Lock In
          </button>
        </div>

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}