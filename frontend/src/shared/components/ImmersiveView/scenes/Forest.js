// scenes/Forest.js

import React, { useRef, useEffect, useMemo, useState } from 'react';

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

// Key Y positions (normalized 0-1)
const RIVER_Y = 0.54;
const RIVER_H = 0.075;
const RIVER_TOP = RIVER_Y - RIVER_H / 2;
const RIVER_BOT = RIVER_Y + RIVER_H / 2;

// ═══════════════════════════════════════════════════════════════
// ANIMAL DEFINITIONS (in unlock order)
// ═══════════════════════════════════════════════════════════════
const ANIMAL_DEFS = [
    { name: 'Lion',     day: 14,  emoji: '🦁' },
    { name: 'Wolf',     day: 42,  emoji: '🐺' },
    { name: 'Elephant', day: 70,  emoji: '🐘' },
    { name: 'Dog',      day: 98,  emoji: '🐕' },
    { name: 'Crow',     day: 126, emoji: '🦅' },
    { name: 'Hoopoe',   day: 154, emoji: '🐦' },
    { name: 'Ant',      day: 182, emoji: '🐜' },
    { name: 'Fish',     day: 187, emoji: '🐟' },
    { name: 'Frog',     day: 194, emoji: '🐸' },
    { name: 'Bee',      day: 220, emoji: '🐝' },
    { name: 'Spider',   day: 248, emoji: '🕷️' },
    { name: 'Locust',   day: 294, emoji: '🦗' },
];

const FLOWER_COLORS = [
    '#ff6b8a', '#ff8fab', '#ffd166', '#ff9f43',
    '#e056fd', '#686de0', '#ffffff', '#f8a5c2', '#f5cd79'
];

const MILESTONES = [
    { d: 0,   e: '🌱', l: 'Seed Planted' },
    { d: 1,   e: '🌿', l: 'First Sprout' },
    { d: 7,   e: '🌳', l: 'First Tree' },
    { d: 14,  e: '🍎', l: 'First Fruits' },
    { d: 28,  e: '🦁', l: 'Animals Arrive' },
    { d: 180, e: '🏞️', l: 'River Flows' },
    { d: 187, e: '🐟', l: 'Fish Appear' },
    { d: 194, e: '🐸', l: 'Frogs Join' },
    { d: 360, e: '🌉', l: 'Bridge Built' },
    { d: 365, e: '🌿', l: 'Ancient Grove' },
];

// ═══════════════════════════════════════════════════════════════
// PRE-BUILD: Plants (365 max, grid-distributed)
//   Plant i appears day i+1, flowers day i+2
//   Split: far bank (ny < RIVER_TOP) and near bank (ny > RIVER_BOT)
// ═══════════════════════════════════════════════════════════════
function prebuildPlants() {
    const plants = [];
    const cols = 28, rowsFar = 5, rowsNear = 10;
    let idx = 0;

    // Far bank plants (behind river)
    for (let r = 0; r < rowsFar && idx < 365; r++) {
        for (let c = 0; c < cols && idx < 365; c++, idx++) {
            const seed = idx * 137 + 3;
            plants.push({
                nx: 0.02 + (c + 0.1 + sr(seed) * 0.8) / cols * 0.96,
                ny: 0.36 + (r + 0.1 + sr(seed + 1) * 0.8) / rowsFar * (RIVER_TOP - 0.37),
                flowerColor: FLOWER_COLORS[Math.floor(sr(seed + 2) * FLOWER_COLORS.length)],
                stemH: 10 + sr(seed + 3) * 14,
                flowerSize: 5 + sr(seed + 4) * 5,
                swayOff: sr(seed + 5) * Math.PI * 2,
                swaySpd: 0.012 + sr(seed + 6) * 0.015,
                depth: 0.18 + sr(seed + 7) * 0.2,
                bank: 'far',
                day: idx + 1,
            });
        }
    }

    // Near bank plants (in front of river)
    for (let r = 0; r < rowsNear && idx < 365; r++) {
        for (let c = 0; c < cols && idx < 365; c++, idx++) {
            const seed = idx * 137 + 3;
            plants.push({
                nx: 0.02 + (c + 0.1 + sr(seed) * 0.8) / cols * 0.96,
                ny: RIVER_BOT + 0.015 + (r + 0.1 + sr(seed + 1) * 0.8) / rowsNear * (0.90 - RIVER_BOT - 0.02),
                flowerColor: FLOWER_COLORS[Math.floor(sr(seed + 2) * FLOWER_COLORS.length)],
                stemH: 12 + sr(seed + 3) * 18,
                flowerSize: 6 + sr(seed + 4) * 7,
                swayOff: sr(seed + 5) * Math.PI * 2,
                swaySpd: 0.012 + sr(seed + 6) * 0.015,
                depth: 0.3 + sr(seed + 7) * 0.35,
                bank: 'near',
                day: idx + 1,
            });
        }
    }
    return plants;
}

