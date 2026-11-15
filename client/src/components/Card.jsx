import React, { forwardRef } from 'react';

const Card = forwardRef(function Card({
  card, isSpymaster, canGuess, onClick, selectingPower,
}, ref) {
  const revealed = card.guessed;
  const classes = ['card3d'];
  if (revealed) classes.push('revealed', card.color);
  else if (isSpymaster && card.color) classes.push('spy', card.color);
  if (card.isLast) classes.push('is-last');
  if (card.blocked) classes.push('blocked');
  if (card.locked) classes.push('locked');
  if (card.lockedByMe) classes.push('locked-by-me');
  if (card.excluded) classes.push('excluded');
  if (selectingPower) classes.push('power-select-target');

  const disabled = card.guessed || (!canGuess && !selectingPower)
    || card.blocked || card.excluded || card.locked;

  return (
    <button
      ref={ref}
      className={classes.join(' ')}
      disabled={disabled}
      onClick={onClick}
      aria-label={card.word}
      role="gridcell"
    >
      <div className="card3d-inner">
        <div className="card3d-face card3d-front">
          <span className="word">{card.word}</span>
          {card.blocked && <span className="corner-icon">🚫</span>}
          {card.locked && <span className="corner-icon">🔒</span>}
          {card.lockedByMe && <span className="corner-icon">🔓</span>}
        </div>
        <div className={`card3d-face card3d-back ${card.color}`}>
          <span className="back-icon">
            {card.color === 'target' && '✓'}
            {card.color === 'neutral' && '—'}
            {card.color === 'assassin' && '💀'}
          </span>
          <span className="back-label">{card.color}</span>
          {card.guessedByName && (
            <span className="badge">{card.guessedByName}</span>
          )}
        </div>
      </div>
    </button>
  );
});

export default Card;