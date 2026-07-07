// ============================================================================
// StatsStrip.tsx — Animated Trust Strip (Premium Corporate)
// A narrow full-width band just below the hero showing key KPIs
// ============================================================================

import { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 30,  suffix: '+',  label: 'Ans d\'expérience' },
  { value: 300, suffix: '+',  label: 'Références médicaments' },
  { value: 24,  suffix: ' pays', label: 'Réseau international' },
  { value: 100, suffix: '%',  label: 'Certification BPF / GMP' },
];

function useCountUp(end: number, duration: number, start: boolean): number {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!start) return;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setCount(Math.floor(eased * end));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [end, duration, start]);

  return count;
}

function StatItem({ stat, start }: { stat: Stat; start: boolean }) {
  const count = useCountUp(stat.value, 1.4, start);
  return (
    <div className="flex flex-col items-center gap-1 px-8 py-6 flex-1">
      <span
        className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {count}{stat.suffix}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {stat.label}
      </span>
    </div>
  );
}

export default function StatsStrip() {
  const stripRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        onEnter: () => setStarted(true),
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={stripRef}
      className="w-full border-y border-slate-200 dark:border-slate-800/50 bg-white dark:bg-[#0B1120] relative overflow-hidden"
    >
      {/* Subtle gradient left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ background: 'linear-gradient(180deg, hsl(213,94%,45%), hsl(160,84%,39%))' }}
      />

      <div className="container mx-auto px-6 lg:px-16">
        <div className="flex flex-wrap divide-x divide-slate-100 dark:divide-slate-800/50">
          {STATS.map((stat, idx) => (
            <StatItem key={idx} stat={stat} start={started} />
          ))}
        </div>
      </div>
    </div>
  );
}