// ═══════════════════════════════════════════════════════════════
// PRE-BUILD: Trees (max 52, one per 7 days)
//   Tree i planted day (i+1)*7, fruits day (i+2)*7
//   Far side: ny < RIVER_TOP-0.02, Near side: ny > RIVER_BOT+0.02
// ═══════════════════════════════════════════════════════════════
function prebuildTrees() {
    const trees = [];
    for (let i = 0; i < 52; i++) {
        const seed = i * 211 + 7;
        const isFar = i % 3 !== 0; // 2/3 far, 1/3 near
        const ny = isFar
            ? 0.32 + sr(seed + 1) * (RIVER_TOP - 0.35)
            : RIVER_BOT + 0.03 + sr(seed + 1) * (0.82 - RIVER_BOT - 0.05);

        trees.push({
            nx: 0.04 + sr(seed) * 0.92,
            ny,
            trunkH: 35 + sr(seed + 2) * 45,
            trunkW: 6 + sr(seed + 3) * 7,
            canopyR: 22 + sr(seed + 4) * 28,
            hue: 90 + sr(seed + 5) * 50,
            sat: 45 + sr(seed + 6) * 30,
            lit: 28 + sr(seed + 7) * 18,
            fruitHue: sr(seed + 8) * 360,
            fruitCount: 2 + Math.floor(sr(seed + 9) * 4),
            swayOff: sr(seed + 10) * Math.PI * 2,
            depth: isFar ? 0.12 + sr(seed + 11) * 0.15 : 0.3 + sr(seed + 11) * 0.3,
            plantedDay: (i + 1) * 7,
            bank: isFar ? 'far' : 'near',
        });
    }
    trees.sort((a, b) => a.ny - b.ny);
    return trees;
}

// ═══════════════════════════════════════════════════════════════
// PRE-BUILD: Animals (12, specific unlock days)
// ═══════════════════════════════════════════════════════════════
function prebuildAnimals() {
    return ANIMAL_DEFS.map((a, i) => {
        const seed = i * 311 + 13;
        const isFish = a.name === 'Fish';
        const isFrog = a.name === 'Frog';
        let ny, nx;
        if (isFish) {
            nx = 0.15 + sr(seed) * 0.7;
            ny = RIVER_TOP + 0.01 + sr(seed + 1) * (RIVER_H - 0.02);
        } else if (isFrog) {
            nx = 0.25 + sr(seed) * 0.5;
            ny = RIVER_BOT + 0.005 + sr(seed + 1) * 0.025;
        } else {
            nx = 0.06 + sr(seed) * 0.88;
            ny = RIVER_BOT + 0.04 + sr(seed + 1) * 0.30;
        }
        return {
            ...a,
            nx, ny,
            size: a.name === 'Ant' ? 16 : a.name === 'Bee' ? 18 : a.name === 'Spider' ? 16 : a.name === 'Locust' ? 18 : 28 + sr(seed + 2) * 14,
            depth: isFish ? 0.18 : isFrog ? 0.28 : 0.32 + sr(seed + 3) * 0.25,
            idleOff: sr(seed + 4) * Math.PI * 2,
            idleSpd: 0.015 + sr(seed + 5) * 0.02,
        };
    });
}

// ═══════════════════════════════════════════════════════════════
// PRE-BUILD: Fireflies (max 80)
// ═══════════════════════════════════════════════════════════════
function prebuildFireflies() {
    const ff = [];
    for (let i = 0; i < 80; i++) {
        const seed = i * 83 + 7;
        ff.push({
            nx: 0.05 + sr(seed) * 0.9,
            ny: 0.18 + sr(seed + 1) * 0.65,
            size: 2 + sr(seed + 2) * 2.5,
            offX: sr(seed + 3) * Math.PI * 2,
            offY: sr(seed + 4) * Math.PI * 2,
            speedX: 0.008 + sr(seed + 5) * 0.012,
            speedY: 0.006 + sr(seed + 6) * 0.01,
            bright: 0.4 + sr(seed + 7) * 0.6,
        });
    }
    return ff;
}

// ═══════════════════════════════════════════════════════════════
// PRE-BUILD: Mountain profiles (3 layers)
// ═══════════════════════════════════════════════════════════════
function prebuildMountains() {
    const layers = [];
    const configs = [
        { baseY: 0.28, color1: '#9bb5c9', color2: '#b8cfe0', count: 9, maxH: 0.09, seed: 42, depth: 0.03 },
        { baseY: 0.33, color1: '#6a8a6a', color2: '#8aaa8a', count: 7, maxH: 0.11, seed: 73, depth: 0.06 },
        { baseY: 0.37, color1: '#3a6040', color2: '#4a7a50', count: 5, maxH: 0.10, seed: 19, depth: 0.09 },
    ];
    for (const cfg of configs) {
        const peaks = [];
        for (let i = 0; i < cfg.count; i++) {
            peaks.push({
                x: (i + 0.5 + (sr(cfg.seed + i * 37) - 0.5) * 0.3) / cfg.count,
                h: cfg.maxH * (0.45 + sr(cfg.seed + i * 71) * 0.55),
            });
        }
        layers.push({ ...cfg, peaks });
    }
    return layers;
}

