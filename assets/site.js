(function () {
  'use strict';

  /* ---- черновики: показываем только по ?todo=1 в адресе ---- */
  if (/[?&]todo\b/.test(window.location.search)) {
    document.documentElement.classList.add('show-todo');
  }

  /* ---- mobile nav ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var mq = window.matchMedia('(max-width: 1000px)'); /* совпадает с брейкпоинтом .nav-toggle в site.css */
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

  /* ---- выпадающий раздел меню ---- */
  /* Один источник правды — aria-expanded на кнопке. На широком экране его
     двигают наведение и клавиатура, на узком только нажатие: там наведения
     нет, а залипший hover оставил бы список открытым навсегда. */
  var groups = document.querySelectorAll('.nav-group');
  if (groups.length) {
    var wide = window.matchMedia('(min-width: 1001px)'); /* зеркало брейкпоинта меню */
    var hoverable = window.matchMedia('(hover: hover)');

    var open = function (btn, v) { btn.setAttribute('aria-expanded', String(v)); };
    var opened = function (btn) { return btn.getAttribute('aria-expanded') === 'true'; };
    var closeAll = function () {
      Array.prototype.forEach.call(groups, function (g) {
        open(g.querySelector('.nav-group-btn'), false);
      });
    };

    Array.prototype.forEach.call(groups, function (group) {
      var gbtn = group.querySelector('.nav-group-btn');

      // Там, где есть настоящее наведение, состоянием уже управляет мышь:
      // если и клик будет переключать, нажатие по открытому списку его закроет,
      // а курсор все еще внутри — и обратно он не откроется. Поэтому клик
      // работает только на тач-экранах и в узком меню.
      gbtn.addEventListener('click', function () {
        var was = opened(gbtn);
        if (!hoverable.matches || !wide.matches) { closeAll(); open(gbtn, !was); }
      });
      // соседний раздел закрываем: два открытых списка перекрыли бы друг друга
      group.addEventListener('mouseenter', function () { if (wide.matches) { closeAll(); open(gbtn, true); } });
      group.addEventListener('mouseleave', function () { if (wide.matches) { open(gbtn, false); } });
      group.addEventListener('focusin', function () { if (wide.matches) { closeAll(); open(gbtn, true); } });
      group.addEventListener('focusout', function (e) {
        if (wide.matches && !group.contains(e.relatedTarget)) { open(gbtn, false); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && opened(gbtn)) { open(gbtn, false); gbtn.focus(); }
      });
    });

    // при смене ширины состояние сбрасываем: правила открытия здесь разные
    wide.addEventListener('change', closeAll);
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

  /* ---- reveal on scroll ---- */
  (function () {
    if (!('IntersectionObserver' in window)) { return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

    var GROUPS = '.grid, .rows, .layers, .principles, .flow, .wants, .reqs, .timeline, .form-grid, .pull-grid';
    var SOLO = '.head, .card, .table-wrap, .qa, .stage, .cta-band .shell';
    var main = document.getElementById('main');
    if (!main) { return; }

    var picked = [];
    main.querySelectorAll(GROUPS).forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child) { picked.push(child); });
    });
    main.querySelectorAll(SOLO).forEach(function (el) { picked.push(el); });

    // герой ведет собственную анимацию входа, ему второй слой ни к чему
    var hero = main.querySelector('.hero');
    picked = picked.filter(function (el) { return !hero || !hero.contains(el); });

    // если предок уже размечен, потомка не трогаем, иначе появление задваивается
    var set = new Set(picked);
    var items = picked.filter(function (el) {
      for (var p = el.parentElement; p && p !== main; p = p.parentElement) {
        if (set.has(p)) { return false; }
      }
      return true;
    });
    if (!items.length) { return; }

    document.documentElement.classList.add('js-reveal');
    items.forEach(function (el) { el.setAttribute('data-reveal', ''); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var el = entry.target;
        var sibs = Array.prototype.filter.call(el.parentElement.children, function (n) {
          return n.hasAttribute && n.hasAttribute('data-reveal');
        });
        var i = sibs.indexOf(el);
        el.style.setProperty('--reveal-delay', Math.min(i < 0 ? 0 : i, 4) * 70 + 'ms');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---- waitlist: no backend yet, so we compose a letter ---- */
  /* Один скрипт обслуживает обе версии сайта, поэтому тексты письма и ошибки
     берем по атрибуту lang у <html>: /en/* объявляет lang="en". */
  var COPY = {
    ru: {
      err: 'Похоже, в адресе опечатка. Проверьте и попробуйте еще раз.',
      subject: 'Лист ожидания — BClear Lab',
      email: 'Почта', level: 'Уровень', goal: 'Зачем произношение:'
    },
    en: {
      err: 'That address looks like a typo. Check it and try again.',
      subject: 'Waitlist — BClear Lab',
      email: 'Email', level: 'Level', goal: 'Why pronunciation matters to me:'
    }
  }[document.documentElement.lang === 'en' ? 'en' : 'ru'];

  var form = document.querySelector('form[data-waitlist]');
  if (form) {
    var email = form.querySelector('input[type="email"]');
    var level = form.querySelector('#level');
    var goal = form.querySelector('#goal');
    var err = form.querySelector('.field-err');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        err.textContent = COPY.err;
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        // короткий сдвиг поля; класс снимаем, иначе вторая ошибка подряд не проиграет
        email.classList.remove('is-invalid');
        void email.offsetWidth;
        email.classList.add('is-invalid');
        return;
      }
      err.textContent = '';
      email.removeAttribute('aria-invalid');

      var lines = [COPY.email + ': ' + value];
      if (level.value) { lines.push(COPY.level + ': ' + level.value); }
      var why = goal.value.trim().slice(0, 900);
      if (why) { lines.push('', COPY.goal, why); }

      window.location.href = 'mailto:info@bclearlab.ru'
        + '?subject=' + encodeURIComponent(COPY.subject)
        + '&body=' + encodeURIComponent(lines.join('\n'));

      form.dataset.sent = 'true';
      var ok = form.querySelector('.form-ok');
      if (ok) { ok.setAttribute('tabindex', '-1'); ok.focus(); }
    });

    email.addEventListener('input', function () {
      err.textContent = '';
      email.removeAttribute('aria-invalid');
      email.classList.remove('is-invalid');
    });
  }
})();
