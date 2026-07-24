import { useMemo, type CSSProperties } from 'react';

type ConfettiStyle = CSSProperties & {
  '--x': string;
  '--drift': string;
  '--delay': string;
  '--duration': string;
  '--rotation': string;
  '--size': string;
};

export default function Confetti({ amount = 50, golden = false }: { amount?: number; golden?: boolean }) {
  const pieces = useMemo(() => Array.from({ length: amount }, (_, index) => ({
    id: index,
    style: {
      '--x': `${Math.random() * 100}vw`,
      '--drift': `${Math.round(Math.random() * 180 - 90)}px`,
      '--delay': `${Math.random() * 0.45}s`,
      '--duration': `${1.8 + Math.random() * 1.5}s`,
      '--rotation': `${Math.round(Math.random() * 900 + 360)}deg`,
      '--size': `${6 + Math.random() * 9}px`,
    } as ConfettiStyle,
  })), [amount]);

  return (
    <div className={`confetti ${golden ? 'golden-confetti' : ''}`} aria-hidden="true">
      {pieces.map((piece) => <i key={piece.id} style={piece.style} />)}
    </div>
  );
}
