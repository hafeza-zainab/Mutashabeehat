// scenes/Mountain.js

import React, { useRef, useEffect, useMemo, useState } from 'react';

const sr = s => { const x = Math.sin(s + 1) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const TOTAL = 365;
const PATH_PTS = 300;

const QUOTES = [
    "One step at a time, you'll get there.",
    "The mountain is calling and I must go.",
    "Every summit begins with a single step.",
    "Breathe in courage, exhale doubt.",
    "Hard climbs lead to great views.",
    "It is not the mountain we conquer, but ourselves.",
    "The view is always better at the top.",
    "Focus on the step, not the mountain.",
    "Strength grows where struggle was.",
    "Stay patient and trust the journey.",
    "What seems impossible today becomes your warm-up.",
    "Don't stop when tired. Stop when done.",
    "Perseverance is many short races, one after another.",
    "The secret of getting ahead is getting started.",
    "It always seems impossible until it's done.",
    "Be stronger than your strongest excuse.",
    "There are no shortcuts to places worth going.",
    "Tough times never last, but tough people do.",
    "Dream it. Wish it. Do it.",
    "Doubt kills more dreams than failure ever will.",
    "A smooth sea never made a skilled sailor.",
    "Great things never come from comfort zones.",
    "Wake up with determination. Sleep with satisfaction.",
    "Success is a series of small wins.",
    "Hard does not mean impossible.",
    "Push yourself — no one else will do it.",
    "The only bad climb is the one that didn't happen.",
    "Conquer from within.",
    "Dare to begin.",
    "The summit is patient. Are you?",
    "Every great journey demands a first step.",
    "Climb so you can see the world.",
    "Embrace the steep parts — they build character.",
    "Your only limit is you.",
    "Sometimes later becomes never. Do it now.",
    "Work hard in silence, let success be the noise.",
    "Believe you can and you're halfway there.",
    "Action is the foundational key to all success.",
    "Set a goal so big you must grow into it.",
    "If it doesn't challenge you, it doesn't change you.",
    "Keep moving forward, no matter the pace.",
    "Little things make big days.",
    "Obstacles diminish when you keep your eyes on the goal.",
    "You are never too old to set another goal.",
    "Stop doubting yourself. Make it happen.",
    "The harder you work, the greater you'll feel.",
    "The pain today is the strength tomorrow.",
    "Don't watch the clock — keep going.",
    "Be stubborn about goals, flexible about methods.",
];

const EQUIPMENT = [
    { icon: '🎒', name: 'Backpack' },
    { icon: '🥾', name: 'Boots' },
    { icon: '💡', name: 'Headlamp' },
    { icon: '🧥', name: 'Windbreaker' },
    { icon: '🧣', name: 'Scarf' },
    { icon: '🧤', name: 'Gloves' },
    { icon: '🪢', name: 'Rope' },
    { icon: '🧭', name: 'Compass' },
    { icon: '⛺', name: 'Tent' },
    { icon: '🔥', name: 'Camp Stove' },
    { icon: '🥤', name: 'Flask' },
    { icon: '🚩', name: 'Summit Flag' },
];

const PHASES = [
    [365, '🏔️', 'SUMMIT REACHED'],
    [270, '❄️', 'NEAR THE PEAK'],
    [180, '⛰️', 'HIGH ALTITUDE'],
    [90, '🌲', 'ALPINE ZONE'],
    [30, '🌿', 'FOREST TRAIL'],
    [7, '🥾', 'FIRST CLIMB'],
    [0, '🎒', 'SETTING OUT'],
];

// ─── PRE-BUILD ───────────────────────────────────────────────────────────
function buildPath() {
    const pts = [];
    for (let i = 0; i < PATH_PTS; i++) {
        const t = i / (PATH_PTS - 1);
        const wave = Math.sin(t * Math.PI * 1.6 + 0.5) * 0.11 * (0.4 + t * 0.6);
        const x = 0.50 + wave;
        const y = lerp(0.28, 0.97, Math.pow(t, 0.62));
        pts.push({ x: clamp(x, 0.08, 0.92), y, t });
    }
    return pts;
}

function pathAt(PATH, t) {
    const idx = clamp(t, 0, 1) * (PATH_PTS - 1);
    const lo = Math.floor(idx), hi = Math.min(PATH_PTS - 1, lo + 1);
    const f = idx - lo;
    return { x: lerp(PATH[lo].x, PATH[hi].x, f), y: lerp(PATH[lo].y, PATH[hi].y, f) };
}

function pathTangent(PATH, t) {
    const dt = 0.004;
    const p0 = pathAt(PATH, clamp(t - dt, 0, 1)), p1 = pathAt(PATH, clamp(t + dt, 0, 1));
    const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy) || 1;
    return { dx: dx / len, dy: dy / len };
}

function hikerT(s) { return clamp(1 - s / TOTAL, 0, 1); }

function prebuildTrees(PATH) {
    const trees = [];
    for (let i = 0; i < 80; i++) {
        const t = 0.04 + sr(i * 17) * 0.89;
        const side = i % 2 === 0 ? -1 : 1;
        const scale = lerp(1.0, 0.1, Math.pow(t, 0.7));
        const pathW = lerp(0.38, 0.015, Math.pow(t, 0.65));
        const dist = 0.04 + sr(i * 37) * 0.22;
        const tang = pathTangent(PATH, t);
        const perp = { x: -tang.dy, y: tang.dx };
        const pt = pathAt(PATH, t);
        trees.push({
            nx: pt.x + perp.x * pathW * side * (dist * 4),
            ny: pt.y + perp.y * pathW * side * (dist * 2),
            scale, t,
            type: t < 0.18 ? 'snow' : t < 0.55 ? 'pine' : 'deciduous',
            seed: i,
        });
    }
    trees.sort((a, b) => a.ny - b.ny);
    return trees;
}

function prebuildRocks(PATH) {
    const rocks = [];
    for (let i = 0; i < 40; i++) {
        const t = 0.03 + sr(i * 71) * 0.94;
        const side = sr(i * 13) > 0.5 ? -1 : 1;
        const scale = lerp(1.0, 0.08, Math.pow(t, 0.7));
        const pathW = lerp(0.38, 0.015, Math.pow(t, 0.65));
        const dist = 0.01 + sr(i * 31) * 0.08;
        const tang = pathTangent(PATH, t);
        const perp = { x: -tang.dy, y: tang.dx };
        const pt = pathAt(PATH, t);
        rocks.push({
            nx: pt.x + perp.x * (pathW + dist) * side * 3.5,
            ny: pt.y + perp.y * (dist + 0.01) * side,
            scale, t, seed: i,
        });
    }
    rocks.sort((a, b) => a.ny - b.ny);
    return rocks;
}

function prebuildFlowers(PATH) {
    const flowers = [];
    const cols = ['#ff4488', '#ff9933', '#cc44ff', '#ff3355', '#ffcc00'];
    for (let i = 0; i < 100; i++) {
        const t = 0.50 + sr(i * 23) * 0.46;
        const side = sr(i * 7) > 0.5 ? -1 : 1;
        const scale = lerp(1.0, 0.1, Math.pow(t, 0.7));
        const dist = 0.01 + sr(i * 11) * 0.15;
        const tang = pathTangent(PATH, t);
        const perp = { x: -tang.dy, y: tang.dx };
        const pt = pathAt(PATH, t);
        flowers.push({
            nx: pt.x + perp.x * (lerp(0.38, 0.015, Math.pow(t, 0.65)) + dist) * side * 3,
            ny: pt.y + perp.y * dist * side * 1.5,
            scale, t, color: cols[Math.floor(sr(i * 31) * cols.length)], seed: i,
        });
    }
    flowers.sort((a, b) => a.ny - b.ny);
    return flowers;
}

