/* Shared site behavior: theme toggle, mobile nav, modal, helpers.
   No third-party scripts. All dynamic text uses textContent / DOM creation. */
(function () {
  'use strict';

  /* ---------- Safe localStorage (handles denial / private mode) ---------- */
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    return root.getAttribute('data-theme') ||
      (prefersDark.matches ? 'dark' : 'light');
  }

  function sunIcon() {
    return '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"></path></svg>';
  }
  function moonIcon() {
    return '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path></svg>';
  }

  function applyTheme(mode) {
    root.setAttribute('data-theme', mode);
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].innerHTML = mode === 'dark' ? sunIcon() : moonIcon();
      btns[i].setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btns[i].setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
    }
  }

  // Initialize theme: stored preference wins, else system.
  var saved = store.get('bf-theme');
  applyTheme(saved === 'light' || saved === 'dark' ? saved : (prefersDark.matches ? 'dark' : 'light'));

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (!toggle) return;
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('bf-theme', next);
  });

  // If no stored preference, follow system changes live.
  if (prefersDark.addEventListener) {
    prefersDark.addEventListener('change', function (ev) {
      if (!store.get('bf-theme')) applyTheme(ev.matches ? 'dark' : 'light');
    });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('primary-nav');
  if (navToggle && nav) {
    function setNav(open) {
      nav.hidden = !open;
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    // Only collapse on small screens.
    var mq = window.matchMedia('(max-width: 860px)');
    function syncNav() { if (mq.matches) { setNav(false); } else { nav.hidden = false; navToggle.setAttribute('aria-expanded', 'false'); } }
    syncNav();
    if (mq.addEventListener) mq.addEventListener('change', syncNav);
    navToggle.addEventListener('click', function () {
      setNav(nav.hidden);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mq.matches && !nav.hidden) { setNav(false); navToggle.focus(); }
    });
  }

  /* ---------- Toast / live region ---------- */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  window.BF = window.BF || {};
  window.BF.announce = function (msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2200);
  };

  /* ---------- Accessible modal ---------- */
  var lastFocused = null;

  function focusable(container) {
    return Array.prototype.slice.call(container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    ));
  }

  window.BF.openModal = function (id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    var f = focusable(modal);
    if (f.length) f[0].focus();

    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var items = focusable(modal);
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function onClick(e) {
      if (e.target === modal || (e.target.closest && e.target.closest('[data-modal-close]'))) close();
    }
    function close() {
      modal.hidden = true;
      document.removeEventListener('keydown', onKey, true);
      modal.removeEventListener('click', onClick);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }
    modal._close = close;
    document.addEventListener('keydown', onKey, true);
    modal.addEventListener('click', onClick);
  };

  window.BF.closeModal = function (id) {
    var modal = document.getElementById(id);
    if (modal && modal._close) modal._close();
  };

  /* ---------- Helpers shared by page scripts ---------- */
  // Allowlist external URLs to a small set of trusted hosts.
  window.BF.ALLOWED_HOSTS = ['github.com', 'www.github.com', 'linkedin.com', 'www.linkedin.com'];
  window.BF.isSafeUrl = function (url) {
    if (typeof url !== 'string' || !url) return false;
    try {
      var u = new URL(url, window.location.href);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
      return window.BF.ALLOWED_HOSTS.indexOf(u.hostname) !== -1;
    } catch (e) { return false; }
  };

  // Fetch JSON with basic error handling.
  window.BF.loadJSON = function (path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + path + ' (' + r.status + ')');
      return r.json();
    });
  };

  // Set footer year on every page (replaces the inline script blocked by CSP).
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Create an element with textContent + optional attributes.
  window.BF.el = function (tag, opts) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.text != null) node.textContent = opts.text;
    if (opts.className) node.className = opts.className;
    if (opts.attrs) { for (var k in opts.attrs) { if (opts.attrs.hasOwnProperty(k)) node.setAttribute(k, opts.attrs[k]); } }
    return node;
  };
})();
