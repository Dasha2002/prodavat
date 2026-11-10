document.addEventListener('sections:loaded', () => {
  const hero = document.querySelector('.hero--atelier');
  const header = document.querySelector('.header');
  if (!hero || !header) return;
  const copy = hero.querySelector('.hero-atelier__copy');
  const strip = hero.querySelector('.hero-atelier__wordmark');
  const track = hero.querySelector('.hero-atelier__conveyor');
  const button = hero.querySelector('[data-hero-motion]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.body.dataset.root || '';
  let animations = [];
  let generation = 0;
  let paused = false;
  let visible = true;
  let sizeKey = '';
  const syncMotion = () => {
    const stop = paused || !visible || document.hidden;
    animations.forEach(animation => stop ? animation.pause() : animation.play());
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'Продолжить движение логотипа' : 'Приостановить движение логотипа');
    button.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
  };
  const buildRibbon = async reveal => {
    const token = ++generation;
    animations.forEach(animation => animation.cancel());
    animations = [];
    const group = document.createElement('div');
    group.className = 'hero-atelier__ribbon-group';
    const gap = Math.min(48, Math.max(24, innerWidth * .03));
    const count = Math.max(2, Math.ceil(hero.clientWidth / (strip.clientHeight * 6.168 + gap)));
    for (let repeat = 0; repeat < count; repeat++) {
      const logo = document.createElement('div');
      logo.className = 'hero-atelier__logo';
      for (let letter = 1; letter <= 9; letter++) {
        const image = document.createElement('img');
        image.src = `${root}img/brand/letters/${String(letter).padStart(2, '0')}.svg`;
        image.alt = '';
        image.width = 1000;
        image.height = 162;
        image.draggable = false;
        if (reveal && !reduced.matches) image.style.opacity = '0';
        logo.append(image);
      }
      group.append(logo);
    }
    track.replaceChildren(group, group.cloneNode(true));
    const letters = [...track.querySelectorAll('img')];
    await Promise.allSettled(letters.map(image => image.decode()));
    if (token !== generation) return;
    letters.forEach((image, index) => {
      image.style.opacity = '';
      if (reveal && !reduced.matches) animations.push(image.animate([
        {opacity:0, transform:'translateY(16px)'},
        {opacity:1, transform:'translateY(0)'}
      ], {duration:480, delay:180 + (index % 9) * 170, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards'}));
    });
    if (!reduced.matches) animations.push(track.animate([
      {transform:'translateX(0)'},
      {transform:`translateX(-${group.getBoundingClientRect().width}px)`}
    ], {duration:36000, delay:reveal ? 2100 : 0, iterations:Infinity, easing:'linear'}));
    syncMotion();
  };
  const fitViewport = () => {
    hero.style.setProperty('--hero-header-height', `${header.getBoundingClientRect().height}px`);
    hero.style.setProperty('--hero-copy-bottom', `${copy.getBoundingClientRect().bottom - hero.getBoundingClientRect().top}px`);
    const nextKey = `${strip.clientWidth}:${strip.clientHeight}`;
    if (sizeKey && nextKey !== sizeKey) buildRibbon(false);
    sizeKey = nextKey;
  };
  fitViewport();
  buildRibbon(true);
  const observer = new ResizeObserver(fitViewport);
  [header, copy, strip].forEach(element => observer.observe(element));
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncMotion();
  }).observe(hero);
  button.addEventListener('click', () => { paused = !paused; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('pageshow', event => { if (event.persisted) buildRibbon(true); });
  reduced.addEventListener('change', () => buildRibbon(!reduced.matches));
});
