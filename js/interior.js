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
  document.querySelectorAll('.inner-scenarios').forEach(group => {
    const items = [...group.querySelectorAll('.inner-scenario')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const controllers = new Map();
    let active = items.find(item => item.open) || items[0];
    items.forEach(details => {
      details.open = details === active;
      const summary = details.querySelector('summary');
      const body = details.querySelector('.inner-scenario__body');
      let running = [];
      controllers.set(details, expanded => {
        const from = details.getBoundingClientRect().height;
        running.forEach(animation => animation.cancel());
        details.open = expanded;
        const style = getComputedStyle(details);
        const border = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
        const target = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + border;
        if (reduced.matches) { details.classList.remove('is-animating'); return; }
        details.classList.add('is-animating');
        const timing = {duration:450, easing:'cubic-bezier(.22,1,.36,1)'};
        const animations = [details.animate([{height:`${from}px`}, {height:`${target}px`}], timing)];
        if (expanded) animations.push(body.animate([{opacity:0}, {opacity:1}], timing));
        running = animations;
        Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
          if (running !== animations) return;
          details.classList.remove('is-animating');
          running = [];
        });
      });
      summary.addEventListener('click', event => {
        event.preventDefault();
        if (details === active) return;
        controllers.get(active)?.(false);
        active = details;
        controllers.get(details)(true);
      });
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
