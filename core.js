// «Крокус» — основной скрипт сайта. Контент берётся из content.js,
// поверх него применяется черновик из админки (localStorage).

(function () {
  'use strict';

  // ---------- Контент: content.js + черновик админки ----------
  const DEFAULT = window.KROKUS_DEFAULT || {};
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem('krokus_draft') || 'null'); } catch (e) { draft = null; }
  const C = draft || DEFAULT;
  window.KROKUS_CONTENT = C;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  // ---------- Тексты по data-t (разрешён простой HTML для заголовков) ----------
  document.querySelectorAll('[data-t]').forEach(el => {
    const v = (C.texts || {})[el.dataset.t];
    if (v !== undefined) el.innerHTML = v;
  });

  // Телефоны и ссылки
  document.querySelectorAll('[data-tel]').forEach(el => {
    const v = (C.texts || {})[el.dataset.tel];
    if (v) { el.textContent = v; el.href = 'tel:' + v.replace(/[^\d+]/g, ''); }
  });
  document.querySelectorAll('[data-href]').forEach(el => {
    const v = (C.texts || {})[el.dataset.href];
    if (v) el.href = v;
  });

  // ---------- Картинки по data-img ----------
  const imgFallback = el => { el.classList.add('img-missing'); };
  document.querySelectorAll('[data-img]').forEach(el => {
    const v = (C.images || {})[el.dataset.img];
    if (!v) return;
    if (el.tagName === 'IMG') { el.src = v; el.onerror = () => imgFallback(el); }
    else el.style.backgroundImage = 'url("' + v + '")';
  });

  // ---------- Рендер списков ----------
  const R = {};

  R.dirs = box => box.innerHTML = (C.dirs || []).map(d => `
    <article class="photo-card reveal">
      <div class="photo-card-img"><img src="${esc(d.img)}" alt="${esc(d.t)}" loading="lazy" onerror="this.parentElement.classList.add('img-missing')"></div>
      <div class="photo-card-body"><h3>${esc(d.t)}</h3><p>${esc(d.p)}</p></div>
    </article>`).join('');

  R.acts = box => box.innerHTML = (C.acts || []).map(d => `
    <article class="photo-card reveal">
      <div class="photo-card-img"><img src="${esc(d.img)}" alt="${esc(d.t)}" loading="lazy" onerror="this.parentElement.classList.add('img-missing')"></div>
      <div class="photo-card-body"><h3>${esc(d.t)}</h3><p>${esc(d.p)}</p></div>
    </article>`).join('');

  R.schedule = box => box.innerHTML = (C.schedule || []).map(r => `
    <tr><td>${esc(r.d)}</td><td>${esc(r.z)}</td><td>${esc(r.g)}</td><td>${esc(r.t)}</td></tr>`).join('');

  R.climbers = box => box.innerHTML = (C.climbers || []).map(d => `
    <article class="photo-card reveal">
      <div class="photo-card-img tall"><img src="${esc(d.img)}" alt="${esc(d.name)}" loading="lazy" onerror="this.parentElement.classList.add('img-missing')"></div>
      <div class="photo-card-body">
        <span class="altitude">${esc(d.tag)}</span>
        <h3 style="margin-top:10px">${esc(d.name)}</h3><p>${esc(d.p)}</p>
      </div>
    </article>`).join('');

  R.gallery = box => box.innerHTML = (C.gallery || []).map((d, i) => `
    <figure class="shot reveal" data-i="${i}">
      <img src="${esc(d.img)}" alt="${esc(d.t)}" loading="lazy" onerror="this.parentElement.classList.add('img-missing')">
      <figcaption><b>${esc(d.t)}</b><span>${esc(d.c)}</span></figcaption>
    </figure>`).join('');

  R.mosaic = box => box.innerHTML = (C.gallery || []).slice(0, 5).map(d => `
    <div class="mosaic-item reveal"><img src="${esc(d.img)}" alt="${esc(d.t)}" loading="lazy" onerror="this.parentElement.classList.add('img-missing')"></div>`).join('');

  R.news = box => box.innerHTML = (C.news || []).map(d => `
    <article class="news-card reveal">
      <div class="news-img"><img src="${esc(d.img)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('img-missing')"></div>
      <div class="news-body">
        <span class="news-date">${esc(d.date)}</span>
        <h3>${esc(d.t)}</h3><p>${esc(d.p)}</p>
      </div>
    </article>`).join('');

  // Видео: принимает ссылки YouTube / VK Video, превращает в embed
  const toEmbed = url => {
    if (!url) return '';
    let m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    if (m) return 'https://www.youtube.com/embed/' + m[1];
    m = url.match(/vk(?:video)?\.(?:com|ru)\/video(-?\d+)_(\d+)/);
    if (m) return 'https://vk.com/video_ext.php?oid=' + m[1] + '&id=' + m[2] + '&hd=2';
    if (url.includes('video_ext.php') || url.includes('/embed/')) return url;
    return '';
  };
  R.videos = box => {
    const vids = (C.videos || []).filter(v => toEmbed(v.url));
    if (!vids.length) { const s = box.closest('.videos-section'); if (s) s.hidden = true; return; }
    box.innerHTML = vids.map(v => `
      <div class="video-card reveal">
        <div class="video-frame"><iframe src="${esc(toEmbed(v.url))}" title="${esc(v.t)}" allowfullscreen loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture"></iframe></div>
        <p>${esc(v.t)}</p>
      </div>`).join('');
  };

  document.querySelectorAll('[data-list]').forEach(box => { const fn = R[box.dataset.list]; if (fn) fn(box); });

  // ---------- Лайтбокс галереи ----------
  const galBox = document.querySelector('[data-list="gallery"]');
  if (galBox) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button type="button" class="lightbox-close" aria-label="Закрыть">✕</button><img alt="">';
    document.body.appendChild(lb);
    const openLb = src => {
      lb.querySelector('img').src = src; lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
    galBox.addEventListener('click', e => {
      const fig = e.target.closest('.shot'); if (!fig) return;
      const item = (C.gallery || [])[+fig.dataset.i]; if (!item) return;
      openLb(item.img);
    });
    lb.querySelector('.lightbox-close').addEventListener('click', closeLb);
    lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'IMG') closeLb(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  }

  // ---------- Шапка / меню / появление ----------
  const header = document.querySelector('.header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const observeReveals = () => {
    const els = document.querySelectorAll('.reveal:not(.visible)');
    if (!reduceMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      }), { threshold: 0.1 });
      els.forEach(el => io.observe(el));
    } else els.forEach(el => el.classList.add('visible'));
  };
  observeReveals();

  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // ---------- Черновик админки: плашка предпросмотра ----------
  if (draft) {
    const bar = document.createElement('div');
    bar.className = 'draft-bar';
    bar.innerHTML = 'Режим предпросмотра черновика · <a href="admin.html">в админку</a> · <button type="button">выйти из предпросмотра</button>';
    bar.querySelector('button').onclick = () => { localStorage.removeItem('krokus_draft'); location.reload(); };
    document.body.appendChild(bar);
  }

  // ---------- Анкета кандидата ----------
  const form = document.getElementById('candidate-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      const body = ['Анкета кандидата — клуб «Крокус»', '',
        'Имя: ' + d.get('name'), 'Возраст: ' + d.get('age'),
        'Телефон: ' + d.get('phone'), 'Направление: ' + d.get('direction'),
        'Опыт: ' + d.get('experience'), 'О себе: ' + d.get('about')].join('\n');
      const email = (C.texts || {}).email || 'krokus.vrn@yandex.ru';
      location.href = 'mailto:' + email + '?subject=' +
        encodeURIComponent('Анкета кандидата — ' + d.get('name')) +
        '&body=' + encodeURIComponent(body);
      const ok = document.getElementById('form-ok');
      if (ok) ok.hidden = false;
    });
  }
})();
