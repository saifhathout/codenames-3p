import React from 'react';

export default function Scoreboard({ state, playerId, compact }) {
  return (
    <div className={`scoreboard ${compact ? 'compact' : ''}`}>
      <h3>🏆 Scores</h3>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Role</th>
            <th>Game</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {state.players.map(p => {
            const isMe = p.id === playerId;
            const isExcluded = p.excluded;
            return (
              <tr key={p.id} className={`${isMe ? 'me' : ''} ${isExcluded ? 'excluded-row' : ''}`}>
                <td>
                  {p.name}
                  {p.id === state.winner && ' 🏆'}
                  {isExcluded && <span className="excluded-dot"> 🚫</span>}
                </td>
                <td><span className={`role ${p.role}`}>{p.role}</span></td>
                <td className={p.gameScore < 0 ? 'neg' : ''}>{p.gameScore}</td>
                <td><b>{p.totalScore}</b></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="spy-score-row">
        <span>👁️ Spy points this game:</span>
        <b className="accent">{state.spyScore || 0}</b>
      </div>
    </div>
  );
}