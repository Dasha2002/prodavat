(() => {
const instances = new WeakMap();
window.initAtelierHero = (hero = document.querySelector('.hero--atelier')) => {
  if (!hero) return null;
  if (instances.has(hero)) return instances.get(hero);
  const header = document.querySelector('.header');
  if (!hero || !header) return;
  const copy = hero.querySelector('.hero-atelier__copy');
  const strip = hero.querySelector('.hero-atelier__wordmark');
  const track = hero.querySelector('.hero-atelier__conveyor');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.body.dataset.root || '';
  let animations = [];
  let generation = 0;
  let visible = true;
  let sizeKey = '';
  const syncMotion = () => {
    const stop = !visible || document.hidden;
    animations.forEach(animation => stop ? animation.pause() : animation.play());
  };
  const buildRibbon = async () => {
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
      const image = document.createElement('img');
      image.src = `${root}img/brand/wordmark-hero-light.svg`;
      image.alt = '';
      image.width = 1000;
      image.height = 162;
      image.draggable = false;
      logo.append(image);
      group.append(logo);
    }
    track.replaceChildren(group, group.cloneNode(true));
    const logos = [...track.querySelectorAll('img')];
    await Promise.allSettled(logos.map(image => image.decode()));
    if (token !== generation) return;
    if (!reduced.matches) animations.push(track.animate([
      {transform:'translateX(0)'},
      {transform:`translateX(-${group.getBoundingClientRect().width}px)`}
    ], {duration:36000, iterations:Infinity, easing:'linear'}));
    syncMotion();
  };
  const fitViewport = () => {
    hero.style.setProperty('--hero-header-height', `${header.getBoundingClientRect().height}px`);
    hero.style.setProperty('--hero-copy-bottom', `${copy.getBoundingClientRect().bottom - hero.getBoundingClientRect().top}px`);
    const nextKey = `${strip.clientWidth}:${strip.clientHeight}`;
    if (sizeKey && nextKey !== sizeKey) buildRibbon();
    sizeKey = nextKey;
  };
  fitViewport();
  buildRibbon();
  const observer = new ResizeObserver(fitViewport);
  [header, copy, strip].forEach(element => observer.observe(element));
  const visibility = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncMotion();
  });
  visibility.observe(hero);
  const onPageShow = event => { if (event.persisted) buildRibbon(); };
  const onReduced = () => buildRibbon();
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('pageshow', onPageShow);
  reduced.addEventListener('change', onReduced);
  const cleanup = () => {
    generation++;
    observer.disconnect();
    visibility.disconnect();
    animations.forEach(animation => animation.cancel());
    document.removeEventListener('visibilitychange', syncMotion);
    window.removeEventListener('pageshow', onPageShow);
    reduced.removeEventListener('change', onReduced);
    instances.delete(hero);
  };
  instances.set(hero, cleanup);
  return cleanup;
};
document.addEventListener('sections:loaded', () => window.initAtelierHero());
})();
