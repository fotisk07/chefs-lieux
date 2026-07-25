import { useEffect, useState } from 'react';

export default function AnimatedScore({ from, to }: { from: number; to: number }) {
  const [displayed, setDisplayed] = useState(from);

  useEffect(() => {
    if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(to);
      return;
    }

    let frame = 0;
    const duration = 700;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayed(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to]);

  return <strong className="rolling-score">{displayed}</strong>;
}
