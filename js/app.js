document.addEventListener('sections:loaded', async () => {
  document.addEventListener('click', event => {
    if (event.target.closest('[data-placeholder-link]')) event.preventDefault();
  });
  document.querySelectorAll('[data-accordion]').forEach(accordion => {
    const questions = [...accordion.querySelectorAll('.faq__question')];
    questions.forEach(question => question.addEventListener('click', () => {
      // Opening another answer closes the previous one; repeated clicks close all.
      const shouldOpen = question.getAttribute('aria-expanded') !== 'true';
      questions.forEach(item => {
        const open = item === question && shouldOpen;
        const answer = document.getElementById(item.getAttribute('aria-controls'));
        item.setAttribute('aria-expanded', String(open));
        answer.setAttribute('aria-hidden', String(!open));
        answer.inert = !open;
      });
    }));
  });
  const menu = document.querySelector('.menu-panel');
  const toggle = document.querySelector('[data-menu]');
  function closeMenu() { if (menu?.open) menu.close(); }
  toggle?.addEventListener('click', () => {
    if (menu.open) return closeMenu();
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('has-menu');
  });
  menu?.addEventListener('close', () => {
    toggle?.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('has-menu');
    toggle?.focus({ preventScroll: true });
  });
  menu?.querySelector('[data-close-menu]').addEventListener('click', closeMenu);
  menu?.addEventListener('click', event => {
    if (event.target !== menu) return;
    const bounds = menu.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
  });
  menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  const root = document.body.dataset.root || '';
  let sourceForm = document.querySelector('[data-request-form]');
  if (!sourceForm) {
    try {
      const response = await fetch(root + 'sections/request/request.html');
      if (!response.ok) throw new Error('Request form unavailable');
      const template = document.createElement('template');
      template.innerHTML = (await response.text()).replaceAll('{{root}}', root);
      sourceForm = template.content.querySelector('[data-request-form]');
    } catch (error) { console.error(error); }
  }
  let requestModal;
  let requestOpener;
  let savedScroll = 0;
  if (sourceForm) {
    requestModal = document.createElement('dialog');
    requestModal.className = 'request-modal';
    requestModal.setAttribute('aria-labelledby', 'request-modal-title');
    requestModal.innerHTML = `<div class="request-modal__card"><div class="request-modal__top"><img src="${root}img/brand/logo.svg" width="210" height="31" alt="proДАВАТЬ"><button class="menu-panel__close" type="button" data-close-request aria-label="Закрыть форму" autofocus><span></span><span></span></button></div><div class="request-modal__intro"><h2 id="request-modal-title">Обсудим ваш бизнес</h2><p>Оставьте номер телефона — вместе определим следующий шаг</p></div><div data-modal-form></div></div>`;
    const modalForm = sourceForm.cloneNode(true);
    modalForm.querySelectorAll('[id]').forEach(node => { node.id = 'modal-' + node.id; });
    modalForm.querySelectorAll('[aria-describedby]').forEach(node => {
      node.setAttribute('aria-describedby', node.getAttribute('aria-describedby').split(' ').map(id => 'modal-' + id).join(' '));
    });
    requestModal.querySelector('[data-modal-form]').append(modalForm);
    document.body.append(requestModal);
    const closeRequest = () => requestModal.close();
    requestModal.querySelector('[data-close-request]').addEventListener('click', closeRequest);
    requestModal.addEventListener('click', event => { if (event.target === requestModal) closeRequest(); });
    requestModal.addEventListener('close', () => {
      document.documentElement.classList.remove('has-request');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      const html = document.documentElement;
      const previousBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScroll);
      html.style.scrollBehavior = previousBehavior;
      requestOpener?.focus({ preventScroll: true });
    });
    document.addEventListener('click', event => {
      const opener = event.target.closest('a[href], [data-open-request]');
      if (!opener || requestModal.contains(opener)) return;
      const url = opener.matches('a[href]') ? new URL(opener.href, location.href) : null;
      if (!opener.hasAttribute('data-open-request') && (!url || url.origin !== location.origin || url.hash !== '#request')) return;
      event.preventDefault();
      closeMenu();
      requestOpener = opener;
      const service = url?.searchParams.get('service');
      const title = service === 'audit' ? 'Обсудим аудит продаж' : service === 'development' ? 'Выстроим отдел продаж' : 'Обсудим вашу задачу';
      requestModal.querySelector('h2').textContent = title;
      const message = modalForm.elements.message;
      if (!message.value || message.dataset.prefilled === message.value) {
        message.value = service === 'audit' ? 'Хочу обсудить комплексный аудит отдела продаж.' : service === 'development' ? 'Хочу обсудить построение и развитие отдела продаж.' : '';
        message.dataset.prefilled = message.value;
      }
      savedScroll = window.scrollY;
      document.documentElement.classList.add('has-request');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScroll}px`;
      document.body.style.width = '100%';
      requestModal.showModal();
      requestModal.scrollTop = 0;
    });
  }
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
    const formatPhone = value => {
      let digits = value.replace(/\D/g, '');
      if (/^\s*\+7/.test(value) || (digits.length > 10 && /^[78]/.test(digits))) digits = digits.slice(1);
      digits = digits.slice(0, 10);
      let result = '+7';
      if (digits.length) result += ' (' + digits.slice(0, 3);
      if (digits.length >= 3) result += ')';
      if (digits.length > 3) result += ' ' + digits.slice(3, 6);
      if (digits.length > 6) result += '-' + digits.slice(6, 8);
      if (digits.length > 8) result += '-' + digits.slice(8, 10);
      return result;
    };
    contact.addEventListener('focus', () => { if (!contact.value) contact.value = '+7'; });
    contact.addEventListener('beforeinput', event => {
      const start = contact.selectionStart;
      const end = contact.selectionEnd;
      if (start !== end) return;
      if (event.inputType === 'deleteContentBackward') {
        if (start <= 2) { event.preventDefault(); return; }
        let previous = start - 1;
        while (previous > 1 && /\D/.test(contact.value[previous])) previous--;
        if (previous <= 1) { event.preventDefault(); return; }
        contact.setSelectionRange(previous, start);
      }
      if (event.inputType === 'deleteContentForward') {
        let next = start;
        while (next < contact.value.length && /\D/.test(contact.value[next])) next++;
        if (next <= 1) { event.preventDefault(); return; }
        contact.setSelectionRange(start, next + 1);
      }
    });
    contact.addEventListener('input', () => {
      const raw = contact.value;
      const cursor = contact.selectionStart;
      const digitsBefore = raw.slice(0, cursor).replace(/\D/g, '').length;
      contact.value = raw ? formatPhone(raw) : '+7';
      let nextCursor = contact.value.length;
      if (cursor < raw.length) {
        let count = 0;
        for (let index = 0; index < contact.value.length; index++) {
          if (/\d/.test(contact.value[index])) count++;
          if (count >= digitsBefore) { nextCursor = index + 1; break; }
        }
      }
      contact.setSelectionRange(Math.max(2, nextCursor), Math.max(2, nextCursor));
      contact.setCustomValidity('');
      contact.removeAttribute('aria-invalid');
    });
    contact.addEventListener('blur', () => { if (contact.value === '+7') contact.value = ''; });
    contact.addEventListener('invalid', () => contact.setAttribute('aria-invalid', 'true'));
    const service = new URLSearchParams(location.search).get('service');
    if (service === 'audit') form.elements.message.value = 'Хочу обсудить комплексный аудит отдела продаж.';
    if (service === 'development') form.elements.message.value = 'Хочу обсудить построение и развитие отдела продаж.';
    form.addEventListener('submit', event => {
      event.preventDefault();
      const value = contact.value.trim();
      const validContact = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(value);
      contact.setCustomValidity(validContact ? '' : 'Введите номер полностью: +7 (999) 123-45-67');
      if (!form.reportValidity()) return;
      const status = form.querySelector('[role="status"]');
      status.textContent = 'Обращение подготовлено. Вы можете скопировать его текст.';
      const output = form.querySelector('[data-request-output]');
      const fields = new FormData(form);
      output.hidden = false;
      output.value = `Имя: ${fields.get('name')}\nКонтакт: ${fields.get('contact')}\nЗадача: ${fields.get('message') || 'Обсудить отдел продаж'}`;
      form.querySelector('[data-copy]').hidden = false;
    });
    form.querySelector('[data-copy]')?.addEventListener('click', async () => {
      const output = form.querySelector('[data-request-output]');
      try { await navigator.clipboard.writeText(output.value); form.querySelector('[role="status"]').textContent = 'Текст обращения скопирован.'; }
      catch { output.focus(); output.select(); form.querySelector('[role="status"]').textContent = 'Выделили текст — скопируйте его вручную.'; }
    });
  });
});
