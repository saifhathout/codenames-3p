import React, { useState } from 'react';
import { socket } from '../socket';
import Board from './Board.jsx';
import Scoreboard from './Scoreboard.jsx';
import ClueBar from './ClueBar.jsx';
import GameEndModal from './GameEndModal.jsx';
import PowerSelection from './PowerSelection.jsx';
import PowerBar from './PowerBar.jsx';
import UndoPrompt from './UndoPrompt.jsx';

export default function Game({ state, playerId, onLeave }) {
  const me = state.players.find(p => p.id === playerId);
  const isHost = state.hostId === playerId;
  const isSpymaster = me?.role === 'spymaster';
  const isExcluded = me?.excluded;
  const endedTurn = me?.endedTurn;
  const used = me?.guessesThisClue || 0;
  const max = state.maxGuesses || 0;
  const [copied, setCopied] = useState(false);
  const [selectingPower, setSelectingPower] = useState(null);
  const [doubleActive, setDoubleActive] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(state.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ---------- LOBBY ----------
  if (state.status === 'lobby') {
    return (
      <div className="lobby-wrap">
        <div className="lobby-card">
          <h1>Lobby</h1>
          <div className="room-code" onClick={copyCode}>
            Room Code: <span className="accent">{state.code}</span>
            <span className="copy">{copied ? '✓ Copied' : 'click to copy'}</span>
          </div>
          <p className="muted">
            Share this code with 2 friends ({state.players.length}/3 joined)
          </p>
          <ul className="player-list">
            {state.players.map((p, i) => (
              <li key={p.id} className="player-row">
                <span className={`avatar avatar-${i % 3}`}>
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="player-name">{p.name}</span>
                {p.id === state.hostId && <span className="tag">host</span>}
              </li>
            ))}
            {[...Array(3 - state.players.length)].map((_, i) => (
              <li key={`e${i}`} className="player-row empty">
                <span className="avatar avatar-empty">?</span>
                <span>Waiting...</span>
              </li>
            ))}
          </ul>
          {isHost && state.players.length === 3 && (
            <button className="primary pulse" onClick={() => socket.emit('game:start')}>
              Start Game
            </button>
          )}
          {isHost && state.players.length < 3 && (
            <button className="primary" disabled>
              Need {3 - state.players.length} more player(s)
            </button>
          )}
          {!isHost && <p className="muted center">Waiting for host to start...</p>}
          <button className="ghost" onClick={onLeave}>Leave</button>
        </div>
      </div>
    );
  }

  // ---------- POWER SELECT ----------
  if (state.status === 'powerSelect') {
    return <PowerSelection state={state} playerId={playerId} />;
  }

  // ---------- PLAYING / GAME END ----------
  const canGuessNow = !isSpymaster && !isExcluded && !endedTurn
    && used < max
    && state.status === 'playing' && !state.pendingUndo;

  const handlePowerTargetSelected = (powerId, cardId) => {
    socket.emit('power:use', { powerId, payload: { cardId } });
    setSelectingPower(null);
  };

  return (
    <div className="game-app">
      <header className="app-topbar">
        <div className="brand">
          🕵️ Codenames <span className="accent">3P</span>
          <span className="game-badge">Game {state.gameNumber}</span>
        </div>
        <div className="topbar-center">
          <div className="clue-progress">
            <span>Clue <b>{state.clueCount}</b>/{state.maxClues}</span>
            <div className="mini-progress">
              <div
                className="mini-progress-fill"
                style={{ width: `${(state.clueCount / state.maxClues) * 100}%` }}
              />
            </div>
          </div>
          {me && (
            <div className={`role-badge ${me.role}`}>
              {isSpymaster ? '👁' : '🎯'} {me.role}
              {isExcluded && ' 🚫'}
            </div>
          )}
        </div>
        <div className="topbar-right">
          <div className="room-code small" onClick={copyCode}>
            {state.code} {copied ? '✓' : ''}
          </div>
          <button className="ghost sm" onClick={onLeave}>Leave</button>
        </div>
      </header>

      <div className="app-body">
        <div className="board-column">
          {isSpymaster && state.status === 'playing' && (
            <div className="spy-legend">
              <span className="legend-item"><span className="dot-color target" /> Target</span>
              <span className="legend-item"><span className="dot-color neutral" /> Neutral</span>
              <span className="legend-item"><span className="dot-color assassin" /> Black</span>
              <span className="muted">— Only you can see</span>
            </div>
          )}

          <ClueBar state={state} playerId={playerId} isSpymaster={isSpymaster} />

          {me && !isSpymaster && state.status === 'playing' && (
            <PowerBar
              state={state}
              playerId={playerId}
              onSelectingPower={setSelectingPower}
              onDoublePointsToggle={setDoubleActive}
            />
          )}

          {selectingPower && (
            <div className="power-selecting-banner">
              🎯 Select a card for <b>{selectingPower}</b>
              <button className="ghost sm" onClick={() => setSelectingPower(null)}>
                Cancel
              </button>
            </div>
          )}

          <Board
            state={state}
            playerId={playerId}
            isSpymaster={isSpymaster}
            canGuess={canGuessNow}
            selectingPower={selectingPower}
            onPowerTargetSelected={handlePowerTargetSelected}
            doubleActive={doubleActive}
          />
        </div>

        <aside className="app-sidebar">
          <Scoreboard state={state} playerId={playerId} />
        </aside>
      </div>

      <UndoPrompt state={state} playerId={playerId} />

      {state.status === 'gameEnd' && (
        <GameEndModal state={state} playerId={playerId} isHost={isHost} />
      )}
    </div>
  );
}