document.addEventListener('sections:loaded', () => {
  document.querySelectorAll('[data-accordion]').forEach(accordion => {
    const questions = [...accordion.querySelectorAll('.faq__question')];
    questions.forEach(question => question.addEventListener('click', () => {
      // Keep exactly one answer selected, including on repeated and rapid clicks.
      if (question.getAttribute('aria-expanded') === 'true') return;
      questions.forEach(item => {
        const open = item === question;
        const answer = document.getElementById(item.getAttribute('aria-controls'));
        item.setAttribute('aria-expanded', String(open));
        answer.setAttribute('aria-hidden', String(!open));
        answer.inert = !open;
      });
    }));
  });
  const menu = document.querySelector('.header__nav');
  const toggle = document.querySelector('[data-menu]');
  function closeMenu() { toggle?.setAttribute('aria-expanded', 'false'); menu?.classList.remove('is-open'); }
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); menu.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
  menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  const contrast = document.documentElement.dataset.design === 'contrast';
  document.querySelectorAll('a[href]').forEach(link => {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (contrast) url.searchParams.set('design', 'contrast');
    link.href = url.href;
    if (link.hasAttribute('data-page') && link.dataset.page === document.body.dataset.page) link.setAttribute('aria-current', 'page');
  });
  const switcher = document.querySelector('[data-design-switch]');
  if (switcher) {
    const next = new URL(location.href);
    if (contrast) next.searchParams.delete('design'); else next.searchParams.set('design', 'contrast');
    switcher.href = next.href;
    switcher.textContent = contrast ? 'Вариант 01 · Светлый' : 'Вариант 02 · Контрастный';
  }
  document.querySelectorAll('[data-request-form]').forEach(form => {
    const contact = form.elements.contact;
    contact.addEventListener('input', () => contact.setCustomValidity(''));
    const service = new URLSearchParams(location.search).get('service');
    if (service === 'audit') form.elements.message.value = 'Хочу обсудить комплексный аудит отдела продаж.';
    if (service === 'development') form.elements.message.value = 'Хочу обсудить построение и развитие отдела продаж.';
    form.addEventListener('submit', event => {
      event.preventDefault();
      const value = contact.value.trim();
      const validContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || (/^[+\d\s()−-]+$/.test(value) && value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15);
      contact.setCustomValidity(validContact ? '' : 'Укажите email или телефон, содержащий от 10 до 15 цифр.');
      if (!form.reportValidity()) return;
      const status = form.querySelector('[role="status"]');
      status.textContent = 'Это демонстрационная форма. Отправка ещё не подключена, данные не переданы. Скопируйте текст обращения, чтобы сохранить его.';
      const output = form.querySelector('[data-request-output]');
      const fields = new FormData(form);
      output.hidden = false;
      output.value = `Имя: ${fields.get('name')}\nКонтакт: ${fields.get('contact')}\nЗадача: ${fields.get('message') || 'Обсудить отдел продаж'}`;
      form.querySelector('[data-copy]').hidden = false;
    });
    form.querySelector('[data-copy]')?.addEventListener('click', async () => {
      const output = form.querySelector('[data-request-output]');
      try { await navigator.clipboard.writeText(output.value); form.querySelector('[role="status"]').textContent = 'Текст обращения скопирован. Данные никуда не отправлены.'; }
      catch { output.focus(); output.select(); form.querySelector('[role="status"]').textContent = 'Выделили текст — скопируйте его вручную.'; }
    });
  });
});
