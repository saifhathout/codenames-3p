import React, { useState } from 'react';
import { actions } from '../hooks/useActions';

export default function Lobby({ onAuth }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('ar');
  const [mode, setMode] = useState('create');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const submit = async () => {
  console.log('🔵 submit called', { name, code, lang, mode });
  setError('');
  setLoading(true);
  try {
    const trimmedName = name.trim();
    const res = mode === 'create'
      ? await actions.createRoom(trimmedName, lang)
      : await actions.joinRoom(code.trim().toUpperCase(), trimmedName);
    console.log('🟢 response:', res);
    if (!res || !res.ok) {
      console.error('🔴 not ok:', res);
      setError(res?.error || 'Failed');
      return;
    }
    console.log('🟡 calling onAuth with:', res);
    onAuth(res);
    console.log('🟠 onAuth returned');
  } catch (err) {
    console.error('💥 exception:', err);
    setError(err.message || 'Network error');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="lobby-wrap">
      <div className="lobby-card">
        <h1>🕵️ Codenames <span className="accent">3-Player</span></h1>
        <p className="muted">One neutral Spymaster. Two rival Operatives.</p>

        <div className="tabs">
          <button className={mode === 'create' ? 'active' : ''}
                  onClick={() => setMode('create')}>Create Room</button>
          <button className={mode === 'join' ? 'active' : ''}
                  onClick={() => setMode('join')}>Join Room</button>
        </div>

        <label>Your Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
               maxLength={20} placeholder="Enter name..." />

        {mode === 'create' && (
          <>
            <label>Word Language</label>
            <select value={lang} onChange={e => setLang(e.target.value)}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </>
        )}

        {mode === 'join' && (
          <>
            <label>Room Code</label>
            <input value={code}
                   onChange={e => setCode(e.target.value.toUpperCase())}
                   maxLength={6} placeholder="ABC123" />
          </>
        )}

        <button className="primary"
                disabled={!name.trim() || (mode === 'join' && !code.trim()) || loading}
                onClick={submit}>
          {loading ? '...' : mode === 'create' ? 'Create Room' : 'Join Room'}
        </button>

        {error && <div className="error">{error}</div>}

        <details className="rules">
          <summary>How to Play (3-Player Mode)</summary>
          <ul>
            <li><b>Spymaster</b> is neutral — sees the key card and gives clues (word + number).</li>
            <li><b>Operative 1 & 2</b> alternate guessing words on the board.</li>
            <li>Each correct target = +1 point. Assassin = −2 and ends the game.</li>
            <li>Spymaster scores 5/4/3/2/1 based on rounds used to find all targets.</li>
            <li>Roles rotate each game. Highest cumulative score wins.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}