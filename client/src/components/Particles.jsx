import React, { useEffect, useState } from 'react';

const COLOR_MAP = {
  target: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  neutral: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
  assassin: ['#ef4444', '#dc2626', '#b91c1c', '#f87171'],
};

export default function Particles({ x, y, color, onDone }) {
  const [parts, setParts] = useState([]);

  useEffect(() => {
    if (!color) return;

    const palette = COLOR_MAP[color] || COLOR_MAP.target;
    const count = color === 'assassin' ? 40 : color === 'target' ? 24 : 16;

    const newParts = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 60 + Math.random() * 140;
      return {
        id: i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        size: 4 + Math.random() * 8,
        color: palette[Math.floor(Math.random() * palette.length)],
        delay: Math.random() * 0.1,
        duration: 0.6 + Math.random() * 0.5,
      };
    });

    setParts(newParts);

    const timer = setTimeout(() => {
      setParts([]);
      onDone?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [color, x, y, onDone]);

  if (!parts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {parts.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 12px ${p.color}`,
            animation: `particleFly ${p.duration}s ease-out ${p.delay}s forwards`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
}