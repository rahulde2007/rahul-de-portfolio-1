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

  revealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.1 && rect.bottom > 0) {
      item.classList.add('visible');
      return;
    }
    revealObserver.observe(item);
  });
}

/* ==========================================================================
   FUTURISTIC 3D ANIMATED CANVAS BACKGROUND
   Engine: Full Desktop (1366x768, 1440x900, 1920x1080) & Mobile Compatibility
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
    hoverRadius: 140
  };

  // Ambient glowing light areas (3 soft breathing cosmic blobs)
  const ambientBlobs = [
    { bx: 0.20, by: 0.25, r: 0.45, hue: 75, phase: 0.0, speed: 0.00020 },
    { bx: 0.80, by: 0.65, r: 0.40, hue: 75, phase: 2.1, speed: 0.00025 },
    { bx: 0.50, by: 0.85, r: 0.38, hue: 75, phase: 4.2, speed: 0.00018 }
  ];

  // Particles & Traveling Pulses
  let particles = [];
  let dataPulses = [];

  function getParticleCount() {
    if (width >= 1024) return 75; // 60–80 particles on desktop
    if (width >= 640) return 40;  // 30–50 particles on tablet
    return 25;                    // 20–30 particles on mobile
  }

  function initParticles() {
    particles = [];
    const count = getParticleCount();
    const isDesktop = width >= 1024;
    for (let i = 0; i < count; i++) {
      const z = 0.15 + Math.random() * 0.85; // Depth factor: 0.15 (far) to 1.0 (near)
      const rand = Math.random();
      // Keep the ambient motion inside the portfolio's existing lime accent family.
      const hue = 75;
      const baseRadius = (isDesktop ? 1.4 : 1.0) + z * (isDesktop ? 2.4 : 1.8);
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: z,
        vx: (Math.random() - 0.5) * (isDesktop ? 0.35 : 0.28) * z,
        vy: (Math.random() - 0.5) * (isDesktop ? 0.26 : 0.20) * z,
        baseRadius: baseRadius,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.018,
        hue: hue,
        connections: 0
      });
    }

    dataPulses = [
      { fromIdx: 0, toIdx: 1, progress: 0, speed: 0.007, active: false },
      { fromIdx: 2, toIdx: 3, progress: 0, speed: 0.009, active: false },
      { fromIdx: 4, toIdx: 5, progress: 0, speed: 0.008, active: false }
    ];
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
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
      const alpha = isLight ? 0.08 : 0.15;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `hsla(${b.hue}, 95%, 60%, ${alpha.toFixed(3)})`);
      grad.addColorStop(0.5, `hsla(${b.hue}, 90%, 55%, ${(alpha * 0.45).toFixed(3)})`);
      grad.addColorStop(1, `hsla(${b.hue}, 90%, 50%, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Draw 3D Perspective Glowing Grid (Desktop, Laptop, Tablet & Mobile)
  function drawPerspectiveGrid(t, camDriftX, camDriftY, mouseOffX, mouseOffY) {
    const isLight = isLightMode();
    const isDesktop = width >= 1024;
    const isTablet = width >= 640 && width < 1024;

    const horizonY = height * 0.52 + mouseOffY * 0.35 + camDriftY * 0.5;
    const vpX = width * 0.5 + mouseOffX * 0.45 + camDriftX * 0.8;
    const floorBottom = height + 40;
    const floorHeight = floorBottom - horizonY;
    if (floorHeight <= 20) return;

    // Desktop: 26 lines, 20 rows; Tablet: 18 lines, 14 rows; Mobile: 10 lines, 10 rows
    const lineCount = isDesktop ? 26 : (isTablet ? 18 : 10);
    const rowCount = isDesktop ? 20 : (isTablet ? 14 : 10);
    const gridHue = 75;
    const baseAlpha = isLight ? 0.25 : 0.55;

    ctx.save();

    // Soft glowing horizon line
    const horizonGrad = ctx.createLinearGradient(vpX - width * 0.7, horizonY, vpX + width * 0.7, horizonY);
    horizonGrad.addColorStop(0, `hsla(${gridHue}, 100%, 70%, 0)`);
    horizonGrad.addColorStop(0.5, `hsla(${gridHue}, 100%, 70%, ${(baseAlpha * 0.75).toFixed(3)})`);
    horizonGrad.addColorStop(1, `hsla(${gridHue}, 100%, 70%, 0)`);
    ctx.strokeStyle = horizonGrad;
    ctx.lineWidth = isDesktop ? 1.4 : 1.0;
    ctx.beginPath();
    ctx.moveTo(vpX - width * 0.7, horizonY);
    ctx.lineTo(vpX + width * 0.7, horizonY);
    ctx.stroke();

    // Longitudinal Convergence Lines (radiating to floor bottom)
    const bottomSpread = width * (isDesktop ? 1.8 : 1.4);
    for (let i = 0; i <= lineCount; i++) {
      const frac = i / lineCount;
      const bottomX = vpX - bottomSpread * 0.5 + frac * bottomSpread;
      const centerDist = Math.abs(frac - 0.5) * 2;
      const lineAlpha = baseAlpha * (1 - centerDist * 0.35);

      const grad = ctx.createLinearGradient(vpX, horizonY, bottomX, floorBottom);
      grad.addColorStop(0, `hsla(${gridHue}, 95%, 65%, 0)`);
      grad.addColorStop(0.25, `hsla(${gridHue}, 95%, 65%, ${(lineAlpha * 0.55).toFixed(3)})`);
      grad.addColorStop(1, `hsla(${gridHue}, 95%, 65%, ${lineAlpha.toFixed(3)})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = isDesktop ? 1.1 : 0.8;
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

      const horizonDistRatio = Math.min(1, (rowY - horizonY) / (floorHeight * 0.25));
      const bottomFadeRatio = rowY > height - 10 ? Math.max(0, (floorBottom - rowY) / 50) : 1;
      const rowAlpha = baseAlpha * horizonDistRatio * bottomFadeRatio * 1.15;

      const halfSpan = (bottomSpread * 0.5) * perspecT;
      const leftX = vpX - halfSpan;
      const rightX = vpX + halfSpan;

      const grad = ctx.createLinearGradient(leftX, rowY, rightX, rowY);
      grad.addColorStop(0, `hsla(${gridHue}, 95%, 65%, 0)`);
      grad.addColorStop(0.15, `hsla(${gridHue}, 95%, 65%, ${rowAlpha.toFixed(3)})`);
      grad.addColorStop(0.85, `hsla(${gridHue}, 95%, 65%, ${rowAlpha.toFixed(3)})`);
      grad.addColorStop(1, `hsla(${gridHue}, 95%, 65%, 0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = isDesktop ? 1.1 : 0.8;
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
    const isDesktop = width >= 1024;
    const isMobile = width < 640;
    const maxLinkDist = isDesktop ? 155 : (isMobile ? 85 : 120);
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
      let projX = p.x + mouseOffX * p.z + camDriftX * p.z * 0.7;
      let projY = p.y + mouseOffY * p.z + camDriftY * p.z * 0.7;

      // Desktop interactive hover deflection
      if (!isMobile && mouse.active) {
        const dx = cursorX - projX;
        const dy = cursorY - projY;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.hoverRadius && dist > 0) {
          const force = (1 - dist / mouse.hoverRadius) * 6.0 * p.z;
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
            ? proxRatio * avgZ * 0.22
            : proxRatio * avgZ * 0.48;

          const linkHue = (pi.hue + pj.hue) * 0.5;
          ctx.strokeStyle = `hsla(${linkHue}, 90%, 65%, ${lineAlpha.toFixed(3)})`;
          ctx.lineWidth = (isDesktop ? 0.7 : 0.5) * avgZ + 0.35;
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.stroke();

          // Trigger traveling data pulses
          for (let pIdx = 0; pIdx < dataPulses.length; pIdx++) {
            if (!dataPulses[pIdx].active && Math.random() < 0.005) {
              dataPulses[pIdx].fromIdx = i;
              dataPulses[pIdx].toIdx = j;
              dataPulses[pIdx].progress = 0;
              dataPulses[pIdx].active = true;
              break;
            }
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
          const pulseAlpha = Math.sin(dp.progress * Math.PI) * (isLight ? 0.6 : 0.9);
          ctx.fillStyle = `hsla(75, 100%, 75%, ${pulseAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, isDesktop ? 2.5 : 2.0, 0, Math.PI * 2);
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
        ? p.z * 0.6 * (0.8 + 0.2 * pulse)
        : p.z * 0.9 * (0.8 + 0.2 * pulse);

      // Glowing outer halo for depth >= 0.35
      if (p.z > 0.35 && !isLight) {
        const glowRadius = radius * (isDesktop ? 4.5 : 3.8);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        grad.addColorStop(0, `hsla(${p.hue}, 95%, 68%, ${(baseAlpha * 0.6).toFixed(3)})`);
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
    const color = isLight ? 'rgba(111, 146, 24, 0.12)' : 'rgba(213, 243, 107, 0.2)';
    ctx.fillStyle = color;
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137 + 40) % width;
      const sy = (i * 179 + 60) % height;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Main Animation Loop
  function animate(timestamp) {
    if (!isRunning) return;
    animationFrameId = requestAnimationFrame(animate);

    if (timestamp - lastTime < 16) return;
    lastTime = timestamp;

    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    const camDriftX = Math.sin(timestamp * 0.00007) * 22 + Math.cos(timestamp * 0.00013) * 10;
    const camDriftY = Math.cos(timestamp * 0.00008) * 12 + Math.sin(timestamp * 0.00011) * 6;

    const mouseOffX = (mouse.x - 0.5) * 45;
    const mouseOffY = (mouse.y - 0.5) * 25;

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

/* ==========================================================================
   SKILLS ORBIT ANIMATION
   Reads skills from existing DOM, builds orbit nodes dynamically
   ========================================================================== */
