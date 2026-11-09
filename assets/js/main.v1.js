/* ИП Пашкель Д.М. — меню, разрез пола, расчёт разуклонки, заявка */
(function () {
  'use strict';
  var WA = 'https://wa.me/375297833946';

  /* ---------- шапка ---------- */
  var head = document.querySelector('.head');
  function onScroll() {
    if (!head) return;
    head.classList.toggle('is-stuck', window.scrollY > 30 || head.classList.contains('head--solid'));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- меню ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var closeBtn = document.getElementById('drawer-close');
  var lastFocus = null;
  function focusables() {
    if (!drawer) return [];
    return Array.prototype.slice.call(drawer.querySelectorAll('a[href],button:not([disabled]),input,select,textarea'))
      .filter(function (el) { return el.offsetParent !== null; });
  }
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.classList.add('is-locked');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    var f = focusables(); if (f.length) f[0].focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.hidden = true;
    document.body.classList.remove('is-locked');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (burger) burger.addEventListener('click', function () { (drawer && drawer.hidden) ? openDrawer() : closeDrawer(); });
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (drawer) {
    drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('is-locked');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && !drawer.hidden) closeDrawer();
  });

  /* ---------- появление ---------- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- пирог пола ---------- */
  var pie = document.getElementById('pie');
  if (pie) {
    var BASE = 384, X0 = 150, X1 = 616;
    var thick = document.getElementById('thick');
    var thickOut = document.getElementById('thickOut');
    var oMix = document.getElementById('o-mix'), oBags = document.getElementById('o-bags');
    var oWeight = document.getElementById('o-weight'), oVol = document.getElementById('o-vol');
    var oNote = document.getElementById('o-note');
    var NS = 'http://www.w3.org/2000/svg';

    var TYPES = {
      polusuh: {
        name: 'Полусухая стяжка',
        note: 'Расход пескобетона — около 20 кг на 1 м² при слое 10 мм. Значения ориентировочные: точную смету считаем после замера.',
        layers: ['slab', 'iso', 'screed', 'finish']
      },
      teply: {
        name: 'Стяжка по тёплому полу',
        note: 'Толщина считается над трубой, а не от плиты: контур должен быть полностью закрыт смесью. Расход — ориентир, точный объём зависит от шага труб.',
        layers: ['slab', 'iso', 'pipes', 'screed', 'finish']
      },
      keramzit: {
        name: 'Стяжка по керамзиту',
        note: 'Керамзит поднимает уровень и утепляет: слой подсыпки задаёт высоту пола, стяжка идёт сверху. Вес керамзита в расчёт стяжки не входит.',
        layers: ['slab', 'clay', 'screed', 'finish']
      },
      krovlya: {
        name: 'Разуклонка на плоской кровле',
        note: 'Разуклонка — стяжка переменной толщины: у воронки минимум, к стене больше. Объём считаем по ширине ската и уклону в блоке ниже.',
        layers: ['slab', 'wedge', 'screed', 'water']
      },
      polistirol: {
        name: 'Полистиролбетон',
        note: 'Полистиролбетон легче пескобетона и добавляет тепла: его берут для больших слоёв выравнивания. Сверху возможна стяжка под финиш.',
        layers: ['slab', 'iso', 'poly', 'screed', 'finish']
      }
    };
    var cur = 'polusuh';

    function el(tag, attrs, text) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
      if (text) e.textContent = text;
      return e;
    }

    function render() {
      var T = parseInt(thick.value, 10);
      var spec = TYPES[cur];
      var h = {
        slab: 72, iso: 22, pipes: 26, clay: 74, poly: 84, finish: 12, water: 10,
        screed: Math.round(T * 1.55),
        wedge: Math.max(26, Math.min(66, T * 0.7))
      };
      while (pie.firstChild) pie.removeChild(pie.firstChild);

      var defs = el('defs');
      var pat = el('pattern', { id: 'pHatch', width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
      pat.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 10, stroke: 'rgba(239,235,227,.22)', 'stroke-width': 1 }));
      defs.appendChild(pat);
      var patClay = el('pattern', { id: 'pClay', width: 12, height: 12, patternUnits: 'userSpaceOnUse' });
      patClay.appendChild(el('rect', { width: 12, height: 12, fill: '#8C7B5C' }));
      patClay.appendChild(el('circle', { cx: 3, cy: 3, r: 2.4, fill: '#A6957A' }));
      patClay.appendChild(el('circle', { cx: 9, cy: 8, r: 2, fill: '#79694D' }));
      defs.appendChild(patClay);
      var grad = el('linearGradient', { id: 'gWedge', x1: 0, y1: 0, x2: 1, y2: 0 });
      grad.appendChild(el('stop', { offset: 0, 'stop-color': '#C3E63C', 'stop-opacity': '.42' }));
      grad.appendChild(el('stop', { offset: 1, 'stop-color': '#C3E63C', 'stop-opacity': '.12' }));
      defs.appendChild(grad);
      pie.appendChild(defs);

      var labels = [];
      var y = BASE;
      var order = ['slab', 'iso', 'clay', 'pipes', 'poly', 'wedge', 'screed', 'finish', 'water'];
      var used = {};
      spec.layers.forEach(function (key) { used[key] = true; });

      order.forEach(function (key) {
        if (!used[key]) return;
        var sh = h[key];
        if (key === 'slab') {
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: '#2C2E24' }));
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: 'url(#pHatch)' }));
          labels.push({ y: y - sh / 2, text: 'плита / основание' });
        } else if (key === 'iso') {
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: '#8B8C77' }));
          labels.push({ y: y - sh / 2, text: 'изоляция' });
        } else if (key === 'pipes') {
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: '#6F7059' }));
          for (var i = 0; i < 9; i++) {
            pie.appendChild(el('circle', { cx: X0 + 42 + i * ((X1 - X0 - 70) / 8), cy: y - sh / 2, r: 6, fill: '#B4553A' }));
          }
          labels.push({ y: y - sh / 2, text: 'трубы тёплого пола' });
        } else if (key === 'clay') {
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: 'url(#pClay)' }));
          labels.push({ y: y - sh / 2, text: 'керамзит' });
        } else if (key === 'poly') {
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: '#C2BFA6' }));
          for (var j = 0; j < 26; j++) {
            pie.appendChild(el('circle', { cx: X0 + 22 + (j % 13) * ((X1 - X0 - 40) / 12), cy: y - sh + 16 + Math.floor(j / 13) * (sh - 26), r: 3.6, fill: '#DAD7C2' }));
          }
          labels.push({ y: y - sh / 2, text: 'полистиролбетон' });
        } else if (key === 'wedge') {
          var pts = [X0, y, X1, y, X1, y - Math.round(h.wedge * 0.35), X0, y - h.wedge];
          pie.appendChild(el('polygon', { points: pts.join(' '), fill: 'url(#gWedge)', stroke: 'rgba(195,230,60,.5)', 'stroke-width': 1 }));
          labels.push({ y: y - h.wedge * 0.55, text: 'разуклонка' });
        } else if (key === 'screed') {
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: '#C4C6B2' }));
          pie.appendChild(el('line', { x1: X0, y1: y - sh, x2: X1, y2: y - sh, stroke: '#C3E63C', 'stroke-width': 2.5 }));
          pie.appendChild(el('line', { x1: X0, y1: y - sh + 7, x2: X1, y2: y - sh + 7, stroke: 'rgba(20,21,15,.18)', 'stroke-width': 1 }));
          labels.push({ y: y - sh / 2, text: 'стяжка ' + T + ' мм' });
        } else if (key === 'finish') {
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: '#E9E5DA' }));
          labels.push({ y: y - sh / 2, text: 'финишное покрытие' });
        } else if (key === 'water') {
          pie.appendChild(el('rect', { x: X0, y: y - sh, width: X1 - X0, height: sh, fill: '#46646B' }));
          labels.push({ y: y - sh / 2, text: 'гидроизоляция' });
        }
        y -= sh;
      });

      /* подписи слева, с разведением по вертикали */
      labels.sort(function (a, b) { return a.y - b.y; });
      for (var k = 1; k < labels.length; k++) {
        if (labels[k].y - labels[k - 1].y < 15) labels[k].y = labels[k - 1].y + 15;
      }
      labels.forEach(function (l) {
        pie.appendChild(el('line', { x1: 142, y1: l.y, x2: X0, y2: l.y, stroke: 'rgba(239,235,227,.28)', 'stroke-width': 1 }));
        var t = el('text', { x: 134, y: l.y + 3, 'text-anchor': 'end' }, l.text);
        pie.appendChild(t);
      });

      /* размерная линия справа */
      var top = BASE - 0;
      var total = Object.keys(used).reduce(function (s, key) { return s + (used[key] ? h[key] : 0); }, 0);
      pie.appendChild(el('line', { x1: X1 + 26, y1: BASE, x2: X1 + 26, y2: BASE - total, stroke: 'rgba(195,230,60,.6)', 'stroke-width': 1 }));
      pie.appendChild(el('line', { x1: X1 + 21, y1: BASE - total, x2: X1 + 31, y2: BASE - total, stroke: 'rgba(195,230,60,.6)', 'stroke-width': 1 }));
      pie.appendChild(el('line', { x1: X1 + 21, y1: BASE, x2: X1 + 31, y2: BASE, stroke: 'rgba(195,230,60,.6)', 'stroke-width': 1 }));
      pie.appendChild(el('text', { x: X1 + 34, y: BASE + 4 }, 'пирог'));

      /* уровень пола */
      pie.appendChild(el('line', { x1: 60, y1: BASE - total, x2: 640, y2: BASE - total, stroke: 'rgba(195,230,60,.34)', 'stroke-width': 1, 'stroke-dasharray': '6 5' }));
      pie.appendChild(el('text', { x: 60, y: BASE - total - 8 }, 'уровень пола'));

      /* числа */
      var mix = Math.round(T / 10 * 20);
      var bags = Math.ceil(mix / 25);
      var weight = Math.round(T / 1000 * 1900);
      var vol = Math.round(50 * T / 1000 * 10) / 10;
      thickOut.textContent = T;
      oMix.textContent = mix;
      oBags.textContent = bags;
      oWeight.textContent = weight;
      oVol.textContent = String(vol).replace('.', ',');
      oNote.textContent = spec.note;
      pie.setAttribute('aria-label', 'Разрез: ' + spec.name.toLowerCase() + ', слой ' + T + ' мм');
    }

    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-pie]'));
    chips.forEach(function (b) {
      b.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        cur = b.getAttribute('data-pie');
        render();
      });
    });
    thick.addEventListener('input', render);
    render();
  }

  /* ---------- разуклонка ---------- */
  var sw = document.getElementById('sw');
  if (sw) {
    var sr = document.getElementById('sr'), st = document.getElementById('st');
    var swOut = document.getElementById('swOut'), srOut = document.getElementById('srOut'), stOut = document.getElementById('stOut');
    var sDrop = document.getElementById('s-drop'), sAvg = document.getElementById('s-avg');
    var sVol = document.getElementById('s-vol'), sRate = document.getElementById('s-rate');
    var wedge = document.getElementById('wedge'), drain = document.getElementById('drain');
    var lblWidth = document.getElementById('lblWidth'), lblDrop = document.getElementById('lblDrop');
    var dim = document.getElementById('dim'), send = document.getElementById('slope-send');
    var nf = function (v, d) { return v.toFixed(d).replace('.', ','); };

    function paint() {
      var W = parseFloat(sw.value), R = parseFloat(sr.value), S = parseInt(st.value, 10);
      var drop = W * R;                       /* см */
      var dropM = drop / 100;                 /* м */
      var avg = S + drop * 10 / 2;            /* мм */
      var vol = 0.5 * W * dropM;              /* м³ на 1 пог. м */
      var hpx = Math.max(10, 170 * Math.min(1, dropM / 0.5));

      swOut.textContent = nf(W, 1) + ' м';
      srOut.textContent = nf(R, 1) + ' %';
      stOut.textContent = S + ' мм';
      sDrop.innerHTML = nf(drop, 1).replace(',0', '') + ' см';
      sAvg.innerHTML = Math.round(avg) + ' мм';
      sVol.innerHTML = nf(vol, 3) + ' м³';
      sRate.innerHTML = nf(R, 1) + ' %';

      wedge.setAttribute('points', '40,250 520,250 520,' + Math.round(250 - hpx) + ' 40,' + Math.round(250 - hpx * 0.16));
      drain.setAttribute('y2', Math.round(250 - hpx));
      dim.setAttribute('y1', Math.round(250 - hpx - 26));
      dim.setAttribute('y2', Math.round(250 - hpx - 26));
      lblWidth.textContent = 'ширина ската ' + nf(W, 1) + ' м';
      lblWidth.setAttribute('y', Math.round(250 - hpx - 34));
      lblDrop.textContent = 'перепад ' + nf(drop, 0) + ' см';
      lblDrop.setAttribute('y', Math.round(250 - hpx / 2));

      if (send) {
        send.href = WA + '?text=' + encodeURIComponent(
          'Расчёт разуклонки с сайта\nШирина ската: ' + nf(W, 1) + ' м\nУклон: ' + nf(R, 1) + ' %\n' +
          'Толщина у воронки: ' + S + ' мм\nПерепад: ' + nf(drop, 1) + ' см\n' +
          'Средняя толщина: ' + Math.round(avg) + ' мм\nОбъём на 1 пог. м: ' + nf(vol, 3) + ' м³\n' +
          'Хочу уточнить стоимость.');
      }
    }
    [sw, sr, st].forEach(function (i) { i.addEventListener('input', paint); });
    paint();
  }

  /* ---------- заявка ---------- */
  var form = document.getElementById('lead');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = function (sel) { var el = form.querySelector(sel); return el ? el.value : ''; };
      var name = g('#f-name'), phone = g('#f-phone'), obj = g('#f-obj'), what = g('#f-what'), note = g('#f-note');
      var ok = form.querySelector('.form__ok');
      if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 9) {
        if (ok) { ok.hidden = false; ok.textContent = 'Укажите имя и телефон, чтобы мы могли ответить.'; }
        return;
      }
      var text = 'Заявка на замер\nИмя: ' + name.trim() + '\nТелефон: ' + phone.trim() +
        (obj ? '\nОбъект: ' + obj : '') + (what ? '\nЧто нужно: ' + what : '') +
        (note.trim() ? '\nКомментарий: ' + note.trim() : '');
      var url = WA + '?text=' + encodeURIComponent(text);
      if (ok) {
        ok.hidden = false;
        ok.innerHTML = 'Заявка собрана. Если WhatsApp не открылся, <a href="' + url + '" target="_blank" rel="noopener">нажмите здесь</a>.';
      }
      window.open(url, '_blank', 'noopener');
    });
  }
})();
