/* TotalBistand – felles skript. Ingen avhengigheter. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {

    /* --- E-post settes via JS så den ikke plukkes opp av skrapeboter --- */
    var mail = ['mgo', 'totalbistand.no'].join('@');
    document.querySelectorAll('[data-mail]').forEach(function (el) {
      el.href = 'mailto:' + mail + (el.dataset.mail ? '?subject=' + encodeURIComponent(el.dataset.mail) : '');
      if (el.dataset.mailText !== undefined) el.textContent = mail;
    });

    /* --- Sticky nav: komprimeres ved scroll --- */
    var nav = document.querySelector('nav.site');
    var progress = document.getElementById('progress');
    var totop = document.querySelector('.totop');
    var actionbar = document.querySelector('.actionbar');
    var ticking = false;

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (nav) nav.classList.toggle('scrolled', y > 20);
      if (totop) totop.classList.toggle('show', y > 700);
      if (actionbar) actionbar.classList.toggle('show', y > 260);
      if (progress) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    if (totop) {
      totop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }

    /* --- Mobilmeny --- */
    var burger = document.querySelector('.burger');
    var mobmenu = document.querySelector('.mobilemenu');

    function closeMenu() {
      if (!burger) return;
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      mobmenu.classList.remove('open');
      document.body.style.overflow = '';
    }
    if (burger && mobmenu) {
      burger.addEventListener('click', function () {
        var open = !mobmenu.classList.contains('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        mobmenu.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });
      mobmenu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeMenu);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
      });
    }

    /* --- Undermeny: hover på PC, klikk på touch --- */
    var drop = document.querySelector('.nav-drop');
    if (drop) {
      var link = drop.querySelector('a');
      var lukkeTimer;
      drop.addEventListener('mouseenter', function () {
        clearTimeout(lukkeTimer);
        drop.classList.add('open');
      });
      drop.addEventListener('mouseleave', function () {
        // Kort pause slik at menyen tåler at musa tar en snarvei ut og inn igjen
        lukkeTimer = setTimeout(function () { drop.classList.remove('open'); }, 250);
      });
      drop.addEventListener('focusin', function () { clearTimeout(lukkeTimer); drop.classList.add('open'); });
      drop.addEventListener('focusout', function (e) {
        if (!drop.contains(e.relatedTarget)) drop.classList.remove('open');
      });
      // På touch: første trykk åpner menyen i stedet for å navigere
      link.addEventListener('click', function (e) {
        if (window.matchMedia('(hover: none)').matches && !drop.classList.contains('open')) {
          e.preventDefault();
          drop.classList.add('open');
        }
      });
    }

    var mobToggle = document.querySelector('.mob-toggle');
    if (mobToggle) {
      mobToggle.addEventListener('click', function () {
        var sub = document.querySelector('.mobilemenu .sub');
        mobToggle.classList.toggle('open');
        sub.classList.toggle('open');
        mobToggle.setAttribute('aria-expanded', String(sub.classList.contains('open')));
      });
    }

    /* --- Reveal ved scroll --- */
    var revealEls = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('vis'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('vis'); io.unobserve(en.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      revealEls.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('vis');
        else io.observe(el);
      });
    }

    /* --- Prosesstripa: trinnene kommer etter tur naar den rulles inn --- */
    document.querySelectorAll('.flow-steps').forEach(function (flow) {
      if (reduce || !('IntersectionObserver' in window)) {
        flow.classList.add('on');
        return;
      }
      var r = flow.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        flow.classList.add('on');
        return;
      }
      var flowObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { flow.classList.add('on'); flowObs.disconnect(); }
        });
      }, { threshold: 0.25 });
      flowObs.observe(flow);
    });

    /* --- Scrollspy: marker aktiv seksjon i menyen (kun forsiden) --- */
    var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (spyLinks.length && 'IntersectionObserver' in window) {
      var targets = spyLinks
        .map(function (a) { return document.querySelector(a.getAttribute('href')); })
        .filter(Boolean);
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          spyLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      targets.forEach(function (t) { spy.observe(t); });
    }

    /* --- Forhåndsutfyll emne fra ?emne= og rull til skjemaet --- */
    var emne = new URLSearchParams(window.location.search).get('emne');
    if (emne) {
      var sel = document.getElementById('emne');
      if (sel) {
        var match = Array.prototype.slice.call(sel.options).some(function (o) {
          if (o.value.toLowerCase() === emne.toLowerCase()) { sel.value = o.value; return true; }
          return false;
        });
        if (!match && sel.tagName === 'INPUT') sel.value = emne;
      }
      var k = document.getElementById('kontakt');
      if (k) setTimeout(function () { k.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }, 250);
    }

    /* --- Kontaktskjema: validering, honeypot og innsending --- */
    var form = document.getElementById('kontaktskjema');
    if (form) {
      var ok = document.getElementById('skjema-ok');

      function setErr(field, on) { field.closest('.field').classList.toggle('invalid', on); }

      form.querySelectorAll('input, textarea').forEach(function (f) {
        f.addEventListener('blur', function () {
          if (f.required) setErr(f, !f.checkValidity());
        });
        f.addEventListener('input', function () {
          if (f.closest('.field').classList.contains('invalid') && f.checkValidity()) setErr(f, false);
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot – fylles bare ut av boter
        if (form.querySelector('.hp input').value) return;

        var bad = false;
        form.querySelectorAll('[required]').forEach(function (f) {
          if (!f.checkValidity()) { setErr(f, true); bad = true; }
        });
        if (bad) {
          form.querySelector('.field.invalid input, .field.invalid textarea').focus();
          return;
        }

        var btn = form.querySelector('button[type="submit"]');
        var label = btn.textContent;
        btn.textContent = 'Sender …';
        btn.disabled = true;

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        }).then(function (res) {
          if (!res.ok) throw new Error('feil');
          form.style.display = 'none';
          if (ok) { ok.style.display = 'block'; ok.focus(); }
        }).catch(function () {
          btn.textContent = label;
          btn.disabled = false;
          alert('Noe gikk galt. Ring 994 75 001 eller send e-post til mgo' + '@' + 'totalbistand.no');
        });
      });
    }
  });
})();