// ═══════════════════════════════════════════════════════════════
// PRE-BUILD: River stones
// ═══════════════════════════════════════════════════════════════
function prebuildStones() {
    const stones = [];
    for (let i = 0; i < 14; i++) {
        const seed = i * 57 + 99;
        stones.push({
            nx: 0.08 + sr(seed) * 0.84,
            ny: RIVER_TOP + 0.01 + sr(seed + 1) * (RIVER_H - 0.02),
            rx: 4 + sr(seed + 2) * 8,
            ry: 2.5 + sr(seed + 3) * 4,
            rot: sr(seed + 4) * Math.PI,
            shade: 0.3 + sr(seed + 5) * 0.25,
        });
    }
    return stones;
}

// ═══════════════════════════════════════════════════════════════
// DRAW HELPERS
// ═══════════════════════════════════════════════════════════════

function toScreen(nx, ny, depth, W, H, camX, camY) {
    return [nx * W - camX * depth, ny * H - camY * depth];
}

function drawSky(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    g.addColorStop(0, '#5b9bd5');
    g.addColorStop(0.4, '#87ceeb');
    g.addColorStop(0.75, '#b5dff5');
    g.addColorStop(1, '#d4eef8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.45);
}

function drawClouds(ctx, W, H, frame, camX) {
    const clouds = [
        { x: 0.12, y: 0.06, w: 60, h: 18 },
        { x: 0.38, y: 0.04, w: 80, h: 22 },
        { x: 0.62, y: 0.08, w: 55, h: 16 },
        { x: 0.85, y: 0.05, w: 70, h: 20 },
        { x: 0.25, y: 0.12, w: 45, h: 14 },
    ];
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (const c of clouds) {
        const cx = c.x * W - camX * 0.015 + Math.sin(frame * 0.0008 + c.x * 20) * 12;
        const cy = c.y * H;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(cx, cy, c.w, c.h, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - c.w * 0.45, cy + c.h * 0.3, c.w * 0.6, c.h * 0.85, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + c.w * 0.4, cy + c.h * 0.25, c.w * 0.55, c.h * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawMountainLayer(ctx, W, H, layer, camX) {
    const baseY = layer.baseY * H;
    const pts = layer.peaks.map(p => ({
        x: p.x * W - camX * layer.depth,
        y: baseY - p.h * H,
    }));

    const g = ctx.createLinearGradient(0, baseY - layer.maxH * H, 0, baseY + 10);
    g.addColorStop(0, layer.color2);
    g.addColorStop(1, layer.color1);
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(-120, baseY + 5);
    ctx.lineTo(pts[0].x - 60, baseY);
    for (let i = 0; i < pts.length; i++) {
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];
        const cpx = (curr.x + next.x) / 2;
        const cpy = Math.min(curr.y, next.y) + (Math.abs(curr.y - next.y) * 0.3);
        ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x + 60, baseY);
    ctx.lineTo(W + 120, baseY + 5);
    ctx.lineTo(W + 120, H);
    ctx.lineTo(-120, H);
    ctx.closePath();
    ctx.fill();
}

function drawGround(ctx, W, H, camX, camY) {
    // Far ground (above river)
    const farG = ctx.createLinearGradient(0, H * 0.30, 0, H * RIVER_TOP);
    farG.addColorStop(0, '#4a7a42');
    farG.addColorStop(0.5, '#5a8a4a');
    farG.addColorStop(1, '#6a9a52');
    ctx.fillStyle = farG;
    ctx.fillRect(0, H * 0.30, W, H * (RIVER_TOP - 0.30));

    // Near ground (below river)
    const nearG = ctx.createLinearGradient(0, H * RIVER_BOT, 0, H);
    nearG.addColorStop(0, '#5a9048');
    nearG.addColorStop(0.3, '#4a8038');
    nearG.addColorStop(0.7, '#3d7030');
    nearG.addColorStop(1, '#2d5a22');
    ctx.fillStyle = nearG;
    ctx.fillRect(0, H * RIVER_BOT, W, H * (1 - RIVER_BOT));
}

function drawGrassTufts(ctx, W, H, frame, camX, camY, yMin, yMax, count, seed) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#3a6a28';
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
        const s = seed + i * 31;
        const nx = 0.02 + sr(s) * 0.96;
        const ny = yMin + sr(s + 1) * (yMax - yMin);
        const [x, y] = toScreen(nx, ny, 0.35, W, H, camX, camY);
        if (x < -20 || x > W + 20) continue;
        const h = 5 + sr(s + 2) * 8;
        const sway = Math.sin(frame * 0.02 + s) * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + sway, y - h * 0.6, x + sway * 1.5, y - h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 3, y);
        ctx.quadraticCurveTo(x + 3 - sway * 0.5, y - h * 0.5, x + 3 - sway, y - h * 0.85);
        ctx.stroke();
    }
    ctx.restore();
}

