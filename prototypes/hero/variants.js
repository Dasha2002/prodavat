const ROOT = '../../';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const headerHeight = () => document.querySelector('.header')?.offsetHeight || 0;

const actions = (extra = '') => `
  <a class="button" href="${ROOT}kontakty/#request">Обсудить вашу задачу</a>
  <a class="hv-link${extra}" href="#services">Выбрать формат работы</a>`;

const formats = `
  <a class="hv-format" href="${ROOT}formaty-raboty/audit-prodazh/"><span>01</span>Комплексный аудит продаж<b aria-hidden="true">→</b></a>
  <a class="hv-format" href="${ROOT}formaty-raboty/otdel-prodazh/"><span>02</span>Построение и развитие отдела<b aria-hidden="true">→</b></a>`;

const syncHeader = () => document.documentElement.style.setProperty('--hdr', headerHeight() + 'px');
document.addEventListener('sections:loaded', syncHeader);
addEventListener('resize', syncHeader);

/* 4. Окно */
function initWindow(stage) {
  const sec = stage.querySelector('.win');
  if (reduceMotion) {
    sec.classList.add('is-static', 'is-open');
    sec.style.setProperty('--p', 1);
    return null;
  }
  let raf = 0;
  const update = () => {
    raf = 0;
    const hdr = headerHeight();
    sec.style.setProperty('--hdr', hdr + 'px');
    const rect = sec.getBoundingClientRect();
    const travel = rect.height - (innerHeight - hdr);
    const p = Math.min(1, Math.max(0, (hdr - rect.top) / travel));
    sec.style.setProperty('--p', p.toFixed(4));
    sec.classList.toggle('is-open', p > 0.85);
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();
  return () => {
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    cancelAnimationFrame(raf);
  };
}

/* 5. Фонарик */
function initSpotlight(stage) {
  const sec = stage.querySelector('.spot');
  const lens = sec.querySelector('.spot__lens');
  const lensImg = lens.querySelector('img');
  const autoDrift = matchMedia('(hover: none)').matches;
  let w = 0, h = 0, r = 0;
  let x = 0, y = 0, tx = 0, ty = 0;
  let raf = 0, visible = true, dragging = false, start = performance.now();

  const measure = () => {
    sec.style.setProperty('--hdr', headerHeight() + 'px');
    w = sec.clientWidth;
    h = sec.clientHeight;
    r = Math.round(Math.min(220, Math.max(120, w * 0.14)));
    lens.style.width = lens.style.height = r * 2 + 'px';
    lensImg.style.width = w + 'px';
    lensImg.style.height = h + 'px';
  };
  const rest = () => { tx = w * 0.7; ty = h * 0.3; };
  const paint = () => {
    lens.style.transform = `translate3d(${x - r}px, ${y - r}px, 0)`;
    lensImg.style.transform = `translate3d(${r - x}px, ${r - y}px, 0)`;
  };
  const frame = (now) => {
    raf = 0;
    if (!visible) return;
    if (autoDrift && !dragging) {
      const t = (now - start) / 1000;
      tx = w * (0.58 + 0.16 * Math.sin(t * 0.55));
      ty = h * (0.3 + 0.08 * Math.sin(t * 0.9));
    }
    x += (tx - x) * 0.16;
    y += (ty - y) * 0.16;
    paint();
    if (autoDrift || Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && !reduceMotion) raf = requestAnimationFrame(frame); };
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' && !dragging) return;
    const b = sec.getBoundingClientRect();
    tx = e.clientX - b.left;
    ty = e.clientY - b.top;
    kick();
  };
  const onDown = (e) => { if (e.pointerType !== 'mouse') { dragging = true; onMove(e); } };
  const onUp = () => { dragging = false; start = performance.now(); };
  const onResize = () => { measure(); rest(); x = tx; y = ty; paint(); };

  measure();
  rest();
  x = tx; y = ty;
  paint();
  if (reduceMotion) {
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick(); });
  io.observe(sec);
  sec.addEventListener('pointermove', onMove);
  sec.addEventListener('pointerdown', onDown);
  addEventListener('pointerup', onUp);
  addEventListener('resize', onResize);
  kick();
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    removeEventListener('pointerup', onUp);
    removeEventListener('resize', onResize);
  };
}

