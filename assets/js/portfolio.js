/* Portfolio page: list + filter + detail panel with safe content viewers.
   All text is inserted with textContent / DOM creation (no innerHTML).
   External URLs are validated against an allowlist before use. */
(function () {
  'use strict';
  var el = window.BF.el;

  var state = { projects: [], filter: 'all', selectedId: null };

  var listEl = document.getElementById('project-list');
  var detailEl = document.getElementById('detail');
  var filterEl = document.getElementById('cat-filter');

  function svgChevron() {
    var span = document.createElement('span');
    span.className = 'chev';
    span.setAttribute('aria-hidden', 'true');
    var svgns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    var p = document.createElementNS(svgns, 'path');
    p.setAttribute('d', 'M9 6l6 6-6 6');
    svg.appendChild(p); span.appendChild(svg);
    return span;
  }

  function visibleProjects() {
    return state.projects.filter(function (p) {
      return state.filter === 'all' || p.category === state.filter;
    });
  }

  function renderList() {
    listEl.textContent = '';
    var items = visibleProjects();
    if (!items.length) {
      var li = el('li', { className: 'rail__item' });
      li.appendChild(el('p', { text: 'No projects in this category.', className: 'prompt-empty' }));
      listEl.appendChild(li);
      return;
    }
    items.forEach(function (p) {
      var li = el('li', { className: 'rail__item', attrs: { role: 'listitem' } });
      var btn = el('button', {
        className: 'rail__btn',
        attrs: { type: 'button', 'data-id': p.id, 'aria-current': p.id === state.selectedId ? 'true' : 'false' }
      });
      var left = el('span', { text: p.railTitle || p.title });
      var cat = el('span', { text: p.category, className: 'rail__cat' });
      btn.appendChild(left);
      btn.appendChild(cat);
      btn.appendChild(svgChevron());
      btn.addEventListener('click', function () { select(p.id, true); });
      li.appendChild(btn);
      listEl.appendChild(li);
    });
  }

  function select(id, focusDetail) {
    state.selectedId = id;
    // Keep selected item current on rail
    var buttons = listEl.querySelectorAll('.rail__btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-current', buttons[i].getAttribute('data-id') === id ? 'true' : 'false');
    }
    var proj = state.projects.filter(function (p) { return p.id === id; })[0];
    if (proj) renderDetail(proj);
    // reflect selection in the URL hash (no reload)
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    if (focusDetail && detailEl) { detailEl.setAttribute('tabindex', '-1'); detailEl.focus({ preventScroll: false }); }
  }

  /* ---- Content viewers ---- */
  function buildImageViewer(proj) {
    var wrap = el('div', { className: 'viewer' });
    var box = el('div', { className: 'viewer__image' });
    var img = el('img', { attrs: { src: proj.image, alt: proj.imageAlt || (proj.title + ' preview') } });
    box.appendChild(img);
    wrap.appendChild(box);
    if (proj.imageCaption) {
      wrap.appendChild(el('p', { text: proj.imageCaption, className: 'doc-caption' }));
    }
    return wrap;
  }

  function buildPdfViewer(proj) {
    var wrap = el('div', { className: 'viewer' });
    // Only embed local, same-origin PDFs.
    var frame = el('iframe', {
      attrs: {
        src: proj.pdf + '#view=FitH',
        title: proj.title + ' — scrollable PDF document',
        loading: 'lazy'
      }
    });
    frame.className = 'viewer__frame';
    wrap.appendChild(frame);
    var cap = el('p', { className: 'doc-caption' });
    cap.appendChild(el('span', { text: 'Scrollable PDF. ' }));
    var link = el('a', { text: 'Open the PDF in a new tab', attrs: { href: proj.pdf, target: '_blank', rel: 'noopener' } });
    cap.appendChild(link);
    wrap.appendChild(cap);
    return wrap;
  }

  function buildDocViewer(proj) {
    var wrap = el('div', { className: 'viewer' });
    var box = el('div', { className: 'doc-scroll', attrs: { tabindex: '0', role: 'document', 'aria-label': proj.title + ' — non-editable document summary' } });
    (proj.docSummary || []).forEach(function (para) {
      box.appendChild(el('p', { text: para }));
    });
    wrap.appendChild(box);
    wrap.appendChild(el('p', { text: 'Non-editable summary of the source document.', className: 'doc-caption' }));
    return wrap;
  }

  function safeLinkButton(link, label, cls) {
    // Returns an anchor if URL is safe, otherwise a demo-trigger button.
    if (link && link.url && window.BF.isSafeUrl(link.url)) {
      var a = el('a', { text: label, className: cls, attrs: { href: link.url, target: '_blank', rel: 'noopener noreferrer' } });
      return a;
    }
    // No verified URL -> demo modal
    var btn = el('button', { text: label, className: cls, attrs: { type: 'button' } });
    btn.addEventListener('click', function () { window.BF.openModal('demo-modal'); });
    return btn;
  }

  function buildCodeDemoToolbar(proj, onSelect) {
    // Code | Demo toggle above the top-right of the viewer.
    var toolbar = el('div', { className: 'detail__toolbar' });
    var codeLink = (proj.links || []).filter(function (l) { return l.type === 'code'; })[0];
    var demoLink = (proj.links || []).filter(function (l) { return l.type === 'demo'; })[0];

    var group = el('div', { className: 'toggle-group', attrs: { role: 'tablist', 'aria-label': 'View code or demo' } });

    var codeBtn = el('button', { text: 'Code', attrs: { type: 'button', role: 'tab', 'aria-selected': 'true' } });
    var demoBtn = el('button', { text: 'Demo', attrs: { type: 'button', role: 'tab', 'aria-selected': 'false' } });

    codeBtn.addEventListener('click', function () {
      codeBtn.setAttribute('aria-selected', 'true');
      demoBtn.setAttribute('aria-selected', 'false');
      if (codeLink && window.BF.isSafeUrl(codeLink.url)) {
        window.open(codeLink.url, '_blank', 'noopener');
      } else {
        window.BF.openModal('demo-modal');
      }
    });
    demoBtn.addEventListener('click', function () {
      demoBtn.setAttribute('aria-selected', 'true');
      codeBtn.setAttribute('aria-selected', 'false');
      // Demo requires backend/database -> always the demo modal here.
      window.BF.openModal('demo-modal');
    });

    group.appendChild(codeBtn);
    group.appendChild(demoBtn);
    toolbar.appendChild(group);
    return toolbar;
  }

  function renderDetail(proj) {
    detailEl.textContent = '';

    detailEl.appendChild(el('p', { text: proj.category, className: 'detail__eyebrow' }));
    detailEl.appendChild(el('h2', { text: proj.title, className: 'detail__title' }));
    if (proj.tagline) detailEl.appendChild(el('p', { text: proj.tagline, className: 'detail__tagline' }));
    if (proj.context) detailEl.appendChild(el('p', { text: proj.context, className: 'detail__context' }));

    // Toolbar (Code | Demo) only for projects with both a code and demo link.
    var hasCode = (proj.links || []).some(function (l) { return l.type === 'code'; });
    var hasDemo = (proj.links || []).some(function (l) { return l.type === 'demo'; });
    if (proj.viewer === 'codeDemo' && hasCode && hasDemo) {
      detailEl.appendChild(buildCodeDemoToolbar(proj));
    }

    // Content viewer
    var viewer;
    if (proj.viewer === 'pdf' && proj.pdf) viewer = buildPdfViewer(proj);
    else if (proj.viewer === 'doc') viewer = buildDocViewer(proj);
    else if (proj.viewer === 'image' && proj.image) viewer = buildImageViewer(proj);
    else if (proj.viewer === 'codeDemo') viewer = buildCodeDemoPlaceholder(proj);
    if (viewer) detailEl.appendChild(viewer);

    // Description
    if (proj.description) {
      detailEl.appendChild(el('h3', { text: 'About this project' }));
      detailEl.appendChild(el('p', { text: proj.description, className: 'detail__desc' }));
    }

    // Highlights
    if (proj.highlights && proj.highlights.length) {
      detailEl.appendChild(el('h3', { text: 'Highlights' }));
      var ul = el('ul', { className: 'highlights' });
      proj.highlights.forEach(function (h) { ul.appendChild(el('li', { text: h })); });
      detailEl.appendChild(ul);
    }

    // Tech tags
    if (proj.tech && proj.tech.length) {
      detailEl.appendChild(el('h3', { text: 'Built with' }));
      var tl = el('ul', { className: 'taglist' });
      proj.tech.forEach(function (t) { tl.appendChild(el('li', { text: t, className: 'tag' })); });
      detailEl.appendChild(tl);
    }

    // Standalone links (code, live, etc.) shown as buttons
    var linkRow = el('div', { className: 'prompt-detail__actions' });
    (proj.links || []).forEach(function (link) {
      if (link.type === 'code') {
        linkRow.appendChild(safeLinkButton(link, 'View code on GitHub', 'btn btn--primary'));
      } else if (link.type === 'demo') {
        // Demo action always gated
        var b = el('button', { text: 'Open live demo', className: 'btn btn--ghost', attrs: { type: 'button' } });
        b.addEventListener('click', function () { window.BF.openModal('demo-modal'); });
        linkRow.appendChild(b);
      } else {
        linkRow.appendChild(safeLinkButton(link, link.label || 'Open link', 'btn btn--ghost'));
      }
    });
    if (linkRow.childNodes.length) detailEl.appendChild(linkRow);

    if (proj.demoNote) {
      detailEl.appendChild(el('p', { text: proj.demoNote, className: 'doc-caption doc-caption--flush' }));
    }
  }

  function buildCodeDemoPlaceholder(proj) {
    // For code/demo projects, show a summary card of the app rather than an
    // embedded live app (which requires a backend/database).
    var wrap = el('div', { className: 'viewer' });
    var box = el('div', { className: 'doc-scroll', attrs: { tabindex: '0', role: 'document', 'aria-label': proj.title + ' overview' } });
    box.appendChild(el('p', { text: 'This is a running full-stack application. Because its live features depend on a database and server, the interactive demo is disabled on this static portfolio.' }));
    box.appendChild(el('p', { text: 'Use the “Code” button to view the full source on GitHub. The “Demo” button demonstrates the demo-unavailable behavior described in the project brief.' }));
    wrap.appendChild(box);
    return wrap;
  }

  /* ---- Init ---- */
  filterEl.addEventListener('change', function () {
    state.filter = filterEl.value;
    renderList();
    // If the selected project is no longer visible, select the first visible one.
    var visible = visibleProjects();
    if (!visible.some(function (p) { return p.id === state.selectedId; })) {
      if (visible.length) select(visible[0].id, false);
    }
  });

  window.BF.loadJSON('assets/data/projects.json').then(function (data) {
    state.projects = Array.isArray(data.projects) ? data.projects : [];
    renderList();
    // Deep-link support via hash
    var hash = (window.location.hash || '').replace('#', '');
    var initial = state.projects.filter(function (p) { return p.id === hash; })[0];
    if (initial) { state.filter = 'all'; select(initial.id, false); }
    else if (state.projects.length) { select(state.projects[0].id, false); }
  }).catch(function (err) {
    detailEl.textContent = '';
    detailEl.appendChild(el('p', { text: 'Sorry — the project list could not be loaded.', className: 'prompt-empty' }));
    if (window.console) console.error(err);
  });
})();
