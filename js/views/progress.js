/* Progress charts, trigger analysis, milestones and health timeline. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const Ch = () => A.charts;
  const S = () => A.store;
  const RANGES = [['7', '7 أيام'], ['30', '30 يومًا'], ['90', '90 يومًا'], ['all', 'الكل']];
  const BUCKETS = [[5, 9, 'الصباح الباكر (5 إلى 9)'], [9, 12, 'الصباح (9 إلى 12)'], [12, 15, 'الظهر (12 إلى 15)'], [15, 18, 'العصر (15 إلى 18)'], [18, 22, 'المساء (18 إلى 22)'], [22, 29, 'الليل (22 إلى 5)']];

  function countBy(list, key, labels) {
    const m = {};
    list.forEach(x => { if (x[key]) m[x[key]] = (m[x[key]] || 0) + 1; });
    return Object.keys(m).map(k => [(S().icon(labels, k) + ' ' + U.esc(S().label(labels, k))).trim(), m[k]]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }

  function health(freeH) {
    return '<div class="card" id="health"><h3>جسمك يتعافى</h3><ol class="healthList">' + C.HEALTH.map(h => {
      const p = U.clamp(U.pct(freeH, h[0]), 0, 100);
      return '<li class="' + (p >= 100 ? 'done' : '') + '"><div><b>' + h[1] + '</b><span>' + h[2] + '</span></div>' + U.bar(p, 'good') + '</li>';
    }).join('') + '</ol><p class="muted small">' + C.HEALTH_NOTE + ' يُحسب التقدم من آخر سيجارة.</p></div>';
  }

  function milestones() {
    const st = S().state;
    const tm = C.TIME_MS.map(m => ['t' + m[0], '⏱️', m[1], 'بدون تدخين']);
    const all = tm.concat(C.BADGES.map(b => [b[0], b[1], b[2], b[3]]));
    const got = all.filter(x => st.ach[x[0]]).length;
    return '<div class="card"><h3>الإنجازات <small class="muted">' + got + ' من ' + all.length + '</small></h3><div class="badgeGrid">' + all.map(x =>
      '<div class="badge' + (st.ach[x[0]] ? ' got' : '') + '"><span>' + x[1] + '</span><b>' + U.esc(x[2]) + '</b><small>' + U.esc(x[3]) + '</small></div>').join('') + '</div>' +
      '<p class="muted small">الإنجازات تبقى لك حتى لو حدثت انتكاسة.</p></div>';
  }

  A.views.progress = (el, range) => {
    const st = S().state;
    const scrollHealth = range === 'health';
    if (!RANGES.some(r => r[0] === range)) range = '30';
    const now = Date.now();
    const start = range === 'all' ? U.dayStart(st.profile.quitStart) : U.addDays(U.dayStart(now), -(Number(range) - 1));
    const days = S().dayList(start, now);
    const labels = days.map(d => { const x = new Date(d); return x.getDate() + '/' + (x.getMonth() + 1); });
    const cr = st.cravings.filter(c => c.t >= start);
    const perDay = fn => days.map(d => fn(d, U.addDays(d, 1)));
    const crDay = perDay((a, b) => cr.filter(c => c.t >= a && c.t < b));
    const smokedDay = perDay((a, b) => S().smokedBetween(a, b));
    const avoidedDay = perDay((a, b) => Math.round(S().avoidedBetween(a, b) * 10) / 10);
    let cum = 0;
    const moneyCum = perDay((a, b) => { cum += S().moneyBetween(a, b); return Math.round(cum * 100) / 100; });
    const chk = days.map(d => st.checkins[U.dayKey(d)] || null);
    const freeDays = days.filter(d => U.addDays(d, 1) <= now && S().isFreeDay(d)).length;
    const managed = cr.filter(c => !c.smoked).length;
    const smoked = U.sum(smokedDay);

    const hours = BUCKETS.map(b => [b[2], cr.filter(c => { let h = new Date(c.t).getHours(); if (h < 5) h += 24; return h >= b[0] && h < b[1]; }).length]).filter(x => x[1]);
    const strat = C.STEPS.map(s => {
      const list = cr.filter(c => c.did && c.did.indexOf(s[0]) >= 0);
      const drops = list.filter(c => c.after).map(c => c.intensity - c.after);
      return [s[2] + ' ' + s[1], list.length, U.pct(list.filter(c => !c.smoked).length, list.length), U.avg(drops)];
    }).filter(x => x[1] >= 2).sort((a, b) => b[2] - a[2] || b[3] - a[3]);

    el.innerHTML = '<h1 class="pageTitle">التقدم</h1>' +
      U.chips(RANGES, range, 'progRange') +
      '<div class="statGrid">' +
      '<div class="stat"><b>' + freeDays + '</b><small>يومًا بدون تدخين</small></div>' +
      '<div class="stat"><b>' + cr.length + '</b><small>رغبة مسجلة</small></div>' +
      '<div class="stat"><b>' + (cr.length ? U.num(U.avg(cr.map(c => c.intensity)), 1) : '0') + '</b><small>متوسط قوة الرغبة</small></div>' +
      '<div class="stat"><b>' + managed + '</b><small>رغبة مرت دون تدخين</small></div>' +
      '<div class="stat"><b>' + smoked + '</b><small>سيجارة دخنتها</small></div>' +
      '<div class="stat"><b>' + U.num(U.sum(avoidedDay)) + '</b><small>سيجارة تجنبتها</small></div>' +
      '<div class="stat money"><b>' + U.money(cum) + '</b><small>وفّرتها في هذه الفترة</small></div>' +
      '<div class="stat"><b>' + U.pct(managed, cr.length) + '%</b><small>نجاح في تجاوز الرغبات</small></div></div>' +

      '<div class="card"><h3>الرغبات في كل يوم</h3>' + Ch().bars(crDay.map(x => x.length), labels, { title: 'الرغبات في كل يوم' }) + '</div>' +
      '<div class="card"><h3>متوسط قوة الرغبة</h3>' + Ch().lines([{ name: 'القوة', values: crDay.map(x => (x.length ? Math.round(U.avg(x.map(c => c.intensity)) * 10) / 10 : null)), cls: 's2' }], labels, { max: 10 }) + '</div>' +
      '<div class="card"><h3>السجائر: دخنتها وتجنبتها</h3>' + Ch().lines([{ name: 'تجنبتها', values: avoidedDay, cls: 's1' }, { name: 'دخنتها', values: smokedDay, cls: 's3' }], labels) + '</div>' +
      '<div class="card"><h3>المال الموفّر (تراكمي)</h3>' + Ch().lines([{ name: 'المال', values: moneyCum, cls: 's4' }], labels, { fmt: v => U.num(v) }) + '</div>' +
      (chk.some(Boolean) ? '<div class="card"><h3>المزاج والتوتر والنوم</h3>' + Ch().lines([
        { name: 'المزاج', values: chk.map(c => (c ? c.mood : null)), cls: 's1' }, { name: 'التوتر', values: chk.map(c => (c ? c.stress : null)), cls: 's3' },
        { name: 'النوم', values: chk.map(c => (c ? c.sleep : null)), cls: 's2' }], labels, { max: 10 }) + '</div>' : '') +

      '<h2 class="secTitle">فهم الرغبات</h2>' +
      '<div class="cols"><div class="card"><h3>أكثر المحفزات</h3>' + Ch().rank(countBy(cr, 'trigger', S().triggers())) + '</div>' +
      '<div class="card"><h3>أصعب أوقات اليوم</h3>' + Ch().rank(hours.sort((a, b) => b[1] - a[1])) + '</div>' +
      '<div class="card"><h3>المشاعر الأكثر تكرارًا</h3>' + Ch().rank(countBy(cr, 'emotion', C.EMOTIONS)) + '</div>' +
      '<div class="card"><h3>الأماكن</h3>' + Ch().rank(countBy(cr, 'location', C.LOCATIONS)) + '</div></div>' +
      '<div class="card"><h3>ما الذي ساعدك؟</h3>' + Ch().rank(strat.map(x => [x[0], x[2], x]), (v, r) => v + '% · انخفاض ' + U.num(r[2][3], 1)) +
      '<p class="muted small">النسبة: كم مرة مرت الرغبة دون تدخين عندما استخدمت هذه الخطوة. الانخفاض: متوسط نزول قوة الرغبة.</p></div>' +
      '<div class="card"><h3>رغبات مرت ورغبات انتهت بالتدخين</h3><div class="split"><div class="ok"><b>' + managed + '</b><span>مرت دون تدخين</span></div><div class="slip"><b>' + (cr.length - managed) + '</b><span>انتهت بالتدخين</span></div></div></div>' +
      health(S().freeMs() / U.HOUR) + milestones();

    if (scrollHealth) setTimeout(() => { const h = document.getElementById('health'); if (h) h.scrollIntoView(); }, 50);
  };

  A.actions.progRange = (b, v) => A.go('#/progress/' + v);
})(window.App);
