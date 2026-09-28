/* Settings, reasons, triggers, contact, privacy tools and demo mode. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const S = () => A.store;
  const v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
  const n = id => { const x = parseFloat(v(id).replace(',', '.')); return isNaN(x) ? 0 : x; };

  const DEMOS = [['new', 'مستخدم جديد'], ['day1', 'يوم واحد بدون تدخين'], ['week', '7 أيام بدون تدخين'], ['craving', 'رغبة قوية الآن'], ['relapse', 'انتكاسة حديثة'], ['long', 'تقدم طويل (4 أشهر)']];

  function demoPage(el) {
    el.innerHTML = '<a class="linkBtn" href="#/settings">→ الإعدادات</a><h1 class="pageTitle">وضع التجربة</h1>' +
      '<p class="muted">لتجربة التطبيق بسيناريوهات جاهزة. بياناتك الحقيقية تُحفظ جانبًا ويمكنك استرجاعها.</p>' +
      '<div class="toolGrid">' + DEMOS.map(d => '<button class="tool" act="demo" val="' + d[0] + '"><b>' + d[1] + '</b></button>').join('') + '</div>' +
      (S().state.demo || S().hasBackup() ? '<button class="btn primary big block" act="demoOff">إنهاء التجربة واسترجاع بياناتي</button>' : '');
  }

  A.views.settings = (el, sub) => {
    if (sub === 'demo') return demoPage(el);
    const st = S().state;
    const p = st.profile;
    el.innerHTML = '<h1 class="pageTitle">الإعدادات</h1>' +
      '<div class="card"><h3>عاداتي في التدخين</h3>' +
      '<p class="fieldLabel">الهدف</p>' + U.chips([['stop', 'التوقف تمامًا'], ['reduce', 'التقليل تدريجيًا']], p.goal, 'setGoalS') +
      '<label class="field" id="reduceField"' + (p.goal === 'reduce' ? '' : ' hidden') + '>الحد اليومي<input id="eReduce" class="input" type="number" min="0" value="' + p.reduceTo + '"></label>' +
      '<label class="field">سجائر في اليوم عادة<input id="ePer" class="input" type="number" inputmode="decimal" min="1" value="' + p.perDay + '"></label>' +
      '<div class="two"><label class="field">سجائر في العلبة<input id="ePack" class="input" type="number" min="1" value="' + p.packSize + '"></label>' +
      '<label class="field">سعر العلبة<input id="ePrice" class="input" type="number" step="0.1" min="0" value="' + p.packPrice + '"></label></div>' +
      '<label class="field">سعر السيجارة (اختياري)<input id="eCig" class="input" type="number" step="0.01" min="0" value="' + (p.cigPrice || '') + '"></label>' +
      '<label class="field">العملة<input id="eCur" class="input" value="' + U.esc(p.currency) + '" maxlength="6"></label>' +
      '<label class="field">منذ متى تدخن<input id="eYears" class="input" value="' + U.esc(p.years) + '"></label>' +
      '<label class="field">بداية الرحلة (تُستخدم لحساب المال والسجائر)<input id="eStart" class="input" type="datetime-local" value="' + U.localInput(p.quitStart) + '" max="' + U.localInput(Date.now()) + '"></label>' +
      '<button class="btn primary" act="saveProfile">حفظ</button></div>' +

      '<div class="card"><h3>أسبابي</h3>' + U.chips(C.REASONS, p.reasons, 'setReasonS', true) +
      '<div class="addRow"><input id="eMyReason" class="input" placeholder="سبب خاص بك"><button class="btn" act="addReasonS">إضافة</button></div>' +
      (p.myReasons.length ? '<ul class="plain">' + p.myReasons.map((r, i) => '<li><span>' + U.esc(r) + '</span><button class="iconBtn" act="delReasonS" val="' + i + '" aria-label="حذف">✕</button></li>').join('') + '</ul>' : '') + '</div>' +

      '<div class="card"><h3>محفزاتي المعتادة</h3><p class="muted small">تظهر أولًا في وضع الرغبة.</p>' + U.chips(S().triggers(), p.triggers, 'setTrigS', true) +
      '<div class="addRow"><input id="eTrig" class="input" placeholder="محفز خاص بك"><button class="btn" act="addTrigS">إضافة</button></div>' +
      (st.customTriggers.length ? '<ul class="plain">' + st.customTriggers.map((t, i) => '<li><span>✏️ ' + U.esc(t) + '</span><button class="iconBtn" act="delTrigS" val="' + i + '" aria-label="حذف">✕</button></li>').join('') + '</ul>' : '') + '</div>' +

      '<div class="card"><h3>شخص تثق به</h3><p class="muted small">يظهر زر الاتصال به في وضع الرغبة. لا يتم الاتصال تلقائيًا أبدًا.</p>' +
      '<label class="field">الاسم<input id="eCName" class="input" value="' + U.esc(st.contact.name) + '"></label>' +
      '<label class="field">رقم الهاتف<input id="eCPhone" class="input" type="tel" dir="ltr" value="' + U.esc(st.contact.phone) + '"></label>' +
      '<button class="btn" act="saveContact">حفظ</button></div>' +

      '<div class="card"><h3>تصحيح عدد السجائر المتجنبة</h3><p class="muted small">التقدير الحالي: <b>' + U.num(S().avoided()) + '</b>. إذا كان الرقم غير دقيق، اكتب الرقم الصحيح.</p>' +
      '<div class="addRow"><input id="eAvoid" class="input" type="number" min="0" value="' + S().avoided() + '"><button class="btn" act="saveAvoid">تصحيح</button></div>' +
      (st.avoidAdjust ? '<button class="linkBtn" act="resetAvoid">إلغاء التصحيح والعودة إلى الحساب التلقائي</button>' : '') + '</div>' +

      '<a class="card rowLink" href="#/habits"><span>🧭 <b>عادات أخرى</b><br><small class="muted">تتبع خاص لأي عادة أخرى تريد تقليلها أو التوقف عنها</small></span><span>‹</span></a>' +

      '<div class="card"><h3>الخصوصية وبياناتك</h3><div class="privacy">🔒 بياناتك تبقى على هذا الجهاز ولا يتم إرسالها إلى أي خادم.</div>' +
      '<p class="small">لا يوجد حساب ولا تتبع ولا إحصاءات خارجية. إذا مسحت بيانات المتصفح أو غيّرت الجهاز فقد تضيع بياناتك، لذلك احفظ نسخة من حين لآخر.</p>' +
      '<div class="quickRow"><button class="btn" act="exportFile">⬇️ تصدير بياناتي</button><label class="btn">⬆️ استيراد بياناتي<input type="file" id="importFile" accept=".json,application/json" hidden></label></div>' +
      '<button class="btn danger block" act="wipeAll">🗑️ حذف كل بياناتي</button></div>' +

      '<details class="card"><summary><b>للتجربة والتطوير</b></summary><p class="small muted">سيناريوهات جاهزة لتجربة التطبيق.</p><a class="btn" href="#/settings/demo">وضع التجربة</a></details>' +
      '<p class="muted small center">نَفَس · يعمل بدون إنترنت بعد أول فتح</p>';

    document.getElementById('importFile').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        if (!window.confirm('سيتم استبدال البيانات الحالية بالبيانات من الملف. هل تريد المتابعة؟')) return;
        try { S().importData(String(r.result)); U.toast('تم استيراد بياناتك.'); A.go('#/home'); } catch (x) { U.toast('الملف غير صالح. اختر ملفًا صدّرته من هذا التطبيق.'); }
      };
      r.readAsText(f);
    });
  };

  const st = () => S().state;
  A.actions.setGoalS = (b, val) => {
    st().profile.goal = val;
    S().save();
    b.parentNode.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
    document.getElementById('reduceField').hidden = val !== 'reduce';
  };
  A.actions.saveProfile = () => {
    const p = st().profile;
    if (!(n('ePer') > 0)) { U.toast('اكتب عدد السجائر في اليوم.'); return; }
    p.perDay = n('ePer'); p.packSize = n('ePack'); p.packPrice = n('ePrice'); p.cigPrice = n('eCig');
    p.currency = v('eCur') || '€'; p.years = v('eYears'); p.reduceTo = n('eReduce');
    const s = v('eStart');
    if (s) {
      const t = Math.min(Date.now(), new Date(s).getTime());
      if (t !== p.quitStart) { p.quitStart = t; if (p.lastSmoke < t) p.lastSmoke = t; }
    }
    S().saveNow();
    U.toast('تم الحفظ.');
  };
  A.actions.setReasonS = (b, val) => { U.toggle(st().profile.reasons, val); b.classList.toggle('on'); S().save(); };
  A.actions.addReasonS = () => { const x = v('eMyReason'); if (x) { st().profile.myReasons.push(x); S().save(); A.route(); } };
  A.actions.delReasonS = (b, val) => { st().profile.myReasons.splice(Number(val), 1); S().save(); A.route(); };
  A.actions.setTrigS = (b, val) => { U.toggle(st().profile.triggers, val); b.classList.toggle('on'); S().save(); };
  A.actions.addTrigS = () => { const x = v('eTrig'); if (x && st().customTriggers.indexOf(x) < 0) { st().customTriggers.push(x); S().save(); A.route(); } };
  A.actions.delTrigS = (b, val) => { st().customTriggers.splice(Number(val), 1); S().save(); A.route(); };
  A.actions.saveContact = () => { st().contact = { name: v('eCName'), phone: v('eCPhone') }; S().saveNow(); U.toast('تم الحفظ.'); };
  A.actions.saveAvoid = () => {
    const want = Math.max(0, Math.round(n('eAvoid')));
    const calc = Math.floor(S().avoidedBetween(st().profile.quitStart, Date.now()));
    st().avoidAdjust = want - calc;
    S().saveNow();
    A.route();
  };
  A.actions.resetAvoid = () => { st().avoidAdjust = 0; S().saveNow(); A.route(); };

  A.actions.exportFile = () => {
    const blob = new Blob([S().exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nafasBackup' + U.dayKey().replace(/\./g, '') + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    U.toast('تم إنشاء ملف النسخة. احفظه في مكان آمن.');
  };
  A.actions.wipeAll = () => {
    if (!window.confirm('سيتم حذف كل بياناتك من هذا الجهاز نهائيًا. هل أنت متأكد؟')) return;
    if (!window.confirm('تأكيد أخير: لا يمكن التراجع عن الحذف.')) return;
    S().wipe();
    A.go('#/setup');
  };
  A.actions.demo = (b, val) => {
    if (!S().state.demo && S().state.setup && !window.confirm('سيتم حفظ بياناتك الحقيقية جانبًا وتحميل بيانات تجريبية. متابعة؟')) return;
    S().demo(val);
    A.go(val === 'craving' ? '#/craving' : '#/home');
  };
  A.actions.demoOff = () => { S().restoreReal(); A.go('#/home'); };
})(window.App);
