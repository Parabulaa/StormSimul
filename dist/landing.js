// StormSight public landing: living atmosphere, 3D hero, one continuous river through Sections 1–2.
(function () {
  'use strict';

  const WX = {
    clear: { risk: 'Low flood risk', sub: 'Rain easing', dot: '#39A96E', depth: 0.2, trend: 'steady', trendColor: '#39A96E' },
    rain: { risk: 'Moderate flood risk', sub: 'Rain increasing', dot: '#F2A33A', depth: 0.5, trend: '▲ rising', trendColor: '#EF6A75' },
    storm: { risk: 'High flood risk', sub: 'Heavy rain bands', dot: '#EF6A75', depth: 1.1, trend: '▲ rising fast', trendColor: '#EF6A75' },
  };

  // River control points: x as a fraction of zone width, y as a fraction of the section it sits in.
  // One spline runs through both sections, so the curve never restarts or cuts at the boundary.
  const RIVER = [
    ['s1', 1.14, -0.04], ['s1', 0.9, 0.06], ['s1', 0.7, 0.15], ['s1', 0.58, 0.27], ['s1', 0.57, 0.39],
    ['s1', 0.66, 0.5], ['s1', 0.76, 0.62], ['s1', 0.76, 0.76], ['s1', 0.66, 0.89], ['s1', 0.52, 0.98],
    // Section 2: passes behind the simulation panel, then under the copy and out to the right
    ['s2', 0.38, 0.08], ['s2', 0.3, 0.22], ['s2', 0.3, 0.38], ['s2', 0.36, 0.56],
    ['s2', 0.48, 0.76], ['s2', 0.64, 0.88], ['s2', 0.86, 0.93], ['s2', 1.18, 0.98],
  ];

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

  let ctx = null; // live mount state

  function html() {
    return `<div class="ssl" data-weather="rain">
  <div class="atmo" aria-hidden="true">
    <div class="atmo-grad"><i class="g g1"></i><i class="g g2"></i><i class="g g3"></i></div>
    <div class="atmo-far">
      <i class="ssl-cloud far lr" style="--w:560px;--d:37s;--o:.75;--x0:8vw;top:8vh;animation-delay:-14s"></i>
      <i class="ssl-cloud far rl" style="--w:440px;--d:33s;--o:.6;--x0:58vw;top:47vh;animation-delay:-21s"></i>
      <i class="ssl-cloud storm-only lr" style="--w:680px;--d:43s;top:22vh;animation-delay:-6s"></i>
    </div>
    <canvas class="atmo-rain" id="rainCanvas"></canvas>
    <div class="atmo-near">
      <i class="ssl-mist" style="--t:60vh;--h:36vh;--d:38s;--dir:mistLR"></i>
      <i class="ssl-mist" style="--t:4vh;--h:26vh;--d:46s;--dir:mistRL;opacity:.7"></i>
      <i class="ssl-cloud mid rl" style="--w:380px;--d:33s;--o:.85;--x0:70vw;top:70vh;animation-delay:-7s"></i>
      <i class="ssl-cloud near lr" style="--w:300px;--d:25s;--o:.85;--x0:32vw;top:31vh;animation-delay:-17s"></i>
    </div>
    <div class="atmo-clear"></div><div class="atmo-storm"></div>
  </div>

  <header class="ssl-header" id="sslHeader">
    <button class="ssl-brand" data-scroll="top" aria-label="StormSight home">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5 21 12l-9 9.5L3 12z" fill="#2E69F2"/><path d="M7.5 13.2c2.6 1.4 4.2-.7 6.2-.7 1.4 0 2 .6 3 .7-1.3 3-3.1 4.3-4.7 4.3s-3.3-1.2-4.5-4.3Z" fill="#fff"/></svg>
      StormSight
    </button>
    <nav class="ssl-nav" aria-label="Public">
      <button class="lnk" data-open-about aria-haspopup="dialog">About</button>
      <button class="lnk" data-scroll="s1">Product</button>
      <button class="lnk" data-open-data aria-haspopup="dialog">How data works</button>
    </nav>
  </header>

  <div class="data-dialog" id="aboutDialog" hidden>
    <button class="data-dialog-backdrop" data-close-about aria-label="Close About StormSight"></button>
    <section class="data-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="aboutDialogTitle" aria-describedby="aboutDialogCopy">
      <button class="data-dialog-close" data-close-about aria-label="Close About StormSight">×</button>
      <div class="ssl-eyebrow">About StormSight</div>
      <h2 id="aboutDialogTitle">Flood preparedness, made easier to understand.</h2>
      <p id="aboutDialogCopy">StormSight is a community-focused web platform that turns forecast rainfall and public hazard data into a clear view of potential local flooding before landfall.</p>
      <div class="about-overview">
        <div><b>See the risk</b><span>Understand the likely flood scenario for your area.</span></div>
        <div><b>Explore locally</b><span>View projected water conditions around homes and streets.</span></div>
        <div><b>Prepare earlier</b><span>Use clearer timing and context to support safer decisions.</span></div>
      </div>
      <p class="data-disclaimer">StormSight is a preparedness tool—not an official warning service.</p>
    </section>
  </div>

  <div class="data-dialog" id="dataSourcesDialog" hidden>
    <button class="data-dialog-backdrop" data-close-data aria-label="Close data sources"></button>
    <section class="data-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="dataDialogTitle" aria-describedby="dataDialogCopy">
      <button class="data-dialog-close" data-close-data aria-label="Close data sources">×</button>
      <div class="ssl-eyebrow">Data sources</div>
      <h2 id="dataDialogTitle">Built from public data.</h2>
      <p id="dataDialogCopy">StormSight combines forecast, hazard, map and elevation data to explain local flood risk.</p>
      <div class="data-source-list" aria-label="StormSight data sources">
        <div class="data-source-row"><b>Open-Meteo</b><span>ECMWF forecasts and ERA5 rainfall</span></div>
        <div class="data-source-row"><b>Project NOAH</b><span>5, 25 and 100-year flood hazard maps</span></div>
        <div class="data-source-row"><b>OpenStreetMap</b><span>Roads, places and infrastructure context</span></div>
        <div class="data-source-row"><b>SRTM</b><span>Terrain elevation</span></div>
      </div>
      <div class="data-source-foot"><span>Public datasets</span><i aria-hidden="true"></i><b>StormSight flood-risk view</b></div>
      <p class="data-disclaimer">Preparedness guidance—not an official warning.</p>
    </section>
  </div>

  <section class="ssl-hero" id="top">
    <div class="ssl-hero-text">
      <div class="ssl-eyebrow">Local flood risk, before landfall</div>
      <h1>See the water <span>before it reaches you.</span></h1>
      <p class="lede">A living 3D view of your home, projected flood depth, storm timing, and safer routes out.</p>
      <div class="ssl-cta">
        <button class="ssl-btn primary" data-scroll="s1">Explore StormSight</button>
        <button class="ssl-btn ghost" data-scroll="s2sim">View simulation</button>
      </div>
    </div>
    <div class="hero-scene" id="heroScene">
      <div class="hero-canvas" id="heroCanvas" role="img" aria-label="3D model of a two-storey home with a car and trees, surrounded by moving flood water"></div>
      <div class="wx hero-wx" role="group" aria-label="Weather preview">
        <button data-wx="clear" aria-pressed="false">Clear</button>
        <button data-wx="rain" aria-pressed="true">Rain</button>
        <button data-wx="storm" aria-pressed="false">Storm</button>
        <span class="sep"></span>
        <button data-pause aria-pressed="false">Pause motion</button>
      </div>
      <svg class="scene-wires" aria-hidden="true">
        <line id="wireRisk"/><line id="wireDepth"/>
        <circle id="dotRisk" r="2.5"/><circle id="haloRisk" class="halo" r="5"/>
        <circle id="dotDepth" r="2.5"/><circle id="haloDepth" class="halo" r="5"/>
      </svg>
      <div class="note note-risk" id="noteRisk"><b><span class="dot" id="riskDot"></span><span id="riskT">Moderate flood risk</span></b><small id="riskS">Rain increasing</small></div>
      <div class="note note-depth" id="noteDepth"><span class="k">PROJECTED DEPTH</span><span class="v" id="depthV">0.5 m</span><span class="t" id="depthT">▲ rising</span></div>
      <div class="note note-place">14.66° N, 121.10° E · Tumana, Marikina</div>
    </div>
    <button class="scroll-hint" data-scroll="s1" aria-label="Scroll to the next section">Scroll
      <svg viewBox="0 0 14 22" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M7 2v17M2.5 14.5 7 19l4.5-4.5"/></svg>
    </button>
  </section>

  <div class="river-zone" id="riverZone">
    <svg class="river-svg river-static" id="riverSvg" aria-hidden="true"></svg>
    <svg class="river-svg river-flow" id="riverFlow" aria-hidden="true"></svg>

    <section class="ssl-section s1" id="s1">
      <div class="copy reveal">
        <div class="ssl-eyebrow">01 · Your area</div>
        <h2>The river starts here.</h2>
        <p>The hero remains clean. Once you scroll down, a meandering river appears with several flowing curved lines instead of one rigid stroke.</p>
        <button class="ssl-text-btn" id="emphRiver">Highlight the flow <span class="arr">→</span></button>
      </div>
    </section>

    <div class="river-note reveal d1" id="riverNote">
      <div class="k">MARIKINA RIVER</div>
      <div class="s"><i></i>Flow increasing</div>
      <p>Multiple current lines move through the same river body, giving it a more natural presence.</p>
    </div>

    <section class="ssl-section s2" id="s2">
      <div class="sim reveal" id="s2sim">
        <div class="sim-head"><span>Flood progression</span><span class="h" id="simH">+12h</span></div>
        <div class="sim-3d" id="simScene" role="img" aria-label="3D preview of the neighbourhood beside the Marikina River, with flood water rising toward your home"><span class="sim-home" id="simHome">Your home</span></div>
        <div class="sim-ctrl">
          <button class="sim-play" id="simPlay" aria-label="Play flood progression">
            <svg viewBox="0 0 12 12" fill="currentColor" id="simIcon"><path d="M2.5 1.2v9.6L10.5 6z"/></svg>
          </button>
          <input class="sim-range" id="simRange" type="range" min="0" max="24" step="0.25" value="12" aria-label="Hours from now">
          <span class="sim-depth" id="simDepth">0.8 m</span>
        </div>
        <div class="sim-ticks" aria-hidden="true"><span>Now</span><span>+6h</span><span>+12h</span><span>+18h</span><span>+24h</span></div>
      </div>
      <div class="copy reveal d1">
        <div class="ssl-eyebrow">02 · Flood progression</div>
        <h2>The atmosphere keeps moving while you scroll.</h2>
        <p>Clouds, rain, mist, and the gradient continue behind the river. Only the information for the current section becomes visible.</p>
      </div>
    </section>
  </div>

  <section class="ssl-section s3 reveal" id="s3">
    <div class="ssl-eyebrow">03 · What to do next</div>
    <h2>Know when to leave,<br>and which way.</h2>
    <p style="max-width:460px">StormSight turns the projection into a short list of decisions for your household.</p>
    <div class="rows">
      <div class="row"><span class="t">+4h</span><span>Move documents and valuables above 1.2 m</span><span class="st ok">Recommended</span></div>
      <div class="row"><span class="t">+9h</span><span>Leave before Gil Fernando Ave. reaches 0.5 m</span><span class="st warn">Leave window</span></div>
      <div class="row"><span class="t">Route</span><span>Tumana Elementary School via J.P. Rizal · 1.8 km</span><span class="st ok">Passable</span></div>
    </div>
    <div class="ssl-cta">
      <button class="ssl-btn primary" data-view="signup">Get started</button>
      <button class="ssl-btn ghost" data-view="simulation">Open full simulation</button>
    </div>
  </section>

  <footer class="ssl-foot">
    <span>StormSight · Flood preparedness prototype</span>
    <span>Demo data, not an official warning. Follow PAGASA and LGU advisories.</span>
  </footer>
</div>`;
  }

  function simSvg() {
    const blocks = [];
    // a small grid of homes east of the river
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const x = 170 + c * 62 + (r % 2) * 10, y = 34 + r * 62;
        if ((r === 1 && c === 2) || (r === 3 && c === 5)) continue;
        blocks.push(`<rect x="${x}" y="${y}" width="40" height="30" rx="2"/>`);
      }
    }
    return `<svg class="sim-map" viewBox="0 0 560 300" role="img" aria-label="Map of Tumana showing flood water spreading from the river toward your home">
      <defs>
        <linearGradient id="simW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#397DDA" stop-opacity=".55"/><stop offset="1" stop-color="#8BE2EF" stop-opacity=".45"/></linearGradient>
        <clipPath id="simClip"><rect width="560" height="300" rx="3"/></clipPath>
      </defs>
      <g clip-path="url(#simClip)">
        <rect width="560" height="300" fill="#EEF5FB"/>
        <g fill="none" stroke="#fff" stroke-width="9"><path d="M150 0V300"/><path d="M150 158H560"/><path d="M400 0V300"/></g>
        <g class="water" id="simWater">
          <path fill="url(#simW)" d="M-20 -10C70 -10 112 30 160 60c58 36 120 30 176 64 64 40 70 112 18 150-48 36-142 30-214 40-60 8-110 0-160 -4Z"/>
          <path class="wline" d="M20 40C80 60 120 90 180 100s130 30 160 70"/>
          <path class="wline" d="M10 130c60 10 110 30 170 50s110 50 140 80" style="animation-duration:18s"/>
        </g>
        <path d="M60 -10C30 60 96 110 58 170S40 260 70 310" fill="none" stroke="#55B7EA" stroke-width="30" stroke-linecap="round" opacity=".55"/>
        <path d="M60 -10C30 60 96 110 58 170S40 260 70 310" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="40 60" opacity=".8" style="animation:flow300 9s linear infinite reverse"/>
        <g fill="#fff" stroke="rgba(16,36,92,.14)">${blocks.join('')}</g>
        <g transform="translate(294 96)">
          <rect x="0" y="0" width="40" height="30" rx="2" fill="#10245C"/>
          <circle cx="20" cy="15" r="3" fill="#fff"/>
        </g>
        <text x="294" y="88" font-size="10" font-weight="600" fill="#10245C" font-family="inherit">Your home</text>
        <text x="16" y="290" font-size="9" letter-spacing="1.4" fill="#397DDA" font-family="inherit">MARIKINA RIVER</text>
      </g>
    </svg>`;
  }

  /* ───────────── River geometry ───────────── */
  // Centripetal Catmull-Rom (no overshoot or cusps between uneven points), resampled to even spacing.
  function spline(pts, step) {
    const end = pts.length - 1;
    const P = [[2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]], ...pts,
      [2 * pts[end][0] - pts[end - 1][0], 2 * pts[end][1] - pts[end - 1][1]]];
    const td = (a, b) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
    const raw = [];
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      const t1 = td(p0, p1), t2 = t1 + td(p1, p2), t3 = t2 + td(p2, p3);
      const n = Math.max(8, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3));
      for (let j = 0; j < n; j++) {
        const t = t1 + ((t2 - t1) * j) / n;
        const L = (a, b, ta, tb) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
        const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
        raw.push(L(L(A1, A2, 0, t2), L(A2, A3, t1, t3), t1, t2));
      }
    }
    raw.push(pts[end]);
    const out = [raw[0]];
    let acc = 0;
    for (let i = 1; i < raw.length; i++) {
      let [ax, ay] = raw[i - 1];
      const [bx, by] = raw[i];
      let seg = Math.hypot(bx - ax, by - ay);
      while (acc + seg >= step) {
        const k = (step - acc) / seg;
        ax += (bx - ax) * k; ay += (by - ay) * k;
        out.push([ax, ay]);
        seg = Math.hypot(bx - ax, by - ay);
        acc = 0;
      }
      acc += seg;
    }
    out.push(raw[raw.length - 1]);
    return out;
  }

  // Bend radius at each point (circumradius over a ±4-sample window).
  function radii(c) {
    return c.map((p, i) => {
      const a = c[Math.max(0, i - 4)], b = c[Math.min(c.length - 1, i + 4)];
      const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), ap = Math.hypot(p[0] - a[0], p[1] - a[1]), pb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const area2 = Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]));
      return area2 > 1e-6 ? (ab * ap * pb) / (2 * area2) : 1e9;
    });
  }

  // Relax tight bends: points whose radius is below rMin are pulled toward a local average,
  // which opens the bend while leaving the rest of the meander untouched.
  function relax(c, rMin, step) {
    let pts = c.map((p) => p.slice());
    const m = 9;
    for (let it = 0; it < 80; it++) {
      const r = radii(pts);
      const raw = r.map((v) => Math.max(0, Math.min(1, ((rMin - v) / rMin) * 2.5)));
      if (raw.every((w) => w === 0)) break;
      const w = raw.map((_, i) => { let mx = 0; for (let j = Math.max(0, i - 14); j <= Math.min(raw.length - 1, i + 14); j++) mx = Math.max(mx, raw[j]); return mx; });
      pts = pts.map((p, i) => {
        if (i < m || i >= pts.length - m || !w[i]) return p;
        let sx = 0, sy = 0;
        for (let j = i - m; j <= i + m; j++) { sx += pts[j][0]; sy += pts[j][1]; }
        const ax = sx / (2 * m + 1), ay = sy / (2 * m + 1);
        return [p[0] + (ax - p[0]) * 0.5 * w[i], p[1] + (ay - p[1]) * 0.5 * w[i]];
      });
    }
    return spline(pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1), step);
  }

  /* ───────────── Minimalist isometric scenery along the banks ───────────── */
  const TREE_PAL = [['#5aa96b', '#79c387', '#9bd6a3'], ['#4f9d72', '#6fbb8e', '#93d1ac'], ['#62ad5f', '#86c77d', '#a8dba0']];
  const ROOF_PAL = [['#2f4f9e', '#4366b8'], ['#5e78a6', '#7a93bf'], ['#b8705a', '#cf8a72']];
  const f1 = (n) => n.toFixed(1);
  const shadow = (x, y, rx, ry) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="rgba(16,36,92,.09)"/>`;

  function treeSvg(x, y, s, pal) {
    const r = 8.5 * s, th = 8 * s, cy = y - th - r * 0.7;
    const P = (a) => f1(x + Math.cos((a * Math.PI) / 180) * r) + ',' + f1(cy + Math.sin((a * Math.PI) / 180) * r * 1.05);
    return shadow(x + 3 * s, y + 1.5 * s, 9 * s, 3.6 * s)
      + `<polygon fill="#9a7657" points="${f1(x - 1.2 * s)},${f1(y)} ${f1(x + 1.2 * s)},${f1(y)} ${f1(x + 0.8 * s)},${f1(cy)} ${f1(x - 0.8 * s)},${f1(cy)}"/>`
      + `<polygon fill="${pal[0]}" points="${[-90, -30, 30, 90, 150, 210].map(P).join(' ')}"/>`
      + `<polygon fill="${pal[1]}" points="${[-90, 210, 150, 90].map(P).join(' ')}"/>`
      + `<polygon fill="${pal[2]}" points="${f1(x)},${f1(cy)} ${P(-90)} ${P(210)}"/>`;
  }

  function pineSvg(x, y, s, pal) {
    const yb = y - 3 * s, h = 27 * s, w = 9 * s;
    const layer = (apex, base, hw) => `<polygon fill="${pal[1]}" points="${f1(x)},${f1(apex)} ${f1(x - hw)},${f1(base)} ${f1(x)},${f1(base)}"/>`
      + `<polygon fill="${pal[0]}" points="${f1(x)},${f1(apex)} ${f1(x)},${f1(base)} ${f1(x + hw)},${f1(base)}"/>`;
    return shadow(x + 3 * s, y + 1 * s, 8 * s, 3.2 * s)
      + `<rect x="${f1(x - 1.1 * s)}" y="${f1(yb)}" width="${f1(2.2 * s)}" height="${f1(3.5 * s)}" fill="#9a7657"/>`
      + layer(yb - h * 0.7, yb, w) + layer(yb - h, yb - h * 0.38, w * 0.74);
  }

  function shrubSvg(x, y, s, pal) {
    return shadow(x + 2 * s, y + 1 * s, 9 * s, 3 * s) + [[-4, -3, 4.2], [3.5, -3.6, 4.8], [0, -6.5, 4]].map(([dx, dy, r]) => {
      const cx = x + dx * s, cy = y + dy * s, rr = r * s;
      return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rr)}" fill="${pal[0]}"/><path d="M${f1(cx)} ${f1(cy - rr)}A${f1(rr)} ${f1(rr)} 0 0 0 ${f1(cx)} ${f1(cy + rr)}Z" fill="${pal[1]}"/>`;
    }).join('');
  }

  function houseSvg(x, y, s, pal) {
    const u = 6.2 * s, w = 3.2, d = 2.5, h = 2.0, rr = 1.25;
    const x0 = x - (w / 2 - d / 2) * 0.866 * u, y0 = y - (w / 2 + d / 2) * 0.5 * u;
    const P = (X, Y, Z) => f1(x0 + (X - Z) * 0.866 * u) + ',' + f1(y0 + (X + Z) * 0.5 * u - Y * u);
    const poly = (fill, ...pts) => `<polygon fill="${fill}" points="${pts.map((p) => P(...p)).join(' ')}"/>`;
    return shadow(x + 6 * s, y + 3 * s, 21 * s, 8 * s)
      + poly('#ffffff', [0, 0, d], [w, 0, d], [w, h, d], [0, h, d])
      + poly('#dbe5f1', [w, 0, d], [w, 0, 0], [w, h, 0], [w, h, d])
      + poly('#dbe5f1', [w, h, d], [w, h, 0], [w, h + rr, d / 2])
      + poly(pal[1], [-0.2, h - 0.12, d + 0.22], [w + 0.2, h - 0.12, d + 0.22], [w + 0.2, h + rr, d / 2], [-0.2, h + rr, d / 2])
      + `<polyline fill="none" stroke="${pal[0]}" stroke-width="${f1(1.6 * s)}" stroke-linejoin="round" points="${P(w + 0.2, h - 0.12, d + 0.22)} ${P(w + 0.2, h + rr, d / 2)} ${P(w + 0.2, h - 0.12, -0.22)}"/>`
      + poly('#1d3784', [0.45, 0, d], [1.05, 0, d], [1.05, 1.15, d], [0.45, 1.15, d])
      + poly('#a6d4f4', [1.6, 0.75, d], [2.6, 0.75, d], [2.6, 1.45, d], [1.6, 1.45, d])
      + poly('#93c5ea', [w, 0.75, 0.7], [w, 0.75, 1.7], [w, 1.45, 1.7], [w, 1.45, 0.7]);
  }

  function scenery({ c, N, ext, W, top, bottom, avoid, k, mobile }) {
    let seed = 1337;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const items = [];
    const R = { house: 30, pine: 13, tree: 15, shrub: 10 };
    const place = (type, x, y, s) => {
      const r = R[type] * s;
      if (x < r + 8 || x > W - r - 8 || y < top || y > bottom) return false;
      for (const a of avoid) {
        const dx = Math.max(a.l - x, 0, x - a.r), dy = Math.max(a.t - y, 0, y - a.b);
        if (Math.hypot(dx, dy) < r) return false;
      }
      for (let j = 0; j < c.length; j += 3) if (Math.hypot(c[j][0] - x, c[j][1] - y) < ext + r * 0.8 + 6) return false;
      for (const o of items) if (Math.hypot(o.x - x, o.y - y) < (o.r + r) * 0.85) return false;
      const pal = type === 'house' ? ROOF_PAL[rnd() < 0.45 ? 0 : rnd() < 0.8 ? 1 : 2] : TREE_PAL[Math.floor(rnd() * 3)];
      const svg = { house: houseSvg, pine: pineSvg, tree: treeSvg, shrub: shrubSvg }[type](x, y, s, pal);
      items.push({ x, y, r, svg });
      return true;
    };
    const every = Math.round((mobile ? 120 : 76) / 6);
    for (let i = 0; i < c.length; i += every) {
      const tx = -N[i][1], ty = N[i][0];
      for (const side of [-1, 1]) {
        if (rnd() > (mobile ? 0.45 : 0.74)) continue;
        const far = rnd() < 0.38;
        const d = ext + 16 + (far ? 58 + rnd() * 110 : rnd() * 30);
        const x = c[i][0] + N[i][0] * side * d + (rnd() - 0.5) * 14;
        const y = c[i][1] + N[i][1] * side * d + (rnd() - 0.5) * 14;
        const roll = rnd(), s = k * (0.85 + rnd() * 0.4);
        const type = far && roll < 0.45 ? 'house' : roll < 0.5 ? 'pine' : roll < 0.82 ? 'tree' : 'shrub';
        if (place(type, x, y, s) && type === 'house') {
          // small clusters: a neighbour along the river and a tree behind
          if (rnd() < 0.6) place('house', x + tx * 50 * s, y + ty * 50 * s, s * 0.95);
          place('tree', x - tx * 34 * s + N[i][0] * side * 22, y - ty * 34 * s + N[i][1] * side * 22, s * 0.9);
        }
      }
    }
    return items.sort((a, b) => a.y - b.y).map((o) => o.svg).join('');
  }

  function reeds(c, N, base, every) {
    let out = '', seed = 99;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 4; i < c.length; i += every) {
      const side = rnd() < 0.5 ? -1 : 1, o = base * (0.6 + rnd() * 0.08);
      const x = c[i][0] + N[i][0] * side * o, y = c[i][1] + N[i][1] * side * o, h = 6 + rnd() * 4;
      for (const [dx, hk] of [[-3.2, 0.55], [-1.6, 0.85], [0, 1], [1.7, 0.8], [3.4, 0.5]]) {
        const ex = x + dx * 1.3, ey = y - h * hk;
        out += `M${f1(x + dx * 0.25)} ${f1(y)}Q${f1(x + dx * 0.6)} ${f1(y - h * hk * 0.6)} ${f1(ex)} ${f1(ey)}`;
      }
    }
    return `<path class="r-reeds" d="${out}"/>`;
  }

  function buildRiver() {
    const zone = ctx.zone, svg = ctx.svg;
    const W = zone.clientWidth, H = zone.clientHeight;
    if (!W || !H) return;
    const mobile = W < 720;
    const secs = {};
    for (const id of ['s1', 's2']) { const el = zone.querySelector('#' + id); secs[id] = { top: el.offsetTop, h: el.offsetHeight }; }
    const squeeze = mobile ? 0.86 : 1;
    const ctrl = RIVER.map(([s, fx, fy]) => [W * (0.5 + (fx - 0.5) * squeeze), secs[s].top + fy * secs[s].h]);
    const base = Math.max(44, Math.min(124, W * 0.068)) * (mobile ? 0.78 : 1);
    const c = relax(spline(ctrl, 6), base * 1.15, 6);

    // arc length and normals
    const S = [0];
    for (let i = 1; i < c.length; i++) S[i] = S[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]);
    const N = c.map((p, i) => {
      const a = c[Math.max(0, i - 2)], b = c[Math.min(c.length - 1, i + 2)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l];
    });
    const half = c.map(() => base / 2);
    const ext = base * 1.03; // half-width of the river incl. its banks

    // local bend radius: current lines are clamped to it so they never fold at a tight bend
    const rad = radii(c);
    const R = c.map((p, i) => {
      const a = c[Math.max(0, i - 4)], b = c[Math.min(c.length - 1, i + 4)];
      const r = rad[i];
      const cross = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]);
      return { r: r * 0.9, side: Math.sign(cross) };
    });
    const clamp = (i, o) => (Math.sign(o) === R[i].side ? Math.sign(o) * Math.min(Math.abs(o), R[i].r) : o);
    const line = (off) => {
      let d = '';
      for (let i = 0; i < c.length; i++) {
        const o = clamp(i, off(i));
        d += (i ? 'L' : 'M') + f1(c[i][0] + N[i][0] * o) + ' ' + f1(c[i][1] + N[i][1] * o);
      }
      return d;
    };
    const current = (f, amp, len, ph) => line((i) => half[i] * (f + amp * Math.sin(S[i] / len + ph)));
    const center = line(() => 0);

    // ripple arcs: small bows across the current, pointing downstream
    let ripples = '';
    const total = S[S.length - 1];
    let n = 0;
    for (let s = 420; s < total - 300; s += 520, n++) {
      const i = S.findIndex((v) => v >= s);
      const side = [-0.35, 0.3, 0.05][n % 3];
      const r = 9 + (n % 3) * 3;
      const cx = c[i][0] + N[i][0] * half[i] * side, cy = c[i][1] + N[i][1] * half[i] * side;
      const tx = N[i][1], ty = -N[i][0];
      ripples += `<path class="ripple" style="animation-delay:${-(n * 1.7) % 6}s" d="M${f1(cx - N[i][0] * r)} ${f1(cy - N[i][1] * r)}Q${f1(cx + tx * r * 0.7)} ${f1(cy + ty * r * 0.7)} ${f1(cx + N[i][0] * r)} ${f1(cy + N[i][1] * r)}"/>`;
    }

    ctx.fade = secs.s2.top + secs.s2.h * 0.95;
    ctx.zoneH = H;
    ctx.maskA = ctx.maskB = null;
    for (const el of [svg, ctx.flowSvg]) el.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // animated layer: only the thin current lines and ripples repaint
    ctx.flowSvg.innerHTML = `
      <path class="flow s" d="${current(-0.22, 0.12, 140, 0.5)}"/>
      <path class="flow s" d="${current(0.27, 0.1, 205, 2.3)}" style="animation-duration:14s"/>
      <path class="flow f1" d="${current(-0.5, 0.1, 180, 0)}"/>
      <path class="flow f2" d="${current(0.02, 0.14, 232, 1.7)}"/>
      <path class="flow f3" d="${current(0.5, 0.1, 160, 3.1)}"/>
      ${ripples}`;
    // static layer: the river is drawn as layered round-joined strokes of one centreline,
    // so the banks stay perfectly parallel through every bend
    const riverSvg = `<defs><linearGradient id="rvBody" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H}">
        <stop offset="0" stop-color="#9BE5F1"/><stop offset=".45" stop-color="#62BEEB"/><stop offset="1" stop-color="#6FC9EE"/></linearGradient></defs>
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path class="r-flood" stroke-width="${f1(base * 2.06)}" d="${center}"/>
        <path class="r-rim-o" stroke-width="${f1(base * 1.42 + 3)}" d="${center}"/>
        <path class="r-rim" stroke-width="${f1(base * 1.42)}" d="${center}"/>
        <path class="r-sand" stroke-width="${f1(base + 12)}" d="${center}"/>
        <path class="r-edge" stroke-width="${f1(base + 4)}" d="${center}"/>
        <path class="r-body" stroke-width="${f1(base)}" d="${center}"/>
        <path class="r-deep" stroke-width="${f1(base * 0.42)}" d="${current(0.04, 0.12, 300, 1)}"/>
      </g>
      ${reeds(c, N, base, mobile ? 30 : 17)}`;
    const sceneryArgs = { c, N, ext, W, mobile, top: secs.s1.top + 24, bottom: ctx.fade - 30, k: Math.max(0.75, Math.min(1.25, W / 1440)) };

    // annotation sits beside the river's centre-right return in Section 1
    const note = ctx.note;
    if (mobile) {
      const copy = zone.querySelector('#s1 .copy');
      note.style.left = '16px';
      note.style.top = secs.s1.top + copy.offsetTop + copy.offsetHeight + 40 + 'px';
    } else {
      // first spot beside the river (scanning down Section 1) that clears both the river and the copy
      const nw = 260, nh = 120, copy = zone.querySelector('#s1 .copy');
      const cr = { l: copy.offsetLeft - 24, r: copy.offsetLeft + copy.offsetWidth + 40, t: secs.s1.top + copy.offsetTop - 24, b: secs.s1.top + copy.offsetTop + copy.offsetHeight + 24 };
      const clear = (x, y) => x > 24 && x + nw < W - 24 &&
        (x > cr.r || x + nw < cr.l || y > cr.b || y + nh < cr.t) &&
        c.every((p, j) => {
          const dx = Math.max(x - p[0], 0, p[0] - (x + nw)), dy = Math.max(y - p[1], 0, p[1] - (y + nh));
          return Math.hypot(dx, dy) > ext + 16;
        });
      let spot = null;
      for (let f = 0.16; f <= 0.8 && !spot; f += 0.02) {
        const y = secs.s1.top + secs.s1.h * f;
        let i = 0, best = Infinity;
        c.forEach((p, j) => { const d = Math.abs(p[1] - y); if (d < best) { best = d; i = j; } });
        const gap = ext + 60;
        if (clear(c[i][0] + gap, y - 8)) spot = { x: c[i][0] + gap, y: y - 8, flip: false };
        else if (clear(c[i][0] - gap - nw, y - 8)) spot = { x: c[i][0] - gap - nw, y: y - 8, flip: true };
      }
      spot = spot || { x: cr.l + 24, y: cr.b + 16, flip: true };
      note.classList.toggle('flip', spot.flip);
      note.style.left = spot.x + 'px';
      note.style.top = spot.y + 'px';
    }

    // scenery keeps clear of every block of text (padded for the reveal offset)
    const zr = zone.getBoundingClientRect();
    const avoid = ['#s1 .copy', '#riverNote', '#s2sim', '#s2 .copy'].map((q) => zone.querySelector(q)).filter(Boolean).map((el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left - zr.left - 28, r: r.right - zr.left + 28, t: r.top - zr.top - 64, b: r.bottom - zr.top + 24 };
    });
    svg.innerHTML = riverSvg + `<g class="scenery">${scenery({ ...sceneryArgs, avoid })}</g>`;
    updateReveal();
  }

  // One gradient mask does both jobs: the scroll-driven reveal from the top,
  // and the soft fade where the river leaves Section 2.
  function updateReveal() {
    if (!ctx || !ctx.zoneH) return;
    const r = ctx.zone.getBoundingClientRect();
    const px = reduced() ? 1e6 : innerHeight * 0.95 - r.top;
    ctx.reveal = Math.max(ctx.reveal, px);
    const a = Math.round(Math.min(ctx.reveal - 280, ctx.fade)), b = Math.max(a + 1, Math.round(Math.min(ctx.reveal, ctx.zoneH)));
    if (a === ctx.maskA && b === ctx.maskB) return;
    ctx.maskA = a; ctx.maskB = b;
    ctx.svg.style.setProperty('--ra', a + 'px');
    ctx.svg.style.setProperty('--rb', b + 'px');
    // currents only run where the body is fully drawn; a rect clip is far cheaper than a mask
    ctx.flowSvg.style.clipPath = `inset(-50px -50px ${Math.max(0, ctx.zoneH - a)}px -50px)`;
  }

  /* ───────────── Weather, depth label, wires ───────────── */
  function setWeather(name) {
    const w = WX[name];
    ctx.root.dataset.weather = name;
    ctx.root.querySelectorAll('[data-wx]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.wx === name)));
    ctx.$('#riskT').textContent = w.risk;
    ctx.$('#riskS').textContent = w.sub;
    ctx.$('#riskDot').style.background = w.dot;
    ctx.$('#depthT').textContent = w.trend;
    ctx.$('#depthT').style.color = w.trendColor;
    ctx.scene?.setWeather(name);
    ctx.kickRain?.();
    tweenDepth(w.depth);
  }

  function tweenDepth(to) {
    const el = ctx.$('#depthV');
    const from = ctx.depthShown;
    const t0 = performance.now(), dur = reduced() ? 1 : 1400;
    cancelAnimationFrame(ctx.depthRaf);
    const step = (now) => {
      if (!ctx) return;
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      ctx.depthShown = from + (to - from) * e;
      el.textContent = ctx.depthShown.toFixed(1) + ' m';
      if (k < 1) ctx.depthRaf = requestAnimationFrame(step);
    };
    ctx.depthRaf = requestAnimationFrame(step);
  }

  function drawWires({ roof, water }) {
    const scene = ctx.heroScene, canvas = ctx.canvasBox;
    const ox = canvas.offsetLeft, oy = canvas.offsetTop;
    const link = (noteEl, anchor, lineId, dotId, haloId) => {
      const ax = anchor.x + ox, ay = anchor.y + oy;
      const n = { l: noteEl.offsetLeft, t: noteEl.offsetTop, w: noteEl.offsetWidth, h: noteEl.offsetHeight };
      const sx = Math.max(n.l, Math.min(ax, n.l + n.w)), sy = Math.max(n.t, Math.min(ay, n.t + n.h));
      const ln = ctx.$('#' + lineId);
      ln.setAttribute('x1', sx); ln.setAttribute('y1', sy); ln.setAttribute('x2', ax); ln.setAttribute('y2', ay);
      for (const id of [dotId, haloId]) { const d = ctx.$('#' + id); d.setAttribute('cx', ax); d.setAttribute('cy', ay); }
    };
    if (scene.offsetWidth) {
      link(ctx.$('#noteRisk'), roof, 'wireRisk', 'dotRisk', 'haloRisk');
      link(ctx.$('#noteDepth'), water, 'wireDepth', 'dotDepth', 'haloDepth');
    }
  }

  /* ───────────── Rain: localized bands drifting across one canvas ───────────── */
  const BANDS = [
    { dir: 1, dur: 30, y: 0.02, h: 0.72, w: 0.4, phase: 0.62, n: 70 },
    { dir: -1, dur: 36, y: 0.44, h: 0.54, w: 0.34, phase: 0.35, n: 55 },
    { dir: 1, dur: 24, y: 0.08, h: 0.84, w: 0.48, phase: 0.1, n: 120, storm: true },
  ];
  const RAIN_LEVEL = { clear: 0.12, rain: 0.6, storm: 1 };

  function startRain() {
    const cv = ctx.$('#rainCanvas'), g = cv.getContext('2d');
    const drops = BANDS.map((b) => Array.from({ length: b.n }, () => ({ u: Math.random() - 0.5, v: Math.random(), sp: 0.75 + Math.random() * 0.5, len: 10 + Math.random() * 8 })));
    let W = 0, H = 0, t = 0, last = performance.now(), raf = 0;
    const level = { all: RAIN_LEVEL[ctx.root.dataset.weather], storm: 0 };
    const size = () => {
      const dpr = Math.min(1.5, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now) => {
      raf = 0;
      if (!ctx) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const moving = !ctx.root.classList.contains('paused') && !reduced();
      if (moving) t += dt;
      const wx = ctx.root.dataset.weather, k = 1 - Math.exp(-dt * 1.5);
      level.all += (RAIN_LEVEL[wx] - level.all) * k;
      level.storm += ((wx === 'storm' ? 1 : 0) - level.storm) * k;
      g.clearRect(0, 0, W, H);
      g.lineWidth = 1.1; g.lineCap = 'round';
      BANDS.forEach((b, bi) => {
        const amt = level.all * (b.storm ? level.storm : 1);
        if (amt < 0.01) return;
        const p = (t / b.dur + b.phase) % 1;
        const cx = b.dir > 0 ? -0.3 * W + p * 1.6 * W : 1.3 * W - p * 1.6 * W;
        const bw = b.w * W, by = b.y * H, bh = b.h * H;
        for (const d of drops[bi]) {
          if (moving) { d.v += (dt * 120 * d.sp) / bh; if (d.v > 1) { d.v -= 1; d.u = Math.random() - 0.5; } }
          const x = cx + d.u * bw - d.v * 40, y = by + d.v * bh;
          if (x < -20 || x > W + 20) continue;
          const fall = (1 - 4 * d.u * d.u) * Math.sin(Math.PI * d.v);
          const a = 0.5 * amt * fall;
          if (a < 0.02) continue;
          g.strokeStyle = 'rgba(57,125,218,' + a.toFixed(3) + ')';
          g.beginPath(); g.moveTo(x, y); g.lineTo(x - d.len * 0.2, y + d.len); g.stroke();
        }
      });
      if (moving || Math.abs(RAIN_LEVEL[wx] - level.all) > 0.005) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf && ctx && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(draw); } };
    size();
    const onResize = () => { size(); kick(); };
    addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', kick);
    ctx.cleanups.push(() => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', kick); });
    ctx.kickRain = kick;
    kick();
  }

  /* ───────────── Pointer parallax (desktop) ───────────── */
  function parallaxLoop() {
    ctx.pRaf = 0;
    const p = ctx.par;
    p.x += (p.tx - p.x) * 0.075;
    p.y += (p.ty - p.y) * 0.075;
    ctx.far.style.transform = `translate3d(${(-p.x * 4).toFixed(2)}px,${(-p.y * 4).toFixed(2)}px,0)`;
    ctx.near.style.transform = `translate3d(${(-p.x * 10).toFixed(2)}px,${(-p.y * 10).toFixed(2)}px,0)`;
    ctx.heroScene.style.transform = `translate3d(${(p.x * 5).toFixed(2)}px,${(p.y * 5).toFixed(2)}px,0)`;
    ctx.scene?.setPointer(p.x, p.y);
    if (Math.abs(p.tx - p.x) > 0.002 || Math.abs(p.ty - p.y) > 0.002) ctx.pRaf = requestAnimationFrame(parallaxLoop);
  }

  /* ───────────── Flood simulation ───────────── */
  function setSim(h) {
    const s = ctx.sim;
    s.h = Math.max(0, Math.min(24, h));
    const depth = 0.2 + 0.05 * s.h;
    const scale = 0.5 + (s.h / 24) * 0.85;
    ctx.$('#simWater')?.setAttribute('transform', `translate(60 150) scale(${scale.toFixed(3)}) translate(-60 -150)`);
    ctx.hood?.setHours(s.h);
    ctx.$('#simDepth').textContent = depth.toFixed(1) + ' m';
    ctx.$('#simH').textContent = s.h < 0.5 ? 'Now' : '+' + Math.round(s.h) + 'h';
    const range = ctx.$('#simRange');
    range.value = s.h;
    range.style.setProperty('--p', (s.h / 24) * 100 + '%');
  }

  function simPlay(on) {
    const s = ctx.sim;
    s.playing = on;
    ctx.$('#simIcon').innerHTML = on ? '<path d="M2.5 1.5h2.6v9H2.5zM6.9 1.5h2.6v9H6.9z"/>' : '<path d="M2.5 1.2v9.6L10.5 6z"/>';
    ctx.$('#simPlay').setAttribute('aria-label', on ? 'Pause flood progression' : 'Play flood progression');
    if (!on) return;
    if (s.h >= 24) setSim(0);
    let last = performance.now();
    const tick = (now) => {
      if (!ctx || !s.playing) return;
      setSim(s.h + ((now - last) / 1000) * 2);
      last = now;
      if (s.h >= 24) return simPlay(false);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ───────────── Mount / unmount ───────────── */
  function mount() {
    unmount();
    const root = document.querySelector('.ssl');
    if (!root) return;
    const $ = (q) => root.querySelector(q);
    ctx = {
      root, $, zone: $('#riverZone'), svg: $('#riverSvg'), flowSvg: $('#riverFlow'), note: $('#riverNote'),
      heroScene: $('#heroScene'), canvasBox: $('#heroCanvas'), far: $('.atmo-far'), near: $('.atmo-near'),
      reveal: -1, depthShown: WX.rain.depth, par: { x: 0, y: 0, tx: 0, ty: 0 }, sim: { h: 12, playing: false },
      cleanups: [], scene: null,
    };
    const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); ctx.cleanups.push(() => t.removeEventListener(ev, fn, opt)); };

    // navigation
    root.querySelectorAll('[data-scroll]').forEach((b) => on(b, 'click', () => {
      const id = b.dataset.scroll;
      const el = id === 'top' ? root : $('#' + id);
      el?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    }));
    root.querySelectorAll('[data-view]').forEach((b) => on(b, 'click', () => window.go?.(b.dataset.view)));
    root.querySelectorAll('[data-toast]').forEach((b) => on(b, 'click', () => window.toast?.(b.dataset.toast)));
    const dialogClosers = [];
    const wireDialog = (openSelector, dialogSelector, closeSelector) => {
      const button = $(openSelector);
      const dialog = $(dialogSelector);
      const close = () => {
        if (!dialog || dialog.hidden) return;
        dialog.classList.remove('open');
        setTimeout(() => { if (!dialog.classList.contains('open')) dialog.hidden = true; }, 220);
        button?.focus();
      };
      on(button, 'click', () => {
        dialog.hidden = false;
        requestAnimationFrame(() => dialog.classList.add('open'));
        dialog.querySelector('.data-dialog-close')?.focus();
      });
      dialog.querySelectorAll(closeSelector).forEach((b) => on(b, 'click', close));
      dialogClosers.push(close);
    };
    wireDialog('[data-open-about]', '#aboutDialog', '[data-close-about]');
    wireDialog('[data-open-data]', '#dataSourcesDialog', '[data-close-data]');
    on(window, 'keydown', (e) => { if (e.key === 'Escape') dialogClosers.forEach((close) => close()); });

    // header + river reveal on scroll
    const header = $('#sslHeader');
    let sRaf = 0;
    on(window, 'scroll', () => {
      if (sRaf) return;
      sRaf = requestAnimationFrame(() => { sRaf = 0; header.classList.toggle('scrolled', scrollY > 8); updateReveal(); });
    }, { passive: true });

    // weather + pause
    root.querySelectorAll('[data-wx]').forEach((b) => on(b, 'click', () => setWeather(b.dataset.wx)));
    const pauseBtn = $('[data-pause]');
    on(pauseBtn, 'click', () => {
      const p = !root.classList.contains('paused');
      root.classList.toggle('paused', p);
      pauseBtn.setAttribute('aria-pressed', String(p));
      pauseBtn.textContent = p ? 'Resume motion' : 'Pause motion';
      ctx.scene?.setPaused(p);
      ctx.hood?.setPaused(p);
      ctx.kickRain?.();
    });

    // pointer parallax
    const hero = $('#top');
    on(hero, 'pointermove', (e) => {
      if (!finePointer() || reduced()) return;
      const r = hero.getBoundingClientRect();
      ctx.par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ctx.par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!ctx.pRaf) ctx.pRaf = requestAnimationFrame(parallaxLoop);
    });
    on(hero, 'pointerleave', () => { ctx.par.tx = 0; ctx.par.ty = 0; if (!ctx.pRaf) ctx.pRaf = requestAnimationFrame(parallaxLoop); });

    // river: rebuild on any layout change
    const ro = new ResizeObserver(() => buildRiver());
    ro.observe(ctx.zone);
    // pause river currents while the river is off screen
    const zio = new IntersectionObserver(([e]) => ctx?.flowSvg.classList.toggle('idle', !e.isIntersecting));
    zio.observe(ctx.zone);
    ctx.cleanups.push(() => zio.disconnect());
    ctx.cleanups.push(() => ro.disconnect());
    on($('#emphRiver'), 'click', () => {
      ctx.svg.classList.add('emph'); ctx.flowSvg.classList.add('emph');
      clearTimeout(ctx.emphT);
      ctx.emphT = setTimeout(() => { ctx?.svg.classList.remove('emph'); ctx?.flowSvg.classList.remove('emph'); }, 1600);
    });

    // section reveal
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    ctx.cleanups.push(() => io.disconnect());

    startRain();

    // simulation
    on($('#simRange'), 'input', (e) => { simPlay(false); setSim(+e.target.value); });
    on($('#simPlay'), 'click', () => simPlay(!ctx.sim.playing));
    setSim(12);

    // 3D hero
    const mountId = (ctx.mountId = Symbol());
    const fallback = () => {
      ctx.canvasBox.classList.add('fallback'); ctx.heroScene.classList.add('ready'); ctx.$('.scene-wires').style.display = 'none';
      ctx.$('#simScene').outerHTML = simSvg();
      setSim(ctx.sim.h);
    };
    import('./landing-3d.js').then(({ createHouseScene, createNeighborhoodScene }) => {
      if (!ctx || ctx.mountId !== mountId) return;
      try {
        ctx.scene = createHouseScene(ctx.canvasBox, { reducedMotion: reduced(), weather: root.dataset.weather, onFrame: drawWires });
        ctx.scene.ready.then(() => { if (ctx && ctx.mountId === mountId) { ctx.canvasBox.classList.add('ready'); ctx.heroScene.classList.add('ready'); } });
        const homeTag = ctx.$('#simHome'), simBox = ctx.$('#simScene');
        ctx.hood = createNeighborhoodScene(simBox, {
          reducedMotion: reduced(), hours: ctx.sim.h,
          onFrame: ({ home }) => { homeTag.style.transform = `translate(${home.x.toFixed(1)}px,${home.y.toFixed(1)}px) translate(-50%,-100%)`; },
        });
        ctx.hood.ready.then(() => { if (ctx && ctx.mountId === mountId) simBox.classList.add('ready'); });
      } catch (err) { console.warn('3D scene unavailable', err); fallback(); }
    }).catch((err) => { console.warn('3D module failed to load', err); if (ctx && ctx.mountId === mountId) fallback(); });

    updateReveal();
  }

  function unmount() {
    if (!ctx) return;
    ctx.cleanups.forEach((f) => f());
    cancelAnimationFrame(ctx.pRaf);
    cancelAnimationFrame(ctx.depthRaf);
    ctx.sim.playing = false;
    ctx.scene?.destroy();
    ctx.hood?.destroy();
    ctx = null;
  }

  window.SSLanding = { html, mount, unmount };
})();
