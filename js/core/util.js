/* Core helpers shared by every file. Everything lives on window.App. */
window.App = window.App || {};
(function (A) {
  'use strict';
  A.views = {};
  A.actions = {};
  const U = A.util = {};
  const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

  U.esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => MAP[c]);
  U.id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.sum = arr => arr.reduce((s, x) => s + x, 0);
  U.avg = arr => (arr.length ? U.sum(arr) / arr.length : 0);

  U.MIN = 60000;
  U.HOUR = 3600000;
  U.DAY = 86400000;

  U.dayStart = t => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  U.dayKey = t => {
    const d = new Date(t == null ? Date.now() : t);
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  };
  U.addDays = (t, n) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime(); };

  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  U.date = t => { const d = new Date(t); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  U.weekday = t => DAYS[new Date(t).getDay()];
  U.time = t => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  U.dateTime = t => U.date(t) + '، ' + U.time(t);

  /* Value for a datetime input in local time. */
  U.localInput = t => {
    const d = new Date(t);
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  };

  /* Arabic counted nouns: يوم واحد، يومان، 3 أيام، 11 يومًا. */
  U.count = (n, one, two, few, many) => {
    if (n === 1) return one;
    if (n === 2) return two;
    if (n >= 3 && n <= 10) return n + ' ' + few;
    return n + ' ' + many;
  };
  U.days = n => U.count(n, 'يوم واحد', 'يومان', 'أيام', 'يومًا');
  U.hours = n => U.count(n, 'ساعة واحدة', 'ساعتان', 'ساعات', 'ساعة');
  U.mins = n => U.count(n, 'دقيقة واحدة', 'دقيقتان', 'دقائق', 'دقيقة');

  U.dur = ms => {
    ms = Math.max(0, ms);
    const d = Math.floor(ms / U.DAY);
    const h = Math.floor((ms % U.DAY) / U.HOUR);
    const m = Math.floor((ms % U.HOUR) / U.MIN);
    if (d) return U.days(d) + (h ? ' و' + U.hours(h) : '');
    if (h) return U.hours(h) + (m ? ' و' + U.mins(m) : '');
    return m ? U.mins(m) : 'أقل من دقيقة';
  };
  U.ago = t => {
    const ms = Date.now() - t;
    return ms < U.MIN ? 'الآن' : 'قبل ' + U.dur(ms);
  };

  U.num = (n, dec) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: dec == null ? 0 : dec, minimumFractionDigits: dec || 0 });
  U.money = n => {
    const c = A.store ? A.store.state.profile.currency : '€';
    const v = U.num(n, Math.abs(n) >= 100 ? 0 : 2);
    return /^[A-Za-z€$£]/.test(c) ? c + ' ' + v : v + ' ' + c;
  };

  U.toast = msg => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = msg;
    el.className = 'show';
    clearTimeout(U.toastT);
    U.toastT = setTimeout(() => { el.className = ''; }, 3200);
  };

  /* Reusable pieces of markup. */
  U.chips = (list, selected, act, multi) => '<div class="chips">' + list.map(x =>
    '<button type="button" class="chip' + ((multi ? (selected || []).indexOf(x[0]) >= 0 : selected === x[0]) ? ' on' : '') + '" act="' + act + '" val="' + U.esc(x[0]) + '">' +
    (x[2] ? '<span aria-hidden="true">' + x[2] + '</span> ' : '') + U.esc(x[1]) + '</button>').join('') + '</div>';

  U.scale = (act, cur, low, high) => '<div class="scale">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n =>
    '<button type="button" class="sc' + (cur === n ? ' on' : '') + '" style="--lvl:' + n + '" act="' + act + '" val="' + n + '">' + n + '</button>').join('') +
    '</div><div class="scaleEnds"><span>' + (low || 'خفيفة') + '</span><span>' + (high || 'قوية جدًا') + '</span></div>';

  U.bar = (p, cls) => '<div class="bar ' + (cls || '') + '"><i style="width:' + U.clamp(p, 0, 100) + '%"></i></div>';

  /* Toggle a value inside an array. */
  U.toggle = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); return arr; };
})(window.App);
