import React from 'react';

interface OperationalStabilityPanelProps {
  stability: string;
  description: string;
}

export function OperationalStabilityPanel({ stability, description }: OperationalStabilityPanelProps) {
  return (
    <section className="col-span-12 md:col-span-4 row-span-6 terminal-border bg-[#0c0c0e] flex flex-col p-8 relative overflow-hidden group">
      {/* Top right marker */}
      <div className="absolute top-0 right-0 p-4 opacity-20 select-none">
        <span className="font-display-tech text-[10px] font-mono text-white">AGENT_CORE_v2</span>
      </div>
      
      {/* Metrics container */}
      <div className="mt-auto">
        <span className="font-sans text-[10px] font-bold tracking-widest text-neutral-400 uppercase block mb-2 font-label-caps">
          OPERATIONAL_STABILITY
        </span>
        <h1 className="font-display-tech text-6xl md:text-7xl lg:text-[80px] text-white leading-none font-bold tracking-tighter font-mono">
          {stability}
        </h1>
        <div className="flex items-center gap-3 mt-6 select-none font-sans">
          <span className="w-2.5 h-2.5 rounded-full pulse-purple shrink-0"></span>
          <span className="font-display-tech text-[10px] font-bold tracking-wide text-[#d0bcff] font-label-caps">
            LIVE_TELEMETRY_STREAM
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12 pt-8 border-t border-[#222226] border-dashed">
        <p className="font-sans text-xs md:text-sm text-neutral-400 leading-relaxed font-light">
          {description}
        </p>
      </div>
    </section>
  );
}
