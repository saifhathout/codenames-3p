import React, { useState } from 'react';
import { socket } from '../socket';
import { sfx } from '../sound';
import { actions } from '../hooks/useActions';

export default function ClueBar({ state, playerId, isSpymaster }) {
  const [word, setWord] = useState('');
  const [num, setNum] = useState(1);

  if (state.status !== 'playing') return null;

  const me = state.players.find(p => p.id === playerId);
  const isExcluded = me?.excluded;
  const endedTurn = me?.endedTurn;
  const used = me?.guessesThisClue || 0;
  const max = state.maxGuesses || 0;
  const left = Math.max(0, max - used);
  const canEnd = !isSpymaster && !isExcluded && !endedTurn && state.currentClue;

  if (isSpymaster) {
    const submit = () => {
      if (!word.trim()) return;
      sfx.clue();
      socket.emit('clue:give', { word: word.trim(), number: num });
      setWord('');
    };
    return (
      <div className="clue-bar spy">
        <div className="clue-label">🔍 Your clue:</div>
        <input
          placeholder="One word..."
          value={word}
          onChange={e => setWord(e.target.value)}
          maxLength={30}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <select value={num} onChange={e => setNum(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button className="primary" disabled={!word.trim()} onClick={submit}>
          Give Clue
        </button>
        <span className="clue-count">
          Clue {state.clueCount}/{state.maxClues}
        </span>
        {state.currentClue && (
          <span className="active-clue">
            Active: <b>{state.currentClue.word}</b> ({state.currentClue.number})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="clue-bar">
      {state.currentClue ? (
        <>
          <span className="clue-label">Current clue:</span>
          <span className="active-clue big">
            <b>{state.currentClue.word}</b>
            <span className="clue-num">{state.currentClue.number}</span>
          </span>
          <span className="clue-count">
            Clue {state.clueCount}/{state.maxClues}
          </span>

          {isExcluded ? (
            <span className="excluded-badge">
              🚫 Out of this round
            </span>
          ) : endedTurn ? (
            <span className="excluded-badge ended">
              ✅ You ended your turn
            </span>
          ) : (
            <>
              <span className="guesses-left">
                🎯 Guesses: <b>{used}</b> / {max}
                {left > 0
                  ? <span className="left-badge"> ({left} left)</span>
                  : <span className="left-badge danger"> (no more!)</span>}
              </span>
              {canEnd && (
                <button
                  className="end-turn-btn"
                  onClick={() => actions.endTurn()}
                  title="End your turn for this clue"
                >
                  End My Turn
                </button>
              )}
            </>
          )}
        </>
      ) : (
        <span className="waiting-clue">⏳ Waiting for Spymaster's clue...</span>
      )}
    </div>
  );
}