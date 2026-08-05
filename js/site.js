// Set CSS --vh to handle mobile address bar and provide nav toggle
(function() {
  function setVh() {
    document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
  }
  setVh();
  window.addEventListener('resize', setVh);

  // Simple hamburger menu toggle
  const initHamburger = () => {
    const hamburger = document.querySelector('.hamburger');
    if (!hamburger) return;
    hamburger.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
      const expanded = document.body.classList.contains('nav-open');
      hamburger.setAttribute('aria-expanded', expanded);
    });

    // Close mobile nav when a nav link is clicked
    document.querySelectorAll('.nav-menu a').forEach(a => {
      a.addEventListener('click', () => document.body.classList.remove('nav-open'));
    });
  };

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburger);
  } else {
    initHamburger();
  }
})();
