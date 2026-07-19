// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  
  // Elements
  const preloader = document.getElementById("preloader");
  const progressBar = document.getElementById("progress-bar");
  const loaderPerc = document.getElementById("loader-perc");
  const canvas = document.getElementById("robot-canvas");
  const context = canvas.getContext("2d");
  
  // Total Frames configuration
  const totalFrames = 431;
  const images = [];
  let loadedCount = 0;
  let currentFrameIndex = 0;

  // Frame path resolver
  function getFramePath(i) {
    if (i < 300) {
      // zip1 frames: ezgif-frame-001.jpg to ezgif-frame-300.jpg
      const frameNum = String(i + 1).padStart(3, '0');
      return `zip1/ezgif-frame-${frameNum}.jpg`;
    } else {
      // zip2 frames: 1.jpg to 131.jpg (indices 300 to 430)
      const frameNum = i - 300 + 1;
      return `zip2/${frameNum}.jpg`;
    }
  }

  // Preload all frames
  function preloadAllImages() {
    return new Promise((resolve) => {
      // SVG progress bar calculations
      const circleRadius = 70;
      const circumference = 2 * Math.PI * circleRadius;
      progressBar.style.strokeDasharray = circumference;
      progressBar.style.strokeDashoffset = circumference;

      for (let i = 0; i < totalFrames; i++) {
        const img = new Image();
        img.src = getFramePath(i);
        
        img.onload = onAssetLoad;
        img.onerror = onAssetLoad; // count errors to avoid hanging loader
        images.push(img);
      }

      function onAssetLoad() {
        loadedCount++;
        const progress = loadedCount / totalFrames;
        const percentage = Math.floor(progress * 100);
        
        // Update loader percentage and SVG circle
        loaderPerc.textContent = String(percentage).padStart(2, '0');
        const offset = circumference - (progress * circumference);
        progressBar.style.strokeDashoffset = offset;

        if (loadedCount === totalFrames) {
          resolve();
        }
      }
    });
  }

  // Draw current frame to canvas
  function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate containment sizes
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, x, y;

    if (canvasRatio > imgRatio) {
      drawHeight = canvas.height;
      drawWidth = drawHeight * imgRatio;
    } else {
      drawWidth = canvas.width;
      drawHeight = drawWidth / imgRatio;
    }

    x = (canvas.width - drawWidth) / 2;
    y = (canvas.height - drawHeight) / 2;

    context.drawImage(img, x, y, drawWidth, drawHeight);
  }

  // Resize canvas to fill screen crisp on high-res displays
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    // Scale drawings back
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    
    drawFrame(currentFrameIndex);
  }

  // Initialize
  async function init() {
    // Hide header immediately so we can fade it in later
    gsap.set("header", { opacity: 0 });
    
    // Preload
    await preloadAllImages();
    
    // Initial draw & size
    resize();
    window.addEventListener("resize", resize);

    // Fade out preloader
    const introTl = gsap.timeline({
      onComplete: () => {
        // Init smooth scrolling and scroll triggers after loader finishes
        initScrollSystem();
      }
    });

    introTl.to(preloader, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.out"
    })
    .set(preloader, { display: "none" })
    .to("#hero-title-1", {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "power4.out"
    }, "-=0.3")
    .to("#hero-title-2", {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "power4.out"
    }, "-=1.0")
    .to(".hero-subtitle", {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "power3.out"
    }, "-=0.8")
    .to(".scroll-indicator", {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.6")
    .to("header", {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.8");
  }

  // Initialize Lenis Smooth Scroll and GSAP ScrollTrigger
  function initScrollSystem() {
    // 1. Setup Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // 2. Animate canvas frame progression & layout shifts
    const air = { frame: 0 };
    
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
      }
    });

    // Progression of frames
    scrollTl.to(air, {
      frame: totalFrames - 1,
      snap: "frame",
      ease: "none",
      onUpdate: () => {
        currentFrameIndex = air.frame;
        drawFrame(currentFrameIndex);
      }
    }, 0);

    // Shift canvas model to the right side (creating empty space on left)
    // Starts shifting right after Hero, completely shifted by middle of scroll
    scrollTl.to(".canvas-wrapper", {
      x: "20vw",
      scale: 0.88,
      ease: "power1.inOut",
      duration: 0.25 // completes early (25% of scroll)
    }, 0);

    // Shift canvas model back to the center during the Team section entry
    scrollTl.to(".canvas-wrapper", {
      x: "0vw",
      scale: 0.95,
      ease: "power1.inOut",
      duration: 0.15
    }, 0.85);

    // 3. Fade out Hero elements on scroll
    gsap.to(".hero-title-container", {
      opacity: 0,
      y: -80,
      ease: "power1.out",
      scrollTrigger: {
        trigger: "#sec-hero",
        start: "top top",
        end: "bottom 30%",
        scrub: true
      }
    });

    // 3.5. Parallax effect for code background
    gsap.to(".code-bg pre", {
      y: "-25vh",
      ease: "none",
      scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });

    // 4. Feature sections animations (Left-side content triggers)
    const features = gsap.utils.toArray(".feature-content");
    
    features.forEach((feat, index) => {
      // Fade and slide in
      gsap.fromTo(feat, 
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: feat.closest(".section"),
            start: "top 75%",
            end: "top 35%",
            scrub: true,
            toggleActions: "play reverse play reverse"
          }
        }
      );

      // Fade and slide out as it leaves
      gsap.to(feat, {
        opacity: 0,
        y: -60,
        ease: "power2.in",
        scrollTrigger: {
          trigger: feat.closest(".section"),
          start: "bottom 45%",
          end: "bottom 10%",
          scrub: true
        }
      });
    });

    // 6. Initialize interactive profile cards tilt
    document.querySelectorAll('.pc-card-wrapper').forEach(cardEl => {
      new ProfileCardTilt(cardEl);
    });
  }

  // ==========================================================================
  // Profile Card Tilt Engine (vanilla JS port of React Bits component)
  // ==========================================================================
  class ProfileCardTilt {
    constructor(element) {
      this.wrap = element;
      this.shell = element.querySelector('.pc-card-shell');
      this.card = element.querySelector('.pc-card');
      
      this.enableTilt = true;
      this.running = false;
      this.lastTs = 0;
      
      this.currentX = 0;
      this.currentY = 0;
      this.targetX = 0;
      this.targetY = 0;
      
      this.DEFAULT_TAU = 0.14;
      this.INITIAL_TAU = 0.6;
      this.initialUntil = 0;
      
      this.width = 1;
      this.height = 1;
      
      this.init();
    }
    
    init() {
      this.width = this.shell.clientWidth || 1;
      this.height = this.shell.clientHeight || 1;
      
      // Center card variables initially
      this.setImmediate(this.width / 2, this.height / 2);
      
      // Hover event listeners
      this.shell.addEventListener('pointerenter', (e) => this.handleEnter(e));
      this.shell.addEventListener('pointermove', (e) => this.handleMove(e));
      this.shell.addEventListener('pointerleave', () => this.handleLeave());
      
      // Recalculate dimensions on window resize
      window.addEventListener('resize', () => {
        this.width = this.shell.clientWidth || 1;
        this.height = this.shell.clientHeight || 1;
      });
      
      // Trigger initial card wiggle
      this.beginInitial(1200);
    }
    
    clamp(v, min = 0, max = 100) {
      return Math.min(Math.max(v, min), max);
    }
    
    adjust(v, fMin, fMax, tMin, tMax) {
      return parseFloat((tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin)).toFixed(3));
    }
    
    setVars(x, y) {
      const percentX = this.clamp((100 / this.width) * x);
      const percentY = this.clamp((100 / this.height) * y);
      
      const centerX = percentX - 50;
      const centerY = percentY - 50;
      
      const bgX = this.adjust(percentX, 0, 100, 35, 65);
      const bgY = this.adjust(percentY, 0, 100, 35, 65);
      
      const pointerFromCenter = this.clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1);
      
      this.wrap.style.setProperty('--pointer-x', `${percentX}%`);
      this.wrap.style.setProperty('--pointer-y', `${percentY}%`);
      this.wrap.style.setProperty('--background-x', `${bgX}%`);
      this.wrap.style.setProperty('--background-y', `${bgY}%`);
      this.wrap.style.setProperty('--pointer-from-center', `${pointerFromCenter}`);
      this.wrap.style.setProperty('--pointer-from-top', `${percentY / 100}`);
      this.wrap.style.setProperty('--pointer-from-left', `${percentX / 100}`);
      this.wrap.style.setProperty('--rotate-x', `${-(centerX / 5)}deg`);
      this.wrap.style.setProperty('--rotate-y', `${centerY / 4}deg`);
    }
    
    setImmediate(x, y) {
      this.currentX = x;
      this.currentY = y;
      this.setVars(x, y);
    }
    
    setTarget(x, y) {
      this.targetX = x;
      this.targetY = y;
      this.startLoop();
    }
    
    toCenter() {
      this.setTarget(this.width / 2, this.height / 2);
    }
    
    beginInitial(durationMs) {
      this.initialUntil = performance.now() + durationMs;
      this.startLoop();
    }
    
    startLoop() {
      if (this.running) return;
      this.running = true;
      this.lastTs = 0;
      requestAnimationFrame((ts) => this.loop(ts));
    }
    
    loop(ts) {
      if (!this.running) return;
      if (this.lastTs === 0) this.lastTs = ts;
      const dt = (ts - this.lastTs) / 1000;
      this.lastTs = ts;
      
      const tau = ts < this.initialUntil ? this.INITIAL_TAU : this.DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);
      
      this.currentX += (this.targetX - this.currentX) * k;
      this.currentY += (this.targetY - this.currentY) * k;
      
      this.setVars(this.currentX, this.currentY);
      
      const stillFar = Math.abs(this.targetX - this.currentX) > 0.05 || Math.abs(this.targetY - this.currentY) > 0.05;
      
      if (stillFar) {
        requestAnimationFrame((ts) => this.loop(ts));
      } else {
        this.running = false;
        this.lastTs = 0;
      }
    }
    
    handleEnter(e) {
      this.shell.classList.add('active');
      this.shell.classList.add('entering');
      setTimeout(() => {
        this.shell.classList.remove('entering');
      }, 180);
      
      const rect = this.shell.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.setTarget(x, y);
    }
    
    handleMove(e) {
      const rect = this.shell.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.setTarget(x, y);
    }
    
    handleLeave() {
      this.toCenter();
      const checkSettle = () => {
        const settled = Math.hypot(this.targetX - this.currentX, this.targetY - this.currentY) < 0.6;
        if (settled) {
          this.shell.classList.remove('active');
        } else {
          requestAnimationFrame(checkSettle);
        }
      };
      requestAnimationFrame(checkSettle);
    }
  }

  // Start initialization
  init();
});
