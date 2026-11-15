import React, { useEffect, useState } from 'react';

const COLORS = ['#fbbf24', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#3b82f6'];

export default function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const newPieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));

    setPieces(newPieces);
  }, [active]);

  if (!active) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            boxShadow: `0 0 10px ${p.color}`,
            animation: `confettiFall ${p.duration}s linear ${p.delay}s infinite`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}