import { useEffect, useRef } from 'react';

// A subtle grid layer that brightens around the pointer. The grid itself is
// drawn with CSS; this component only tracks the cursor and eases a spotlight
// position into CSS variables so the reveal follows the mouse smoothly.
export default function CursorGrid() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Respect users who prefer less motion: render the static grid only.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '40%');
      return undefined;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let frame = 0;

    const tick = () => {
      // Ease the spotlight toward the pointer for a fluid trail.
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      el.style.setProperty('--mx', `${currentX}px`);
      el.style.setProperty('--my', `${currentY}px`);

      const settled = Math.abs(targetX - currentX) < 0.5 && Math.abs(targetY - currentY) < 0.5;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="cursor-grid" aria-hidden="true" />;
}
