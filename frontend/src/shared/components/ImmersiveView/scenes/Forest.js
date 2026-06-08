// scenes/Forest.js — Photorealistic upgrade matching reference image
// Golden-hour lighting, lush vegetation, atmospheric depth, curved river

import React, { useRef, useEffect, useMemo, useState } from 'react';

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
const sr = s => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Key Y positions (normalized 0-1)
const RIVER_Y = 0.54;
const RIVER_H = 0.075;
const RIVER_TOP = RIVER_Y - RIVER_H / 2;
const RIVER_BOT = RIVER_Y + RIVER_H / 2;

// ═══════════════════════════════════════════════════════════════
// ANIMAL DEFINITIONS
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
    '#ff6b8a','#ff8fab','#ffd166','#ff9f43',
    '#e056fd','#686de0','#ffffff','#f8a5c2',
    '#f5cd79','#ff4757','#eccc68','#a29bfe',
    '#fd79a8','#fdcb6e','#e17055','#74b9ff',
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
// PRE-BUILD DATA
// ═══════════════════════════════════════════════════════════════
function prebuildPlants() {
    const plants = [];
    const cols = 28, rowsFar = 5, rowsNear = 10;
    let idx = 0;
    for (let r = 0; r < rowsFar && idx < 365; r++) {
        for (let c = 0; c < cols && idx < 365; c++, idx++) {
            const seed = idx * 137 + 3;
            plants.push({
                nx: 0.02 + (c + 0.1 + sr(seed) * 0.8) / cols * 0.96,
                ny: 0.36 + (r + 0.1 + sr(seed+1)*0.8) / rowsFar * (RIVER_TOP - 0.37),
                flowerColor: FLOWER_COLORS[Math.floor(sr(seed+2)*FLOWER_COLORS.length)],
                stemH: 8 + sr(seed+3)*12,
                flowerSize: 4 + sr(seed+4)*5,
                swayOff: sr(seed+5)*Math.PI*2,
                swaySpd: 0.01 + sr(seed+6)*0.015,
                depth: 0.18 + sr(seed+7)*0.2,
                bank: 'far', day: idx+1,
            });
        }
    }
    for (let r = 0; r < rowsNear && idx < 365; r++) {
        for (let c = 0; c < cols && idx < 365; c++, idx++) {
            const seed = idx * 137 + 3;
            plants.push({
                nx: 0.02 + (c + 0.1 + sr(seed)*0.8) / cols * 0.96,
                ny: RIVER_BOT + 0.015 + (r + 0.1 + sr(seed+1)*0.8) / rowsNear * (0.90-RIVER_BOT-0.02),
                flowerColor: FLOWER_COLORS[Math.floor(sr(seed+2)*FLOWER_COLORS.length)],
                stemH: 10 + sr(seed+3)*16,
                flowerSize: 5 + sr(seed+4)*7,
                swayOff: sr(seed+5)*Math.PI*2,
                swaySpd: 0.01 + sr(seed+6)*0.015,
                depth: 0.3 + sr(seed+7)*0.35,
                bank: 'near', day: idx+1,
            });
        }
    }
    return plants;
}

function prebuildTrees() {
    const trees = [];
    for (let i = 0; i < 52; i++) {
        const seed = i * 211 + 7;
        const isFar = i % 3 !== 0;
        const ny = isFar
            ? 0.32 + sr(seed+1) * (RIVER_TOP - 0.35)
            : RIVER_BOT + 0.03 + sr(seed+1) * (0.82-RIVER_BOT-0.05);
        trees.push({
            nx: 0.04 + sr(seed)*0.92,
            ny,
            trunkH: 40 + sr(seed+2)*55,
            trunkW: 7 + sr(seed+3)*8,
            canopyR: 28 + sr(seed+4)*35,
            hue: 88 + sr(seed+5)*55,
            sat: 48 + sr(seed+6)*30,
            lit: 26 + sr(seed+7)*18,
            fruitHue: sr(seed+8)*360,
            fruitCount: 3 + Math.floor(sr(seed+9)*5),
            swayOff: sr(seed+10)*Math.PI*2,
            depth: isFar ? 0.1 + sr(seed+11)*0.13 : 0.28 + sr(seed+11)*0.3,
            plantedDay: (i+1)*7,
            bank: isFar ? 'far' : 'near',
            // Extra visual variation
            lean: (sr(seed+12)-0.5)*0.08,
            secondaryHue: 95 + sr(seed+13)*45,
        });
    }
    trees.sort((a,b) => a.ny - b.ny);
    return trees;
}

function prebuildAnimals() {
    return ANIMAL_DEFS.map((a,i) => {
        const seed = i * 311 + 13;
        const isFish = a.name === 'Fish';
        const isFrog = a.name === 'Frog';
        let ny, nx;
        if (isFish) {
            nx = 0.15 + sr(seed)*0.7; ny = RIVER_TOP+0.01+sr(seed+1)*(RIVER_H-0.02);
        } else if (isFrog) {
            nx = 0.25 + sr(seed)*0.5; ny = RIVER_BOT+0.005+sr(seed+1)*0.025;
        } else {
            nx = 0.06 + sr(seed)*0.88; ny = RIVER_BOT+0.04+sr(seed+1)*0.30;
        }
        return {
            ...a, nx, ny,
            size: a.name==='Ant'?14:a.name==='Bee'?16:a.name==='Spider'?14:a.name==='Locust'?16:26+sr(seed+2)*16,
            depth: isFish?0.18:isFrog?0.28:0.30+sr(seed+3)*0.25,
            idleOff: sr(seed+4)*Math.PI*2,
            idleSpd: 0.012+sr(seed+5)*0.02,
        };
    });
}

function prebuildFireflies() {
    const ff = [];
    for (let i = 0; i < 80; i++) {
        const seed = i * 83 + 7;
        ff.push({
            nx: 0.05+sr(seed)*0.9, ny: 0.18+sr(seed+1)*0.65,
            size: 1.5+sr(seed+2)*2.5,
            offX: sr(seed+3)*Math.PI*2, offY: sr(seed+4)*Math.PI*2,
            speedX: 0.006+sr(seed+5)*0.01, speedY: 0.005+sr(seed+6)*0.009,
            bright: 0.4+sr(seed+7)*0.6,
        });
    }
    return ff;
}

function prebuildMountains() {
    const layers = [];
    const configs = [
        { baseY:0.27, color1:'#b8cce0', color2:'#d0e4f0', count:11, maxH:0.085, seed:42, depth:0.02 },
        { baseY:0.32, color1:'#7a9a7a', color2:'#9ab89a', count:8,  maxH:0.10,  seed:73, depth:0.05 },
        { baseY:0.37, color1:'#3d6845', color2:'#527a58', count:6,  maxH:0.09,  seed:19, depth:0.08 },
    ];
    for (const cfg of configs) {
        const peaks = [];
        for (let i = 0; i < cfg.count; i++) {
            peaks.push({
                x: (i+0.5+(sr(cfg.seed+i*37)-0.5)*0.35) / cfg.count,
                h: cfg.maxH*(0.4+sr(cfg.seed+i*71)*0.6),
            });
        }
        layers.push({ ...cfg, peaks });
    }
    return layers;
}

function prebuildStones() {
    const stones = [];
    for (let i = 0; i < 18; i++) {
        const seed = i * 57 + 99;
        stones.push({
            nx: 0.05+sr(seed)*0.9,
            ny: RIVER_TOP+0.005+sr(seed+1)*(RIVER_H-0.01),
            rx: 5+sr(seed+2)*10, ry: 3+sr(seed+3)*5,
            rot: sr(seed+4)*Math.PI,
            shade: 0.32+sr(seed+5)*0.28,
            mossy: sr(seed+6) > 0.5,
        });
    }
    return stones;
}

