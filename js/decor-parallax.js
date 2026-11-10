document.addEventListener('sections:loaded', () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const selector = '.experts,.faq,.inner-dark,.inner-choice,.inner-next-decoration,.inner-cta';
  const elements = [...document.querySelectorAll(selector)].filter(element => {
    const decor = getComputedStyle(element, '::after');
    return decor.display !== 'none' && decor.backgroundImage.includes('brand-mark');
  });
  if (!elements.length) return;
  const visible = new Set();
  let frame = 0;
  const update = () => {
    frame = 0;
    if (reduced.matches || document.hidden) return;
    const limit = innerWidth <= 600 ? 24 : 44;
    const changes = [...visible].map(element => {
      const bounds = element.getBoundingClientRect();
      const offset = (innerHeight / 2 - bounds.top - bounds.height / 2) * .065;
      return [element, Math.max(-limit, Math.min(limit, offset))];
    });
    changes.forEach(([element, offset]) => element.style.setProperty('--decor-shift', `${offset.toFixed(2)}px`));
  };
  const schedule = () => { if (!frame && !reduced.matches) frame = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
      entry.target.classList.toggle('decor-parallax-visible', entry.isIntersecting && !reduced.matches);
    });
    schedule();
  }, {rootMargin:'80px'});
  elements.forEach(element => { element.classList.add('decor-parallax'); observer.observe(element); });
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', () => {
    elements.forEach(element => {
      element.classList.toggle('decor-parallax-visible', !reduced.matches && visible.has(element));
      if (reduced.matches) element.style.removeProperty('--decor-shift');
    });
    schedule();
  });
});
