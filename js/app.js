/* Shell, router and click handling. Load this file last. */
(function (A) {
  'use strict';
  const U = A.util;

  A.NAV = [
    ['home', '🏠', 'الرئيسية'], ['craving', '🌊', 'الرغبة'], ['progress', '📈', 'التقدم'],
    ['journal', '📓', 'اليوميات'], ['learn', '📚', 'التعلم'], ['settings', '⚙️', 'الإعدادات']
  ];

  /* Timers started by a page are stopped when the page changes. */
  let cleanups = [];
  A.onLeave = fn => cleanups.push(fn);
  A.every = (fn, ms) => { const id = setInterval(fn, ms); A.onLeave(() => clearInterval(id)); return id; };

  A.renderShell = () => {
    document.getElementById('bottom').innerHTML = A.NAV.map(n =>
      '<a href="#/' + n[0] + '" id="nav' + n[0] + '"><span aria-hidden="true">' + n[1] + '</span>' + n[2] + '</a>').join('');
  };

  function route() {
    cleanups.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
    cleanups = [];
    const st = A.store.state;
    let parts = (location.hash || '#/home').replace(/^#\/?/, '').split('/');
    if (!st.setup && parts[0] !== 'setup') parts = ['setup'];
    const name = A.views[parts[0]] ? parts[0] : 'home';
    const main = document.getElementById('main');
    main.innerHTML = '';
    document.body.classList.toggle('noNav', name === 'setup');
    A.views[name](main, parts[1], parts[2]);
    document.querySelectorAll('#bottom a').forEach(a => a.classList.remove('on'));
    const n = document.getElementById('nav' + (name === 'smoked' ? 'craving' : name === 'tools' ? 'learn' : name === 'habits' ? 'settings' : name));
    if (n) n.classList.add('on');
    const demo = document.getElementById('demoBar');
    demo.innerHTML = st.demo ? '🧪 وضع التجربة: البيانات ليست حقيقية. <a href="#/settings/demo">إدارة</a>' : '';
    demo.classList.toggle('hidden', !st.demo);
    window.scrollTo(0, 0);
  }
  A.route = route;
  A.go = h => { if (location.hash === h) route(); else location.hash = h; };

  A.actions.go = (el, v) => A.go(v);
  A.actions.noop = () => {};

  document.addEventListener('click', e => {
    const el = e.target.closest('[act]');
    if (!el) return;
    const fn = A.actions[el.getAttribute('act')];
    if (!fn) return;
    if (el.tagName === 'A' && !/^(tel|sms):/.test(el.getAttribute('href') || '')) e.preventDefault();
    fn(el, el.getAttribute('val'), e);
  });
  window.addEventListener('hashchange', route);

  A.start = () => {
    A.store.load();
    A.renderShell();
    route();
    A.store.checkAch();
    if (A.store.noStorage) U.toast('تعذّر الحفظ على هذا الجهاز. تأكد أن المتصفح يسمح بالتخزين المحلي.');
    window.addEventListener('beforeunload', A.store.saveNow);
    document.addEventListener('visibilitychange', () => { if (document.hidden) A.store.saveNow(); });
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', A.start);
  else A.start();
})(window.App);
