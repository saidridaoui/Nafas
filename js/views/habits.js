/* Generic private tracker for any other habit the user wants to reduce or stop. */
(function (A) {
  'use strict';
  const U = A.util;
  const S = () => A.store;
  const st = () => S().state;
  let open = { craving: false, intensity: null, trigger: '' };

  const lastT = h => h.events.filter(e => e.type === 'slip').reduce((m, e) => Math.max(m, e.t), h.start);
  const longestH = h => {
    const pts = [h.start].concat(h.events.filter(e => e.type === 'slip').map(e => e.t)).sort((a, b) => a - b);
    let m = Date.now() - pts[pts.length - 1];
    for (let i = 1; i < pts.length; i += 1) m = Math.max(m, pts[i] - pts[i - 1]);
    return m;
  };

  function list(el) {
    const hs = st().habits;
    el.innerHTML = '<a class="linkBtn" href="#/settings">→ الإعدادات</a><h1 class="pageTitle">عادات أخرى</h1>' +
      '<p class="muted">مساحة خاصة لأي عادة تريد تقليلها أو التوقف عنها. اكتب الاسم بالطريقة التي تناسبك، لا أحد يراه غيرك.</p>' +
      (hs.length ? hs.map(h => '<a class="card rowLink" href="#/habits/' + h.id + '"><span><b>' + U.esc(h.name) + '</b><br><small class="muted">' + U.dur(Date.now() - lastT(h)) + ' منذ آخر مرة</small></span><span>‹</span></a>').join('') : '<div class="empty">لا توجد عادات مضافة.</div>') +
      '<div class="card"><h3>إضافة عادة</h3><label class="field">الاسم<input id="hName" class="input" placeholder="مثلًا: السهر على الهاتف"></label>' +
      '<label class="field">الهدف<input id="hGoal" class="input" placeholder="مثلًا: التوقف تمامًا أو التقليل إلى مرة في الأسبوع"></label>' +
      '<label class="field">آخر مرة حدثت<input id="hStart" class="input" type="datetime-local" value="' + U.localInput(Date.now()) + '" max="' + U.localInput(Date.now()) + '"></label>' +
      '<button class="btn primary" act="hAdd">إضافة</button></div>';
  }

  function detail(el, h) {
    const trig = S().triggers();
    const cr = h.events.filter(e => e.type === 'craving');
    const slips = h.events.filter(e => e.type === 'slip');
    const k = U.dayKey();
    const note = (h.notes || {})[k] || { mood: 5, text: '' };
    const tc = {};
    h.events.forEach(e => { if (e.trigger) tc[e.trigger] = (tc[e.trigger] || 0) + 1; });
    el.innerHTML = '<a class="linkBtn" href="#/habits">→ عادات أخرى</a><h1 class="pageTitle">' + U.esc(h.name) + '</h1>' +
      (h.goal ? '<p class="myGoal">🎯 ' + U.esc(h.goal) + '</p>' : '') +
      '<div class="statGrid"><div class="stat"><b>' + U.dur(Date.now() - lastT(h)) + '</b><small>السلسلة الحالية</small></div>' +
      '<div class="stat"><b>' + U.dur(longestH(h)) + '</b><small>أطول سلسلة</small></div>' +
      '<div class="stat"><b>' + cr.length + '</b><small>رغبات سجلتها</small></div><div class="stat"><b>' + slips.length + '</b><small>مرات حدثت</small></div></div>' +
      '<div class="quickRow"><button class="btn primary" act="hCrav">🌊 أشعر برغبة</button><button class="btn" act="hSlip">حدثت مرة</button><a class="btn soft" href="#/tools/breathe">🌬️ تنفس</a></div>' +
      (open.craving ? '<div class="card"><h3>قوة الرغبة</h3>' + U.scale('hInt', open.intensity) + '<p class="fieldLabel">المحفز</p>' + U.chips(trig, open.trigger, 'hTrig') +
        '<button class="btn primary" act="hSaveCrav">حفظ</button><p class="muted small">نفس الفكرة تنطبق هنا: انتظر بضع دقائق، غيّر المكان، اشغل نفسك. <a href="#/tools">أفكار سريعة</a></p></div>' : '') +
      '<div class="card"><h3>تسجيل اليوم</h3><div class="slider"><label for="hMood">كيف كان يومك مع هذه العادة؟ <b id="hMoodO">' + note.mood + '</b></label>' +
      '<input id="hMood" type="range" min="1" max="10" value="' + note.mood + '" oninput="document.getElementById(\'hMoodO\').textContent=this.value"><div class="scaleEnds"><span>صعب جدًا</span><span>جيد جدًا</span></div></div>' +
      '<textarea id="hNote" class="input" rows="2" placeholder="ملاحظة قصيرة">' + U.esc(note.text) + '</textarea><button class="btn" act="hNoteSave">حفظ</button></div>' +
      '<div class="card"><h3>المحفزات</h3>' + A.charts.rank(Object.keys(tc).map(t => [U.esc(S().label(trig, t)), tc[t]]).sort((a, b) => b[1] - a[1])) + '</div>' +
      '<div class="card"><h3>السجل</h3>' + (h.events.length ? '<ul class="plain">' + h.events.slice().sort((a, b) => b.t - a.t).slice(0, 30).map(e =>
        '<li><span>' + (e.type === 'slip' ? '🌧️ حدثت' : '🌊 رغبة ' + (e.intensity || '')) + (e.trigger ? ' · ' + U.esc(S().label(trig, e.trigger)) : '') + '</span><small class="muted">' + U.dateTime(e.t) + '</small></li>').join('') + '</ul>' : '<p class="muted">لا يوجد شيء بعد.</p>') + '</div>' +
      '<button class="btn danger" act="hDel">حذف هذه العادة</button>';
  }

  A.views.habits = (el, id) => {
    const h = st().habits.find(x => x.id === id);
    A.curHabit = h || null;
    if (h) return detail(el, h);
    list(el);
  };

  const re = () => A.route();
  A.actions.hAdd = () => {
    const name = document.getElementById('hName').value.trim();
    if (!name) { U.toast('اكتب اسم العادة.'); return; }
    const s = document.getElementById('hStart').value;
    st().habits.push({ id: U.id(), name, goal: document.getElementById('hGoal').value.trim(), start: s ? Math.min(Date.now(), new Date(s).getTime()) : Date.now(), events: [], notes: {} });
    S().saveNow();
    re();
  };
  A.actions.hCrav = () => { open = { craving: !open.craving, intensity: null, trigger: '' }; re(); };
  A.actions.hInt = (b, v) => { open.intensity = Number(v); re(); };
  A.actions.hTrig = (b, v) => { open.trigger = open.trigger === v ? '' : v; re(); };
  A.actions.hSaveCrav = () => {
    if (!open.intensity) { U.toast('اختر قوة الرغبة.'); return; }
    A.curHabit.events.push({ t: Date.now(), type: 'craving', intensity: open.intensity, trigger: open.trigger });
    open = { craving: false, intensity: null, trigger: '' };
    S().saveNow();
    U.toast('تم التسجيل. الرغبة موجة وستمر.');
    re();
  };
  A.actions.hSlip = () => {
    if (!window.confirm('تسجيل أن العادة حدثت الآن؟ تقدّمك السابق يبقى محفوظًا.')) return;
    A.curHabit.events.push({ t: Date.now(), type: 'slip', trigger: '' });
    S().saveNow();
    U.toast('سُجّل. لحظة صعبة لا تلغي ما قطعته. ابدأ من جديد الآن.');
    re();
  };
  A.actions.hNoteSave = () => {
    const h = A.curHabit;
    h.notes = h.notes || {};
    h.notes[U.dayKey()] = { mood: Number(document.getElementById('hMood').value), text: document.getElementById('hNote').value.trim() };
    S().saveNow();
    U.toast('تم الحفظ.');
  };
  A.actions.hDel = () => {
    if (!window.confirm('حذف هذه العادة وكل سجلها؟')) return;
    st().habits = st().habits.filter(x => x !== A.curHabit);
    S().saveNow();
    A.go('#/habits');
  };
})(window.App);
