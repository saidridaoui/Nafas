/* Daily check-in, the daily plan, and the history of everything logged. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const S = () => A.store;

  const TABS = [['today', 'تسجيل اليوم'], ['plan', 'خطة اليوم'], ['history', 'السجل']];
  const SLIDERS = [['mood', 'المزاج', 'سيئ جدًا', 'ممتاز'], ['craving', 'الرغبة في التدخين', 'لا توجد', 'قوية جدًا'], ['stress', 'التوتر', 'هادئ', 'متوتر جدًا'], ['sleep', 'النوم', 'سيئ جدًا', 'ممتاز']];

  function tabs(cur) {
    return '<h1 class="pageTitle">اليوميات</h1><nav class="tabs">' + TABS.map(t => '<a href="#/journal/' + t[0] + '" class="' + (t[0] === cur ? 'on' : '') + '">' + t[1] + '</a>').join('') + '</nav>';
  }

  function today(el) {
    const st = S().state;
    const k = U.dayKey();
    const c = st.checkins[k] || { mood: 5, craving: 5, stress: 5, sleep: 5, smoked: S().todaySmoked() > 0, hard: '', good: '' };
    el.innerHTML += '<div class="card"><h3>كيف تشعر اليوم؟</h3><p class="muted small">' + U.weekday(Date.now()) + '، ' + U.date(Date.now()) + (st.checkins[k] ? ' · سجّلت اليوم، ويمكنك التعديل.' : '') + '</p>' +
      SLIDERS.map(s => '<div class="slider"><label for="j' + s[0] + '">' + s[1] + ' <b id="o' + s[0] + '">' + c[s[0]] + '</b></label>' +
        '<input id="j' + s[0] + '" type="range" min="1" max="10" value="' + c[s[0]] + '" oninput="document.getElementById(\'o' + s[0] + '\').textContent=this.value">' +
        '<div class="scaleEnds"><span>' + s[2] + '</span><span>' + s[3] + '</span></div></div>').join('') +
      '<p class="fieldLabel">هل دخنت اليوم؟</p>' + U.chips([['no', 'لا'], ['yes', 'نعم']], c.smoked ? 'yes' : 'no', 'jSmoked') +
      '<label class="field">ما الذي كان صعبًا اليوم؟<textarea id="jHard" class="input" rows="2">' + U.esc(c.hard) + '</textarea></label>' +
      '<label class="field">ما الذي سار بشكل جيد؟<textarea id="jGood" class="input" rows="2">' + U.esc(c.good) + '</textarea></label>' +
      '<button class="btn primary big block" act="jSave">حفظ</button></div>' +
      '<div id="jSupport"></div>';
    A.jSmoked = !!c.smoked;
    support(c);
  }

  function support(c) {
    const box = document.getElementById('jSupport');
    if (!box || !c) return;
    box.innerHTML = (c.mood <= 2 || c.stress >= 9) ? '<div class="card care"><h3>يبدو أن اليوم ثقيل</h3>' +
      '<p>هذا لا يتعلق بالتدخين فقط. إذا كنت تشعر بضيق كبير، تحدث مع شخص تثق به، أو مع خط الدعم النفسي المجاني على مدار الساعة.</p>' +
      '<a class="btn" href="#/learn/help">أرقام المساعدة</a></div>' : '';
  }

  function plan(el) {
    const st = S().state;
    const k = U.dayKey();
    const p = st.plans[k] || (st.plans[k] = { goal: '', learned: '', tomorrow: '' });
    const cr = S().todayCravings();
    const managed = cr.filter(c => !c.smoked).length;
    const trig = {};
    cr.forEach(c => { if (c.trigger) trig[c.trigger] = (trig[c.trigger] || 0) + 1; });
    const water = st.water[k] || 0;
    const reasons = S().reasons();
    el.innerHTML += '<div class="card planBlock"><h3>🌅 الصباح</h3>' +
      (reasons.length ? '<p class="fieldLabel">لماذا أتوقف؟</p><ul class="reasonsInline">' + reasons.map(r => '<li>' + U.esc(r) + '</li>').join('') + '</ul>' : '') +
      '<label class="field">ما هدفي اليوم؟<input id="pGoal" class="input" value="' + U.esc(p.goal) + '" placeholder="مثلًا: لا سيجارة بعد القهوة الصباحية"></label></div>' +
      '<div class="card planBlock"><h3>☀️ خلال اليوم</h3><div class="quickRow"><a class="btn" href="#/craving">🌊 زر الرغبة</a><a class="btn" href="#/tools/breathe">🌬️ تنفس دقيقة</a></div>' +
      '<div class="waterRow"><span>💧 أكواب الماء اليوم: <b id="wN">' + water + '</b></span><button class="btn" act="water" val="1">+ كوب</button></div>' +
      '<p class="small">🚶 اقتراح حركة: ' + U.esc(C.MOVES[new Date().getDate() % C.MOVES.length]) + '</p></div>' +
      '<div class="card planBlock"><h3>🌙 المساء</h3>' +
      '<ul class="plain"><li><span>هل دخنت اليوم؟</span><b>' + (S().todaySmoked() ? S().todaySmoked() + ' سجائر' : 'لا') + '</b></li>' +
      '<li><span>رغبات تجاوزتها اليوم</span><b>' + managed + ' من ' + cr.length + '</b></li>' +
      '<li><span>محفزات اليوم</span><b>' + (Object.keys(trig).map(t => S().label(S().triggers(), t)).join('، ') || 'لا شيء مسجل') + '</b></li></ul>' +
      '<label class="field">ماذا تعلمت اليوم؟<textarea id="pLearned" class="input" rows="2">' + U.esc(p.learned) + '</textarea></label>' +
      '<label class="field">ماذا سأفعل بشكل مختلف غدًا؟<textarea id="pTomorrow" class="input" rows="2">' + U.esc(p.tomorrow) + '</textarea></label></div>' +
      '<button class="btn primary big block" act="pSave">حفظ الخطة</button>';
  }

  function history(el) {
    const st = S().state;
    const items = [];
    st.cravings.forEach(c => items.push({ t: c.t, kind: 'c', id: c.id, html: '<b>' + (c.smoked ? '🌧️ رغبة انتهت بالتدخين' : '🌊 رغبة تجاوزتها') + '</b><small>القوة ' + c.intensity + (c.after ? ' ثم ' + c.after : '') + (c.trigger ? ' · ' + U.esc(S().label(S().triggers(), c.trigger)) : '') + '</small>' }));
    st.smokes.forEach(s => items.push({ t: s.t, kind: 's', id: s.id, html: '<b>🚬 ' + (s.count === 1 ? 'سيجارة واحدة' : s.count + ' سجائر') + '</b><small>' + (s.trigger ? U.esc(S().label(S().triggers(), s.trigger)) : '') + (s.before ? ' · ' + U.esc(s.before) : '') + '</small>' }));
    Object.keys(st.checkins).forEach(k => { const c = st.checkins[k]; items.push({ t: c.t || Date.now(), kind: 'k', id: k, html: '<b>📓 تسجيل يومي</b><small>المزاج ' + c.mood + '، الرغبة ' + c.craving + '، التوتر ' + c.stress + '، النوم ' + c.sleep + (c.good ? ' · ' + U.esc(c.good) : '') + '</small>' }); });
    items.sort((a, b) => b.t - a.t);
    let lastDay = '';
    el.innerHTML += items.length ? '<div class="timeline">' + items.slice(0, 120).map(i => {
      const day = U.dayKey(i.t);
      const head = day !== lastDay ? '<h4>' + U.weekday(i.t) + '، ' + U.date(i.t) + '</h4>' : '';
      lastDay = day;
      return head + '<div class="tItem"><span class="tTime">' + U.time(i.t) + '</span><div>' + i.html + '</div><button class="iconBtn" act="delEntry" val="' + i.kind + ':' + i.id + '" aria-label="حذف">✕</button></div>';
    }).join('') + '</div>' : '<div class="empty">لم تسجل شيئًا بعد. كل رغبة أو سيجارة أو تسجيل يومي سيظهر هنا.</div>';
  }

  A.views.journal = (el, tab) => {
    tab = TABS.some(t => t[0] === tab) ? tab : 'today';
    el.innerHTML = tabs(tab);
    ({ today, plan, history })[tab](el);
  };

  A.actions.jSmoked = (b, v) => {
    A.jSmoked = v === 'yes';
    b.parentNode.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
  };
  A.actions.jSave = () => {
    const st = S().state;
    const k = U.dayKey();
    const g = id => Number(document.getElementById(id).value);
    const c = { mood: g('jmood'), craving: g('jcraving'), stress: g('jstress'), sleep: g('jsleep'), smoked: A.jSmoked,
      hard: document.getElementById('jHard').value.trim(), good: document.getElementById('jGood').value.trim(), t: (st.checkins[k] || {}).t || Date.now() };
    const first = !st.checkins[k];
    st.checkins[k] = c;
    if (first) S().log('📓', 'سجّلت يومك');
    S().checkAch();
    S().saveNow();
    U.toast('تم الحفظ. شكرًا لأنك توقفت لحظة مع نفسك.');
    support(c);
  };
  A.actions.water = () => {
    const st = S().state;
    const k = U.dayKey();
    st.water[k] = (st.water[k] || 0) + 1;
    document.getElementById('wN').textContent = st.water[k];
    S().save();
  };
  A.actions.pSave = () => {
    const st = S().state;
    const p = st.plans[U.dayKey()];
    p.goal = document.getElementById('pGoal').value.trim();
    p.learned = document.getElementById('pLearned').value.trim();
    p.tomorrow = document.getElementById('pTomorrow').value.trim();
    S().saveNow();
    U.toast('تم حفظ خطة اليوم.');
  };
  A.actions.delEntry = (b, v) => {
    if (!window.confirm('حذف هذا التسجيل؟')) return;
    const st = S().state;
    const i = v.indexOf(':');
    const kind = v.slice(0, i);
    const id = v.slice(i + 1);
    if (kind === 'c') st.cravings = st.cravings.filter(x => x.id !== id);
    if (kind === 's') st.smokes = st.smokes.filter(x => x.id !== id);
    if (kind === 'k') delete st.checkins[id];
    S().saveNow();
    A.route();
  };
})(window.App);
