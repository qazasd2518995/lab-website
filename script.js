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
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

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
      'https://cdn.plot.ly/plotly-2.35.2.min.js',
      'https://cdn.plot.ly/plotly-2.32.0.min.js',
      'https://cdn.plot.ly/plotly-basic-2.35.2.min.js'
    ];
    for (const u of urls) {
      try { await loadScript(u); if (window.Plotly) return true; } catch (e) { /* try next */ }
    }
    return !!window.Plotly;
  }

  async function ensureD3() {
    if (window.d3) return true;
    try { await loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js'); } catch (e) { /* may already be loading via the defer tag */ }
    for (let i = 0; i < 20 && !window.d3; i++) { await new Promise(r => setTimeout(r, 50)); }
    return !!window.d3;
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

  /* Sentiment classification scatter (Plotly) — simulated learner feedback */
  /* NRC emotion radar (Plotly scatterpolar) — eight-emotion profiles of
     simulated learner feedback, switchable via a dropdown. */
  function buildNRC() {
    const EMO = ['anger', 'anticipation', 'disgust', 'fear', 'joy', 'sadness', 'surprise', 'trust'];
    // each case: a learner comment and its NRC emotion intensities (0..1) over the 8 emotions
    const CASES = [
      { name: 'Whole corpus', color: '#7c8cff',
        text: 'Average emotion profile across all learner feedback.',
        v: [0.18, 0.62, 0.12, 0.34, 0.58, 0.22, 0.30, 0.66] },
      { name: 'Confident learner', color: '#34e3cf',
        text: '"Speaking practice really boosted my confidence and I enjoy class now."',
        v: [0.05, 0.74, 0.04, 0.10, 0.86, 0.06, 0.28, 0.80] },
      { name: 'Anxious learner', color: '#ff5d8f',
        text: '"I feel nervous during oral tests and the fast pace stresses me out."',
        v: [0.30, 0.40, 0.18, 0.82, 0.16, 0.55, 0.34, 0.28] },
      { name: 'Frustrated learner', color: '#ffb74d',
        text: '"The grammar explanations confused me and there is too much homework."',
        v: [0.62, 0.30, 0.40, 0.45, 0.12, 0.50, 0.20, 0.22] },
      { name: 'Curious learner', color: '#34e3cf',
        text: '"I love discovering idioms and reading short stories in English."',
        v: [0.06, 0.70, 0.05, 0.14, 0.72, 0.10, 0.66, 0.62] },
    ];
    // close the loop so each radar polygon is a closed shape
    const theta = EMO.concat(EMO[0]).map(e => e.charAt(0).toUpperCase() + e.slice(1));
    const traces = CASES.map((c, i) => ({
      type: 'scatterpolar',
      r: c.v.concat(c.v[0]),
      theta,
      mode: 'lines+markers',
      name: c.name,
      visible: i === 0,            // only the first case shown at first; dropdown switches
      fill: 'toself',
      fillcolor: c.color + '22',
      line: { color: c.color, width: 2 },
      marker: { color: c.color, size: 6 },
      hovertemplate: '%{theta}: %{r:.2f}<extra>' + c.name + '</extra>',
    }));
    // dropdown to switch which case is visible
    const buttons = CASES.map((c, i) => ({
      method: 'update',
      label: c.name,
      args: [
        { visible: CASES.map((_, j) => j === i) },
        { 'annotations[0].text': c.text },
      ],
    }));
    const lay = {
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Spectral', color: '#e9e7dd' },
      margin: { l: 60, r: 60, t: 60, b: 70 },
      showlegend: false,
      polar: {
        bgcolor: 'rgba(11,17,36,0.45)',
        radialaxis: { range: [0, 1], gridcolor: 'rgba(150,170,220,0.16)',
          tickfont: { family: 'JetBrains Mono', size: 9, color: '#6b7596' }, angle: 90, tickangle: 90 },
        angularaxis: { gridcolor: 'rgba(150,170,220,0.16)',
          tickfont: { family: 'JetBrains Mono', size: 11, color: '#a9b2cc' } },
      },
      updatemenus: [{
        buttons, direction: 'down', showactive: true, x: 0, xanchor: 'left', y: 1.12, yanchor: 'top',
        bgcolor: 'rgba(11,17,36,0.9)', bordercolor: 'rgba(124,140,255,0.4)',
        font: { family: 'JetBrains Mono', size: 11, color: '#e9e7dd' },
      }],
      annotations: [{
        text: CASES[0].text, showarrow: false, xref: 'paper', yref: 'paper',
        x: 0.5, y: -0.16, xanchor: 'center',
        font: { family: 'Spectral', size: 13, color: '#a9b2cc' },
      }],
    };
    Plotly.newPlot('fig-sentiment', traces, lay, CONF);
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
    gA, gB, gC, gD, gE, gF, gG, gH,
    'fig-sentiment': buildNRC
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

  async function setupNgramNetwork() {
    const el = document.getElementById('fig-ngram');
    if (!el) return;
    const ok = await ensureD3();
    if (!ok) {
      el.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:.82rem;color:#6b7596;text-align:center;padding:24px">Network figure needs an internet connection to load D3.<br>Reconnect and refresh.</div>`;
      return;
    }
    el.innerHTML = '';
    drawNgramNetwork(el);
  }
  function drawNgramNetwork(el) {
    const rng = mulberry32(81321);
    const GROUPS = { skills: '#34e3cf', affect: '#7c8cff', instr: '#ffb74d' };
    const WORDS = [
      // skills (24)
      ['speaking','skills'],['listening','skills'],['reading','skills'],['writing','skills'],
      ['vocabulary','skills'],['grammar','skills'],['pronunciation','skills'],['fluency','skills'],
      ['practice','skills'],['language','skills'],['English','skills'],['learning','skills'],
      ['accuracy','skills'],['comprehension','skills'],['spelling','skills'],['accent','skills'],
      ['conversation','skills'],['translation','skills'],['idiom','skills'],['phrase','skills'],
      ['sentence','skills'],['word','skills'],['dialogue','skills'],['expression','skills'],
      // affect (20)
      ['motivation','affect'],['confidence','affect'],['anxiety','affect'],['interest','affect'],
      ['enjoyment','affect'],['effort','affect'],['attitude','affect'],['curiosity','affect'],
      ['frustration','affect'],['boredom','affect'],['engagement','affect'],['persistence','affect'],
      ['willingness','affect'],['nervousness','affect'],['pride','affect'],['satisfaction','affect'],
      ['stress','affect'],['comfort','affect'],['encouragement','affect'],['belief','affect'],
      // instruction (22)
      ['teacher','instr'],['feedback','instr'],['classroom','instr'],['student','instr'],
      ['lesson','instr'],['homework','instr'],['exam','instr'],['textbook','instr'],['course','instr'],
      ['quiz','instr'],['grade','instr'],['assignment','instr'],['lecture','instr'],['tutor','instr'],
      ['curriculum','instr'],['discussion','instr'],['group','instr'],['project','instr'],
      ['presentation','instr'],['correction','instr'],['rubric','instr'],['syllabus','instr'],
    ];
    const nodes = WORDS.map(([id, group]) => ({ id, group, color: GROUPS[group], freq: 5 + Math.floor(rng() * 16) }));
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const PAIRS = [
      // skills core
      ['language','learning',9],['English','learning',8],['speaking','practice',7],
      ['listening','practice',6],['vocabulary','grammar',6],['reading','writing',5],
      ['speaking','fluency',6],['pronunciation','speaking',5],['language','English',7],
      ['vocabulary','reading',5],['comprehension','listening',6],['comprehension','reading',6],
      ['accuracy','grammar',5],['spelling','writing',5],['accent','pronunciation',5],
      ['conversation','speaking',6],['conversation','fluency',5],['translation','vocabulary',5],
      ['idiom','expression',5],['phrase','expression',5],['sentence','grammar',5],
      ['word','vocabulary',6],['dialogue','conversation',5],['expression','speaking',4],
      // affect core
      ['motivation','effort',6],['confidence','speaking',6],['anxiety','speaking',5],
      ['motivation','interest',6],['enjoyment','motivation',5],['attitude','motivation',5],
      ['curiosity','interest',6],['frustration','grammar',4],['boredom','homework',4],
      ['engagement','discussion',5],['persistence','effort',5],['willingness','speaking',5],
      ['nervousness','exam',5],['satisfaction','feedback',5],['stress','exam',6],
      ['comfort','classroom',4],['encouragement','teacher',6],['belief','confidence',5],
      ['anxiety','nervousness',5],['confidence','fluency',4],['pride','confidence',4],
      // instruction core
      ['teacher','feedback',7],['feedback','student',6],['classroom','teacher',6],
      ['homework','course',5],['exam','course',5],['lesson','classroom',5],['textbook','course',4],
      ['quiz','grade',5],['grade','exam',5],['assignment','homework',6],['lecture','course',5],
      ['tutor','student',5],['curriculum','course',5],['discussion','group',6],['group','project',6],
      ['presentation','project',5],['correction','feedback',6],['rubric','grade',5],
      ['syllabus','course',5],['feedback','learning',5],['grammar','exam',4],
      ['vocabulary','quiz',4],['practice','confidence',5],['student','motivation',4],
    ];
    const links = PAIRS.filter(([a,b]) => byId[a] && byId[b]).map(([a,b,w]) => ({ source: a, target: b, w }));

    const rect = el.getBoundingClientRect();
    const W = Math.max(320, rect.width), H = Math.max(360, rect.height || 460);
    const d3 = window.d3;

    const svg = d3.select(el).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet');
    const tip = d3.select(el).append('div').attr('class', 'ng-tooltip');

    const link = svg.append('g').selectAll('line').data(links).join('line')
      .attr('class', 'ng-link').attr('stroke-width', d => Math.sqrt(d.w));

    const node = svg.append('g').selectAll('g').data(nodes).join('g').attr('class', 'ng-node');
    node.append('circle').attr('r', d => 4 + d.freq * 0.45).attr('fill', d => d.color);
    node.append('text').text(d => d.id).attr('x', d => 6 + d.freq * 0.45).attr('y', 3.5)
      .attr('font-size', d => 9 + d.freq * 0.12);

    // forceX/forceY pull nodes toward the centre so the ~65-node graph stays
    // inside this wide, short container (about 2.4:1) instead of drifting to the
    // edges. Y is pulled harder because the vertical room is tight.
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(46).strength(0.55))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('x', d3.forceX(W / 2).strength(0.07))
      .force('y', d3.forceY(H / 2).strength(0.22))
      .force('collide', d3.forceCollide().radius(d => 11 + d.freq * 0.45));

    sim.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    node.call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    const nbr = {};
    nodes.forEach(n => nbr[n.id] = new Set([n.id]));
    links.forEach(l => {
      const s = l.source.id || l.source, t = l.target.id || l.target;
      nbr[s].add(t); nbr[t].add(s);
    });

    function highlight(id) {
      if (!id) { node.classed('dim', false); link.classed('hot', false).classed('dim', false); return; }
      node.classed('dim', d => !nbr[id].has(d.id));
      link.classed('hot', l => (l.source.id === id || l.target.id === id))
          .classed('dim', l => !(l.source.id === id || l.target.id === id));
    }

    node.on('mouseenter', (e, d) => {
      highlight(d.id);
      const best = links.filter(l => l.source.id === d.id || l.target.id === d.id).sort((a, b) => b.w - a.w)[0];
      const mate = best ? (best.source.id === d.id ? best.target.id : best.source.id) : '—';
      tip.style('opacity', 1).html(`<b style="color:${d.color}">${d.id}</b><br>top collocate: ${mate}`);
    }).on('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      tip.style('left', (e.clientX - r.left + 12) + 'px').style('top', (e.clientY - r.top + 12) + 'px');
    }).on('mouseleave', () => { highlight(null); tip.style('opacity', 0); });

    const search = document.getElementById('ngram-search');
    if (search) search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      if (!q) { highlight(null); return; }
      const hit = nodes.find(n => n.id.toLowerCase().includes(q));
      if (hit) {
        highlight(hit.id);
        hit.fx = W / 2; hit.fy = H / 2; sim.alphaTarget(0.3).restart();
        setTimeout(() => { hit.fx = null; hit.fy = null; sim.alphaTarget(0); }, 1200);
      } else { node.classed('dim', true); link.classed('dim', true); }
    });

    sim.alpha(1).restart();
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

  /* ───────── Research page figures ───────── */
  async function setupResearchFigures() {
    const containers = ['msem-icc', 'msem-variance', 'msem-path',
      'hlm-spaghetti', 'hlm-shrinkage', 'hlm-caterpillar',
      'irt-icc', 'irt-tif', 'irt-theta',
      'meta-forest', 'meta-funnel', 'meta-cumulative',
      'nlp-topics', 'nlp-embed', 'nlp-wordfreq',
      'dyn-phase', 'dyn-trajectory', 'dyn-bifurcation',
      'sem-cfa', 'sem-full'];
    if (!containers.some(id => document.getElementById(id))) return;

    // Load Plotly first
    console.log('Loading Plotly...');
    const ok = await ensurePlotly();
    console.log('Plotly loaded:', ok, 'Plotly object:', typeof window.Plotly);
    if (!ok) {
      console.error('Failed to load Plotly');
      return;
    }

    const ML = { paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 44, r: 16, t: 28, b: 36 }, showlegend: false,
      font: { family: 'Spectral', color: '#e9e7dd', size: 11 } };
    const ax = (t) => ({ title: { text: t, font: { family: 'JetBrains Mono', size: 9, color: '#a9b2cc' } },
      gridcolor: 'rgba(150,170,220,0.12)', zerolinecolor: 'rgba(150,170,220,0.2)',
      tickfont: { family: 'JetBrains Mono', size: 8, color: '#6b7596' }, color: '#a9b2cc' });
    const MC = { responsive: true, displayModeBar: false };

    // ICC by Variable - horizontal bar
    if (document.getElementById('msem-icc')) {
      const vars = ['Motivation', 'Anxiety', 'Engagement', 'Achievement', 'Self-efficacy'];
      const iccs = [0.18, 0.12, 0.22, 0.31, 0.15];
      Plotly.newPlot('msem-icc', [{
        type: 'bar', y: vars, x: iccs, orientation: 'h',
        marker: { color: iccs, colorscale: [[0, '#34e3cf'], [0.5, '#7c8cff'], [1, '#ff5d8f']] },
        text: iccs.map(v => (v * 100).toFixed(0) + '%'), textposition: 'outside',
        textfont: { family: 'JetBrains Mono', size: 9, color: '#a9b2cc' },
        hovertemplate: '%{y}: ICC = %{x:.2f}<extra></extra>'
      }], Object.assign({}, ML, { xaxis: Object.assign(ax('ICC'), { range: [0, 0.45] }), yaxis: ax(''), margin: { l: 75, r: 40, t: 10, b: 35 } }), MC);
    }

    // Variance Partition - stacked bar
    if (document.getElementById('msem-variance')) {
      const vars = ['Reading', 'Writing', 'Listening', 'Speaking'];
      const within = [0.72, 0.68, 0.75, 0.58];
      const between = [0.28, 0.32, 0.25, 0.42];
      Plotly.newPlot('msem-variance', [
        { type: 'bar', y: vars, x: within, orientation: 'h', name: 'Within', marker: { color: '#34e3cf' }, hovertemplate: 'Within: %{x:.0%}<extra></extra>' },
        { type: 'bar', y: vars, x: between, orientation: 'h', name: 'Between', marker: { color: '#ff5d8f' }, hovertemplate: 'Between: %{x:.0%}<extra></extra>' }
      ], Object.assign({}, ML, { barmode: 'stack', xaxis: ax('Proportion'), yaxis: ax(''),
        legend: { font: { size: 9, color: '#a9b2cc' }, orientation: 'h', y: -0.15, x: 0.5, xanchor: 'center' },
        showlegend: true, margin: { l: 60, r: 10, t: 10, b: 40 } }), MC);
    }

    // Two-Level Path (SVG)
    if (document.getElementById('msem-path')) {
      document.getElementById('msem-path').innerHTML += `<svg viewBox="0 0 300 180" style="width:100%;height:calc(100% - 30px);margin-top:30px"><defs><marker id="arr" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#a9b2cc"/></marker></defs><text x="150" y="18" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#6b7596">LEVEL 2 (Between)</text><ellipse cx="80" cy="50" rx="28" ry="18" fill="none" stroke="#ff5d8f" stroke-width="1.5"/><text x="80" y="54" text-anchor="middle" font-family="Fraunces" font-size="11" fill="#ff5d8f">ξB</text><ellipse cx="220" cy="50" rx="28" ry="18" fill="none" stroke="#ff5d8f" stroke-width="1.5"/><text x="220" y="54" text-anchor="middle" font-family="Fraunces" font-size="11" fill="#ff5d8f">ηB</text><line x1="108" y1="50" x2="188" y2="50" stroke="#a9b2cc" stroke-width="1.2" marker-end="url(#arr)"/><line x1="20" y1="90" x2="280" y2="90" stroke="#6b7596" stroke-width="0.8" stroke-dasharray="4,3"/><text x="150" y="108" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#6b7596">LEVEL 1 (Within)</text><ellipse cx="80" cy="140" rx="28" ry="18" fill="none" stroke="#34e3cf" stroke-width="1.5"/><text x="80" y="144" text-anchor="middle" font-family="Fraunces" font-size="11" fill="#34e3cf">ξW</text><ellipse cx="220" cy="140" rx="28" ry="18" fill="none" stroke="#34e3cf" stroke-width="1.5"/><text x="220" y="144" text-anchor="middle" font-family="Fraunces" font-size="11" fill="#34e3cf">ηW</text><line x1="108" y1="140" x2="188" y2="140" stroke="#a9b2cc" stroke-width="1.2" marker-end="url(#arr)"/></svg>`;
    }

    // HLM Random Slopes
    if (document.getElementById('hlm-spaghetti')) {
      const traces = [];
      for (let j = 0; j < 12; j++) {
        const b0 = 2 + (rng() - 0.5) * 1.6, b1 = 0.5 + (rng() - 0.5) * 0.6;
        const xs = [], ys = [];
        for (let x = 0; x <= 10; x += 1) { xs.push(x); ys.push(b0 + b1 * x); }
        traces.push({ x: xs, y: ys, mode: 'lines', line: { width: 1.2, color: lerpColor('#34e3cf', '#ff5d8f', j / 11) }, opacity: 0.7 });
      }
      traces.push({ x: [0,10], y: [2, 7], mode: 'lines', line: { width: 2.5, color: '#e9e7dd' } });
      Plotly.newPlot('hlm-spaghetti', traces, Object.assign({}, ML, { xaxis: ax('X'), yaxis: ax('Y') }), MC);
    }

    // Shrinkage
    if (document.getElementById('hlm-shrinkage')) {
      const raw = [], shrunk = [], labels = [];
      for (let j = 0; j < 8; j++) { const r = (rng()-0.5)*3; raw.push(r); shrunk.push(r*0.65); labels.push('G'+(j+1)); }
      Plotly.newPlot('hlm-shrinkage', [
        { type: 'scatter', x: raw, y: labels, mode: 'markers', marker: { size: 9, color: '#6b7596', symbol: 'circle-open' }, name: 'OLS' },
        { type: 'scatter', x: shrunk, y: labels, mode: 'markers', marker: { size: 9, color: '#34e3cf' }, name: 'BLUP' }
      ], Object.assign({}, ML, { xaxis: ax('Slope'), yaxis: Object.assign(ax(''), { type: 'category' }),
        shapes: [{ type: 'line', x0: 0, x1: 0, y0: -0.5, y1: 7.5, line: { color: '#ffb74d', width: 1.5, dash: 'dash' } }] }), MC);
    }

    // Caterpillar Plot - ranked random effects with CI
    if (document.getElementById('hlm-caterpillar')) {
      const nGroups = 20;
      const effects = [], ses = [];
      for (let j = 0; j < nGroups; j++) { effects.push((rng() - 0.5) * 2); ses.push(0.15 + rng() * 0.25); }
      const sorted = effects.map((e, i) => ({ e, se: ses[i], i })).sort((a, b) => a.e - b.e);
      const y = sorted.map((_, i) => i + 1);
      const x = sorted.map(d => d.e);
      const errLo = sorted.map(d => 1.96 * d.se);
      const errHi = sorted.map(d => 1.96 * d.se);
      const colors = sorted.map(d => (d.e - 1.96 * d.se > 0 || d.e + 1.96 * d.se < 0) ? '#ff5d8f' : '#34e3cf');
      Plotly.newPlot('hlm-caterpillar', [{
        type: 'scatter', x: x, y: y, mode: 'markers',
        error_x: { type: 'data', symmetric: false, array: errHi, arrayminus: errLo, thickness: 1.2, width: 0, color: '#6b7596' },
        marker: { size: 7, color: colors },
        hovertemplate: 'u = %{x:.2f}<extra></extra>'
      }], Object.assign({}, ML, {
        xaxis: ax('Random effect (u)'),
        yaxis: Object.assign(ax('Group (ranked)'), { showticklabels: false }),
        shapes: [{ type: 'line', x0: 0, x1: 0, y0: 0, y1: nGroups + 1, line: { color: '#ffb74d', width: 1, dash: 'dash' } }],
        margin: { l: 50, r: 10, t: 10, b: 35 }
      }), MC);
    }

    // IRT ICC
    if (document.getElementById('irt-icc')) {
      const items = [{a:1.2,b:-1.5,c:'#34e3cf'},{a:1.8,b:0,c:'#ffb74d'},{a:1.0,b:1.2,c:'#ff5d8f'},{a:2.2,b:-0.5,c:'#7c8cff'}];
      const traces = items.map(it => {
        const xs = [], ys = [];
        for (let th = -3; th <= 3; th += 0.15) { xs.push(th); ys.push(1/(1+Math.exp(-it.a*(th-it.b)))); }
        return { x: xs, y: ys, mode: 'lines', line: { width: 2, color: it.c } };
      });
      Plotly.newPlot('irt-icc', traces, Object.assign({}, ML, { xaxis: ax('θ'), yaxis: Object.assign(ax('P'), { range: [0,1] }) }), MC);
    }

    // TIF
    if (document.getElementById('irt-tif')) {
      const items = [{a:1.2,b:-1.5},{a:1.8,b:0},{a:1.0,b:1.2},{a:2.2,b:-0.5},{a:1.5,b:-0.8},{a:1.3,b:0.6}];
      const xs = [], ys = [];
      for (let th = -3; th <= 3; th += 0.15) {
        xs.push(th); let info = 0;
        items.forEach(it => { const p = 1/(1+Math.exp(-it.a*(th-it.b))); info += it.a*it.a*p*(1-p); });
        ys.push(info);
      }
      Plotly.newPlot('irt-tif', [{ x: xs, y: ys, mode: 'lines', fill: 'tozeroy', line: { width: 2, color: '#7c8cff' }, fillcolor: 'rgba(124,140,255,0.2)' }],
        Object.assign({}, ML, { xaxis: ax('θ'), yaxis: ax('I(θ)') }), MC);
    }

    // Ability Estimation - CAT convergence
    if (document.getElementById('irt-theta')) {
      const trueTheta = 1.2, K = 20;
      const items = [];
      for (let i = 0; i < 30; i++) items.push({ b: -2.5 + 5 * rng(), a: 0.8 + 1.2 * rng(), used: false });
      let th = 0, administered = [];
      const steps = [], estimates = [], ciLo = [], ciHi = [];
      for (let k = 1; k <= K; k++) {
        let bestInfo = -1, bestIdx = -1;
        items.forEach((it, idx) => {
          if (it.used) return;
          const p = 1 / (1 + Math.exp(-it.a * (th - it.b)));
          const info = it.a * it.a * p * (1 - p);
          if (info > bestInfo) { bestInfo = info; bestIdx = idx; }
        });
        items[bestIdx].used = true;
        const it = items[bestIdx];
        const pTrue = 1 / (1 + Math.exp(-it.a * (trueTheta - it.b)));
        const resp = rng() < pTrue ? 1 : 0;
        administered.push({ a: it.a, b: it.b, u: resp });
        for (let s = 0; s < 10; s++) {
          let grad = -th, hess = 1;
          administered.forEach(a => {
            const p = 1 / (1 + Math.exp(-a.a * (th - a.b)));
            grad += a.a * (a.u - p);
            hess += a.a * a.a * p * (1 - p);
          });
          th += grad / hess;
        }
        let I = 1;
        administered.forEach(a => { const p = 1 / (1 + Math.exp(-a.a * (th - a.b))); I += a.a * a.a * p * (1 - p); });
        const se = 1 / Math.sqrt(I);
        steps.push(k); estimates.push(th); ciLo.push(th - 1.96 * se); ciHi.push(th + 1.96 * se);
      }
      const band = { x: steps.concat(steps.slice().reverse()), y: ciHi.concat(ciLo.slice().reverse()), fill: 'toself', fillcolor: 'rgba(52,227,207,0.15)', line: { width: 0 }, hoverinfo: 'skip' };
      const line = { x: steps, y: estimates, mode: 'lines+markers', line: { color: '#34e3cf', width: 2 }, marker: { size: 5, color: '#34e3cf' } };
      const truth = { x: [1, K], y: [trueTheta, trueTheta], mode: 'lines', line: { color: '#ff5d8f', width: 1.5, dash: 'dash' } };
      Plotly.newPlot('irt-theta', [band, line, truth], Object.assign({}, ML, {
        xaxis: ax('Items'), yaxis: Object.assign(ax('θ̂'), { range: [-1.5, 2.5] }),
        annotations: [{ x: K, y: trueTheta, text: 'True θ', showarrow: false, font: { size: 9, color: '#ff5d8f' }, xanchor: 'right' }]
      }), MC);
    }

    // Forest Plot
    if (document.getElementById('meta-forest')) {
      const studies = ['Chen 2018', 'Wang 2019', 'Liu 2020', 'Zhang 2021', 'Lin 2022', 'Pooled'];
      const effects = [0.35, 0.52, 0.28, 0.61, 0.40, 0.43], ses = [0.12, 0.15, 0.10, 0.18, 0.11, 0.05];
      const weights = ses.map(s => 1 / (s * s));
      const maxW = Math.max(...weights.slice(0, -1));
      const sizes = weights.map((w, i) => i === 5 ? 14 : 6 + 8 * (w / maxW));
      Plotly.newPlot('meta-forest', [{
        type: 'scatter', x: effects, y: studies, mode: 'markers',
        marker: { size: sizes, color: studies.map((s, i) => i === 5 ? '#ffb74d' : '#34e3cf'), symbol: studies.map((s, i) => i === 5 ? 'diamond' : 'circle') },
        error_x: { type: 'data', array: ses.map(s => 1.96 * s), color: '#6b7596', thickness: 1.5, width: 4 },
        hovertemplate: '%{y}: d = %{x:.2f}<extra></extra>'
      }], Object.assign({}, ML, { xaxis: ax("Cohen's d"), yaxis: Object.assign(ax(''), { type: 'category' }),
        shapes: [{ type: 'line', x0: 0, x1: 0, y0: -0.5, y1: 5.5, line: { color: '#ff5d8f', width: 1, dash: 'dash' } }],
        margin: { l: 70, r: 10, t: 10, b: 35 } }), MC);
    }

    // Funnel Plot
    if (document.getElementById('meta-funnel')) {
      const effs = [], ses = [];
      for (let i = 0; i < 25; i++) { const se = 0.05 + rng() * 0.22; effs.push(0.4 + (rng() - 0.5) * se * 2.5); ses.push(se); }
      const funnelX = [0.4 - 1.96 * 0.28, 0.4, 0.4 + 1.96 * 0.28];
      const funnelY = [0.28, 0, 0.28];
      Plotly.newPlot('meta-funnel', [
        { type: 'scatter', x: funnelX, y: funnelY, mode: 'lines', fill: 'toself', fillcolor: 'rgba(124,140,255,0.08)', line: { color: 'rgba(124,140,255,0.4)', width: 1 }, hoverinfo: 'skip' },
        { type: 'scatter', x: effs, y: ses, mode: 'markers', marker: { size: 8, color: '#34e3cf', opacity: 0.85, line: { color: '#0b1124', width: 1 } }, hovertemplate: 'd = %{x:.2f}, SE = %{y:.2f}<extra></extra>' }
      ], Object.assign({}, ML, { xaxis: ax('Effect size'), yaxis: Object.assign(ax('SE'), { autorange: 'reversed', range: [0.32, 0] }),
        shapes: [{ type: 'line', x0: 0.4, x1: 0.4, y0: 0, y1: 0.32, line: { color: '#ffb74d', width: 1.5, dash: 'dash' } }] }), MC);
    }

    // Cumulative Meta-Analysis
    if (document.getElementById('meta-cumulative')) {
      const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
      const cumEff = [0.55, 0.48, 0.45, 0.42, 0.44, 0.43, 0.42, 0.43, 0.43];
      const cumSE = [0.18, 0.14, 0.11, 0.09, 0.07, 0.06, 0.055, 0.05, 0.048];
      const ciHi = cumEff.map((e, i) => e + 1.96 * cumSE[i]);
      const ciLo = cumEff.map((e, i) => e - 1.96 * cumSE[i]);
      Plotly.newPlot('meta-cumulative', [
        { x: years.concat(years.slice().reverse()), y: ciHi.concat(ciLo.slice().reverse()), fill: 'toself', fillcolor: 'rgba(255,183,77,0.2)', line: { width: 0 }, hoverinfo: 'skip' },
        { x: years, y: cumEff, mode: 'lines+markers', line: { color: '#ffb74d', width: 2.5 }, marker: { size: 7, color: '#ffb74d' }, hovertemplate: '%{x}: d = %{y:.2f}<extra></extra>' }
      ], Object.assign({}, ML, { xaxis: ax('Year'), yaxis: Object.assign(ax('Cumulative d'), { range: [0, 0.9] }) }), MC);
    }

    // Topics - stacked horizontal bar for document-topic distribution
    if (document.getElementById('nlp-topics')) {
      const docs = ['Doc 1', 'Doc 2', 'Doc 3', 'Doc 4', 'Doc 5'];
      const topics = [
        { name: 'Motivation', color: '#34e3cf', vals: [0.45, 0.12, 0.08, 0.35, 0.22] },
        { name: 'Anxiety', color: '#ff5d8f', vals: [0.15, 0.55, 0.20, 0.18, 0.12] },
        { name: 'Strategy', color: '#ffb74d', vals: [0.25, 0.18, 0.48, 0.22, 0.35] },
        { name: 'Assessment', color: '#7c8cff', vals: [0.10, 0.10, 0.18, 0.20, 0.25] },
        { name: 'Vocab', color: '#a9b2cc', vals: [0.05, 0.05, 0.06, 0.05, 0.06] }
      ];
      const traces = topics.map(t => ({
        type: 'bar', y: docs, x: t.vals, name: t.name, orientation: 'h',
        marker: { color: t.color }, hovertemplate: '%{x:.0%}<extra>' + t.name + '</extra>'
      }));
      Plotly.newPlot('nlp-topics', traces, Object.assign({}, ML, {
        barmode: 'stack', xaxis: ax('Topic proportion'), yaxis: ax(''),
        legend: { font: { size: 8, color: '#a9b2cc' }, orientation: 'h', y: -0.15 },
        margin: { l: 45, r: 10, t: 10, b: 45 }
      }), MC);
    }

    // Embeddings - t-SNE with clusters
    if (document.getElementById('nlp-embed')) {
      const clusters = [
        { words: ['motivation','drive','goal','interest'], color: '#34e3cf', cx: -1.5, cy: 1.2 },
        { words: ['anxiety','stress','worry','fear'], color: '#ff5d8f', cx: 1.8, cy: 1.0 },
        { words: ['learning','study','practice','skill'], color: '#7c8cff', cx: 0.2, cy: -1.3 },
        { words: ['test','exam','score','grade'], color: '#ffb74d', cx: 1.5, cy: -0.8 }
      ];
      const traces = clusters.map(c => {
        const xs = c.words.map(() => c.cx + (Math.random() - 0.5) * 0.8);
        const ys = c.words.map(() => c.cy + (Math.random() - 0.5) * 0.8);
        return {
          type: 'scatter', x: xs, y: ys, mode: 'markers+text', text: c.words,
          textposition: 'top center', textfont: { family: 'JetBrains Mono', size: 7, color: '#a9b2cc' },
          marker: { size: 10, color: c.color, opacity: 0.85, line: { color: '#0b1124', width: 1 } },
          hoverinfo: 'text'
        };
      });
      Plotly.newPlot('nlp-embed', traces, Object.assign({}, ML, {
        xaxis: Object.assign(ax('t-SNE 1'), { range: [-3, 3] }),
        yaxis: Object.assign(ax('t-SNE 2'), { range: [-2.5, 2.5] }),
        showlegend: false
      }), MC);
    }

    // Word frequency - horizontal bar chart
    if (document.getElementById('nlp-wordfreq')) {
      const words = ['learning', 'student', 'motivation', 'language', 'anxiety', 'strategy', 'vocabulary', 'writing'];
      const freqs = [245, 198, 167, 145, 132, 118, 95, 87];
      const tfidf = [0.42, 0.38, 0.51, 0.35, 0.48, 0.44, 0.52, 0.39];
      Plotly.newPlot('nlp-wordfreq', [{
        type: 'bar', y: words, x: freqs, orientation: 'h',
        marker: { color: tfidf, colorscale: [[0, '#2a6fb0'], [0.5, '#34e3cf'], [1, '#ffb74d']], showscale: true,
          colorbar: { title: { text: 'TF-IDF', font: { size: 9, color: '#a9b2cc' } }, thickness: 8, len: 0.6, tickfont: { size: 8, color: '#6b7596' } } },
        hovertemplate: '%{y}: %{x} occurrences<br>TF-IDF: %{marker.color:.2f}<extra></extra>'
      }], Object.assign({}, ML, { xaxis: ax('Frequency'), yaxis: ax(''), margin: { l: 65, r: 10, t: 10, b: 35 } }), MC);
    }

    // Phase Portrait
    if (document.getElementById('dyn-phase')) {
      let tx = [1.8], ty = [1.5];
      for (let n = 0; n < 60; n++) { const x = tx[tx.length-1], y = ty[ty.length-1]; tx.push(x+(-0.5*x+0.3*y)*0.15); ty.push(y+(-0.3*x-0.5*y)*0.15); }
      Plotly.newPlot('dyn-phase', [{ type: 'scatter', x: tx, y: ty, mode: 'lines', line: { width: 2.5, color: '#ff5d8f' } }],
        Object.assign({}, ML, { xaxis: Object.assign(ax('Motivation'), { range: [-2.5,2.5] }), yaxis: Object.assign(ax('Anxiety'), { range: [-2.5,2.5] }),
          shapes: [{ type: 'circle', x0: -0.08, x1: 0.08, y0: -0.08, y1: 0.08, fillcolor: '#ffb74d', line: { width: 0 } }] }), MC);
    }

    // Trajectories
    if (document.getElementById('dyn-trajectory')) {
      const t = [], m = [], a = []; let M = 1, A = 0.5;
      for (let i = 0; i <= 80; i++) { t.push(i*0.1); m.push(M); a.push(A); M += (-0.3*M+0.2*A)*0.1; A += (-0.1*M-0.4*A+0.3)*0.1; }
      Plotly.newPlot('dyn-trajectory', [
        { x: t, y: m, mode: 'lines', line: { width: 2, color: '#34e3cf' } },
        { x: t, y: a, mode: 'lines', line: { width: 2, color: '#ff5d8f' } }
      ], Object.assign({}, ML, { xaxis: ax('Time'), yaxis: ax('State') }), MC);
    }

    // Bifurcation
    if (document.getElementById('dyn-bifurcation')) {
      const rs = [], xs = [];
      for (let r = 2.8; r <= 4; r += 0.025) { let x = 0.5; for (let i = 0; i < 80; i++) x = r*x*(1-x); for (let i = 0; i < 15; i++) { x = r*x*(1-x); rs.push(r); xs.push(x); } }
      Plotly.newPlot('dyn-bifurcation', [{ type: 'scatter', x: rs, y: xs, mode: 'markers', marker: { size: 1.2, color: '#7c8cff', opacity: 0.6 } }],
        Object.assign({}, ML, { xaxis: ax('r'), yaxis: ax('x*') }), MC);
    }

    // CFA SVG
    if (document.getElementById('sem-cfa')) {
      document.getElementById('sem-cfa').innerHTML += `<svg viewBox="0 0 400 260" style="width:100%;height:calc(100% - 40px);margin-top:40px"><defs><marker id="a2" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#a9b2cc"/></marker></defs><ellipse cx="100" cy="60" rx="38" ry="20" fill="none" stroke="#34e3cf" stroke-width="2"/><text x="100" y="65" text-anchor="middle" font-family="Fraunces" font-size="12" fill="#34e3cf">Aptitude</text><ellipse cx="300" cy="60" rx="38" ry="20" fill="none" stroke="#ffb74d" stroke-width="2"/><text x="300" y="65" text-anchor="middle" font-family="Fraunces" font-size="12" fill="#ffb74d">Motivation</text><path d="M138,60 Q200,25 262,60" fill="none" stroke="#7c8cff" stroke-width="1.5" stroke-dasharray="4,3"/><text x="200" y="35" text-anchor="middle" font-family="Fraunces" font-size="10" fill="#7c8cff">φ</text><g><rect x="40" y="130" width="36" height="22" rx="3" fill="none" stroke="#a9b2cc"/><text x="58" y="145" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#a9b2cc">x1</text><rect x="82" y="130" width="36" height="22" rx="3" fill="none" stroke="#a9b2cc"/><text x="100" y="145" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#a9b2cc">x2</text><rect x="124" y="130" width="36" height="22" rx="3" fill="none" stroke="#a9b2cc"/><text x="142" y="145" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#a9b2cc">x3</text></g><line x1="75" y1="80" x2="58" y2="128" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a2)"/><line x1="100" y1="80" x2="100" y2="128" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a2)"/><line x1="125" y1="80" x2="142" y2="128" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a2)"/><g><rect x="240" y="130" width="36" height="22" rx="3" fill="none" stroke="#a9b2cc"/><text x="258" y="145" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#a9b2cc">y1</text><rect x="282" y="130" width="36" height="22" rx="3" fill="none" stroke="#a9b2cc"/><text x="300" y="145" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#a9b2cc">y2</text><rect x="324" y="130" width="36" height="22" rx="3" fill="none" stroke="#a9b2cc"/><text x="342" y="145" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#a9b2cc">y3</text></g><line x1="275" y1="80" x2="258" y2="128" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a2)"/><line x1="300" y1="80" x2="300" y2="128" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a2)"/><line x1="325" y1="80" x2="342" y2="128" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a2)"/><text x="200" y="220" text-anchor="middle" font-family="Fraunces" font-style="italic" font-size="11" fill="#6b7596">Σ = ΛΦΛ' + Θ</text></svg>`;
    }

    // Full SEM SVG
    if (document.getElementById('sem-full')) {
      document.getElementById('sem-full').innerHTML += `<svg viewBox="0 0 400 260" style="width:100%;height:calc(100% - 40px);margin-top:40px"><defs><marker id="a3" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#a9b2cc"/></marker></defs><ellipse cx="70" cy="60" rx="32" ry="18" fill="none" stroke="#34e3cf" stroke-width="2"/><text x="70" y="65" text-anchor="middle" font-family="Fraunces" font-size="11" fill="#34e3cf">ξ₁</text><ellipse cx="70" cy="120" rx="32" ry="18" fill="none" stroke="#34e3cf" stroke-width="2"/><text x="70" y="125" text-anchor="middle" font-family="Fraunces" font-size="11" fill="#34e3cf">ξ₂</text><ellipse cx="200" cy="90" rx="32" ry="18" fill="none" stroke="#ffb74d" stroke-width="2"/><text x="200" y="95" text-anchor="middle" font-family="Fraunces" font-size="11" fill="#ffb74d">η₁</text><ellipse cx="320" cy="90" rx="32" ry="18" fill="none" stroke="#ff5d8f" stroke-width="2"/><text x="320" y="95" text-anchor="middle" font-family="Fraunces" font-size="11" fill="#ff5d8f">η₂</text><line x1="102" y1="65" x2="166" y2="85" stroke="#a9b2cc" stroke-width="1.5" marker-end="url(#a3)"/><line x1="102" y1="115" x2="166" y2="95" stroke="#a9b2cc" stroke-width="1.5" marker-end="url(#a3)"/><line x1="232" y1="90" x2="286" y2="90" stroke="#a9b2cc" stroke-width="1.5" marker-end="url(#a3)"/><text x="130" y="70" font-family="Fraunces" font-size="9" fill="#a9b2cc">γ₁₁</text><text x="130" y="115" font-family="Fraunces" font-size="9" fill="#a9b2cc">γ₁₂</text><text x="255" y="82" font-family="Fraunces" font-size="9" fill="#a9b2cc">β₂₁</text><path d="M70,78 Q25,90 70,102" fill="none" stroke="#7c8cff" stroke-width="1.5" stroke-dasharray="4,3"/><g><rect x="160" y="160" width="28" height="18" rx="2" fill="none" stroke="#a9b2cc"/><rect x="193" y="160" width="28" height="18" rx="2" fill="none" stroke="#a9b2cc"/><rect x="283" y="160" width="28" height="18" rx="2" fill="none" stroke="#a9b2cc"/><rect x="316" y="160" width="28" height="18" rx="2" fill="none" stroke="#a9b2cc"/></g><line x1="185" y1="108" x2="174" y2="158" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a3)"/><line x1="215" y1="108" x2="207" y2="158" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a3)"/><line x1="305" y1="108" x2="297" y2="158" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a3)"/><line x1="335" y1="108" x2="330" y2="158" stroke="#a9b2cc" stroke-width="1" marker-end="url(#a3)"/><text x="200" y="220" text-anchor="middle" font-family="Fraunces" font-style="italic" font-size="11" fill="#6b7596">η = Bη + Γξ + ζ</text></svg>`;
    }
  }

  /* ───────── init ───────── */
  function init() {
    setupNav();
    setupReveal();
    setupScrollTop();
    setupCopyright();
    renderMath();
    setupFigures();
    setupNgramNetwork();
    setupTeaching();
    setupResearchFigures();
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
