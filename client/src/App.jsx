import React, { useEffect, useState } from 'react';
import { useRoom } from './hooks/useRoom';
import { actions } from './hooks/useActions';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';

export default function App() {
  const [state, setState] = useRoom();
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('codenames-session') || 'null');
    if (saved) {
      actions.reconnect(saved.code, saved.pid).then((res) => {
        if (res.ok) {
          setPlayerId(saved.pid);
          if (res.state) setState(res.state);
        } else {
          localStorage.removeItem('codenames-session');
        }
      });
    }
  }, [setState]);

  const onAuth = (res) => {
    setPlayerId(res.playerId);
    if (res.state) setState(res.state);
    localStorage.setItem(
      'codenames-session',
      JSON.stringify({ code: res.code, pid: res.playerId })
    );
  };

  if (!state || !playerId) return <Lobby onAuth={onAuth} />;

  const onLeave = () => {
    localStorage.removeItem('codenames-session');
    setPlayerId(null);
    setState(null);
  };

  return <Game state={state} playerId={playerId} onLeave={onLeave} />;
}