function prebuildBushes(PATH) {
    const bushes = [];
    for (let i = 0; i < 50; i++) {
        const t = 0.28 + sr(i * 41) * 0.65;
        const side = sr(i * 59) > 0.5 ? -1 : 1;
        const scale = lerp(1.0, 0.08, Math.pow(t, 0.7));
        const dist = 0.05 + sr(i * 67) * 0.15;
        const tang = pathTangent(PATH, t);
        const perp = { x: -tang.dy, y: tang.dx };
        const pt = pathAt(PATH, t);
        bushes.push({
            nx: pt.x + perp.x * (lerp(0.38, 0.015, Math.pow(t, 0.65)) + dist) * side * 2.8,
            ny: pt.y + perp.y * dist * side * 1.2,
            scale, t, seed: i,
            hue: 90 + sr(i * 11) * 35, sat: 42 + sr(i * 17) * 18, lit: 20 + sr(i * 23) * 14,
        });
    }
    bushes.sort((a, b) => a.ny - b.ny);
    return bushes;
}

function prebuildClouds() {
    const clouds = [];
    for (let i = 0; i < 16; i++) {
        clouds.push({
            x: sr(i * 7) * 1.5 - 0.25, y: 0.04 + sr(i * 11) * 0.34,
            w: 0.10 + sr(i * 13) * 0.18, h: 0.028 + sr(i * 17) * 0.030,
            spd: 0.000025 + sr(i * 23) * 0.00004,
            alpha: 0.70 + sr(i * 31) * 0.28,
            warm: sr(i * 41) > 0.55,
        });
    }
    return clouds;
}

// ─── DRAW HELPERS ─────────────────────────────────────────────────

function drawSky(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.00, '#0d1f40');
    g.addColorStop(0.18, '#1a3870');
    g.addColorStop(0.38, '#3a72b8');
    g.addColorStop(0.55, '#7aabce');
    g.addColorStop(0.68, '#d4904a');
    g.addColorStop(0.82, '#e8b85a');
    g.addColorStop(1.00, '#c8923a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const hz = ctx.createLinearGradient(0, H * 0.50, 0, H * 0.72);
    hz.addColorStop(0, 'rgba(240,205,150,0)');
    hz.addColorStop(0.5, 'rgba(240,200,140,0.16)');
    hz.addColorStop(1, 'rgba(240,200,140,0)');
    ctx.fillStyle = hz;
    ctx.fillRect(0, H * 0.5, W, H * 0.22);
}

