import { memo, forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * HeistMuseumBackground2D
 *
 * Drop-in 2D replacement for HeistMuseumBackground (Three.js).
 * Canvas-rendered parallax museum with 5 section types, caterpillar paintings.
 *
 * COORDINATE CONTRACT:
 *   - worldXSourceRef.current = gameplay pixels (same as wxRef)
 *   - SECTION_PX = 1000 gameplay pixels per decorative bay
 *     (matches old 3D: SECTION_WIDTH=40 / SCENE_WORLD_SCALE=1/25 = 1000)
 *   - Guards are NOT rendered here; the SVG guardFallbackLayer is authoritative.
 *   - This component is purely decorative.
 *
 * API surface (matches old HeistMuseumBackground):
 *   Props: worldXSourceRef, guardObstacles, onReady, theme, gameplayActive
 *   Ref:   { guards:[], getGuards, getGuardAssignments, worldX }
 */

const SECTION_PX = 1000;
const CANVAS_W = 1000;
const CANVAS_H = 500;
const PAR_DEEP = 0.12;
const PAR_WALL = 0.35;
const PAR_FLOOR = 0.82;
const TILE_CACHE_MAX = 16;
const DUST_COUNT = 55;

// ── Seeded PRNG ──
function seed32(s) {
  let v = s | 0;
  return () => {
    v = (v + 0x6D2B79F5) | 0;
    let t = Math.imul(v ^ (v >>> 15), 1 | v);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Canvas tile painter ──
function paintSection(ctx, W, H, sectionIndex) {
  const rand = seed32(sectionIndex * 7919 + 31337);
  const r = (a, b) => a + (b - a) * rand();
  const pick = a => a[Math.floor(rand() * a.length)];
  const type = ((sectionIndex % 5) + 5) % 5;

  const pals = [
    { wall: "#0b0b1a", trim: "#1a1832", ceil: "#060612", accent: "#c9a84c" },
    { wall: "#140e06", trim: "#221a0c", ceil: "#0a0804", accent: "#b8923a" },
    { wall: "#080814", trim: "#12122a", ceil: "#040408", accent: "#8090b0" },
    { wall: "#e8e4da", trim: "#d4cfc2", ceil: "#f0ece2", accent: "#8a7a5a" },
    { wall: "#0a1218", trim: "#142028", ceil: "#060e14", accent: "#4cb888" },
  ];
  const p = pals[type];
  const dark = type !== 3;

  // Back wall
  ctx.fillStyle = p.wall;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `rgba(${dark ? "255,255,255" : "0,0,0"},${r(0.003, 0.014)})`;
    ctx.fillRect(r(0, W), r(0, H), r(1, 3), r(1, 2));
  }

  // Ceiling
  const cH = H * 0.18;
  const cG = ctx.createLinearGradient(0, 0, 0, cH);
  cG.addColorStop(0, p.ceil); cG.addColorStop(1, "transparent");
  ctx.fillStyle = cG; ctx.fillRect(0, 0, W, cH);
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.strokeStyle = p.trim; ctx.lineWidth = 2.8 - i * 0.3; ctx.globalAlpha = 0.38 - i * 0.04;
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.015 + i * (H * 0.008), W * 0.47 - i * (W * 0.01), H * 0.11 + i * (H * 0.01), 0, Math.PI, 0);
    ctx.stroke(); ctx.restore();
  }

  // Crown molding
  ctx.save(); ctx.strokeStyle = p.accent; ctx.globalAlpha = 0.45; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, cH - 2); ctx.lineTo(W, cH - 2); ctx.stroke();
  ctx.globalAlpha = 0.15; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cH + 3); ctx.lineTo(W, cH + 3); ctx.stroke(); ctx.restore();

  // Wainscoting
  const wY = H * 0.68;
  ctx.save(); ctx.fillStyle = p.trim; ctx.globalAlpha = 0.25; ctx.fillRect(0, wY, W, H - wY); ctx.restore();
  ctx.save(); ctx.strokeStyle = p.accent; ctx.globalAlpha = 0.18; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, wY); ctx.lineTo(W, wY); ctx.stroke(); ctx.restore();
  for (let px = 15; px < W - 15; px += 148) {
    ctx.save(); ctx.strokeStyle = p.accent; ctx.globalAlpha = 0.07; ctx.strokeRect(px, wY + H * 0.02, 138, H * 0.26); ctx.restore();
  }

  // Pilasters
  const pilXs = [0, W * 0.33 - 14, W * 0.66 - 14, W - 28];
  for (const px of pilXs) {
    ctx.save(); ctx.fillStyle = p.trim; ctx.globalAlpha = 0.22; ctx.fillRect(px, cH - H * 0.02, 28, wY - cH + H * 0.04); ctx.restore();
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${dark ? 0.035 : 0.02})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px + 1, cH); ctx.lineTo(px + 1, wY); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = p.accent; ctx.globalAlpha = 0.14; ctx.fillRect(px - 5, cH - H * 0.028, 38, H * 0.016); ctx.restore();
  }

  // Paintings
  const paintSlots = type === 3
    ? [{ cx: W * 0.2, w: W * 0.17, h: H * 0.28 }, { cx: W * 0.5, w: W * 0.19, h: H * 0.32 }, { cx: W * 0.8, w: W * 0.16, h: H * 0.26 }]
    : type === 1
      ? [{ cx: W * 0.28, w: W * 0.14, h: H * 0.2 }, { cx: W * 0.72, w: W * 0.14, h: H * 0.2 }]
      : type === 2
        ? [{ cx: W * 0.5, w: W * 0.2, h: H * 0.14 }]
        : [{ cx: W * 0.18, w: W * 0.16, h: H * 0.24 }, { cx: W * 0.5, w: W * 0.19, h: H * 0.3 }, { cx: W * 0.82, w: W * 0.155, h: H * 0.23 }];

  for (const sl of paintSlots) {
    const fw = sl.w + 20, fh = sl.h + 20;
    const fx = sl.cx - fw / 2, fy = H * 0.26 + r(-H * 0.02, H * 0.02);
    const hue = r(0, 360);

    // Frame
    ctx.save(); ctx.fillStyle = p.accent; ctx.globalAlpha = 0.75; ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(fx + 5, fy + 5, fw - 10, fh - 10); ctx.restore();

    const cx0 = fx + 10, cy0 = fy + 10, cw = fw - 20, ch = fh - 20;
    ctx.fillStyle = `hsl(${hue}, ${dark ? 35 : 20}%, ${dark ? 15 : 82}%)`;
    ctx.fillRect(cx0, cy0, cw, ch);

    ctx.save(); ctx.beginPath(); ctx.rect(cx0, cy0, cw, ch); ctx.clip();

    const style = Math.floor(rand() * 5);
    if (style === 0) {
      // Jewel-tone swirls
      for (let s = 0; s < 14; s++) {
        ctx.strokeStyle = `hsla(${(hue + s * 28) % 360},55%,${dark ? 32 : 58}%,${r(0.25, 0.7)})`;
        ctx.lineWidth = r(2, 14); ctx.beginPath(); ctx.moveTo(cx0 + r(0, cw), cy0 + r(0, ch));
        for (let j = 0; j < 3; j++) ctx.bezierCurveTo(cx0 + r(0, cw), cy0 + r(0, ch), cx0 + r(0, cw), cy0 + r(0, ch), cx0 + r(0, cw), cy0 + r(0, ch));
        ctx.stroke();
      }
    } else if (style === 1) {
      // Landscape
      const hz = cy0 + ch * r(0.35, 0.6);
      const skyG = ctx.createLinearGradient(cx0, cy0, cx0, hz);
      skyG.addColorStop(0, `hsla(${(hue + 200) % 360},40%,${dark ? 18 : 75}%,0.8)`);
      skyG.addColorStop(1, `hsla(${(hue + 180) % 360},35%,${dark ? 22 : 68}%,0.5)`);
      ctx.fillStyle = skyG; ctx.fillRect(cx0, cy0, cw, hz - cy0);
      ctx.fillStyle = `hsla(${(hue + 140) % 360},30%,${dark ? 20 : 60}%,0.6)`;
      ctx.fillRect(cx0, hz, cw, ch - (hz - cy0));
      for (let s = 0; s < 6; s++) {
        ctx.fillStyle = `hsla(${(hue + s * 45) % 360},35%,${dark ? 22 : 55}%,${r(0.15, 0.45)})`;
        ctx.beginPath(); ctx.ellipse(cx0 + r(cw * 0.1, cw * 0.9), hz + r(-ch * 0.1, ch * 0.05), r(cw * 0.08, cw * 0.2), r(ch * 0.06, ch * 0.15), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (style === 2) {
      // Geometric blocks
      for (let s = 0; s < 7; s++) {
        ctx.fillStyle = `hsla(${(hue + s * 55) % 360},${type === 3 ? 65 : 45}%,${dark ? 28 : 55}%,${r(0.35, 0.8)})`;
        ctx.fillRect(cx0 + r(0, cw * 0.65), cy0 + r(0, ch * 0.65), r(cw * 0.12, cw * 0.45), r(ch * 0.12, ch * 0.5));
      }
      if (type === 3) {
        ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
        for (let s = 0; s < 4; s++) { ctx.beginPath(); ctx.moveTo(cx0 + r(0, cw), cy0); ctx.lineTo(cx0 + r(0, cw), cy0 + ch); ctx.stroke(); }
      }
    } else if (style === 3) {
      // Portrait silhouette
      ctx.fillStyle = dark ? `hsla(${hue},30%,18%,0.6)` : `hsla(${hue},20%,75%,0.5)`;
      ctx.fillRect(cx0, cy0, cw, ch);
      ctx.fillStyle = `hsla(${hue},30%,${dark ? 26 : 65}%,0.7)`;
      ctx.beginPath(); ctx.ellipse(cx0 + cw * 0.5, cy0 + ch * 0.3, cw * 0.18, ch * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `hsla(${(hue + 20) % 360},25%,${dark ? 22 : 60}%,0.65)`;
      ctx.beginPath(); ctx.moveTo(cx0 + cw * 0.25, cy0 + ch * 0.52);
      ctx.quadraticCurveTo(cx0 + cw * 0.5, cy0 + ch * 0.42, cx0 + cw * 0.75, cy0 + ch * 0.52);
      ctx.lineTo(cx0 + cw * 0.8, cy0 + ch); ctx.lineTo(cx0 + cw * 0.2, cy0 + ch); ctx.closePath(); ctx.fill();
      for (let s = 0; s < 5; s++) {
        ctx.strokeStyle = `hsla(${(hue + s * 40) % 360},30%,${dark ? 30 : 55}%,${r(0.12, 0.3)})`;
        ctx.lineWidth = r(3, 8); ctx.beginPath(); ctx.moveTo(cx0 + r(0, cw), cy0 + r(0, ch));
        ctx.bezierCurveTo(cx0 + r(0, cw), cy0 + r(0, ch), cx0 + r(0, cw), cy0 + r(0, ch), cx0 + r(0, cw), cy0 + r(0, ch)); ctx.stroke();
      }
    } else {
      // ── Musical Caterpillar painting ──
      const bgWash = dark ? `hsla(${r(180, 260)},30%,14%,0.8)` : `hsla(${r(80, 140)},35%,78%,0.7)`;
      ctx.fillStyle = bgWash; ctx.fillRect(cx0, cy0, cw, ch);
      const groundY = cy0 + ch * 0.72;
      ctx.fillStyle = dark ? "hsla(120,25%,12%,0.5)" : "hsla(100,40%,65%,0.4)";
      ctx.fillRect(cx0, groundY, cw, ch - (groundY - cy0));
      for (let s = 0; s < 6; s++) {
        ctx.strokeStyle = `hsla(${r(80, 160)},${r(20, 40)}%,${dark ? r(16, 28) : r(60, 80)}%,${r(0.08, 0.2)})`;
        ctx.lineWidth = r(4, 12); ctx.beginPath(); ctx.moveTo(cx0 + r(0, cw), cy0 + r(0, ch));
        ctx.bezierCurveTo(cx0 + r(0, cw), cy0 + r(0, ch), cx0 + r(0, cw), cy0 + r(0, ch), cx0 + r(0, cw), cy0 + r(0, ch)); ctx.stroke();
      }
      const segCount = 5, segRadius = Math.min(cw, ch) * 0.09;
      const bodyStartX = cx0 + cw * 0.7, bodyEndX = cx0 + cw * 0.32, bodyBaseY = groundY - segRadius * 0.6;
      const greenBase = dark ? 38 : 48;
      for (let s = segCount - 1; s >= 0; s--) {
        const t = s / (segCount - 1);
        const sx = bodyStartX + (bodyEndX - bodyStartX) * t;
        const wave = Math.sin(t * Math.PI * 1.1) * segRadius * 1.5;
        const sy = bodyBaseY - wave - s * segRadius * 0.15, sr = segRadius * (0.85 + t * 0.2);
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        const sg = ctx.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
        sg.addColorStop(0, `hsl(100,74%,${greenBase + 18}%)`); sg.addColorStop(1, `hsl(110,70%,${greenBase}%)`);
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = `hsla(120,50%,${dark ? 22 : 35}%,0.4)`; ctx.lineWidth = 1.5; ctx.stroke();
        if (s < segCount - 1) {
          ctx.beginPath(); ctx.ellipse(sx, sy + sr * 0.3, sr * 0.45, sr * 0.25, 0, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(48,85%,${dark ? 58 : 68}%,0.5)`; ctx.fill();
        }
      }
      const headX = bodyEndX - segRadius * 0.3;
      const headY = bodyBaseY - Math.sin(Math.PI * 1.1) * segRadius * 1.5 - segCount * segRadius * 0.15 - segRadius * 0.3;
      const headR = segRadius * 1.4;
      const hg = ctx.createRadialGradient(headX - headR * 0.25, headY - headR * 0.25, headR * 0.1, headX, headY, headR);
      hg.addColorStop(0, `hsl(95,78%,${greenBase + 22}%)`); hg.addColorStop(1, `hsl(105,72%,${greenBase + 4}%)`);
      ctx.beginPath(); ctx.arc(headX, headY, headR, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();
      ctx.strokeStyle = `hsla(120,50%,${dark ? 22 : 35}%,0.4)`; ctx.lineWidth = 1.5; ctx.stroke();
      const eyeS = headR * 0.38, eyeY = headY - headR * 0.1, eyeR = headR * 0.28;
      for (const side of [-1, 1]) {
        const ex = headX + side * eyeS;
        ctx.beginPath(); ctx.arc(ex, eyeY, eyeR * 1.2, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill();
        ctx.beginPath(); ctx.arc(ex + side * eyeR * 0.15, eyeY, eyeR, 0, Math.PI * 2); ctx.fillStyle = "#0f172a"; ctx.fill();
        ctx.beginPath(); ctx.arc(ex - eyeR * 0.2, eyeY - eyeR * 0.25, eyeR * 0.3, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fill();
      }
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(headX + side * headR * 0.55, headY + headR * 0.25, headR * 0.18, headR * 0.12, 0, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(10,75%,65%,0.35)"; ctx.fill();
      }
      ctx.beginPath(); ctx.ellipse(headX + headR * 0.05, headY + headR * 0.38, headR * 0.2, headR * 0.15, -0.1, 0, Math.PI * 2);
      ctx.fillStyle = "#7c2d12"; ctx.fill(); ctx.strokeStyle = `hsla(0,0%,${dark ? 10 : 20}%,0.25)`; ctx.lineWidth = 1; ctx.stroke();
      for (const side of [-1, 1]) {
        const ax = headX + side * headR * 0.3, ay = headY - headR;
        const tipX = ax + side * headR * 0.5, tipY = ay - headR * 0.7;
        ctx.strokeStyle = `hsla(0,0%,${dark ? 15 : 10}%,0.7)`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax + side * headR * 0.15, ay - headR * 0.4, tipX, tipY); ctx.stroke();
        ctx.beginPath(); ctx.arc(tipX, tipY, headR * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = side < 0 ? "#f59e0b" : "#fb7185"; ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 1; ctx.stroke();
      }
      const hatX = headX - headR * 0.05, hatTopY = headY - headR * 1.1;
      const brimW = headR * 1.1, hatW = headR * 0.7, hatH = headR * 0.65;
      ctx.beginPath(); ctx.ellipse(hatX, hatTopY, brimW, headR * 0.15, -0.08, 0, Math.PI * 2); ctx.fillStyle = "#1a1a2e"; ctx.fill();
      ctx.fillStyle = "#1e1e32"; ctx.fillRect(hatX - hatW / 2, hatTopY - hatH, hatW, hatH);
      ctx.fillStyle = `hsl(100,60%,${dark ? 35 : 45}%)`; ctx.fillRect(hatX - hatW / 2, hatTopY - hatH * 0.3, hatW, hatH * 0.15);
      ctx.beginPath(); ctx.ellipse(hatX, hatTopY - hatH, hatW * 0.5, headR * 0.1, -0.08, 0, Math.PI * 2); ctx.fillStyle = "#22223a"; ctx.fill();
      for (const np of [{ x: cx0 + cw * 0.78, y: cy0 + ch * 0.18, sz: 1 }, { x: cx0 + cw * 0.85, y: cy0 + ch * 0.35, sz: 0.7 }, { x: cx0 + cw * 0.15, y: cy0 + ch * 0.25, sz: 0.85 }]) {
        const ns = Math.min(cw, ch) * 0.06 * np.sz;
        ctx.fillStyle = dark ? "rgba(255,240,180,0.5)" : "rgba(60,40,20,0.35)";
        ctx.beginPath(); ctx.ellipse(np.x, np.y, ns * 0.7, ns * 0.5, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = dark ? "rgba(255,240,180,0.5)" : "rgba(60,40,20,0.35)"; ctx.lineWidth = ns * 0.18;
        ctx.beginPath(); ctx.moveTo(np.x + ns * 0.6, np.y - ns * 0.2); ctx.lineTo(np.x + ns * 0.6, np.y - ns * 2.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(np.x + ns * 0.6, np.y - ns * 2.2);
        ctx.quadraticCurveTo(np.x + ns * 1.4, np.y - ns * 1.5, np.x + ns * 0.6, np.y - ns * 1.2);
        ctx.strokeStyle = dark ? "rgba(255,240,180,0.4)" : "rgba(60,40,20,0.3)"; ctx.lineWidth = ns * 0.15; ctx.stroke();
      }
    }

    // Painting glaze + frame highlight
    const gl = ctx.createLinearGradient(cx0, cy0, cx0 + cw, cy0 + ch);
    gl.addColorStop(0, "rgba(255,255,255,0.07)"); gl.addColorStop(0.5, "rgba(255,255,255,0.01)"); gl.addColorStop(1, "rgba(0,0,0,0.05)");
    ctx.fillStyle = gl; ctx.fillRect(cx0, cy0, cw, ch); ctx.restore();
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx + 2, fy + 1); ctx.lineTo(fx + fw - 2, fy + 1); ctx.stroke(); ctx.restore();

    // Spotlight cone
    const sg = ctx.createRadialGradient(sl.cx, fy, 0, sl.cx, fy + fh * 0.5, fw);
    sg.addColorStop(0, `rgba(255,244,168,${dark ? 0.09 : 0.035})`); sg.addColorStop(1, "transparent");
    ctx.save(); ctx.fillStyle = sg; ctx.beginPath();
    ctx.moveTo(sl.cx - 10, H * 0.04); ctx.lineTo(sl.cx - fw * 0.75, fy + fh + H * 0.06);
    ctx.lineTo(sl.cx + fw * 0.75, fy + fh + H * 0.06); ctx.lineTo(sl.cx + 10, H * 0.04);
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.fillStyle = `rgba(255,244,168,${dark ? 0.4 : 0.18})`;
    ctx.beginPath(); ctx.arc(sl.cx, H * 0.036, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // Pedestals & artifacts
  if (type === 1 || type === 2 || type === 4) {
    const pedSlots = type === 1
      ? [{ cx: W * 0.16, k: "mask" }, { cx: W * 0.4, k: "idol" }, { cx: W * 0.64, k: "vase" }, { cx: W * 0.86, k: "crown" }]
      : type === 2
        ? [{ cx: W * 0.18, k: "gem" }, { cx: W * 0.4, k: "vase" }, { cx: W * 0.62, k: "gem" }, { cx: W * 0.84, k: "crown" }]
        : [{ cx: W * 0.25, k: "idol" }, { cx: W * 0.5, k: "mask" }, { cx: W * 0.75, k: "vase" }];

    for (const sl of pedSlots) {
      const pw = W * 0.05 + r(0, W * 0.015), ph = H * 0.11 + r(0, H * 0.05);
      const px = sl.cx - pw / 2, py = wY - ph;
      const pg = ctx.createLinearGradient(px, py, px + pw, py);
      pg.addColorStop(0, type === 2 ? "#1a2030" : "#5a5548"); pg.addColorStop(0.35, type === 2 ? "#262f42" : "#7e7868");
      pg.addColorStop(0.65, type === 2 ? "#242e40" : "#726c60"); pg.addColorStop(1, type === 2 ? "#181e2a" : "#4a4538");
      ctx.fillStyle = pg; ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = type === 2 ? "#2e3a4e" : "#908a7e"; ctx.fillRect(px - 5, py - 5, pw + 10, 9);
      ctx.fillStyle = type === 2 ? "#222a38" : "#6a6458"; ctx.fillRect(px - 3, py + ph - 5, pw + 6, 7);

      const ay = py - H * 0.025;
      ctx.save(); ctx.globalAlpha = 0.85;
      if (sl.k === "mask") {
        ctx.fillStyle = "#d7a62e"; ctx.beginPath(); ctx.ellipse(sl.cx, ay - H * 0.02, W * 0.014, H * 0.036, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0a0a0a"; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.ellipse(sl.cx - W * 0.005, ay - H * 0.026, 3, 2.5, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sl.cx + W * 0.005, ay - H * 0.026, 3, 2.5, 0.2, 0, Math.PI * 2); ctx.fill();
      } else if (sl.k === "idol") {
        ctx.fillStyle = "#37a87a"; ctx.fillRect(sl.cx - 8, ay - H * 0.05, 16, H * 0.044);
        ctx.beginPath(); ctx.arc(sl.cx, ay - H * 0.056, 8, 0, Math.PI * 2); ctx.fill();
      } else if (sl.k === "vase") {
        ctx.fillStyle = "#6db7d8"; ctx.beginPath();
        ctx.moveTo(sl.cx - 12, ay); ctx.quadraticCurveTo(sl.cx - 15, ay - H * 0.03, sl.cx - 8, ay - H * 0.056);
        ctx.lineTo(sl.cx + 8, ay - H * 0.056); ctx.quadraticCurveTo(sl.cx + 15, ay - H * 0.03, sl.cx + 12, ay);
        ctx.closePath(); ctx.fill(); ctx.fillRect(sl.cx - 6, ay - H * 0.068, 12, H * 0.016);
      } else if (sl.k === "crown") {
        ctx.fillStyle = "#b7962f"; ctx.beginPath(); ctx.ellipse(sl.cx, ay - H * 0.012, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI - Math.PI / 2; ctx.fillRect(sl.cx + Math.cos(a) * 10 - 2, ay - H * 0.028 + Math.sin(a) * 3, 4, H * 0.02); }
      } else if (sl.k === "gem") {
        ctx.fillStyle = pick(["#18c36b", "#2f63ff", "#ff3058", "#c8e8ff"]); ctx.beginPath();
        ctx.moveTo(sl.cx, ay - H * 0.048); ctx.lineTo(sl.cx + 10, ay - H * 0.02);
        ctx.lineTo(sl.cx, ay); ctx.lineTo(sl.cx - 10, ay - H * 0.02); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
      const gg = ctx.createRadialGradient(sl.cx, wY + 5, 0, sl.cx, wY + 5, pw * 0.8);
      gg.addColorStop(0, "rgba(255,240,180,0.06)"); gg.addColorStop(1, "transparent");
      ctx.fillStyle = gg; ctx.fillRect(sl.cx - pw, wY - 5, pw * 2, H * 0.04);
      if (type === 2) {
        ctx.save(); ctx.strokeStyle = "rgba(150,190,230,0.2)"; ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 7, py - H * 0.07, pw + 14, ph + H * 0.06);
        ctx.fillStyle = "rgba(150,190,230,0.025)"; ctx.fillRect(px - 7, py - H * 0.07, pw + 14, ph + H * 0.06);
        ctx.strokeStyle = "rgba(200,220,255,0.08)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px - 5, py - H * 0.065); ctx.lineTo(px - 5, py + ph - H * 0.015); ctx.stroke(); ctx.restore();
      }
    }
  }

  // Decorative laser grid (type 2)
  if (type === 2) {
    ctx.save(); ctx.globalAlpha = 0.16; ctx.strokeStyle = "#ff1a32"; ctx.lineWidth = 0.8;
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.28 + i * H * 0.05); ctx.lineTo(W * 0.9, H * 0.28 + i * H * 0.05); ctx.stroke(); }
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(W * 0.1 + i * W * 0.115, H * 0.24); ctx.lineTo(W * 0.1 + i * W * 0.115, H * 0.68); ctx.stroke(); }
    ctx.restore(); ctx.fillStyle = "rgba(255,26,50,0.015)"; ctx.fillRect(W * 0.08, H * 0.22, W * 0.84, H * 0.48);
  }
}

// ── Tile cache ──
const tileCache = new Map();
function getOrPaintTile(idx) {
  if (tileCache.has(idx)) return tileCache.get(idx);
  const c = document.createElement("canvas");
  c.width = CANVAS_W; c.height = CANVAS_H;
  paintSection(c.getContext("2d"), CANVAS_W, CANVAS_H, idx);
  tileCache.set(idx, c);
  if (tileCache.size > TILE_CACHE_MAX) tileCache.delete(tileCache.keys().next().value);
  return c;
}

// ── Main component ──
const HeistMuseumBackground2D = memo(forwardRef(function HeistMuseumBackground2D({
  worldXSourceRef = null,
  guardObstacles = [],
  onReady,
  theme = null,
  gameplayActive = false,
}, ref) {
  const mountRef = useRef(null);
  const rafRef = useRef(0);
  const destroyedRef = useRef(false);
  const deepRef = useRef(null);
  const wallRef = useRef(null);
  const floorRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const dustParticles = useRef(null);

  const apiRef = useRef({
    scene: null, camera: null, renderer: null,
    guards: [], getGuards: () => [], getGuardAssignments: () => new Map(),
    worldX: () => worldXSourceRef?.current ?? 0,
  });

  useImperativeHandle(ref, () => apiRef.current, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    destroyedRef.current = false;

    // Tile management
    const activeTiles = new Map();
    const wallEl = wallRef.current;
    let lastTileCheck = -9999;

    function updateTiles(wx) {
      if (Math.abs(wx - lastTileCheck) < 150) return;
      lastTileCheck = wx;
      const vl = wx * PAR_WALL;
      const startIdx = Math.floor((vl - SECTION_PX) / SECTION_PX);
      const endIdx = Math.ceil((vl + (mount.clientWidth || 720) + SECTION_PX) / SECTION_PX);
      const needed = new Set();
      for (let i = startIdx; i <= endIdx; i++) needed.add(i);
      for (const [idx, cv] of activeTiles) {
        if (!needed.has(idx)) { cv.remove(); activeTiles.delete(idx); }
      }
      for (const idx of needed) {
        if (activeTiles.has(idx)) continue;
        const src = getOrPaintTile(idx);
        const cv = document.createElement("canvas");
        cv.width = CANVAS_W; cv.height = CANVAS_H;
        cv.style.cssText = `position:absolute;left:${idx * SECTION_PX}px;top:0;width:${SECTION_PX + 2}px;height:100%;display:block;pointer-events:none;`;
        cv.getContext("2d").drawImage(src, 0, 0);
        if (wallEl) wallEl.appendChild(cv);
        activeTiles.set(idx, cv);
      }
    }

    // Dust particles
    const dustCv = dustCanvasRef.current;
    let dustCtx = null;
    if (dustCv) {
      dustCv.width = mount.clientWidth || 720;
      dustCv.height = mount.clientHeight || 405;
      dustCtx = dustCv.getContext("2d");
      if (!dustParticles.current) {
        dustParticles.current = Array.from({ length: DUST_COUNT }, () => ({
          x: Math.random() * dustCv.width, y: Math.random() * dustCv.height,
          r: 0.4 + Math.random() * 1.2, dx: (Math.random() - 0.48) * 0.1,
          dy: 0.04 + Math.random() * 0.14, o: 0.04 + Math.random() * 0.1,
        }));
      }
    }

    // Floor canvas
    const floorCv = document.createElement("canvas");
    floorCv.width = 2400; floorCv.height = 120;
    const fCtx = floorCv.getContext("2d");
    const fGrad = fCtx.createLinearGradient(0, 0, 0, 120);
    fGrad.addColorStop(0, "#0e0e20"); fGrad.addColorStop(0.15, "#0c0c1a"); fGrad.addColorStop(1, "#080816");
    fCtx.fillStyle = fGrad; fCtx.fillRect(0, 0, 2400, 120);
    fCtx.strokeStyle = "rgba(255,255,255,0.022)"; fCtx.lineWidth = 1;
    for (let i = 0; i < 35; i++) { fCtx.beginPath(); fCtx.moveTo(i * 70, 0); fCtx.lineTo(i * 70, 120); fCtx.stroke(); }
    for (let i = 0; i < 6; i++) { fCtx.beginPath(); fCtx.moveTo(0, i * 22); fCtx.lineTo(2400, i * 22); fCtx.stroke(); }
    fCtx.fillStyle = "rgba(255,255,255,0.025)"; fCtx.fillRect(0, 0, 2400, 5);

    const floorEl = floorRef.current;
    if (floorEl && !floorEl.querySelector("canvas")) {
      const fcv = document.createElement("canvas");
      fcv.width = 2400; fcv.height = 120;
      fcv.style.cssText = "position:absolute;left:-100%;bottom:0;width:350%;height:100%;pointer-events:none;";
      fcv.getContext("2d").drawImage(floorCv, 0, 0);
      floorEl.appendChild(fcv);
    }

    // Render loop
    let dustFrame = 0;
    function renderFrame() {
      if (destroyedRef.current) return;
      rafRef.current = requestAnimationFrame(renderFrame);
      const wx = worldXSourceRef?.current ?? 0;

      if (deepRef.current) deepRef.current.style.transform = `translate3d(${-(wx * PAR_DEEP).toFixed(1)}px,0,0)`;
      if (wallRef.current) wallRef.current.style.transform = `translate3d(${-(wx * PAR_WALL).toFixed(1)}px,0,0)`;
      if (floorRef.current) floorRef.current.style.transform = `translate3d(${-(wx * PAR_FLOOR).toFixed(1)}px,0,0)`;

      updateTiles(wx);

      // Dust (every 2nd frame)
      dustFrame++;
      if (dustCtx && dustParticles.current && dustFrame % 2 === 0) {
        const dW = dustCv.width, dH = dustCv.height;
        dustCtx.clearRect(0, 0, dW, dH);
        for (const d of dustParticles.current) {
          d.x += d.dx; d.y += d.dy;
          if (d.y > dH + 4) { d.y = -4; d.x = Math.random() * dW; }
          if (d.x < -4) d.x = dW + 4; if (d.x > dW + 4) d.x = -4;
          dustCtx.beginPath(); dustCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          dustCtx.fillStyle = `rgba(255,248,220,${d.o})`; dustCtx.fill();
        }
      }
    }

    if (onReady) onReady(apiRef.current);
    renderFrame();

    return () => {
      destroyedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      for (const [, cv] of activeTiles) cv.remove();
      activeTiles.clear();
    };
  }, [onReady]);

  const backdrop = theme?.backdrop || "radial-gradient(ellipse at 50% 15%, #0f1020 0%, #06070f 50%, #010104 100%)";
  const vignette = theme?.vignette || "radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,.1) 62%, rgba(0,0,0,.24) 78%, rgba(0,0,0,.45) 100%)";
  const edgeGlow = theme?.edgeGlow || "inset 24px 0 36px rgba(255,40,80,.035), inset -24px 0 36px rgba(40,120,255,.035)";

  return (
    <div ref={mountRef} style={{ position: "absolute", inset: 0, overflow: "hidden", background: backdrop, pointerEvents: "none" }}>
      {/* Deep arches */}
      <div ref={deepRef} style={{ position: "absolute", inset: 0, willChange: "transform", pointerEvents: "none" }}>
        <svg viewBox="0 0 3000 200" preserveAspectRatio="none"
          style={{ position: "absolute", left: "-100%", top: 0, width: "500%", height: "40%" }}>
          <defs><linearGradient id="bg2d-dg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#020308" /><stop offset="55%" stopColor="#070918" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" /></linearGradient></defs>
          <rect width="3000" height="200" fill="url(#bg2d-dg)" />
          {Array.from({ length: 20 }, (_, i) => (
            <ellipse key={i} cx={60 + i * 155} cy="18" rx="68" ry="46" fill="none" stroke="#10143a" strokeWidth="2.5" opacity="0.18" />
          ))}
        </svg>
      </div>
      {/* Wall tiles */}
      <div ref={wallRef} style={{ position: "absolute", inset: 0, willChange: "transform", pointerEvents: "none" }} />
      {/* Floor */}
      <div ref={floorRef} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "25%", willChange: "transform", pointerEvents: "none" }} />
      {/* Dust */}
      <canvas ref={dustCanvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.5 }} />
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: vignette, mixBlendMode: "multiply" }} />
      {/* Edge glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: edgeGlow }} />
    </div>
  );
}));

export default HeistMuseumBackground2D;
