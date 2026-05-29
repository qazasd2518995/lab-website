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

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const CONF = {
    responsive: true,
    displayModeBar: isTouch ? 'hover' : false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'toggleSpikelines'],
    displaylogo: false
  };

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

  // KaTeX measures roots and fraction lines against its own web fonts. If a
  // formula is laid out before those fonts arrive, the metrics are taken from a
  // fallback font and never recomputed — the radical bar then drifts across the
  // row (a stray line through the numerator). Gate every render on the fonts
  // being ready so layout always uses the real KaTeX metrics. Resolves
  // immediately on browsers without the Font Loading API, and after a short
  // safety timeout so a stalled font fetch never blocks rendering forever.
  let katexFontsReady = null;
  function whenKatexFontsReady() {
    if (katexFontsReady) return katexFontsReady;
    if (!document.fonts || !document.fonts.load) {
      katexFontsReady = Promise.resolve();
      return katexFontsReady;
    }
    // KaTeX fonts are declared via @font-face and fetched lazily, so
    // document.fonts.ready can resolve before they are even requested.
    // Explicitly request the families our formulas actually use (text, math
    // italics, and the Size* families that draw radicals and large delimiters)
    // so the metrics are present before layout.
    const families = [
      '10px "KaTeX_Main"',
      '10px "KaTeX_Math"',
      'italic 10px "KaTeX_Math"',
      '10px "KaTeX_Size1"',
      '10px "KaTeX_Size2"',
      '10px "KaTeX_Size3"',
      '10px "KaTeX_Size4"'
    ];
    const loads = families.map(f => document.fonts.load(f).catch(() => {}));
    const timeout = new Promise(res => setTimeout(res, 3000));
    katexFontsReady = Promise.race([Promise.all(loads), timeout]);
    return katexFontsReady;
  }

  function renderNow(root) {
    try {
      renderMathInElement(root || document.body, {
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

  function doRender(root) {
    whenKatexFontsReady().then(() => renderNow(root));
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

  /* ───────── touch UX for interactive figures ───────── */
  function enhanceTouchUX(plotEl) {
    if (!isTouch) return;
    // 3D plots only: detect Plotly's scene gl3d node
    const is3D = !!plotEl.querySelector('.gl3d, .scene');
    const wrapper = plotEl.closest('.viz, .card');
    if (!wrapper) return;

    // Avoid double-decoration
    if (wrapper.querySelector('.plot-touch-hint')) return;

    // Touch hint badge
    const hint = document.createElement('div');
    hint.className = 'plot-touch-hint';
    hint.innerHTML = is3D
      ? '<span class="dot"></span> Drag to rotate · pinch to zoom'
      : '<span class="dot"></span> Pinch to zoom · drag to pan';
    plotEl.parentNode.insertBefore(hint, plotEl);

    // Auto-fade hint after first interaction
    let interacted = false;
    const fade = () => {
      if (interacted) return;
      interacted = true;
      hint.classList.add('faded');
    };
    plotEl.addEventListener('touchstart', fade, { passive: true });
    plotEl.addEventListener('click', fade);
    // Also fade after 5s regardless
    setTimeout(fade, 5000);

    // Lock page scroll while user interacts with the plot (prevent
    // accidental page scroll while trying to rotate / pan)
    let scrollLocked = false;
    plotEl.addEventListener('touchstart', (e) => {
      if (e.touches.length >= 1) {
        document.body.style.overflow = 'hidden';
        scrollLocked = true;
      }
    }, { passive: true });
    const unlock = () => {
      if (scrollLocked) {
        document.body.style.overflow = '';
        scrollLocked = false;
      }
    };
    plotEl.addEventListener('touchend', unlock);
    plotEl.addEventListener('touchcancel', unlock);
  }

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
        enhanceTouchUX(el);
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

  /* ───────── teaching cards ───────── */
  const TEACH_CARDS = [
    {
      id: 'sampling',
      num: '01',
      kind: 'Lecture · Quiz',
      color: 'var(--d1)',
      title: 'Sampling distribution & standard error',
      subtitle: '抽樣分配與標準誤 · the two properties that make inference possible',
      preview: '\\( \\mathrm{SE} = \\sigma/\\sqrt{n} \\)',
      overview: 'Enumerate every possible sample of a tiny population and the sample mean reveals two exact properties. It is <strong>unbiased</strong>: averaged over all samples it equals the population mean. And its spread shrinks with sample size as <strong>variance reduction</strong>. Together they underwrite every confidence interval and every test statistic.',
      formulas: [
        'E(\\bar{X}) = \\mu',
        '\\mathrm{Var}(\\bar{X}) = \\dfrac{\\sigma^2}{n}',
        '\\mathrm{SE}(\\bar{X}) = \\dfrac{\\sigma}{\\sqrt{n}}'
      ],
      svg: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sampling distribution narrowing as n grows">
  <line x1="40" y1="180" x2="500" y2="180" stroke="#6b7596" stroke-width="1"/>
  <path d="M40,180 C150,178 200,120 270,120 C340,120 390,178 500,180" fill="none" stroke="#a9b2cc" stroke-width="1.5" opacity="0.6"/>
  <path d="M150,180 C220,176 250,60 270,60 C290,60 320,176 390,180 Z" fill="#34e3cf" opacity="0.18"/>
  <path d="M150,180 C220,176 250,60 270,60 C290,60 320,176 390,180" fill="none" stroke="#34e3cf" stroke-width="2"/>
  <line x1="270" y1="46" x2="270" y2="180" stroke="#ff5d8f" stroke-width="1.4" stroke-dasharray="4,3"/>
  <text x="270" y="38" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="14" fill="#ff5d8f">μ</text>
  <text x="430" y="150" font-family="JetBrains Mono, monospace" font-size="11" fill="#a9b2cc">n = 1</text>
  <text x="300" y="96" font-family="JetBrains Mono, monospace" font-size="11" fill="#34e3cf">large n</text>
  <text x="270" y="200" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#6b7596">X̄</text>
</svg>`,
      figcap: 'Larger samples concentrate the sample mean tightly around μ. The √n law.',
      whenToUse: [
        'Reasoning about why a larger n gives a more precise estimate.',
        'Setting up confidence intervals: width is driven by σ/√n.',
        'Understanding the denominator of every z- and t-statistic.'
      ]
    },
    {
      id: 'tdist',
      num: '02',
      kind: 'Reference · Quiz',
      color: 'var(--d2)',
      title: 'The t-distribution & critical values',
      subtitle: 't 分配與臨界值表 · when σ is estimated, the ruler changes',
      preview: '\\( t_{df,\\,\\alpha} \\)',
      overview: 'When the population standard deviation is unknown and must be estimated from the sample, the standardised statistic no longer follows the normal curve but <strong>Student’s t</strong>: heavier in the tails, more forgiving of extreme values. As the degrees of freedom grow, t approaches z. The critical value table converts a chosen α and df into the cut-off a test statistic must clear.',
      formulas: [
        't = \\dfrac{\\bar{X} - \\mu}{S/\\sqrt{n}}, \\quad df = n - 1',
        't_{df} \\to N(0,1) \\ \\text{as } df \\to \\infty'
      ],
      svg: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="t distribution with right-tail rejection region">
  <path d="M30,165 C160,165 200,40 260,40 C320,40 360,165 490,165" fill="#7c8cff" opacity="0.12"/>
  <path d="M390,165 C420,150 445,120 470,118 C480,140 488,160 490,165 Z" fill="#ffb74d" opacity="0.3"/>
  <path d="M30,165 C160,165 200,40 260,40 C320,40 360,165 490,165" fill="none" stroke="#e9e7dd" stroke-width="1.8"/>
  <line x1="30" y1="165" x2="490" y2="165" stroke="#6b7596" stroke-width="0.8"/>
  <line x1="390" y1="165" x2="390" y2="80" stroke="#ffb74d" stroke-width="1.4" stroke-dasharray="4,3"/>
  <text x="390" y="72" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#ffb74d" font-weight="600">+t_α</text>
  <text x="440" y="156" font-family="Fraunces, serif" font-style="italic" font-size="14" fill="#ffb74d">α</text>
  <text x="260" y="186" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#6b7596">0</text>
</svg>`,
      figcap: 'The right-tail rejection region: area α beyond the critical value +t_α.',
      whenToUse: [
        'Any test of means where the population variance is unknown.',
        'Choosing a critical value from α (one- or two-tailed) and df.',
        'Small samples, where the t-correction matters most.'
      ]
    },
    {
      id: 'twomeans',
      num: '03',
      kind: 'Decision tree · 12 problems',
      color: 'var(--d3)',
      title: 'Two means, six tests',
      subtitle: '兩平均數差 μ₁ − μ₂ · choosing the right denominator',
      preview: '\\( t = \\text{signal}/\\text{noise} \\)',
      overview: 'Every two-sample test of \\( \\mu_1 - \\mu_2 \\) is one idea in different clothes. Three questions (is σ known? are the samples large? are the groups independent or paired?) pick one of six tests. The numerator is always the observed difference minus its null value; only the <strong>standard error in the denominator</strong> changes.',
      formulas: [
        '\\text{statistic} = \\dfrac{(\\bar{X}_1 - \\bar{X}_2) - (\\mu_1 - \\mu_2)}{\\widehat{\\mathrm{SE}}(\\bar{X}_1 - \\bar{X}_2)}',
        'S_p^2 = \\dfrac{(n_1-1)S_1^2 + (n_2-1)S_2^2}{n_1 + n_2 - 2}'
      ],
      svg: `<svg viewBox="0 0 520 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Decision tree from a root question to six tests">
  <rect x="14" y="110" width="92" height="34" rx="4" fill="#e9e7dd"/>
  <text x="60" y="132" text-anchor="middle" font-family="Fraunces, serif" font-size="13" fill="#0b1124">μ₁ − μ₂</text>
  <g stroke="#a9b2cc" stroke-width="1.2" fill="none">
    <path d="M106,127 H150 V60 H190"/>
    <path d="M106,127 H150 V190 H190"/>
    <path d="M286,190 H320 V150 H360"/>
    <path d="M286,190 H320 V230 H360"/>
  </g>
  <g font-family="JetBrains Mono, monospace" font-size="10" fill="#6b7596">
    <text x="120" y="52">σ known</text>
    <text x="120" y="205">σ unknown</text>
  </g>
  <g font-family="JetBrains Mono, monospace" font-size="11" font-weight="600">
    <rect x="190" y="44" width="96" height="30" rx="4" fill="none" stroke="#34e3cf" stroke-width="1.4"/>
    <text x="238" y="63" text-anchor="middle" fill="#34e3cf">z-test</text>
    <rect x="190" y="174" width="96" height="30" rx="4" fill="none" stroke="#a9b2cc" stroke-width="1"/>
    <text x="238" y="193" text-anchor="middle" fill="#a9b2cc">n, design?</text>
    <rect x="360" y="135" width="120" height="30" rx="4" fill="none" stroke="#ff5d8f" stroke-width="1.4"/>
    <text x="420" y="154" text-anchor="middle" fill="#ff5d8f">pooled / Welch t</text>
    <rect x="360" y="215" width="120" height="30" rx="4" fill="none" stroke="#ffb74d" stroke-width="1.4"/>
    <text x="420" y="234" text-anchor="middle" fill="#ffb74d">paired t</text>
  </g>
</svg>`,
      figcap: 'Three questions in sequence. The tree decides only the standard error.',
      whenToUse: [
        'Comparing two group means and unsure which test applies.',
        'Deciding between pooled and Welch t under unequal variances.',
        'Recognising paired designs: positive correlation buys precision.'
      ]
    },
    {
      id: 'paired',
      num: '04',
      kind: 'Lecture · 15-item activity',
      color: 'var(--eig)',
      title: 'The paired-samples t-test',
      subtitle: '成對樣本 t 檢定 · pre/post, repeated measures, matched pairs',
      preview: '\\( t = \\bar{D}\\,/\\,(S_D/\\sqrt{n}) \\)',
      overview: 'When the same subjects are measured twice, the two samples are correlated by design. Reduce the problem to a <strong>one-sample test on the differences</strong> \\( D_i = X_{1i} - X_{2i} \\). The within-pair correlation is absorbed automatically. Written with covariance, the term \\( -2rS_1S_2 \\) shrinks the standard error: positive correlation buys precision.',
      formulas: [
        't = \\dfrac{\\bar{D} - \\mu_D}{S_D/\\sqrt{n}}, \\quad df = n - 1',
        '\\widehat{\\mathrm{SE}} = \\sqrt{\\dfrac{S_1^2 + S_2^2 - 2\\,r\\,S_1 S_2}{n}}'
      ],
      svg: `<svg viewBox="0 0 520 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pre to post paired observations connected by lines">
  <line x1="120" y1="20" x2="120" y2="180" stroke="#6b7596" stroke-width="0.8"/>
  <line x1="400" y1="20" x2="400" y2="180" stroke="#6b7596" stroke-width="0.8"/>
  <text x="120" y="200" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#a9b2cc">pre</text>
  <text x="400" y="200" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#a9b2cc">post</text>
  <g stroke="#7c8cff" stroke-width="1.4" opacity="0.8">
    <line x1="120" y1="150" x2="400" y2="110"/>
    <line x1="120" y1="120" x2="400" y2="70"/>
    <line x1="120" y1="95" x2="400" y2="60"/>
    <line x1="120" y1="60" x2="400" y2="40"/>
  </g>
  <g fill="#ff5d8f"><circle cx="120" cy="150" r="4"/><circle cx="120" cy="120" r="4"/><circle cx="120" cy="95" r="4"/><circle cx="120" cy="60" r="4"/></g>
  <g fill="#34e3cf"><circle cx="400" cy="110" r="4"/><circle cx="400" cy="70" r="4"/><circle cx="400" cy="60" r="4"/><circle cx="400" cy="40" r="4"/></g>
</svg>`,
      figcap: 'Each line is one subject; the paired test models the within-subject change.',
      whenToUse: [
        'Pre/post designs measuring the same people twice.',
        'Matched-pairs or repeated single-factor comparisons.',
        'Whenever ignoring the pairing would waste the design’s power.'
      ]
    },
    {
      id: 'anova',
      num: '05',
      kind: 'Lecture · Walkthrough · 10 examples',
      color: 'var(--d1)',
      title: 'One-way ANOVA',
      subtitle: '單因子變異數分析 · partitioning variance into signal and noise',
      preview: '\\( F = MS_b / MS_w \\)',
      overview: 'With three or more groups, ANOVA splits the <strong>total variance</strong> into a between-groups part (differences among group means) and a within-groups part (noise inside each group). Their ratio of mean squares is the F-statistic. A large F says the between-group signal dwarfs the within-group noise.',
      formulas: [
        'SS_{\\text{total}} = SS_{\\text{between}} + SS_{\\text{within}}',
        'F = \\dfrac{MS_{\\text{between}}}{MS_{\\text{within}}}',
        '\\eta^2 = \\dfrac{SS_{\\text{between}}}{SS_{\\text{total}}}'
      ],
      svg: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Total variance bar split into between and within parts">
  <text x="20" y="40" font-family="JetBrains Mono, monospace" font-size="10" fill="#a9b2cc">SS total</text>
  <rect x="20" y="50" width="480" height="34" rx="4" fill="#a9b2cc" opacity="0.25"/>
  <text x="20" y="120" font-family="JetBrains Mono, monospace" font-size="10" fill="#34e3cf">SS between (signal)</text>
  <rect x="20" y="130" width="300" height="34" rx="4" fill="#34e3cf" opacity="0.85"/>
  <text x="330" y="120" font-family="JetBrains Mono, monospace" font-size="10" fill="#ff5d8f">SS within (noise)</text>
  <rect x="328" y="130" width="172" height="34" rx="4" fill="#ff5d8f" opacity="0.7"/>
  <line x1="320" y1="46" x2="320" y2="172" stroke="#6b7596" stroke-width="1" stroke-dasharray="3,3"/>
</svg>`,
      figcap: 'F is large when the between-groups bar dominates the within-groups bar.',
      whenToUse: [
        'Comparing means across three or more independent groups.',
        'Quantifying effect size with η² after a significant F.',
        'Following up with post-hoc tests (e.g. Tukey HSD).'
      ]
    },
    {
      id: 'rmanova',
      num: '06',
      kind: 'Walkthrough · 10 studies',
      color: 'var(--d2)',
      title: 'Repeated-measures ANOVA',
      subtitle: '重複量數變異數分析 · removing individual differences',
      preview: '\\( F = MS_{\\text{cond}} / MS_{\\text{error}} \\)',
      overview: 'When every subject experiences every condition, the within-subjects variance splits again into a <strong>conditions</strong> part and an <strong>error</strong> part, after the stable between-subjects differences are removed. Pulling out individual differences sharpens the test, which is why repeated-measures designs are so powerful.',
      formulas: [
        'SS_{\\text{within-subj}} = SS_{\\text{conditions}} + SS_{\\text{error}}',
        'F = \\dfrac{MS_{\\text{conditions}}}{MS_{\\text{error}}}',
        '\\eta^2_{\\text{partial}} = \\dfrac{SS_{\\text{conditions}}}{SS_{\\text{conditions}} + SS_{\\text{error}}}'
      ],
      svg: `<svg viewBox="0 0 520 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Total variance split first by subjects then conditions and error">
  <text x="20" y="34" font-family="JetBrains Mono, monospace" font-size="10" fill="#a9b2cc">SS total</text>
  <rect x="20" y="42" width="480" height="28" rx="4" fill="#a9b2cc" opacity="0.22"/>
  <rect x="20" y="92" width="150" height="28" rx="4" fill="#6b7596" opacity="0.6"/>
  <text x="24" y="83" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#6b7596">between subjects (removed)</text>
  <rect x="172" y="92" width="328" height="28" rx="4" fill="none" stroke="#a9b2cc" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="176" y="150" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#ffb74d">conditions</text>
  <rect x="172" y="158" width="210" height="28" rx="4" fill="#ffb74d" opacity="0.85"/>
  <text x="392" y="150" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#ff5d8f">error</text>
  <rect x="390" y="158" width="110" height="28" rx="4" fill="#ff5d8f" opacity="0.6"/>
</svg>`,
      figcap: 'Individual differences are removed first; F compares conditions against error.',
      whenToUse: [
        'The same subjects measured under several conditions or times.',
        'Longitudinal or within-subject experimental designs.',
        'When between-subject noise would otherwise mask the effect.'
      ]
    },
    {
      id: 'ttof',
      num: '07',
      kind: 'Worked example · F table',
      color: 'var(--eig)',
      title: 'From t to F · one view',
      subtitle: '從 t 到 F · the same signal-over-noise idea',
      preview: '\\( t^2 = F \\)',
      overview: 'The t-test and ANOVA are not rival procedures. With exactly two groups, the F-statistic equals the square of the t-statistic: \\( t^2 = F \\). Both are a signal divided by an estimate of noise; ANOVA generalises the comparison to many groups at once. This is the lab’s framework in miniature: structure first, then a ratio.',
      formulas: [
        't^2 = F \\quad (\\text{for } k = 2 \\text{ groups})',
        'F = \\dfrac{MS_{\\text{between}}}{MS_{\\text{within}}}'
      ],
      svg: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="t squared maps to F">
  <text x="120" y="100" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="46" fill="#34e3cf">t²</text>
  <line x1="165" y1="88" x2="330" y2="88" stroke="#a9b2cc" stroke-width="1.6"/>
  <path d="M330,88 l-12,-6 v12 z" fill="#a9b2cc"/>
  <text x="260" y="74" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" fill="#6b7596">k = 2</text>
  <text x="400" y="100" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="46" fill="#ff5d8f">F</text>
</svg>`,
      figcap: 'For two groups the two tests coincide: t² = F.',
      whenToUse: [
        'Seeing why a two-group ANOVA and a t-test agree.',
        'Connecting the t-table and the F-table through df.',
        'Framing all mean comparisons as signal over noise.'
      ]
    }
  ];

  /* ───────── teaching: cards + modal ───────── */
  function setupTeaching() {
    const grid = document.getElementById('teach-grid');
    if (!grid) return;

    // Every card links to its own detail page (teach-<id>.html).
    TEACH_CARDS.forEach(card => {
      const el = document.createElement('a');
      el.className = 'teach-card';
      el.style.setProperty('--c', card.color);
      el.dataset.id = card.id;
      el.href = `teach-${card.id}.html`;
      el.setAttribute('aria-label', `Open unit: ${card.title}`);
      el.innerHTML =
        `<div class="tc-num">${card.num}</div>` +
        `<h3>${card.title}</h3>` +
        `<p class="tc-sub">${card.subtitle}</p>` +
        (card.preview ? `<div class="tc-preview">${card.preview}</div>` : '') +
        `<div class="tc-kind">${card.kind}</div>`;
      grid.appendChild(el);
    });

    // Render preview formulas inside the cards
    doRender(grid);
  }

  /* ───────── init ───────── */
  function init() {
    setupNav();
    setupReveal();
    setupScrollTop();
    setupCopyright();
    renderMath();
    setupFigures();
    setupTeaching();
  }

  // Expose a minimal namespace so the teaching detail pages (teaching.js) can
  // reuse this file's KaTeX / Plotly / layout helpers without duplicating them.
  window.LDAHS = {
    doRender, ensurePlotly, ensureKatex,
    LAYOUT2D, ax2, CONF, enhanceTouchUX
  };

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