/* 6. Порядок */
function initOrder(stage) {
  const sec = stage.querySelector('.order');
  if (reduceMotion) return null;
  const box = sec.getBoundingClientRect();
  sec.classList.add('is-measuring');
  sec.querySelectorAll('.order__chip').forEach((chip, i) => {
    const r = chip.getBoundingClientRect();
    const cx = box.left + box.width * (0.1 + Math.random() * 0.8);
    const cy = box.top + box.height * (0.12 + Math.random() * 0.62);
    chip.style.setProperty('--tx', Math.round(cx - r.left - r.width / 2) + 'px');
    chip.style.setProperty('--ty', Math.round(cy - r.top - r.height / 2) + 'px');
    chip.style.setProperty('--r', (Math.random() * 36 - 18).toFixed(1) + 'deg');
    chip.style.setProperty('--i', i);
  });
  sec.classList.remove('is-ordered');
  void sec.offsetHeight;
  sec.classList.remove('is-measuring');
  const t = setTimeout(() => sec.classList.add('is-ordered'), 750);
  return () => clearTimeout(t);
}

/* 7. Рычаг */
function initLever(stage) {
  const sec = stage.querySelector('.lever');
  const range = sec.querySelector('.lever__range');
  const line = sec.querySelector('.lever__line');
  const area = sec.querySelector('.lever__area');
  const state = sec.querySelector('.lever__state');
  const states = [
    'Выручка скачет от месяца к месяцу, и непонятно, на что влиять',
    'Появляются процессы, роли и регулярное управление',
    'Команда работает системно, а вы занимаетесь развитием бизнеса',
  ];
  const N = 26;
  const noise = Array.from({ length: N }, (_, i) => {
    const v = Math.sin((i + 3) * 12.9898) * 43758.5453;
    return (v - Math.floor(v) - 0.5) * 2;
  });
  const ease = (t) => t * t * (3 - 2 * t);
  const points = (s) => noise.map((n, i) => {
    const t = i / (N - 1);
    const calm = 300 - 230 * ease(t);
    const wild = Math.min(335, Math.max(35, 205 + n * 130));
    return [t * 1200, wild + (calm - wild) * s];
  });
  const toPath = (p) => {
    let d = `M${p[0][0]},${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1].toFixed(1)}`;
    }
    return d;
  };
  let bucket = -1;
  const render = (s) => {
    const d = toPath(points(s));
    line.setAttribute('d', d);
    area.setAttribute('d', `${d}L1200,360L0,360Z`);
    range.style.setProperty('--fill', s * 100 + '%');
    sec.style.setProperty('--s', s.toFixed(3));
    const b = s < 0.34 ? 0 : s < 0.67 ? 1 : 2;
    if (b !== bucket) { bucket = b; state.textContent = states[b]; }
  };

  let raf = 0, timer = 0;
  const stopDemo = () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  const onInput = () => { stopDemo(); render(range.value / 100); };
  range.addEventListener('input', onInput);
  range.addEventListener('pointerdown', stopDemo);
  range.addEventListener('keydown', stopDemo);

  if (reduceMotion) {
    range.value = 100;
    render(1);
    return stopDemo;
  }
  range.value = 0;
  render(0);
  timer = setTimeout(() => {
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 1700);
      const s = 1 - Math.pow(1 - k, 3);
      range.value = Math.round(s * 100);
      render(s);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }, 900);
  return stopDemo;
}

/* Сквозь */
function initThrough(stage) {
  const sec = stage.querySelector('.thru');
  if (reduceMotion) return null;
  let raf = 0;
  const update = () => {
    raf = 0;
    const rect = sec.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -rect.top / rect.height));
    sec.style.setProperty('--p', p.toFixed(4));
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, { passive: true });
  update();
  return () => {
    removeEventListener('scroll', schedule);
    cancelAnimationFrame(raf);
  };
}

const EXPERT = `${ROOT}img/team/experts.jpg`;
const desc = 'Находим причины потерь в продажах и помогаем выстроить процессы, чтобы команда работала системно, а собственник мог заниматься развитием бизнеса.';

const chips = ['Стратегия', 'Воронка', 'CRM', 'Скрипты', 'Регламенты', 'Найм', 'Обучение', 'Мотивация', 'Планы', 'KPI', 'Отчёты', 'Контроль'];

