/* Local data only. Nothing leaves the device.
   All numbers shown in the app are calculated here from the raw logs. */
(function (A) {
  'use strict';
  const U = A.util;
  const C = A.content;
  const KEY = 'nafasState';
  const BACKUP = 'nafasRealBackup';

  const fresh = () => ({
    v: 1, created: Date.now(), setup: false,
    profile: {
      perDay: 15, packSize: 20, packPrice: 9, cigPrice: 0, currency: '€', years: '',
      goal: 'stop', reduceTo: 5, lastSmoke: Date.now(), quitStart: Date.now(), reasons: [], myReasons: [], triggers: []
    },
    contact: { name: '', phone: '' },
    cravings: [], smokes: [], checkins: {}, plans: {}, water: {},
    habits: [], customTriggers: [], avoidAdjust: 0, ach: {}, activity: [], active: null,
    settings: { timer: 5 }
  });

  const S = A.store = { state: fresh() };

  S.load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const f = fresh();
        S.state = Object.assign(f, d);
        S.state.profile = Object.assign(f.profile, d.profile || {});
        S.state.settings = Object.assign(f.settings, d.settings || {});
      }
    } catch (e) { S.noStorage = true; }
  };
  let timer = 0;
  S.save = () => { clearTimeout(timer); timer = setTimeout(S.saveNow, 100); };
  S.saveNow = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S.state)); } catch (e) { S.noStorage = true; }
  };

  S.log = (icon, text) => {
    S.state.activity.unshift({ t: Date.now(), icon, text });
    S.state.activity = S.state.activity.slice(0, 50);
  };

  /* Triggers including the user's own. */
  S.triggers = () => C.TRIGGERS.concat(S.state.customTriggers.map(t => [t, t, '✏️']));
  S.label = (list, key) => { const x = list.find(i => i[0] === key); return x ? x[1] : key; };
  S.icon = (list, key) => { const x = list.find(i => i[0] === key); return x ? x[2] || '' : ''; };

  /* Reasons: selected presets plus own text. */
  S.reasons = () => {
    const p = S.state.profile;
    return p.reasons.map(k => S.label(C.REASONS, k)).concat(p.myReasons);
  };

  /* Price of one cigarette. */
  S.cigPrice = () => {
    const p = S.state.profile;
    if (p.packPrice > 0 && p.packSize > 0) return p.packPrice / p.packSize;
    return p.cigPrice || 0;
  };

  S.lastSmoke = () => S.state.smokes.reduce((m, x) => Math.max(m, x.t), S.state.profile.lastSmoke);
  S.freeMs = () => Math.max(0, Date.now() - S.lastSmoke());

  S.smokedBetween = (a, b) => U.sum(S.state.smokes.filter(x => x.t >= a && x.t < b).map(x => x.count));

  /* Estimated cigarettes not smoked between a and b, compared with the usual amount. */
  S.avoidedBetween = (a, b) => {
    const start = Math.max(a, S.state.profile.quitStart);
    const end = Math.min(b, Date.now());
    if (end <= start) return 0;
    const baseline = S.state.profile.perDay * (end - start) / U.DAY;
    return Math.max(0, baseline - S.smokedBetween(start, end));
  };
  S.avoided = () => Math.max(0, Math.floor(S.avoidedBetween(S.state.profile.quitStart, Date.now()) + (S.state.avoidAdjust || 0)));
  S.moneyBetween = (a, b) => S.avoidedBetween(a, b) * S.cigPrice();
  S.money = () => S.avoided() * S.cigPrice();

  /* Smoke free periods, longest first. */
  S.streaks = () => {
    const pts = S.state.smokes.map(x => x.t).concat([S.state.profile.lastSmoke]).sort((a, b) => a - b);
    const out = [];
    for (let i = 1; i < pts.length; i += 1) out.push(pts[i] - pts[i - 1]);
    out.push(Date.now() - pts[pts.length - 1]);
    return out;
  };
  S.longest = () => Math.max.apply(null, S.streaks());

  /* Calendar days since the start with no cigarette logged that day. */
  S.dayList = (from, to) => {
    const out = [];
    for (let d = U.dayStart(from); d <= U.dayStart(to); d = U.addDays(d, 1)) out.push(d);
    return out;
  };
  S.isFreeDay = d => {
    const p = S.state.profile;
    const end = U.addDays(d, 1);
    if (d < U.dayStart(p.quitStart)) return false;
    if (p.lastSmoke >= d && p.lastSmoke < end) return false;
    if (end > Date.now() && d !== U.dayStart(Date.now())) return false;
    return S.smokedBetween(d, end) === 0;
  };
  S.freeDays = () => S.dayList(S.state.profile.quitStart, Date.now() - U.DAY).filter(d => U.addDays(d, 1) <= Date.now() && S.isFreeDay(d)).length;

  S.managed = () => S.state.cravings.filter(c => !c.smoked).length;

  S.todayCravings = () => S.state.cravings.filter(c => c.t >= U.dayStart(Date.now()));
  S.todaySmoked = () => S.smokedBetween(U.dayStart(Date.now()), Date.now() + 1);

  S.stats = () => ({
    avoided: S.avoided(), money: S.money(), managed: S.managed(), freeDays: S.freeDays(),
    freeHours: S.freeMs() / U.HOUR, longestHours: S.longest() / U.HOUR, checkins: Object.keys(S.state.checkins).length
  });

  /* Achievements are kept once earned, even after a slip. */
  S.checkAch = () => {
    const st = S.state;
    const s = S.stats();
    const hours = Math.max(s.freeHours, s.longestHours);
    C.TIME_MS.forEach(m => {
      const id = 't' + m[0];
      if (!st.ach[id] && hours >= m[0]) { st.ach[id] = Date.now(); S.log('🏅', 'وصلت إلى ' + m[1] + ' بدون تدخين'); U.toast('🏅 ' + m[1] + ' بدون تدخين'); }
    });
    C.BADGES.forEach(b => {
      if (st.ach[b[0]]) return;
      let ok = false;
      try { ok = b[4](s); } catch (e) { ok = false; }
      if (ok) { st.ach[b[0]] = Date.now(); S.log(b[1], 'إنجاز جديد: ' + b[2]); U.toast(b[1] + ' إنجاز جديد: ' + b[2]); }
    });
    S.save();
  };

  S.addCraving = c => {
    c.id = U.id();
    S.state.cravings.push(c);
    S.log(c.smoked ? '🌧️' : '🌊', c.smoked ? 'رغبة انتهت بالتدخين' : 'تجاوزت رغبة بقوة ' + c.intensity + ' من 10');
    S.checkAch();
  };
  S.addSmoke = x => {
    x.id = U.id();
    S.state.smokes.push(x);
    S.log('🌧️', 'سجّلت ' + (x.count === 1 ? 'سيجارة واحدة' : x.count + ' سجائر'));
    S.save();
  };

  S.exportData = () => JSON.stringify({ app: 'nafas', exported: Date.now(), data: S.state }, null, 1);
  S.importData = text => {
    const o = JSON.parse(text);
    const d = o && o.app === 'nafas' ? o.data : o;
    if (!d || typeof d !== 'object' || !d.profile) throw new Error('bad');
    localStorage.setItem(KEY, JSON.stringify(d));
    S.load();
  };
  S.wipe = () => {
    try { localStorage.removeItem(KEY); localStorage.removeItem(BACKUP); } catch (e) { /* ignore */ }
    S.state = fresh();
  };

  /* Demo mode. The real data is kept aside and can be restored. */
  S.hasBackup = () => { try { return !!localStorage.getItem(BACKUP); } catch (e) { return false; } };
  S.demo = kind => {
    try { if (!S.hasBackup() && S.state.setup && !S.state.demo) localStorage.setItem(BACKUP, JSON.stringify(S.state)); } catch (e) { /* ignore */ }
    const st = fresh();
    st.demo = kind;
    if (kind === 'new') { S.state = st; S.saveNow(); return; }
    const now = Date.now();
    const days = { day1: 1.1, week: 7.3, craving: 3.2, relapse: 12, long: 120 }[kind] || 5;
    const p = st.profile;
    Object.assign(p, { perDay: 18, packSize: 20, packPrice: 9.5, currency: '€', years: '8', goal: 'stop', reasons: ['health', 'family', 'money', 'breath'], myReasons: ['أن ألعب كرة القدم مع أصدقائي دون أن ألهث'], triggers: ['coffee', 'stress', 'meal', 'social'] });
    p.quitStart = now - days * U.DAY;
    p.lastSmoke = p.quitStart;
    st.setup = true;
    st.contact = { name: 'أخي', phone: '' };
    const trig = ['coffee', 'stress', 'meal', 'social', 'bored', 'seeing', 'work'];
    const emo = ['stressed', 'bored', 'anxious', 'tired', 'calm'];
    const steps = C.STEPS.map(s => s[0]);
    const nCrav = Math.min(260, Math.round(days * (days > 30 ? 1.2 : 3)));
    for (let i = 0; i < nCrav; i += 1) {
      const t = p.quitStart + Math.random() * (now - p.quitStart - U.HOUR);
      const age = (t - p.quitStart) / U.DAY;
      const intensity = U.clamp(Math.round(8 - age / 6 + (Math.random() * 4 - 2)), 2, 10);
      const smoked = (kind === 'relapse' || kind === 'long') && Math.random() < 0.04;
      st.cravings.push({
        id: U.id(), t, intensity, after: smoked ? intensity : U.clamp(intensity - 2 - Math.floor(Math.random() * 4), 1, 10),
        trigger: U.pick(trig), emotion: U.pick(emo), location: U.pick(['home', 'work', 'cafe', 'balcony']),
        did: steps.filter(() => Math.random() < 0.4), smoked, mins: 5
      });
      if (smoked) st.smokes.push({ id: U.id(), t: t + 60000, count: 1, trigger: 'stress', emotion: 'stressed', location: 'home', before: '' });
    }
    if (kind === 'relapse') {
      st.smokes.push({ id: U.id(), t: now - 2 * U.HOUR, count: 2, trigger: 'social', emotion: 'stressed', location: 'friends', before: 'كنت مع أصدقاء يدخنون بعد يوم عمل طويل' });
    }
    for (let d = 0; d < Math.min(days, 90); d += 1) {
      const t = U.addDays(now, -d);
      if (Math.random() < 0.75) {
        st.checkins[U.dayKey(t)] = {
          mood: U.clamp(Math.round(5 + d / 15 + Math.random() * 3), 1, 10), craving: U.clamp(Math.round(7 - d / 12 + Math.random() * 2), 1, 10),
          stress: U.clamp(Math.round(6 + Math.random() * 3 - 2), 1, 10), sleep: U.clamp(Math.round(5 + Math.random() * 4), 1, 10),
          smoked: false, hard: '', good: '', t
        };
      }
    }
    st.cravings.sort((a, b) => a.t - b.t);
    if (kind === 'long') st.habits.push({ id: U.id(), name: 'الإكثار من الهاتف ليلًا', goal: 'لا هاتف بعد 23:00', start: now - 40 * U.DAY, events: [{ t: now - 9 * U.DAY, type: 'slip', trigger: 'bored' }, { t: now - 3 * U.DAY, type: 'craving', intensity: 6, trigger: 'alone' }], notes: {} });
    S.state = st;
    S.checkAch();
    st.activity = [{ t: now, icon: '🧪', text: 'وضع التجربة مفعّل' }];
    if (kind === 'craving') st.active = { start: now, end: now + 5 * U.MIN, intensity: 9, trigger: 'stress', did: ['wait'], mins: 5, phase: 'timer' };
    S.saveNow();
  };
  S.restoreReal = () => {
    try {
      const b = localStorage.getItem(BACKUP);
      if (b) { localStorage.setItem(KEY, b); localStorage.removeItem(BACKUP); } else { localStorage.removeItem(KEY); }
    } catch (e) { /* ignore */ }
    S.state = fresh();
    S.load();
  };
})(window.App);
