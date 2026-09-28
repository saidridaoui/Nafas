/* Dashboard. Answers first: how long, how many avoided, how much saved, what to do now. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const S = () => A.store;

  A.motivation = () => {
    const st = S().state;
    const lastSmoke = st.smokes.length ? st.smokes[st.smokes.length - 1].t : 0;
    const lastCrav = st.cravings.length ? st.cravings[st.cravings.length - 1] : null;
    const free = S().freeMs();
    let set = C.MSG.start;
    if (lastSmoke && Date.now() - lastSmoke < U.DAY) set = C.MSG.afterSlip;
    else if (lastCrav && !lastCrav.smoked && Date.now() - lastCrav.t < 6 * U.HOUR) set = C.MSG.afterCraving;
    else if (free > 7 * U.DAY) set = C.MSG.longStreak;
    else if (st.profile.goal === 'reduce') set = C.MSG.reduce;
    const day = Math.floor(Date.now() / U.DAY);
    return set[day % set.length];
  };

  const timerHtml = ms => {
    const d = Math.floor(ms / U.DAY);
    const h = Math.floor((ms % U.DAY) / U.HOUR);
    const m = Math.floor((ms % U.HOUR) / U.MIN);
    const s = Math.floor((ms % U.MIN) / 1000);
    const cell = (v, l) => '<div><b>' + String(v).padStart(l === 'يوم' ? 1 : 2, '0') + '</b><span>' + l + '</span></div>';
    return cell(d, 'يوم') + cell(h, 'ساعة') + cell(m, 'دقيقة') + cell(s, 'ثانية');
  };
  A.timerHtml = timerHtml;

  function healthNext(hours) {
    const next = C.HEALTH.find(x => x[0] > hours);
    const prev = C.HEALTH.filter(x => x[0] <= hours).pop();
    return { next, prev, pct: next ? U.pct(hours - (prev ? prev[0] : 0), next[0] - (prev ? prev[0] : 0)) : 100 };
  }

  A.views.home = el => {
    const st = S().state;
    const p = st.profile;
    const free = S().freeMs();
    const avoided = S().avoided();
    const now = Date.now();
    const today = U.dayStart(now);
    const smokedToday = S().todaySmoked();
    const check = st.checkins[U.dayKey()];
    const lastCrav = st.cravings[st.cravings.length - 1];
    const cravLevel = check ? check.craving : (lastCrav && now - lastCrav.t < 12 * U.HOUR ? lastCrav.after || lastCrav.intensity : null);
    const hn = healthNext(free / U.HOUR);
    const plan = st.plans[U.dayKey()] || {};
    const reasons = S().reasons();
    const longest = S().longest();

    let goalHtml;
    if (p.goal === 'reduce') {
      const left = p.reduceTo - smokedToday;
      goalHtml = '<p>حدّك اليوم: <b>' + p.reduceTo + '</b> سجائر. دخنت حتى الآن <b>' + smokedToday + '</b>.</p>' +
        U.bar(U.pct(smokedToday, Math.max(1, p.reduceTo)), smokedToday > p.reduceTo ? 'warn' : '') +
        '<p class="muted small">' + (left > 0 ? 'ما زال لديك هامش ' + left + '. كل سيجارة تؤجلها تُحسب لك.' : left === 0 ? 'وصلت إلى حدّك. حاول أن تتوقف هنا اليوم.' : 'تجاوزت الحد اليوم. لا بأس، غدًا فرصة جديدة.') + '</p>';
    } else {
      goalHtml = smokedToday ? '<p>دخنت اليوم ' + (smokedToday === 1 ? 'سيجارة واحدة' : smokedToday + ' سجائر') + '. الهدف الآن: لا سيجارة أخرى اليوم.</p>'
        : '<p><b>يوم بدون تدخين.</b> حتى الآن اليوم لم تسجّل أي سيجارة.</p>';
    }
    if (plan.goal) goalHtml += '<p class="myGoal">🎯 ' + U.esc(plan.goal) + '</p>';

    el.innerHTML =
      (st.active ? '<a class="activeBar" href="#/craving">🌊 لديك رغبة جارية الآن. اضغط للعودة إلى المؤقت.</a>' : '') +
      '<section class="hero">' +
      '<p class="heroLabel">' + (free < U.MIN ? 'بدأ العد الآن' : 'منذ آخر سيجارة') + '</p>' +
      '<div class="clock" id="clock" aria-live="off">' + timerHtml(free) + '</div>' +
      '<p class="heroSub">' + U.esc(A.motivation()) + '</p>' +
      '</section>' +
      '<a class="cravingBtn" href="#/craving"><span aria-hidden="true">🌊</span> أشعر برغبة في التدخين</a>' +
      '<div class="quickRow"><a class="btn soft" href="#/smoked">دخنت سيجارة</a><a class="btn soft" href="#/tools/breathe">تمرين التنفس</a>' +
      (check ? '' : '<a class="btn soft" href="#/journal">تسجيل اليوم</a>') + '</div>' +

      '<div class="statGrid">' +
      '<div class="stat"><span class="sIcon">🚭</span><b>' + U.num(avoided) + '</b><small>سيجارة تجنبتها</small></div>' +
      '<div class="stat money"><span class="sIcon">💶</span><b>' + U.money(S().money()) + '</b><small>وفّرتها حتى الآن</small></div>' +
      '<div class="stat"><span class="sIcon">🔥</span><b>' + Math.floor(free / U.DAY) + '</b><small>أيام في السلسلة الحالية</small></div>' +
      '<div class="stat"><span class="sIcon">🏔️</span><b>' + Math.floor(longest / U.DAY) + '</b><small>أطول سلسلة (أيام)</small></div>' +
      '</div>' +

      '<div class="card"><h3>هدف اليوم</h3>' + goalHtml +
      (cravLevel ? '<p class="small">مستوى الرغبة الحالي: <b>' + cravLevel + ' من 10</b></p>' + U.bar(cravLevel * 10, cravLevel >= 7 ? 'warn' : '') : '') + '</div>' +

      (reasons.length ? '<div class="card reasons"><h3>لماذا بدأت</h3><ul>' + reasons.slice(0, 4).map(r => '<li>' + U.esc(r) + '</li>').join('') + '</ul></div>' : '') +

      '<div class="card"><h3>المال الذي وفّرته</h3><div class="moneyRow">' +
      '<div><small>اليوم</small><b>' + U.money(S().moneyBetween(today, now)) + '</b></div>' +
      '<div><small>هذا الأسبوع</small><b>' + U.money(S().moneyBetween(U.addDays(today, -6), now)) + '</b></div>' +
      '<div><small>آخر 30 يومًا</small><b>' + U.money(S().moneyBetween(U.addDays(today, -29), now)) + '</b></div></div>' +
      '<p class="muted small">تقدير بناءً على ' + p.perDay + ' سجائر يوميًا وسعر ' + U.money(S().cigPrice()) + ' للسيجارة.</p></div>' +

      '<div class="card"><h3>جسمك يتعافى</h3>' +
      (hn.next ? '<p>الخطوة التالية بعد <b>' + hn.next[1] + '</b>: ' + hn.next[2] + '</p>' + U.bar(hn.pct, 'good') : '<p>تجاوزت كل المراحل المعروضة هنا.</p>') +
      (hn.prev ? '<p class="small">✓ ' + hn.prev[2] + '</p>' : '') +
      '<p class="muted small">' + C.HEALTH_NOTE + ' <a href="#/progress/health">المزيد</a></p></div>' +

      '<div class="card"><h3>آخر النشاط</h3>' + (st.activity.length ? '<ul class="plain">' + st.activity.slice(0, 5).map(a =>
        '<li><span>' + a.icon + ' ' + U.esc(a.text) + '</span><small class="muted">' + U.ago(a.t) + '</small></li>').join('') + '</ul>' : '<p class="muted">لا يوجد نشاط بعد.</p>') + '</div>';

    A.every(() => {
      const c = document.getElementById('clock');
      if (c) c.innerHTML = timerHtml(S().freeMs());
    }, 1000);
    A.every(() => S().checkAch(), 60000);
  };
})(window.App);