function drawSun(ctx, W, H, frame) {
    const sx = W * 0.50, sy = H * 0.09;
    const pulse = 1 + Math.sin(frame * 0.018) * 0.012;
    const c1 = ctx.createRadialGradient(sx, sy, 0, sx, sy, 220 * pulse);
    c1.addColorStop(0, 'rgba(255,255,220,0.32)');
    c1.addColorStop(0.3, 'rgba(255,230,140,0.16)');
    c1.addColorStop(1, 'rgba(255,190,60,0)');
    ctx.fillStyle = c1;
    ctx.fillRect(sx - 220, sy - 220, 440, 440);
    const c2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, 85 * pulse);
    c2.addColorStop(0, 'rgba(255,255,248,0.88)');
    c2.addColorStop(0.4, 'rgba(255,242,180,0.52)');
    c2.addColorStop(1, 'rgba(255,210,90,0)');
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.arc(sx, sy, 85 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.shadowColor = 'rgba(255,248,180,0.9)';
    ctx.shadowBlur = 40;
    const disc = ctx.createRadialGradient(sx - 5, sy - 5, 0, sx, sy, 32 * pulse);
    disc.addColorStop(0, '#ffffff');
    disc.addColorStop(0.6, '#fff8d0');
    disc.addColorStop(1, '#ffe890');
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(sx, sy, 32 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    for (let r = 0; r < 10; r++) {
        const a = (r / 10) * Math.PI * 2 + frame * 0.0015;
        const alpha = (0.025 + sr(r * 7) * 0.04) * (Math.sin(frame * 0.012 + r * 1.1) * 0.3 + 0.7);
        const len = (170 + sr(r * 11) * 140) * pulse;
        const rg = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
        rg.addColorStop(0, `rgba(255,240,160,${alpha * 2.5})`);
        rg.addColorStop(0.35, `rgba(255,220,120,${alpha})`);
        rg.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a - 0.04) * 24, sy + Math.sin(a - 0.04) * 24);
        ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
        ctx.lineTo(sx + Math.cos(a + 0.04) * 24, sy + Math.sin(a + 0.04) * 24);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawMountains(ctx, W, H, streak, frame) {
    ctx.save();
    ctx.globalAlpha = 0.36;
    ctx.fillStyle = '#7a9abf';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.52);
    const far = [[0, .44], [.05, .36], [.12, .40], [.18, .28], [.24, .35], [.32, .22], [.38, .32], [.46, .18], [.52, .28], [.60, .20], [.68, .30], [.75, .24], [.83, .34], [.91, .28], [.98, .38], [1.05, .50]];
    far.forEach(([px, py]) => ctx.lineTo(px * W, py * H));
    ctx.lineTo(W, H * .52);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.20;
    ctx.fillStyle = '#e8f4ff';
    [[.18, .28, .04], [.32, .22, .05], [.46, .18, .06], [.60, .20, .04], [.75, .24, .04]].forEach(([px, py, sz]) => {
        ctx.beginPath();
        ctx.moveTo(px * W, py * H);
        ctx.lineTo((px - sz) * W, (py + sz * .5) * H);
        ctx.lineTo((px + sz) * W, (py + sz * .5) * H);
        ctx.closePath();
        ctx.fill();
    });

    ctx.globalAlpha = 0.72;
    const sf = ctx.createLinearGradient(W * .32, H * .05, W * .52, H * .52);
    sf.addColorStop(0, '#3a5878');
    sf.addColorStop(.5, '#2a4060');
    sf.addColorStop(1, '#1e3050');
    ctx.fillStyle = sf;
    ctx.beginPath();
    ctx.moveTo(W * .50, H * .04);
    ctx.lineTo(W * .44, H * .22);
    ctx.lineTo(W * .20, H * .50);
    ctx.lineTo(W * .50, H * .50);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.68;
    const lf = ctx.createLinearGradient(W * .50, H * .05, W * .80, H * .50);
    lf.addColorStop(0, '#7aa0c0');
    lf.addColorStop(.4, '#5a8aac');
    lf.addColorStop(1, '#3a6888');
    ctx.fillStyle = lf;
    ctx.beginPath();
    ctx.moveTo(W * .50, H * .04);
    ctx.lineTo(W * .56, H * .22);
    ctx.lineTo(W * .84, H * .50);
    ctx.lineTo(W * .50, H * .50);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.16;
    for (let s = 0; s < 5; s++) {
        const ty = .22 + s * .05;
        ctx.fillStyle = s % 2 === 0 ? '#2a4060' : '#5a7890';
        ctx.beginPath();
        ctx.moveTo(W * (.50 + s * .02), H * ty);
        ctx.lineTo(W * (.52 + s * .025), H * (ty + .025));
        ctx.lineTo(W * (.78 - s * .01), H * (ty + .025));
        ctx.lineTo(W * (.76 - s * .01), H * ty);
        ctx.closePath();
        ctx.fill();
    }

    ctx.globalAlpha = 0.95;
    const sc = ctx.createLinearGradient(W * .46, H * .04, W * .58, H * .24);
    sc.addColorStop(0, '#ffffff');
    sc.addColorStop(.5, '#ddeeff');
    sc.addColorStop(1, 'rgba(210,230,248,0)');
    ctx.fillStyle = sc;
    ctx.beginPath();
    ctx.moveTo(W * .50, H * .03);
    ctx.lineTo(W * .44, H * .20);
    ctx.lineTo(W * .50, H * .18);
    ctx.lineTo(W * .57, H * .22);
    ctx.lineTo(W * .62, H * .18);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = '#c8ddf0';
    ctx.beginPath();
    ctx.moveTo(W * .50, H * .03);
    ctx.lineTo(W * .44, H * .20);
    ctx.lineTo(W * .48, H * .19);
    ctx.closePath();
    ctx.fill();

    if (streak >= 365) {
        const gl = ctx.createRadialGradient(W * .50, H * .05, 0, W * .50, H * .05, 120);
        gl.addColorStop(0, `rgba(255,245,190,${0.55 + Math.sin(frame * .035) * .2})`);
        gl.addColorStop(.4, 'rgba(255,220,100,0.22)');
        gl.addColorStop(1, 'rgba(255,200,60,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(W * .50, H * .05, 120, 0, Math.PI * 2);
        ctx.fill();
    }

    [{ x: .17, p: .20, w: .18, l: '#5a7898', s: '#2e4462' }, { x: .83, p: .24, w: .18, l: '#5a7898', s: '#2e4462' }].forEach(({ x, p, w, l, s }) => {
        ctx.globalAlpha = .58;
        ctx.fillStyle = l;
        ctx.beginPath();
        ctx.moveTo(W * x, H * p);
        ctx.lineTo(W * (x + w * .55), H * .50);
        ctx.lineTo(W * (x - w * .35), H * .50);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = .45;
        ctx.fillStyle = s;
        ctx.beginPath();
        ctx.moveTo(W * x, H * p);
        ctx.lineTo(W * (x - w * .35), H * .50);
        ctx.lineTo(W * (x - w * .15), H * .50);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = .55;
        ctx.fillStyle = '#d8eeff';
        ctx.beginPath();
        ctx.moveTo(W * x, H * p);
        ctx.lineTo(W * (x - .04), H * (p + .06));
        ctx.lineTo(W * (x + .06), H * (p + .07));
        ctx.closePath();
        ctx.fill();
    });
    ctx.restore();
}

function drawTerrain(ctx, W, H) {
    ctx.save();
    const fg = ctx.createLinearGradient(0, H * .42, 0, H * .68);
    fg.addColorStop(0, '#5a9e48');
    fg.addColorStop(.6, '#488838');
    fg.addColorStop(1, '#386828');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, H * .56);
    ctx.bezierCurveTo(W * .15, H * .44, W * .35, H * .46, W * .50, H * .47);
    ctx.bezierCurveTo(W * .66, H * .46, W * .84, H * .50, W, H * .54);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    const mg = ctx.createLinearGradient(0, H * .58, 0, H);
    mg.addColorStop(0, '#60b048');
    mg.addColorStop(.35, '#4e9838');
    mg.addColorStop(.7, '#3c7828');
    mg.addColorStop(1, '#2a5818');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, H * .65);
    ctx.bezierCurveTo(W * .18, H * .58, W * .36, H * .60, W * .50, H * .61);
    ctx.bezierCurveTo(W * .64, H * .60, W * .82, H * .63, W, H * .66);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = '#2a5818';
    ctx.lineWidth = 1;
    for (let i = 0; i < 45; i++) {
        const gx = sr(i * 31) * W, gy = H * (.64 + sr(i * 41) * .36);
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + (sr(i * 51) - .5) * 30, gy - 8 - sr(i * 61) * 12);
        ctx.stroke();
    }
    ctx.globalAlpha = .62;
    const cl = ctx.createLinearGradient(0, H * .60, 0, H * .72);
    cl.addColorStop(0, '#7a6a50');
    cl.addColorStop(1, '#5a4e38');
    ctx.fillStyle = cl;
    ctx.beginPath();
    ctx.moveTo(0, H * .66);
    ctx.lineTo(W * .06, H * .60);
    ctx.lineTo(W * .12, H * .62);
    ctx.lineTo(W * .16, H * .66);
    ctx.lineTo(W * .10, H * .70);
    ctx.lineTo(0, H * .72);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W, H * .66);
    ctx.lineTo(W * .94, H * .61);
    ctx.lineTo(W * .88, H * .63);
    ctx.lineTo(W * .84, H * .67);
    ctx.lineTo(W * .90, H * .71);
    ctx.lineTo(W, H * .72);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawClouds(ctx, W, H, CLOUDS, frame) {
    ctx.save();
    for (const c of CLOUDS) {
        c.x += c.spd;
        if (c.x > 1.5) c.x = -0.5;
        const cx = c.x * W, cy = c.y * H, cw = c.w * W, ch = c.h * H;
        ctx.globalAlpha = c.alpha * .78;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy + ch, cw * 1.1);
        if (c.warm) {
            cg.addColorStop(0, 'rgba(255,252,240,0.97)');
            cg.addColorStop(.45, 'rgba(245,230,200,0.80)');
            cg.addColorStop(1, 'rgba(210,190,160,0)');
        } else {
            cg.addColorStop(0, 'rgba(240,248,255,0.94)');
            cg.addColorStop(.45, 'rgba(210,228,248,0.78)');
            cg.addColorStop(1, 'rgba(180,205,230,0)');
        }
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx - cw * .48, cy + ch * .38, cw * .72, ch * .78, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + cw * .42, cy + ch * .30, cw * .78, ch * .82, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx - cw * .1, cy + ch * .55, cw * .58, ch * .65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = c.alpha * .18;
        ctx.fillStyle = c.warm ? '#c89040' : '#9ab8d0';
        ctx.beginPath();
        ctx.ellipse(cx, cy + ch * .72, cw * 1.08, ch * .45, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawTree(ctx, W, H, t) {
    const x = t.nx * W, y = t.ny * H, sc = t.scale, seed = t.seed;
    if (x < -W * .2 || x > W * 1.2 || y < H * .15 || y > H * 1.1) return;
    const h = sc * W * .060, tw = sc * W * .006;

    ctx.fillStyle = t.type === 'deciduous' ? '#5a3818' : '#2e1a08';
    ctx.beginPath();
    ctx.moveTo(x - tw, y);
    ctx.lineTo(x + tw, y);
    ctx.lineTo(x + tw * .5, y - h * .35);
    ctx.lineTo(x - tw * .5, y - h * .35);
    ctx.closePath();
    ctx.fill();

    if (t.type === 'deciduous') {
        const hue = 78 + sr(seed * 7) * 35, lgt = 22 + sr(seed * 11) * 12;
        const bw = sc * W * .022;
        ctx.fillStyle = `hsl(${hue},50%,${lgt}%)`;
        ctx.beginPath();
        ctx.ellipse(x, y - h * .68, bw * 1.15, h * .55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.globalAlpha = .24;
        ctx.fillStyle = `hsl(${hue + 8},58%,${lgt + 16}%)`;
        ctx.beginPath();
        ctx.ellipse(x - bw * .25, y - h * .78, bw * .65, h * .32, -.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else {
        const snow = t.type === 'snow';
        const layers = 3 + Math.round(sr(seed * 3) * 2), bw = sc * W * .018;
        for (let l = 0; l < layers; l++) {
            const lt = l / (layers - 1);
            const lw = lerp(bw * .45, bw * 1.65, lt);
            const ly = lerp(y - h, y - h * .22, lt);
            ctx.fillStyle = `hsl(${128 + l * 4},${34 + l * 4}%,${15 + l * 4}%)`;
            ctx.beginPath();
            ctx.moveTo(x, ly - lw * .32);
            ctx.lineTo(x - lw, ly + lw * .52);
            ctx.lineTo(x + lw, ly + lw * .52);
            ctx.closePath();
            ctx.fill();
            if (snow) {
                ctx.save();
                ctx.globalAlpha = .56;
                ctx.fillStyle = '#d8ecff';
                ctx.beginPath();
                ctx.moveTo(x, ly - lw * .32);
                ctx.lineTo(x - lw * .48, ly + lw * .08);
                ctx.lineTo(x + lw * .48, ly + lw * .08);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    }
}

function drawRock(ctx, W, H, r) {
    const x = r.nx * W, y = r.ny * H, sc = r.scale, seed = r.seed;
    if (x < -W * .1 || x > W * 1.1) return;
    const rs = sc * W * .018;
    const lgt = 50 + sr(seed * 7) * 24;
    const g = ctx.createLinearGradient(x - rs, y - rs, x + rs * .5, y + rs * .2);
    g.addColorStop(0, `hsl(25,14%,${lgt + 12}%)`);
    g.addColorStop(.6, `hsl(25,14%,${lgt}%)`);
    g.addColorStop(1, `hsl(25,14%,${lgt - 14}%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - rs * .75, y);
    ctx.lineTo(x - rs * .95, y - rs * .58);
    ctx.lineTo(x - rs * .28, y - rs * .98);
    ctx.lineTo(x + rs * .52, y - rs * .85);
    ctx.lineTo(x + rs * .98, y - rs * .38);
    ctx.lineTo(x + rs * .72, y);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - rs * .18, y - rs * .60, rs * .28, rs * .16, -.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawFlower(ctx, W, H, f) {
    const x = f.nx * W, y = f.ny * H, sc = f.scale;
    if (x < -60 || x > W + 60 || y < H * .25) return;
    const fr = sc * W * .009 * 1.2;
    ctx.strokeStyle = '#287018';
    ctx.lineWidth = fr * .25;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - fr * 1.4);
    ctx.stroke();
    ctx.fillStyle = f.color;
    for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(pa) * fr * .65, y - fr * 1.4 + Math.sin(pa) * fr * .65, fr * .55, fr * .35, pa, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#ffe040';
    ctx.beginPath();
    ctx.arc(x, y - fr * 1.4, fr * .32, 0, Math.PI * 2);
    ctx.fill();
}

function drawBush(ctx, W, H, b) {
    const x = b.nx * W, y = b.ny * H, sc = b.scale;
    if (x < -80 || x > W + 80) return;
    const bw = sc * W * .016 * 1.2;
    ctx.fillStyle = `hsl(${b.hue},${b.sat}%,${b.lit}%)`;
    ctx.beginPath();
    ctx.ellipse(x, y - bw * .6, bw, bw * .65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.fillStyle = '#a0d060';
    ctx.beginPath();
    ctx.ellipse(x - bw * .3, y - bw * .7, bw * .55, bw * .40, -.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawPath(ctx, W, H, PATH, hT, frame) {
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    const N = PATH_PTS - 1;

    // ── Pass 1: Dirt base ──────────────────────────────
    for (let i = N; i >= 0; i--) {
        if (i >= PATH_PTS - 1) continue;
        const p0 = PATH[i], p1 = PATH[i + 1];
        const t = p0.t;
        const pw = lerp(8, 110, Math.pow(t, 1.3));
        const walked = t >= hT;

        ctx.globalAlpha = walked ? 0.22 : 0.06;
        ctx.strokeStyle = '#0a0500';
        ctx.lineWidth = pw + 16;
        ctx.beginPath();
        ctx.moveTo(p0.x * W, p0.y * H + 5);
        ctx.lineTo(p1.x * W, p1.y * H + 5);
        ctx.stroke();

        ctx.globalAlpha = walked ? 0.95 : 0.30;
        const dirtR = Math.round(lerp(115, 155, t));
        const dirtG = Math.round(lerp(82, 118, t));
        const dirtB = Math.round(lerp(52, 75, t));
        ctx.strokeStyle = `rgb(${dirtR},${dirtG},${dirtB})`;
        ctx.lineWidth = pw;
        ctx.beginPath();
        ctx.moveTo(p0.x * W, p0.y * H);
        ctx.lineTo(p1.x * W, p1.y * H);
        ctx.stroke();

        if (walked) {
            ctx.globalAlpha = 0.18;
            ctx.strokeStyle = `rgb(${dirtR + 30},${dirtG + 22},${dirtB + 15})`;
            ctx.lineWidth = pw * 0.45;
            ctx.beginPath();
            ctx.moveTo(p0.x * W, p0.y * H - 1);
            ctx.lineTo(p1.x * W, p1.y * H - 1);
            ctx.stroke();
        }
    }

    // ── Pass 2: Stone slabs ─────────────────────────────
    for (let i = N; i >= 0; i--) {
        if (i >= PATH_PTS - 1) continue;
        const p0 = PATH[i], p1 = PATH[i + 1];
        const t = p0.t;
        const pw = lerp(8, 110, Math.pow(t, 1.3));
        if (pw < 6) continue;

        const walked = t >= hT;
        const sx0 = p0.x * W, sy0 = p0.y * H;
        const sx1 = p1.x * W, sy1 = p1.y * H;
        const segLen = Math.hypot(sx1 - sx0, sy1 - sy0);
        const angle = Math.atan2(sy1 - sy0, sx1 - sx0);

        const stoneSpacing = lerp(5, 26, Math.pow(t, 0.8));
        const numStones = Math.max(1, Math.round(segLen / stoneSpacing));

        for (let s = 0; s < numStones; s++) {
            const st = (s + 0.5) / numStones;
            const cx = lerp(sx0, sx1, st);
            const cy = lerp(sy0, sy1, st);

            const seed = i * 137 + s * 53;

            // Width across path (the wider dimension), length along path (shorter)
            const slabW = pw * (0.32 + sr(seed) * 0.18);
            const slabH = stoneSpacing * (0.42 + sr(seed + 1) * 0.22);

            // Small perpendicular jitter only — NO rotation
            const perpAngle = angle + Math.PI / 2;
            const perpOff = (sr(seed + 2) - 0.5) * pw * 0.10;
            const ox = Math.cos(perpAngle) * perpOff;
            const oy = Math.sin(perpAngle) * perpOff;
            const fx = cx + ox;
            const fy = cy + oy;

            const baseBright = walked ? 138 + sr(seed + 4) * 52 : 75 + sr(seed + 4) * 28;
            const warmShift = sr(seed + 5) * 16 - 8;
            const rr = Math.round(baseBright + warmShift + 8);
            const gg = Math.round(baseBright + warmShift - 2);
            const bb = Math.round(baseBright + warmShift - 18);

            ctx.save();
            // Translate to stone center, rotate to path angle — NO extra rotation
            ctx.translate(fx, fy);
            ctx.rotate(angle);
            // Now: local X = along path, local Y = across path
            // So slabH spans X (along path), slabW spans Y (across path)

            const cornerR = Math.max(1, Math.min(slabW, slabH) * 0.15);

            // Shadow
            ctx.globalAlpha = walked ? 0.25 : 0.07;
            ctx.fillStyle = '#080400';
            roundedRect(ctx, -slabH / 2 + 2, -slabW / 2 + 3, slabH, slabW, cornerR);
            ctx.fill();

            // Stone top face
            ctx.globalAlpha = walked ? (0.84 + sr(seed + 6) * 0.14) : 0.22;
            const sg = ctx.createLinearGradient(-slabH / 2, -slabW / 2, slabH / 2, slabW / 2);
            sg.addColorStop(0, `rgb(${Math.min(255, rr + 20)},${Math.min(255, gg + 14)},${Math.min(255, bb + 8)})`);
            sg.addColorStop(0.5, `rgb(${rr},${gg},${bb})`);
            sg.addColorStop(1, `rgb(${Math.max(0, rr - 18)},${Math.max(0, gg - 14)},${Math.max(0, bb - 10)})`);
            ctx.fillStyle = sg;
            roundedRect(ctx, -slabH / 2, -slabW / 2, slabH, slabW, cornerR);
            ctx.fill();

            // Edge
            ctx.globalAlpha = walked ? 0.28 : 0.10;
            ctx.strokeStyle = `rgba(25,14,4,${walked ? 0.40 : 0.18})`;
            ctx.lineWidth = walked ? 0.9 : 0.5;
            roundedRect(ctx, -slabH / 2, -slabW / 2, slabH, slabW, cornerR);
            ctx.stroke();

            // Highlight — top-left of each slab (sunlight)
            if (walked && slabW > 8) {
                ctx.globalAlpha = 0.14 + sr(seed + 7) * 0.10;
                ctx.fillStyle = 'rgba(255,248,225,0.9)';
                roundedRect(ctx, -slabH / 2 + 1, -slabW / 2 + 1, slabH * 0.40, slabW * 0.38, cornerR * 0.6);
                ctx.fill();
            }

            // Subtle crack on some stones
            if (walked && sr(seed + 8) > 0.70 && slabW > 12) {
                ctx.globalAlpha = 0.09;
                ctx.strokeStyle = 'rgba(30,18,5,0.8)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(-slabH * 0.15, -slabW * 0.2);
                ctx.lineTo(slabH * 0.10, slabW * 0.15);
                ctx.stroke();
            }

            // Tiny moss
            if (walked && sr(seed + 9) > 0.80 && slabW > 14) {
                ctx.globalAlpha = 0.07;
                ctx.fillStyle = '#4a8830';
                ctx.beginPath();
                ctx.ellipse(slabH * 0.15, slabW * 0.20, slabH * 0.15, slabW * 0.12, 0.2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // ── Pass 3: Subtle sunlight wash ────────────────────
    for (let i = N; i >= 0; i--) {
        if (i >= PATH_PTS - 1) continue;
        const p0 = PATH[i];
        if (p0.t < hT) continue;
        const p1 = PATH[i + 1];
        const pw = lerp(8, 110, Math.pow(p0.t, 1.3));
        if (pw < 6) continue;
        ctx.globalAlpha = 0.022 + Math.sin(frame * 0.015 + p0.t * 4) * 0.008;
        ctx.strokeStyle = '#ffe898';
        ctx.lineWidth = pw * 0.28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x * W, p0.y * H - pw * 0.03);
        ctx.lineTo(p1.x * W, p1.y * H - pw * 0.03);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawSignpost(ctx, W, H, PATH, streak, hT) {
    const nWeeks = Math.floor(streak / 7);
    if (nWeeks === 0) return;
    const signT = clamp(1 - (nWeeks * 7) / TOTAL, 0, 1);
    if (Math.abs(signT - hT) > 0.15) return;
    const side = nWeeks % 2 === 0 ? 1 : -1;
    const tang = pathTangent(PATH, signT);
    const perp = { x: -tang.dy, y: tang.dx };
    const pt = pathAt(PATH, signT);
    const perspScale = lerp(0.12, 1.0, Math.pow(signT, .80));
    const pathW = lerp(0.38, 0.015, Math.pow(signT, 0.65));
    const sx = pt.x * W + perp.x * pathW * W * side * 8 * perspScale;
    const sy = pt.y * H + perp.y * pathW * side * 4 * perspScale;
    if (sy < H * .20 || sy > H * 1.05) return;

    const sc = perspScale * .85;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(sc, sc);
    const postH = W * .075, bw = W * .11, bh = W * .050;
    const pg = ctx.createLinearGradient(-3, -postH, 3, 0);
    pg.addColorStop(0, '#6a4220');
    pg.addColorStop(.5, '#4a2e10');
    pg.addColorStop(1, '#3a2008');
    ctx.fillStyle = pg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-3, -postH, 6, postH + 4, 1.5);
    else ctx.rect(-3, -postH, 6, postH + 4);
    ctx.fill();
    const topY = -postH + 4;
    const bx = side === 1 ? -(bw + 4) : 4;
    ctx.save();
    ctx.globalAlpha = .28;
    ctx.fillStyle = '#0e0600';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx + 3, topY + 3, bw, bh, 4);
    else ctx.rect(bx + 3, topY + 3, bw, bh);
    ctx.fill();
    ctx.restore();
    const wg = ctx.createLinearGradient(bx, topY, bx + bw, topY + bh);
    wg.addColorStop(0, '#9a6830');
    wg.addColorStop(.3, '#7a5020');
    wg.addColorStop(.7, '#8a5c28');
    wg.addColorStop(1, '#5a3a14');
    ctx.fillStyle = wg;
    ctx.strokeStyle = 'rgba(30,12,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, topY, bw, bh, 4);
    else ctx.rect(bx, topY, bw, bh);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = .07;
    ctx.strokeStyle = '#3a2010';
    ctx.lineWidth = .8;
    for (let g = 0; g < 4; g++) {
        const gy = topY + bh * (.2 + g * .2);
        ctx.beginPath();
        ctx.moveTo(bx + 4, gy);
        ctx.lineTo(bx + bw - 4, gy);
        ctx.stroke();
    }
    ctx.restore();
    const gold = ctx.createLinearGradient(bx, topY + 2, bx, topY + 5);
    gold.addColorStop(0, '#d4a030');
    gold.addColorStop(1, '#a07818');
    ctx.fillStyle = gold;
    ctx.fillRect(bx + 3, topY + 2, bw - 6, 3);
    ctx.save();
    ctx.globalAlpha = .45;
    ctx.fillStyle = '#d4a030';
    ctx.beginPath();
    ctx.arc(bx + 9, topY + bh / 2 + 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const fs = Math.max(7, Math.floor(bw * .082));
    ctx.font = `bold ${fs}px Georgia,"Times New Roman",serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.8)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#f5e098';
    const quote = QUOTES[(nWeeks - 1) % QUOTES.length];
    const maxW = bw - 22;
    const words = quote.split(' ');
    let lines = [], line = '';
    for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW) { lines.push(line); line = w; }
        else line = test;
    }
    lines.push(line);
    lines = lines.slice(0, 3);
    const lh = fs + 2, startY = topY + bh / 2 - ((lines.length - 1) * lh) / 2 + 4;
    lines.forEach((l, idx) => ctx.fillText(l, bx + bw / 2, startY + idx * lh));
    ctx.restore();
}

function drawHiker(ctx, W, H, PATH, streak, hT, frame) {
    if (streak >= 365) {
        drawHikerAtSummit(ctx, W, H, PATH, frame);
        return;
    }
    const pt = pathAt(PATH, hT);
    const ptA = pathAt(PATH, Math.max(0, hT - .008));
    const sx = pt.x * W, sy = pt.y * H;
    const perspScale = lerp(0.08, 1.0, Math.pow(hT, .90));
    const sc = W * .038 * perspScale;
    const bob = Math.abs(Math.sin(frame * .11)) * sc * .14;
    const leg = Math.sin(frame * .11);
    const arm = -leg;
    const facing = ptA.x < pt.x ? -1 : 1;

    ctx.save();
    ctx.translate(sx, sy - bob);
    ctx.scale(facing, 1);

    ctx.save();
    ctx.globalAlpha = .18;
    ctx.fillStyle = '#100800';
    ctx.beginPath();
    ctx.ellipse(0, sc * .08, sc * .55, sc * .11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#141008';
    ctx.beginPath();
    ctx.ellipse(-sc * .20 + leg * sc * .28, sc * .04, sc * .17, sc * .07, .15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sc * .20 - leg * sc * .28, sc * .04, sc * .17, sc * .07, -.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a3858';
    ctx.lineWidth = sc * .14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-sc * .10, -sc * .52);
    ctx.lineTo(-sc * .20 + leg * sc * .28, sc * .02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sc * .10, -sc * .52);
    ctx.lineTo(sc * .20 - leg * sc * .28, sc * .02);
    ctx.stroke();

    ctx.fillStyle = '#1e4888';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-sc * .38, -sc * 1.22, sc * .24, sc * .62, sc * .05);
    else ctx.rect(-sc * .38, -sc * 1.22, sc * .24, sc * .62);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = .17;
    ctx.fillStyle = '#6090d8';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-sc * .37, -sc * 1.21, sc * .10, sc * .25, sc * .04);
    else ctx.rect(-sc * .37, -sc * 1.21, sc * .10, sc * .25);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#18386a';
    ctx.lineWidth = sc * .06;
    ctx.beginPath();
    ctx.moveTo(-sc * .14, -sc * 1.18);
    ctx.lineTo(-sc * .14, -sc * .55);
    ctx.stroke();

    const bg = ctx.createLinearGradient(-sc * .24, -sc * 1.24, sc * .28, -sc * .52);
    bg.addColorStop(0, '#d43020');
    bg.addColorStop(.5, '#b82818');
    bg.addColorStop(1, '#882010');
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-sc * .24, -sc * 1.24, sc * .48, sc * .72, sc * .07);
    else ctx.rect(-sc * .24, -sc * 1.24, sc * .48, sc * .72);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = .22;
    ctx.fillStyle = '#601010';
    ctx.fillRect(-sc * .04, -sc * 1.24, sc * .08, sc * .72);
    ctx.restore();

    ctx.strokeStyle = '#c82818';
    ctx.lineWidth = sc * .12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-sc * .22, -sc * 1.08);
    ctx.lineTo(-sc * .38 + arm * sc * .15, -sc * .66);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sc * .22, -sc * 1.08);
    ctx.lineTo(sc * .38 - arm * sc * .15, -sc * .66);
    ctx.stroke();

    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = sc * .042;
    ctx.beginPath();
    ctx.moveTo(sc * .38 - arm * sc * .15, -sc * .66);
    ctx.lineTo(sc * .52 - arm * sc * .20, sc * .06);
    ctx.stroke();
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(sc * .52 - arm * sc * .20, sc * .06, sc * .04, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c89870';
    ctx.fillRect(-sc * .09, -sc * 1.36, sc * .18, sc * .14);

    ctx.fillStyle = '#c89010';
    ctx.beginPath();
    ctx.arc(0, -sc * 1.58, sc * .29, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a07808';
    ctx.beginPath();
    ctx.ellipse(0, -sc * 1.40, sc * .36, sc * .09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2010';
    ctx.beginPath();
    ctx.arc(0, -sc * 1.42, sc * .20, Math.PI * .1, Math.PI * .9);
    ctx.fill();
    ctx.fillStyle = '#b86828';
    ctx.beginPath();
    ctx.ellipse(-sc * .14, -sc * 1.58, sc * .03, sc * .05, -.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawHikerAtSummit(ctx, W, H, PATH, frame) {
    const pt = pathAt(PATH, 0.02);
    const sx = pt.x * W, sy = pt.y * H;
    const perspScale = lerp(0.08, 1.0, Math.pow(0.04, .90));
    const sc = W * .038 * perspScale;
    const pulse = Math.sin(frame * .06) * .05 + 1;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.save();
    ctx.globalAlpha = .15;
    ctx.fillStyle = '#100800';
    ctx.beginPath();
    ctx.ellipse(0, sc * .08, sc * .55, sc * .11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#141008';
    ctx.beginPath();
    ctx.ellipse(-sc * .20, sc * .04, sc * .17, sc * .07, .15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sc * .20, sc * .04, sc * .17, sc * .07, -.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a3858';
    ctx.lineWidth = sc * .14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-sc * .10, -sc * .52);
    ctx.lineTo(-sc * .20, sc * .02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sc * .10, -sc * .52);
    ctx.lineTo(sc * .20, sc * .02);
    ctx.stroke();
    const bg = ctx.createLinearGradient(-sc * .24, -sc * 1.24, sc * .28, -sc * .52);
    bg.addColorStop(0, '#d43020');
    bg.addColorStop(.5, '#b82818');
    bg.addColorStop(1, '#882010');
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-sc * .24 * pulse, -sc * 1.24, sc * .48 * pulse, sc * .72, sc * .07);
    else ctx.rect(-sc * .24, -sc * 1.24, sc * .48, sc * .72);
    ctx.fill();
    ctx.strokeStyle = '#c82818';
    ctx.lineWidth = sc * .12;
    ctx.lineCap = 'round';
    const armRaise = Math.sin(frame * .06) * 0.15;
    ctx.beginPath();
    ctx.moveTo(-sc * .22, -sc * 1.08);
    ctx.lineTo(-sc * .65, -sc * 1.55 - armRaise * sc);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sc * .22, -sc * 1.08);
    ctx.lineTo(sc * .65, -sc * 1.55 - armRaise * sc);
    ctx.stroke();
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = sc * .05;
    ctx.beginPath();
    ctx.moveTo(sc * .65, -sc * 1.55 - armRaise * sc);
    ctx.lineTo(sc * .65, -sc * 2.20 - armRaise * sc);
    ctx.stroke();
    ctx.fillStyle = '#e03020';
    ctx.beginPath();
    ctx.moveTo(sc * .65, -sc * 2.20 - armRaise * sc);
    ctx.lineTo(sc * .65 + sc * .30, -sc * 2.08 - armRaise * sc);
    ctx.lineTo(sc * .65, -sc * 1.96 - armRaise * sc);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c89870';
    ctx.fillRect(-sc * .09, -sc * 1.36, sc * .18, sc * .14);
    ctx.fillStyle = '#c89010';
    ctx.beginPath();
    ctx.arc(0, -sc * 1.58, sc * .29, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a07808';
    ctx.beginPath();
    ctx.ellipse(0, -sc * 1.40, sc * .36, sc * .09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2010';
    ctx.beginPath();
    ctx.arc(0, -sc * 1.42, sc * .20, Math.PI * .1, Math.PI * .9);
    ctx.fill();
    ctx.restore();
}

function drawVignette(ctx, W, H) {
    const v = ctx.createRadialGradient(W / 2, H * .52, H * .18, W / 2, H * .52, H * .82);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(.60, 'rgba(0,0,0,0.04)');
    v.addColorStop(.85, 'rgba(0,0,0,0.18)');
    v.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
}

function getCam(PATH, camT, W, H) {
    const pt = pathAt(PATH, camT);
    const focusY = H * 0.70;
    const focusX = W * 0.50;
    const zoom = lerp(0.92, 2.2, Math.pow(camT, 1.9));
    return {
        tx: focusX - pt.x * W * zoom,
        ty: focusY - pt.y * H * zoom,
        zoom,
    };
}

// ─── REACT COMPONENT ────────────────────────────────────────────

const Mountain = ({ streak = 0, onClose }) => {
    const canvasRef = useRef(null);
    const [visible, setStatus] = useState(false);
    const streakRef = useRef(streak);
    streakRef.current = streak;

    const PATH = useMemo(() => buildPath(), []);

    const stateRef = useRef({
        W: 0, H: 0, frame: 0,
        targetCameraT: clamp(1 - (streak || 1) / TOTAL, 0, 1),
        smoothCamT: clamp(1 - (streak || 1) / TOTAL, 0, 1),
        drag: { active: false, lx: 0, ly: 0 },
        touchDrag: { active: false, lx: 0, ly: 0 },
        PATH,
        TREES: null,
        ROCKS: null,
        FLOWERS: null,
        BUSHES: null,
        CLOUDS: prebuildClouds(),
        animId: null,
    });

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Initialize world data after PATH is ready
    useEffect(() => {
        const s = stateRef.current;
        if (!s.TREES) {
            s.TREES = prebuildTrees(PATH);
            s.ROCKS = prebuildRocks(PATH);
            s.FLOWERS = prebuildFlowers(PATH);
            s.BUSHES = prebuildBushes(PATH);
        }
    }, [PATH]);

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
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onCloseRef.current?.();
                return;
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                stateRef.current.targetCameraT = clamp(stateRef.current.targetCameraT - .04, 0, 1);
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                stateRef.current.targetCameraT = clamp(stateRef.current.targetCameraT + .04, 0, 1);
            }
        };
        window.addEventListener('keydown', d, true);
        return () => window.removeEventListener('keydown', d, true);
    }, []);

    useEffect(() => {
        const md = (e) => {
            stateRef.current.drag = { active: true, lx: e.clientX, ly: e.clientY };
        };
        const mm = (e) => {
            const d = stateRef.current.drag;
            if (!d.active) return;
            const dy = e.clientY - d.ly, dx = e.clientX - d.lx;
            stateRef.current.targetCameraT = clamp(stateRef.current.targetCameraT - (dy + dx * .4) * .0012, 0, 1);
            d.lx = e.clientX;
            d.ly = e.clientY;
        };
        const mu = () => {
            stateRef.current.drag.active = false;
        };
        document.addEventListener('mousedown', md);
        document.addEventListener('mousemove', mm);
        document.addEventListener('mouseup', mu);
        return () => {
            document.removeEventListener('mousedown', md);
            document.removeEventListener('mousemove', mm);
            document.removeEventListener('mouseup', mu);
        };
    }, []);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const onWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            stateRef.current.targetCameraT = clamp(stateRef.current.targetCameraT + e.deltaY * .0004, 0, 1);
        };
        c.addEventListener('wheel', onWheel, { passive: false });
        return () => c.removeEventListener('wheel', onWheel);
    }, []);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ts = (e) => {
            const t = e.touches[0];
            stateRef.current.touchDrag = { active: true, lx: t.clientX, ly: t.clientY };
        };
        const tm = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const td = stateRef.current.touchDrag;
            if (!td.active) return;
            const t = e.touches[0], dy = t.clientY - td.ly, dx = t.clientX - td.lx;
            stateRef.current.targetCameraT = clamp(stateRef.current.targetCameraT - (dy + dx * .4) * .0014, 0, 1);
            td.lx = t.clientX;
            td.ly = t.clientY;
        };
        const te = () => {
            stateRef.current.touchDrag.active = false;
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
        const CAM_SMOOTH = 0.08;

        const tick = () => {
            const c = canvasRef.current;
            if (!c) {
                stateRef.current.animId = requestAnimationFrame(tick);
                return;
            }
            const ctx = c.getContext('2d');
            const s = stateRef.current;
            const { W, H } = s;

            if (!W || !H || !s.TREES) {
                s.animId = requestAnimationFrame(tick);
                return;
            }

            s.smoothCamT += (s.targetCameraT - s.smoothCamT) * CAM_SMOOTH;
            s.frame++;

            ctx.clearRect(0, 0, W, H);
            const streak = streakRef.current || 1;
            const hT = hikerT(streak);
            const { tx, ty, zoom } = getCam(s.PATH, s.smoothCamT, W, H);

            ctx.save();
            ctx.translate(tx, ty);
            ctx.scale(zoom, zoom);

            drawSky(ctx, W, H);
            drawSun(ctx, W, H, s.frame);
            drawMountains(ctx, W, H, streak, s.frame);
            drawClouds(ctx, W, H, s.CLOUDS, s.frame);
            drawTerrain(ctx, W, H);

            const allEnv = [
                ...s.TREES.map(t => ({ ny: t.ny, draw: () => drawTree(ctx, W, H, t) })),
                ...s.ROCKS.map(r => ({ ny: r.ny, draw: () => drawRock(ctx, W, H, r) })),
                ...s.BUSHES.map(b => ({ ny: b.ny, draw: () => drawBush(ctx, W, H, b) })),
                ...s.FLOWERS.map(f => ({ ny: f.ny, draw: () => drawFlower(ctx, W, H, f) })),
            ].sort((a, b) => a.ny - b.ny);
            for (const e of allEnv) e.draw();

            drawPath(ctx, W, H, s.PATH, hT, s.frame);
            drawSignpost(ctx, W, H, s.PATH, streak, hT);
            drawHiker(ctx, W, H, s.PATH, streak, hT, s.frame);

            ctx.restore();
            drawVignette(ctx, W, H);

            s.animId = requestAnimationFrame(tick);
        };

        stateRef.current.animId = requestAnimationFrame(tick);
        return () => {
            if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId);
        };
    }, [PATH]);

    const hud = useMemo(() => {
        const s = streak || 0;
        const pct = Math.round(clamp(s / TOTAL * 100, 0, 100));
        const nWeeks = Math.floor(s / 7);
        const nMonths = Math.floor(s / 30);
        const [, icon, text] = PHASES.find(([d]) => s >= d) || PHASES[PHASES.length - 1];
        const quote = s >= 7 ? QUOTES[(nWeeks - 1) % QUOTES.length] : "One step at a time, you'll get there.";
        const next7 = (nWeeks + 1) * 7;
        const nextLabel = s >= 365 ? 'The summit is just the beginning.' :
            `${next7 - s} day${next7 - s !== 1 ? 's' : ''} to next signpost`;
        const earnedEquip = Math.min(nMonths, EQUIPMENT.length);
        const emptySlots = Math.min(3, 3 - earnedEquip);

        return { pct, icon, text, quote, nextLabel, earnedEquip, emptySlots, s };
    }, [streak]);

    const handleViewSummit = () => {
        stateRef.current.targetCameraT = 0.03;
    };
    const handleViewHiker = () => {
        stateRef.current.targetCameraT = clamp(1 - (streak || 1) / TOTAL, 0, 1);
    };
    const handleViewBase = () => {
        stateRef.current.targetCameraT = 0.97;
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: '#0d1f40', overflow: 'hidden',
                cursor: 'grab', userSelect: 'none',
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

            {/* Top Bar */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
                padding: '14px 22px',
                background: 'linear-gradient(180deg, rgba(5,12,26,.82) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                pointerEvents: 'none',
            }}>
                <div>
                    <div style={{
                        fontSize: 10, color: 'rgba(218,188,128,.6)',
                        letterSpacing: '.22em', textTransform: 'uppercase', marginBottom: 3,
                    }}>
                        Mountain Ascent
                    </div>
                    <div style={{
                        fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1,
                        textShadow: '0 2px 22px rgba(0,0,0,.75)',
                    }}>
                        Day {hud.s}
                    </div>
                    <div style={{
                        marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(0,0,0,.42)', borderRadius: 20,
                        padding: '3px 11px 3px 7px',
                        border: '1px solid rgba(255,210,90,.22)',
                        backdropFilter: 'blur(6px)',
                    }}>
                        <span style={{ fontSize: 14 }}>{hud.icon}</span>
                        <span style={{
                            fontSize: 10, color: 'rgba(238,205,130,.82)', letterSpacing: '.12em',
                        }}>
                            {hud.text}
                        </span>
                    </div>
                </div>

                {/* Progress Circle */}
                <div style={{
                    position: 'relative', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', marginTop: -4,
                }}>
                    <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="34" cy="34" r="28" fill="rgba(0,0,0,.38)" stroke="rgba(255,255,255,.1)" strokeWidth="4" />
                        <circle cx="34" cy="34" r="28" fill="none"
                            stroke="url(#pg)" strokeWidth="4.5" strokeLinecap="round"
                            strokeDasharray="175.9"
                            strokeDashoffset={175.9 * (1 - hud.pct / 100)}
                            style={{ transition: 'stroke-dashoffset .5s ease', filter: 'drop-shadow(0 0 5px rgba(255,196,72,.75))' }}
                        />
                        <defs>
                            <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ffc030" />
                                <stop offset="100%" stopColor="#ff8018" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%,-50%)',
                        fontSize: 13, fontWeight: 700, color: '#ffe498',
                        textShadow: '0 1px 3px rgba(0,0,0,.88)', textAlign: 'center',
                    }}>
                        {hud.pct}%
                    </div>
                    <div style={{
                        fontSize: 9, color: 'rgba(218,185,110,.5)',
                        letterSpacing: '.1em', marginTop: 2,
                    }}>
                        {hud.s >= 365 ? 'COMPLETE' : 'TO PEAK'}
                    </div>
                </div>

                <button
                    onClick={e => { e.stopPropagation(); onClose(); }}
                    style={{
                        pointerEvents: 'all', cursor: 'pointer',
                        background: 'rgba(0,0,0,.45)',
                        border: '1px solid rgba(255,210,90,.22)',
                        borderRadius: 6, padding: '7px 16px',
                        color: '#ecd882', fontSize: 12,
                        backdropFilter: 'blur(8px)',
                        fontFamily: 'Georgia,serif', letterSpacing: '.06em',
                    }}
                >
                    ✕ Close
                </button>
            </div>

            {/* Side Buttons */}
            <div style={{
                position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)',
                display: 'flex', flexDirection: 'column', gap: 8, zIndex: 22,
            }}>
                {[
                    { icon: '🏔', title: 'View Summit', onClick: handleViewSummit },
                    { icon: '🧗', title: 'Follow Hiker', onClick: handleViewHiker },
                    { icon: '🌿', title: 'View Base', onClick: handleViewBase },
                ].map((btn, i) => (
                    <button
                        key={i}
                        onClick={btn.onClick}
                        title={btn.title}
                        style={{
                            pointerEvents: 'all', cursor: 'pointer',
                            width: 36, height: 36, borderRadius: 8, fontSize: 18,
                            background: 'rgba(0,0,0,.5)',
                            border: '1px solid rgba(255,210,90,.22)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        {btn.icon}
                    </button>
                ))}
            </div>

            {/* Bottom Bar */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
                padding: '16px 22px 20px',
                background: 'linear-gradient(0deg, rgba(4,10,22,.85) 0%, rgba(4,10,22,0) 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                pointerEvents: 'none',
            }}>
                <div>
                    <div style={{
                        fontSize: 13, color: '#eed8a8', fontStyle: 'italic',
                        marginBottom: 4, textShadow: '0 1px 7px rgba(0,0,0,.8)',
                        lineHeight: 1.45, maxWidth: '58%',
                    }}>
                        &ldquo;{hud.quote}&rdquo;
                    </div>
                    <div style={{
                        fontSize: 10, color: 'rgba(198,170,100,.55)',
                        letterSpacing: '.1em', marginBottom: 8,
                    }}>
                        {hud.nextLabel}
                    </div>
                    <div style={{
                        width: 240, height: 4,
                        background: 'rgba(255,255,255,.1)', borderRadius: 2, overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', borderRadius: 2,
                            background: 'linear-gradient(90deg,#ffbe30,#ff7e18)',
                            boxShadow: '0 0 8px rgba(255,175,32,.75)',
                            width: `${hud.pct}%`, transition: 'width .5s ease',
                        }} />
                    </div>
                    <div style={{
                        marginTop: 4, fontSize: 10,
                        color: 'rgba(195,168,100,.38)', letterSpacing: '.08em',
                    }}>
                        {hud.s} / {TOTAL} DAYS
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: 9, color: 'rgba(218,188,112,.4)',
                        letterSpacing: '.16em', marginBottom: 7, textTransform: 'uppercase',
                    }}>
                        Equipment Earned
                    </div>
                    <div style={{
                        display: 'flex', gap: 5, justifyContent: 'flex-end',
                        flexWrap: 'wrap', maxWidth: 220,
                    }}>
                        {EQUIPMENT.slice(0, hud.earnedEquip).map((eq, i) => (
                            <div
                                key={i}
                                title={eq.name}
                                style={{
                                    width: 34, height: 34,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(0,0,0,.44)', borderRadius: 6,
                                    fontSize: 18,
                                    border: '1px solid rgba(255,210,90,.22)',
                                    backdropFilter: 'blur(6px)',
                                }}
                            >
                                {eq.icon}
                            </div>
                        ))}
                        {Array.from({ length: hud.emptySlots }, (_, i) => (
                            <div
                                key={`empty-${i}`}
                                style={{
                                    width: 34, height: 34, borderRadius: 6,
                                    background: 'rgba(0,0,0,.22)',
                                    border: '1px dashed rgba(255,210,90,.14)',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Hint */}
            <div style={{
                position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(218,188,112,.22)', fontSize: 10,
                letterSpacing: '.14em', pointerEvents: 'none', zIndex: 21,
                whiteSpace: 'nowrap', fontFamily: 'Georgia,serif',
            }}>
                Scroll · Drag · Arrow keys to explore path
            </div>
        </div>
    );
};

Mountain.isCanvasScene = true;
export default Mountain;