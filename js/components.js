(function () {
  function getBasePath() {
    const path = window.location.pathname;
    const depth = path.split('/').filter(Boolean).length;

    if (path.includes('/articles/') && depth >= 2) {
      return '../';
    }
    return './';
  }

  function isHomePage() {
    const currentPath = window.location.pathname;
    return currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '';
  }

  function convertHomePageAnchors() {
    // On the home page, use hash-only anchors for smooth in-page scrolling.
    // On other pages, keep index.html#section so navigation returns to the home page.
    if (!isHomePage()) return;

    document.querySelectorAll('.nav__link').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('index.html#')) {
        link.setAttribute('href', href.replace('index.html#', '#'));
      } else if (href === 'index.html') {
        link.setAttribute('href', '#home');
      }
    });
  }

  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const hash = window.location.hash;
    const links = document.querySelectorAll('.nav__link');

    links.forEach((link) => {
      const href = link.getAttribute('href');
      const page = link.dataset.page;
      link.classList.remove('nav__link--active');

      if (currentPath.includes('/articles/') && page === 'articles') {
        link.classList.add('nav__link--active');
      } else if (isHomePage()) {
        if (hash && href === hash) {
          link.classList.add('nav__link--active');
        } else if (!hash && page === 'home') {
          link.classList.add('nav__link--active');
        }
      }
    });
  }

  function scrollToTarget(target, updateHistory = false) {
    if (!target) return;
    const header = document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 0;
    const offset = headerHeight + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    if (updateHistory) {
      history.replaceState(null, '', `#${target.id}`);
    }
  }

  function initSmoothScroll() {
    if (!isHomePage()) return;

    document.querySelectorAll('.nav__link').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      link.addEventListener('click', (event) => {
        const target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        scrollToTarget(target, true);
      });
    });

    // Handle direct page loads with a hash (e.g. /index.html#about)
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        scrollToTarget(target);
      }
    }
  }

  async function loadComponent(selector, url, basePath) {
    const element = document.querySelector(selector);
    if (!element) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      let html = await response.text();
      html = html.replace(/\{\{BASE\}\}/g, basePath);
      element.innerHTML = html;
    } catch (error) {
      console.error('Component load error:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const basePath = getBasePath();
    const headerPromise = loadComponent('#header-placeholder', `${basePath}templates/header.html`, basePath);
    const footerPromise = loadComponent('#footer-placeholder', `${basePath}templates/footer.html`, basePath);

    Promise.all([headerPromise, footerPromise]).then(() => {
      // Convert anchors only after the header is guaranteed to be in the DOM.
      convertHomePageAnchors();
      setActiveNavLink();
      initSmoothScroll();
      document.dispatchEvent(new CustomEvent('componentsLoaded'));
    });
  });
})();
