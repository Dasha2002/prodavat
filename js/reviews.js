document.addEventListener('sections:loaded', () => {
  const cards = [...document.querySelectorAll('.review-card-slot')];
  let syncCarouselHeight = () => {};
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
    syncCarouselHeight();
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
      syncCarouselHeight();
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
  const carousel = document.querySelector('.reviews__carousel');
  if (carousel && grid) {
    const pagination = carousel.querySelector('.reviews__pagination');
    let pages = [];
    let stepWidth = 1;
    let lastWidth = 0;
    const currentPage = () => Math.min(pages.length - 1, Math.max(0, Math.round(grid.scrollLeft / stepWidth)));
    const paintPagination = () => pages.forEach((button, index) => {
      button.setAttribute('aria-current', String(index === currentPage()));
    });
    const goTo = index => {
      const page = Math.max(0, Math.min(pages.length - 1, index));
      grid.scrollTo({left:page * stepWidth, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    };
    syncCarouselHeight = () => {
      const height = Math.max(...cards.map(slot => slot.classList.contains('is-expanded') ? slot.querySelector('.review-card').scrollHeight + 2 : slot.clientHeight));
      grid.style.setProperty('--review-track-height', `${height}px`);
    };
    const layoutCarousel = () => {
      if (grid.clientWidth === lastWidth) return;
      lastWidth = grid.clientWidth;
      const columns = Number.parseInt(getComputedStyle(carousel).getPropertyValue('--review-columns'),10) || 1;
      const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
      stepWidth = cards[0].getBoundingClientRect().width + gap;
      pagination.replaceChildren();
      pages = Array.from({length:Math.max(1,cards.length - columns + 1)}, (_, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'reviews__page';
        button.setAttribute('aria-label', `Показать отзывы с ${index + 1}-го`);
        button.addEventListener('click', () => goTo(index));
        pagination.append(button);
        return button;
      });
      paintPagination();
      syncCarouselHeight();
    };
    const resize = new ResizeObserver(layoutCarousel);
    resize.observe(grid);
    grid.addEventListener('scroll', paintPagination, {passive:true});
    grid.addEventListener('keydown', event => {
      if (event.target !== grid || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? pages.length - 1 : currentPage() + (event.key === 'ArrowRight' ? 1 : -1);
      goTo(index);
    });
    let drag;
    grid.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button,a')) return;
      drag = {x:event.clientX, left:grid.scrollLeft, id:event.pointerId, moved:false};
    });
    grid.addEventListener('pointermove', event => {
      if (!drag) return;
      const distance = event.clientX - drag.x;
      if (!drag.moved && Math.abs(distance) < 6) return;
      drag.moved = true;
      grid.setPointerCapture(drag.id);
      grid.classList.add('is-dragging');
      grid.scrollLeft = drag.left - distance;
      event.preventDefault();
    });
    const finishDrag = () => {
      if (!drag) return;
      const moved = drag.moved;
      if (grid.hasPointerCapture(drag.id)) grid.releasePointerCapture(drag.id);
      drag = null;
      grid.classList.remove('is-dragging');
      if (moved) goTo(currentPage());
    };
    grid.addEventListener('pointerup', finishDrag);
    grid.addEventListener('pointercancel', finishDrag);
    grid.addEventListener('pointerleave', () => { if (drag && !drag.moved) drag = null; });
    grid.querySelectorAll('img').forEach(image => image.draggable = false);
    document.fonts.ready.then(() => { measureCards(); syncCarouselHeight(); });
    layoutCarousel();
  }
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
