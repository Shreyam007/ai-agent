import React, { useEffect, useRef } from 'react';

interface SignalHealthChartProps {
  frequency: number;
  amplitude: number;
}

export function SignalHealthChart({ frequency, amplitude }: SignalHealthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    // Resize observer to keep canvas sharp and sized correctly
    const resizeObserver = new ResizeObserver(() => {
      syncSize();
    });
    resizeObserver.observe(canvas);
    syncSize();

    // Pseudo-noise function
    const noise = (x: number) => {
      return Math.sin(x) * Math.sin(x * 1.5) * Math.cos(x * 2.2);
    };

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // 1. Clear background
      ctx.fillStyle = '#0c0c0e';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw grid lines (terminal purple grid)
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
      ctx.lineWidth = 1;

      // Vertical grid lines
      const gridSpacingX = 40;
      for (let x = 0; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      const gridSpacingY = 30;
      for (let y = 0; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Draw Waveform line
      ctx.strokeStyle = '#a855f7'; // Purple trace
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const centerY = height / 2;
      const ampMultiplier = amplitude * (height * 0.35); // scale amplitude to 35% height
      const freqScale = (frequency / 440) * 0.03; // scale frequency around 440Hz standard

      for (let px = 0; px < width; px++) {
        const xVal = px * freqScale + time * 3.5;
        // Layered noise waves for authentic oscilloscope look
        let waveY = Math.sin(xVal) * 0.6;
        waveY += noise(xVal * 1.8) * 0.35;
        waveY += Math.sin(xVal * 5.2) * 0.05;

        const py = centerY + waveY * ampMultiplier;

        if (px === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.stroke();

      // Reset shadow blur
      ctx.shadowBlur = 0;

      // Animate time parameter
      time += 0.015;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [frequency, amplitude]);

  return (
    <section className="col-span-12 md:col-span-8 row-span-2 terminal-border bg-[#0c0c0e] relative flex flex-col p-6 overflow-hidden select-none">
      <div className="flex justify-between items-center mb-4 z-10 font-sans">
        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-label-caps">
          SIGNAL_HEALTH
        </span>
        <span className="text-[10px] font-mono text-[#d0bcff]">
          FREQ: {frequency}Hz / AMP: {amplitude}
        </span>
      </div>
      <div className="flex-1 w-full relative h-[140px]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      </div>
    </section>
  );
}
