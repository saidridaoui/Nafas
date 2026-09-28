/* Logging a cigarette without blame, and keeping the total progress visible. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const S = () => A.store;
  let d = null;
  let el = null;
  let done = false;

  function form(edit) {
    el.innerHTML = '<div class="cravHead"><h1>' + (edit ? 'ماذا حدث؟' : 'دخنت سيجارة') + '</h1><p>شكرًا لأنك سجّلت ذلك. الصدق مع نفسك جزء من التقدم.</p></div>' +
      (edit ? '' : '<div class="card"><h3>كم سيجارة؟</h3><div class="stepper"><button class="btn" act="smCount" val="-1" aria-label="أقل">−</button><b id="smN">' + d.count + '</b><button class="btn" act="smCount" val="1" aria-label="أكثر">+</button></div>' +
        '<label class="field">متى؟<input id="smTime" class="input" type="datetime-local" value="' + U.localInput(d.t) + '" max="' + U.localInput(Date.now()) + '"></label></div>') +
      '<div class="card"><h3>ما الذي دفعك إليها؟</h3>' + U.chips(S().triggers(), d.trigger, 'smTrig') + '</div>' +
      '<div class="card"><h3>كيف كنت تشعر؟</h3>' + U.chips(C.EMOTIONS, d.emotion, 'smEmo') + '</div>' +
      '<div class="card"><h3>أين كنت؟</h3>' + U.chips(C.LOCATIONS, d.location, 'smLoc') + '</div>' +
      '<div class="card"><h3>ماذا حدث قبلها؟</h3><textarea id="smBefore" class="input" rows="3" placeholder="مثلًا: مكالمة متعبة، شرب قهوة مع صديق يدخن">' + U.esc(d.before) + '</textarea></div>' +
      '<button class="btn primary big block" act="smSave">حفظ</button>';
  }

  function after() {
    const st = S().state;
    const prevStreaks = S().streaks();
    const prev = prevStreaks.length > 1 ? prevStreaks[prevStreaks.length - 2] : 0;
    const sameTrig = d.trigger ? st.smokes.filter(x => x.trigger === d.trigger).length : 0;
    el.innerHTML = '<div class="resultCard slip"><div class="big">🌧️</div><h1>لحظة صعبة لا تمحو تقدمك</h1>' +
      '<p>' + U.esc(U.pick(C.SLIP_MSGS)) + '</p></div>' +
      '<div class="card"><h3>ما زال معك</h3><div class="statGrid">' +
      '<div class="stat"><b>' + U.num(S().avoided()) + '</b><small>سيجارة تجنبتها إجمالًا</small></div>' +
      '<div class="stat money"><b>' + U.money(S().money()) + '</b><small>وفّرتها إجمالًا</small></div>' +
      '<div class="stat"><b>' + S().managed() + '</b><small>رغبة تجاوزتها</small></div>' +
      '<div class="stat"><b>' + S().freeDays() + '</b><small>يومًا بدون تدخين</small></div></div>' +
      (prev > U.HOUR ? '<p class="small">السلسلة السابقة كانت <b>' + U.dur(prev) + '</b>. قدرت على ذلك مرة، ويمكنك أن تبدأ من جديد الآن.</p>' : '') + '</div>' +
      (d.trigger ? '<div class="card"><h3>لنتعلم من هذه اللحظة</h3><p>المحفز: <b>' + U.esc(S().label(S().triggers(), d.trigger)) + '</b>' +
        (sameTrig > 1 ? '. تكرر هذا المحفز ' + sameTrig + ' مرات. فكّر في خطة بديلة له.' : '.') + '</p>' +
        '<p class="small">في المرة القادمة عندما يأتي هذا الموقف: اضغط على زر الرغبة فورًا، وابدأ بخطوة واحدة فقط مثل تغيير المكان أو شرب الماء.</p></div>' : '') +
      '<div class="quickRow"><a class="btn primary" href="#/home">أبدأ من جديد الآن</a><a class="btn" href="#/journal">سجل اليوم</a></div>';
  }

  A.views.smoked = (e, mode) => {
    el = e;
    const st = S().state;
    if (done) { done = false; return after(); }
    if (mode === 'details' && st.smokes.length) {
      const last = st.smokes[st.smokes.length - 1];
      d = { edit: last.id, t: last.t, count: last.count, trigger: last.trigger || '', emotion: last.emotion || '', location: last.location || '', before: last.before || '' };
      return form(true);
    }
    d = { t: Date.now(), count: 1, trigger: '', emotion: '', location: '', before: '' };
    form(false);
  };

  const keep = () => { const b = document.getElementById('smBefore'); if (b) d.before = b.value; const t = document.getElementById('smTime'); if (t && t.value) d.t = Math.min(Date.now(), new Date(t.value).getTime()); };
  A.actions.smCount = (b, v) => { d.count = U.clamp(d.count + Number(v), 1, 60); document.getElementById('smN').textContent = d.count; };
  A.actions.smTrig = (b, v) => { keep(); d.trigger = d.trigger === v ? '' : v; form(!!d.edit); };
  A.actions.smEmo = (b, v) => { keep(); d.emotion = d.emotion === v ? '' : v; form(!!d.edit); };
  A.actions.smLoc = (b, v) => { keep(); d.location = d.location === v ? '' : v; form(!!d.edit); };
  A.actions.smSave = () => {
    keep();
    const st = S().state;
    if (d.edit) {
      const x = st.smokes.find(s => s.id === d.edit);
      if (x) Object.assign(x, { trigger: d.trigger, emotion: d.emotion, location: d.location, before: d.before });
      S().save();
    } else {
      S().addSmoke({ t: d.t, count: d.count, trigger: d.trigger, emotion: d.emotion, location: d.location, before: d.before });
      st.smokes.sort((a, b) => a.t - b.t);
    }
    S().saveNow();
    done = true;
    A.route();
  };
})(window.App);
