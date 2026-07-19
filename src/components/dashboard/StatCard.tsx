import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  delta: string;
  isUp: boolean;
}

export function StatCard({ title, value, delta, isUp }: StatCardProps) {
  return (
    <section className="terminal-border bg-[#0c0c0e] flex flex-col justify-center p-8 select-none">
      <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-label-caps mb-3">
        {title}
      </span>
      <div className="flex items-baseline gap-2.5">
        <span className="font-display-tech text-3xl font-bold text-white tracking-tight font-mono">
          {value}
        </span>
        <span className={`font-display-tech text-[11px] font-bold font-mono ${isUp ? 'text-rose-500' : 'text-[#d0bcff]'}`}>
          {isUp ? '▲' : '▼'} {delta}
        </span>
      </div>
    </section>
  );
}
