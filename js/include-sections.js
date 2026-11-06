/* Совместимая с «Домом климата» сборка: data-include + {{root}}. */
(async () => {
  const root = document.body.dataset.root || '';
  const results = await Promise.allSettled([...document.querySelectorAll('[data-include]')].map(async node => {
    const response = await fetch(node.dataset.include);
    if (!response.ok) throw new Error(`Не удалось загрузить ${node.dataset.include}`);
    const template = document.createElement('template');
    template.innerHTML = (await response.text()).replaceAll('{{root}}', root);
    node.replaceWith(template.content);
  }));
  if (results.some(result => result.status === 'rejected')) {
    const error = document.createElement('p');
    error.className = 'load-error';
    error.textContent = 'Не все секции загрузились. Обновите страницу. Открывайте сайт через локальный HTTP-сервер.';
    document.body.prepend(error);
    results.forEach(result => { if (result.status === 'rejected') console.error(result.reason); });
  }
  document.dispatchEvent(new CustomEvent('sections:loaded'));
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) target.scrollIntoView();
})();