const variants = [
  { html: () => `
  <section class="canvas">
    <img class="canvas__img hv-fade" src="${EXPERT}" width="1707" height="2560" alt="Эксперт proДАВАТЬ" fetchpriority="high">
    <div class="container canvas__wrap">
      <div class="canvas__text">
        <p class="eyebrow hv-in">Стратегия. Продажи. Развитие.</p>
        <h1 class="hv-in" style="--d:60ms">Продажи,<br>которыми можно<br><mark class="hv-mark" style="--d:520ms">управлять</mark></h1>
        <p class="canvas__lead hv-in" style="--d:140ms">Аудит, построение и развитие отдела продаж</p>
        <p class="canvas__desc hv-in" style="--d:180ms">${desc}</p>
        <div class="hv-actions hv-in" style="--d:220ms">${actions()}</div>
      </div>
      <nav class="canvas__formats hv-in" style="--d:300ms" aria-label="Форматы работы">${formats}</nav>
    </div>
  </section>` },

  { html: () => `
  <section class="trip">
    <div class="container">
      <p class="eyebrow hv-in">Стратегия. Продажи. Развитие.</p>
      <h1 class="hv-in" style="--d:60ms">Продажи, которыми можно <mark class="hv-mark" style="--d:520ms">управлять</mark></h1>
      <div class="trip__grid">
        <div class="trip__col hv-in" style="--d:220ms">
          <p class="trip__lead">Аудит, построение и развитие отдела продаж</p>
          <p class="trip__desc">${desc}</p>
          <a class="button" href="${ROOT}kontakty/#request">Обсудить вашу задачу</a>
        </div>
        <figure class="trip__photo hv-photo" style="--d:120ms"><img src="${EXPERT}" width="1707" height="2560" alt="Эксперт proДАВАТЬ" fetchpriority="high"></figure>
        <nav class="trip__col hv-in" style="--d:300ms" aria-label="Форматы работы">
          <p class="trip__label">Форматы работы</p>
          ${formats}
          <a class="hv-link" href="#services">Все услуги</a>
        </nav>
      </div>
    </div>
  </section>` },

  { html: () => `
  <section class="pano">
    <div class="container pano__head">
      <p class="eyebrow hv-in">Стратегия. Продажи. Развитие.</p>
      <h1 class="hv-in" style="--d:60ms">Продажи, которыми можно <em>управлять</em></h1>
    </div>
    <div class="pano__stage">
      <img class="pano__img hv-fade" style="--d:120ms" src="${ROOT}img/team/DSC_6588.jpg" width="2500" height="1669" alt="Эксперты proДАВАТЬ" fetchpriority="high">
      <div class="container pano__sides">
        <div class="pano__side hv-in" style="--d:260ms">
          <p class="pano__lead">Аудит, построение и развитие отдела продаж</p>
          <p class="pano__desc">Находим причины потерь и выстраиваем процессы, чтобы команда работала системно.</p>
          <a class="button" href="${ROOT}kontakty/#request">Обсудить вашу задачу</a>
        </div>
        <nav class="pano__side pano__side--right hv-in" style="--d:320ms" aria-label="Форматы работы">
          <p class="pano__label">Форматы работы</p>
          ${formats}
        </nav>
      </div>
    </div>
  </section>` },

  { html: () => `
  <section class="plate">
    <img class="plate__img hv-fade" src="${ROOT}img/team/DSC_6784.jpg" width="2500" height="1669" alt="Эксперты proДАВАТЬ" fetchpriority="high">
    <div class="container plate__wrap">
      <div class="plate__card hv-in" style="--d:160ms">
        <p class="eyebrow">Стратегия. Продажи. Развитие.</p>
        <h1>Продажи, которыми можно <mark class="hv-mark" style="--d:620ms">управлять</mark></h1>
        <p class="plate__lead">Аудит, построение и развитие отдела продаж. Находим причины потерь и помогаем выстроить процессы, чтобы команда работала системно.</p>
        <div class="hv-actions">${actions(' hv-link--light')}</div>
      </div>
    </div>
  </section>` },

  { html: () => `
  <section class="inline">
    <div class="container">
      <div class="inline__top hv-in">
        <p class="eyebrow">Стратегия. Продажи. Развитие.</p>
        <p class="inline__note">Внешний партнёр в развитии продаж</p>
      </div>
      <h1 class="hv-in" style="--d:60ms">Продажи,
        <span class="inline__pic inline__pic--solo hv-open" style="--d:280ms"><img src="${ROOT}img/team/DSC_6902.jpg" width="2500" height="1669" alt="" fetchpriority="high"></span>
        которыми<br> можно
        <span class="inline__pic inline__pic--duo hv-open" style="--d:360ms"><img src="${ROOT}img/team/DSC_6768.jpg" width="2500" height="1669" alt=""></span>
        <mark class="hv-mark" style="--d:560ms">управлять</mark></h1>
      <div class="inline__row hv-in" style="--d:200ms">
        <p class="inline__lead">Находим причины потерь в продажах и выстраиваем процессы, чтобы команда работала системно, а собственник занимался развитием бизнеса.</p>
        <nav class="inline__formats" aria-label="Форматы работы">${formats}</nav>
        <div class="inline__cta">
          <a class="button" href="${ROOT}kontakty/#request">Обсудить вашу задачу <span class="button__arrow" aria-hidden="true">→</span></a>
          <p>Оставьте номер — вместе определим следующий шаг</p>
        </div>
      </div>
    </div>
  </section>` },

  { html: () => `
  <section class="win">
    <div class="win__sticky">
      <figure class="win__photo">
        <img src="${ROOT}img/team/request-background.webp" width="1600" height="1068" alt="Эксперты proДАВАТЬ" fetchpriority="high">
      </figure>
      <h1 class="win__title">
        <span class="win__line win__line--top">Продажи, которыми</span>
        <span class="win__line win__line--bottom">можно <em>управлять</em></span>
      </h1>
      <div class="container win__end">
        <p class="eyebrow">Стратегия. Продажи. Развитие.</p>
        <p class="win__end-title" aria-hidden="true">Продажи, которыми можно <em>управлять</em></p>
        <p class="win__lead">Аудит, построение и развитие отдела продаж. Находим причины потерь и помогаем выстроить процессы.</p>
        <div class="hv-actions">${actions(' hv-link--light')}</div>
      </div>
      <p class="win__hint" aria-hidden="true">Листайте вниз</p>
    </div>
  </section>`, init: initWindow },

  { html: () => `
  <section class="spot">
    <figure class="spot__base"><img src="${ROOT}img/team/request-background.webp" width="1600" height="1068" alt="Эксперты proДАВАТЬ" fetchpriority="high"></figure>
    <div class="spot__lens" aria-hidden="true"><img src="${ROOT}img/team/request-background.webp" width="1600" height="1068" alt=""></div>
    <div class="container spot__content">
      <p class="eyebrow hv-in">Видим то, что скрыто</p>
      <h1 class="hv-in" style="--d:60ms">Продажи, которыми можно <em>управлять</em></h1>
      <p class="spot__lead hv-in" style="--d:120ms">Аудит, построение и развитие отдела продаж. Находим причины потерь там, где их не видно изнутри.</p>
      <div class="hv-actions hv-in" style="--d:180ms">${actions(' hv-link--light')}</div>
    </div>
    <p class="spot__hint hv-in" style="--d:600ms" aria-hidden="true">Наведите курсор на фото</p>
  </section>`, init: initSpotlight },

  { html: () => `
  <section class="order is-ordered">
    <div class="container">
      <p class="eyebrow">Из хаоса — в систему</p>
      <h1>Продажи, которыми можно <em>управлять</em></h1>
      <ol class="order__grid">
        ${chips.map((c, i) => `<li class="order__chip"><span>${String(i + 1).padStart(2, '0')}</span>${c}</li>`).join('')}
      </ol>
      <div class="order__foot">
        <p class="order__lead">Аудит, построение и развитие отдела продаж. Связываем процессы, роли, инструменты и управление в одну систему.</p>
        <div class="hv-actions">${actions()}</div>
      </div>
    </div>
  </section>`, init: initOrder },

  { html: () => `
  <section class="lever">
    <div class="container">
      <p class="eyebrow hv-in">Стратегия. Продажи. Развитие.</p>
      <h1 class="hv-in" style="--d:60ms">Продажи, которыми можно <em>управлять</em></h1>
      <figure class="lever__chart hv-in" style="--d:120ms">
        <svg viewBox="0 0 1200 360" preserveAspectRatio="none" aria-hidden="true">
          <g class="lever__grid"><line x1="0" x2="1200" y1="60" y2="60"/><line x1="0" x2="1200" y1="150" y2="150"/><line x1="0" x2="1200" y1="240" y2="240"/><line x1="0" x2="1200" y1="330" y2="330"/></g>
          <path class="lever__area"/>
          <path class="lever__line"/>
        </svg>
        <figcaption>Схема</figcaption>
      </figure>
      <div class="lever__controls hv-in" style="--d:180ms">
        <span>Хаос</span>
        <input class="lever__range" type="range" min="0" max="100" value="0" aria-label="Системность продаж">
        <span>Система</span>
      </div>
      <div class="lever__bottom hv-in" style="--d:220ms">
        <p class="lever__state" aria-live="polite"></p>
        <div class="hv-actions">${actions()}</div>
      </div>
    </div>
  </section>`, init: initLever },

  { html: () => `
  <section class="thru">
    <div class="container thru__head">
      <p class="eyebrow hv-in">Стратегия. Продажи. Развитие.</p>
      <h1 class="hv-in" style="--d:60ms">Продажи, которыми<br>можно<span class="thru__sr"> управлять</span></h1>
    </div>
    <figure class="thru__fig">
      <img class="thru__img hv-fade" src="${EXPERT}" width="1707" height="2560" alt="Эксперт proДАВАТЬ" fetchpriority="high">
      <div class="thru__track" aria-hidden="true">
        <div class="thru__strip">${'<span>управлять</span>'.repeat(6)}</div>
      </div>
      <img class="thru__img thru__img--front hv-fade" src="${EXPERT}" width="1707" height="2560" alt="">
    </figure>
    <div class="container thru__foot">
      <div class="thru__cta hv-in" style="--d:240ms">
        <p class="thru__lead">Аудит, построение и развитие отдела продаж. Находим причины потерь и выстраиваем процессы, чтобы команда работала системно.</p>
        <div class="hv-actions">${actions()}</div>
      </div>
      <nav class="thru__formats hv-in" style="--d:320ms" aria-label="Форматы работы">${formats}</nav>
    </div>
  </section>`, init: initThrough },
];

