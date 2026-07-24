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
  const beginsAt = ctx.currentTime + start;
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  volume.gain.setValueAtTime(0.001, beginsAt);
  volume.gain.exponentialRampToValueAtTime(gain, beginsAt + 0.018);
  volume.gain.exponentialRampToValueAtTime(0.001, beginsAt + duration);
  oscillator.connect(volume).connect(ctx.destination);
  oscillator.start(beginsAt);
  oscillator.stop(beginsAt + duration);
}

function bell(frequency: number, start: number, duration: number) {
  tone(frequency, start, duration, 'sine', 0.075);
  tone(frequency * 2, start, duration * 0.65, 'sine', 0.018);
  tone(frequency * 3, start, duration * 0.4, 'sine', 0.008);
}

export function playCorrect() {
  // A bright ascending C-major chime with a sparkling final chord.
  bell(523.25, 0, 0.42);
  bell(659.25, 0.09, 0.46);
  bell(783.99, 0.18, 0.5);
  bell(1046.5, 0.3, 0.72);
  tone(659.25, 0.3, 0.62, 'triangle', 0.025);
  tone(783.99, 0.3, 0.62, 'triangle', 0.025);
}

export function playDrink() {
  tone(180, 0, 0.2, 'sawtooth', 0.07);
  tone(130, 0.16, 0.32, 'sawtooth', 0.08);
}
