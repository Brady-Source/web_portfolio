/* Contact form: client-side validation + progressive-enhancement submit to a
   static form service (Formspree). No secrets, no backend, no persistence.
   Feedback is announced through a live region. */
(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;
  var statusEl = document.getElementById('form-status');

  var fields = {
    name: { min: 2, msg: 'Please enter your name.' },
    subject: { min: 2, msg: 'Please enter a subject.' },
    email: { email: true, msg: 'Please enter a valid email address.' },
    message: { min: 10, msg: 'Please enter a message of at least 10 characters.' }
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(id, message) {
    var input = document.getElementById(id);
    var err = document.getElementById(id + '-error');
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) err.textContent = message || '';
    return !message;
  }

  function validateField(id) {
    var cfg = fields[id];
    var input = document.getElementById(id);
    if (!cfg || !input) return true;
    var val = (input.value || '').trim();
    if (!val) return setError(id, cfg.msg);
    if (cfg.email && !EMAIL_RE.test(val)) return setError(id, cfg.msg);
    if (cfg.min && val.length < cfg.min) return setError(id, cfg.msg);
    return setError(id, '');
  }

  function validateAll() {
    var ok = true;
    var firstBad = null;
    Object.keys(fields).forEach(function (id) {
      var good = validateField(id);
      if (!good && !firstBad) firstBad = id;
      ok = ok && good;
    });
    return { ok: ok, firstBad: firstBad };
  }

  // Validate on blur for immediate feedback.
  Object.keys(fields).forEach(function (id) {
    var input = document.getElementById(id);
    if (input) {
      input.addEventListener('blur', function () { validateField(id); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateField(id);
      });
    }
  });

  function showStatus(message, kind) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.className = 'form-status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
  }

  function endpointConfigured() {
    var action = form.getAttribute('action') || '';
    return action.indexOf('your-form-id') === -1 && /^https:\/\/formspree\.io\/f\/.+/.test(action);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var result = validateAll();
    if (!result.ok) {
      showStatus('Please fix the highlighted fields and try again.', 'err');
      var bad = document.getElementById(result.firstBad);
      if (bad) bad.focus();
      return;
    }

    // If the Formspree endpoint has not been configured yet, do not attempt a
    // network call (it would 404). Explain clearly instead.
    if (!endpointConfigured()) {
      showStatus('Thanks — your message is valid. This form is not yet connected to a delivery service; see the README to add a Formspree endpoint.', 'ok');
      window.BF.announce('Form validated. Delivery endpoint not configured.');
      form.reset();
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
    showStatus('Sending your message…', 'ok');

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        showStatus('Thanks — your message has been sent. I will get back to you soon.', 'ok');
        window.BF.announce('Message sent successfully.');
      } else {
        return res.json().then(function () {
          throw new Error('submit failed');
        });
      }
    }).catch(function () {
      showStatus('Something went wrong sending your message. Please try again later or reach out on LinkedIn.', 'err');
      window.BF.announce('Message failed to send.');
    }).finally(function () {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit'; }
    });
  });
})();
