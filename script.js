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
  themeIcon.textContent = isLight ? '☾' : '☼';
  themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  localStorage.setItem('rahul-theme', theme);
}

setTheme(localStorage.getItem('rahul-theme') || 'dark');
themeToggle.addEventListener('click', () => setTheme(body.classList.contains('light-theme') ? 'dark' : 'light'));

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

function updateScrollState() {
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollAmount = pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;
  progressBar.style.width = `${scrollAmount}%`;

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
   Cyber Code & Digital Particle Background Animation
   ========================================================================== */
function initCyberBackground() {
  const canvas = document.getElementById('cyber-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animationFrameId = null;
  let isRunning = false;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const CHARS = '010101<>{}[]/*+=~^$#%&|!?λ0x:;αβπ∑√∂'.split('');
  let columns = [];
  const fontSize = 14;
  let colCount = 0;
  let particles = [];
  const mouse = { x: -1000, y: -1000, active: false, radius: 120 };

  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    mouse.active = false;
  }, { passive: true });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    const colWidth = fontSize * 1.6;
    colCount = Math.floor(width / colWidth);
    columns = [];
    for (let i = 0; i < colCount; i++) {
      const active = Math.random() < 0.45;
      columns.push({
        x: i * colWidth,
        y: Math.random() * -height,
        speed: 1.0 + Math.random() * 1.8,
        length: Math.floor(8 + Math.random() * 14),
        active: active,
        delay: Math.floor(Math.random() * 120),
        chars: Array.from({ length: 24 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
        accent: Math.random() < 0.35
      });
    }

    particles = [];
    const count = Math.min(35, Math.max(14, Math.floor(width / 45)));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: 1.0 + Math.random() * 1.4,
        pulse: Math.random() * Math.PI * 2,
        isAccent: Math.random() < 0.4
      });
    }
  }

  function drawStaticBackground() {
    ctx.clearRect(0, 0, width, height);
    const isLight = document.body.classList.contains('light-theme');
    const color = isLight ? 'rgba(111, 146, 24, 0.08)' : 'rgba(213, 243, 107, 0.07)';
    ctx.fillStyle = color;
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % width;
      const y = (i * 131) % height;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let lastTime = 0;
  function animate(timestamp) {
    if (!isRunning) return;
    animationFrameId = requestAnimationFrame(animate);

    if (timestamp - lastTime < 18) return;
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);
    const isLight = document.body.classList.contains('light-theme');

    const headColor = isLight ? 'rgba(78, 105, 14, 0.75)' : 'rgba(213, 243, 107, 0.75)';
    const cyanHeadColor = isLight ? 'rgba(14, 116, 144, 0.75)' : 'rgba(56, 189, 248, 0.75)';
    const trailColor = isLight ? '111, 146, 24' : '155, 164, 155';
    const accentTrailColor = isLight ? '78, 105, 14' : '213, 243, 107';
    const particleColor = isLight ? '111, 146, 24' : '213, 243, 107';
    const cyanColor = isLight ? '14, 116, 144' : '56, 189, 248';

    // 1. Matrix falling code drops
    ctx.font = `${fontSize}px "DM Mono", monospace`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (!col.active) {
        col.delay--;
        if (col.delay <= 0) {
          col.active = true;
          col.y = -col.length * fontSize;
          col.speed = 1.0 + Math.random() * 1.8;
          col.accent = Math.random() < 0.35;
        }
        continue;
      }

      if (Math.random() < 0.05) {
        const charIdx = Math.floor(Math.random() * col.chars.length);
        col.chars[charIdx] = CHARS[Math.floor(Math.random() * CHARS.length)];
      }

      for (let j = 0; j < col.length; j++) {
        const charY = col.y - j * fontSize;
        if (charY < -fontSize || charY > height) continue;

        const char = col.chars[j % col.chars.length];
        if (j === 0) {
          ctx.fillStyle = col.accent ? cyanHeadColor : headColor;
          ctx.shadowBlur = 6;
          ctx.shadowColor = col.accent ? 'rgba(56,189,248,0.5)' : 'rgba(213,243,107,0.5)';
          ctx.fillText(char, col.x, charY);
          ctx.shadowBlur = 0;
        } else {
          const fade = (1 - (j / col.length));
          const alpha = (fade * (col.accent ? 0.22 : 0.12)).toFixed(3);
          ctx.fillStyle = col.accent ? `rgba(${accentTrailColor}, ${alpha})` : `rgba(${trailColor}, ${alpha})`;
          ctx.fillText(char, col.x, charY);
        }
      }

      col.y += col.speed;
      if (col.y - (col.length * fontSize) > height) {
        col.active = false;
        col.delay = Math.floor(30 + Math.random() * 100);
      }
    }

    // 2. Digital particles & connector lines
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.02;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius && dist > 0) {
          p.x -= (dx / dist) * 0.7;
          p.y -= (dy / dist) * 0.7;
        }
      }

      const pulseAlpha = 0.2 + 0.15 * Math.sin(p.pulse);
      const c = p.isAccent ? particleColor : cyanColor;
      ctx.fillStyle = `rgba(${c}, ${pulseAlpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      for (let k = i + 1; k < particles.length; k++) {
        const p2 = particles[k];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 95) {
          const lineAlpha = ((1 - dist / 95) * 0.12).toFixed(3);
          ctx.strokeStyle = `rgba(${c}, ${lineAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }

  function start() {
    if (prefersReducedMotion.matches) {
      drawStaticBackground();
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

  resize();
  start();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (prefersReducedMotion.matches) drawStaticBackground();
    }, 150);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!prefersReducedMotion.matches) start();
  });

  prefersReducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      stop();
      drawStaticBackground();
    } else {
      start();
    }
  });
}

initCyberBackground();

