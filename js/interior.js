document.addEventListener('sections:loaded', () => {
  const stickyCopies = [...document.querySelectorAll('[data-sticky-copy]')];
  const updateStickyCopies = () => stickyCopies.forEach(copy => {
    copy.classList.add('is-sticky-copy');
    copy.style.setProperty('--sticky-copy-top', `${Math.min(130, window.innerHeight - copy.getBoundingClientRect().height - 40)}px`);
  });
  if (stickyCopies.length) {
    const observer = new ResizeObserver(updateStickyCopies);
    stickyCopies.forEach(copy => observer.observe(copy));
    window.addEventListener('resize', updateStickyCopies);
    document.fonts.ready.then(updateStickyCopies);
    updateStickyCopies();
  }
  document.querySelectorAll('.inner-scenario').forEach(details => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.inner-scenario__body');
    let expanded = details.open;
    let running;
    summary.addEventListener('click', event => {
      event.preventDefault();
      expanded = !expanded;
      const from = details.getBoundingClientRect().height;
      const fromOpacity = getComputedStyle(body).opacity;
      running?.forEach(animation => animation.cancel());
      details.open = true;
      const style = getComputedStyle(details);
      const border = (Number.parseFloat(style.borderTopWidth) || 0) + (Number.parseFloat(style.borderBottomWidth) || 0);
      const target = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + border;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        details.open = expanded;
        return;
      }
      details.classList.add('is-animating');
      const timing = { duration:450, easing:'cubic-bezier(.22,1,.36,1)' };
      const animations = [
        details.animate([{height:`${from}px`}, {height:`${target}px`}], timing),
        body.animate([{opacity:expanded && !running ? 0 : fromOpacity}, {opacity:expanded ? 1 : 0}], timing)
      ];
      running = animations;
      Promise.all(animations.map(animation => animation.finished)).then(() => {
        if (running !== animations) return;
        details.open = expanded;
        details.classList.remove('is-animating');
        running = null;
      }).catch(() => {});
    });
  });
  document.querySelectorAll('[data-interactive-roadmap]').forEach(roadmap => {
    const steps = [...roadmap.children];
    if (roadmap.classList.contains('inner-facts')) {
      const reserveHeight = () => {
        const number = value => Number.parseFloat(value) || 0;
        const headingsHeight = steps.reduce((height, step) => {
          const style = getComputedStyle(step);
          const heading = step.querySelector('h3');
          const headingStyle = getComputedStyle(heading);
          return height + heading.getBoundingClientRect().height + number(headingStyle.marginTop) + number(headingStyle.marginBottom) + number(style.paddingTop) + number(style.paddingBottom) + number(style.borderTopWidth) + number(style.borderBottomWidth);
        }, 0);
        const descriptionHeight = Math.max(...steps.map(step => {
          const answer = step.querySelector('p');
          answer.style.height = 'auto';
          const height = answer.scrollHeight;
          answer.style.height = '';
          answer.style.setProperty('--project-answer-height', `${height}px`);
          return height;
        }));
        // One description is visible at a time; keep the section edge fixed during transitions.
        roadmap.style.height = `${Math.ceil(headingsHeight + descriptionHeight + 16)}px`;
      };
      const observer = new ResizeObserver(reserveHeight);
      observer.observe(roadmap);
      window.addEventListener('resize', reserveHeight);
      document.fonts.ready.then(reserveHeight);
      reserveHeight();
    }
    const activate = index => steps.forEach((step, position) => {
      const active = position === index;
      step.classList.toggle('is-active', active);
      step.querySelector('[data-roadmap-trigger]').setAttribute('aria-expanded', String(active));
      step.querySelector('p').setAttribute('aria-hidden', String(!active));
    });
    steps.forEach((step, index) => {
      step.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'touch') activate(index);
      });
      step.addEventListener('focusin', () => activate(index));
      step.querySelector('[data-roadmap-trigger]').addEventListener('click', () => activate(index));
    });
    roadmap.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch') activate(0);
    });
    roadmap.addEventListener('focusout', event => {
      if (!roadmap.contains(event.relatedTarget)) activate(0);
    });
    roadmap.addEventListener('keydown', event => {
      const current = steps.findIndex(step => step.contains(document.activeElement));
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % steps.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + steps.length) % steps.length;
      if (event.key === 'Home' || event.key === 'Escape') next = 0;
      if (event.key === 'End') next = steps.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      steps[next].querySelector('[data-roadmap-trigger]').focus({ preventScroll:true });
    });
    activate(0);
    roadmap.classList.add('is-ready');
  });
});
