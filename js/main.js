document.addEventListener('DOMContentLoaded', () => {
  // Wait for header/footer components to load
  document.addEventListener('componentsLoaded', initApp);

  // Fallback: if components are already loaded or not used
  if (document.querySelector('.header')) {
    initApp();
  }
});

function initApp() {
  initHeader();
  initMobileMenu();
  initActiveNavLink();
  initScrollProgress();
  initTypewriter();
  initMetrics();
  initRevealObserver();
  initCardEffects();
  initHeroParallax();
  // initSectionParallax is disabled: it breaks hash-based navigation by
  // translating entire sections, causing scroll targets to misalign.
  initGlitchEffect();
  initFormFeedback();
  initParticleCanvas();
}

// === Header background on scroll ===
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  function updateHeader() {
    if (window.scrollY > 20) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}

// === Mobile menu toggle ===
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav__link');

  if (!menuToggle || !nav) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('nav--open', !isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('nav--open');
      document.body.style.overflow = '';
    });
  });
}

// === Active nav link based on scroll position ===
function initActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav__link');
  const sections = document.querySelectorAll('section[id]');

  if (navLinks.length === 0) return;

  function updateActiveLink() {
    const scrollPos = window.scrollY + 120;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove('nav__link--active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('nav__link--active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
}

// === Scroll progress bar ===
function initScrollProgress() {
  const scrollProgressBar = document.querySelector('.scroll-progress__bar');
  if (!scrollProgressBar) return;

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgressBar.style.width = `${progress}%`;
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();
}

// === Typewriter effect ===
function initTypewriter() {
  const typewriterElement = document.querySelector('.typewriter');
  if (!typewriterElement) return;

  const text = typewriterElement.dataset.text || '';
  let index = 0;
  typewriterElement.textContent = '';

  function typeNextChar() {
    if (index < text.length) {
      typewriterElement.textContent += text.charAt(index);
      index++;
      setTimeout(typeNextChar, 60 + Math.random() * 40);
    }
  }

  setTimeout(typeNextChar, 1200);
}

// === Animated metrics ===
function initMetrics() {
  const metricValues = document.querySelectorAll('.metric__value');
  if (metricValues.length === 0) return;

  function animateMetrics() {
    metricValues.forEach((metric) => {
      const target = parseInt(metric.dataset.target, 10);
      if (Number.isNaN(target)) return;

      const duration = 2000;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        metric.textContent = Math.floor(eased * target);

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    });
  }

  const heroMetrics = document.querySelector('.hero__metrics');
  if (!heroMetrics) return;

  const metricsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateMetrics();
          metricsObserver.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );

  metricsObserver.observe(heroMetrics);
}

// === Reveal article cards on scroll ===
let revealObserver = null;

function initRevealObserver() {
  const articleCards = document.querySelectorAll('[data-reveal]');
  if (articleCards.length === 0) return;

  if (revealObserver) {
    revealObserver.disconnect();
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('article-card--visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.1,
    }
  );

  articleCards.forEach((card) => revealObserver.observe(card));
}

window.initRevealObserver = initRevealObserver;

// === Card effects: glow + tilt ===
function initCardEffects() {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  document.querySelectorAll('.article-card, .about__panel').forEach((card) => {
    if (!isTouchDevice) {
      card.addEventListener('mousemove', handleCardGlow);
      card.addEventListener('mouseleave', resetCardGlow);
    }
  });

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    if (!isTouchDevice) {
      initTilt(card);
    }
  });
}

window.initCardEffects = initCardEffects;

function handleCardGlow(event) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty('--mouse-x', `${x}%`);
  card.style.setProperty('--mouse-y', `${y}%`);
}

function resetCardGlow(event) {
  const card = event.currentTarget;
  card.style.setProperty('--mouse-x', '50%');
  card.style.setProperty('--mouse-y', '50%');
}

function initTilt(element) {
  element.addEventListener('mousemove', (event) => {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  element.addEventListener('mouseleave', () => {
    element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  });
}

// === Subtle parallax for hero orbs on mouse move ===
function initHeroParallax() {
  const heroVisual = document.querySelector('.hero__visual');
  const orbs = document.querySelectorAll('.hero__visual .orb, .hero__visual .console, .hero__visual .data-ring');

  if (!heroVisual || window.matchMedia('(pointer: coarse)').matches) return;

  document.addEventListener('mousemove', (event) => {
    const { clientX, clientY } = event;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const moveX = (clientX - centerX) / centerX;
    const moveY = (clientY - centerY) / centerY;

    orbs.forEach((orb) => {
      const depth = parseFloat(orb.dataset.depth) || 1;
      const x = moveX * depth * 8;
      const y = moveY * depth * 8;
      orb.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
}

// === Section parallax on scroll ===
function initSectionParallax() {
  const parallaxSections = document.querySelectorAll('.articles, .about, .contact');

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxSections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const speed = 0.02 + (index % 2) * 0.01;
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        section.style.transform = `translateY(${scrollY * speed * (index % 2 === 0 ? 1 : -1)}px)`;
      }
    });
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
}

// === Glitch effect on hero title hover ===
function initGlitchEffect() {
  const heroTitle = document.querySelector('.hero__title');
  if (!heroTitle || window.matchMedia('(pointer: coarse)').matches) return;

  heroTitle.addEventListener('mouseenter', () => {
    let iterations = 0;
    const maxIterations = 10;

    const glitchInterval = setInterval(() => {
      heroTitle.style.transform = `translateX(${(Math.random() - 0.5) * 4}px)`;
      heroTitle.style.filter = `drop-shadow(${(Math.random() - 0.5) * 6}px 0 rgba(91, 138, 154, 0.3))`;
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(glitchInterval);
        heroTitle.style.transform = '';
        heroTitle.style.filter = '';
      }
    }, 60);
  });
}

// === Form submit via FormSubmit ===
function initFormFeedback() {
  const form = document.querySelector('.contact__form');
  if (!form) return;

  const status = form.querySelector('.contact__status');
  const button = form.querySelector('button[type="submit"]');
  const originalText = button ? button.innerHTML.trim() : '';

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.className = 'field field--wide contact__status';
    if (type) {
      status.classList.add(`contact__status--${type}`);
    }
  }

  function setLoading(isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.style.opacity = isLoading ? '0.7' : '';
    button.innerHTML = isLoading
      ? '<span class="button__dot"></span>Отправка…'
      : originalText;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    setStatus('');
    setLoading(true);

    const formData = new FormData(form);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('https://formspree.io/f/mdaqqjyr', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.ok === true) {
        setStatus('Сообщение отправлено. Я отвечу в ближайшее время.', 'success');
        form.reset();
      } else {
        const errorMessage = data.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Fallback to classic form submit if AJAX fails or times out.
      form.submit();
    } finally {
      setLoading(false);
    }
  });
}

// === Particle network canvas ===
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId = null;
  let isActive = true;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = window.innerWidth < 768 ? 30 : 55;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.2,
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(91, 138, 154, ${p.opacity})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 140) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(91, 138, 154, ${0.12 * (1 - distance / 140)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    if (isActive) {
      animationId = requestAnimationFrame(drawParticles);
    }
  }

  resizeCanvas();
  createParticles();
  drawParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isActive = false;
      if (animationId) cancelAnimationFrame(animationId);
    } else {
      isActive = true;
      drawParticles();
    }
  });
}
