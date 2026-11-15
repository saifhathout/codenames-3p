// Lightweight Web Audio API sound engine — no files, no libraries.
// Generates tones procedurally for each event.

let audioCtx = null;

function ctx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Must be called on a user gesture (click) to unlock audio in browsers.
export function unlockAudio() {
  const c = ctx();
  if (c.state === 'suspended') c.resume();
}

function playTone({ freq, duration = 0.15, type = 'sine', volume = 0.15, sweepTo = null }) {
  try {
    const c = ctx();
    if (c.state === 'suspended') return; // not unlocked yet

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);

    if (sweepTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, sweepTo),
        c.currentTime + duration
      );
    }

    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start();
    osc.stop(c.currentTime + duration);
  } catch {
    /* swallow audio errors — must never break game */
  }
}

function playChord(freqs, opts = {}) {
  freqs.forEach((f, i) => {
    setTimeout(() => playTone({ ...opts, freq: f }), i * 40);
  });
}

// ---------- Game sounds ----------
export const sfx = {
  click: () =>
    playTone({ freq: 600, duration: 0.05, type: 'square', volume: 0.08 }),

  clue: () =>
    playTone({ freq: 880, sweepTo: 1200, duration: 0.2, type: 'sine', volume: 0.18 }),

  target: () => {
    playChord([523.25, 659.25, 783.99], {
      duration: 0.25, type: 'sine', volume: 0.15,
    });
  },

  neutral: () =>
    playTone({ freq: 330, sweepTo: 260, duration: 0.25, type: 'triangle', volume: 0.15 }),

  assassin: () => {
    playTone({ freq: 200, sweepTo: 60, duration: 0.8, type: 'sawtooth', volume: 0.25 });
    setTimeout(() => playTone({ freq: 150, sweepTo: 40, duration: 0.6, type: 'square', volume: 0.2 }), 120);
  },

  win: () => {
    playChord([523.25, 659.25, 783.99, 1046.5], {
      duration: 0.4, type: 'sine', volume: 0.18,
    });
    setTimeout(() => playChord([783.99, 1046.5, 1318.5], {
      duration: 0.5, type: 'sine', volume: 0.15,
    }), 300);
  },

  turnChange: () =>
    playTone({ freq: 720, duration: 0.1, type: 'sine', volume: 0.12 }),

  error: () =>
    playTone({ freq: 200, sweepTo: 150, duration: 0.2, type: 'square', volume: 0.15 }),
};