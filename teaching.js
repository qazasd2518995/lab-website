/* ==============================================
   L-DAHS · Teaching detail pages — widgets
   Loaded only by teach-*.html, after script.js.
   Reuses window.LDAHS helpers (doRender, …).
   ============================================== */

(() => {
  'use strict';

  const LDAHS = window.LDAHS || {};
  const doRender = LDAHS.doRender || (() => {});

  /* ─────────────────────────────────────────────
     statDist — t / F distribution math
     Regularised incomplete beta + log-gamma give
     CDFs and (via bisection) critical values, so
     the curves and the lookup tables agree exactly.
     ───────────────────────────────────────────── */
  const statDist = (() => {
    function gammaln(x) {
      const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
                 -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
      let y = x, tmp = x + 5.5;
      tmp -= (x + 0.5) * Math.log(tmp);
      let ser = 1.000000000190015;
      for (let j = 0; j < 6; j++) { y += 1; ser += c[j] / y; }
      return -tmp + Math.log(2.5066282746310005 * ser / x);
    }
    // Continued fraction for the incomplete beta function.
    function betacf(a, b, x) {
      const FPMIN = 1e-30;
      let qab = a + b, qap = a + 1, qam = a - 1;
      let c = 1, d = 1 - qab * x / qap;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      d = 1 / d;
      let h = d;
      for (let m = 1; m <= 200; m++) {
        const m2 = 2 * m;
        let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d; h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        const del = d * c; h *= del;
        if (Math.abs(del - 1) < 3e-7) break;
      }
      return h;
    }
    // Regularised incomplete beta I_x(a,b).
    function betai(a, b, x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) +
                          a * Math.log(x) + b * Math.log(1 - x));
      if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
      return 1 - bt * betacf(b, a, 1 - x) / b;
    }

    // Student-t CDF, P(T ≤ t) for df degrees of freedom.
    function tCdf(t, df) {
      const x = df / (df + t * t);
      const ib = 0.5 * betai(df / 2, 0.5, x);
      return t >= 0 ? 1 - ib : ib;
    }
    // Student-t PDF.
    function tPdf(t, df) {
      const lg = gammaln((df + 1) / 2) - gammaln(df / 2);
      const norm = Math.exp(lg) / Math.sqrt(df * Math.PI);
      return norm * Math.pow(1 + t * t / df, -(df + 1) / 2);
    }
    // Two-tailed (tail=2) or one-tailed (tail=1) t critical value via bisection.
    function tCrit(alpha, df, tail) {
      const p = tail === 2 ? 1 - alpha / 2 : 1 - alpha; // target upper CDF
      let lo = 0, hi = 1000;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (tCdf(mid, df) < p) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }

    // F CDF, P(F ≤ f) for (df1, df2).
    function fCdf(f, df1, df2) {
      if (f <= 0) return 0;
      const x = df1 * f / (df1 * f + df2);
      return betai(df1 / 2, df2 / 2, x);
    }
    // F PDF.
    function fPdf(f, df1, df2) {
      if (f <= 0) return 0;
      const lb = gammaln((df1 + df2) / 2) - gammaln(df1 / 2) - gammaln(df2 / 2);
      return Math.exp(lb) * Math.pow(df1 / df2, df1 / 2) *
             Math.pow(f, df1 / 2 - 1) * Math.pow(1 + df1 * f / df2, -(df1 + df2) / 2);
    }
    // Upper-tail F critical value via bisection.
    function fCrit(alpha, df1, df2) {
      const p = 1 - alpha;
      let lo = 0, hi = 10000;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (fCdf(mid, df1, df2) < p) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }

    return { tPdf, tCdf, tCrit, fPdf, fCdf, fCrit };
  })();

  /* ─────────────────────────────────────────────
     Interactive Student-t critical value table
     data-widget="t-table"
     ───────────────────────────────────────────── */
  const T_ALPHAS = [0.10, 0.05, 0.02, 0.01, 0.001];
  const T_DATA = [
    { df: 1,  v: [6.314, 12.706, 31.821, 63.657, 636.619] },
    { df: 2,  v: [2.920, 4.303, 6.965, 9.925, 31.599] },
    { df: 3,  v: [2.353, 3.182, 4.541, 5.841, 12.924] },
    { df: 4,  v: [2.132, 2.776, 3.747, 4.604, 8.610] },
    { df: 5,  v: [2.015, 2.571, 3.365, 4.032, 6.869] },
    { df: 6,  v: [1.943, 2.447, 3.143, 3.707, 5.959] },
    { df: 7,  v: [1.895, 2.365, 2.998, 3.499, 5.408] },
    { df: 8,  v: [1.860, 2.306, 2.896, 3.355, 5.041] },
    { df: 9,  v: [1.833, 2.262, 2.821, 3.250, 4.781] },
    { df: 10, v: [1.812, 2.228, 2.764, 3.169, 4.587] },
    { df: 11, v: [1.796, 2.201, 2.718, 3.106, 4.437] },
    { df: 12, v: [1.782, 2.179, 2.681, 3.055, 4.318] },
    { df: 13, v: [1.771, 2.160, 2.650, 3.012, 4.221] },
    { df: 14, v: [1.761, 2.145, 2.624, 2.977, 4.140] },
    { df: 15, v: [1.753, 2.131, 2.602, 2.947, 4.073] },
    { df: 16, v: [1.746, 2.120, 2.583, 2.921, 4.015] },
    { df: 17, v: [1.740, 2.110, 2.567, 2.898, 3.965] },
    { df: 18, v: [1.734, 2.101, 2.552, 2.878, 3.922] },
    { df: 19, v: [1.729, 2.093, 2.539, 2.861, 3.883] },
    { df: 20, v: [1.725, 2.086, 2.528, 2.845, 3.850] },
    { df: 21, v: [1.721, 2.080, 2.518, 2.831, 3.819] },
    { df: 22, v: [1.717, 2.074, 2.508, 2.819, 3.792] },
    { df: 23, v: [1.714, 2.069, 2.500, 2.807, 3.768] },
    { df: 24, v: [1.711, 2.064, 2.492, 2.797, 3.745] },
    { df: 25, v: [1.708, 2.060, 2.485, 2.787, 3.725] },
    { df: 26, v: [1.706, 2.056, 2.479, 2.779, 3.707] },
    { df: 27, v: [1.703, 2.052, 2.473, 2.771, 3.690] },
    { df: 28, v: [1.701, 2.048, 2.467, 2.763, 3.674] },
    { df: 29, v: [1.699, 2.045, 2.462, 2.756, 3.659] },
    { df: 30, v: [1.697, 2.042, 2.457, 2.750, 3.646] },
    { df: 40, v: [1.684, 2.021, 2.423, 2.704, 3.551] },
    { df: 60, v: [1.671, 2.000, 2.390, 2.660, 3.460] },
    { df: 120, v: [1.658, 1.980, 2.358, 2.617, 3.373] },
    { df: '∞', v: [1.645, 1.960, 2.326, 2.576, 3.291] }
  ];
  const T_GAP_BEFORE = new Set([6, 11, 16, 21, 26, 40]);

  function fmtAlpha(a) { return a.toString().replace(/^0\./, '.'); }

  function buildTTable(el) {
    const state = { df: 24, a: 0.05, tail: 2 };
    el.innerHTML =
      `<div class="tt-controls">` +
        `<label class="tt-field"><span>df</span><select class="tt-df"></select></label>` +
        `<label class="tt-field"><span class="tt-nocaps">α (tail)</span><select class="tt-a"></select></label>` +
        `<div class="tt-tail" role="group" aria-label="Tail">` +
          `<button type="button" data-tail="1">one-tailed</button>` +
          `<button type="button" data-tail="2" class="on">two-tailed</button>` +
        `</div>` +
      `</div>` +
      `<div class="tt-readout" aria-live="polite"></div>` +
      `<div class="tt-scroll"><table class="t-table"><thead>` +
        `<tr><th class="tt-grp" colspan="6"></th></tr>` +
        `<tr class="tt-ahead"></tr>` +
      `</thead><tbody class="tt-body"></tbody></table></div>`;

    const dfSel = el.querySelector('.tt-df');
    const aSel = el.querySelector('.tt-a');
    const grp = el.querySelector('.tt-grp');
    const ahead = el.querySelector('.tt-ahead');
    const tbody = el.querySelector('.tt-body');
    const readout = el.querySelector('.tt-readout');

    T_DATA.forEach(r => {
      const o = document.createElement('option');
      o.value = r.df; o.textContent = r.df;
      if (r.df === state.df) o.selected = true;
      dfSel.appendChild(o);
    });

    function fillAlpha() {
      aSel.innerHTML = '';
      T_ALPHAS.forEach(a => {
        const o = document.createElement('option');
        o.value = a;
        o.textContent = fmtAlpha(state.tail === 2 ? a : a / 2);
        if (a === state.a) o.selected = true;
        aSel.appendChild(o);
      });
    }

    function buildHead() {
      grp.textContent = state.tail === 2
        ? 'Two-tailed significance level  α'
        : 'One-tailed significance level  α';
      ahead.innerHTML = '<th>df</th>';
      T_ALPHAS.forEach((a, i) => {
        const shown = state.tail === 2 ? a : a / 2;
        const other = state.tail === 2 ? a / 2 : a;
        const th = document.createElement('th');
        th.dataset.col = i;
        th.innerHTML = `${fmtAlpha(shown)}<span class="tt-sub">${state.tail === 2 ? '1-tail ' : '2-tail '}${fmtAlpha(other)}</span>`;
        if (a === state.a) th.classList.add('col-on');
        th.onclick = () => { state.a = a; aSel.value = a; render(); };
        ahead.appendChild(th);
      });
    }

    function buildBody() {
      tbody.innerHTML = '';
      const ai = T_ALPHAS.indexOf(state.a);
      T_DATA.forEach(r => {
        const tr = document.createElement('tr');
        if (T_GAP_BEFORE.has(r.df)) tr.classList.add('gap');
        if (r.df === '∞') tr.classList.add('gap', 'inf-row');
        if (r.df === state.df) tr.classList.add('row-on');
        let html = `<td class="dfcell">${r.df}</td>`;
        r.v.forEach((val, i) => {
          let cls = '';
          if (i === ai) cls = 'col-on';
          if (r.df === state.df && i === ai) cls = 'cell-on';
          html += `<td class="${cls}">${val.toFixed(3)}</td>`;
        });
        tr.innerHTML = html;
        tr.querySelector('.dfcell').onclick = () => { state.df = r.df; dfSel.value = r.df; render(); };
        tbody.appendChild(tr);
      });
    }

    function doReadout() {
      const row = T_DATA.find(r => String(r.df) === String(state.df));
      const cv = row.v[T_ALPHAS.indexOf(state.a)];
      const shown = fmtAlpha(state.tail === 2 ? state.a : state.a / 2);
      const tailWord = state.tail === 2 ? 'two-tailed' : 'one-tailed';
      readout.innerHTML =
        `<div class="tt-big">t<sub>crit</sub> = ${cv.toFixed(3)}</div>` +
        `<div class="tt-lab">df = ${state.df} · ${tailWord} α = ${shown}</div>`;
    }

    function render() { fillAlpha(); buildHead(); buildBody(); doReadout(); }

    dfSel.onchange = e => { state.df = isNaN(+e.target.value) ? '∞' : +e.target.value; render(); };
    aSel.onchange = e => { state.a = +e.target.value; render(); };
    el.querySelectorAll('.tt-tail button').forEach(b => {
      b.onclick = () => {
        el.querySelectorAll('.tt-tail button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        state.tail = +b.dataset.tail;
        render();
      };
    });

    render();
  }

  /* ─────────────────────────────────────────────
     Distribution curve (t or F) with rejection
     region shading and an optional observed marker.
     data-widget="dist-curve"
     data-type="t|f" data-df="" data-df2="" data-alpha=""
     data-tail="1|2" data-stat=""
     ───────────────────────────────────────────── */
  function buildDistCurve(el) {
    const type = (el.dataset.type || 't').toLowerCase();
    const df = +(el.dataset.df || 10);
    const df2 = +(el.dataset.df2 || 10);
    const alpha = +(el.dataset.alpha || 0.05);
    const tail = +(el.dataset.tail || (type === 'f' ? 1 : 2));
    const stat = el.dataset.stat != null && el.dataset.stat !== '' ? +el.dataset.stat : null;

    const W = 520, H = 240, padL = 16, padR = 16, padB = 34, padT = 16;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const baseY = H - padB;

    // x-domain and pdf
    let xMin, xMax, crit, pdf;
    if (type === 'f') {
      crit = statDist.fCrit(alpha, df, df2);
      xMin = 0;
      xMax = Math.max(crit * 1.8, stat != null ? stat * 1.3 : 0, 5);
      pdf = x => statDist.fPdf(x, df, df2);
    } else {
      crit = statDist.tCrit(alpha, df, tail);
      xMax = Math.max(crit * 1.4, stat != null ? Math.abs(stat) * 1.25 : 0, 4);
      xMin = -xMax;
      pdf = x => statDist.tPdf(x, df);
    }

    const N = 240;
    const xs = [], ys = [];
    let yMax = 0;
    for (let i = 0; i <= N; i++) {
      const x = xMin + (xMax - xMin) * i / N;
      const y = pdf(x);
      xs.push(x); ys.push(y);
      if (y > yMax) yMax = y;
    }
    yMax *= 1.08;
    const sx = x => padL + (x - xMin) / (xMax - xMin) * plotW;
    const sy = y => baseY - (y / yMax) * plotH;

    const curve = xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(ys[i]).toFixed(1)}`).join('');

    // rejection-region shaded paths
    function regionPath(fromX, toX) {
      let d = `M${sx(fromX).toFixed(1)},${baseY.toFixed(1)}`;
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const x = fromX + (toX - fromX) * i / steps;
        d += `L${sx(x).toFixed(1)},${sy(pdf(x)).toFixed(1)}`;
      }
      d += `L${sx(toX).toFixed(1)},${baseY.toFixed(1)}Z`;
      return d;
    }
    const shades = [];
    const lines = [];
    const labels = [];
    const accent = '#ffb74d';
    if (type === 'f' || tail === 1) {
      shades.push(regionPath(crit, xMax));
      lines.push(crit);
    } else {
      shades.push(regionPath(crit, xMax));
      shades.push(regionPath(xMin, -crit));
      lines.push(crit, -crit);
    }

    const shadeSVG = shades.map(d => `<path d="${d}" fill="${accent}" opacity="0.28"/>`).join('');
    const lineSVG = lines.map(c =>
      `<line x1="${sx(c).toFixed(1)}" y1="${baseY}" x2="${sx(c).toFixed(1)}" y2="${(padT + 6).toFixed(1)}" stroke="${accent}" stroke-width="1.3" stroke-dasharray="4,3"/>` +
      `<text x="${sx(c).toFixed(1)}" y="${(padT).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="${accent}">${c < 0 ? '−' : ''}${Math.abs(c).toFixed(3)}</text>`
    ).join('');

    let statSVG = '';
    if (stat != null) {
      const teal = '#34e3cf';
      statSVG =
        `<line x1="${sx(stat).toFixed(1)}" y1="${baseY}" x2="${sx(stat).toFixed(1)}" y2="${(padT + 6).toFixed(1)}" stroke="${teal}" stroke-width="1.6"/>` +
        `<circle cx="${sx(stat).toFixed(1)}" cy="${sy(pdf(stat)).toFixed(1)}" r="3.5" fill="${teal}"/>` +
        `<text x="${sx(stat).toFixed(1)}" y="${(baseY + 24).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="${teal}">obs ${(type === 'f' ? 'F' : 't')} = ${stat.toFixed(2)}</text>`;
    }

    const axisLabel = type === 'f' ? 'F' : 't';
    const aria = `${type === 'f' ? 'F' : 't'}-distribution with rejection region at the ${alpha} level`;
    el.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${aria}">` +
        `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="#6b7596" stroke-width="0.8"/>` +
        `<path d="${curve}" fill="none" stroke="#e9e7dd" stroke-width="1.8"/>` +
        shadeSVG + lineSVG + statSVG +
        `<text x="${(W - padR).toFixed(1)}" y="${(baseY + 24).toFixed(1)}" text-anchor="end" font-family="Fraunces, serif" font-style="italic" font-size="13" fill="#6b7596">${axisLabel}</text>` +
      `</svg>`;
  }

  /* ─────────────────────────────────────────────
     Interactive F critical-value table
     data-widget="f-table" data-alpha="0.05"
     Values are computed live, so any df works.
     ───────────────────────────────────────────── */
  const F_DF1 = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 60];
  const F_DF2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 30, 40, 60, 120];
  const F_ALPHAS = [0.10, 0.05, 0.025, 0.01, 0.001];

  function fHeat(f) {
    // log scale 1→~12 mapped teal(low)→amber→pink(high)
    const t = Math.max(0, Math.min(1, Math.log(Math.max(f, 1)) / Math.log(12)));
    const stops = [[0, [52, 227, 207]], [0.5, [255, 183, 77]], [1, [255, 93, 143]]];
    let c = stops[stops.length - 1][1];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i], f2 = (t - a[0]) / (b[0] - a[0]);
        c = a[1].map((v, k) => Math.round(v + (b[1][k] - v) * f2));
        break;
      }
    }
    return `rgba(${c[0]},${c[1]},${c[2]},0.16)`;
  }

  function buildFTable(el) {
    let alpha = +(el.dataset.alpha || 0.05);
    el.innerHTML =
      `<div class="ft-controls">` +
        `<div class="ft-alpha" role="group" aria-label="Significance level">` +
          F_ALPHAS.map(a => `<button type="button" data-a="${a}"${a === alpha ? ' class="on"' : ''}>${fmtAlpha(a)}</button>`).join('') +
        `</div>` +
        `<div class="ft-quick">` +
          `<label>df₁ <input class="ft-d1" type="number" min="1" value="3"></label>` +
          `<label>df₂ <input class="ft-d2" type="number" min="1" value="16"></label>` +
          `<span class="ft-quick-out" aria-live="polite"></span>` +
        `</div>` +
      `</div>` +
      `<div class="ft-scroll"><table class="f-table"><thead></thead><tbody></tbody></table></div>`;

    const head = el.querySelector('.f-table thead');
    const body = el.querySelector('.f-table tbody');
    const quickOut = el.querySelector('.ft-quick-out');
    const d1in = el.querySelector('.ft-d1');
    const d2in = el.querySelector('.ft-d2');

    function buildGrid() {
      head.innerHTML = '<tr><th class="ft-corner">df₂ \\ df₁</th>' +
        F_DF1.map(d1 => `<th>${d1}</th>`).join('') + '</tr>';
      body.innerHTML = '';
      F_DF2.forEach(d2 => {
        const tr = document.createElement('tr');
        let html = `<th class="ft-row">${d2}</th>`;
        F_DF1.forEach(d1 => {
          const f = statDist.fCrit(alpha, d1, d2);
          html += `<td style="background:${fHeat(f)}" data-d1="${d1}" data-d2="${d2}">${f.toFixed(2)}</td>`;
        });
        tr.innerHTML = html;
        body.appendChild(tr);
      });
      // crosshair highlight on hover
      body.querySelectorAll('td').forEach(td => {
        td.addEventListener('mouseenter', () => {
          const ci = td.cellIndex;
          body.querySelectorAll('td, th').forEach(c => c.classList.remove('ft-hot'));
          body.querySelectorAll('tr').forEach(tr => {
            const cell = tr.children[ci]; if (cell) cell.classList.add('ft-hot');
          });
          [...td.parentNode.children].forEach(c => c.classList.add('ft-hot'));
        });
      });
      body.addEventListener('mouseleave', () => body.querySelectorAll('.ft-hot').forEach(c => c.classList.remove('ft-hot')));
    }

    function quick() {
      const d1 = Math.max(1, +d1in.value || 1);
      const d2 = Math.max(1, +d2in.value || 1);
      const f = statDist.fCrit(alpha, d1, d2);
      quickOut.innerHTML = `F<sub>crit</sub>(${d1}, ${d2}) = <strong>${f.toFixed(3)}</strong>`;
    }

    el.querySelectorAll('.ft-alpha button').forEach(b => {
      b.onclick = () => {
        el.querySelectorAll('.ft-alpha button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        alpha = +b.dataset.a;
        buildGrid(); quick();
      };
    });
    d1in.oninput = quick; d2in.oninput = quick;
    buildGrid(); quick();
  }

  /* ─────────────────────────────────────────────
     ANOVA summary table
     data-widget="anova-table" data-rows='[...]' data-total='{...}'
     Each row: {src, ss, df, ms, f, p}  (ms/f/p optional)
     ───────────────────────────────────────────── */
  function buildAnovaTable(el) {
    let rows = [], total = null;
    try { rows = JSON.parse(el.dataset.rows || '[]'); } catch (e) {}
    try { total = el.dataset.total ? JSON.parse(el.dataset.total) : null; } catch (e) {}
    const cell = v => (v === undefined || v === null || v === '') ? '—' : v;
    const tr = (r, cls) =>
      `<tr${cls ? ` class="${cls}"` : ''}>` +
        `<td class="src">${r.src}</td>` +
        `<td>${cell(r.ss)}</td><td>${cell(r.df)}</td><td>${cell(r.ms)}</td>` +
        `<td>${cell(r.f)}</td><td>${cell(r.p)}</td>` +
      `</tr>`;
    el.innerHTML =
      `<table class="tm-anova"><thead><tr>` +
        `<th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th><th>p</th>` +
      `</tr></thead><tbody>` +
        rows.map(r => tr(r, r.src && /total/i.test(r.src) ? 'total' : '')).join('') +
        (total ? tr(total, 'total') : '') +
      `</tbody></table>`;
  }

  /* ─────────────────────────────────────────────
     F-ratio simulator — drag MS_between / MS_within,
     watch F move past its critical value.
     data-widget="f-sim" data-df1="2" data-df2="12" data-alpha="0.05"
     ───────────────────────────────────────────── */
  function buildFRatioSim(el) {
    const df1 = +(el.dataset.df1 || 2);
    const df2 = +(el.dataset.df2 || 12);
    const alpha = +(el.dataset.alpha || 0.05);
    const crit = statDist.fCrit(alpha, df1, df2);
    let msB = 45, msW = 15;

    el.innerHTML =
      `<div class="fs-row"><label>MS<sub>between</sub> <output class="fs-b">${msB}</output></label>` +
        `<input class="fs-sb" type="range" min="1" max="100" step="1" value="${msB}"></div>` +
      `<div class="fs-row"><label>MS<sub>within</sub> <output class="fs-w">${msW}</output></label>` +
        `<input class="fs-sw" type="range" min="1" max="100" step="1" value="${msW}"></div>` +
      `<div class="fs-bar"><div class="fs-fill"></div><div class="fs-crit" title="critical F"></div></div>` +
      `<div class="fs-verdict" aria-live="polite"></div>`;

    const bOut = el.querySelector('.fs-b'), wOut = el.querySelector('.fs-w');
    const fill = el.querySelector('.fs-fill'), critMark = el.querySelector('.fs-crit');
    const verdict = el.querySelector('.fs-verdict');
    const sb = el.querySelector('.fs-sb'), sw = el.querySelector('.fs-sw');
    const SCALE = Math.max(crit * 2.2, 6); // bar spans 0..SCALE in F units

    function update() {
      msB = +sb.value; msW = +sw.value;
      bOut.textContent = msB; wOut.textContent = msW;
      const F = msB / msW;
      const pct = Math.min(100, F / SCALE * 100);
      const critPct = Math.min(100, crit / SCALE * 100);
      const sig = F >= crit;
      fill.style.width = pct + '%';
      fill.style.background = sig ? 'var(--d3)' : 'var(--d1)';
      critMark.style.left = critPct + '%';
      verdict.innerHTML = `F = ${msB}/${msW} = <strong>${F.toFixed(2)}</strong> &nbsp;·&nbsp; F<sub>crit</sub>(${df1},${df2}) = ${crit.toFixed(2)} &nbsp;→&nbsp; ` +
        (sig ? `<span class="fs-yes">reject H₀</span>` : `<span class="fs-no">fail to reject</span>`);
    }
    sb.oninput = update; sw.oninput = update;
    update();
  }

  /* ─────────────────────────────────────────────
     Widget registry + bootstrap
     ───────────────────────────────────────────── */
  const TEACH_WIDGETS = {
    't-table': buildTTable,
    'dist-curve': buildDistCurve,
    'f-table': buildFTable,
    'anova-table': buildAnovaTable,
    'f-sim': buildFRatioSim
  };

  function setupWidgets() {
    document.querySelectorAll('[data-widget]').forEach(el => {
      const fn = TEACH_WIDGETS[el.dataset.widget];
      if (fn) {
        try { fn(el); }
        catch (e) { console.error('widget failed:', el.dataset.widget, e); }
      }
    });
  }

  // Prev / next navigation injected from a fixed unit order.
  const UNIT_ORDER = [
    { id: 'sampling', num: '01', title: 'Sampling distribution & standard error' },
    { id: 'tdist',    num: '02', title: 'The t-distribution & critical values' },
    { id: 'twomeans', num: '03', title: 'Two means, six tests' },
    { id: 'paired',   num: '04', title: 'The paired-samples t-test' },
    { id: 'anova',    num: '05', title: 'One-way ANOVA' },
    { id: 'rmanova',  num: '06', title: 'Repeated-measures ANOVA' },
    { id: 'ttof',     num: '07', title: 'From t to F · one view' }
  ];

  function setupUnitNav() {
    const navEl = document.querySelector('[data-teach-nav]');
    if (!navEl) return;
    const cur = navEl.dataset.teachNav;
    const idx = UNIT_ORDER.findIndex(u => u.id === cur);
    if (idx < 0) return;
    const prev = UNIT_ORDER[idx - 1];
    const next = UNIT_ORDER[idx + 1];
    const link = (u, dir) => u
      ? `<a class="teach-nav-link ${dir}" href="teach-${u.id}.html">` +
          `<span class="tn-dir">${dir === 'prev' ? '← Previous' : 'Next →'}</span>` +
          `<span class="tn-num">${u.num}</span><span class="tn-title">${u.title}</span>` +
        `</a>`
      : `<span class="teach-nav-link ${dir} disabled"></span>`;
    navEl.innerHTML = link(prev, 'prev') + link(next, 'next');
  }

  function start() {
    setupWidgets();
    setupUnitNav();
    // Render any KaTeX inside the freshly built widgets / page body.
    doRender(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
