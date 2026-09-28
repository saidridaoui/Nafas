/* Education, help resources and the small tools: breathing, distraction center, number game. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const S = () => A.store;

  function helpHtml() {
    return '<div class="card care"><h3>عندما تحتاج مساعدة الآن</h3>' +
      '<p>إذا كانت أعراضك الجسدية شديدة، أو كنت تشعر بضيق كبير أو أفكار بإيذاء نفسك، لا تبقَ وحدك. اتصل بأحد الأرقام التالية أو بشخص تثق به.</p></div>' +
      C.RESOURCES.map(r => '<div class="card resource"><div><h3>' + U.esc(r[0]) + '</h3><p class="small">' + U.esc(r[1]) + '</p><p class="muted small">' + U.esc(r[4]) + '</p></div>' +
        (r[2] ? '<a class="btn primary callBtn" href="tel:' + r[2] + '" dir="ltr">📞 ' + U.esc(r[3]) + '</a>' : '') + '</div>').join('') +
      '<p class="muted small">' + C.RESOURCES_NOTE + '</p>' +
      (S().state.contact.phone ? '<div class="card resource"><div><h3>' + U.esc(S().state.contact.name || 'الشخص الذي تثق به') + '</h3></div><a class="btn callBtn" href="tel:' + U.esc(S().state.contact.phone) + '">📞 اتصال</a></div>' : '');
  }

  A.views.learn = (el, sub) => {
    const tabs = '<h1 class="pageTitle">التعلم</h1><nav class="tabs"><a href="#/learn" class="' + (sub ? '' : 'on') + '">افهم الإدمان</a><a href="#/tools" >أدوات</a><a href="#/learn/help" class="' + (sub === 'help' ? 'on' : '') + '">المساعدة</a></nav>';
    if (sub === 'help') { el.innerHTML = tabs + helpHtml(); return; }
    el.innerHTML = tabs + '<p class="muted">شرح بسيط يساعدك على فهم ما يحدث معك. هذه معلومات عامة وليست نصيحة طبية شخصية.</p>' +
      C.LEARN.map((x, i) => '<details class="card lesson"' + (i === 0 ? ' open' : '') + '><summary><span>' + x[1] + '</span> ' + U.esc(x[0]) + '</summary>' + x[2].map(p => '<p>' + U.esc(p) + '</p>').join('') + '</details>').join('') +
      '<details class="card lesson"><summary><span>❤️</span> ماذا يحدث في الجسم بعد التوقف؟</summary><ul class="plain">' + C.HEALTH.map(h => '<li><span><b>' + h[1] + '</b><br>' + h[2] + '</span></li>').join('') + '</ul><p class="muted small">' + C.HEALTH_NOTE + '</p></details>';
  };

  /* Tools. */
  let breath = null;

  function breathe(el) {
    el.innerHTML = '<a class="linkBtn" href="#/tools">→ الأدوات</a><h1 class="pageTitle">تمرين التنفس</h1>' +
      '<p class="muted">تمرين قصير للاسترخاء وتشتيت الانتباه عن الرغبة. إذا شعرت بدوخة، توقف وتنفس بشكل عادي.</p>' +
      '<div class="breathBox"><div class="bCircle" id="bCircle"><span id="bTxt">جاهز؟</span><b id="bNum"></b></div></div>' +
      '<p class="center" id="bRound"></p>' +
      '<div class="quickRow center"><button class="btn primary big" act="bStart" id="bStart">ابدأ (دقيقة واحدة)</button></div>';
    A.onLeave(() => { if (breath) clearTimeout(breath.t); breath = null; });
  }
  const PHASES = [['شهيق', 4, 'in'], ['احبس النفس', 2, 'hold'], ['زفير', 6, 'out']];
  A.actions.bStart = () => {
    if (breath) clearTimeout(breath.t);
    breath = { cycle: 0, phase: 0, n: PHASES[0][1] };
    document.getElementById('bStart').textContent = 'إعادة';
    const run = () => {
      const c = document.getElementById('bCircle');
      if (!c || !breath) return;
      const ph = PHASES[breath.phase];
      if (breath.n === ph[1]) c.className = 'bCircle ' + ph[2];
      document.getElementById('bTxt').textContent = ph[0];
      document.getElementById('bNum').textContent = breath.n;
      document.getElementById('bRound').textContent = 'الدورة ' + (breath.cycle + 1) + ' من 5';
      breath.n -= 1;
      if (breath.n < 1) {
        breath.phase = (breath.phase + 1) % PHASES.length;
        if (breath.phase === 0) breath.cycle += 1;
        breath.n = PHASES[breath.phase][1];
        if (breath.cycle >= 5) {
          c.className = 'bCircle';
          document.getElementById('bTxt').textContent = 'أحسنت';
          document.getElementById('bNum').textContent = '';
          document.getElementById('bRound').textContent = 'كيف تشعر الآن؟ إذا ما زالت الرغبة قوية، جرّب المشي أو شرب الماء.';
          S().log('🌬️', 'أكملت تمرين التنفس');
          S().save();
          breath = null;
          return;
        }
      }
      breath.t = setTimeout(run, 1000);
    };
    run();
  };

  let game = null;
  function numGame(el) {
    const best = S().state.settings.gameBest;
    el.innerHTML = '<a class="linkBtn" href="#/tools">→ الأدوات</a><h1 class="pageTitle">لعبة الأرقام</h1>' +
      '<p class="muted">اضغط على الأرقام من 1 إلى 16 بالترتيب بأسرع ما يمكن.' + (best ? ' أفضل وقت لك: <b>' + best.toFixed(1) + ' ثانية</b>.' : '') + '</p>' +
      '<div class="gameTop"><span>التالي: <b id="gNext">1</b></span><span>الوقت: <b id="gTime">0.0</b></span></div>' +
      '<div class="gameGrid" id="gGrid" dir="ltr"></div><div class="quickRow center"><button class="btn primary" act="gStart">لعبة جديدة</button></div>';
    A.actions.gStart();
    A.every(() => {
      if (game && game.start && !game.done) { const t = document.getElementById('gTime'); if (t) t.textContent = ((Date.now() - game.start) / 1000).toFixed(1); }
    }, 100);
  }
  A.actions.gStart = () => {
    const nums = Array.from({ length: 16 }, (x, i) => i + 1).sort(() => Math.random() - 0.5);
    game = { next: 1, start: 0, done: false };
    const g = document.getElementById('gGrid');
    if (!g) return;
    g.innerHTML = nums.map(n => '<button class="gCell" act="gTap" val="' + n + '">' + n + '</button>').join('');
    document.getElementById('gNext').textContent = '1';
    document.getElementById('gTime').textContent = '0.0';
  };
  A.actions.gTap = (b, v) => {
    if (!game || game.done) return;
    if (Number(v) !== game.next) { b.classList.add('miss'); setTimeout(() => b.classList.remove('miss'), 300); return; }
    if (!game.start) game.start = Date.now();
    b.classList.add('hit');
    b.disabled = true;
    game.next += 1;
    document.getElementById('gNext').textContent = game.next > 16 ? '✓' : game.next;
    if (game.next > 16) {
      game.done = true;
      const t = (Date.now() - game.start) / 1000;
      const st = S().state;
      const rec = !st.settings.gameBest || t < st.settings.gameBest;
      if (rec) st.settings.gameBest = t;
      S().save();
      U.toast(rec ? '🎉 رقم قياسي جديد: ' + t.toFixed(1) + ' ثانية' : 'انتهيت في ' + t.toFixed(1) + ' ثانية');
    }
  };

  function center(el) {
    el.innerHTML = '<h1 class="pageTitle">التعلم</h1><nav class="tabs"><a href="#/learn">افهم الإدمان</a><a href="#/tools" class="on">أدوات</a><a href="#/learn/help">المساعدة</a></nav>' +
      '<div class="toolGrid"><a class="tool" href="#/tools/breathe"><span>🌬️</span><b>تمرين التنفس</b><small>دقيقة واحدة</small></a>' +
      '<a class="tool" href="#/tools/game"><span>🧩</span><b>لعبة الأرقام</b><small>أقل من دقيقة</small></a>' +
      '<a class="tool" href="#/craving"><span>🌊</span><b>وضع الرغبة</b><small>مؤقت وخطوات</small></a></div>' +
      '<h2 class="secTitle">أفكار سريعة عندما تأتي الرغبة</h2><div class="actList">' + C.ACTIVITIES.map(x =>
        '<div class="card actRow"><span class="aIcon">' + x[1] + '</span><div><b>' + x[2] + '</b><p class="small muted">' + x[3] + '</p></div>' + (x[4] ? '<a class="btn" href="' + x[4] + '">افتح</a>' : '') + '</div>').join('') + '</div>';
  }

  A.views.tools = (el, sub) => {
    if (sub === 'breathe') return breathe(el);
    if (sub === 'game') return numGame(el);
    center(el);
  };
})(window.App);
