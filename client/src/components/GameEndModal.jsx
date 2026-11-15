import React, { useEffect } from 'react';
import { socket } from '../socket';
import { sfx } from '../sound';
import Scoreboard from './Scoreboard.jsx';
import Confetti from './Confetti.jsx';

export default function GameEndModal({ state, playerId, isHost }) {
  const winner = state.players.find(p => p.id === state.winner);
  const spy = state.players.find(p => p.role === 'spymaster');
  const isWinnerMe = state.winner === playerId;

  useEffect(() => {
    if (isWinnerMe) sfx.win();
    else if (state.blackHit) sfx.assassin();
  }, [isWinnerMe, state.blackHit]);

  const reasonText = {
    black: '💀 Black word!',
    allTargets: '🎯 All targets found!',
    maxClues: '⏱ Max clues reached',
  }[state.gameEndReason] || 'Game ended';

  return (
    <>
      {isWinnerMe && <Confetti active />}
      <div className="modal-backdrop">
        <div className={`modal ${isWinnerMe ? 'winner-glow' : ''}`}>
          <div className="celebration">{isWinnerMe ? '🎉' : '🏁'}</div>
          <h2>{isWinnerMe ? 'You Win!' : 'Game Over'}</h2>
          <p className="muted center">{reasonText}</p>
          <p className="muted center">
            {isWinnerMe
              ? 'Highest score this game!'
              : <>Winner: <b className="accent">{winner?.name}</b></>}
          </p>

          <Scoreboard state={state} playerId={playerId} compact />

          <p className="muted center small">
            👁️ Spymaster earned {state.spyScore || 0} points this game.
          </p>

          {isHost ? (
            <button className="primary pulse" onClick={() => socket.emit('game:next')}>
              Next Game →
            </button>
          ) : (
            <p className="muted center">Waiting for host...</p>
          )}
        </div>
      </div>
    </>
  );
}