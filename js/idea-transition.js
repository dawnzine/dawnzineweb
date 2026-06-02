(() => {
  const ideaSection = document.querySelector('.section-idea');
  if (!ideaSection) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    ideaSection.classList.add('is-content-visible');
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio >= 0.58) {
          ideaSection.classList.add('is-content-visible');
        } else if (entry.boundingClientRect.top > window.innerHeight * 0.35) {
          ideaSection.classList.remove('is-content-visible');
        }
      });
    }, {
      threshold: [0, 0.24, 0.42, 0.58, 0.72],
      rootMargin: '-4% 0px -24% 0px'
    });

    observer.observe(ideaSection);
  }

  const serviceSection = document.querySelector('#services-preview');
  const ideaNodes = ideaSection.querySelectorAll('.idea-node');
  const ideaCore = ideaSection.querySelector('.idea-galaxy-core');

  if (!serviceSection || !ideaNodes.length || !ideaCore) return;

  const scrollToServices = () => {
    const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 0;
    const targetTop = serviceSection.getBoundingClientRect().top + window.scrollY - navHeight + 1;

    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  };

  const bindScrollTrigger = (element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToServices();
    });
    element.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      scrollToServices();
    });
  };

  ideaNodes.forEach((node) => {
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', '前往业务速览');

    bindScrollTrigger(node);
  });

  ideaCore.setAttribute('aria-label', '前往业务速览');
  bindScrollTrigger(ideaCore);
})();
