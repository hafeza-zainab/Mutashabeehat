// scenes/Oasis.js

import React, { useRef, useEffect, useMemo, useState } from 'react';

const sr = s => { const x = Math.sin(s + 1) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const lerp = (a, b, t) => a + (b - a) * t;

const HORIZON = 0.58;
const CAM_MAX = 180;

// ─── PRE-BUILD ───────────────────────────────────────────────────────────
function prebuildDunes() {
    const d = [];
    for (let i = 0; i < 12; i++) {
        d.push({
            nx: sr(i * 37) * 1.4 - 0.2,
            ny: HORIZON - sr(i * 37 + 1) * 0.22,
            rx: 0.12 + sr(i * 37 + 2) * 0.18,
            ry: 0.08 + sr(i * 37 + 3) * 0.12,
            hue: 28 + sr(i * 37 + 4) * 14,
            sat: 55 + sr(i * 37 + 5) * 20,
            lit: 42 + sr(i * 37 + 6) * 18,
            depth: 0.04 + sr(i * 37 + 7) * 0.08,
        });
    }
    return d;
}

function prebuildPlants() {
    const s = [];
    for (let i = 0; i < 180; i++) {
        const seed = i * 83 + 7;
        const angle = (sr(seed) * 2 - 1) * Math.PI * 0.7 + (i % 2 === 0 ? -0.3 : 0.3);
        const dist = 0.08 + sr(seed + 1) * 0.30;
        const nx = 0.5 + Math.cos(angle) * dist + (sr(seed + 2) - 0.5) * 0.06;
        const ny = HORIZON - 0.02 + sr(seed + 3) * 0.18;
        s.push({
            nx: clamp(nx, 0.04, 0.96),
            ny: clamp(ny, HORIZON - 0.01, HORIZON + 0.20),
            type: i % 2 === 0 ? 'cactus' : 'palm',
            size: 0.55 + sr(seed + 4) * 0.7,
            depth: 0.12 + sr(seed + 5) * 0.22,
            swayOff: sr(seed + 6) * Math.PI * 2,
        });
    }
    s.sort((a, b) => a.ny - b.ny);
    return s;
}

function prebuildHouses() {
    const s = [];
    for (let i = 0; i < 26; i++) {
        const seed = i * 113 + 11;
        const angle = (sr(seed) * 2 - 1) * Math.PI * 0.55 + Math.PI * (i % 3 === 0 ? 0.1 : i % 3 === 1 ? -0.1 : 0);
        const dist = 0.10 + sr(seed + 1) * 0.22;
        const nx = 0.5 + Math.cos(angle) * dist * 1.6 + (sr(seed + 2) - 0.5) * 0.05;
        const ny = HORIZON + 0.01 + sr(seed + 3) * 0.14;
        s.push({
            nx: clamp(nx, 0.06, 0.94),
            ny: clamp(ny, HORIZON + 0.005, HORIZON + 0.16),
            w: 0.055 + sr(seed + 4) * 0.04,
            h: 0.05 + sr(seed + 5) * 0.04,
            floors: 1 + (i > 8 ? 1 : 0) + (i > 16 ? 1 : 0),
            hue: 28 + sr(seed + 6) * 12,
            sat: 48 + sr(seed + 7) * 18,
            lit: 52 + sr(seed + 8) * 16,
            depth: 0.14 + sr(seed + 9) * 0.20,
            hasDome: sr(seed + 10) > 0.6,
            hasWindow: true,
        });
    }
    s.sort((a, b) => a.ny - b.ny);
    return s;
}

function prebuildCamels() {
    const s = [];
    for (let i = 0; i < 13; i++) {
        const seed = i * 71 + 3;
        const nx = 0.08 + sr(seed) * 0.84;
        const ny = HORIZON + 0.01 + sr(seed + 1) * 0.20;
        s.push({
            nx: clamp(nx, 0.06, 0.94),
            ny: clamp(ny, HORIZON + 0.005, HORIZON + 0.22),
            dir: sr(seed + 2) > 0.5 ? 1 : -1,
            size: 0.7 + sr(seed + 3) * 0.5,
            depth: 0.12 + sr(seed + 4) * 0.22,
            walkOff: sr(seed + 5) * Math.PI * 2,
            walkSpd: 0.008 + sr(seed + 6) * 0.012,
        });
    }
    s.sort((a, b) => a.ny - b.ny);
    return s;
}

function prebuildDust() {
    return Array.from({ length: 30 }, (_, i) => ({
        x: sr(i * 37), y: HORIZON + 0.05 + sr(i * 37 + 1) * 0.4,
        vx: 0.3 + sr(i * 37 + 2) * 0.8, size: 1 + sr(i * 37 + 3) * 3,
        alpha: 0.1 + sr(i * 37 + 4) * 0.2,
    }));
}

// ─── DRAW HELPERS ─────────────────────────────────────────────────

function drawSky(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H * HORIZON);
    g.addColorStop(0, '#5a8fc8');
    g.addColorStop(0.4, '#88b8e0');
    g.addColorStop(0.8, '#d4b88a');
    g.addColorStop(1, '#e8c87a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * HORIZON);
}

function drawSun(ctx, W, H, camX, camY) {
    const sx = W * 0.75 - camX * 0.02, sy = H * 0.08 - camY * 0.02;
    ctx.save();
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 100);
    halo.addColorStop(0, 'rgba(255,240,150,0.25)');
    halo.addColorStop(1, 'rgba(255,220,80,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff7c0';
    ctx.shadowColor = 'rgba(255,220,80,0.8)';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(sx, sy, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawDunes(ctx, W, H, dunes, camX, camY) {
    for (const d of dunes) {
        const x = d.nx * W - camX * d.depth;
        const y = d.ny * H - camY * d.depth;
        const rx = d.rx * W, ry = d.ry * H;
        ctx.fillStyle = `hsl(${d.hue},${d.sat}%,${d.lit}%)`;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0);
        ctx.fill();
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = 'rgba(255,240,200,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y - ry * 0.15, rx * 0.7, ry * 0.25, 0, Math.PI, 0);
        ctx.stroke();
        ctx.restore();
    }
}

function drawGround(ctx, W, H, camX, camY, frame) {
    const g = ctx.createLinearGradient(0, H * HORIZON, 0, H);
    g.addColorStop(0, '#d4904a');
    g.addColorStop(0.3, '#c87838');
    g.addColorStop(0.7, '#b86828');
    g.addColorStop(1, '#a05820');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * HORIZON, W, H * (1 - HORIZON));

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = 'rgba(255,200,100,0.8)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 20; r++) {
        const ry = H * (HORIZON + 0.02) + r * H * 0.04 - camY * lerp(0.1, 0.5, r / 20);
        const amp = 8 + r * 2;
        const freq = 0.005 + r * 0.0003;
        ctx.beginPath();
        for (let x = 0; x < W + 20; x += 4) {
            const y = ry + Math.sin(x * freq + frame * 0.002 + r) * amp;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    ctx.restore();

    const gs = ctx.createLinearGradient(0, H * HORIZON, 0, H * (HORIZON + 0.06));
    gs.addColorStop(0, 'rgba(100,50,10,0.4)');
    gs.addColorStop(1, 'rgba(100,50,10,0)');
    ctx.fillStyle = gs;
    ctx.fillRect(0, H * HORIZON, W, H * 0.06);
}

function drawDustParticles(ctx, W, H, dust, camX, camY, frame) {
    ctx.save();
    for (const d of dust) {
        d.x += d.vx * 0.001;
        if (d.x > 1.1) d.x = -0.1;
        const a = d.alpha * (0.5 + Math.sin(frame * 0.02 + d.y * 10) * 0.4);
        ctx.fillStyle = `rgba(210,170,80,${a})`;
        ctx.beginPath();
        ctx.arc(d.x * W - camX * 0.4, d.y * H - camY * 0.3, d.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawOasis(ctx, W, H, streak, camX, camY, frame) {
    if (streak < 180) return;
    const alpha = Math.min(1, (streak - 180) / 20);
    const ox = 0.42 * W - camX * 0.25;
    const oy = (HORIZON + 0.08) * H - camY * 0.25;
    const rx = 0.10 * W, ry = 0.055 * H;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(80,50,20,0.5)';
    ctx.beginPath();
    ctx.ellipse(ox, oy, rx + 8, ry + 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const wg = ctx.createRadialGradient(ox - rx * 0.2, oy - ry * 0.2, 0, ox, oy, Math.max(rx, ry));
    wg.addColorStop(0, 'rgba(80,200,210,0.92)');
    wg.addColorStop(0.4, 'rgba(40,170,185,0.88)');
    wg.addColorStop(0.8, 'rgba(20,140,160,0.80)');
    wg.addColorStop(1, 'rgba(10,110,130,0.6)');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.ellipse(ox, oy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let s = 0; s < 6; s++) {
        const sx = ox + (sr(s * 17) - 0.5) * rx * 1.2;
        const sy = oy + (sr(s * 17 + 1) - 0.5) * ry * 1.2;
        const shimAlpha = 0.18 + Math.sin(frame * 0.04 + s) * 0.12;
        ctx.save();
        ctx.globalAlpha = shimAlpha;
        ctx.fillStyle = 'rgba(200,240,255,0.9)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx * 0.12, ry * 0.05, sr(s * 17 + 2) * Math.PI, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = 'rgba(150,230,240,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ox - rx * 0.1, oy - ry * 0.1, rx * 0.9, ry * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

function drawHouse(ctx, W, H, slot, camX, camY, alpha) {
    const x = slot.nx * W - camX * slot.depth;
    const y = slot.ny * H - camY * slot.depth;
    const hw = slot.w * W, hh = slot.h * H;
    if (x < -hw * 2 || x > W + hw * 2) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const floors = slot.floors;
    const totalH = hh * floors;

    ctx.save();
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = 'rgba(60,30,5,0.7)';
    ctx.beginPath();
    ctx.ellipse(x + hw * 0.15, y + 4, hw * 0.55, hh * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let f = 0; f < floors; f++) {
        const fy = y - hh * f;
        const flit = slot.lit - (f * 6);
        ctx.fillStyle = `hsl(${slot.hue},${slot.sat}%,${flit}%)`;
        ctx.fillRect(x - hw / 2, fy - hh, hw, hh);
        ctx.fillStyle = `hsl(${slot.hue},${slot.sat - 5}%,${flit - 12}%)`;
        const sideW = hw * 0.25;
        ctx.beginPath();
        ctx.moveTo(x + hw / 2, fy - hh);
        ctx.lineTo(x + hw / 2 + sideW, fy - hh - hh * 0.08);
        ctx.lineTo(x + hw / 2 + sideW, fy - hh * 0.08);
        ctx.lineTo(x + hw / 2, fy);
        ctx.fill();
        ctx.fillStyle = `hsl(${slot.hue},${slot.sat - 8}%,${flit + 10}%)`;
        ctx.beginPath();
        ctx.moveTo(x - hw / 2, fy - hh);
        ctx.lineTo(x + hw / 2, fy - hh);
        ctx.lineTo(x + hw / 2 + sideW, fy - hh - hh * 0.08);
        ctx.lineTo(x - hw / 2 + sideW, fy - hh - hh * 0.08);
        ctx.fill();
    }

    const roofY = y - totalH;
    ctx.fillStyle = `hsl(${slot.hue},${slot.sat}%,${slot.lit + 8}%)`;
    ctx.fillRect(x - hw / 2 - 2, roofY - hh * 0.06, hw + 4, hh * 0.06);

    if (slot.hasDome) {
        ctx.fillStyle = `hsl(${slot.hue},${slot.sat - 5}%,${slot.lit + 12}%)`;
        ctx.beginPath();
        ctx.ellipse(x + hw * 0.15, roofY, hw * 0.25, hh * 0.22, 0, Math.PI, 0);
        ctx.fill();
    }

    if (slot.hasWindow) {
        for (let f = 0; f < floors; f++) {
            const wy = y - hh * f - hh * 0.45;
            const ww = hw * 0.18, wh = hh * 0.22;
            ctx.fillStyle = 'rgba(30,15,5,0.75)';
            ctx.fillRect(x - hw * 0.3 - ww / 2, wy - wh / 2, ww, wh);
            ctx.fillStyle = 'rgba(80,40,10,0.4)';
            ctx.fillRect(x - hw * 0.3 - ww / 2 - 1, wy - wh / 2 - 1, ww + 2, 3);
            ctx.fillStyle = 'rgba(30,15,5,0.75)';
            ctx.fillRect(x + hw * 0.15 - ww / 2, wy - wh / 2, ww, wh);
            ctx.fillStyle = 'rgba(80,40,10,0.4)';
            ctx.fillRect(x + hw * 0.15 - ww / 2 - 1, wy - wh / 2 - 1, ww + 2, 3);
        }
    }

    const doorW = hw * 0.22, doorH = hh * 0.42;
    ctx.fillStyle = 'rgba(25,10,2,0.85)';
    ctx.beginPath();
    ctx.arc(x, y - doorH + doorW / 2, doorW / 2, Math.PI, 0);
    ctx.rect(x - doorW / 2, y - doorH + doorW / 2, doorW, doorH - doorW / 2);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = alpha * 0.12;
    ctx.strokeStyle = 'rgba(80,40,10,0.8)';
    ctx.lineWidth = 0.8;
    for (let r = 0; r < Math.floor(floors * 4); r++) {
        const ly = y - r * (hh / 4);
        ctx.beginPath();
        ctx.moveTo(x - hw / 2, ly);
        ctx.lineTo(x + hw / 2, ly);
        ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
}

function drawCactus(ctx, W, H, x, y, size, alpha) {
    if (x < -60 || x > W + 60) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const h = size * H * 0.09;
    const w = size * W * 0.012;

    const cg = ctx.createLinearGradient(x - w, y, x + w, y);
    cg.addColorStop(0, '#2d6e30');
    cg.addColorStop(0.5, '#3a8a3c');
    cg.addColorStop(1, '#256028');
    ctx.fillStyle = cg;

    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x - w / 2, y - h, w, h, w / 2);
        ctx.fill();
    } else {
        ctx.fillRect(x - w / 2, y - h, w, h);
    }

    ctx.fillStyle = '#3a8a3c';
    const armW = w * 0.85;
    const armH1 = h * 0.42;
    const armH2 = h * 0.32;

    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x - w * 2.2, y - h * 0.55 - armH1, armW, armH1, w / 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x - w * 2.2, y - h * 0.55 - armH1 - armH2, armW, armH2, w / 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + w * 1.4, y - h * 0.42, armW, armH1, w / 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + w * 1.4, y - h * 0.42 - armH2, armW, armH2, w / 3);
        ctx.fill();
    } else {
        ctx.fillRect(x - w * 2.2, y - h * 0.55 - armH1, armW, armH1);
        ctx.fillRect(x - w * 2.2, y - h * 0.55 - armH1 - armH2, armW, armH2);
        ctx.fillRect(x + w * 1.4, y - h * 0.42, armW, armH1);
        ctx.fillRect(x + w * 1.4, y - h * 0.42 - armH2, armW, armH2);
    }

    ctx.strokeStyle = 'rgba(180,160,80,0.6)';
    ctx.lineWidth = 0.7;
    for (let s = 0; s < 6; s++) {
        const sy = y - h * 0.15 - s * h * 0.14;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, sy);
        ctx.lineTo(x - w / 2 - 5, sy - 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w / 2, sy);
        ctx.lineTo(x + w / 2 + 5, sy - 3);
        ctx.stroke();
    }

    ctx.restore();
}

function drawPalm(ctx, W, H, x, y, size, swayOff, alpha, frame) {
    if (x < -60 || x > W + 60) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const h = size * H * 0.12;
    const sway = Math.sin(frame * 0.015 + swayOff) * 3 * Math.PI / 180;

    ctx.strokeStyle = '#7a5428';
    ctx.lineWidth = Math.max(2, size * 6);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.sin(sway) * h * 0.3, y - h * 0.5, x + Math.sin(sway) * h * 0.5, y - h);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100,65,25,0.4)';
    ctx.lineWidth = Math.max(1, size * 2);
    for (let r = 0; r < 6; r++) {
        const ry = y - h * (0.1 + r * 0.15);
        const rx2 = x + Math.sin(sway) * h * (0.1 + r * 0.07);
        ctx.beginPath();
        ctx.arc(rx2, ry, Math.max(1, size * 2.5), 0, Math.PI * 2);
        ctx.stroke();
    }

    const topX = x + Math.sin(sway) * h * 0.5;
    const topY = y - h;
    const fronds = [
        [0, -1], [0.7, -0.7], [1, -0.1], [-0.7, -0.7], [-1, -0.1],
        [0.5, -0.9], [-0.5, -0.9], [0.9, -0.4], [-0.9, -0.4],
    ];

    for (let fi = 0; fi < fronds.length; fi++) {
        const [fx, fy] = fronds[fi];
        const fLen = size * (20 + sr(swayOff * 100 + fi * 7) * 10);
        const ex = topX + fx * fLen, ey = topY + fy * fLen;
        ctx.strokeStyle = '#5a7828';
        ctx.lineWidth = Math.max(1, size * 1.8);
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo((topX + ex) / 2, topY - 10, ex, ey);
        ctx.stroke();
        ctx.fillStyle = `hsl(${100 + sr(swayOff * 100 + fi * 7 + 1) * 20},${55 + sr(swayOff * 100 + fi * 7 + 2) * 20}%,${25 + sr(swayOff * 100 + fi * 7 + 3) * 12}%)`;
        ctx.save();
        ctx.translate(topX, topY);
        const ang = Math.atan2(ey - topY, ex - topX);
        ctx.rotate(ang + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, fLen * 0.6, size * 5, size * 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (size > 0.8) {
        ctx.fillStyle = '#c85820';
        for (let d = 0; d < 8; d++) {
            ctx.beginPath();
            ctx.arc(
                topX + (sr(swayOff * 100 + d * 17) - 0.5) * 12,
                topY + 4 + sr(swayOff * 100 + d * 17 + 1) * 8,
                2 + sr(swayOff * 100 + d * 17 + 2) * 2,
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    ctx.restore();
}

function drawCamel(ctx, W, H, slot, camX, camY, alpha, frame) {
    const x = slot.nx * W - camX * slot.depth;
    const y = slot.ny * H - camY * slot.depth;
    if (x < -80 || x > W + 80) return;
    const sc = slot.size * (H / 800);
    const dir = slot.dir;
    const walk = Math.sin(frame * slot.walkSpd + slot.walkOff);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(dir, 1);

    ctx.save();
    ctx.globalAlpha = alpha * 0.25;
    ctx.fillStyle = 'rgba(50,25,5,0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 35 * sc, 8 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#b86830';
    ctx.lineWidth = 5 * sc;
    ctx.lineCap = 'round';
    const legPairs = [[-20, -10], [8, 18]];
    for (const [lx1, lx2] of legPairs) {
        const a1 = walk * 0.25, a2 = -walk * 0.25;
        ctx.beginPath();
        ctx.moveTo(lx1 * sc, -5 * sc);
        ctx.quadraticCurveTo((lx1 + a1 * 10) * sc, 14 * sc, (lx1 + a1 * 6) * sc, 28 * sc);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx2 * sc, -5 * sc);
        ctx.quadraticCurveTo((lx2 + a2 * 10) * sc, 14 * sc, (lx2 + a2 * 6) * sc, 28 * sc);
        ctx.stroke();
    }

    const bodyG = ctx.createRadialGradient(0, -12 * sc, 5 * sc, 0, -8 * sc, 32 * sc);
    bodyG.addColorStop(0, '#d8885a');
    bodyG.addColorStop(0.6, '#c87838');
    bodyG.addColorStop(1, '#a86028');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(0, -12 * sc, 34 * sc, 20 * sc, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c87838';
    ctx.beginPath();
    ctx.ellipse(5 * sc, -30 * sc, 16 * sc, 14 * sc, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = 'rgba(220,180,100,0.6)';
    ctx.beginPath();
    ctx.ellipse(3 * sc, -34 * sc, 8 * sc, 6 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#d08840';
    ctx.lineWidth = 10 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18 * sc, -20 * sc);
    ctx.quadraticCurveTo(-26 * sc, -36 * sc, -22 * sc, -48 * sc);
    ctx.stroke();

    ctx.fillStyle = '#c87838';
    ctx.beginPath();
    ctx.ellipse(-22 * sc, -52 * sc, 11 * sc, 8 * sc, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-30 * sc, -49 * sc, 7 * sc, 5 * sc, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a0a00';
    ctx.beginPath();
    ctx.arc(-18 * sc, -54 * sc, 2 * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(-17 * sc, -55 * sc, 0.8 * sc, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b86828';
    ctx.beginPath();
    ctx.ellipse(-14 * sc, -58 * sc, 3 * sc, 5 * sc, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawLegendaryGlow(ctx, W, H, streak) {
    if (streak < 365) return;
    const g = ctx.createRadialGradient(W * 0.42, H * (HORIZON + 0.1), 0, W * 0.42, H * (HORIZON + 0.1), W * 0.5);
    g.addColorStop(0, 'rgba(255,200,80,0.08)');
    g.addColorStop(1, 'rgba(255,180,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}

// ─── REACT COMPONENT ────────────────────────────────────────────

const Oasis = ({ streak = 0, onClose }) => {
    const canvasRef = useRef(null);
    const [visible, setStatus] = useState(false);
    const streakRef = useRef(streak);
    streakRef.current = streak;

    const stateRef = useRef({
        W: 0, H: 0, camX: 0, camY: 0, frame: 0, keys: {},
        touch: { a: false, sx: 0, sy: 0, scx: 0, scy: 0 },
        DUNES: prebuildDunes(),
        PLANTS: prebuildPlants(),
        HOUSES: prebuildHouses(),
        CAMELS: prebuildCamels(),
        DUST: prebuildDust(),
        animId: null,
    });

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const sy = window.scrollY;
        const b = document.body;
        const o = {
            overflow: b.style.overflow,
            position: b.style.position,
            top: b.style.top,
            width: b.style.width,
        };
        b.style.overflow = 'hidden';
        b.style.position = 'fixed';
        b.style.top = `-${sy}px`;
        b.style.width = '100%';
        const t = setTimeout(() => setStatus(true), 50);
        return () => {
            clearTimeout(t);
            Object.assign(b.style, o);
            window.scrollTo(0, sy);
        };
    }, []);

    useEffect(() => {
        const h = () => {
            const c = canvasRef.current;
            if (!c) return;
            const s = stateRef.current;
            s.W = c.width = window.innerWidth;
            s.H = c.height = window.innerHeight;
        };
        h();
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    useEffect(() => {
        const d = (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onCloseRef.current?.();
                return;
            }
            stateRef.current.keys[e.key] = true;
        };
        const u = (e) => {
            e.stopPropagation();
            delete stateRef.current.keys[e.key];
        };
        window.addEventListener('keydown', d, true);
        window.addEventListener('keyup', u, true);
        return () => {
            window.removeEventListener('keydown', d, true);
            window.removeEventListener('keyup', u, true);
        };
    }, []);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ts = (e) => {
            e.stopPropagation();
            const t = e.touches[0];
            const s = stateRef.current;
            s.touch = { a: true, sx: t.clientX, sy: t.clientY, scx: s.camX, scy: s.camY };
        };
        const tm = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const s = stateRef.current;
            if (!s.touch.a) return;
            const t2 = e.touches[0];
            s.camX = clamp(s.touch.scx - (t2.clientX - s.touch.sx) * 0.5, -CAM_MAX, CAM_MAX);
            s.camY = clamp(s.touch.scy - (t2.clientY - s.touch.sy) * 0.5, -CAM_MAX, CAM_MAX);
        };
        const te = (e) => {
            e.stopPropagation();
            stateRef.current.touch.a = false;
        };
        c.addEventListener('touchstart', ts, { passive: true });
        c.addEventListener('touchmove', tm, { passive: false });
        c.addEventListener('touchend', te, { passive: true });
        return () => {
            c.removeEventListener('touchstart', ts);
            c.removeEventListener('touchmove', tm);
            c.removeEventListener('touchend', te);
        };
    }, []);

    useEffect(() => {
        const SPD = 3.5;

        const tick = () => {
            const c = canvasRef.current;
            if (!c) {
                stateRef.current.animId = requestAnimationFrame(tick);
                return;
            }
            const ctx = c.getContext('2d');
            const s = stateRef.current;
            const { W, H, keys } = s;

            if (!W || !H) {
                s.animId = requestAnimationFrame(tick);
                return;
            }

            if (keys['ArrowLeft']) s.camX = clamp(s.camX - SPD, -CAM_MAX, CAM_MAX);
            if (keys['ArrowRight']) s.camX = clamp(s.camX + SPD, -CAM_MAX, CAM_MAX);
            if (keys['ArrowUp']) s.camY = clamp(s.camY - SPD, -CAM_MAX, CAM_MAX);
            if (keys['ArrowDown']) s.camY = clamp(s.camY + SPD, -CAM_MAX, CAM_MAX);
            if (!keys['ArrowLeft'] && !keys['ArrowRight']) s.camX *= 0.96;
            if (!keys['ArrowUp'] && !keys['ArrowDown']) s.camY *= 0.96;

            s.frame++;
            const f = s.frame;
            const camX = s.camX;
            const camY = s.camY;
            const streak = streakRef.current;

            drawSky(ctx, W, H);
            drawSun(ctx, W, H, camX, camY);
            drawDustParticles(ctx, W, H, s.DUST, camX, camY, f);
            drawDunes(ctx, W, H, s.DUNES, camX, camY);
            drawGround(ctx, W, H, camX, camY, f);

            const items = [];

            const nP = Math.min(streak, s.PLANTS.length);
            for (let i = 0; i < nP; i++) {
                items.push({ ny: s.PLANTS[i].ny, type: 'plant', data: s.PLANTS[i] });
            }

            const nH = Math.min(Math.floor(streak / 7), s.HOUSES.length);
            for (let i = 0; i < nH; i++) {
                items.push({ ny: s.HOUSES[i].ny, type: 'house', data: s.HOUSES[i] });
            }

            const nC = Math.min(Math.floor(streak / 28), s.CAMELS.length);
            for (let i = 0; i < nC; i++) {
                items.push({ ny: s.CAMELS[i].ny, type: 'camel', data: s.CAMELS[i] });
            }

            items.sort((a, b) => a.ny - b.ny);

            drawOasis(ctx, W, H, streak, camX, camY, f);

            for (const item of items) {
                const p = item.data;
                if (item.type === 'plant') {
                    const px = p.nx * W - camX * p.depth;
                    const py = p.ny * H - camY * p.depth;
                    if (p.type === 'cactus') drawCactus(ctx, W, H, px, py, p.size, 1);
                    else drawPalm(ctx, W, H, px, py, p.size, p.swayOff, 1, f);
                } else if (item.type === 'house') {
                    drawHouse(ctx, W, H, p, camX, camY, 1);
                } else if (item.type === 'camel') {
                    drawCamel(ctx, W, H, p, camX, camY, 1, f);
                }
            }

            drawLegendaryGlow(ctx, W, H, streak);

            s.animId = requestAnimationFrame(tick);
        };

        stateRef.current.animId = requestAnimationFrame(tick);
        return () => {
            if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId);
        };
    }, []);

    const hud = useMemo(() => {
        const nP = Math.min(streak, 180);
        const nH = Math.min(Math.floor(streak / 7), 26);
        const nC = Math.min(Math.floor(streak / 28), 13);
        const hasOasis = streak >= 180;

        let ms = '🏜️ Empty desert — your journey begins';
        let nx = '🌵 First plant at day 1';
        if (streak >= 365) {
            ms = '✨ Legendary oasis — a thriving desert city';
            nx = 'All milestones achieved!';
        } else if (streak >= 180) {
            ms = '🏝️ Oasis flows — a desert sanctuary';
            nx = `🐫 Camel ${Math.floor(streak / 28) + 1} at day ${(Math.floor(streak / 28) + 1) * 28}`;
        } else if (streak >= 28) {
            ms = `🐫 Camels roam — ${nC} camel${nC !== 1 ? 's' : ''} in the desert`;
            nx = `🏝️ Oasis in ${180 - streak} days`;
        } else if (streak >= 7) {
            ms = `🏠 ${nH} mud-brick house${nH !== 1 ? 's' : ''} rising from the sand`;
            nx = '🐫 First camel at day 28';
        } else if (streak >= 1) {
            ms = `🌵 ${nP} desert plant${nP !== 1 ? 's' : ''} taking root`;
            nx = '🏠 First house at day 7';
        }

        return { nP, nH, nC, hasOasis, ms, nx };
    }, [streak]);

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: '#c8803a', overflow: 'hidden',
                pointerEvents: 'all',
                opacity: visible ? 1 : 0,
                transition: 'opacity .6s ease-out',
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    position: 'fixed', top: 0, left: 0,
                    width: '100vw', height: '100vh',
                }}
            />

            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
                padding: '10px 20px',
                background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                pointerEvents: 'none',
            }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {[
                        { v: hud.nP, l: 'Plants' },
                        { v: hud.nH, l: 'Houses' },
                        { v: hud.nC, l: 'Camels' },
                        { v: hud.hasOasis ? '✅' : '—', l: 'Oasis' },
                    ].map((c, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 15, fontWeight: 'bold', color: '#fff',
                                textShadow: '0 0 8px rgba(255,180,60,.9)',
                            }}>
                                {c.v}
                            </div>
                            <div style={{
                                fontSize: 9, color: 'rgba(255,220,150,.65)',
                                letterSpacing: '.1em', textTransform: 'uppercase',
                            }}>
                                {c.l}
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={e => { e.stopPropagation(); onClose(); }}
                    style={{
                        pointerEvents: 'all', cursor: 'pointer',
                        background: 'rgba(80,40,5,.6)',
                        border: '1px solid rgba(255,180,60,.25)',
                        borderRadius: 10, padding: '6px 14px',
                        color: 'rgba(255,200,120,.85)', fontSize: 13,
                        backdropFilter: 'blur(6px)',
                        fontFamily: 'Georgia, serif',
                    }}
                >
                    ✕ Close
                </button>
            </div>

            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
                padding: '12px 22px',
                background: 'linear-gradient(0deg, rgba(0,0,0,.6) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                pointerEvents: 'none',
            }}>
                <div>
                    <div style={{
                        fontSize: 22, fontWeight: 'bold', color: '#fff',
                        letterSpacing: '.07em',
                        textShadow: '0 0 16px rgba(255,180,60,.9)',
                    }}>
                        {streak} Day{streak !== 1 ? 's' : ''}
                    </div>
                    <div style={{
                        fontSize: 12, color: 'rgba(255,210,130,.85)', marginTop: 2,
                    }}>
                        {hud.ms}
                    </div>
                    <div style={{
                        fontSize: 11, color: 'rgba(220,170,80,.6)', marginTop: 1,
                    }}>
                        {hud.nx}
                    </div>
                </div>
                <div style={{
                    textAlign: 'right', fontSize: 11,
                    color: 'rgba(220,170,80,.45)',
                    fontStyle: 'italic', lineHeight: 1.7,
                }}>
                    Arrow keys · explore the desert<br />
                    Every day, life finds a way
                </div>
            </div>
        </div>
    );
};

Oasis.isCanvasScene = true;
export default Oasis;