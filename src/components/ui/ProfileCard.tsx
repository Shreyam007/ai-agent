import React, { useRef, useState, useEffect } from 'react';

interface ProfileCardProps {
  id: string;
  name: string;
  role: string;
  handle: string;
  avatar: string;
  github: string;
  linkedin: string;
  innerGradient: string;
  behindGlowColor: string;
}

export function ProfileCard({
  id,
  name,
  role,
  handle,
  avatar,
  github,
  linkedin,
  innerGradient,
  behindGlowColor,
}: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const shell = shellRef.current;
    if (!wrap || !shell) return;

    let width = shell.clientWidth || 1;
    let height = shell.clientHeight || 1;

    let currentX = width / 2;
    let currentY = height / 2;
    let targetX = width / 2;
    let targetY = height / 2;
    let running = false;
    let lastTs = 0;
    let initialUntil = performance.now() + 1200; // 1200ms initial wiggle

    const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
    const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) => 
      parseFloat((tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin)).toFixed(3));

    const setVars = (x: number, y: number) => {
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;
      const bgX = adjust(percentX, 0, 100, 35, 65);
      const bgY = adjust(percentY, 0, 100, 35, 65);
      const pointerFromCenter = clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1);

      wrap.style.setProperty('--pointer-x', `${percentX}%`);
      wrap.style.setProperty('--pointer-y', `${percentY}%`);
      wrap.style.setProperty('--background-x', `${bgX}%`);
      wrap.style.setProperty('--background-y', `${bgY}%`);
      wrap.style.setProperty('--pointer-from-center', `${pointerFromCenter}`);
      wrap.style.setProperty('--pointer-from-top', `${percentY / 100}`);
      wrap.style.setProperty('--pointer-from-left', `${percentX / 100}`);
      wrap.style.setProperty('--rotate-x', `${-(centerX / 5)}deg`);
      wrap.style.setProperty('--rotate-y', `${centerY / 4}deg`);
    };

    const loop = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? 0.6 : 0.14;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVars(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar) {
        requestAnimationFrame(loop);
      } else {
        running = false;
        lastTs = 0;
      }
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      requestAnimationFrame(loop);
    };

    const setTarget = (x: number, y: number) => {
      targetX = x;
      targetY = y;
      startLoop();
    };

    // Initial wiggle
    setVars(currentX, currentY);
    startLoop();

    const handlePointerEnter = (e: PointerEvent) => {
      setIsActive(true);
      setIsEntering(true);
      setTimeout(() => setIsEntering(false), 180);

      const rect = shell.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTarget(x, y);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTarget(x, y);
    };

    const handlePointerLeave = () => {
      targetX = width / 2;
      targetY = height / 2;
      startLoop();
      
      const checkSettle = () => {
        const settled = Math.hypot(targetX - currentX, targetY - currentY) < 0.6;
        if (settled) {
          setIsActive(false);
        } else {
          requestAnimationFrame(checkSettle);
        }
      };
      requestAnimationFrame(checkSettle);
    };

    shell.addEventListener('pointerenter', handlePointerEnter);
    shell.addEventListener('pointermove', handlePointerMove);
    shell.addEventListener('pointerleave', handlePointerLeave);

    const handleResize = () => {
      width = shell.clientWidth || 1;
      height = shell.clientHeight || 1;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      shell.removeEventListener('pointerenter', handlePointerEnter);
      shell.removeEventListener('pointermove', handlePointerMove);
      shell.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      running = false;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`pc-card-wrapper ${isActive ? 'active' : ''}`}
      id={id}
      style={{
        // @ts-ignore
        '--inner-gradient': innerGradient,
        '--behind-glow-color': behindGlowColor,
      }}
    >
      <div className="pc-behind"></div>
      <div ref={shellRef} className={`pc-card-shell ${isEntering ? 'entering' : ''}`}>
        <section className={`pc-card ${isActive ? 'active' : ''}`}>
          <div className="pc-inside">
            <div className="pc-shine"></div>
            <div className="pc-glare"></div>
            <div className="pc-content pc-avatar-content">
              <img className="avatar" src={avatar} alt={`${name} avatar`} loading="lazy" />
              <div className="pc-user-info">
                <div className="pc-user-details">
                  <div className="pc-mini-avatar">
                    <img src={avatar} alt={`${name} mini avatar`} loading="lazy" />
                  </div>
                  <div className="pc-user-text">
                    <div className="pc-handle">{handle}</div>
                    <div className="pc-status">Online</div>
                  </div>
                </div>
                <div className="pc-social-buttons">
                  <a href={github} target="_blank" rel="noopener noreferrer" className="pc-contact-btn" style={{ textDecoration: 'none' }}>GitHub</a>
                  <a href={linkedin} target="_blank" rel="noopener noreferrer" className="pc-contact-btn" style={{ textDecoration: 'none' }}>LinkedIn</a>
                </div>
              </div>
            </div>
            <div className="pc-content">
              <div className="pc-details">
                <h3>{name.split(' ')[0]}</h3>
                <p>{role}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
