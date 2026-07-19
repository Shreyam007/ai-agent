import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { DottedSurface } from '../components/ui/DottedSurface';
import { ProfileCard } from '../components/ui/ProfileCard';

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const [progress, setProgress] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Preloading images in useEffect
  useEffect(() => {
    const totalFrames = 431;
    const framePaths: string[] = [];

    // zip1: frames 1 to 300
    for (let i = 1; i <= 300; i++) {
      const num = String(i).padStart(3, '0');
      framePaths.push(`zip1/ezgif-frame-${num}.jpg`);
    }
    // zip2: frames 1 to 131
    for (let i = 1; i <= 131; i++) {
      framePaths.push(`zip2/${i}.jpg`);
    }

    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    const loadImage = (path: string, index: number) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        loadedCount++;
        const currentProgress = Math.floor((loadedCount / totalFrames) * 100);
        setProgress(currentProgress);
        loadedImages[index] = img;

        if (loadedCount === totalFrames) {
          imagesRef.current = loadedImages;
          setIsPreloaded(true);
        }
      };
      img.onerror = () => {
        // Fallback on load error to avoid freezing loader
        loadedCount++;
        const currentProgress = Math.floor((loadedCount / totalFrames) * 100);
        setProgress(currentProgress);
        
        if (loadedCount === totalFrames) {
          imagesRef.current = loadedImages;
          setIsPreloaded(true);
        }
      };
    };

    framePaths.forEach((path, idx) => {
      loadImage(path, idx);
    });

    return () => {
      // Cleanup loaded images
      loadedImages.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, []);

  // Frame drawing and canvas rendering loop
  useEffect(() => {
    if (!isPreloaded || !canvasRef.current || imagesRef.current.length === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const images = imagesRef.current;
    const totalFrames = images.length;

    // Handle initial sizing
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(Math.floor(robotState.frame));
    };

    const drawFrame = (index: number) => {
      const img = images[index];
      if (!img) return;

      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      let drawWidth, drawHeight;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
      } else {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
      }

      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, x, y, drawWidth, drawHeight);
    };

    const robotState = { frame: 0 };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial load animations
    gsap.set('header', { opacity: 0 });
    const introTl = gsap.timeline({
      onComplete: () => {
        initScrollAnimations();
      }
    });

    introTl.to('#preloader', {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.style.display = 'none';
      }
    });

    introTl.fromTo('.hero-title',
      { y: 150, rotateX: -30, opacity: 0 },
      { y: 0, rotateX: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.1 },
      '-=0.3'
    );

    introTl.fromTo('.hero-subtitle',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
      '-=0.6'
    );

    introTl.fromTo('.scroll-indicator',
      { opacity: 0 },
      { opacity: 1, duration: 0.8 },
      '-=0.2'
    );

    introTl.to('header', {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.8');

    // Setup scroll triggers and Lenis
    let lenis: Lenis;
    let scrollTriggerInstances: any[] = [];

    const initScrollAnimations = () => {
      // Initialize Lenis smooth scroll
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      const onScroll = (time: number) => {
        ScrollTrigger.update();
      };
      
      lenis.on('scroll', onScroll);
      
      const raf = (time: number) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      // Scroll timeline
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.scroll-container',
          pin: '.canvas-wrapper',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        }
      });
      scrollTriggerInstances.push(scrollTl.scrollTrigger);

      scrollTl.to(robotState, {
        frame: totalFrames - 1,
        snap: 'frame',
        ease: 'none',
        onUpdate: () => {
          drawFrame(Math.floor(robotState.frame));
        }
      });

      // Shift model wrapper to the left during details sections
      scrollTl.to('.canvas-wrapper', {
        x: '-22vw',
        scale: 0.8,
        ease: 'power1.inOut',
        duration: 0.25
      }, 0);

      // Shift model wrapper back to center at the team section
      scrollTl.to('.canvas-wrapper', {
        x: '0vw',
        scale: 0.95,
        ease: 'power1.inOut',
        duration: 0.15
      }, 0.85);

      // Fade out Hero section on scroll
      const heroFade = gsap.to('.hero-title-container', {
        opacity: 0,
        y: -80,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: '#sec-hero',
          start: 'top top',
          end: 'bottom 30%',
          scrub: true
        }
      });
      scrollTriggerInstances.push(heroFade.scrollTrigger);

      // Animate feature descriptions
      const features = gsap.utils.toArray('.feature-content');
      features.forEach((feat: any) => {
        const featAnim = gsap.fromTo(feat,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: feat.closest('.section'),
              start: 'top 75%',
              end: 'top 30%',
              scrub: true
            }
          }
        );
        scrollTriggerInstances.push(featAnim.scrollTrigger);
      });
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      introTl.kill();
      scrollTriggerInstances.forEach(st => st?.kill());
      if (lenis) {
        lenis.destroy();
      }
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [isPreloaded]);

  return (
    <>
      {/* 3D Dotted Surface Background */}
      <DottedSurface />

      {/* Preloader Screen */}
      <div id="preloader" className="fixed inset-0 w-full h-full bg-[#050507] z-[9999] flex flex-col items-center justify-center">
        <div className="preloader-content flex flex-col items-center">
          <div className="loader-percentage-container relative w-[160px] h-[160px] flex items-center justify-center">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle className="track fill-none stroke-[#222] stroke-[2]" cx="80" cy="80" r="70"></circle>
              <circle
                className="progress-bar fill-none stroke-[#a855f7] stroke-[3]"
                style={{
                  strokeDasharray: '440',
                  strokeDashoffset: (440 - (440 * progress) / 100).toString(),
                  transition: 'stroke-dashoffset 0.1s ease-out',
                }}
                cx="80"
                cy="80"
                r="70"
              ></circle>
            </svg>
            <span className="loader-percentage text-white text-3xl font-bold tracking-tight font-display-tech">
              {String(progress).padStart(2, '0')}
            </span>
          </div>
          <div className="loader-text text-neutral-400 font-label-caps tracking-widest mt-6">
            Loading Model Assets
          </div>
        </div>
      </div>

      {/* Header Section */}
      <header className="fixed top-0 left-0 w-full px-8 md:px-16 py-8 flex justify-between items-center z-[100] pointer-events-auto">
        <a href="#" className="logo">
          <img src="logo.png" alt="Reflex Logo" className="logo-img h-12 w-auto" />
        </a>
        <nav className="flex items-center gap-8">
          <a href="#sec-hero" className="hover:text-[#a855f7] transition-colors">Agent</a>
          <a href="#sec-step-1" className="hover:text-[#a855f7] transition-colors">Detection</a>
          <a href="#sec-step-3" className="hover:text-[#a855f7] transition-colors">Investigation</a>
          <a href="#sec-step-4" className="hover:text-[#a855f7] transition-colors">Diagnosis</a>
          <a href="#sec-step-5" className="hover:text-[#a855f7] transition-colors">Action</a>
          <a href="#sec-team" className="hover:text-[#a855f7] transition-colors mr-2">Team</a>
          <Link to="/dashboard" className="px-5 py-2 border border-[#a855f7] text-[#a855f7] rounded font-label-caps text-xs tracking-wider hover:bg-[#a855f7] hover:text-black transition-all">
            DASHBOARD
          </Link>
        </nav>
      </header>

      {/* Fixed Canvas Container */}
      <div className="canvas-wrapper fixed inset-0 w-screen h-screen pointer-events-none z-[1] flex items-center justify-center mix-blend-mode-screen opacity-[0.65]">
        <canvas ref={canvasRef} id="robot-canvas" className="w-full h-full object-contain"></canvas>
      </div>

      {/* Smooth Scroll Content Container */}
      <div ref={scrollContainerRef} className="scroll-container w-full relative z-[5]">
        {/* Hero Section */}
        <section className="section min-h-screen flex items-center px-16 relative" id="sec-hero">
          <div className="hero-title-container text-left select-none relative z-10">
            <h1 className="hero-title text-8xl md:text-9xl font-bold tracking-tighter text-white uppercase leading-none font-display">REFLEX</h1>
            <h1 className="hero-title text-8xl md:text-9xl font-bold tracking-tighter text-white uppercase leading-none font-display">AGENT</h1>
            <p className="hero-subtitle text-neutral-400 max-w-xl text-lg font-sans font-light mt-8 leading-relaxed">
              <strong>Reflex</strong> — an AI agent that diagnoses and fixes CI/CD failures automatically.
              <br /><br />
              <span className="text-sm opacity-70 font-light block leading-normal">
                Monitors your GitHub Actions pipelines, reads the failure logs, finds the root cause, and auto-retries, comments the fix, or alerts your team — before you even open your laptop.
              </span>
            </p>
            
            <div className="scroll-indicator flex items-center gap-4 text-xs tracking-widest text-[#a855f7] uppercase font-bold mt-12 animate-pulse">
              <span>Scroll to deploy</span>
              <div className="line w-16 h-[1px] bg-[#a855f7]"></div>
            </div>
          </div>
        </section>

        {/* Step 1 */}
        <section className="section min-h-screen flex items-center px-16" id="sec-step-1">
          <div className="feature-content max-w-lg z-10" id="feat-1">
            <span className="feature-num text-xs tracking-widest text-[#a855f7] font-mono block mb-4">01 // CODE TRIGGER</span>
            <h2 className="feature-title text-5xl font-bold tracking-tight text-white mb-6 font-display">Pipeline runs</h2>
            <p className="feature-desc text-neutral-400 leading-relaxed font-sans font-light text-base">
              Your CI/CD pipeline runs as usual on GitHub Actions. Reflex silently hooks into workflow webhooks, keeping track of job runs in the background.
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section className="section min-h-screen flex items-center px-16" id="sec-step-2">
          <div className="feature-content max-w-lg z-10" id="feat-2">
            <span className="feature-num text-xs tracking-widest text-[#a855f7] font-mono block mb-4">02 // INSTANT DETECTION</span>
            <h2 className="feature-title text-5xl font-bold tracking-tight text-white mb-6 font-display">Real-time alerts</h2>
            <p className="feature-desc text-neutral-400 leading-relaxed font-sans font-light text-base">
              The moment it fails, the agent knows immediately — no waiting, no manual checking. An absolute zero latency connection ensures analysis begins instantly.
            </p>
          </div>
        </section>

        {/* Step 3 */}
        <section className="section min-h-screen flex items-center px-16" id="sec-step-3">
          <div className="feature-content max-w-lg z-10" id="feat-3">
            <span className="feature-num text-xs tracking-widest text-[#a855f7] font-mono block mb-4">03 // INVESTIGATION</span>
            <h2 className="feature-title text-5xl font-bold tracking-tight text-white mb-6 font-display">Scrubs Logs & Code</h2>
            <p className="feature-desc text-neutral-400 leading-relaxed font-sans font-light text-base">
              It pulls the logs and the code changes, and quietly scrubs out anything sensitive like API keys, credentials, or private configuration before looking further.
            </p>
          </div>
        </section>

        {/* Step 4 */}
        <section className="section min-h-screen flex items-center px-16" id="sec-step-4">
          <div className="feature-content max-w-lg z-10" id="feat-4">
            <span className="feature-num text-xs tracking-widest text-[#a855f7] font-mono block mb-4">04 // DIAGNOSIS</span>
            <h2 className="feature-title text-5xl font-bold tracking-tight text-white mb-6 font-display">LLM Analysis</h2>
            <p className="feature-desc text-neutral-400 leading-relaxed font-sans font-light text-base">
              An LLM reads the evidence and figures out exactly what broke and why — with a confidence score attached to its logic, ensuring actionable technical recommendations.
            </p>
          </div>
        </section>

        {/* Step 5 */}
        <section className="section min-h-screen flex items-center px-16" id="sec-step-5">
          <div className="feature-content max-w-lg z-10" id="feat-5">
            <span className="feature-num text-xs tracking-widest text-[#a855f7] font-mono block mb-4">05 // RESPONSE</span>
            <h2 className="feature-title text-5xl font-bold tracking-tight text-white mb-6 font-display">Executes Fixes</h2>
            <p className="feature-desc text-neutral-400 leading-relaxed font-sans font-light text-base">
              Depending on confidence: it either re-runs the pipeline automatically, comments the patch directly on your pull request, or pings your developer team on Slack.
            </p>
          </div>
        </section>

        {/* Step 6 */}
        <section className="section min-h-screen flex items-center px-16" id="sec-step-6">
          <div className="feature-content max-w-lg z-10" id="feat-6">
            <span className="feature-num text-xs tracking-widest text-[#a855f7] font-mono block mb-4">06 // LIVE DASHBOARD</span>
            <h2 className="feature-title text-5xl font-bold tracking-tight text-white mb-6 font-display">Tracks everything live</h2>
            <p className="feature-desc text-neutral-400 leading-relaxed font-sans font-light text-base">
              Every failure, diagnosis, and decision shows up in real time on a dashboard — including metrics on whether the agent's fixes successfully repaired the builds over time.
            </p>
          </div>
        </section>

        {/* Team Section */}
        <section className="section min-h-screen flex items-center justify-center py-32 px-8 relative" id="sec-team">
          <div className="team-container w-full max-w-6xl flex flex-col items-center">
            <h2 className="team-heading text-5xl font-bold text-white mb-16 tracking-tight font-display">Meet the Team</h2>
            <div className="team-grid grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 w-full justify-items-center">
              
              {/* Aditya Card */}
              <div className="team-member flex flex-col items-center max-w-sm">
                <ProfileCard
                  id="card-aditya"
                  name="Aditya Raj Srivastava"
                  role="Full-Stack Engineer, Co-Founder"
                  handle="aditya"
                  avatar="aditya.png"
                  github="https://github.com/Aditya-Raj-25"
                  linkedin="https://www.linkedin.com/in/adityarsrivastava-dev/"
                  innerGradient="linear-gradient(145deg, rgba(88, 28, 135, 0.4) 0%, rgba(168, 85, 247, 0.05) 100%)"
                  behindGlowColor="rgba(168, 85, 247, 0.35)"
                />
                <div className="member-meta text-center mt-6">
                  <h4 className="member-name text-lg font-semibold text-white tracking-wide">Aditya Raj Srivastava</h4>
                  <p className="member-role text-xs text-[#a855f7] tracking-wider uppercase font-medium mt-1">Full-Stack Engineer, Co-Founder</p>
                  <p className="member-bio text-sm text-neutral-400 font-light leading-relaxed mt-4 px-2">
                    "Builds the agent's brain — from log parsing to LLM-driven root cause diagnosis. AI Engineer with hands-on work across agentic systems and production LLM pipelines."
                  </p>
                  <div className="member-links flex justify-center gap-6 mt-6">
                    <a href="https://github.com/Aditya-Raj-25" target="_blank" rel="noopener noreferrer" className="social-link text-[#a855f7] text-xs hover:text-white transition-colors">GitHub</a>
                    <a href="https://www.linkedin.com/in/adityarsrivastava-dev/" target="_blank" rel="noopener noreferrer" className="social-link text-[#a855f7] text-xs hover:text-white transition-colors">LinkedIn</a>
                  </div>
                </div>
              </div>

              {/* Shreyam Card */}
              <div className="team-member flex flex-col items-center max-w-sm">
                <ProfileCard
                  id="card-shreyam"
                  name="Shreyam Pandey"
                  role="AI Engineer & Frontend, Co-Founder"
                  handle="shreyam007"
                  avatar="shreyam.png"
                  github="https://github.com/Shreyam007"
                  linkedin="https://www.linkedin.com/in/shreyam-pandey-07712b325/"
                  innerGradient="linear-gradient(145deg, rgba(88, 28, 135, 0.4) 0%, rgba(168, 85, 247, 0.05) 100%)"
                  behindGlowColor="rgba(168, 85, 247, 0.35)"
                />
                <div className="member-meta text-center mt-6">
                  <h4 className="member-name text-lg font-semibold text-white tracking-wide">Shreyam Pandey</h4>
                  <p className="member-role text-xs text-[#a855f7] tracking-wider uppercase font-medium mt-1">AI Engineer & Frontend, Co-Founder</p>
                  <p className="member-bio text-sm text-neutral-400 font-light leading-relaxed mt-4 px-2">
                    "Designed the agent's face and helped build its brain — from the dashboard UI to LLM-driven root cause diagnosis. AI Engineer with hands-on work across agentic systems and production LLM pipelines."
                  </p>
                  <div className="member-links flex justify-center gap-6 mt-6">
                    <a href="https://github.com/Shreyam007" target="_blank" rel="noopener noreferrer" className="social-link text-[#a855f7] text-xs hover:text-white transition-colors">GitHub</a>
                    <a href="https://www.linkedin.com/in/shreyam-pandey-07712b325/" target="_blank" rel="noopener noreferrer" className="social-link text-[#a855f7] text-xs hover:text-white transition-colors">LinkedIn</a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </>
  );
}
