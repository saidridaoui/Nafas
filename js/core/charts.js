/* Small SVG charts without libraries. Charts are drawn left to right in time,
   so the SVG is always LTR even inside the Arabic page. */
(function (A) {
  'use strict';
  const U = A.util;
  const Ch = A.charts = {};
  const W = 400;
  const H = 170;
  const PAD = { l: 30, r: 8, t: 10, b: 24 };

  const axis = (max, fmt) => {
    let s = '';
    [0, 0.5, 1].forEach(f => {
      const y = PAD.t + (H - PAD.t - PAD.b) * (1 - f);
      s += '<line x1="' + PAD.l + '" x2="' + (W - PAD.r) + '" y1="' + y + '" y2="' + y + '" class="grid"/>' +
        '<text x="' + (PAD.l - 6) + '" y="' + (y + 4) + '" class="ax" text-anchor="end">' + (fmt ? fmt(max * f) : U.num(max * f, max < 5 ? 1 : 0)) + '</text>';
    });
    return s;
  };
  const xLabels = (labels, x) => {
    const step = Math.ceil(labels.length / 8);
    return labels.map((l, i) => (i % step === 0 ? '<text x="' + x(i) + '" y="' + (H - 6) + '" class="ax" text-anchor="middle">' + U.esc(l) + '</text>' : '')).join('');
  };
  const wrap = (inner, title) => '<figure class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" dir="ltr" role="img" aria-label="' + U.esc(title || '') + '">' + inner + '</svg></figure>';

  Ch.bars = (values, labels, opt) => {
    opt = opt || {};
    const max = Math.max(opt.min || 1, ...values);
    const n = values.length || 1;
    const bw = (W - PAD.l - PAD.r) / n;
    const x = i => PAD.l + bw * i + bw / 2;
    const h = v => (H - PAD.t - PAD.b) * (v / max);
    const bars = values.map((v, i) => '<rect x="' + (x(i) - bw * 0.36) + '" y="' + (H - PAD.b - h(v)) + '" width="' + (bw * 0.72) + '" height="' + Math.max(v ? 1.5 : 0, h(v)) + '" rx="3" class="' + (opt.cls || 'b1') + '"><title>' + U.esc(labels[i]) + ': ' + U.num(v, 1) + '</title></rect>').join('');
    return wrap(axis(max, opt.fmt) + bars + xLabels(labels, x), opt.title);
  };

  /* series: [{name, values, cls}] values may contain null. */
  Ch.lines = (series, labels, opt) => {
    opt = opt || {};
    const all = [].concat(...series.map(s => s.values)).filter(v => v != null);
    const max = opt.max || Math.max(1, ...all);
    const n = labels.length;
    const x = i => PAD.l + (n <= 1 ? 0 : (W - PAD.l - PAD.r) * i / (n - 1));
    const y = v => PAD.t + (H - PAD.t - PAD.b) * (1 - v / max);
    const paths = series.map(s => {
      let d = '';
      let dots = '';
      s.values.forEach((v, i) => {
        if (v == null) return;
        d += (d && s.values[i - 1] != null ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' ';
        if (n <= 31) dots += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3" class="' + s.cls + '"><title>' + U.esc(labels[i]) + ': ' + U.num(v, 1) + '</title></circle>';
      });
      return '<path d="' + d + '" class="ln ' + s.cls + '"/>' + dots;
    }).join('');
    const legend = series.length > 1 ? '<figcaption class="legend">' + series.map(s => '<span class="' + s.cls + '">' + U.esc(s.name) + '</span>').join('') + '</figcaption>' : '';
    return wrap(axis(max, opt.fmt) + paths + xLabels(labels, x), opt.title).replace('</figure>', legend + '</figure>');
  };

  /* Horizontal ranking bars in HTML, which suits Arabic labels better. */
  Ch.rank = (rows, fmt) => {
    if (!rows.length) return '<p class="muted">لا توجد بيانات كافية بعد.</p>';
    const max = Math.max(...rows.map(r => r[1]));
    return '<div class="rank">' + rows.map(r => '<div class="rRow"><span>' + r[0] + '</span>' + U.bar(U.pct(r[1], max)) + '<b>' + (fmt ? fmt(r[1], r) : r[1]) + '</b></div>').join('') + '</div>';
  };
})(window.App);
