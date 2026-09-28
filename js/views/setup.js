/* First run questions. Everything can be changed later in settings. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const S = () => A.store;
  let step = 0;
  let d = null;

  const STEPS = 7;
  const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
  const numVal = id => { const v = parseFloat(val(id).replace(',', '.')); return isNaN(v) ? 0 : v; };

  function readStep() {
    if (step === 2) {
      d.perDay = numVal('sPer');
      d.packSize = numVal('sPack');
      d.packPrice = numVal('sPrice');
      d.cigPrice = numVal('sCig');
      const cur = val('sCurOther');
      if (cur) d.currency = cur;
    }
    if (step === 3) {
      const t = val('sLast');
      d.lastSmoke = t ? new Date(t).getTime() : Date.now();
      if (d.lastSmoke > Date.now()) d.lastSmoke = Date.now();
      d.years = val('sYears');
    }
    if (step === 6) { d.contactName = val('sCName'); d.contactPhone = val('sCPhone'); }
  }

  function body() {
    if (step === 0) {
      return '<div class="setupHero"><div class="logo big" aria-hidden="true"><i></i></div><h1>أهلًا بك في نَفَس</h1>' +
        '<p>هذا التطبيق رفيق شخصي يساعدك على تقليل التدخين أو التوقف عنه، خطوة بخطوة ورغبة بعد رغبة.</p>' +
        '<div class="privacy">🔒 بياناتك تبقى على هذا الجهاز ولا يتم إرسالها إلى أي خادم.</div>' +
        '<p class="muted small">التطبيق ليس علاجًا طبيًا ولا يغني عن الطبيب. في الحالات الصعبة أو الطارئة تواصل مع طبيب أو خدمة مساعدة.</p></div>';
    }
    if (step === 1) {
      return '<h2>ما هدفك؟</h2><p class="muted">لا يوجد اختيار خاطئ. يمكنك تغيير الهدف في أي وقت.</p>' +
        '<div class="bigChoice"><button class="choice' + (d.goal === 'stop' ? ' on' : '') + '" act="setGoal" val="stop"><b>🚭 التوقف تمامًا</b><small>أريد أن أتوقف عن التدخين من الآن</small></button>' +
        '<button class="choice' + (d.goal === 'reduce' ? ' on' : '') + '" act="setGoal" val="reduce"><b>📉 التقليل تدريجيًا</b><small>أريد أن أدخن أقل أولًا</small></button></div>' +
        (d.goal === 'reduce' ? '<label class="field">كم سيجارة تريد أن يكون حدّك اليومي الآن؟<input id="sReduce" class="input" type="number" inputmode="numeric" min="0" value="' + d.reduceTo + '"></label>' : '');
    }
    if (step === 2) {
      return '<h2>كم تدخن عادة؟</h2><p class="muted">نستخدم هذه الأرقام لحساب السجائر التي تتجنبها والمال الذي توفّره.</p>' +
        '<label class="field">كم سيجارة تدخن في اليوم عادة؟<input id="sPer" class="input" type="number" inputmode="decimal" min="1" value="' + d.perDay + '"></label>' +
        '<div class="two"><label class="field">كم سيجارة في العلبة؟<input id="sPack" class="input" type="number" inputmode="numeric" min="1" value="' + d.packSize + '"></label>' +
        '<label class="field">كم سعر العلبة؟<input id="sPrice" class="input" type="number" inputmode="decimal" step="0.1" min="0" value="' + d.packPrice + '"></label></div>' +
        '<label class="field">أو سعر السيجارة الواحدة (اختياري)<input id="sCig" class="input" type="number" inputmode="decimal" step="0.01" min="0" value="' + (d.cigPrice || '') + '" placeholder="يُحسب تلقائيًا من سعر العلبة"></label>' +
        '<p class="fieldLabel">العملة</p>' + U.chips(C.CURRENCIES, d.currency, 'setCur') +
        '<input id="sCurOther" class="input" placeholder="عملة أخرى، اكتبها هنا" maxlength="6">';
    }
    if (step === 3) {
      return '<h2>متى دخنت آخر سيجارة؟</h2><p class="muted">من هذه اللحظة يبدأ العداد. إذا دخنت للتو فاترك الوقت الحالي.</p>' +
        '<label class="field">وقت آخر سيجارة<input id="sLast" class="input" type="datetime-local" value="' + U.localInput(d.lastSmoke) + '" max="' + U.localInput(Date.now()) + '"></label>' +
        '<label class="field">منذ متى تدخن؟ (اختياري)<input id="sYears" class="input" value="' + U.esc(d.years) + '" placeholder="مثلًا: 10 سنوات"></label>';
    }
    if (step === 4) {
      return '<h2>لماذا تريد التوقف؟</h2><p class="muted">اختر ما يهمك أو اكتب أسبابك. سنذكّرك بها في اللحظات الصعبة.</p>' +
        U.chips(C.REASONS, d.reasons, 'setReason', true) +
        '<div class="addRow"><input id="sMyReason" class="input" placeholder="سبب خاص بك"><button class="btn" act="addMyReason">إضافة</button></div>' +
        (d.myReasons.length ? '<ul class="plain">' + d.myReasons.map((r, i) => '<li><span>' + U.esc(r) + '</span><button class="iconBtn" act="delMyReason" val="' + i + '" aria-label="حذف">✕</button></li>').join('') + '</ul>' : '');
    }
    if (step === 5) {
      return '<h2>متى تشعر عادة بالرغبة في التدخين؟</h2><p class="muted">اختر المواقف التي تعرفها من نفسك. يمكنك التخطي.</p>' + U.chips(C.TRIGGERS, d.triggers, 'setTrig', true);
    }
    return '<h2>شخص تثق به (اختياري)</h2><p class="muted">في لحظة صعبة يمكنك الاتصال به أو مراسلته بضغطة واحدة. التطبيق لا يتصل بأحد تلقائيًا أبدًا.</p>' +
      '<label class="field">الاسم<input id="sCName" class="input" value="' + U.esc(d.contactName) + '"></label>' +
      '<label class="field">رقم الهاتف<input id="sCPhone" class="input" type="tel" dir="ltr" value="' + U.esc(d.contactPhone) + '"></label>';
  }

  function draw(el) {
    el.innerHTML = '<div class="setup"><div class="stepDots">' + Array.from({ length: STEPS }, (x, i) => '<i class="' + (i <= step ? 'on' : '') + '"></i>').join('') + '</div>' +
      '<div class="card">' + body() + '</div>' +
      '<div class="setupNav">' + (step ? '<button class="btn" act="setupBack">السابق</button>' : '<span></span>') +
      '<button class="btn primary big" act="setupNext">' + (step === 0 ? 'لنبدأ' : step === STEPS - 1 ? 'ابدأ رحلتي' : 'التالي') + '</button></div></div>';
  }

  A.views.setup = el => {
    if (!d) {
      const p = S().state.profile;
      d = { goal: p.goal, reduceTo: p.reduceTo, perDay: p.perDay, packSize: p.packSize, packPrice: p.packPrice, cigPrice: p.cigPrice, currency: p.currency,
        lastSmoke: Date.now(), years: p.years, reasons: p.reasons.slice(), myReasons: p.myReasons.slice(), triggers: p.triggers.slice(), contactName: '', contactPhone: '' };
      step = 0;
    }
    A.setupEl = el;
    draw(el);
  };

  const redraw = () => draw(A.setupEl);
  A.actions.setGoal = (el, v) => { d.goal = v; redraw(); };
  A.actions.setCur = (el, v) => { readStep(); d.currency = v; redraw(); };
  A.actions.setReason = (el, v) => { U.toggle(d.reasons, v); el.classList.toggle('on'); };
  A.actions.setTrig = (el, v) => { U.toggle(d.triggers, v); el.classList.toggle('on'); };
  A.actions.addMyReason = () => { const v = val('sMyReason'); if (v) { d.myReasons.push(v); redraw(); } };
  A.actions.delMyReason = (el, v) => { d.myReasons.splice(Number(v), 1); redraw(); };
  A.actions.setupBack = () => { readStep(); step = Math.max(0, step - 1); redraw(); };
  A.actions.setupNext = () => {
    if (step === 1 && d.goal === 'reduce') d.reduceTo = Math.max(0, numVal('sReduce'));
    readStep();
    if (step === 2 && !(d.perDay > 0)) { U.toast('اكتب عدد السجائر في اليوم تقريبًا.'); return; }
    if (step < STEPS - 1) { step += 1; redraw(); window.scrollTo(0, 0); return; }
    const st = S().state;
    Object.assign(st.profile, {
      goal: d.goal, reduceTo: d.reduceTo, perDay: d.perDay, packSize: d.packSize, packPrice: d.packPrice, cigPrice: d.cigPrice,
      currency: d.currency, lastSmoke: d.lastSmoke, quitStart: d.lastSmoke, years: d.years, reasons: d.reasons, myReasons: d.myReasons, triggers: d.triggers
    });
    st.contact = { name: d.contactName, phone: d.contactPhone };
    st.setup = true;
    st.created = Date.now();
    S().log('🌱', 'بدأت رحلتك');
    S().saveNow();
    d = null;
    A.go('#/home');
  };
})(window.App);
