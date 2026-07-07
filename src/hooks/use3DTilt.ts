// ============================================================================
// use3DTilt — Mouse-tracking 3D tilt for interactive card depth
// Apple-style: cards subtly tilt toward the cursor, snap back on leave
// ============================================================================

import { useCallback } from 'react';

export interface TiltOptions {
  /** Maximum rotation angle in degrees (default: 10) */
  maxTilt?: number;
  /** CSS perspective value in px (default: 1000) */
  perspective?: number;
  /** Scale-up on hover — 1 = no scale (default: 1.025) */
  scale?: number;
  /** Return-to-flat transition speed in ms (default: 600) */
  resetSpeed?: number;
}

export function use3DTilt({
  maxTilt = 10,
  perspective = 1000,
  scale = 1.025,
  resetSpeed = 600,
}: TiltOptions = {}) {
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();

      // Mouse position relative to card centre (-1 to +1)
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

      // rotateX: positive = top comes forward (cursor above centre)
      // rotateY: positive = right comes forward (cursor to the right)
      const rotX = -y * maxTilt;
      const rotY = x * maxTilt;

      el.style.transform = `perspective(${perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale},${scale},${scale})`;
      el.style.transition = 'transform 0.06s linear';
    },
    [maxTilt, perspective, scale]
  );

  const onMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
      el.style.transition = `transform ${resetSpeed}ms cubic-bezier(0.22,1,0.36,1)`;
    },
    [perspective, resetSpeed]
  );

  return { onMouseMove, onMouseLeave };
}
