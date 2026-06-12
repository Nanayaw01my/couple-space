function makeAC() {
  return new ((window as any).AudioContext || (window as any).webkitAudioContext)() as AudioContext;
}

function note(ac: AudioContext, freq: number, startOffset: number, dur: number, vol = 0.18, type: OscillatorType = 'sine') {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain); gain.connect(ac.destination);
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ac.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startOffset + dur);
  osc.start(ac.currentTime + startOffset);
  osc.stop(ac.currentTime + startOffset + dur);
}

export function playReveal() {
  try {
    const ac = makeAC();
    [523, 659, 784].forEach((f, i) => note(ac, f, i * 0.12, 0.3));
    setTimeout(() => ac.close(), 2000);
  } catch {}
}

export function playMatch() {
  try {
    const ac = makeAC();
    [523, 659, 784, 1047].forEach((f, i) => note(ac, f, i * 0.1, 0.28, 0.15));
    setTimeout(() => ac.close(), 2000);
  } catch {}
}

export function playNoMatch() {
  try {
    const ac = makeAC();
    [330, 277].forEach((f, i) => note(ac, f, i * 0.15, 0.3, 0.12));
    setTimeout(() => ac.close(), 1500);
  } catch {}
}

export function playSend() {
  try {
    const ac = makeAC();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ac.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.15);
    setTimeout(() => ac.close(), 1000);
  } catch {}
}

export function playPick() {
  try {
    const ac = makeAC();
    note(ac, 660, 0, 0.15, 0.12);
    setTimeout(() => ac.close(), 1000);
  } catch {}
}
