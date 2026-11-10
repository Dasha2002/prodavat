document.addEventListener('sections:loaded', () => {
  const filters = [...document.querySelectorAll('[data-topic-filter]')];
  const articles = [...document.querySelectorAll('[data-knowledge-topic]')];
  const status = document.querySelector('[data-knowledge-count]');
  filters.forEach(button => button.addEventListener('click', () => {
    const topic = button.dataset.topicFilter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    articles.forEach(article => { article.hidden = topic !== 'all' && article.dataset.knowledgeTopic !== topic; });
    const count = articles.filter(article => !article.hidden).length;
    status.textContent = `${count} ${count === 2 ? 'материала' : 'материалов'}`;
  }));
});
