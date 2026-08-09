(() => {
  const menuButton = document.querySelector('.ad-menu-toggle');
  const navigation = document.querySelector('.ad-nav');

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    navigation.classList.remove('is-open');
  };

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(willOpen));
      menuButton.setAttribute('aria-label', willOpen ? 'Close menu' : 'Open menu');
      navigation.classList.toggle('is-open', willOpen);
    });

    navigation.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (!navigation.classList.contains('is-open')) return;
      if (navigation.contains(event.target) || menuButton.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        closeMenu();
        menuButton.focus();
      }
    });

    const desktopQuery = window.matchMedia('(min-width: 48.0625rem)');
    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', closeMenu);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(closeMenu);
    }
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('[data-reveal]');

  if (reducedMotion || !('IntersectionObserver' in window) || revealItems.length === 0) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  try {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    const visibleBoundary = window.innerHeight * 0.92;
    revealItems.forEach((item) => {
      const bounds = item.getBoundingClientRect();
      if (bounds.top < visibleBoundary && bounds.bottom > 0) {
        item.classList.add('is-visible');
      } else {
        observer.observe(item);
      }
    });
    document.documentElement.classList.add('ad-reveal-enabled');
  } catch {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
})();
