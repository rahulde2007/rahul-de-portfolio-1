const body = document.body;
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.querySelector('.theme-icon');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const navLinks = [...document.querySelectorAll('.nav-link')];
const progressBar = document.querySelector('.scroll-progress span');
const sections = [...document.querySelectorAll('main section[id]')];

function setTheme(theme) {
  const isLight = theme === 'light';
  body.classList.toggle('light-theme', isLight);
  if (themeIcon) themeIcon.textContent = isLight ? '☾' : '☼';
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  }
  localStorage.setItem('rahul-theme', theme);
}

setTheme(localStorage.getItem('rahul-theme') || 'dark');
if (themeToggle) {
  themeToggle.addEventListener('click', () => setTheme(body.classList.contains('light-theme') ? 'dark' : 'light'));
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    if (siteNav.classList.contains('open') && !siteNav.contains(e.target) && !menuToggle.contains(e.target)) {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close mobile nav on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && siteNav.classList.contains('open')) {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.focus();
    }
  });
}

function updateScrollState() {
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollAmount = pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = `${scrollAmount}%`;

  let currentSection = 'home';
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 180) currentSection = section.id;
  });
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`));
}

window.addEventListener('scroll', updateScrollState, { passive: true });
window.addEventListener('resize', updateScrollState);
updateScrollState();

const revealItems = document.querySelectorAll('.reveal');
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  revealItems.forEach((item) => item.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

/* ==========================================================================
   FUTURISTIC 3D ANIMATED CANVAS BACKGROUND
   Features:
   1. Dark Futuristic Deep Atmospheric Glow (Cyan/Blue/Violet radial ambient glows)
   2. 3D Perspective Glowing Grid (Horizon vanishing point, moving depth rows, longitudinal beams)
   3. Floating 3D Particles (~60 desktop, ~30 mobile with depth, pulsing cyan/blue glow)
   4. Connecting Glowing Lines (proportional proximity fading, capped density, traveling energy pulses)
   5. Smooth Mouse Parallax & Dynamic Depth Motion
   6. Accessibility: prefers-reduced-motion support, devicePixelRatio scaling, lifecycle pause/resume
   ========================================================================== */
function initFuturisticBackground() {
  let canvas = document.getElementById('futuristic-bg') || document.getElementById('cyber-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'futuristic-bg';
    canvas.className = 'futuristic-bg cyber-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animationFrameId = null;
  let isRunning = false;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastTime = 0;

  // Mouse coordinates with smooth lerping
  const mouse = {
    x: 0.5,
    y: 0.5,
    tx: 0.5,
    ty: 0.5,
    active: false,
    hoverRadius: 130
  };

  // Ambient glowing light areas
  const ambientBlobs = [
    { bx: 0.20, by: 0.25, r: 0.42, hue: 188, phase: 0.0, speed: 0.00020 },
    { bx: 0.80, by: 0.65, r: 0.38, hue: 220, phase: 2.1, speed: 0.00025 },
    { bx: 0.50, by: 0.85, r: 0.35, hue: 275, phase: 4.2, speed: 0.00018 }
  ];

  // Particles & Traveling Pulses
  let particles = [];
  let dataPulses = [];

  function getParticleCount() {
    return width < 640 ? 30 : 60;
  }

  function initParticles() {
    particles = [];
    const count = getParticleCount();
    for (let i = 0; i < count; i++) {
      const z = 0.15 + Math.random() * 0.85; // Depth factor: 0.15 (far) to 1.0 (near)
      const rand = Math.random();
      // Cyber Glow Palette: Electric Cyan (55%), Tech Blue (30%), Subtle Violet (15%)
      const hue = rand < 0.55 ? 188 : (rand < 0.85 ? 215 : 272);
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: z,
        vx: (Math.random() - 0.5) * 0.32 * z,
        vy: (Math.random() - 0.5) * 0.24 * z,
        baseRadius: 0.9 + z * 2.2, // Sizes between 1.2px and 3.1px
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.018,
        hue: hue,
        connections: 0
      });
    }

    dataPulses = [
      { fromIdx: 0, toIdx: 1, progress: 0, speed: 0.007, active: false },
      { fromIdx: 2, toIdx: 3, progress: 0, speed: 0.009, active: false }
    ];
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function isLightMode() {
    return document.body.classList.contains('light-theme');
  }

  // 1. Draw Glowing Ambient Light Areas
  function drawAmbientBlobs(t) {
    const isLight = isLightMode();
    const maxDim = Math.max(width, height);

    for (let i = 0; i < ambientBlobs.length; i++) {
      const b = ambientBlobs[i];
      const cx = (b.bx + 0.06 * Math.sin(t * b.speed * 1000 + b.phase)) * width;
      const cy = (b.by + 0.06 * Math.cos(t * b.speed * 1000 + b.phase * 0.8)) * height;
      const radius = b.r * maxDim;
      const alpha = isLight ? 0.06 : 0.12;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `hsla(${b.hue}, 95%, 60%, ${alpha.toFixed(3)})`);
      grad.addColorStop(0.5, `hsla(${b.hue}, 90%, 55%, ${(alpha * 0.4).toFixed(3)})`);
      grad.addColorStop(1, `hsla(${b.hue}, 90%, 50%, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Draw 3D Perspective Glowing Grid
  function drawPerspectiveGrid(t, camDriftX, camDriftY, mouseOffX, mouseOffY) {
    const isLight = isLightMode();
    const isMobile = width < 640;

    const horizonY = height * 0.52 + mouseOffY * 0.35 + camDriftY * 0.5;
    const vpX = width * 0.5 + mouseOffX * 0.45 + camDriftX * 0.8;
    const floorBottom = height + 30;
    const floorHeight = floorBottom - horizonY;
    if (floorHeight <= 20) return;

    const lineCount = isMobile ? 8 : 14;
    const rowCount = isMobile ? 8 : 14;
    const gridHue = isLight ? 205 : 188;
    const baseAlpha = isLight ? 0.18 : 0.42;

    ctx.save();

    // Soft glowing horizon line
    const horizonGrad = ctx.createLinearGradient(vpX - width * 0.6, horizonY, vpX + width * 0.6, horizonY);
    horizonGrad.addColorStop(0, `hsla(${gridHue}, 100%, 70%, 0)`);
    horizonGrad.addColorStop(0.5, `hsla(${gridHue}, 100%, 70%, ${(baseAlpha * 0.65).toFixed(3)})`);
    horizonGrad.addColorStop(1, `hsla(${gridHue}, 100%, 70%, 0)`);
    ctx.strokeStyle = horizonGrad;
    ctx.lineWidth = isMobile ? 0.8 : 1.2;
    ctx.beginPath();
    ctx.moveTo(vpX - width * 0.6, horizonY);
    ctx.lineTo(vpX + width * 0.6, horizonY);
    ctx.stroke();

    // Longitudinal Convergence Lines (radiating to floor bottom)
    const bottomSpread = width * (isMobile ? 1.4 : 1.3);
    for (let i = 0; i <= lineCount; i++) {
      const frac = i / lineCount;
      const bottomX = vpX - bottomSpread * 0.5 + frac * bottomSpread;
      const centerDist = Math.abs(frac - 0.5) * 2;
      const lineAlpha = baseAlpha * (1 - centerDist * 0.4);

      const grad = ctx.createLinearGradient(vpX, horizonY, bottomX, floorBottom);
      grad.addColorStop(0, `hsla(${gridHue}, 95%, 65%, 0)`);
      grad.addColorStop(0.25, `hsla(${gridHue}, 95%, 65%, ${(lineAlpha * 0.5).toFixed(3)})`);
      grad.addColorStop(1, `hsla(${gridHue}, 95%, 65%, ${lineAlpha.toFixed(3)})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = isMobile ? 0.7 : 0.9;
      ctx.beginPath();
      ctx.moveTo(vpX, horizonY);
      ctx.lineTo(bottomX, floorBottom);
      ctx.stroke();
    }

    // Transverse Horizontal Rows (Perspective-correct, moving toward viewer)
    const scrollSpeed = 0.00015;
    const scrollFrac = (t * scrollSpeed) % 1;

    for (let r = 0; r <= rowCount; r++) {
      const rawFrac = (r + scrollFrac) / rowCount;
      const wrappedFrac = rawFrac % 1;
      const perspecT = Math.pow(wrappedFrac, 2.2);
      const rowY = horizonY + floorHeight * perspecT;

      if (rowY < horizonY + 3 || rowY > floorBottom) continue;

      const horizonDistRatio = Math.min(1, (rowY - horizonY) / (floorHeight * 0.28));
      const bottomFadeRatio = rowY > height - 10 ? Math.max(0, (floorBottom - rowY) / 40) : 1;
      const rowAlpha = baseAlpha * horizonDistRatio * bottomFadeRatio * 1.1;

      const leftX = vpX - (bottomSpread * 0.5) * perspecT;
      const rightX = vpX + (bottomSpread * 0.5) * perspecT;

      const grad = ctx.createLinearGradient(leftX, rowY, rightX, rowY);
      grad.addColorStop(0, `hsla(${gridHue}, 95%, 65%, 0)`);
      grad.addColorStop(0.2, `hsla(${gridHue}, 95%, 65%, ${rowAlpha.toFixed(3)})`);
      grad.addColorStop(0.8, `hsla(${gridHue}, 95%, 65%, ${rowAlpha.toFixed(3)})`);
      grad.addColorStop(1, `hsla(${gridHue}, 95%, 65%, 0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = isMobile ? 0.7 : 0.9;
      ctx.beginPath();
      ctx.moveTo(leftX, rowY);
      ctx.lineTo(rightX, rowY);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 3. Draw 3D Floating Particles, Connecting Lines & Traveling Pulses
  function drawParticlesAndNetwork(t, camDriftX, camDriftY, mouseOffX, mouseOffY) {
    const isLight = isLightMode();
    const isMobile = width < 640;
    const maxLinkDist = isMobile ? 90 : 135;
    const maxConnectionsPerParticle = 3;

    for (let i = 0; i < particles.length; i++) {
      particles[i].connections = 0;
    }

    const cursorX = mouse.x * width;
    const cursorY = mouse.y * height;

    const projected = new Array(particles.length);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.phase += p.pulseSpeed;

      // Screen edge wrapping
      if (p.x < -30) p.x = width + 30;
      if (p.x > width + 30) p.x = -30;
      if (p.y < -30) p.y = height + 30;
      if (p.y > height + 30) p.y = -30;

      // 3D Parallax offset based on depth (z)
      let projX = p.x + mouseOffX * p.z + camDriftX * p.z * 0.6;
      let projY = p.y + mouseOffY * p.z + camDriftY * p.z * 0.6;

      // Desktop interactive cursor aura
      if (!isMobile && mouse.active) {
        const dx = cursorX - projX;
        const dy = cursorY - projY;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.hoverRadius && dist > 0) {
          const force = (1 - dist / mouse.hoverRadius) * 5.0 * p.z;
          projX -= (dx / dist) * force;
          projY -= (dy / dist) * force;
        }
      }

      projected[i] = { x: projX, y: projY, z: p.z, hue: p.hue, baseRadius: p.baseRadius, phase: p.phase };
    }

    // Connecting Lines
    ctx.save();
    for (let i = 0; i < particles.length; i++) {
      const pi = projected[i];
      if (particles[i].connections >= maxConnectionsPerParticle) continue;

      for (let j = i + 1; j < particles.length; j++) {
        if (particles[i].connections >= maxConnectionsPerParticle) break;
        if (particles[j].connections >= maxConnectionsPerParticle) continue;

        const pj = projected[j];
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxLinkDist) {
          particles[i].connections++;
          particles[j].connections++;

          const proxRatio = 1 - dist / maxLinkDist;
          const avgZ = (pi.z + pj.z) * 0.5;
          const lineAlpha = isLight
            ? proxRatio * avgZ * 0.18
            : proxRatio * avgZ * 0.38;

          const linkHue = (pi.hue + pj.hue) * 0.5;
          ctx.strokeStyle = `hsla(${linkHue}, 90%, 65%, ${lineAlpha.toFixed(3)})`;
          ctx.lineWidth = 0.6 * avgZ + 0.3;
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.stroke();

          if (!dataPulses[0].active && Math.random() < 0.004) {
            dataPulses[0].fromIdx = i;
            dataPulses[0].toIdx = j;
            dataPulses[0].progress = 0;
            dataPulses[0].active = true;
          }
        }
      }
    }
    ctx.restore();

    // Traveling Data Pulses
    for (let k = 0; k < dataPulses.length; k++) {
      const dp = dataPulses[k];
      if (dp.active) {
        dp.progress += dp.speed;
        if (dp.progress >= 1) {
          dp.active = false;
          continue;
        }
        const pA = projected[dp.fromIdx];
        const pB = projected[dp.toIdx];
        if (pA && pB) {
          const pulseX = pA.x + (pB.x - pA.x) * dp.progress;
          const pulseY = pA.y + (pB.y - pA.y) * dp.progress;
          const pulseAlpha = Math.sin(dp.progress * Math.PI) * (isLight ? 0.5 : 0.85);
          ctx.fillStyle = `hsla(185, 100%, 75%, ${pulseAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3D Depth Particles
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      const pulse = 0.5 + 0.5 * Math.sin(p.phase);
      const radius = p.baseRadius * (0.85 + 0.15 * pulse);

      const baseAlpha = isLight
        ? p.z * 0.55 * (0.8 + 0.2 * pulse)
        : p.z * 0.85 * (0.8 + 0.2 * pulse);

      // Glowing outer halo for foreground particles
      if (p.z > 0.45 && !isLight) {
        const glowRadius = radius * 4.0;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        grad.addColorStop(0, `hsla(${p.hue}, 95%, 68%, ${(baseAlpha * 0.55).toFixed(3)})`);
        grad.addColorStop(1, `hsla(${p.hue}, 95%, 68%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core particle
      ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${baseAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Static Render for Prefers-Reduced-Motion
  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    const isLight = isLightMode();
    const color = isLight ? 'rgba(30, 100, 160, 0.12)' : 'rgba(0, 230, 255, 0.18)';
    ctx.fillStyle = color;
    for (let i = 0; i < 45; i++) {
      const sx = (i * 137 + 40) % width;
      const sy = (i * 179 + 60) % height;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Main Animation Loop
  function animate(timestamp) {
    if (!isRunning) return;
    animationFrameId = requestAnimationFrame(animate);

    if (timestamp - lastTime < 16) return;
    lastTime = timestamp;

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    const camDriftX = Math.sin(timestamp * 0.00007) * 22 + Math.cos(timestamp * 0.00013) * 10;
    const camDriftY = Math.cos(timestamp * 0.00008) * 12 + Math.sin(timestamp * 0.00011) * 6;

    const mouseOffX = (mouse.x - 0.5) * 36;
    const mouseOffY = (mouse.y - 0.5) * 20;

    ctx.clearRect(0, 0, width, height);

    drawAmbientBlobs(timestamp);
    drawPerspectiveGrid(timestamp, camDriftX, camDriftY, mouseOffX, mouseOffY);
    drawParticlesAndNetwork(timestamp, camDriftX, camDriftY, mouseOffX, mouseOffY);
  }

  // Lifecycle
  function start() {
    if (prefersReducedMotion.matches) {
      drawStatic();
      return;
    }
    if (!isRunning) {
      isRunning = true;
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  function stop() {
    isRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // Pointer listeners with passive performance
  let mouseThrottle = 0;
  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - mouseThrottle < 16) return;
    mouseThrottle = now;
    mouse.tx = e.clientX / Math.max(window.innerWidth, 1);
    mouse.ty = e.clientY / Math.max(window.innerHeight, 1);
    mouse.active = true;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    mouse.active = false;
    mouse.tx = 0.5;
    mouse.ty = 0.5;
  }, { passive: true });

  resize();
  start();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (prefersReducedMotion.matches) drawStatic();
    }, 150);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!prefersReducedMotion.matches) start();
  });

  prefersReducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      stop();
      drawStatic();
    } else {
      start();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFuturisticBackground);
} else {
  initFuturisticBackground();
}
