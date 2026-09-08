(function () {
  'use strict';

  /* ---- mobile nav ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var mq = window.matchMedia('(max-width: 900px)');
    var sync = function () {
      if (mq.matches) {
        nav.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        nav.hidden = false;
      }
    };
    sync();
    mq.addEventListener('change', sync);
    toggle.addEventListener('click', function () {
      var open = nav.hidden;
      nav.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mq.matches && !nav.hidden) {
        nav.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---- header hairline once scrolled ---- */
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () {
      head.dataset.stuck = String(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- hero readout: the one authored moment ---- */
  var panel = document.querySelector('.hero-panel');
  if (panel) {
    var bars = panel.querySelectorAll('.readout-bar i');
    var apply = function () {
      Array.prototype.forEach.call(bars, function (bar) {
        bar.style.transform = 'scaleX(' + bar.dataset.value / 100 + ')';
      });
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); }
    else { window.setTimeout(apply, 700); }
  }

  /* ---- waitlist form: no endpoint wired yet ---- */
  var form = document.querySelector('form[data-waitlist]');
  if (form) {
    var email = form.querySelector('input[type="email"]');
    var err = form.querySelector('.field-err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = email.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      if (!valid) {
        err.textContent = 'Похоже, в адресе опечатка. Проверь и попробуй ещё раз.';
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        return;
      }
      err.textContent = '';
      email.removeAttribute('aria-invalid');
      form.dataset.sent = 'true';
      var ok = form.querySelector('.form-ok');
      if (ok) {
        ok.setAttribute('tabindex', '-1');
        ok.focus();
      }
    });
    email.addEventListener('input', function () {
      err.textContent = '';
      email.removeAttribute('aria-invalid');
    });
  }
})();
