(function () {
  'use strict';

  /* ---- mobile nav ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var mq = window.matchMedia('(max-width: 1060px)'); /* совпадает с брейкпоинтом .nav-toggle в site.css */
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
    var wide = window.matchMedia('(min-width: 1061px)'); /* зеркало брейкпоинта меню */
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
      email: 'Почта', level: 'Уровень', goal: 'Зачем произношение:',
      consentErr: 'Отметьте согласие на обработку данных — тогда мы сможем вам написать.',
      consent: 'Согласие на обработку персональных данных дано: bclearlab.ru/consent'
    },
    en: {
      err: 'That address looks like a typo. Check it and try again.',
      subject: 'Waitlist — BClear Lab',
      email: 'Email', level: 'Level', goal: 'Why pronunciation matters to me:',
      consentErr: 'Tick the consent box so that we can write back to you.',
      consent: 'Consent to personal data processing given: bclearlab.ru/consent'
    }
  }[document.documentElement.lang === 'en' ? 'en' : 'ru'];

  var form = document.querySelector('form[data-waitlist]');
  if (form) {
    var email = form.querySelector('input[type="email"]');
    var level = form.querySelector('#level');
    var goal = form.querySelector('#goal');
    var err = form.querySelector('#email-err');
    var consent = form.querySelector('#consent');
    var consentErr = form.querySelector('#consent-err');

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

      if (consent && !consent.checked) {
        consentErr.textContent = COPY.consentErr;
        consent.setAttribute('aria-invalid', 'true');
        consent.focus();
        return;
      }

      var lines = [COPY.email + ': ' + value];
      if (level.value) { lines.push(COPY.level + ': ' + level.value); }
      var why = goal.value.trim().slice(0, 900);
      if (why) { lines.push('', COPY.goal, why); }
      // строка о согласии остается в письме: это и есть след того, что галочка стояла
      if (consent) { lines.push('', COPY.consent); }

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

    if (consent) {
      consent.addEventListener('change', function () {
        consentErr.textContent = '';
        consent.removeAttribute('aria-invalid');
      });
    }
  }
  /* ---- copy email in footer ---- */
  /* запасной путь: браузер без Clipboard API или отказавший в доступе */
  var copyLegacy = function (text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  };
  var copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return copyLegacy(text); });
    }
    return copyLegacy(text);
  };
  var isEn = (document.documentElement.lang || '').indexOf('en') === 0;
  document.querySelectorAll('.copy-btn[data-copy]').forEach(function (btn) {
    var note = btn.parentNode.querySelector('.copy-note');
    var timer;
    btn.addEventListener('click', function () {
      copyText(btn.getAttribute('data-copy')).then(function () {
        btn.classList.add('is-copied');
        if (note) note.textContent = isEn ? 'Copied' : 'Скопировано';
      }, function () {
        if (note) note.textContent = isEn ? 'Copy failed' : 'Не получилось скопировать';
      });
      clearTimeout(timer);
      timer = setTimeout(function () {
        btn.classList.remove('is-copied');
        if (note) note.textContent = '';
      }, 1800);
    });
  });

  /* ---- уведомление о cookie ---- */
  /* Метрика ставит cookie с первого захода, плашка сообщает об этом и ведет в
     политику. Согласием считается продолжение работы с сайтом (п. 4 политики),
     поэтому кнопка одна. Нажатие запоминаем в localStorage; если хранилище
     недоступно, плашка просто покажется на следующей странице снова. */
  (function () {
    var KEY = 'bcl-cookie-ok';
    try { if (localStorage.getItem(KEY)) { return; } } catch (e) {}
    var bar = document.createElement('div');
    bar.className = 'cookie';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', isEn ? 'Cookie notice' : 'Уведомление о cookie');
    bar.innerHTML = isEn
      ? '<p>We use cookies to improve the site. Details are in our <a href="/privacy/" lang="ru">privacy policy (in Russian)</a>.</p>'
        + '<button class="btn btn-primary" type="button">Got it</button>'
      : '<p>Мы используем cookie, чтобы улучшать сайт. Подробнее — в <a href="/privacy/">политике конфиденциальности</a>.</p>'
        + '<button class="btn btn-primary" type="button">Понятно</button>';
    document.body.appendChild(bar);
    bar.querySelector('button').addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      bar.remove();
    });
  })();
})();
