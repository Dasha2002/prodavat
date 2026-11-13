document.addEventListener('sections:loaded', () => {
  if (!['home','about','formats','practice'].includes(document.body.dataset.page)) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const selector = [
    '.section-heading', '.tasks__rows article', '.outcomes h2', '.outcomes__list article',
    '.experts__photo', '.experts__statement', '.cases__visual', '.cases__chapters li',
    '.inner-story>div>h2', '.inner-aside__photo', '.inner-choice__collage',
    '.inner-duet__photo', '.inner-principles article', '.inner-lines article', '.inner-next>div'
  ].join(',');
  const excluded = '.hero,.inner-hero,.reviews,.faq,.request,dialog,[data-sticky-copy],.inner-scenario,.inner-engagement';
  const anchor = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const running = new Map();
  const sectionOrder = new Map();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      observer.unobserve(element);
      if (reducedMotion.matches) return;
      const photo = element.matches('figure,.cases__visual,.inner-choice__collage');
      const order = Number(element.dataset.revealOrder) || 0;
      const frames = photo
        ? [{opacity:.55,transform:'translate3d(0,22px,0)',clipPath:'inset(0 0 4% 0)'}, {opacity:1,transform:'translate3d(0,0,0)',clipPath:'inset(0 0 0% 0)'}]
        : [{opacity:.2,transform:'translate3d(0,18px,0)'}, {opacity:1,transform:'translate3d(0,0,0)'}];
      const animation = element.animate(frames, {
        duration:photo ? 800 : 620,
        delay:Math.min(order * 55,110),
        easing:'cubic-bezier(.22,1,.36,1)',
        fill:'backwards'
      });
      running.set(element, animation);
      animation.finished.then(() => running.delete(element)).catch(() => running.delete(element));
    });
  }, {threshold:.06, rootMargin:'0px 0px 40px 0px'});
  // Above-the-fold content and anchor destinations are always immediately readable.
  document.querySelectorAll(`main ${selector.split(',').join(', main ')}`).forEach(element => {
    if (element.closest(excluded)) return;
    if (anchor && element.closest('section') === anchor.closest('section')) return;
    if (element.getBoundingClientRect().top < window.innerHeight + 30) return;
    if (element.parentElement.closest(selector)) return;
    const section = element.closest('section');
    const order = sectionOrder.get(section) || 0;
    sectionOrder.set(section, order + 1);
    element.dataset.revealOrder = String(order);
    observer.observe(element);
  });
  document.addEventListener('focusin', event => running.forEach((animation, element) => {
    if (element.contains(event.target)) animation.cancel();
  }));
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    running.forEach(animation => animation.cancel());
    running.clear();
  });
});


