/* ==============================================
   L-DAHS · Latent Manifold Lab — interactions
   ============================================== */

(() => {
  'use strict';

  /* ───────── helpers ───────── */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260524);
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function hexToRgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function lerpColor(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
  }

  const CONF = { responsive: true, displayModeBar: false };

  const AX3 = (t, c) => ({
    title: { text: t, font: { family: 'JetBrains Mono', size: 11, color: c } },
    showbackground: true,
    backgroundcolor: 'rgba(11,17,36,0.55)',
    gridcolor: 'rgba(150,170,220,0.16)',
    zerolinecolor: 'rgba(150,170,220,0.3)',
    tickfont: { family: 'JetBrains Mono', size: 9, color: '#6b7596' },
    color: '#a9b2cc'
  });
  function LAYOUT3D(xt, yt, zt) {
    return {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 0, r: 0, t: 6, b: 0 },
      showlegend: false,
      font: { family: 'Spectral', color: '#e9e7dd' },
      scene: {
        xaxis: AX3(xt, '#34e3cf'),
        yaxis: AX3(yt, '#ffb74d'),
        zaxis: AX3(zt, '#ff5d8f'),
        camera: { eye: { x: 1.5, y: 1.45, z: 1.0 } },
        aspectmode: 'cube'
      }
    };
  }
  function ax2(t) {
    return {
      title: { text: t, font: { family: 'JetBrains Mono', size: 11, color: '#a9b2cc' } },
      gridcolor: 'rgba(150,170,220,0.12)',
      zerolinecolor: 'rgba(150,170,220,0.28)',
      tickfont: { family: 'JetBrains Mono', size: 9, color: '#6b7596' },
      color: '#a9b2cc'
    };
  }
  function LAYOUT2D(xt, yt, extra) {
    return Object.assign({
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 58, r: 16, t: 10, b: 46 },
      showlegend: false,
      font: { family: 'Spectral', color: '#e9e7dd', size: 12 },
      xaxis: ax2(xt),
      yaxis: ax2(yt)
    }, extra || {});
  }

  /* ───────── Plotly + KaTeX loaders ───────── */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => res(src);
      s.onerror = () => rej(new Error('failed ' + src));
      document.head.appendChild(s);
    });
  }
  async function ensurePlotly() {
    if (window.Plotly) return true;
    const urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.35.2/plotly.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.27.0/plotly.min.js',
      'https://cdn.plot.ly/plotly-2.27.0.min.js'
    ];
    for (const u of urls) {
      try { await loadScript(u); if (window.Plotly) return true; } catch (e) { /* try next */ }
    }
    return !!window.Plotly;
  }

  function setPlotMsg(ids, txt) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      // Don't overwrite a rendered Plotly chart
      if (el.dataset.plotted === '1' || el.classList.contains('js-plotly-plot')) return;
      el.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:.82rem;color:#6b7596;text-align:center;padding:24px;line-height:1.7">${txt}</div>`;
    });
  }

  /* ───────── FIGURES (3D hero set) ───────── */
  function buildFig1() {
    const L = [
      [1.00, 0.00, 0.00],
      [0.45, 0.89, 0.00],
      [-0.30, -0.22, 0.93]
    ];
    const mus = [
      [1.4, 1.1, -0.9],
      [-1.3, -0.4, 0.3],
      [0.2, -1.2, 1.5]
    ];
    const N = 300, x = [], y = [], z = [], c = [], txt = [];
    for (let i = 0; i < N; i++) {
      const g = Math.floor(rng() * 3);
      const zz = [randn(), randn(), randn()];
      const f = [0, 0, 0];
      for (let r = 0; r < 3; r++) {
        let s = mus[g][r];
        for (let k = 0; k <= r; k++) s += L[r][k] * zz[k];
        f[r] = s;
      }
      const ach = 0.8 * f[0] + 0.6 * f[1] - 0.5 * f[2] + 0.4 * randn();
      x.push(f[0]); y.push(f[1]); z.push(f[2]); c.push(ach);
      txt.push(`profile ${g + 1}<br>η = ${ach.toFixed(2)}`);
    }
    const trace = {
      type: 'scatter3d', mode: 'markers', x, y, z, text: txt, hoverinfo: 'text',
      marker: {
        size: 5.5, color: c,
        colorscale: [[0, '#1b2660'], [0.25, '#34e3cf'], [0.5, '#7c8cff'], [0.75, '#ffb74d'], [1, '#ff5d8f']],
        opacity: 0.92, line: { width: 0.4, color: 'rgba(255,255,255,0.25)' },
        colorbar: { title: { text: 'η', font: { color: '#a9b2cc', family: 'JetBrains Mono' } }, thickness: 10, len: 0.6, outlinewidth: 0, tickfont: { color: '#6b7596', size: 9, family: 'JetBrains Mono' } }
      }
    };
    Plotly.newPlot('fig1', [trace], LAYOUT3D('ξ₁ Aptitude', 'ξ₂ Motivation', 'ξ₃ Anxiety'), CONF);
  }

  function buildFig2() {
    const a1 = 1.1, a2 = 0.9, d = 0.2, G = 46, lo = -3, hi = 3, step = (hi - lo) / (G - 1);
    const xs = [], ys = [], zg = [];
    for (let i = 0; i < G; i++) { xs.push(lo + i * step); ys.push(lo + i * step); }
    for (let j = 0; j < G; j++) {
      const row = [];
      for (let i = 0; i < G; i++) {
        const t1 = xs[i], t2 = ys[j];
        row.push(1 / (1 + Math.exp(-(a1 * t1 + a2 * t2 - d))));
      }
      zg.push(row);
    }
    const trace = {
      type: 'surface', x: xs, y: ys, z: zg,
      colorscale: [[0, '#14224f'], [0.3, '#2a6fb0'], [0.55, '#34e3cf'], [0.8, '#ffb74d'], [1, '#ff5d8f']],
      showscale: true,
      colorbar: { title: { text: 'P', font: { color: '#a9b2cc', family: 'JetBrains Mono' } }, thickness: 10, len: 0.6, outlinewidth: 0, tickfont: { color: '#6b7596', size: 9, family: 'JetBrains Mono' } },
      contours: { z: { show: true, usecolormap: true, project: { z: true }, width: 1 } },
      lighting: { ambient: 0.65, diffuse: 0.8, specular: 0.15, roughness: 0.85 },
      opacity: 0.98
    };
    const lay = LAYOUT3D('θ₁ Ability', 'θ₂ Ability', 'P(mastery)');
    lay.scene.zaxis.range = [0, 1];
    Plotly.newPlot('fig2', [trace], lay, CONF);
  }

  function buildFig3() {
    const sigma = 10, rho = 28, beta = 8 / 3, dt = 0.008, steps = 2600;
    function deriv(s) { return [sigma * (s[1] - s[0]), s[0] * (rho - s[2]) - s[1], s[0] * s[1] - beta * s[2]]; }
    function rk4(s) {
      const k1 = deriv(s);
      const k2 = deriv(s.map((v, i) => v + dt / 2 * k1[i]));
      const k3 = deriv(s.map((v, i) => v + dt / 2 * k2[i]));
      const k4 = deriv(s.map((v, i) => v + dt * k3[i]));
      return s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    }
    const palettes = ['#34e3cf', '#ffb74d', '#ff5d8f', '#7c8cff'];
    const traces = [];
    const inits = [[0.10, 0, 0], [0.12, 0, 0], [0.08, 0, 0], [0.10, 0.02, 0]];
    inits.forEach((s0, ti) => {
      let s = s0.slice();
      const x = [], y = [], z = [], col = [];
      for (let n = 0; n < steps; n++) {
        x.push(s[0]); y.push(s[1]); z.push(s[2]); col.push(n);
        s = rk4(s);
      }
      traces.push({
        type: 'scatter3d', mode: 'lines', x, y, z,
        line: { width: 2.4, color: col, colorscale: [[0, '#10204d'], [0.5, palettes[ti]], [1, '#ffffff']] },
        opacity: 0.9, hoverinfo: 'skip'
      });
    });
    const lay = LAYOUT3D('Motivation M', 'Engagement E', 'Anxiety A');
    lay.scene.camera.eye = { x: 1.3, y: 1.55, z: 0.7 };
    Plotly.newPlot('fig3', traces, lay, CONF);
  }

  /* ───────── GALLERY (Figures_set_2) ───────── */
  function gA() {
    const items = [
      { a1: 1.3, a2: 0.3, d: -1.2 }, { a1: 1.1, a2: 0.7, d: 0.4 }, { a1: 0.4, a2: 1.3, d: 1.1 },
      { a1: 0.9, a2: 0.9, d: -0.3 }, { a1: 1.4, a2: -0.4, d: 0.9 }, { a1: -0.3, a2: 1.2, d: -0.8 }
    ];
    const G = 46, lo = -3, hi = 3, st = (hi - lo) / (G - 1), xs = [], ys = [], z = [];
    for (let i = 0; i < G; i++) { xs.push(lo + i * st); ys.push(lo + i * st); }
    for (let j = 0; j < G; j++) {
      const row = [];
      for (let i = 0; i < G; i++) {
        let info = 0;
        const t1 = xs[i], t2 = ys[j];
        items.forEach(it => {
          const p = 1 / (1 + Math.exp(-(it.a1 * t1 + it.a2 * t2 - it.d)));
          info += (it.a1 * it.a1 + it.a2 * it.a2) * p * (1 - p);
        });
        row.push(info);
      }
      z.push(row);
    }
    Plotly.newPlot('gA', [{
      type: 'surface', x: xs, y: ys, z,
      colorscale: [[0, '#14224f'], [0.3, '#2a6fb0'], [0.55, '#34e3cf'], [0.8, '#ffb74d'], [1, '#ff5d8f']],
      colorbar: { title: { text: 'I', font: { color: '#a9b2cc', family: 'JetBrains Mono' } }, thickness: 9, len: 0.6, outlinewidth: 0, tickfont: { color: '#6b7596', size: 9 } },
      contours: { z: { show: true, usecolormap: true, project: { z: true }, width: 1 } },
      lighting: { ambient: 0.66, diffuse: 0.8, specular: 0.12, roughness: 0.85 }, opacity: 0.98
    }], LAYOUT3D('θ₁', 'θ₂', 'Information'), CONF);
  }

  function gB() {
    const trueTheta = 1.2, K = 26, bank = [];
    for (let i = 0; i < 40; i++) bank.push({ b: -3 + 6 * rng(), a: 0.9 + 0.9 * rng(), used: false });
    let th = 0, adm = [];
    const xs = [], est = [], lo = [], hi = [];
    for (let k = 1; k <= K; k++) {
      let best = -1, bi = -1;
      bank.forEach((it, idx) => {
        if (it.used) return;
        const p = 1 / (1 + Math.exp(-it.a * (th - it.b)));
        const info = it.a * it.a * p * (1 - p);
        if (info > best) { best = info; bi = idx; }
      });
      bank[bi].used = true;
      const it = bank[bi];
      const p = 1 / (1 + Math.exp(-it.a * (trueTheta - it.b)));
      const u = (rng() < p) ? 1 : 0;
      adm.push({ a: it.a, b: it.b, u });
      for (let s = 0; s < 8; s++) {
        let g = -th, H = 1;
        adm.forEach(a => {
          const pp = 1 / (1 + Math.exp(-a.a * (th - a.b)));
          g += a.a * (a.u - pp);
          H += a.a * a.a * pp * (1 - pp);
        });
        th += g / H;
      }
      let I = 1;
      adm.forEach(a => {
        const pp = 1 / (1 + Math.exp(-a.a * (th - a.b)));
        I += a.a * a.a * pp * (1 - pp);
      });
      const se = 1 / Math.sqrt(I);
      xs.push(k); est.push(th); lo.push(th - 1.96 * se); hi.push(th + 1.96 * se);
    }
    const band = { x: xs.concat(xs.slice().reverse()), y: hi.concat(lo.slice().reverse()), fill: 'toself', fillcolor: 'rgba(52,227,207,0.16)', line: { width: 0 }, type: 'scatter', mode: 'lines', hoverinfo: 'skip' };
    const line = { x: xs, y: est, type: 'scatter', mode: 'lines+markers', line: { color: '#34e3cf', width: 2.4 }, marker: { size: 5, color: '#34e3cf' } };
    const truth = { x: [1, K], y: [trueTheta, trueTheta], type: 'scatter', mode: 'lines', line: { color: '#ff5d8f', width: 1.6, dash: 'dash' } };
    Plotly.newPlot('gB', [band, line, truth], LAYOUT2D('Items administered', 'Ability estimate  θ̂', { yaxis: Object.assign(ax2('Ability estimate  θ̂'), { range: [-1.2, 2.6] }) }), CONF);
  }

  function gC() {
    const J = 12, d = [], se = [], names = [];
    for (let i = 0; i < J; i++) {
      const s = 0.08 + 0.22 * rng();
      se.push(s);
      d.push(0.42 + 0.55 * randn() * 0.55 + (rng() - 0.5) * 0.1);
      names.push('Study ' + String(i + 1).padStart(2, '0'));
    }
    let sw = 0, swd = 0;
    for (let i = 0; i < J; i++) { const w = 1 / (se[i] * se[i]); sw += w; swd += w * d[i]; }
    const pooled = swd / sw, sePool = Math.sqrt(1 / sw);
    const ys = []; for (let i = 0; i < J; i++) ys.push(i + 1);
    const maxW = Math.max(...se.map(s => 1 / (s * s)));
    const pts = {
      x: d, y: ys, type: 'scatter', mode: 'markers',
      error_x: { type: 'data', array: se.map(s => 1.96 * s), thickness: 1.3, width: 4, color: '#7c8cff' },
      marker: { size: se.map(s => 8 + 14 * (1 / (s * s)) / maxW), color: '#34e3cf', line: { color: '#0b1124', width: 1 } },
      text: names, hoverinfo: 'text+x'
    };
    const dy = 0.45;
    const diamond = { x: [pooled - 1.96 * sePool, pooled, pooled + 1.96 * sePool, pooled, pooled - 1.96 * sePool], y: [0, dy, 0, -dy, 0], type: 'scatter', mode: 'lines', fill: 'toself', fillcolor: 'rgba(255,183,77,0.85)', line: { color: '#ffb74d', width: 1.5 }, hoverinfo: 'text', text: 'RE pooled = ' + pooled.toFixed(2) };
    const zero = { x: [0, 0], y: [-0.8, J + 0.8], type: 'scatter', mode: 'lines', line: { color: 'rgba(169,178,204,0.5)', width: 1 } };
    const pl = { x: [pooled, pooled], y: [-0.8, J + 0.8], type: 'scatter', mode: 'lines', line: { color: 'rgba(255,183,77,0.45)', width: 1, dash: 'dot' } };
    const lay = LAYOUT2D('Standardized mean difference  d', '', {
      yaxis: { autorange: 'reversed', tickmode: 'array', tickvals: [0].concat(ys), ticktext: ['RE pooled'].concat(names), tickfont: { family: 'JetBrains Mono', size: 9, color: '#a9b2cc' }, gridcolor: 'rgba(0,0,0,0)', zerolinecolor: 'rgba(0,0,0,0)' },
      margin: { l: 86, r: 16, t: 10, b: 46 }
    });
    Plotly.newPlot('gC', [zero, pl, pts, diamond], lay, CONF);
  }

  function gD() {
    const J = 34, pooled = 0.42, d = [], se = [];
    for (let i = 0; i < J; i++) {
      const s = 0.04 + 0.30 * rng();
      se.push(s);
      const bias = (s > 0.2) ? 0.13 : 0;
      d.push(pooled + bias + s * randn());
    }
    const sMax = 0.36;
    const funnelL = { x: [pooled - 1.96 * sMax, pooled, pooled + 1.96 * sMax], y: [sMax, 0, sMax], type: 'scatter', mode: 'lines', fill: 'toself', fillcolor: 'rgba(124,140,255,0.08)', line: { color: 'rgba(124,140,255,0.5)', width: 1.2, dash: 'dot' }, hoverinfo: 'skip' };
    const center = { x: [pooled, pooled], y: [0, sMax], type: 'scatter', mode: 'lines', line: { color: 'rgba(255,183,77,0.55)', width: 1, dash: 'dash' } };
    const pts = { x: d, y: se, type: 'scatter', mode: 'markers', marker: { size: 8, color: '#34e3cf', opacity: 0.85, line: { color: '#0b1124', width: 1 } }, hoverinfo: 'x+y' };
    Plotly.newPlot('gD', [funnelL, center, pts], LAYOUT2D('Effect size  d', 'Standard error', { yaxis: Object.assign(ax2('Standard error'), { autorange: 'reversed', range: [sMax, 0] }) }), CONF);
  }

  function gE() {
    const J = 20, b0 = 50, b1 = 4.2, xL = -2.2, xR = 2.2, traces = [];
    let umin = 99, umax = -99;
    const us = [];
    for (let j = 0; j < J; j++) {
      const u0 = 6 * randn();
      us.push(u0);
      if (u0 < umin) umin = u0;
      if (u0 > umax) umax = u0;
    }
    for (let j = 0; j < J; j++) {
      const u0 = us[j], u1 = 2.2 * randn();
      const t = (u0 - umin) / (umax - umin + 1e-9);
      const col = lerpColor('#34e3cf', lerpColor('#7c8cff', '#ff5d8f', t), t);
      traces.push({ x: [xL, xR], y: [(b0 + u0) + (b1 + u1) * xL, (b0 + u0) + (b1 + u1) * xR], type: 'scatter', mode: 'lines', line: { color: col, width: 1.3 }, opacity: 0.8, hoverinfo: 'skip' });
    }
    traces.push({ x: [xL, xR], y: [b0 + b1 * xL, b0 + b1 * xR], type: 'scatter', mode: 'lines', line: { color: '#f3f1e8', width: 3.5 }, hoverinfo: 'skip' });
    Plotly.newPlot('gE', traces, LAYOUT2D('Centered predictor  x', 'Outcome  y'), CONF);
  }

  function gF() {
    const labels = ['Apt₁', 'Apt₂', 'Apt₃', 'Mot₁', 'Mot₂', 'Mot₃', 'Anx₁', 'Anx₂'];
    const block = [0, 0, 0, 1, 1, 1, 2, 2];
    const n = 8, R = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        if (i === j) row.push(1);
        else if (block[i] === block[j]) row.push(+(0.55 + 0.18 * rng()).toFixed(2));
        else row.push(+((block[i] === 2 || block[j] === 2 ? -1 : 1) * (0.05 + 0.20 * rng())).toFixed(2));
      }
      R.push(row);
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const v = (R[i][j] + R[j][i]) / 2;
      R[i][j] = +v.toFixed(2); R[j][i] = R[i][j];
    }
    const ann = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      ann.push({ x: labels[j], y: labels[i], text: R[i][j].toFixed(2), showarrow: false, font: { family: 'JetBrains Mono', size: 9, color: Math.abs(R[i][j]) > 0.5 ? '#0b1124' : '#cdd4ea' } });
    }
    Plotly.newPlot('gF', [{
      type: 'heatmap', x: labels, y: labels, z: R, zmid: 0, zmin: -0.4, zmax: 1,
      colorscale: [[0, '#ff5d8f'], [0.33, '#1a2350'], [0.55, '#2a6fb0'], [0.8, '#34e3cf'], [1, '#ffb74d']],
      colorbar: { title: { text: 'r', font: { color: '#a9b2cc', family: 'JetBrains Mono' } }, thickness: 9, len: 0.7, outlinewidth: 0, tickfont: { color: '#6b7596', size: 9 } }, xgap: 2, ygap: 2
    }], Object.assign(LAYOUT2D('', ''), { annotations: ann, yaxis: Object.assign(ax2(''), { autorange: 'reversed' }), margin: { l: 54, r: 16, t: 10, b: 44 } }), CONF);
  }

  function gG() {
    const ang = Math.PI / 6, c = Math.cos(ang), s = Math.sin(ang), A = 1.0, B = 9.0;
    const M = [[A * c * c + B * s * s, (A - B) * c * s], [(A - B) * c * s, A * s * s + B * c * c]];
    function L(w) { return 0.5 * (M[0][0] * w[0] * w[0] + 2 * M[0][1] * w[0] * w[1] + M[1][1] * w[1] * w[1]); }
    const G = 48, lo = -3, hi = 3, st = (hi - lo) / (G - 1), xs = [], ys = [], z = [];
    for (let i = 0; i < G; i++) { xs.push(lo + i * st); ys.push(lo + i * st); }
    for (let j = 0; j < G; j++) {
      const row = [];
      for (let i = 0; i < G; i++) row.push(L([xs[i], ys[j]]));
      z.push(row);
    }
    let w = [-2.6, 2.3];
    const px = [], py = [], pz = [], pc = [];
    const lr = 0.12;
    for (let k = 0; k < 34; k++) {
      px.push(w[0]); py.push(w[1]); pz.push(L(w) + 0.25); pc.push(k);
      const g = [M[0][0] * w[0] + M[0][1] * w[1], M[0][1] * w[0] + M[1][1] * w[1]];
      w = [w[0] - lr * g[0], w[1] - lr * g[1]];
    }
    const surf = {
      type: 'surface', x: xs, y: ys, z,
      colorscale: [[0, '#101d45'], [0.4, '#2a6fb0'], [0.7, '#34e3cf'], [1, '#ffb74d']],
      opacity: 0.9, showscale: false,
      contours: { z: { show: true, usecolormap: true, project: { z: true }, width: 1 } },
      lighting: { ambient: 0.7, diffuse: 0.7, specular: 0.1, roughness: 0.9 }
    };
    const path = {
      type: 'scatter3d', mode: 'lines+markers', x: px, y: py, z: pz,
      line: { width: 5, color: pc, colorscale: [[0, '#ff5d8f'], [1, '#ffffff']] },
      marker: { size: 3.4, color: pc, colorscale: [[0, '#ff5d8f'], [1, '#ffffff']] }
    };
    Plotly.newPlot('gG', [surf, path], LAYOUT3D('w₁', 'w₂', 'Loss  L'), CONF);
  }

  function gH() {
    const g = 0.32, w = 1.05, R = 3;
    function f(M, A) { return [-g * M + w * A, -w * M - g * A]; }
    const ann = [], N = 11, lo = -R, hi = R, stp = (hi - lo) / (N - 1);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const M = lo + i * stp, A = lo + j * stp;
      const d = f(M, A);
      const mag = Math.hypot(d[0], d[1]) || 1e-6;
      const sc = 0.28 * stp / mag * Math.min(mag, 3);
      ann.push({ x: M + d[0] * sc, y: A + d[1] * sc, ax: M, ay: A, xref: 'x', yref: 'y', axref: 'x', ayref: 'y', showarrow: true, arrowhead: 2, arrowsize: 0.7, arrowwidth: 1, arrowcolor: 'rgba(124,140,255,0.5)' });
    }
    const ncM = { x: [-R, R], y: [(g / w) * (-R), (g / w) * R], type: 'scatter', mode: 'lines', line: { color: 'rgba(52,227,207,0.55)', width: 1.4, dash: 'dash' }, hoverinfo: 'skip' };
    const ncA = { x: [-R, R], y: [-(w / g) * (-R), -(w / g) * R], type: 'scatter', mode: 'lines', line: { color: 'rgba(255,183,77,0.55)', width: 1.4, dash: 'dash' }, hoverinfo: 'skip' };
    const dt = 0.04, steps = 420, starts = [[2.7, 2.2], [-2.6, 1.4], [1.0, -2.7]], cols = ['#34e3cf', '#ffb74d', '#ff5d8f'], trajTraces = [];
    starts.forEach((s0, ti) => {
      let M = s0[0], A = s0[1];
      const X = [M], Y = [A];
      for (let n = 0; n < steps; n++) {
        const k1 = f(M, A);
        const k2 = f(M + dt / 2 * k1[0], A + dt / 2 * k1[1]);
        const k3 = f(M + dt / 2 * k2[0], A + dt / 2 * k2[1]);
        const k4 = f(M + dt * k3[0], A + dt * k3[1]);
        M += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        A += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        X.push(M); Y.push(A);
      }
      trajTraces.push({ x: X, y: Y, type: 'scatter', mode: 'lines', line: { color: cols[ti], width: 2.2 }, opacity: 0.95, hoverinfo: 'skip' });
    });
    const eqpt = { x: [0], y: [0], type: 'scatter', mode: 'markers', marker: { size: 10, color: '#f3f1e8', symbol: 'circle', line: { color: '#0b1124', width: 2 } }, hoverinfo: 'text', text: 'stable focus' };
    const lay = LAYOUT2D('Motivation  M', 'Anxiety  A', { annotations: ann, xaxis: Object.assign(ax2('Motivation  M'), { range: [-R, R] }), yaxis: Object.assign(ax2('Anxiety  A'), { range: [-R, R] }) });
    Plotly.newPlot('gH', [ncM, ncA, ...trajTraces, eqpt], lay, CONF);
  }

  /* ───────── nav active state & mobile menu ───────── */
  function setupNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const target = href.split('/').pop();
      if (target === path) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });

    const hamburger = document.querySelector('.hamburger');
    const menu = document.querySelector('.nav-menu');
    if (!hamburger || !menu) return;
    hamburger.addEventListener('click', () => {
      const isActive = menu.classList.toggle('active');
      hamburger.classList.toggle('active', isActive);
      hamburger.setAttribute('aria-expanded', String(isActive));
    });
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (menu.classList.contains('active')) {
          menu.classList.remove('active');
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ───────── reveal animation ───────── */
  function setupReveal() {
    const els = document.querySelectorAll('[data-rise]');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('in'), i * 60);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  /* ───────── scroll top ───────── */
  function setupScrollTop() {
    const btn = document.querySelector('.scroll-top');
    if (!btn) return;
    let ticking = false;
    function onScroll() {
      if (window.scrollY > 600) btn.classList.add('visible');
      else btn.classList.remove('visible');
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function setupCopyright() {
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* ───────── KaTeX rendering ───────── */
  function doRender() {
    try {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      });
    } catch (e) {
      console.error('KaTeX render failed', e);
    }
  }

  async function ensureKatex() {
    if (window.renderMathInElement) return true;
    const katexCss = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    const katexJs = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    const autoJs = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
    try {
      if (!document.querySelector('link[href*="katex.min.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = katexCss;
        document.head.appendChild(l);
      }
      if (!window.katex) await loadScript(katexJs);
      if (!window.renderMathInElement) await loadScript(autoJs);
    } catch (e) {
      console.error('KaTeX fallback load failed', e);
    }
    return !!window.renderMathInElement;
  }

  function renderMath(retries = 80) {
    if (window.renderMathInElement) {
      doRender();
      return;
    }
    if (retries > 0) {
      setTimeout(() => renderMath(retries - 1), 150);
    } else {
      // last resort: load from jsdelivr ourselves
      ensureKatex().then(ok => { if (ok) doRender(); });
    }
  }

  /* ───────── figure builders dispatcher ───────── */
  const FIGURE_BUILDERS = {
    fig1: buildFig1, fig2: buildFig2, fig3: buildFig3,
    gA, gB, gC, gD, gE, gF, gG, gH
  };

  async function setupFigures() {
    const idsOnPage = Object.keys(FIGURE_BUILDERS).filter(id => document.getElementById(id));
    if (!idsOnPage.length) return;

    setPlotMsg(idsOnPage, 'Loading interactive figures…');
    const ok = await ensurePlotly();
    if (!ok) {
      setPlotMsg(idsOnPage, 'Interactive figures need an internet connection to load Plotly.<br>Reconnect and refresh.');
      return;
    }
    idsOnPage.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      // Clear the loading placeholder before Plotly takes over
      el.innerHTML = '';
      try {
        FIGURE_BUILDERS[id]();
        el.dataset.plotted = '1';
      } catch (e) {
        console.error('figure', id, e);
        el.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-family:monospace;color:#6b7596;font-size:.8rem">figure failed — see console</div>`;
      }
    });
    window.addEventListener('resize', () => {
      idsOnPage.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.data) Plotly.Plots.resize(el);
      });
    });
  }

  /* ───────── init ───────── */
  function init() {
    setupNav();
    setupReveal();
    setupScrollTop();
    setupCopyright();
    renderMath();
    setupFigures();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also trigger math render on window.load (after deferred scripts settle)
  window.addEventListener('load', () => {
    if (window.renderMathInElement) doRender();
    else renderMath();
  });
})();
