import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import { sfx } from '../sound';
import Card from './Card.jsx';
import Particles from './Particles.jsx';

export default function Board({
  state, playerId, isSpymaster, canGuess,
  selectingPower, onPowerTargetSelected,
  doubleActive,
}) {
  const prevGuess = useRef(null);
  const cardRefs = useRef({});
  const [particle, setParticle] = useState(null);
  const [vision, setVision] = useState(null);

  useEffect(() => {
    if (!state.lastGuess || state.lastGuess === prevGuess.current) return;
    prevGuess.current = state.lastGuess;

    const { color, cardId } = state.lastGuess;
    if (color === 'target') sfx.target();
    else if (color === 'neutral') sfx.neutral();
    else if (color === 'assassin') sfx.assassin();

    const el = cardRefs.current[cardId];
    if (el) {
      const rect = el.getBoundingClientRect();
      setParticle({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        color,
      });
    }

    if (state.lastGuess.spyVision
        && state.lastGuess.spyVision.playerId === playerId) {
      setVision({
        cardId: state.lastGuess.spyVision.cardId,
        color: state.lastGuess.spyVision.color,
        expiresAt: state.lastGuess.spyVision.expiresAt,
      });
      setTimeout(() => setVision(null), 3000);
    }
  }, [state.lastGuess, playerId]);

  const handleClick = (card) => {
    if (selectingPower) {
      onPowerTargetSelected?.(selectingPower, card.id);
      return;
    }
    if (!canGuess) return;
    sfx.click();
    socket.emit('card:guess', { cardId: card.id, useDoublePoints: doubleActive });
  };

  return (
    <>
      <div className="board-fullscreen">
        <div className="board" role="grid" aria-label="Game board">
          {state.board.map(card => {
            const showVision = vision?.cardId === card.id;
            const cardWithExtras = {
              ...card,
              isLast: state.lastGuess?.cardId === card.id,
              guessedByName: card.guessedBy
                ? state.players.find(p => p.id === card.guessedBy)?.name
                : null,
              color: showVision ? vision.color : card.color,
            };
            return (
              <Card
                key={card.id}
                ref={el => { cardRefs.current[card.id] = el; }}
                card={cardWithExtras}
                isSpymaster={isSpymaster || showVision}
                canGuess={canGuess}
                selectingPower={!!selectingPower}
                onClick={() => handleClick(card)}
              />
            );
          })}
        </div>
      </div>

      {particle && (
        <Particles
          x={particle.x}
          y={particle.y}
          color={particle.color}
          onDone={() => setParticle(null)}
        />
      )}

      {vision && (
        <div className="vision-overlay">
          👁️ Vision: <b>{vision.color}</b>
        </div>
      )}
    </>
  );
}