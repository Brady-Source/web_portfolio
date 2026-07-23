/* Prompts page: filter + cards + copy + single-prompt detail (hash-driven).
   All text via textContent / DOM creation. Clipboard uses async API with a
   safe fallback; feedback announced through the shared live region. */
(function () {
  'use strict';
  var el = window.BF.el;

  var state = { prompts: [], categories: [], filter: 'all', author: 'Brady' };

  var railEl = document.getElementById('prompt-rail');
  var gridEl = document.getElementById('prompt-grid');
  var filterEl = document.getElementById('cat-filter');
  var detailEl = document.getElementById('prompt-detail');

  function clipboardIcon() {
    var svgns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgns, 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
    var r = document.createElementNS(svgns, 'rect');
    r.setAttribute('x', '9'); r.setAttribute('y', '9'); r.setAttribute('width', '11'); r.setAttribute('height', '11'); r.setAttribute('rx', '2');
    var p = document.createElementNS(svgns, 'path');
    p.setAttribute('d', 'M5 15V5a2 2 0 0 1 2-2h10');
    svg.appendChild(r); svg.appendChild(p);
    return svg;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (e) { reject(e); }
    });
  }

  function copyPrompt(prompt) {
    copyText(prompt.text).then(function () {
      window.BF.announce('Copied “' + prompt.title + '” to clipboard');
    }).catch(function () {
      window.BF.announce('Copy failed — select the prompt text and copy manually');
    });
  }

  function visiblePrompts() {
    return state.prompts.filter(function (p) {
      return state.filter === 'all' || p.category === state.filter;
    });
  }

  function makeCopyButton(prompt) {
    var b = el('button', { className: 'icon-btn', attrs: { type: 'button', 'aria-label': 'Copy prompt: ' + prompt.title } });
    b.appendChild(clipboardIcon());
    b.addEventListener('click', function (e) { e.stopPropagation(); copyPrompt(prompt); });
    return b;
  }

  function renderRail() {
    railEl.textContent = '';
    var items = visiblePrompts();
    items.forEach(function (p) {
      var li = el('li', { className: 'rail__item', attrs: { role: 'listitem' } });
      var btn = el('button', { className: 'rail__btn', attrs: { type: 'button', 'data-id': p.id } });
      btn.appendChild(el('span', { text: p.title }));
      btn.appendChild(el('span', { text: p.category, className: 'rail__cat' }));
      btn.addEventListener('click', function () { openDetail(p.id); });
      li.appendChild(btn);
      railEl.appendChild(li);
    });
  }

  function renderGrid() {
    gridEl.textContent = '';
    var items = visiblePrompts();
    if (!items.length) {
      gridEl.appendChild(el('p', { text: 'No prompts in this category yet.', className: 'prompt-empty' }));
      return;
    }
    items.forEach(function (p) {
      var card = el('article', { className: 'prompt-card' });

      var head = el('div', { className: 'prompt-card__head' });
      var h = el('h2', { text: p.title, className: 'prompt-card__title' });
      head.appendChild(h);
      head.appendChild(makeCopyButton(p));
      card.appendChild(head);

      card.appendChild(el('p', { text: p.category, className: 'prompt-card__cat' }));
      card.appendChild(el('p', { text: p.description, className: 'prompt-card__desc' }));
      card.appendChild(el('p', { text: 'Author: ' + (p.author || state.author), className: 'prompt-card__author' }));

      var actions = el('div', { className: 'prompt-card__actions' });
      var viewBtn = el('button', { text: 'View prompt', className: 'btn btn--ghost', attrs: { type: 'button' } });
      viewBtn.addEventListener('click', function () { openDetail(p.id); });
      var copyBtn = el('button', { text: 'Copy Prompt', className: 'btn btn--primary', attrs: { type: 'button' } });
      copyBtn.addEventListener('click', function () { copyPrompt(p); });
      actions.appendChild(viewBtn);
      actions.appendChild(copyBtn);
      card.appendChild(actions);

      gridEl.appendChild(card);
    });
  }

  function openDetail(id) {
    var p = state.prompts.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    detailEl.textContent = '';
    detailEl.hidden = false;

    detailEl.appendChild(el('p', { text: p.category, className: 'detail__eyebrow' }));
    detailEl.appendChild(el('h2', { text: p.title, className: 'detail__title' }));
    detailEl.appendChild(el('p', { text: 'Author: ' + (p.author || state.author), className: 'prompt-card__author' }));
    detailEl.appendChild(el('p', { text: p.description, className: 'detail__tagline' }));

    var actions = el('div', { className: 'prompt-detail__actions' });

    var copyBtn = el('button', { text: 'Copy Prompt', className: 'btn btn--primary', attrs: { type: 'button' } });
    copyBtn.addEventListener('click', function () { copyPrompt(p); });
    actions.appendChild(copyBtn);

    // Disabled "Fill in Prompt — coming soon" control
    var fillBtn = el('button', {
      text: 'Fill in Prompt — coming soon',
      className: 'btn btn--ghost',
      attrs: { type: 'button', disabled: 'disabled', 'aria-disabled': 'true', title: 'This feature is coming soon' }
    });
    actions.appendChild(fillBtn);

    var closeBtn = el('button', { text: 'Close', className: 'btn btn--ghost', attrs: { type: 'button' } });
    closeBtn.addEventListener('click', function () { closeDetail(); });
    actions.appendChild(closeBtn);

    detailEl.appendChild(actions);

    var pre = el('pre', { text: p.text, className: 'prompt-text', attrs: { tabindex: '0', 'aria-label': 'Full prompt text' } });
    detailEl.appendChild(pre);

    try { history.replaceState(null, '', '#' + p.id); } catch (e) {}
    detailEl.setAttribute('tabindex', '-1');
    detailEl.focus();
    detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeDetail() {
    detailEl.hidden = true;
    detailEl.textContent = '';
    try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
  }

  function populateFilter() {
    state.categories.forEach(function (c) {
      filterEl.appendChild(el('option', { text: c, attrs: { value: c } }));
    });
  }

  filterEl.addEventListener('change', function () {
    state.filter = filterEl.value;
    renderRail();
    renderGrid();
  });

  window.addEventListener('hashchange', function () {
    var id = (window.location.hash || '').replace('#', '');
    if (id) openDetail(id); else closeDetail();
  });

  window.BF.loadJSON('assets/data/prompts.json').then(function (data) {
    state.prompts = Array.isArray(data.prompts) ? data.prompts : [];
    state.categories = Array.isArray(data.categories) ? data.categories : [];
    state.author = data.author || 'Brady';
    populateFilter();
    renderRail();
    renderGrid();

    var hash = (window.location.hash || '').replace('#', '');
    if (hash) openDetail(hash);
  }).catch(function (err) {
    gridEl.textContent = '';
    gridEl.appendChild(el('p', { text: 'Sorry — the prompt library could not be loaded.', className: 'prompt-empty' }));
    if (window.console) console.error(err);
  });
})();
