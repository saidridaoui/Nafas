/* Craving mode: rate, wait with a timer and small steps, then rate again. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const S = () => A.store;
  let draft = null;
  let result = null;
  let el = null;

  const act = () => S().state.active;

  function startScreen() {
    const st = S().state;
    if (!draft) draft = { intensity: null, trigger: '', mins: st.settings.timer || 5 };
    const trig = S().triggers();
    const mine = st.profile.triggers;
    const sorted = trig.filter(t => mine.indexOf(t[0]) >= 0).concat(trig.filter(t => mine.indexOf(t[0]) < 0));
    el.innerHTML = '<div class="cravHead"><h1>الرغبة ستمر</h1><p>لا تحتاج إلى فعل الكثير. أجب عن سؤالين ثم ابدأ المؤقت.</p></div>' +
      '<div class="card"><h3>ما مدى قوة الرغبة الآن؟</h3>' + U.scale('cravInt', draft.intensity) + '</div>' +
      '<div class="card"><h3>ما الذي سبقها؟ <small class="muted">(اختياري)</small></h3>' + U.chips(sorted.slice(0, 16), draft.trigger, 'cravTrig') + '</div>' +
      '<div class="card"><h3>مدة الانتظار</h3>' + U.chips([['3', '3 دقائق'], ['5', '5 دقائق'], ['10', '10 دقائق']], String(draft.mins), 'cravMins') + '</div>' +
      '<button class="cravingBtn" act="cravStart">ابدأ المؤقت</button>' +
      '<p class="center small"><a href="#/learn/help">هل تشعر بضيق شديد أو بخطر؟ اطلب المساعدة</a></p>';
  }

  function ring(pct) {
    const r = 88;
    const len = 2 * Math.PI * r;
    return '<svg viewBox="0 0 200 200" class="cdRing" aria-hidden="true"><circle cx="100" cy="100" r="' + r + '" class="rBg"/><circle id="cdArc" cx="100" cy="100" r="' + r + '" class="rFg" stroke-dasharray="' + len.toFixed(1) + '" stroke-dashoffset="' + (len * pct).toFixed(1) + '"/></svg>';
  }

  function timerScreen() {
    const a = act();
    const st = S().state;
    const reasons = S().reasons();
    const c = st.contact;
    el.innerHTML = '<div class="countdown"><div class="breathOrb" aria-hidden="true"></div>' + ring(0) +
      '<div class="cdTxt"><b id="cdLeft">--:--</b><span>انتظر فقط</span></div></div>' +
      '<p class="cravMsg" id="cravMsg" aria-live="polite">' + U.esc(C.CRAVING_MSGS[0]) + '</p>' +
      '<div class="card"><h3>خطوات صغيرة</h3><p class="muted small">اضغط على ما فعلته. هكذا نعرف ما يساعدك أكثر.</p><div class="steps">' +
      C.STEPS.map((s, i) => '<button class="stepItem' + (a.did.indexOf(s[0]) >= 0 ? ' on' : '') + '" act="cravDid" val="' + s[0] + '"><span class="n">' + (i + 1) + '</span><span><b>' + s[2] + ' ' + s[1] + '</b><small>' + s[3] + '</small></span><i aria-hidden="true">✓</i></button>').join('') + '</div></div>' +
      (reasons.length ? '<div class="card reasons"><h3>تذكّر لماذا بدأت</h3><ul>' + reasons.map(r => '<li>' + U.esc(r) + '</li>').join('') + '</ul></div>' : '') +
      (c.phone ? '<div class="card"><h3>تواصل مع ' + U.esc(c.name || 'شخص تثق به') + '</h3><div class="quickRow">' +
        '<a class="btn" href="tel:' + U.esc(c.phone) + '" act="cravContact">📞 اتصال</a><a class="btn" href="sms:' + U.esc(c.phone) + '" act="cravContact">💬 رسالة</a></div></div>' : '') +
      '<div class="card"><h3>اشغل نفسك</h3><div class="actGrid">' + C.ACTIVITIES.slice(0, 6).map(x => '<button class="actItem" act="cravAct" val="' + x[0] + '"><span>' + x[1] + '</span>' + x[2] + '</button>').join('') +
      '</div><div class="quickRow"><a class="btn soft" href="#/tools/game">🧩 لعبة الأرقام</a><a class="btn soft" href="#/tools/breathe">🌬️ تمرين التنفس</a></div></div>' +
      '<button class="btn primary big block" act="cravEnd">انتهيت، لنقيّم الرغبة الآن</button>';
    tick();
    A.every(tick, 1000);
    let mi = 0;
    A.every(() => {
      mi = (mi + 1) % C.CRAVING_MSGS.length;
      const m = document.getElementById('cravMsg');
      if (m) m.textContent = C.CRAVING_MSGS[mi];
    }, 14000);
  }

  function tick() {
    const a = act();
    if (!a || a.phase !== 'timer') return;
    const left = Math.max(0, a.end - Date.now());
    const lab = document.getElementById('cdLeft');
    if (lab) lab.textContent = Math.floor(left / 60000) + ':' + String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    const arc = document.getElementById('cdArc');
    if (arc) {
      const len = 2 * Math.PI * 88;
      arc.setAttribute('stroke-dashoffset', (len * (1 - left / (a.end - a.start))).toFixed(1));
    }
    if (left <= 0) {
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
      a.phase = 'rate';
      S().save();
      A.route();
    }
  }

  function rateScreen() {
    const a = act();
    el.innerHTML = '<div class="cravHead"><h1>كيف هي الرغبة الآن؟</h1><p>كانت ' + a.intensity + ' من 10 عندما بدأت.</p></div>' +
      '<div class="card">' + U.scale('cravAfter', a.after) + '</div>' +
      '<div class="card"><h3>هل دخنت؟</h3>' + U.chips([['no', 'لا، لم أدخن', '🌿'], ['yes', 'نعم، دخنت', '🌧️']], a.smoked === true ? 'yes' : a.smoked === false ? 'no' : '', 'cravSmoked') + '</div>' +
      '<details class="card"><summary><b>تفاصيل إضافية</b> <small class="muted">(اختياري)</small></summary>' +
      '<p class="fieldLabel">كيف كنت تشعر؟</p>' + U.chips(C.EMOTIONS, a.emotion, 'cravEmo') +
      '<p class="fieldLabel">أين كنت؟</p>' + U.chips(C.LOCATIONS, a.location, 'cravLoc') + '</details>' +
      '<button class="btn primary big block" act="cravSave">حفظ</button>' +
      '<button class="linkBtn block" act="cravCancel">إلغاء بدون حفظ</button>';
  }

  function resultScreen() {
    const r = result;
    const st = S().state;
    const drop = r.intensity - r.after;
    const stats = C.STEPS.map(s => {
      const list = st.cravings.filter(c => c.did && c.did.indexOf(s[0]) >= 0);
      return [s, list.length, U.pct(list.filter(c => !c.smoked).length, list.length)];
    }).filter(x => x[1] >= 3).sort((a, b) => b[2] - a[2]);
    el.innerHTML = '<div class="resultCard ' + (r.smoked ? 'slip' : 'ok') + '"><div class="big">' + (r.smoked ? '🌧️' : '🌿') + '</div>' +
      '<h1>' + (r.smoked ? 'لحظة صعبة' : 'مرت الرغبة') + '</h1>' +
      '<p>' + U.esc(r.smoked ? U.pick(C.SLIP_MSGS) : U.pick(C.MSG.afterCraving)) + '</p>' +
      (!r.smoked && drop > 0 ? '<p>انخفضت الرغبة من <b>' + r.intensity + '</b> إلى <b>' + r.after + '</b>.</p>' : '') +
      (r.smoked ? '<p class="small">تقدّمك الكلي محفوظ: تجنبت حتى الآن <b>' + U.num(S().avoided()) + '</b> سيجارة ووفّرت <b>' + U.money(S().money()) + '</b>.</p>' : '<p class="small">مجموع الرغبات التي تجاوزتها: <b>' + S().managed() + '</b></p>') +
      '</div>' +
      (stats.length ? '<div class="card"><h3>ما يساعدك أكثر حتى الآن</h3>' + A.charts.rank(stats.slice(0, 4).map(x => [x[0][2] + ' ' + x[0][1], x[2]]), v => v + '%') +
        '<p class="muted small">نسبة الرغبات التي مرت دون تدخين عندما استخدمت هذه الخطوة.</p></div>' : '') +
      '<div class="quickRow">' + (r.smoked ? '<a class="btn primary" href="#/smoked/details">أضف تفاصيل عما حدث</a>' : '') + '<a class="btn" href="#/home">الرئيسية</a></div>';
  }

  A.views.craving = e => {
    el = e;
    const a = act();
    if (result && !a) { resultScreen(); result = null; return; }
    if (!a) return startScreen();
    if (a.phase === 'rate') return rateScreen();
    return timerScreen();
  };

  A.actions.cravInt = (b, v) => { draft.intensity = Number(v); startScreen(); };
  A.actions.cravTrig = (b, v) => { draft.trigger = draft.trigger === v ? '' : v; startScreen(); };
  A.actions.cravMins = (b, v) => { draft.mins = Number(v); S().state.settings.timer = draft.mins; S().save(); startScreen(); };
  A.actions.cravStart = () => {
    if (!draft.intensity) { U.toast('اختر قوة الرغبة من 1 إلى 10.'); return; }
    const now = Date.now();
    S().state.active = { start: now, end: now + draft.mins * U.MIN, intensity: draft.intensity, trigger: draft.trigger, mins: draft.mins, did: ['wait'], phase: 'timer' };
    draft = null;
    S().saveNow();
    A.route();
  };
  A.actions.cravDid = (b, v) => { U.toggle(act().did, v); b.classList.toggle('on'); S().save(); };
  A.actions.cravContact = () => { const a = act(); if (a && a.did.indexOf('contact') < 0) { a.did.push('contact'); S().save(); } };
  A.actions.cravAct = (b, v) => {
    const x = C.ACTIVITIES.find(i => i[0] === v);
    const map = { walk: 'move', exercise: 'move', water: 'water', leave: 'place', message: 'contact' };
    const k = map[v] || 'distract';
    const a = act();
    if (a.did.indexOf(k) < 0) a.did.push(k);
    S().save();
    U.toast(x[1] + ' ' + U.esc(x[3]));
    document.querySelectorAll('.stepItem').forEach(s => { if (s.getAttribute('val') === k) s.classList.add('on'); });
  };
  A.actions.cravEnd = () => { const a = act(); a.phase = 'rate'; S().save(); A.route(); };
  A.actions.cravAfter = (b, v) => { act().after = Number(v); rateScreen(); };
  A.actions.cravSmoked = (b, v) => { act().smoked = v === 'yes'; rateScreen(); };
  A.actions.cravEmo = (b, v) => { const a = act(); a.emotion = a.emotion === v ? '' : v; rateScreen(); document.querySelector('details').open = true; };
  A.actions.cravLoc = (b, v) => { const a = act(); a.location = a.location === v ? '' : v; rateScreen(); document.querySelector('details').open = true; };
  A.actions.cravCancel = () => { S().state.active = null; S().save(); A.go('#/home'); };
  A.actions.cravSave = () => {
    const a = act();
    if (!a.after) { U.toast('اختر قوة الرغبة الآن.'); return; }
    if (a.smoked == null) { U.toast('أخبرنا إن كنت دخنت أم لا. لا يوجد حكم هنا.'); return; }
    if (a.did.indexOf('reassess') < 0) a.did.push('reassess');
    const c = { t: a.start, intensity: a.intensity, after: a.after, trigger: a.trigger, emotion: a.emotion || '', location: a.location || '',
      did: a.did, smoked: a.smoked, mins: Math.round((Date.now() - a.start) / U.MIN) };
    S().state.active = null;
    if (c.smoked) S().addSmoke({ t: Date.now(), count: 1, trigger: c.trigger, emotion: c.emotion, location: c.location, before: '' });
    S().addCraving(c);
    result = c;
    S().saveNow();
    A.route();
  };
})(window.App);
