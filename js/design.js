// Смена концепции доступна в превью, URL сохраняется при переходах.
const design = new URLSearchParams(location.search).get('design');
document.documentElement.dataset.design = design === 'contrast' ? 'contrast' : 'light';