const stage = document.getElementById('stage');
const picker = document.querySelector('.proto-picker');
const highlight = picker.querySelector('.proto-picker-highlight');
const items = [...picker.querySelectorAll('.proto-picker-item:not(.proto-picker-replay)')];
const replay = picker.querySelector('.proto-picker-replay');
let current = 0;
let cleanup = null;
let mountToken = 0;

function moveHighlight() {
  const el = items[current];
  highlight.style.width = el.offsetWidth + 'px';
  highlight.style.transform = `translateX(${el.offsetLeft}px)`;
}

function mount(i) {
  const token = ++mountToken;
  cleanup?.();
  cleanup = null;
  stage.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  requestAnimationFrame(() => {
    if (token !== mountToken) return;
    syncHeader();
    stage.innerHTML = variants[i].html();
    cleanup = variants[i].init?.(stage) || null;
  });
}

function setActive(i) {
  if (i < 0 || i >= variants.length) return;
  current = i;
  items.forEach((el, j) => {
    el.toggleAttribute('data-active', j === i);
    if (j === i) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
  moveHighlight();
  const url = new URL(location);
  url.searchParams.set('v', i + 1);
  history.replaceState(null, '', url);
  mount(i);
}

items.forEach((el, i) => el.addEventListener('click', () => setActive(i)));
replay?.addEventListener('click', () => mount(current));
window.addEventListener('resize', moveHighlight);

document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const num = e.key === '0' ? 10 : parseInt(e.key, 10);
  if (num >= 1 && num <= variants.length) setActive(num - 1);
  else if (e.key === 'ArrowRight') setActive((current + 1) % variants.length);
  else if (e.key === 'ArrowLeft') setActive((current - 1 + variants.length) % variants.length);
  else if (e.key === 'r' || e.key === 'R') mount(current);
});

setActive((parseInt(new URLSearchParams(location.search).get('v'), 10) || 1) - 1);
requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute('data-ready', '')));
