let context: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(frequency: number, start: number, duration: number, type: OscillatorType, gain = 0.09) {
  const ctx = audio();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  volume.gain.setValueAtTime(gain, ctx.currentTime + start);
  volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
  oscillator.connect(volume).connect(ctx.destination);
  oscillator.start(ctx.currentTime + start);
  oscillator.stop(ctx.currentTime + start + duration);
}

export function playCorrect() {
  tone(523, 0, 0.16, 'sine');
  tone(659, 0.12, 0.2, 'sine');
  tone(784, 0.26, 0.28, 'sine');
}

export function playDrink() {
  tone(180, 0, 0.2, 'sawtooth', 0.07);
  tone(130, 0.16, 0.32, 'sawtooth', 0.08);
}
