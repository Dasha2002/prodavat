(() => {
  if (document.body.dataset.page !== 'about') return;

  const photos = [...document.querySelectorAll([
    '.inner-hero__photo', '.experts--about .experts__photo',
    '.inner-story .inner-aside__photo', '.inner-duet__photo'
  ].join(','))];
  const texts = [...document.querySelectorAll([
    '.inner-hero__copy h1', '.inner-hero__copy .inner-lead',
    '.experts--about .section-heading h2', '.experts--about .experts__intro-note',
    '.experts--about .experts__name', '.inner-story > div > h2',
    '.inner-dark .section-heading h2', '.inner-principles h3',
    '.inner-duet .section-heading h2', '.team-experience .section-heading h2'
  ].join(','))];
  if (!photos.length || !texts.length) return;

  const photoOptions = [
    ['rise', 'Мягкий подъём'],
    ['top-wipe', 'Кадр сверху'],
    ['side-wipe', 'Сдвиг кадра'],
    ['tilt', 'Поворот'],
    ['scroll-blur', 'Блюр по скроллу']
  ];
  const textOptions = [
    ['cascade', 'Каскад'],
    ['line-wipe', 'Открытие строк'],
    ['focus', 'Фокус']
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lab = document.createElement('details');
  lab.className = 'motion-lab';
  lab.setAttribute('aria-label', 'Варианты анимации страницы');
  const buttons = (kind, options) => options.map(([value, label]) =>
    `<button type="button" data-motion-choice="${kind}" data-value="${value}" aria-pressed="false">${label}</button>`
  ).join('');
  lab.innerHTML = `
    <summary>Анимации страницы «О нас»</summary>
    <div class="motion-lab__content">
      <fieldset class="motion-lab__group"><legend>Фото · 5 вариантов</legend><div class="motion-lab__options">${buttons('photo', photoOptions)}</div></fieldset>
      <fieldset class="motion-lab__group"><legend>Текст · 3 варианта</legend><div class="motion-lab__options">${buttons('text', textOptions)}</div></fieldset>
      <button class="motion-lab__replay" type="button">Повторить видимые</button>
      <p class="motion-lab__hint">Блюр уходит сверху вниз по мере прокрутки. Варианты можно менять в любой точке страницы.</p>
    </div>`;
  document.body.append(lab);

  photos.forEach(photo => { photo.dataset.motionPhoto = ''; });
  texts.forEach((element, index) => {
    element.dataset.motionText = '';
    element.style.setProperty('--motion-delay', `${(index % 3) * 75}ms`);
  });

  const state = { photo: 'scroll-blur', text: 'cascade' };
  const syncButtons = () => lab.querySelectorAll('[data-motion-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(state[button.dataset.motionChoice] === button.dataset.value));
  });
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      entry.target.classList.remove('motion-pending');
      entry.target.classList.add('motion-in');
    }), { threshold: .08, rootMargin: '0px 0px -4% 0px' })
    : null;
  let frame = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const updateBlur = () => {
    frame = 0;
    if (state.photo !== 'scroll-blur' || reduced.matches || document.hidden) return;
    const viewport = innerHeight;
    photos.forEach((photo, index) => {
      const rect = photo.getBoundingClientRect();
      const progress = index === 0
        ? clamp(scrollY / Math.max(1, rect.height * .85))
        : clamp((viewport * .92 - rect.top) / (viewport * .8 + rect.height * .65));
      photo.style.setProperty('--blur-reveal', `${(progress * 100).toFixed(2)}%`);
    });
  };
  const scheduleBlur = () => {
    if (!frame) frame = requestAnimationFrame(updateBlur);
  };

  const restart = kind => {
    const elements = kind === 'photo' ? photos : texts;
    elements.forEach(element => {
      observer?.unobserve(element);
      element.classList.remove('motion-in', 'motion-pending');
      if (kind === 'photo') element.style.removeProperty('--blur-reveal');
    });
    if (reduced.matches || !observer || (kind === 'photo' && state.photo === 'scroll-blur')) {
      elements.forEach(element => element.classList.add('motion-in'));
      scheduleBlur();
      return;
    }
    elements.forEach(element => element.classList.add('motion-pending'));
    requestAnimationFrame(() => requestAnimationFrame(() => elements.forEach(element => observer.observe(element))));
  };

  lab.addEventListener('click', event => {
    const choice = event.target.closest('[data-motion-choice]');
    if (choice) {
      const kind = choice.dataset.motionChoice;
      state[kind] = choice.dataset.value;
      document.body.dataset[kind === 'photo' ? 'photoEffect' : 'textEffect'] = state[kind];
      syncButtons();
      restart(kind);
    } else if (event.target.closest('.motion-lab__replay')) {
      restart('photo');
      restart('text');
    }
  });
  reduced.addEventListener('change', () => {
    restart('photo');
    restart('text');
    lab.querySelector('.motion-lab__hint').textContent = reduced.matches
      ? 'В настройках системы отключены анимации. Изображения и текст остаются видимыми.'
      : 'Блюр уходит сверху вниз по мере прокрутки. Варианты можно менять в любой точке страницы.';
  });
  addEventListener('scroll', scheduleBlur, { passive: true });
  addEventListener('resize', scheduleBlur, { passive: true });
  document.addEventListener('visibilitychange', scheduleBlur);

  document.body.dataset.photoEffect = state.photo;
  document.body.dataset.textEffect = state.text;
  syncButtons();
  restart('photo');
  restart('text');
  updateBlur();
})();