function initSkillsOrbit() {
  const container = document.getElementById('skillsOrbitContainer');
  const skillsGrid = document.querySelector('.skills-grid');
  if (!container || !skillsGrid) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // Keep static grid for accessibility

  // Gather all skill items from the existing grid
  const skillNodes = [];
  skillsGrid.querySelectorAll('.skill').forEach((skillEl) => {
    const h3 = skillEl.querySelector('h3');
    const items = skillEl.querySelectorAll('.skill-list > span');
    items.forEach((item) => {
      const svg = item.querySelector('svg');
      const b = item.querySelector('b');
      // Clone item to extract only the skill name text without inner badge, text icon or svg text
      const clone = item.cloneNode(true);
      clone.querySelectorAll('svg, b, .skill-text-icon').forEach((el) => el.remove());
      const text = clone.textContent.trim();
      const badge = b ? b.textContent.trim() : '';

      // Skip empty, invalid or incomplete duplicate labels (e.g. standalone "J" or "JS")
      if (!text || text === 'J' || text === 'JS') return;

      skillNodes.push({
        text,
        badge,
        svgHTML: svg ? svg.outerHTML : '',
        category: h3 ? h3.textContent.trim() : ''
      });
    });
  });

  if (skillNodes.length === 0) return;

  // Hide the original grid, show orbit container
  skillsGrid.classList.add('orbit-active');

  // Distribute the existing skills across three orbital layers.
  const orbitLayers = [[], [], []];
  skillNodes.forEach((skill, i) => orbitLayers[i % orbitLayers.length].push(skill));

  // Compute radii based on container size with mobile-safe fallback
  function getRadii() {
    const size = container.offsetWidth || container.getBoundingClientRect().width || Math.min(window.innerWidth * 0.9, 520);
    const isMobile = window.innerWidth <= 480;
    const isSmallMobile = window.innerWidth <= 360;

    if (isSmallMobile) {
      return {
        inner: size * 0.22,
        middle: size * 0.33,
        outer: size * 0.43
      };
    }
    if (isMobile) {
      return {
        inner: size * 0.23,
        middle: size * 0.34,
        outer: size * 0.44
      };
    }
    return {
      inner: size * 0.25,
      middle: size * 0.34,
      outer: size * 0.42
    };
  }

  // Build orbit nodes
  function buildNodes(skills, radiusKey, durationBase, directionFactor) {
    skills.forEach((skill, i) => {
      const angle = (360 / skills.length) * i;
      const node = document.createElement('div');
      node.className = 'skill-orbit-node';
      node.setAttribute('aria-label', skill.text + (skill.badge ? ' — ' + skill.badge : ''));

      const label = document.createElement('div');
      label.className = 'skill-orbit-label';
      if (skill.svgHTML) {
        const svgWrap = document.createElement('span');
        svgWrap.innerHTML = skill.svgHTML;
        const svgEl = svgWrap.querySelector('svg');
        if (svgEl) { svgEl.setAttribute('width', '14'); svgEl.setAttribute('height', '14'); label.appendChild(svgEl); }
      }
      const textSpan = document.createElement('span');
      textSpan.textContent = skill.text;
      label.appendChild(textSpan);
      if (skill.badge) {
        const b = document.createElement('b');
        b.textContent = skill.badge;
        label.appendChild(b);
      }

      node.appendChild(label);
      container.appendChild(node);

      // Hover: pause
      node.addEventListener('mouseenter', () => node.classList.add('paused'));
      node.addEventListener('mouseleave', () => node.classList.remove('paused'));
      node.addEventListener('touchstart', () => node.classList.toggle('paused'), { passive: true });

      // Store for dynamic radius update
      node._skillData = { angle, radiusKey, durationBase, directionFactor, index: i, total: skills.length };
    });
  }

  buildNodes(orbitLayers[0], 'inner', 22, 1);
  buildNodes(orbitLayers[1], 'middle', 31, -1);
  buildNodes(orbitLayers[2], 'outer', 42, 1);

  // Apply CSS custom properties for animation
  function applyRadii() {
    const { inner, middle, outer } = getRadii();
    const isMobile = window.innerWidth <= 480;

    container.querySelectorAll('.skill-orbit-node').forEach((node) => {
      const d = node._skillData;
      if (!d) return;
      const r = d.radiusKey === 'inner' ? inner : (d.radiusKey === 'middle' ? middle : outer);
      const dir = d.directionFactor;
      const angleStart = d.angle;
      const duration = (d.durationBase + d.index * 2.5) * (d.total > 4 ? 1 : 1.3);
      const depth = 0.78 + ((d.index * 0.19) % 0.42);
      const tilt = isMobile
        ? (d.radiusKey === 'inner' ? -8 : (d.radiusKey === 'middle' ? 5 : 12))
        : (d.radiusKey === 'inner' ? -14 : (d.radiusKey === 'middle' ? 8 : 22));

      node.style.cssText = `
        --orbit-start: ${angleStart}deg;
        --orbit-radius: ${r}px;
        --orbit-duration: ${duration}s;
        --orbit-depth: ${depth.toFixed(2)};
        --orbit-tilt: ${tilt}deg;
        animation-duration: ${duration}s;
        animation-direction: ${dir === -1 ? 'reverse' : 'normal'};
      `;
    });
  }

  applyRadii();

  // Re-apply on resize, orientation change, and window load
  let orbitResizeTimer;
  const triggerRadiiUpdate = () => {
    clearTimeout(orbitResizeTimer);
    orbitResizeTimer = setTimeout(applyRadii, 100);
  };

  window.addEventListener('resize', triggerRadiiUpdate, { passive: true });
  window.addEventListener('orientationchange', triggerRadiiUpdate, { passive: true });
  window.addEventListener('load', applyRadii, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSkillsOrbit);
} else {
  initSkillsOrbit();
}