// Extra wildflower clusters (dense, colorful patches like the reference)
function prebuildWildflowers() {
    const flowers = [];
    for (let i = 0; i < 600; i++) {
        const seed = i * 53 + 777;
        const isNear = sr(seed+10) > 0.35;
        flowers.push({
            nx: 0.01+sr(seed)*0.98,
            ny: isNear
                ? RIVER_BOT+0.01+sr(seed+1)*(0.88-RIVER_BOT)
                : 0.35+sr(seed+1)*(RIVER_TOP-0.36),
            color: FLOWER_COLORS[Math.floor(sr(seed+2)*FLOWER_COLORS.length)],
            size: 2+sr(seed+3)*4,
            depth: isNear ? 0.28+sr(seed+4)*0.38 : 0.15+sr(seed+4)*0.2,
            day: Math.floor(sr(seed+5)*364)+1,
            bank: isNear ? 'near' : 'far',
        });
    }
    return flowers;
}

// ═══════════════════════════════════════════════════════════════
// DRAW HELPERS
// ═══════════════════════════════════════════════════════════════
function toScreen(nx, ny, depth, W, H, camX, camY) {
    return [nx*W - camX*depth, ny*H - camY*depth];
}

// ── Sky: golden-hour atmosphere ──────────────────────────────
function drawSky(ctx, W, H, frame) {
    // Main sky gradient — warm golden hour
    const g = ctx.createLinearGradient(0, 0, 0, H*0.48);
    g.addColorStop(0,   '#4a7fc8');
    g.addColorStop(0.18,'#6fa3d8');
    g.addColorStop(0.42,'#a8cfe8');
    g.addColorStop(0.65,'#d4e8f5');
    g.addColorStop(0.82,'#ede8d0');
    g.addColorStop(1,   '#e8d5a0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H*0.48);

    // Horizon glow — warm sun near right side
    const sunX = W * 0.78;
    const sg = ctx.createRadialGradient(sunX, H*0.22, 0, sunX, H*0.22, H*0.45);
    sg.addColorStop(0,   'rgba(255,240,160,0.55)');
    sg.addColorStop(0.15,'rgba(255,210,100,0.30)');
    sg.addColorStop(0.4, 'rgba(255,180,60,0.12)');
    sg.addColorStop(1,   'rgba(255,160,40,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H*0.48);

    // Sun disc
    ctx.save();
    ctx.globalAlpha = 0.9;
    const sunG = ctx.createRadialGradient(sunX, H*0.18, 0, sunX, H*0.18, 28);
    sunG.addColorStop(0,   'rgba(255,255,220,1)');
    sunG.addColorStop(0.4, 'rgba(255,230,120,0.9)');
    sunG.addColorStop(1,   'rgba(255,200,80,0)');
    ctx.fillStyle = sunG;
    ctx.beginPath();
    ctx.arc(sunX, H*0.18, 28, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // God rays
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let r = 0; r < 7; r++) {
        const angle = -0.6 + r * 0.22 + Math.sin(frame*0.0008)*0.04;
        const len = H * 0.85;
        const rg = ctx.createLinearGradient(sunX, H*0.18, sunX + Math.cos(angle)*len, H*0.18 + Math.sin(angle)*len);
        rg.addColorStop(0,   `rgba(255,240,160,${0.04 + r*0.006})`);
        rg.addColorStop(0.5, `rgba(255,220,120,${0.02})`);
        rg.addColorStop(1,   'rgba(255,200,80,0)');
        const w = 18 + r*8;
        ctx.strokeStyle = rg;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(sunX, H*0.18);
        ctx.lineTo(sunX + Math.cos(angle)*len, H*0.18 + Math.sin(angle)*len);
        ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
}

// ── Clouds: soft wispy golden-hour clouds ───────────────────
function drawClouds(ctx, W, H, frame, camX) {
    const clouds = [
        { x:0.08, y:0.055, w:70, h:20, alpha:0.7 },
        { x:0.32, y:0.035, w:95, h:26, alpha:0.65 },
        { x:0.56, y:0.065, w:65, h:18, alpha:0.55 },
        { x:0.80, y:0.045, w:82, h:22, alpha:0.45 },
        { x:0.22, y:0.13,  w:50, h:14, alpha:0.5 },
        { x:0.68, y:0.11,  w:58, h:15, alpha:0.4 },
        { x:0.45, y:0.155, w:40, h:11, alpha:0.35 },
    ];
    ctx.save();
    for (const c of clouds) {
        const cx = c.x*W - camX*0.012 + Math.sin(frame*0.0007+c.x*18)*14;
        const cy = c.y*H;
        // Pink/golden tint on underside
        const cg = ctx.createLinearGradient(cx, cy-c.h, cx, cy+c.h*0.8);
        cg.addColorStop(0, `rgba(255,255,255,${c.alpha})`);
        cg.addColorStop(0.6,`rgba(255,248,230,${c.alpha*0.85})`);
        cg.addColorStop(1,  `rgba(240,210,170,${c.alpha*0.4})`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.ellipse(cx,       cy,        c.w,     c.h,    0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx-c.w*.42,cy+c.h*.35,c.w*.62,c.h*.9, 0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+c.w*.38,cy+c.h*.28,c.w*.55,c.h*.8, 0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx-c.w*.18,cy-c.h*.18,c.w*.45,c.h*.7, 0,0,Math.PI*2); ctx.fill();
    }
    // Birds (tiny V shapes)
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#3a5a80';
    ctx.lineWidth = 1.2;
    const birdSeeds = [11,23,37,52,67];
    for (const bs of birdSeeds) {
        const bx = ((sr(bs)*0.9+0.05)*W - camX*0.008 + frame*0.12*(sr(bs+1)>0.5?1:-1)*0.4) % (W+100);
        const by = sr(bs+1)*H*0.12 + H*0.03;
        const bw = 6+sr(bs+2)*5;
        ctx.beginPath();
        ctx.moveTo(bx-bw, by); ctx.lineTo(bx, by-3); ctx.lineTo(bx+bw, by);
        ctx.stroke();
    }
    ctx.restore();
}

// ── Mountains with atmospheric haze ─────────────────────────
function drawMountainLayer(ctx, W, H, layer, camX) {
    const baseY = layer.baseY * H;
    const pts = layer.peaks.map(p => ({
        x: p.x*W - camX*layer.depth,
        y: baseY - p.h*H,
    }));

    // Mountain fill
    const g = ctx.createLinearGradient(0, baseY-layer.maxH*H, 0, baseY+5);
    g.addColorStop(0, layer.color2);
    g.addColorStop(0.6, layer.color1);
    g.addColorStop(1, layer.color1);
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(-150, baseY+5);
    ctx.lineTo(pts[0].x-80, baseY);
    for (let i = 0; i < pts.length; i++) {
        const curr = pts[i];
        const next = pts[(i+1) % pts.length];
        const cpx = (curr.x+next.x)/2;
        const cpy = Math.min(curr.y,next.y) + Math.abs(curr.y-next.y)*0.25;
        ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
    }
    const last = pts[pts.length-1];
    ctx.lineTo(last.x+80, baseY);
    ctx.lineTo(W+150, baseY+5);
    ctx.lineTo(W+150, H); ctx.lineTo(-150, H);
    ctx.closePath();
    ctx.fill();

    // Snow caps on tallest peaks
    if (layer.depth < 0.04) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#e8f0f8';
        for (const pt of pts) {
            if (pt.y < baseY - layer.maxH*H*0.7) {
                ctx.beginPath();
                ctx.moveTo(pt.x, pt.y);
                ctx.lineTo(pt.x-12, pt.y+18);
                ctx.lineTo(pt.x+12, pt.y+18);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // Atmospheric haze overlay
    const haze = ctx.createLinearGradient(0, baseY-layer.maxH*H, 0, baseY);
    haze.addColorStop(0, 'rgba(200,220,240,0.0)');
    haze.addColorStop(1, 'rgba(200,220,240,0.18)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, baseY-layer.maxH*H-10, W, layer.maxH*H+15);
}

// ── Ground: rich multi-tone greens with depth ─────────────────
function drawGround(ctx, W, H) {
    // Far bank (above river) — lighter, more distant
    const farG = ctx.createLinearGradient(0, H*0.29, 0, H*RIVER_TOP);
    farG.addColorStop(0, '#5a8a52');
    farG.addColorStop(0.3,'#62924a');
    farG.addColorStop(0.7,'#6a9c50');
    farG.addColorStop(1,  '#72a855');
    ctx.fillStyle = farG;
    ctx.fillRect(0, H*0.29, W, H*(RIVER_TOP-0.29));

    // Near bank (below river) — richer, more saturated, darker at bottom
    const nearG = ctx.createLinearGradient(0, H*RIVER_BOT, 0, H);
    nearG.addColorStop(0,  '#62984a');
    nearG.addColorStop(0.2,'#558842');
    nearG.addColorStop(0.5,'#4a7838');
    nearG.addColorStop(0.75,'#3e6830');
    nearG.addColorStop(1,  '#2e5222');
    ctx.fillStyle = nearG;
    ctx.fillRect(0, H*RIVER_BOT, W, H*(1-RIVER_BOT));
}

// ── Ground texture: subtle color variation patches ───────────
function drawGroundPatches(ctx, W, H, camX, camY, yMin, yMax, seed, depth) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 40; i++) {
        const s = seed + i*61;
        const nx = sr(s)*1.0, ny = yMin + sr(s+1)*(yMax-yMin);
        const [x,y] = toScreen(nx, ny, depth, W, H, camX, camY);
        if (x < -50 || x > W+50) continue;
        const r = 15+sr(s+2)*35;
        const hue = 95+sr(s+3)*35;
        ctx.fillStyle = `hsl(${hue},55%,${28+sr(s+4)*14}%)`;
        ctx.beginPath();
        ctx.ellipse(x, y, r*1.8, r*0.7, sr(s+5)*Math.PI, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}

// ── Grass tufts: more detailed blades ───────────────────────
function drawGrassTufts(ctx, W, H, frame, camX, camY, yMin, yMax, count, seed) {
    ctx.save();
    for (let i = 0; i < count; i++) {
        const s = seed + i*31;
        const nx = 0.01+sr(s)*0.98;
        const ny = yMin+sr(s+1)*(yMax-yMin);
        const [x,y] = toScreen(nx, ny, 0.32, W, H, camX, camY);
        if (x < -25 || x > W+25) continue;
        const depth = 0.3+sr(s+8)*0.4;
        const h = (5+sr(s+2)*9)*depth;
        const sway = Math.sin(frame*0.018+s*0.1)*2.5;
        const hue = 100+sr(s+3)*40;
        const lit = 20+sr(s+4)*18;
        ctx.strokeStyle = `hsl(${hue},52%,${lit}%)`;
        ctx.lineWidth = 0.8+sr(s+5)*0.8;
        ctx.globalAlpha = 0.35+sr(s+6)*0.35;
        // Blade 1
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x+sway*0.5, y-h*0.55, x+sway, y-h);
        ctx.stroke();
        // Blade 2 offset
        ctx.beginPath();
        ctx.moveTo(x+2, y);
        ctx.quadraticCurveTo(x+2-sway*0.4, y-h*0.5, x+2-sway*0.8, y-h*0.88);
        ctx.stroke();
        // Blade 3 wide
        ctx.beginPath();
        ctx.moveTo(x-2, y);
        ctx.quadraticCurveTo(x-2+sway*0.3, y-h*0.45, x-2+sway*1.2, y-h*0.75);
        ctx.stroke();
    }
    ctx.restore();
}

// ── Wildflower meadow: dense colorful dots ───────────────────
function drawWildflowerMeadow(ctx, W, H, frame, camX, camY, flowers, streak) {
    ctx.save();
    for (const f of flowers) {
        if (streak < f.day) continue;
        const [x,y] = toScreen(f.nx, f.ny, f.depth, W, H, camX, camY);
        if (x < -8 || x > W+8) continue;
        const scale = f.depth;
        const sz = f.size * scale;
        const sway = Math.sin(frame*0.015+f.nx*20)*sz*0.3;
        ctx.globalAlpha = 0.75+sr(f.day)*0.25;

        // Petals (3-5 small circles around center)
        const petals = 3 + Math.floor(sr(f.day+1)*3);
        ctx.fillStyle = f.color;
        for (let p = 0; p < petals; p++) {
            const a = (p/petals)*Math.PI*2;
            const px = x+sway + Math.cos(a)*sz*0.45;
            const py = y + Math.sin(a)*sz*0.45;
            ctx.beginPath();
            ctx.arc(px, py, sz*0.32, 0, Math.PI*2);
            ctx.fill();
        }
        // Yellow center
        ctx.fillStyle = '#fde070';
        ctx.beginPath();
        ctx.arc(x+sway, y, sz*0.22, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}

// ── River: curved edges, shimmer, depth ─────────────────────
function drawRiver(ctx, W, H, frame, camX, camY, stones, streak) {
    const depth = 0.15;
    // Slight curve: near side bulges toward viewer
    const topOff  = Math.sin(camX*0.002)*8;
    const botOff  = Math.sin(camX*0.002+0.5)*10;
    const rTop = RIVER_TOP*H - camY*depth + topOff;
    const rBot = RIVER_BOT*H - camY*depth + botOff;
    const rH   = rBot - rTop;

    // ── Bank edges (transition from ground to water)
    // Far bank soft edge
    const farEdge = ctx.createLinearGradient(0, rTop-12, 0, rTop+6);
    farEdge.addColorStop(0, 'rgba(72,130,62,0)');
    farEdge.addColorStop(0.5,'rgba(72,130,62,0.25)');
    farEdge.addColorStop(1, 'rgba(30,80,50,0.0)');
    ctx.fillStyle = farEdge;
    ctx.fillRect(-10, rTop-12, W+20, 18);

    // ── Water body
    const wg = ctx.createLinearGradient(0, rTop, 0, rBot);
    wg.addColorStop(0,   '#4a9abf');
    wg.addColorStop(0.25,'#3a8ab5');
    wg.addColorStop(0.55,'#2878a8');
    wg.addColorStop(0.75,'#1e6898');
    wg.addColorStop(1,   '#2878a8');
    ctx.fillStyle = wg;
    ctx.fillRect(-15, rTop, W+30, rH);

    // ── Sky reflection in water
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#b8d8f0';
    ctx.fillRect(-15, rTop, W+30, rH*0.35);
    ctx.restore();

    // ── Subtle river bed color variation
    ctx.save();
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 5; i++) {
        const px = W*(0.1+i*0.2);
        const sg = ctx.createRadialGradient(px, rTop+rH*0.5, 0, px, rTop+rH*0.5, rH*0.9);
        sg.addColorStop(0, '#a0c0e0');
        sg.addColorStop(1, 'rgba(160,192,224,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(-15, rTop, W+30, rH);
    }
    ctx.restore();

    // ── Wave lines
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#c8e8f8';
    ctx.lineWidth = 1;
    for (let row = 0; row < 6; row++) {
        const wy = rTop + rH*(0.1+row*0.15);
        ctx.beginPath();
        for (let x = -15; x <= W+15; x += 3) {
            const wave = Math.sin(x*0.018+frame*0.032+row*1.8)*2.8
                       + Math.sin(x*0.035+frame*0.02+row)*1.2;
            x === -15 ? ctx.moveTo(x, wy+wave) : ctx.lineTo(x, wy+wave);
        }
        ctx.stroke();
    }
    ctx.restore();

    // ── Shimmer specular highlights
    ctx.save();
    for (let i = 0; i < 14; i++) {
        const sx = W*0.04 + i*W*0.07 + Math.sin(frame*0.022+i*1.9)*10;
        const sy = rTop + rH*(0.15+sr(i*17)*0.65);
        const pulse = 0.06+Math.sin(frame*0.05+i*0.7)*0.04;
        ctx.globalAlpha = pulse;
        const hg = ctx.createLinearGradient(sx-18, sy, sx+18, sy);
        hg.addColorStop(0,'rgba(255,255,255,0)');
        hg.addColorStop(0.5,'rgba(220,245,255,1)');
        hg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 16+sr(i*7)*10, 1.8, Math.sin(i)*0.3, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();

    // ── Stones
    for (const stone of stones) {
        const [sx, sy] = [stone.nx*W - camX*depth, stone.ny*H - camY*depth];
        if (sx < -25 || sx > W+25) continue;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(stone.rot);
        const shade = Math.floor((stone.shade)*220);
        // Stone shadow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#1a3a5a';
        ctx.beginPath();
        ctx.ellipse(2, stone.ry*0.5, stone.rx*0.9, stone.ry*0.55, 0, 0, Math.PI*2);
        ctx.fill();
        // Stone body
        ctx.globalAlpha = 1;
        const sg2 = ctx.createRadialGradient(-stone.rx*0.2, -stone.ry*0.2, 0, 0, 0, stone.rx);
        sg2.addColorStop(0,`rgb(${shade+30},${shade+28},${shade+22})`);
        sg2.addColorStop(0.6,`rgb(${shade},${shade-3},${shade-8})`);
        sg2.addColorStop(1,`rgb(${shade-20},${shade-22},${shade-25})`);
        ctx.fillStyle = sg2;
        ctx.beginPath();
        ctx.ellipse(0, 0, stone.rx, stone.ry, 0, 0, Math.PI*2);
        ctx.fill();
        // Moss tint
        if (stone.mossy) {
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = '#5a8a30';
            ctx.beginPath();
            ctx.ellipse(-stone.rx*0.1, -stone.ry*0.25, stone.rx*0.7, stone.ry*0.5, -0.3, 0, Math.PI*2);
            ctx.fill();
        }
        // Highlight
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#e8e8e0';
        ctx.beginPath();
        ctx.ellipse(-stone.rx*0.22, -stone.ry*0.28, stone.rx*0.32, stone.ry*0.22, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    // ── Near bank soft shadow under water edge
    const nearEdge = ctx.createLinearGradient(0, rBot-4, 0, rBot+14);
    nearEdge.addColorStop(0,'rgba(20,60,40,0.35)');
    nearEdge.addColorStop(1,'rgba(20,60,40,0)');
    ctx.fillStyle = nearEdge;
    ctx.fillRect(-15, rBot-4, W+30, 18);
}

// ── Trees: lush layered canopy with light ───────────────────
function drawTree(ctx, x, y, tree, frame, hasFruits) {
    const sway = Math.sin(frame*0.009 + tree.swayOff)*2.5;
    const tH = tree.trunkH;
    const tW = tree.trunkW;
    const cR = tree.canopyR;
    const lean = tree.lean || 0;

    // Root flare
    ctx.save();
    ctx.globalAlpha = 0.55;
    const rfg = ctx.createRadialGradient(x, y, 0, x, y, tW*1.8);
    rfg.addColorStop(0,'rgba(40,22,8,0.6)');
    rfg.addColorStop(1,'rgba(40,22,8,0)');
    ctx.fillStyle = rfg;
    ctx.beginPath();
    ctx.ellipse(x, y+2, tW*1.8, tW*0.7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Trunk — gradient bark
    const trunkG = ctx.createLinearGradient(x-tW*0.5, 0, x+tW*0.5, 0);
    trunkG.addColorStop(0,  '#3a2210');
    trunkG.addColorStop(0.3,'#6a4020');
    trunkG.addColorStop(0.55,'#7a5028');
    trunkG.addColorStop(0.75,'#6a4018');
    trunkG.addColorStop(1,  '#3a2210');
    ctx.fillStyle = trunkG;
    const tipX = x + sway + lean*tH;
    ctx.beginPath();
    ctx.moveTo(x - tW*0.55, y);
    ctx.bezierCurveTo(x-tW*0.4, y-tH*0.4, tipX-tW*0.3, y-tH*0.7, tipX-tW*0.28, y-tH);
    ctx.lineTo(tipX+tW*0.28, y-tH);
    ctx.bezierCurveTo(tipX+tW*0.3, y-tH*0.7, x+tW*0.4, y-tH*0.4, x+tW*0.55, y);
    ctx.closePath();
    ctx.fill();

    // Bark texture lines
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#2a1808';
    ctx.lineWidth = 0.7;
    for (let i = 1; i < 5; i++) {
        const ty = y - tH*(i/5);
        const tw2 = tW*(0.5-i*0.04);
        const lx = lerp(x, tipX, i/5);
        ctx.beginPath();
        ctx.moveTo(lx-tw2, ty);
        ctx.quadraticCurveTo(lx, ty-tH*0.04, lx+tw2, ty);
        ctx.stroke();
    }
    ctx.restore();

    // Canopy shadow cast on ground
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = '#001a00';
    ctx.beginPath();
    ctx.ellipse(tipX, y - tH*0.05, cR*1.3, cR*0.35, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Canopy — multiple layered circles for depth
    const cx = tipX;
    const cy = y - tH;
    const layers = [
        { dx:0,       dy:-cR*0.25, r:cR,      litMod: 0  },
        { dx:-cR*0.5, dy:0,        r:cR*0.78, litMod:-4  },
        { dx: cR*0.5, dy:0,        r:cR*0.75, litMod:-3  },
        { dx:-cR*0.18,dy:-cR*0.55, r:cR*0.65, litMod:+4  },
        { dx: cR*0.22,dy:-cR*0.45, r:cR*0.6,  litMod:+3  },
        { dx: cR*0.05,dy:-cR*0.72, r:cR*0.45, litMod:+6  },
    ];
    for (const l of layers) {
        const lit = tree.lit + l.litMod;
        const g = ctx.createRadialGradient(
            cx+l.dx, cy+l.dy-l.r*0.25, 0,
            cx+l.dx, cy+l.dy, l.r
        );
        g.addColorStop(0,   `hsl(${tree.hue},${tree.sat+6}%,${lit+10}%)`);
        g.addColorStop(0.35,`hsl(${tree.hue},${tree.sat+4}%,${lit+4}%)`);
        g.addColorStop(0.7, `hsl(${tree.hue},${tree.sat}%,${lit}%)`);
        g.addColorStop(1,   `hsl(${tree.hue-8},${tree.sat-6}%,${lit-7}%)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx+l.dx, cy+l.dy, l.r, 0, Math.PI*2);
        ctx.fill();
    }

    // Light dapple highlights
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#e8f8c0';
    for (let d = 0; d < 4; d++) {
        const da = tree.swayOff + d*2.1;
        const dr = cR*(0.25+d*0.12);
        ctx.beginPath();
        ctx.ellipse(cx+Math.cos(da)*dr, cy+Math.sin(da)*dr*0.6, 8+d*3, 5+d*2, da, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();

    // Fruits
    if (hasFruits) {
        for (let i = 0; i < tree.fruitCount; i++) {
            const fs = tree.plantedDay*3 + i*47;
            const a = (i/tree.fruitCount)*Math.PI*2 + sr(fs)*0.6;
            const dist = cR*(0.42+sr(fs+1)*0.38);
            const fx = cx + Math.cos(a)*dist;
            const fy = cy + Math.sin(a)*dist*0.65;
            const fsz = 3.5+sr(fs+2)*2.5;
            // Shadow
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(fx+1, fy+fsz*0.6, fsz*0.7, fsz*0.3, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
            // Fruit body
            const fg = ctx.createRadialGradient(fx-fsz*0.25, fy-fsz*0.25, 0, fx, fy, fsz);
            fg.addColorStop(0, `hsl(${tree.fruitHue+i*28},80%,65%)`);
            fg.addColorStop(0.6,`hsl(${tree.fruitHue+i*28},75%,50%)`);
            fg.addColorStop(1, `hsl(${tree.fruitHue+i*28-15},70%,35%)`);
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(fx, fy, fsz, 0, Math.PI*2);
            ctx.fill();
            // Specular
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(fx-fsz*0.28, fy-fsz*0.28, fsz*0.28, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ── Plants: stems with detailed flowers ─────────────────────
function drawPlant(ctx, x, y, plant, frame, hasFlower) {
    const sway = Math.sin(frame*plant.swaySpd + plant.swayOff)*3.5;
    const h = plant.stemH;

    // Stem with gradient
    const stemG = ctx.createLinearGradient(x, y, x+sway, y-h);
    stemG.addColorStop(0, '#2a6018');
    stemG.addColorStop(1, '#4a8a30');
    ctx.strokeStyle = stemG;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x+sway*0.45, y-h*0.5, x+sway, y-h);
    ctx.stroke();

    // Leaves
    const leafY = y - h*0.42;
    const leafX = x + sway*0.32;
    for (const [leanX, rot] of [[4,0.45],[-4,-0.5]]) {
        ctx.save();
        ctx.translate(leafX+leanX, leafY);
        ctx.rotate(rot + sway*0.025);
        const lg = ctx.createLinearGradient(-5, 0, 5, 0);
        lg.addColorStop(0,'#3a7a25');
        lg.addColorStop(0.5,'#50922e');
        lg.addColorStop(1,'#3a7a25');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.ellipse(leanX>0?3:-3, 0, 5, 2.2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    // Flower with glow
    if (hasFlower) {
        const fx = x + sway;
        const fy = y - h;
        const fs = plant.flowerSize;
        // Soft glow behind flower
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = plant.flowerColor;
        ctx.beginPath();
        ctx.arc(fx, fy, fs*1.6, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
        // Petals
        const petals = 5;
        ctx.fillStyle = plant.flowerColor;
        for (let i = 0; i < petals; i++) {
            const a = (i/petals)*Math.PI*2 - Math.PI/2;
            const px = fx + Math.cos(a)*fs*0.38;
            const py = fy + Math.sin(a)*fs*0.38;
            ctx.beginPath();
            ctx.arc(px, py, fs*0.3, 0, Math.PI*2);
            ctx.fill();
        }
        // Center
        const cg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fs*0.22);
        cg.addColorStop(0,'#fff5a0');
        cg.addColorStop(1,'#e8c000');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(fx, fy, fs*0.22, 0, Math.PI*2);
        ctx.fill();
    }
}

// ── Fish: enhanced with shimmer ─────────────────────────────
function drawFishShape(ctx, x, y, size, frame, seed) {
    const wobble = Math.sin(frame*0.04 + seed)*3.5;
    const dir = sr(seed+100) > 0.5 ? 1 : -1;
    ctx.save();
    ctx.translate(x+wobble, y);
    ctx.scale(dir, 1);
    // Tail
    ctx.fillStyle = '#c87820';
    ctx.beginPath();
    ctx.moveTo(-size*0.48, 0);
    ctx.lineTo(-size*0.88, -size*0.28);
    ctx.lineTo(-size*0.88,  size*0.28);
    ctx.closePath();
    ctx.fill();
    // Body gradient
    const bg = ctx.createRadialGradient(size*0.1, -size*0.08, 0, 0, 0, size*0.7);
    bg.addColorStop(0,  '#f8c060');
    bg.addColorStop(0.5,'#e8901a');
    bg.addColorStop(1,  '#c07010');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, size*0.6, size*0.28, 0, 0, Math.PI*2);
    ctx.fill();
    // Scales shimmer
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#ffd080';
    ctx.lineWidth = 0.6;
    for (let sc = 0; sc < 3; sc++) {
        ctx.beginPath();
        ctx.arc(-size*0.1+sc*size*0.18, 0, size*0.15, Math.PI*0.3, Math.PI*1.7);
        ctx.stroke();
    }
    ctx.restore();
    // Eye
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(size*0.27, -size*0.04, 1.8, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(size*0.26, -size*0.06, 0.6, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

// ── Bridge: wooden arched with proper shadows ────────────────
function drawBridge(ctx, W, H, frame, camX, camY) {
    const depth = 0.15;
    const bLeft  = 0.24*W - camX*depth;
    const bRight = 0.76*W - camX*depth;
    const bW     = bRight - bLeft;
    const rCenter = RIVER_Y*H - camY*depth;
    const archH   = 32;
    const deckThick = 9;
    const railH   = 22;
    const postCount = 12;
    const archY = (t) => rCenter - archH*4*t*(1-t);

    // ── Cast shadow on water
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#1a3a5a';
    ctx.beginPath();
    ctx.moveTo(bLeft, archY(0)+deckThick);
    for (let t = 0; t <= 1; t += 0.02) {
        ctx.lineTo(bLeft+t*bW, archY(t)+deckThick+12);
    }
    ctx.lineTo(bRight, archY(1)+deckThick);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Stone/concrete supports at ends
    ctx.fillStyle = '#9a8060';
    const pilW = 18, pilH = 30;
    for (const px of [bLeft-pilW*0.4, bRight-pilW*0.6]) {
        const pg = ctx.createLinearGradient(px, 0, px+pilW, 0);
        pg.addColorStop(0,   '#7a6040');
        pg.addColorStop(0.4, '#aa9068');
        pg.addColorStop(0.7, '#9a8058');
        pg.addColorStop(1,   '#7a6040');
        ctx.fillStyle = pg;
        ctx.fillRect(px, rCenter+deckThick, pilW, pilH);
    }

    // ── Vertical support posts (behind deck)
    ctx.strokeStyle = '#6a4a18';
    ctx.lineWidth = 3.5;
    for (let i = 1; i < postCount; i++) {
        const t = i/postCount;
        const ax = bLeft+t*bW;
        const ay = archY(t);
        ctx.beginPath();
        ctx.moveTo(ax, ay+deckThick*0.5);
        ctx.lineTo(ax, ay+deckThick+16);
        ctx.stroke();
    }

    // ── Deck
    ctx.beginPath();
    ctx.moveTo(bLeft-4, archY(0));
    for (let t = 0; t <= 1; t += 0.012) ctx.lineTo(bLeft+t*bW, archY(t));
    ctx.lineTo(bRight+4, archY(1));
    for (let t = 1; t >= 0; t -= 0.012) ctx.lineTo(bLeft+t*bW, archY(t)+deckThick);
    ctx.closePath();
    const dg = ctx.createLinearGradient(0, rCenter-archH-deckThick, 0, rCenter+deckThick);
    dg.addColorStop(0,   '#c8962a');
    dg.addColorStop(0.4, '#b08020');
    dg.addColorStop(0.7, '#9a7018');
    dg.addColorStop(1,   '#7a5810');
    ctx.fillStyle = dg;
    ctx.fill();

    // ── Deck edge highlight
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#e8b840';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.012) {
        const ax = bLeft+t*bW, ay = archY(t);
        t === 0 ? ctx.moveTo(ax,ay) : ctx.lineTo(ax,ay);
    }
    ctx.stroke();
    ctx.restore();

    // ── Plank lines
    ctx.strokeStyle = '#8a6012';
    ctx.lineWidth = 0.7;
    const plankN = 32;
    for (let i = 1; i < plankN; i++) {
        const t = i/plankN;
        const ax = bLeft+t*bW;
        ctx.beginPath();
        ctx.moveTo(ax, archY(t));
        ctx.lineTo(ax, archY(t)+deckThick);
        ctx.stroke();
    }

    // ── Railing posts
    ctx.strokeStyle = '#7a5018';
    ctx.lineWidth = 2.8;
    for (let i = 0; i <= postCount; i++) {
        const t = i/postCount;
        const ax = bLeft+t*bW;
        ctx.beginPath();
        ctx.moveTo(ax, archY(t));
        ctx.lineTo(ax, archY(t)-railH);
        ctx.stroke();
        // Post cap sphere
        ctx.fillStyle = '#9a6820';
        ctx.beginPath();
        ctx.arc(ax, archY(t)-railH, 2.5, 0, Math.PI*2);
        ctx.fill();
    }

    // ── Rails
    for (const frac of [1, 0.52]) {
        const rg = ctx.createLinearGradient(bLeft, 0, bRight, 0);
        rg.addColorStop(0,   '#7a5818');
        rg.addColorStop(0.3, '#a07828');
        rg.addColorStop(0.7, '#9a7020');
        rg.addColorStop(1,   '#7a5818');
        ctx.strokeStyle = rg;
        ctx.lineWidth = frac === 1 ? 3 : 1.8;
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.012) {
            const ax = bLeft+t*bW, ay = archY(t)-railH*frac;
            t === 0 ? ctx.moveTo(ax,ay) : ctx.lineTo(ax,ay);
        }
        ctx.stroke();
    }
}

// ── Fireflies: soft warm glow ────────────────────────────────
function drawFirefly(ctx, x, y, size, brightness, frame, offX, offY, spdX, spdY) {
    const fx = x + Math.sin(frame*spdX+offX)*18;
    const fy = y + Math.cos(frame*spdY+offY)*12;
    const pulse = 0.35 + Math.sin(frame*0.055+offX*2.8)*0.65;
    const alpha = brightness*pulse;
    if (alpha < 0.08) return;
    ctx.save();
    // Outer glow
    ctx.globalAlpha = alpha*0.18;
    const og = ctx.createRadialGradient(fx, fy, 0, fx, fy, size*7);
    og.addColorStop(0,'rgba(255,248,100,0.9)');
    og.addColorStop(1,'rgba(255,240,80,0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(fx, fy, size*7, 0, Math.PI*2);
    ctx.fill();
    // Core
    ctx.globalAlpha = alpha*0.85;
    ctx.shadowColor = 'rgba(255,248,100,0.9)';
    ctx.shadowBlur = size*4;
    ctx.fillStyle = '#fffcc0';
    ctx.beginPath();
    ctx.arc(fx, fy, size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

// ── Atmospheric haze over distance ──────────────────────────
function drawAtmosphericHaze(ctx, W, H) {
    // Mist near horizon
    const hg = ctx.createLinearGradient(0, H*0.28, 0, H*0.42);
    hg.addColorStop(0,   'rgba(200,220,240,0.0)');
    hg.addColorStop(0.4, 'rgba(190,215,238,0.12)');
    hg.addColorStop(0.8, 'rgba(185,210,235,0.22)');
    hg.addColorStop(1,   'rgba(180,208,232,0.0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, H*0.28, W, H*0.14);

    // Warm haze near sun side
    const wh = ctx.createLinearGradient(W*0.55, 0, W, H*0.5);
    wh.addColorStop(0,'rgba(255,230,160,0.06)');
    wh.addColorStop(1,'rgba(255,220,140,0)');
    ctx.fillStyle = wh;
    ctx.fillRect(0, 0, W, H*0.5);
}

// ── Vignette + color grade ───────────────────────────────────
function drawVignette(ctx, W, H) {
    // Soft vignette
    const vg = ctx.createRadialGradient(W*0.5, H*0.48, Math.min(W,H)*0.32, W*0.5, H*0.5, Math.max(W,H)*0.78);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(0.6,'rgba(0,0,0,0.04)');
    vg.addColorStop(1,'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Subtle warm color grade
    const cg = ctx.createLinearGradient(W*0.6, 0, W, H*0.4);
    cg.addColorStop(0,'rgba(255,200,100,0.04)');
    cg.addColorStop(1,'rgba(255,200,100,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);
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
        PLANTS:      prebuildPlants(),
        TREES:       prebuildTrees(),
        ANIMALS:     prebuildAnimals(),
        FIREFLIES:   prebuildFireflies(),
        MOUNTAINS:   prebuildMountains(),
        STONES:      prebuildStones(),
        WILDFLOWERS: prebuildWildflowerMeadow(),
        animId: null,
    });

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Body scroll lock + fade in
    useEffect(() => {
        const scrollY = window.scrollY;
        const body = document.body;
        const orig = { overflow:body.style.overflow, position:body.style.position, top:body.style.top, width:body.style.width };
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

    // Resize
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

    // Keyboard
    useEffect(() => {
        const down = (e) => {
            if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCloseRef.current?.(); return; }
            stateRef.current.keys[e.key] = true;
        };
        const up = (e) => { e.stopPropagation(); delete stateRef.current.keys[e.key]; };
        window.addEventListener('keydown', down, true);
        window.addEventListener('keyup', up, true);
        return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
    }, []);

    // Touch
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const MAX = 120;
        const ts = (e) => { e.stopPropagation(); const t=e.touches[0]; const s=stateRef.current; s.touch={a:true,sx:t.clientX,sy:t.clientY,scx:s.camX,scy:s.camY}; };
        const tm = (e) => { e.preventDefault(); e.stopPropagation(); const s=stateRef.current; if(!s.touch.a)return; const t=e.touches[0]; s.camX=clamp(s.touch.scx-(t.clientX-s.touch.sx)*0.4,-MAX,MAX); s.camY=clamp(s.touch.scy-(t.clientY-s.touch.sy)*0.4,-MAX,MAX); };
        const te = (e) => { e.stopPropagation(); stateRef.current.touch.a=false; };
        c.addEventListener('touchstart', ts, {passive:true});
        c.addEventListener('touchmove', tm, {passive:false});
        c.addEventListener('touchend', te, {passive:true});
        return () => { c.removeEventListener('touchstart',ts); c.removeEventListener('touchmove',tm); c.removeEventListener('touchend',te); };
    }, []);

    // Animation loop
    useEffect(() => {
        const MAX=120, SPD=2.6;
        const tick = () => {
            const c = canvasRef.current;
            if (!c) { stateRef.current.animId=requestAnimationFrame(tick); return; }
            const ctx = c.getContext('2d');
            const s = stateRef.current;
            const {W, H, keys} = s;
            if (!W||!H) { s.animId=requestAnimationFrame(tick); return; }

            // Camera
            if (keys['ArrowLeft'])  s.camX = clamp(s.camX-SPD,-MAX,MAX);
            if (keys['ArrowRight']) s.camX = clamp(s.camX+SPD,-MAX,MAX);
            if (keys['ArrowUp'])    s.camY = clamp(s.camY-SPD,-MAX,MAX);
            if (keys['ArrowDown'])  s.camY = clamp(s.camY+SPD,-MAX,MAX);
            if (!keys['ArrowLeft']&&!keys['ArrowRight']) s.camX *= 0.96;
            if (!keys['ArrowUp']&&!keys['ArrowDown'])    s.camY *= 0.96;

            s.frame++;
            const frame = s.frame;
            const {camX, camY} = s;

            // 1. SKY + CLOUDS
            drawSky(ctx, W, H, frame);
            drawClouds(ctx, W, H, frame, camX);

            // 2. MOUNTAINS
            for (const ml of s.MOUNTAINS) drawMountainLayer(ctx, W, H, ml, camX);

            // 3. ATMOSPHERIC HAZE
            drawAtmosphericHaze(ctx, W, H);

            // 4. GROUND
            drawGround(ctx, W, H);
            drawGroundPatches(ctx, W, H, camX, camY, 0.34, RIVER_TOP-0.01, 300, 0.2);
            drawGroundPatches(ctx, W, H, camX, camY, RIVER_BOT+0.02, 0.92, 800, 0.32);

            // 5. Grass tufts — far
            drawGrassTufts(ctx, W, H, frame, camX, camY, 0.33, RIVER_TOP-0.005, 100, 500);
            // Grass tufts — near
            drawGrassTufts(ctx, W, H, frame, camX, camY, RIVER_BOT+0.015, 0.93, 150, 800);

            // 6. FAR TREES
            const treeCount = Math.min(Math.floor(streak/7), 52);
            for (let i = 0; i < treeCount; i++) {
                const tree = s.TREES[i];
                if (tree.bank !== 'far') continue;
                const [x,y] = toScreen(tree.nx, tree.ny, tree.depth, W, H, camX, camY);
                if (x < -100||x > W+100) continue;
                drawTree(ctx, x, y, tree, frame, streak >= tree.plantedDay+7);
            }

            // 7. FAR PLANTS + WILDFLOWERS
            const plantCount = Math.min(streak, 365);
            for (let i = 0; i < plantCount; i++) {
                const p = s.PLANTS[i];
                if (p.bank !== 'far') continue;
                const [x,y] = toScreen(p.nx, p.ny, p.depth, W, H, camX, camY);
                if (x<-18||x>W+18) continue;
                drawPlant(ctx, x, y, p, frame, streak >= p.day+1);
            }
            drawWildflowerMeadow(ctx, W, H, frame, camX, camY, s.WILDFLOWERS.filter(f=>f.bank==='far'), streak);

            // 8. RIVER (180+)
            const showRiver = streak >= 180;
            if (showRiver) {
                drawRiver(ctx, W, H, frame, camX, camY, s.STONES, streak);
                // Fish (187+)
                if (streak >= 187) {
                    const fish = s.ANIMALS.find(a=>a.name==='Fish');
                    if (fish) {
                        for (let fi = 0; fi < 6; fi++) {
                            const fs = fish.day*7+fi*43;
                            const fnx = fish.nx + (sr(fs)-0.5)*0.55;
                            const fny = fish.ny + (sr(fs+1)-0.5)*0.032;
                            const [fsx,fsy] = toScreen(fnx, fny, fish.depth, W, H, camX, camY);
                            if (fsx>-25&&fsx<W+25) drawFishShape(ctx, fsx, fsy, 8+sr(fs+2)*5, frame, fs);
                        }
                    }
                }
                // Bridge (360+)
                if (streak >= 360) drawBridge(ctx, W, H, frame, camX, camY);
            }

            // 9. NEAR TREES
            for (let i = 0; i < treeCount; i++) {
                const tree = s.TREES[i];
                if (tree.bank !== 'near') continue;
                const [x,y] = toScreen(tree.nx, tree.ny, tree.depth, W, H, camX, camY);
                if (x<-100||x>W+100) continue;
                drawTree(ctx, x, y, tree, frame, streak >= tree.plantedDay+7);
            }

            // 10. NEAR PLANTS + WILDFLOWERS
            for (let i = 0; i < plantCount; i++) {
                const p = s.PLANTS[i];
                if (p.bank !== 'near') continue;
                const [x,y] = toScreen(p.nx, p.ny, p.depth, W, H, camX, camY);
                if (x<-18||x>W+18) continue;
                drawPlant(ctx, x, y, p, frame, streak >= p.day+1);
            }
            drawWildflowerMeadow(ctx, W, H, frame, camX, camY, s.WILDFLOWERS.filter(f=>f.bank==='near'), streak);

            // 11. LAND ANIMALS (emoji with shadow)
            for (const animal of s.ANIMALS) {
                if (animal.name==='Fish'||animal.name==='Frog') continue;
                if (streak < animal.day) continue;
                const [ax,ay] = toScreen(animal.nx, animal.ny, animal.depth, W, H, camX, camY);
                if (ax<-50||ax>W+50) continue;
                const bob = Math.sin(frame*animal.idleSpd+animal.idleOff)*2.5;
                const sz = animal.size;
                ctx.save();
                // Shadow
                ctx.globalAlpha = 0.22;
                ctx.fillStyle = '#001500';
                ctx.beginPath();
                ctx.ellipse(ax, ay+sz*0.45, sz*0.38, sz*0.12, 0, 0, Math.PI*2);
                ctx.fill();
                // Emoji
                ctx.globalAlpha = 1;
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 6;
                ctx.font = `${sz}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(animal.emoji, ax, ay+bob);
                ctx.restore();
            }

            // Frog (194+)
            if (streak >= 194) {
                const frog = s.ANIMALS.find(a=>a.name==='Frog');
                if (frog) {
                    const [fx,fy] = toScreen(frog.nx, frog.ny, frog.depth, W, H, camX, camY);
                    const hop = Math.abs(Math.sin(frame*0.028+frog.idleOff))*5;
                    ctx.save();
                    ctx.shadowColor = 'rgba(0,0,0,0.25)';
                    ctx.shadowBlur = 5;
                    ctx.font = `${frog.size}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(frog.emoji, fx, fy-hop);
                    ctx.restore();
                }
            }

            // 12. FIREFLIES
            const ffCount = Math.min(streak, 80);
            for (let i = 0; i < ffCount; i++) {
                const ff = s.FIREFLIES[i];
                const [fx,fy] = toScreen(ff.nx, ff.ny, 0.22, W, H, camX, camY);
                if (fx<-25||fx>W+25) continue;
                drawFirefly(ctx, fx, fy, ff.size, ff.bright, frame, ff.offX, ff.offY, ff.speedX, ff.speedY);
            }

            // 13. FOREGROUND GRASS BLADES (close, large, dark)
            ctx.save();
            for (let i = 0; i < 40; i++) {
                const gs = i*47+2000;
                const gx = sr(gs)*W;
                const gy = H - 4 - sr(gs+1)*12;
                const gh = 18+sr(gs+2)*32;
                const gsway = Math.sin(frame*0.016+gs*0.08)*5;
                const hue = 105+sr(gs+3)*35;
                const lit = 16+sr(gs+4)*14;
                ctx.strokeStyle = `hsl(${hue},52%,${lit}%)`;
                ctx.lineWidth = 2.2+sr(gs+5)*1.2;
                ctx.globalAlpha = 0.55+sr(gs+6)*0.3;
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.quadraticCurveTo(gx+gsway, gy-gh*0.55, gx+gsway*1.6, gy-gh);
                ctx.stroke();
            }
            ctx.restore();

            // 14. VIGNETTE + COLOR GRADE
            drawVignette(ctx, W, H);

            s.animId = requestAnimationFrame(tick);
        };
        stateRef.current.animId = requestAnimationFrame(tick);
        return () => { if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId); };
    }, []);

    // HUD data
    const hud = useMemo(() => {
        const nP  = Math.min(streak, 365);
        const nFl = Math.min(Math.max(streak-1,0), 364);
        const nT  = Math.min(Math.floor(streak/7), 52);
        const nFr = Math.min(Math.floor((streak-14)/7), 51);
        const nA  = ANIMAL_DEFS.filter(a=>streak>=a.day).length;
        let cur = MILESTONES[0];
        for (const m of MILESTONES) if (streak>=m.d) cur = m;
        const nxt = MILESTONES.find(m=>streak<m.d);
        return { nP, nFl, nT, nFr:Math.max(0,nFr), nA,
            river: streak>=180, fish: streak>=187, frogs: streak>=194, bridge: streak>=360, cur, nxt };
    }, [streak]);

    const counters = [
        [hud.nP,  'Plants'],
        [hud.nFl, 'Flowers'],
        [hud.nT,  'Trees'],
        [hud.nFr, 'Fruiting'],
        [hud.nA,  'Animals'],
        [hud.river  ? 'Yes':'—', 'River'],
        [hud.fish   ? 'Yes':'—', 'Fish'],
        [hud.frogs  ? 'Yes':'—', 'Frogs'],
        [hud.bridge ? 'Yes':'—', 'Bridge'],
    ];

    return (
        <div
            style={{
                position:'fixed', inset:0, zIndex:99999,
                background:'#2d5a22', overflow:'hidden', pointerEvents:'all',
                opacity: visible ? 1 : 0,
                transition:'opacity 0.8s ease-out',
            }}
            onClick={e=>e.stopPropagation()}
            onMouseDown={e=>e.stopPropagation()}
            onWheel={e=>e.stopPropagation()}
        >
            <canvas
                ref={canvasRef}
                style={{ display:'block', position:'fixed', top:0, left:0, width:'100vw', height:'100vh' }}
            />

            {/* Top bar — glassmorphism matching reference */}
            <div style={{
                position:'fixed', top:0, left:0, right:0, zIndex:20,
                padding:'14px 22px',
                background:'linear-gradient(180deg,rgba(0,0,0,0.52) 0%,rgba(0,0,0,0.18) 70%,transparent 100%)',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                pointerEvents:'none',
            }}>
                {/* Day counter */}
                <div style={{
                    display:'flex', alignItems:'center', gap:10,
                    background:'rgba(0,0,0,0.28)',
                    backdropFilter:'blur(8px)',
                    borderRadius:12,
                    padding:'6px 14px',
                    border:'1px solid rgba(180,230,140,0.18)',
                }}>
                    <span style={{
                        fontSize:20, fontWeight:700, color:'#fff',
                        letterSpacing:'.05em',
                        textShadow:'0 0 20px rgba(140,220,80,0.7)',
                        fontFamily:'Georgia, serif',
                    }}>
                        {streak} Days
                    </span>
                    <span style={{fontSize:18}}>🌿</span>
                </div>

                {/* Stats row */}
                <div style={{
                    display:'flex', gap:12, flexWrap:'wrap',
                    background:'rgba(0,0,0,0.28)',
                    backdropFilter:'blur(8px)',
                    borderRadius:12,
                    padding:'6px 16px',
                    border:'1px solid rgba(180,230,140,0.15)',
                }}>
                    {counters.map(([val, label]) => (
                        <div key={label} style={{ textAlign:'center', minWidth:32 }}>
                            <div style={{
                                fontSize:13, fontWeight:700,
                                color: (val==='Yes') ? '#7ddf4a' : '#fff',
                                textShadow: (val==='Yes') ? '0 0 10px rgba(120,220,60,0.9)' : 'none',
                                fontFamily:'Georgia, serif',
                            }}>
                                {val}
                            </div>
                            <div style={{
                                fontSize:9, color:'rgba(170,215,140,0.75)',
                                letterSpacing:'.09em', textTransform:'uppercase',
                                fontFamily:'system-ui, sans-serif',
                            }}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Close */}
                <button
                    onClick={e=>{ e.stopPropagation(); onClose(); }}
                    style={{
                        pointerEvents:'all', cursor:'pointer',
                        background:'rgba(0,0,0,0.38)',
                        border:'1px solid rgba(180,230,140,0.28)',
                        borderRadius:10, padding:'7px 16px',
                        color:'rgba(200,235,170,0.9)', fontSize:13,
                        backdropFilter:'blur(8px)',
                        fontFamily:'Georgia, serif',
                        transition:'all 0.2s',
                    }}
                >
                    ✕ Close
                </button>
            </div>

            {/* Bottom HUD */}
            <div style={{
                position:'fixed', bottom:0, left:0, right:0, zIndex:20,
                padding:'16px 24px',
                background:'linear-gradient(0deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.15) 70%,transparent 100%)',
                display:'flex', justifyContent:'space-between', alignItems:'flex-end',
                pointerEvents:'none',
            }}>
                <div style={{
                    background:'rgba(0,0,0,0.25)',
                    backdropFilter:'blur(8px)',
                    borderRadius:12,
                    padding:'10px 16px',
                    border:'1px solid rgba(180,230,140,0.14)',
                }}>
                    <div style={{
                        fontSize:13, color:'rgba(160,210,120,0.9)',
                        fontFamily:'Georgia, serif', marginBottom:4,
                    }}>
                        {hud.cur.e} <strong style={{color:'#c8f080'}}>{hud.cur.l}</strong>
                    </div>
                    <div style={{
                        fontSize:11, color:'rgba(140,185,100,0.65)',
                        fontFamily:'Georgia, serif',
                    }}>
                        {hud.nxt
                            ? `${hud.nxt.e} ${hud.nxt.l} in ${hud.nxt.d - streak} day${(hud.nxt.d-streak)!==1?'s':''}`
                            : '🌿 Full Ancient Grove — 365 plants, 52 trees, 12 animals, river & bridge'
                        }
                    </div>
                </div>
                <div style={{
                    textAlign:'right', fontSize:11,
                    color:'rgba(160,200,120,0.5)',
                    fontStyle:'italic', lineHeight:1.8,
                    fontFamily:'Georgia, serif',
                }}>
                    Arrow keys · explore the grove<br/>
                    Esc to close
                </div>
            </div>
        </div>
    );
};

// Helper used in prebuildWildflowerMeadow (same scope)
function prebuildWildflowerMeadow() {
    return prebuildWildflowers();
}

Forest.isCanvasScene = true;
export default Forest;