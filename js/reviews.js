document.addEventListener('sections:loaded', () => {
  const cards = [...document.querySelectorAll('.review-card-slot')];
  const animations = new WeakMap();
  const setExpanded = (slot, expanded) => {
    if (slot.classList.contains('is-expanded') === expanded) return;
    const card = slot.querySelector('.review-card');
    const text = slot.querySelector('.review-card__text');
    const fromCard = card.getBoundingClientRect().height;
    const fromText = text.getBoundingClientRect().height;
    animations.get(slot)?.forEach(animation => animation.cancel());
    slot.classList.toggle('is-expanded', expanded);
    const button = slot.querySelector('.review-card__toggle');
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Свернуть' : 'Читать полностью';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      slot.classList.remove('is-animating');
      return;
    }
    const toCard = card.getBoundingClientRect().height;
    const toText = text.getBoundingClientRect().height;
    slot.classList.add('is-animating');
    const timing = { duration:440, easing:'cubic-bezier(.22,1,.36,1)' };
    const running = [
      card.animate([{height:`${fromCard}px`}, {height:`${toCard}px`}], timing),
      text.animate([{maxHeight:`${fromText}px`}, {maxHeight:`${toText}px`}], timing)
    ];
    animations.set(slot, running);
    Promise.all(running.map(animation => animation.finished)).then(() => {
      if (animations.get(slot) !== running) return;
      slot.classList.remove('is-animating');
      animations.delete(slot);
    }).catch(() => {});
  };
  const collapseCard = slot => setExpanded(slot, false);
  const measureCards = () => cards.forEach(slot => {
    if (slot.classList.contains('is-expanded')) return;
    const text = slot.querySelector('.review-card__text');
    slot.querySelector('.review-card__toggle').hidden = text.scrollHeight <= text.clientHeight + 1;
  });
  cards.forEach(slot => {
    slot.querySelector('.review-card__toggle').addEventListener('click', () => {
      const expanded = slot.classList.contains('is-expanded');
      cards.forEach(collapseCard);
      if (!expanded) {
        setExpanded(slot, true);
      }
    });
  });
  document.addEventListener('click', event => cards.forEach(slot => {
    if (!slot.contains(event.target)) collapseCard(slot);
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') cards.forEach(collapseCard);
  });
  const observer = new ResizeObserver(measureCards);
  const grid = document.querySelector('.reviews__cards');
  if (grid) observer.observe(grid);
  document.fonts.ready.then(measureCards);
  measureCards();
  const modal = document.querySelector('.review-modal');
  if (!modal) return;
  document.body.append(modal);
  const form = modal.querySelector('[data-review-form]');
  const options = [...form.querySelectorAll('.review-rating__option')];
  const ratingHint = form.querySelector('[data-rating-hint]');
  let opener;
  let savedScroll = 0;
  const selectedRating = () => Number(form.querySelector('[name="rating"]:checked')?.value || 0);
  const paintRating = value => options.forEach((option, index) => option.classList.toggle('is-active', index < value));
  options.forEach(option => {
    option.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') paintRating(Number(option.querySelector('input').value));
    });
    option.querySelector('input').addEventListener('change', () => {
      paintRating(selectedRating());
      ratingHint.textContent = `Ваша оценка: ${selectedRating()} из 5`;
      form.querySelector('[role="status"]').textContent = '';
    });
  });
  form.querySelector('.review-rating__options').addEventListener('pointerleave', () => paintRating(selectedRating()));
  document.querySelectorAll('[data-open-review]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    savedScroll = window.scrollY;
    document.documentElement.classList.add('has-review');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScroll}px`;
    document.body.style.width = '100%';
    modal.showModal();
    modal.scrollTop = 0;
  }));
  modal.querySelector('[data-close-review]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('has-review');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, savedScroll);
    html.style.scrollBehavior = previousBehavior;
    opener?.focus({ preventScroll: true });
  });
  form.addEventListener('input', () => { form.querySelector('[role="status"]').textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    form.querySelector('[role="status"]').textContent = `Отзыв с оценкой ${selectedRating()} из 5 подготовлен. Это демонстрационная форма: данные не отправлены и отзыв не опубликован.`;
  });
});