function drawRiver(ctx, W, H, frame, camX, camY, stones) {
    const [rx1, ry1] = toScreen(0, RIVER_TOP, 0.15, W, H, camX, camY);
    const [rx2, ry2] = toScreen(1, RIVER_BOT, 0.15, W, H, camX, camY);
    const rTop = ry1;
    const rBot = ry2;
    const rH = rBot - rTop;

    // Water body
    const wg = ctx.createLinearGradient(0, rTop, 0, rBot);
    wg.addColorStop(0, '#3a8ab0');
    wg.addColorStop(0.3, '#2a7aa5');
    wg.addColorStop(0.7, '#1a6a95');
    wg.addColorStop(1, '#2a7aa0');
    ctx.fillStyle = wg;
    ctx.fillRect(-10, rTop, W + 20, rH);

    // Wave lines
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#a0d8f0';
    ctx.lineWidth = 1;
    for (let row = 0; row < 5; row++) {
        const wy = rTop + rH * (0.15 + row * 0.17);
        ctx.beginPath();
        for (let x = -10; x <= W + 10; x += 4) {
            const wave = Math.sin(x * 0.02 + frame * 0.03 + row * 2) * 2.5;
            x === -10 ? ctx.moveTo(x, wy + wave) : ctx.lineTo(x, wy + wave);
        }
        ctx.stroke();
    }
    ctx.restore();

    // Shimmer highlights
    ctx.save();
    for (let i = 0; i < 8; i++) {
        const sx = W * 0.1 + i * W * 0.11 + Math.sin(frame * 0.025 + i * 1.7) * 8;
        const sy = rTop + rH * (0.2 + sr(i * 17) * 0.6);
        ctx.globalAlpha = 0.08 + Math.sin(frame * 0.04 + i) * 0.05;
        ctx.fillStyle = '#c0e8ff';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 12 + sr(i * 7) * 8, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Stones
    for (const stone of stones) {
        const [sx, sy] = toScreen(stone.nx, stone.ny, 0.15, W, H, camX, camY);
        if (sx < -20 || sx > W + 20) continue;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(stone.rot);
        const shade = Math.floor(stone.shade * 255);
        ctx.fillStyle = `rgb(${shade},${shade - 5},${shade - 10})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, stone.rx, stone.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#b0b0b0';
        ctx.beginPath();
        ctx.ellipse(-stone.rx * 0.2, -stone.ry * 0.3, stone.rx * 0.4, stone.ry * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawBridge(ctx, W, H, frame, camX, camY) {
    const depth = 0.15;
    const bLeft = 0.25 * W - camX * depth;
    const bRight = 0.75 * W - camX * depth;
    const bW = bRight - bLeft;
    const rCenter = RIVER_Y * H - camY * depth;
    const archH = 28;
    const deckThick = 7;
    const railH = 20;
    const postCount = 10;

    const archY = (t) => rCenter - archH * 4 * t * (1 - t);

    // Support posts (behind deck)
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 4;
    for (let i = 0; i <= postCount; i++) {
        const t = i / postCount;
        const x = bLeft + t * bW;
        const y = archY(t);
        ctx.beginPath();
        ctx.moveTo(x, y + deckThick);
        ctx.lineTo(x, y + deckThick + 18);
        ctx.stroke();
    }

    // Deck surface
    ctx.fillStyle = '#9B7328';
    ctx.beginPath();
    ctx.moveTo(bLeft, archY(0));
    for (let t = 0; t <= 1; t += 0.015) {
        ctx.lineTo(bLeft + t * bW, archY(t));
    }
    for (let t = 1; t >= 0; t -= 0.015) {
        ctx.lineTo(bLeft + t * bW, archY(t) + deckThick);
    }
    ctx.closePath();
    ctx.fill();

    // Deck shadow
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(bLeft, archY(0) + deckThick);
    for (let t = 0; t <= 1; t += 0.015) {
        ctx.lineTo(bLeft + t * bW, archY(t) + deckThick);
    }
    for (let t = 1; t >= 0; t -= 0.015) {
        ctx.lineTo(bLeft + t * bW, archY(t) + deckThick + 8);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Plank lines
    ctx.strokeStyle = '#7a5518';
    ctx.lineWidth = 0.8;
    const plankN = 28;
    for (let i = 1; i < plankN; i++) {
        const t = i / plankN;
        const x = bLeft + t * bW;
        ctx.beginPath();
        ctx.moveTo(x, archY(t));
        ctx.lineTo(x, archY(t) + deckThick);
        ctx.stroke();
    }

    // Railing posts
    ctx.strokeStyle = '#6a4a12';
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= postCount; i++) {
        const t = i / postCount;
        const x = bLeft + t * bW;
        ctx.beginPath();
        ctx.moveTo(x, archY(t));
        ctx.lineTo(x, archY(t) - railH);
        ctx.stroke();
    }

    // Top rail
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = '#7a5a1a';
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.015) {
        const x = bLeft + t * bW;
        const y = archY(t) - railH;
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Mid rail
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.015) {
        const x = bLeft + t * bW;
        const y = archY(t) - railH * 0.5;
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawTree(ctx, x, y, tree, frame, hasFruits, streak) {
    const sway = Math.sin(frame * tree.swayOff * 0.01 + tree.swayOff) * 2;
    const tH = tree.trunkH;
    const tW = tree.trunkW;
    const cR = tree.canopyR;

    // Trunk
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(x - tW * 0.5, y);
    ctx.lineTo(x - tW * 0.35 + sway * 0.3, y - tH);
    ctx.lineTo(x + tW * 0.35 + sway * 0.3, y - tH);
    ctx.lineTo(x + tW * 0.5, y);
    ctx.closePath();
    ctx.fill();

    // Trunk texture
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#3a2a10';
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) {
        const ty = y - tH * (i / 4);
        const tw = tW * (0.5 - i * 0.05);
        ctx.beginPath();
        ctx.moveTo(x - tw + sway * 0.3 * (i / 4), ty);
        ctx.lineTo(x + tw + sway * 0.3 * (i / 4), ty);
        ctx.stroke();
    }
    ctx.restore();

    // Canopy (multiple overlapping circles)
    const cx = x + sway;
    const cy = y - tH;
    const layers = [
        { dx: 0, dy: -cR * 0.3, r: cR, lit: tree.lit },
        { dx: -cR * 0.5, dy: 0, r: cR * 0.8, lit: tree.lit - 3 },
        { dx: cR * 0.5, dy: 0, r: cR * 0.8, lit: tree.lit - 2 },
        { dx: -cR * 0.2, dy: -cR * 0.6, r: cR * 0.7, lit: tree.lit + 2 },
        { dx: cR * 0.2, dy: -cR * 0.5, r: cR * 0.65, lit: tree.lit + 1 },
    ];

    // Shadow under canopy
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, cy + cR * 0.3, cR * 1.1, cR * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (const l of layers) {
        const g = ctx.createRadialGradient(
            cx + l.dx, cy + l.dy - l.r * 0.2, 0,
            cx + l.dx, cy + l.dy, l.r
        );
        g.addColorStop(0, `hsl(${tree.hue}, ${tree.sat}%, ${l.lit + 8}%)`);
        g.addColorStop(0.6, `hsl(${tree.hue}, ${tree.sat}%, ${l.lit}%)`);
        g.addColorStop(1, `hsl(${tree.hue - 10}, ${tree.sat - 5}%, ${l.lit - 5}%)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx + l.dx, cy + l.dy, l.r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Fruits
    if (hasFruits) {
        for (let i = 0; i < tree.fruitCount; i++) {
            const fs = tree.plantedDay * 3 + i * 47;
            const angle = (i / tree.fruitCount) * Math.PI * 2 + sr(fs) * 0.5;
            const dist = cR * (0.5 + sr(fs + 1) * 0.35);
            const fx = cx + Math.cos(angle) * dist;
            const fy = cy + Math.sin(angle) * dist * 0.7;
            const fSize = 3.5 + sr(fs + 2) * 2;

            ctx.fillStyle = `hsl(${tree.fruitHue + i * 30}, 72%, 52%)`;
            ctx.beginPath();
            ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(fx - fSize * 0.25, fy - fSize * 0.25, fSize * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

function drawPlant(ctx, x, y, plant, frame, hasFlower) {
    const sway = Math.sin(frame * plant.swaySpd + plant.swayOff) * 3;
    const h = plant.stemH;

    // Stem
    ctx.strokeStyle = '#3a7a28';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sway * 0.5, y - h * 0.5, x + sway, y - h);
    ctx.stroke();

    // Leaves
    ctx.fillStyle = '#4a8a35';
    const leafY = y - h * 0.45;
    const leafX = x + sway * 0.3;
    ctx.save();
    ctx.translate(leafX, leafY);
    ctx.rotate(0.4 + sway * 0.03);
    ctx.beginPath();
    ctx.ellipse(4, 0, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(leafX, leafY + 3);
    ctx.rotate(-0.5 + sway * 0.03);
    ctx.beginPath();
    ctx.ellipse(-4, 0, 4.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Flower
    if (hasFlower) {
        const fx = x + sway;
        const fy = y - h;
        const fs = plant.flowerSize;
        const petals = 5;

        ctx.fillStyle = plant.flowerColor;
        for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
            const px = fx + Math.cos(a) * fs * 0.35;
            const py = fy + Math.sin(a) * fs * 0.35;
            ctx.beginPath();
            ctx.arc(px, py, fs * 0.32, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(fx, fy, fs * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawFishShape(ctx, x, y, size, frame, seed) {
    const wobble = Math.sin(frame * 0.04 + seed) * 3;
    const dir = sr(seed + 100) > 0.5 ? 1 : -1;

    ctx.save();
    ctx.translate(x + wobble, y);
    ctx.scale(dir, 1);

    // Body
    ctx.fillStyle = '#e8a030';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, 0);
    ctx.lineTo(-size * 0.85, -size * 0.25);
    ctx.lineTo(-size * 0.85, size * 0.25);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size * 0.25, -size * 0.05, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Fin
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#d09028';
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.2, size * 0.15, size * 0.1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

function drawFirefly(ctx, x, y, size, brightness, frame, offX, offY, spdX, spdY) {
    const fx = x + Math.sin(frame * spdX + offX) * 15;
    const fy = y + Math.cos(frame * spdY + offY) * 10;
    const pulse = 0.4 + Math.sin(frame * 0.06 + offX * 3) * 0.6;
    const alpha = brightness * pulse;

    if (alpha < 0.1) return;

    ctx.save();
    ctx.globalAlpha = alpha * 0.25;
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = 'rgba(254,240,138,0.8)';
    ctx.shadowBlur = size * 6;
    ctx.beginPath();
    ctx.arc(fx, fy, size * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.shadowBlur = size * 3;
    ctx.beginPath();
    ctx.arc(fx, fy, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
const Forest = ({ streak = 0, onClose }) => {
    const canvasRef = useRef(null);
    const [visible, setVisible] = useState(false);

    const stateRef = useRef({
        W: 0, H: 0,
        camX: 0, camY: 0,
        frame: 0,
        keys: {},
        touch: { a: false, sx: 0, sy: 0, scx: 0, scy: 0 },
        PLANTS: prebuildPlants(),
        TREES: prebuildTrees(),
        ANIMALS: prebuildAnimals(),
        FIREFLIES: prebuildFireflies(),
        MOUNTAINS: prebuildMountains(),
        STONES: prebuildStones(),
        animId: null,
    });

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // ── Body scroll lock + fade in ──────────────────────
    useEffect(() => {
        const scrollY = window.scrollY;
        const body = document.body;
        const orig = {
            overflow: body.style.overflow,
            position: body.style.position,
            top: body.style.top,
            width: body.style.width,
        };
        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.width = '100%';
        const t = setTimeout(() => setVisible(true), 50);
        return () => {
            clearTimeout(t);
            Object.assign(body.style, orig);
            window.scrollTo(0, scrollY);
        };
    }, []);

    // ── Resize ──────────────────────────────────────────
    useEffect(() => {
        const handleResize = () => {
            const c = canvasRef.current;
            if (!c) return;
            stateRef.current.W = c.width = window.innerWidth;
            stateRef.current.H = c.height = window.innerHeight;
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Keyboard ───────────────────────────────────────
    useEffect(() => {
        const down = (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
                e.preventDefault(); e.stopPropagation();
            }
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCloseRef.current?.(); return; }
            stateRef.current.keys[e.key] = true;
        };
        const up = (e) => { e.stopPropagation(); delete stateRef.current.keys[e.key]; };
        window.addEventListener('keydown', down, true);
        window.addEventListener('keyup', up, true);
        return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
    }, []);

    // ── Touch ──────────────────────────────────────────
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const MAX = 120;
        const ts = (e) => { e.stopPropagation(); const t = e.touches[0]; const s = stateRef.current; s.touch = { a: true, sx: t.clientX, sy: t.clientY, scx: s.camX, scy: s.camY }; };
        const tm = (e) => { e.preventDefault(); e.stopPropagation(); const s = stateRef.current; if (!s.touch.a) return; const t = e.touches[0]; s.camX = clamp(s.touch.scx - (t.clientX - s.touch.sx) * 0.4, -MAX, MAX); s.camY = clamp(s.touch.scy - (t.clientY - s.touch.sy) * 0.4, -MAX, MAX); };
        const te = (e) => { e.stopPropagation(); stateRef.current.touch.a = false; };
        c.addEventListener('touchstart', ts, { passive: true });
        c.addEventListener('touchmove', tm, { passive: false });
        c.addEventListener('touchend', te, { passive: true });
        return () => { c.removeEventListener('touchstart', ts); c.removeEventListener('touchmove', tm); c.removeEventListener('touchend', te); };
    }, []);

    // ── Animation loop ────────────────────────────────
    useEffect(() => {
        const MAX = 120, SPD = 2.8;
        const tick = () => {
            const c = canvasRef.current;
            if (!c) { stateRef.current.animId = requestAnimationFrame(tick); return; }
            const ctx = c.getContext('2d');
            const s = stateRef.current;
            const { W, H, keys } = s;
            if (!W || !H) { s.animId = requestAnimationFrame(tick); return; }

            // Camera
            if (keys['ArrowLeft'])  s.camX = clamp(s.camX - SPD, -MAX, MAX);
            if (keys['ArrowRight']) s.camX = clamp(s.camX + SPD, -MAX, MAX);
            if (keys['ArrowUp'])    s.camY = clamp(s.camY - SPD, -MAX, MAX);
            if (keys['ArrowDown'])  s.camY = clamp(s.camY + SPD, -MAX, MAX);
            if (!keys['ArrowLeft'] && !keys['ArrowRight']) s.camX *= 0.96;
            if (!keys['ArrowUp'] && !keys['ArrowDown']) s.camY *= 0.96;

            s.frame++;
            const frame = s.frame;
            const { camX, camY } = s;

            // ═══════════════════════════════════════════
            // 1. SKY + CLOUDS
            // ═══════════════════════════════════════════
            drawSky(ctx, W, H);
            drawClouds(ctx, W, H, frame, camX);

            // ═══════════════════════════════════════════
            // 2. MOUNTAINS (3 layers)
            // ═══════════════════════════════════════════
            for (const ml of s.MOUNTAINS) {
                drawMountainLayer(ctx, W, H, ml, camX);
            }

            // ═══════════════════════════════════════════
            // 3. GROUND
            // ═══════════════════════════════════════════
            drawGround(ctx, W, H, camX, camY);

            // Grass tufts — far
            drawGrassTufts(ctx, W, H, frame, camX, camY, 0.34, RIVER_TOP - 0.01, 80, 500);
            // Grass tufts — near
            drawGrassTufts(ctx, W, H, frame, camX, camY, RIVER_BOT + 0.02, 0.92, 120, 800);

            // ═══════════════════════════════════════════
            // 4. FAR TREES
            // ═══════════════════════════════════════════
            const treeCount = Math.min(Math.floor(streak / 7), 52);
            for (let i = 0; i < treeCount; i++) {
                const tree = s.TREES[i];
                if (tree.bank !== 'far') continue;
                const [x, y] = toScreen(tree.nx, tree.ny, tree.depth, W, H, camX, camY);
                if (x < -80 || x > W + 80) continue;
                const hasFruits = streak >= tree.plantedDay + 7;
                drawTree(ctx, x, y, tree, frame, hasFruits, streak);
            }

            // ═══════════════════════════════════════════
            // 5. FAR PLANTS
            // ═══════════════════════════════════════════
            const plantCount = Math.min(streak, 365);
            for (let i = 0; i < plantCount; i++) {
                const p = s.PLANTS[i];
                if (p.bank !== 'far') continue;
                const [x, y] = toScreen(p.nx, p.ny, p.depth, W, H, camX, camY);
                if (x < -15 || x > W + 15) continue;
                const hasFlower = streak >= p.day + 1;
                drawPlant(ctx, x, y, p, frame, hasFlower);
            }

            // ═══════════════════════════════════════════
            // 6. RIVER (180+ days)
            // ═══════════════════════════════════════════
            const showRiver = streak >= 180;
            if (showRiver) {
                drawRiver(ctx, W, H, frame, camX, camY, s.STONES);

                // Fish in river (187+)
                if (streak >= 187) {
                    const fish = s.ANIMALS.find(a => a.name === 'Fish');
                    if (fish) {
                        const [fx, fy] = toScreen(fish.nx, fish.ny, fish.depth, W, H, camX, camY);
                        // Draw multiple fish
                        for (let fi = 0; fi < 5; fi++) {
                            const fs = fish.day * 7 + fi * 43;
                            const fnx = fish.nx + (sr(fs) - 0.5) * 0.5;
                            const fny = fish.ny + (sr(fs + 1) - 0.5) * 0.03;
                            const [fsx, fsy] = toScreen(fnx, fny, fish.depth, W, H, camX, camY);
                            if (fsx > -20 && fsx < W + 20) {
                                drawFishShape(ctx, fsx, fsy, 8 + sr(fs + 2) * 5, frame, fs);
                            }
                        }
                    }
                }

                // Bridge (360+)
                if (streak >= 360) {
                    drawBridge(ctx, W, H, frame, camX, camY);
                }
            }

            // ═══════════════════════════════════════════
            // 7. NEAR TREES
            // ═══════════════════════════════════════════
            for (let i = 0; i < treeCount; i++) {
                const tree = s.TREES[i];
                if (tree.bank !== 'near') continue;
                const [x, y] = toScreen(tree.nx, tree.ny, tree.depth, W, H, camX, camY);
                if (x < -80 || x > W + 80) continue;
                const hasFruits = streak >= tree.plantedDay + 7;
                drawTree(ctx, x, y, tree, frame, hasFruits, streak);
            }

            // ═══════════════════════════════════════════
            // 8. NEAR PLANTS
            // ═══════════════════════════════════════════
            for (let i = 0; i < plantCount; i++) {
                const p = s.PLANTS[i];
                if (p.bank !== 'near') continue;
                const [x, y] = toScreen(p.nx, p.ny, p.depth, W, H, camX, camY);
                if (x < -15 || x > W + 15) continue;
                const hasFlower = streak >= p.day + 1;
                drawPlant(ctx, x, y, p, frame, hasFlower);
            }

            // ═══════════════════════════════════════════
            // 9. LAND ANIMALS (excluding fish/frog)
            // ═══════════════════════════════════════════
            for (const animal of s.ANIMALS) {
                if (animal.name === 'Fish' || animal.name === 'Frog') continue;
                if (streak < animal.day) continue;
                const [ax, ay] = toScreen(animal.nx, animal.ny, animal.depth, W, H, camX, camY);
                if (ax < -40 || ax > W + 40) continue;

                const bob = Math.sin(frame * animal.idleSpd + animal.idleOff) * 2;
                ctx.save();
                ctx.font = `${animal.size}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(animal.emoji, ax, ay + bob);
                ctx.restore();
            }

            // Frog near river bank (194+)
            if (streak >= 194) {
                const frog = s.ANIMALS.find(a => a.name === 'Frog');
                if (frog) {
                    const [fx, fy] = toScreen(frog.nx, frog.ny, frog.depth, W, H, camX, camY);
                    const hop = Math.abs(Math.sin(frame * 0.03 + frog.idleOff)) * 4;
                    ctx.save();
                    ctx.font = `${frog.size}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(frog.emoji, fx, fy - hop);
                    ctx.restore();
                }
            }

            // ═══════════════════════════════════════════
            // 10. FIREFLIES
            // ═══════════════════════════════════════════
            const ffCount = Math.min(streak, 80);
            for (let i = 0; i < ffCount; i++) {
                const ff = s.FIREFLIES[i];
                const [fx, fy] = toScreen(ff.nx, ff.ny, 0.25, W, H, camX, camY);
                if (fx < -20 || fx > W + 20) continue;
                drawFirefly(ctx, fx, fy, ff.size, ff.bright, frame, ff.offX, ff.offY, ff.speedX, ff.speedY);
            }

            // ═══════════════════════════════════════════
            // 11. FOREGROUND GRASS BLADES
            // ═══════════════════════════════════════════
            ctx.save();
            ctx.globalAlpha = 0.5;
            for (let i = 0; i < 30; i++) {
                const gs = i * 47 + 1000;
                const gx = sr(gs) * W;
                const gy = H - 5 - sr(gs + 1) * 15;
                const gh = 15 + sr(gs + 2) * 25;
                const gsway = Math.sin(frame * 0.018 + gs) * 4;
                ctx.strokeStyle = `hsl(${110 + sr(gs + 3) * 30}, 55%, ${22 + sr(gs + 4) * 12}%)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.quadraticCurveTo(gx + gsway, gy - gh * 0.6, gx + gsway * 1.5, gy - gh);
                ctx.stroke();
            }
            ctx.restore();

            // ═══════════════════════════════════════════
            // 12. VIGNETTE
            // ═══════════════════════════════════════════
            const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.25)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            s.animId = requestAnimationFrame(tick);
        };

        stateRef.current.animId = requestAnimationFrame(tick);
        return () => { if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId); };
    }, []);

    // ── HUD ───────────────────────────────────────────
    const hud = useMemo(() => {
        const nP = Math.min(streak, 365);
        const nFl = Math.min(Math.max(streak - 1, 0), 364);
        const nT = Math.min(Math.floor(streak / 7), 52);
        const nFr = Math.min(Math.floor((streak - 14) / 7), 51);
        const nA = ANIMAL_DEFS.filter(a => streak >= a.day).length;
        const river = streak >= 180;
        const fish = streak >= 187;
        const frogs = streak >= 194;
        const bridge = streak >= 360;

        let cur = MILESTONES[0];
        for (const m of MILESTONES) if (streak >= m.d) cur = m;
        const nxt = MILESTONES.find(m => streak < m.d);

        return { nP, nFl, nT, nFr, nA, river, fish, frogs, bridge, cur, nxt };
    }, [streak]);

    const counters = [
        [hud.nP, 'Plants'],
        [hud.nFl, 'Flowers'],
        [hud.nT, 'Trees'],
        [Math.max(0, hud.nFr), 'Fruiting'],
        [hud.nA, 'Animals'],
        [hud.river ? 'Yes' : '—', 'River'],
        [hud.fish ? 'Yes' : '—', 'Fish'],
        [hud.frogs ? 'Yes' : '—', 'Frogs'],
        [hud.bridge ? 'Yes' : '—', 'Bridge'],
    ];

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: '#2d5a22', overflow: 'hidden',
                pointerEvents: 'all',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.6s ease-out'
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
        >
            <canvas
                ref={canvasRef}
                style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
            />

            {/* Top bar */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
                padding: '10px 20px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                pointerEvents: 'none'
            }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {counters.map(([val, label]) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 14, fontWeight: 'bold', color: '#fff',
                                textShadow: '0 0 8px rgba(100,180,80,.8)'
                            }}>
                                {val}
                            </div>
                            <div style={{
                                fontSize: 8, color: 'rgba(180,220,160,.7)',
                                letterSpacing: '.08em', textTransform: 'uppercase'
                            }}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={e => { e.stopPropagation(); onClose(); }}
                    style={{
                        pointerEvents: 'all', cursor: 'pointer',
                        background: 'rgba(0,0,0,.45)',
                        border: '1px solid rgba(100,180,80,.3)',
                        borderRadius: 10, padding: '6px 14px',
                        color: 'rgba(180,220,160,.9)', fontSize: 13,
                        backdropFilter: 'blur(6px)', fontFamily: 'Georgia, serif'
                    }}
                >
                    ✕ Close
                </button>
            </div>

            {/* Bottom HUD */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
                padding: '12px 22px',
                background: 'linear-gradient(0deg, rgba(0,0,0,.6) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                pointerEvents: 'none'
            }}>
                <div>
                    <div style={{
                        fontSize: 22, fontWeight: 'bold', color: '#fff',
                        letterSpacing: '.07em',
                        textShadow: '0 0 16px rgba(100,180,80,.8)'
                    }}>
                        {streak} Day{streak !== 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(180,220,160,.8)', lineHeight: 1.75 }}>
                        {hud.cur.e} {hud.cur.l}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(140,190,120,.6)' }}>
                        {hud.nxt
                            ? `${hud.nxt.e} ${hud.nxt.l} in ${hud.nxt.d - streak} day${(hud.nxt.d - streak) !== 1 ? 's' : ''}`
                            : '🌿 Full Ancient Grove achieved — 365 plants, 52 trees, 12 animals, river & bridge'
                        }
                    </div>
                </div>
                <div style={{
                    textAlign: 'right', fontSize: 11,
                    color: 'rgba(140,190,120,.5)',
                    fontStyle: 'italic', lineHeight: 1.7
                }}>
                    Arrow keys · explore the grove<br />
                    Esc to close
                </div>
            </div>
        </div>
    );
};

Forest.isCanvasScene = true;

export default Forest;