/* ==========================================================================
   PHOTO ORBIT DOT — Dynamic radius based on actual photo frame size
   ========================================================================== */
function initPhotoOrbitDot() {
  const frame = document.querySelector('.hero-photo-frame');
  const dot = document.querySelector('.photo-orbit-dot');
  if (!frame || !dot) return;

  function updateOrbitRadius() {
    const r = frame.offsetWidth / 2;
    dot.style.setProperty('--orbit-r', r + 'px');
  }

  updateOrbitRadius();
  window.addEventListener('resize', updateOrbitRadius, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhotoOrbitDot);
} else {
  initPhotoOrbitDot();
}

/* ==========================================================================
   MESSAGE SENT — Contact form animated success state
   ========================================================================== */
(function initMessageSent() {
  const sendBtn = document.getElementById('contactSendBtn');
  const overlay = document.getElementById('msgSentOverlay');
  const resetBtn = document.getElementById('msgSentReset');
  const textarea = document.getElementById('contactMsg');

  if (!sendBtn || !overlay) return;

  sendBtn.addEventListener('click', () => {
    const msg = textarea ? textarea.value.trim() : '';
    if (!msg) {
      // Shake the textarea if empty
      if (textarea) {
        textarea.style.transition = 'border-color 0.15s ease';
        textarea.style.borderColor = 'rgba(255, 100, 100, 0.6)';
        setTimeout(() => { textarea.style.borderColor = ''; }, 1200);
      }
      return;
    }

    // Show overlay
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('visible');
    sendBtn.disabled = true;

    // In a real deployment this would POST/email. Here we open mailto as fallback.
    const subject = encodeURIComponent('Message from Rahul De Portfolio');
    const body = encodeURIComponent(msg);
    // Silently attempt mailto (non-blocking)
    try {
      const a = document.createElement('a');
      a.href = `mailto:rahulde937@gmail.com?subject=${subject}&body=${body}`;
      a.click();
    } catch (_) {}
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
      if (textarea) textarea.value = '';
      sendBtn.disabled = false;
    });
  }
})();

