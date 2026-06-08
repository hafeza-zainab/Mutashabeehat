import React, { useRef, useEffect, useMemo, useState } from 'react';

const MILESTONES = [
  { d: 0,   e: '⚓', l: 'Deckhand' },
  { d: 7,   e: '⛵', l: 'Small Sail' },
  { d: 14,  e: '🏮', l: 'Lantern' },
  { d: 21,  e: '🏗️', l: 'Dock' },
  { d: 30,  e: '⛵', l: 'Sailor' },
  { d: 60,  e: '🚢', l: 'Voyager' },
  { d: 90,  e: '⛵', l: 'Navigator' },
  { d: 120, e: '💨', l: 'Explorer' },
  { d: 150, e: '🚢', l: 'Commander' },
  { d: 180, e: '👑', l: 'Captain' },
  { d: 252, e: '⛵', l: 'Admiral' },
  { d: 337, e: '⛵', l: 'Legend' },
  { d: 365, e: '🌊', l: 'Master of the Ocean' },
];
function getRank(s){let c=MILESTONES[0];for(const m of MILESTONES)if(s>=m.d)c=m;return c;}
function getNext(s){return MILESTONES.find(m=>s<m.d)||null;}
function getPrevDay(s){let p=0;for(const m of MILESTONES){if(m.d<=s)p=m.d;else break;}return p;}
function getDailyRewards(d){return{pearls:Math.floor(10+d*0.302),coins:Math.floor(6+d*0.203)};}
function calcTotals(day){let p=0,c=0,s=0;for(let i=1;i<=day;i++){const r=getDailyRewards(i);p+=r.pearls;c+=r.coins;}for(const m of MILESTONES)if(m.d>0&&m.d<=day)s+=m.l.includes('Master')?25:5;return{pearls:p,coins:c,stars:s};}
function loadState(){try{const s=localStorage.getItem('ocean_v6');return s?JSON.parse(s):null;}catch{return null;}}
function saveState(st){try{localStorage.setItem('ocean_v6',JSON.stringify(st));}catch{}}

// ── Scene dimensions (internal, scaled to screen)
const CW = 1280, CH = 720;
const HY = CH * 0.50; // horizon line — exactly half

// ─────────────────────────────────────────────
// PALM TREE
// ─────────────────────────────────────────────
function drawPalm(ctx, x, gy, h, lean, ls) {
  ctx.save();
  const cpx = x + lean*h*0.4, cpy = gy - h*0.55;
  const tx  = x + lean*h*0.5, ty  = gy - h;
  const tg  = ctx.createLinearGradient(x,gy,tx,ty);
  tg.addColorStop(0,'#5D4037'); tg.addColorStop(1,'#8D6E63');
  ctx.strokeStyle=tg; ctx.lineWidth=ls*0.22; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x,gy); ctx.quadraticCurveTo(cpx,cpy,tx,ty); ctx.stroke();
  const fronds=[
    [0,-1.0,0.0],[0.88,-0.5,0.38],[-0.88,-0.46,-0.33],
    [0.62,-0.88,0.82],[-0.68,-0.82,-0.78],
    [0.18,-0.52,1.32],[-0.20,-0.50,-1.22],
  ];
  fronds.forEach(([ox,oy,rot])=>{
    ctx.save();
    ctx.translate(tx+ox*ls*0.28, ty+oy*ls*0.24);
    ctx.rotate(rot);
    const ll=ls*1.08;
    const lg=ctx.createLinearGradient(0,0,ll*0.5,-ll);
    lg.addColorStop(0,'#2E7D32'); lg.addColorStop(0.55,'#43A047'); lg.addColorStop(1,'#A5D6A7');
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.bezierCurveTo(ll*0.18,-ll*0.36, ll*0.50,-ll*0.84, ll*0.60,-ll);
    ctx.bezierCurveTo(ll*0.68,-ll*0.76, ll*0.35,-ll*0.28, 0,0);
    ctx.fillStyle=lg; ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

// ─────────────────────────────────────────────
// SKY  — deep vivid blue, warm near horizon
// ─────────────────────────────────────────────
function drawSky(ctx) {
  // Main sky
  const g = ctx.createLinearGradient(0,0,0,HY);
  g.addColorStop(0.00,'#0D47A1');
  g.addColorStop(0.20,'#1565C0');
  g.addColorStop(0.45,'#1E88E5');
  g.addColorStop(0.68,'#42A5F5');
  g.addColorStop(0.82,'#B3D9F7');
  g.addColorStop(0.92,'#FFD59E');
  g.addColorStop(1.00,'#FFB347');
  ctx.fillStyle=g; ctx.fillRect(0,0,CW,HY);
}

// ─────────────────────────────────────────────
// SUN  — bright disk on horizon with glow
// ─────────────────────────────────────────────
function drawSun(ctx) {
  const sx=CW*0.62, sy=HY;

  // Atmospheric haze / glow spread across horizon
  const hazeG = ctx.createLinearGradient(0, HY-140, 0, HY+80);
  hazeG.addColorStop(0,'rgba(255,200,80,0)');
  hazeG.addColorStop(0.5,'rgba(255,180,60,0.18)');
  hazeG.addColorStop(1,'rgba(255,140,20,0.35)');
  ctx.fillStyle=hazeG; ctx.fillRect(0, HY-140, CW, 220);

  // Radial glow rings
  [[300,0.08],[200,0.14],[130,0.22],[88,0.35]].forEach(([r,a])=>{
    const rg=ctx.createRadialGradient(sx,sy,r*0.2,sx,sy,r);
    rg.addColorStop(0,`rgba(255,230,80,${a})`);
    rg.addColorStop(1,'rgba(255,160,0,0)');
    ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.fillStyle=rg; ctx.fill();
  });

  // Sun disk — sits on horizon so bottom half hidden by water
  const disk=ctx.createRadialGradient(sx,sy-6,2,sx,sy,48);
  disk.addColorStop(0,'#FFFFFF');
  disk.addColorStop(0.15,'#FFFDE7');
  disk.addColorStop(0.50,'#FFF176');
  disk.addColorStop(0.82,'#FFD740');
  disk.addColorStop(1,'rgba(255,193,7,0)');
  ctx.beginPath(); ctx.arc(sx,sy,48,Math.PI,0); // semicircle above horizon
  ctx.fillStyle=disk; ctx.fill();

  // Bright core
  const core=ctx.createRadialGradient(sx,sy-4,0,sx,sy,16);
  core.addColorStop(0,'#FFFFFF');
  core.addColorStop(1,'rgba(255,255,240,0)');
  ctx.beginPath(); ctx.arc(sx,sy,16,Math.PI,0);
  ctx.fillStyle=core; ctx.fill();
}

// ─────────────────────────────────────────────
// CLOUDS  — reference has distinct layered puffs
// white in upper sky, golden near horizon
// ─────────────────────────────────────────────
function drawCloud(ctx, cx, cy, scale, alpha, warm) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Each "bubble" drawn as a radial-gradient ellipse
  const bubbles = [
    // [ox, oy, rx, ry]
    [  0,   0, 70, 48],
    [-55,  14, 55, 40],
    [ 55,  12, 58, 42],
    [-28, -20, 48, 36],
    [ 32, -18, 50, 38],
    [-85,  24, 42, 30],
    [ 85,  22, 44, 32],
    [-48,  28, 46, 30],
    [ 50,  26, 48, 32],
    [  0,  30, 60, 32],
  ];

  bubbles.forEach(([ox,oy,rx,ry]) => {
    ctx.save();
    ctx.translate(cx + ox*scale, cy + oy*scale);
    ctx.scale(scale, scale);
    const g = ctx.createRadialGradient(-rx*0.2,-ry*0.3,0,0,0,Math.max(rx,ry));
    if (warm) {
      g.addColorStop(0,'rgba(255,248,220,1)');
      g.addColorStop(0.45,'rgba(255,235,160,0.9)');
      g.addColorStop(0.80,'rgba(255,210,100,0.55)');
      g.addColorStop(1,'rgba(255,190,60,0)');
    } else {
      g.addColorStop(0,'rgba(255,255,255,1)');
      g.addColorStop(0.42,'rgba(240,248,255,0.92)');
      g.addColorStop(0.80,'rgba(210,235,255,0.55)');
      g.addColorStop(1,'rgba(180,215,255,0)');
    }
    ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=g; ctx.fill();
    ctx.restore();
  });

  // Soft shadow underside
  ctx.save();
  ctx.translate(cx, cy);
  const sh = ctx.createLinearGradient(0, 0, 0, 55*scale);
  sh.addColorStop(0,'rgba(120,150,200,0)');
  sh.addColorStop(1,warm?'rgba(200,155,60,0.18)':'rgba(150,180,220,0.20)');
  ctx.beginPath(); ctx.ellipse(0, 38*scale, 90*scale, 22*scale, 0, 0, Math.PI*2);
  ctx.fillStyle=sh; ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawClouds(ctx, off) {
  // Upper sky — pure white clouds
  drawCloud(ctx, 210+off*0.08, HY*0.30, 0.70, 0.85, false);
  drawCloud(ctx, 530+off*0.05, HY*0.22, 0.58, 0.75, false);
  drawCloud(ctx, 760+off*0.06, HY*0.28, 0.62, 0.78, false);
  drawCloud(ctx, 1010+off*0.07,HY*0.25, 0.55, 0.70, false);

  // Mid sky — slightly warm tint
  drawCloud(ctx, 330+off*0.12, HY*0.50, 0.82, 0.82, false);
  drawCloud(ctx, 680+off*0.09, HY*0.48, 0.72, 0.78, false);
  drawCloud(ctx, 980+off*0.10, HY*0.52, 0.78, 0.80, false);

  // Near horizon — warm golden clouds
  drawCloud(ctx, 120+off*0.18, HY*0.72, 1.10, 0.92, true);
  drawCloud(ctx, 430+off*0.14, HY*0.68, 0.95, 0.87, true);
  drawCloud(ctx, 850+off*0.16, HY*0.70, 1.05, 0.90, true);
  drawCloud(ctx, 1130+off*0.13,HY*0.74, 0.88, 0.84, true);
}

// ─────────────────────────────────────────────
// OCEAN  — vivid blue-green, sun reflection
// ─────────────────────────────────────────────
function drawOcean(ctx, wp) {
  // Base ocean
  const og=ctx.createLinearGradient(0,HY,0,CH);
  og.addColorStop(0.00,'#0288D1');
  og.addColorStop(0.12,'#039BE5');
  og.addColorStop(0.30,'#26C6DA');
  og.addColorStop(0.55,'#00ACC1');
  og.addColorStop(0.80,'#00838F');
  og.addColorStop(1.00,'#006064');
  ctx.fillStyle=og; ctx.fillRect(0,HY,CW,CH-HY);

  // Turquoise shallow near left island
  const tl=ctx.createRadialGradient(200,HY+50,0,200,HY+90,220);
  tl.addColorStop(0,'rgba(0,230,200,0.42)');
  tl.addColorStop(0.6,'rgba(0,200,210,0.18)');
  tl.addColorStop(1,'rgba(0,170,200,0)');
  ctx.fillStyle=tl; ctx.fillRect(0,HY,460,CH-HY);

  // Turquoise shallow near right island
  const tr=ctx.createRadialGradient(CW-150,HY+60,0,CW-150,HY+100,200);
  tr.addColorStop(0,'rgba(0,230,200,0.40)');
  tr.addColorStop(0.6,'rgba(0,200,210,0.16)');
  tr.addColorStop(1,'rgba(0,170,200,0)');
  ctx.fillStyle=tr; ctx.fillRect(CW-380,HY,380,CH-HY);

  // Sun reflection column
  const sx=CW*0.62;
  const ref=ctx.createLinearGradient(sx-220,HY,sx+220,HY);
  ref.addColorStop(0,'rgba(255,220,80,0)');
  ref.addColorStop(0.35,'rgba(255,210,60,0.20)');
  ref.addColorStop(0.5,'rgba(255,240,100,0.45)');
  ref.addColorStop(0.65,'rgba(255,210,60,0.20)');
  ref.addColorStop(1,'rgba(255,220,80,0)');
  ctx.fillStyle=ref; ctx.fillRect(sx-220,HY,440,CH-HY);

  // Wave rows
  const rows=[
    {y:HY+6,  amp:1.0,f:0.020,sp:1.1,al:0.52,lw:2.0},
    {y:HY+18, amp:1.4,f:0.017,sp:0.9,al:0.46,lw:1.8},
    {y:HY+33, amp:1.8,f:0.015,sp:1.2,al:0.40,lw:1.7},
    {y:HY+52, amp:2.3,f:0.013,sp:0.8,al:0.36,lw:1.6},
    {y:HY+75, amp:2.8,f:0.011,sp:1.0,al:0.32,lw:1.5},
    {y:HY+103,amp:3.5,f:0.009,sp:0.7,al:0.28,lw:1.4},
    {y:HY+136,amp:4.2,f:0.008,sp:0.9,al:0.24,lw:1.3},
    {y:HY+174,amp:5.0,f:0.007,sp:0.6,al:0.20,lw:1.3},
    {y:HY+218,amp:5.8,f:0.006,sp:0.8,al:0.16,lw:1.2},
    {y:HY+268,amp:6.8,f:0.005,sp:0.5,al:0.13,lw:1.2},
  ];
  rows.forEach(r=>{
    ctx.beginPath();
    ctx.strokeStyle=`rgba(100,230,255,${r.al})`;
    ctx.lineWidth=r.lw;
    for(let x=0;x<=CW;x+=3){
      const y=r.y+Math.sin(x*r.f+wp*r.sp)*r.amp+Math.sin(x*r.f*1.7+wp*r.sp*0.6)*r.amp*0.35;
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.stroke();
  });

  // Sparkle glints
  const glints=[
    {x:640,y:HY+10},{x:672,y:HY+6},{x:700,y:HY+16},{x:728,y:HY+8},
    {x:655,y:HY+28},{x:690,y:HY+36},{x:720,y:HY+24},{x:748,y:HY+32},
    {x:620,y:HY+48},{x:665,y:HY+55},{x:705,y:HY+44},{x:745,y:HY+52},
    {x:600,y:HY+72},{x:650,y:HY+78},{x:700,y:HY+68},{x:755,y:HY+76},
    {x:810,y:HY+32},{x:830,y:HY+52},{x:580,y:HY+38},
  ];
  glints.forEach((g,i)=>{
    const a=(Math.sin(wp*1.9+i*1.2)+1)*0.5;
    const r2=2.2+a*2.2;
    ctx.beginPath(); ctx.arc(g.x,g.y,r2,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,180,${a*0.88})`; ctx.fill();
    if(a>0.65){
      ctx.save(); ctx.strokeStyle=`rgba(255,255,160,${a*0.55})`; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.moveTo(g.x-7,g.y); ctx.lineTo(g.x+7,g.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.x,g.y-7); ctx.lineTo(g.x,g.y+7); ctx.stroke();
      ctx.restore();
    }
  });
}

// ─────────────────────────────────────────────
// LEFT ISLAND — lush tropical island + lighthouse
// ─────────────────────────────────────────────
function drawLeftIsland(ctx, T) {
  ctx.save();

  // Rocky cliff base (back-left)
  ctx.beginPath();
  ctx.moveTo(-10,HY+60);
  ctx.lineTo(5,HY+10);
  ctx.lineTo(22,HY-22);
  ctx.lineTo(45,HY-58);
  ctx.lineTo(68,HY-85);
  ctx.lineTo(88,HY-92);
  ctx.lineTo(98,HY-70);
  ctx.lineTo(88,HY-38);
  ctx.lineTo(75,HY-12);
  ctx.lineTo(65,HY+2);
  ctx.closePath();
  const clg=ctx.createLinearGradient(50,HY-95,50,HY+30);
  clg.addColorStop(0,'#8D7B6A'); clg.addColorStop(0.5,'#6B5A4A'); clg.addColorStop(1,'#4A3828');
  ctx.fillStyle=clg; ctx.fill();
  // Cliff shadow
  ctx.beginPath();
  ctx.moveTo(30,HY-30); ctx.lineTo(55,HY-70); ctx.lineTo(78,HY-88);
  ctx.lineTo(88,HY-70); ctx.lineTo(70,HY-40); ctx.lineTo(50,HY-18);
  ctx.closePath(); ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fill();

  // Main island body
  ctx.beginPath();
  ctx.moveTo(-10,HY+60);
  ctx.quadraticCurveTo(50,HY+22,110,HY+5);
  ctx.quadraticCurveTo(200,HY-18,310,HY-22);
  ctx.quadraticCurveTo(390,HY-18,440,HY-2);
  ctx.quadraticCurveTo(460,HY+18,450,HY+60);
  ctx.closePath();
  const ig=ctx.createLinearGradient(220,HY-22,220,HY+60);
  ig.addColorStop(0,'#C8A050'); ig.addColorStop(0.5,'#A07A30'); ig.addColorStop(1,'#6B4510');
  ctx.fillStyle=ig; ctx.fill();

  // Grass / vegetation
  ctx.beginPath();
  ctx.ellipse(240,HY-22,210,35,0,0,Math.PI*2);
  const gg=ctx.createLinearGradient(240,HY-57,240,HY+13);
  gg.addColorStop(0,'#66BB6A'); gg.addColorStop(0.5,'#43A047'); gg.addColorStop(1,'#2E7D32');
  ctx.fillStyle=gg; ctx.fill();
  ctx.beginPath(); ctx.ellipse(225,HY-30,175,26,0,0,Math.PI*2);
  ctx.fillStyle='#56C85A'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(205,HY-36,135,20,0,0,Math.PI*2);
  ctx.fillStyle='#66BB6A'; ctx.fill();

  // LIGHTHOUSE
  const lx=105, lb=HY-14;
  // base
  ctx.beginPath(); ctx.ellipse(lx,lb+6,18,10,0,0,Math.PI*2);
  ctx.fillStyle='#6A5545'; ctx.fill();
  // tower body
  const ltg=ctx.createLinearGradient(lx,lb-88,lx,lb);
  ltg.addColorStop(0,'#EDE5D0'); ltg.addColorStop(0.5,'#F5EDD8'); ltg.addColorStop(1,'#D5CDB8');
  ctx.fillStyle=ltg;
  ctx.beginPath(); ctx.moveTo(lx-9,lb); ctx.lineTo(lx-7,lb-88); ctx.lineTo(lx+7,lb-88); ctx.lineTo(lx+9,lb); ctx.closePath(); ctx.fill();
  // red stripes
  for(let s=0;s<4;s++){if(s%2===0){ctx.fillStyle='rgba(180,28,18,0.48)'; ctx.fillRect(lx-8.5+s*0.2,lb-18-s*14,17-s*0.4,11);}}
  // top cap
  ctx.beginPath(); ctx.moveTo(lx-13,lb-88); ctx.lineTo(lx+13,lb-88); ctx.lineTo(lx+10,lb-102); ctx.lineTo(lx-10,lb-102); ctx.closePath();
  ctx.fillStyle='#C0392B'; ctx.fill();
  ctx.fillStyle='#8A7060'; ctx.fillRect(lx-10,lb-90,20,3);
  // lantern room
  ctx.beginPath(); ctx.rect(lx-7,lb-101,14,13); ctx.fillStyle='#E8E8D8'; ctx.fill(); ctx.strokeStyle='#8A7060'; ctx.lineWidth=1; ctx.stroke();
  // glow
  const pulse=0.78+Math.sin(T*0.08)*0.22;
  ctx.beginPath(); ctx.arc(lx,lb-95,7*pulse,0,Math.PI*2); ctx.fillStyle='#FFF9C4'; ctx.fill();
  const lg2=ctx.createRadialGradient(lx,lb-95,0,lx,lb-95,50*pulse);
  lg2.addColorStop(0,`rgba(255,252,160,${0.82*pulse})`); lg2.addColorStop(1,'rgba(255,248,100,0)');
  ctx.beginPath(); ctx.arc(lx,lb-95,50*pulse,0,Math.PI*2); ctx.fillStyle=lg2; ctx.fill();

  // PALM TREES
  drawPalm(ctx,175,HY-22,70,-0.18,34);
  drawPalm(ctx,215,HY-24,60, 0.14,29);
  drawPalm(ctx,255,HY-26,75,-0.10,38);
  drawPalm(ctx,295,HY-22,55, 0.20,28);
  drawPalm(ctx,332,HY-20,48,-0.25,24);
  drawPalm(ctx,140,HY-18,42,-0.32,22);

  // DOCK
  const dkx=275, dky=HY+2;
  const dkg=ctx.createLinearGradient(dkx,dky-9,dkx,dky+12);
  dkg.addColorStop(0,'#A07030'); dkg.addColorStop(1,'#6A4818');
  ctx.fillStyle=dkg; ctx.fillRect(dkx,dky-9,120,13);
  for(let p=0;p<12;p++){ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(dkx+p*10,dky-9,2,13);}
  [[dkx+8,22],[dkx+30,24],[dkx+55,24],[dkx+78,24],[dkx+100,23],[dkx+115,22]].forEach(([px,ph])=>{
    ctx.fillStyle='#5A3810'; ctx.fillRect(px-4,dky+3,7,ph);
  });
  // dock lantern
  ctx.fillStyle='#4A2E08'; ctx.fillRect(dkx+60-3,dky-32,5,22);
  const dlg=ctx.createRadialGradient(dkx+60,dky-32,0,dkx+60,dky-32,24);
  dlg.addColorStop(0,'rgba(255,215,55,0.92)'); dlg.addColorStop(1,'rgba(255,120,0,0)');
  ctx.beginPath(); ctx.arc(dkx+60,dky-32,24,0,Math.PI*2); ctx.fillStyle=dlg; ctx.fill();
  ctx.beginPath(); ctx.arc(dkx+60,dky-32,7,0,Math.PI*2); ctx.fillStyle='#FFDD44'; ctx.fill();

  // Shore rocks
  ctx.beginPath(); ctx.ellipse(410,HY+16,20,11,0.3,0,Math.PI*2); ctx.fillStyle='#7A6858'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(425,HY+20,14,8,-0.2,0,Math.PI*2); ctx.fillStyle='#6A5848'; ctx.fill();
  // Small pebbles
  ctx.beginPath(); ctx.ellipse(22,HY+18,16,9,0.2,0,Math.PI*2); ctx.fillStyle='#6A5848'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(12,HY+14,10,6,0.1,0,Math.PI*2); ctx.fillStyle='#5A4838'; ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────────
// RIGHT ISLAND — rocky cliffs with waterfall + arch
// ─────────────────────────────────────────────
function drawRightIsland(ctx, T) {
  ctx.save();
  ctx.translate(CW,0);

  // Main cliff mass
  ctx.beginPath();
  ctx.moveTo(5,HY-5);
  ctx.lineTo(5,CH*0.82);
  ctx.lineTo(-120,CH*0.80);
  ctx.lineTo(-158,HY+28);
  ctx.lineTo(-162,HY+10);
  ctx.lineTo(-155,HY-8);
  ctx.lineTo(-142,HY-30);
  ctx.lineTo(-120,HY-58);
  ctx.lineTo(-95,HY-90);
  ctx.lineTo(-65,HY-118);
  ctx.lineTo(-30,HY-132);
  ctx.lineTo(5,HY-120);
  ctx.closePath();
  const clg=ctx.createLinearGradient(-80,HY-136,5,HY+40);
  clg.addColorStop(0,'#9E8E7A'); clg.addColorStop(0.25,'#7A6858');
  clg.addColorStop(0.6,'#5A4838'); clg.addColorStop(1,'#3A2818');
  ctx.fillStyle=clg; ctx.fill();

  // Cliff face light
  ctx.beginPath();
  ctx.moveTo(-155,HY-8); ctx.lineTo(-142,HY-30); ctx.lineTo(-130,HY-48);
  ctx.lineTo(-140,HY-22); ctx.lineTo(-152,HY+4);
  ctx.closePath(); ctx.fillStyle='rgba(255,255,200,0.10)'; ctx.fill();
  // Cliff shadow
  ctx.beginPath();
  ctx.moveTo(-95,HY-90); ctx.lineTo(-70,HY-118); ctx.lineTo(-35,HY-130);
  ctx.lineTo(-20,HY-105); ctx.lineTo(-55,HY-82);
  ctx.closePath(); ctx.fillStyle='rgba(0,0,0,0.20)'; ctx.fill();

  // Arch rock formation
  ctx.beginPath();
  ctx.moveTo(-168,HY+24); ctx.lineTo(-172,HY+5); ctx.lineTo(-165,HY-8);
  ctx.lineTo(-152,HY-16); ctx.lineTo(-147,HY+0); ctx.lineTo(-150,HY+22);
  ctx.closePath();
  const ag=ctx.createLinearGradient(-172,HY-18,-147,HY+24);
  ag.addColorStop(0,'#7A6858'); ag.addColorStop(1,'#4A3828');
  ctx.fillStyle=ag; ctx.fill();
  // Arch hole (ocean visible through)
  ctx.beginPath(); ctx.ellipse(-160,HY+8,9,13,0.1,0,Math.PI*2);
  ctx.fillStyle='#1565C0'; ctx.fill();

  // Vegetation top
  ctx.beginPath(); ctx.ellipse(-58,HY-120,78,24,0,0,Math.PI*2);
  ctx.fillStyle='#388E3C'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-58,HY-130,58,18,0,0,Math.PI*2);
  ctx.fillStyle='#43A047'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-58,HY-138,38,13,0,0,Math.PI*2);
  ctx.fillStyle='#66BB6A'; ctx.fill();

  // Palm trees on cliff
  drawPalm(ctx,-55,HY-138,52,-0.12,28);
  drawPalm(ctx,-22,HY-126,38, 0.18,22);
  drawPalm(ctx,-90,HY-122,32,-0.22,19);

  // WATERFALL
  const wfx=-25, wfT=HY-102, wfB=HY+20;
  for(let wi=-7;wi<=7;wi+=5){
    const wg=ctx.createLinearGradient(wfx+wi,wfT,wfx+wi,wfB);
    wg.addColorStop(0,'rgba(180,235,255,0.88)');
    wg.addColorStop(0.5,'rgba(140,210,255,0.70)');
    wg.addColorStop(0.85,'rgba(100,185,255,0.45)');
    wg.addColorStop(1,'rgba(80,165,255,0.08)');
    const shimmer=Math.sin(T*0.07+wi)*2.5;
    ctx.fillStyle=wg;
    ctx.beginPath();
    ctx.moveTo(wfx+wi,wfT);
    ctx.bezierCurveTo(wfx+wi+shimmer,wfT+(wfB-wfT)*0.35,wfx+wi-shimmer,wfT+(wfB-wfT)*0.65,wfx+wi+1,wfB);
    ctx.lineTo(wfx+wi+6,wfB);
    ctx.bezierCurveTo(wfx+wi+6-shimmer,wfT+(wfB-wfT)*0.65,wfx+wi+6+shimmer,wfT+(wfB-wfT)*0.35,wfx+wi+6,wfT);
    ctx.closePath(); ctx.fill();
  }
  // Splash
  const sp=0.72+Math.sin(T*0.13)*0.28;
  ctx.beginPath(); ctx.ellipse(wfx+3,HY+24,24*sp,9,0,0,Math.PI*2);
  ctx.fillStyle='rgba(180,235,255,0.42)'; ctx.fill();

  // Second small outcrop
  ctx.beginPath();
  ctx.moveTo(-240,HY+30); ctx.lineTo(-238,HY+6); ctx.lineTo(-224,HY-10);
  ctx.lineTo(-208,HY-16); ctx.lineTo(-194,HY-8); ctx.lineTo(-190,HY+14); ctx.lineTo(-198,HY+32);
  ctx.closePath();
  const r2g=ctx.createLinearGradient(-218,HY-16,-218,HY+32);
  r2g.addColorStop(0,'#8A7468'); r2g.addColorStop(1,'#4A3828');
  ctx.fillStyle=r2g; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-216,HY-10,24,13,0,0,Math.PI*2);
  ctx.fillStyle='#3D8040'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-216,HY-18,16,9,0,0,Math.PI*2);
  ctx.fillStyle='#56C85A'; ctx.fill();
  drawPalm(ctx,-216,HY-18,32,-0.06,18);

  ctx.restore();
}

// ─────────────────────────────────────────────
// DISTANT HORIZON ISLETS
// ─────────────────────────────────────────────
function drawDistantIslets(ctx) {
  ctx.save(); ctx.globalAlpha=0.52;
  // Small misty islands
  [[820,8,30,16],[878,5,22,13],[780,3,18,10]].forEach(([x,h,rx,ry])=>{
    ctx.beginPath(); ctx.ellipse(x,HY-h/2,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle='#4A7060'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x,HY-h,rx*0.65,ry*0.55,0,0,Math.PI*2);
    ctx.fillStyle='#2E5C40'; ctx.fill();
  });
  // Arch rock silhouette
  ctx.beginPath();
  ctx.moveTo(955,HY+5); ctx.lineTo(960,HY-14); ctx.lineTo(968,HY-22);
  ctx.lineTo(976,HY-27); ctx.lineTo(984,HY-22); ctx.lineTo(992,HY-12); ctx.lineTo(998,HY+5);
  ctx.fillStyle='#3A5848'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(976,HY-10,7,11,0,0,Math.PI*2);
  ctx.fillStyle='#1565C0'; ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────
// SHIP — detailed wooden sailing ship
// ─────────────────────────────────────────────
function drawShip(ctx, T) {
  const bob  = Math.sin(T*0.018)*5.5;
  const roll = Math.sin(T*0.014)*0.016;
  const sx=CW*0.50, sy=HY+bob;

  ctx.save();
  ctx.translate(sx,sy);
  ctx.rotate(roll);

  // Water shadow
  ctx.beginPath(); ctx.ellipse(0,76,110,15,0,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fill();

  // Wake lines
  ctx.save(); ctx.strokeStyle='rgba(160,235,255,0.28)'; ctx.lineWidth=1.8;
  [[-112,66,-165,74,-195,68],[-132,75,-172,84,-200,78],
   [112,66,162,74,192,68],[130,75,170,84,198,78]].forEach(([x1,y1,x2,y2,x3,y3])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1);
    ctx.quadraticCurveTo(x2,y2,x3,y3); ctx.stroke();
  });
  ctx.restore();

  // ── HULL
  ctx.beginPath();
  ctx.moveTo(-112,22); ctx.lineTo(-106,-8); ctx.lineTo(-88,-16);
  ctx.lineTo(90,-16); ctx.lineTo(108,-8); ctx.lineTo(112,22);
  ctx.lineTo(96,54); ctx.lineTo(-92,54);
  ctx.closePath();
  const hg=ctx.createLinearGradient(0,-16,0,54);
  hg.addColorStop(0,'#B07850'); hg.addColorStop(0.28,'#8B5E35');
  hg.addColorStop(0.68,'#6B3E1C'); hg.addColorStop(1,'#4E2C0C');
  ctx.fillStyle=hg; ctx.fill();
  // Hull planks
  ctx.save(); ctx.clip();
  ctx.strokeStyle='rgba(0,0,0,0.09)'; ctx.lineWidth=1.2;
  for(let p=-96;p<108;p+=16){ctx.beginPath();ctx.moveTo(p,-16);ctx.lineTo(p+1,54);ctx.stroke();}
  [8,22,36].forEach(y=>{ctx.beginPath();ctx.moveTo(-112,y);ctx.lineTo(112,y);ctx.stroke();});
  ctx.restore();
  // Hull highlight strip
  ctx.beginPath(); ctx.moveTo(-106,-8); ctx.lineTo(90,-8); ctx.lineTo(90,-2); ctx.lineTo(-106,-2); ctx.closePath();
  ctx.fillStyle='rgba(255,255,200,0.11)'; ctx.fill();
  // Keel
  ctx.beginPath(); ctx.moveTo(-92,54); ctx.lineTo(96,54); ctx.lineTo(84,64); ctx.lineTo(-80,64); ctx.closePath();
  ctx.fillStyle='#3A1E08'; ctx.fill();
  // Bow / stern foam highlights
  ctx.beginPath(); ctx.ellipse(-108,42,30,9,0.3,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.26)'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(108,44,24,7,-0.3,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fill();

  // Deck rail
  ctx.fillStyle='#6E4020'; ctx.fillRect(-100,-22,200,10);
  ctx.save(); ctx.beginPath(); ctx.rect(-100,-22,200,10); ctx.clip();
  for(let dp=-96;dp<100;dp+=16){ctx.fillStyle='rgba(0,0,0,0.10)'; ctx.fillRect(dp,-22,2,10);}
  ctx.restore();

  // ── CABIN
  ctx.save(); ctx.translate(22,-54);
  const cw=96, ch=44;
  const cwg=ctx.createLinearGradient(-cw/2,0,cw/2,0);
  cwg.addColorStop(0,'#8A5535'); cwg.addColorStop(0.5,'#A06040'); cwg.addColorStop(1,'#7A4825');
  ctx.fillStyle=cwg; ctx.fillRect(-cw/2,0,cw,ch);
  // Windows
  [-34,-14,6,26].forEach(wx=>{
    ctx.fillStyle='#5A3015'; ctx.fillRect(wx,9,16,14);
    const wg=ctx.createLinearGradient(wx,9,wx,23);
    wg.addColorStop(0,'rgba(255,228,108,0.92)'); wg.addColorStop(0.5,'rgba(255,198,78,0.78)');
    wg.addColorStop(1,'rgba(200,138,28,0.62)');
    ctx.fillStyle=wg; ctx.fillRect(wx+2,11,12,10);
    ctx.fillStyle='rgba(255,255,255,0.24)'; ctx.fillRect(wx+2,11,5,4);
  });
  // Roof
  ctx.beginPath(); ctx.moveTo(-cw/2-8,-4); ctx.lineTo(cw/2+8,-4);
  ctx.lineTo(cw/2+4,-22); ctx.lineTo(-cw/2-4,-22); ctx.closePath();
  const rog=ctx.createLinearGradient(0,-22,0,-4);
  rog.addColorStop(0,'#D46030'); rog.addColorStop(0.5,'#B84C22'); rog.addColorStop(1,'#8A3410');
  ctx.fillStyle=rog; ctx.fill();
  ctx.save(); ctx.clip();
  for(let ti=-cw/2-8;ti<cw/2+8;ti+=12){ctx.fillStyle='rgba(0,0,0,0.10)';ctx.fillRect(ti,-22,11,18);}
  ctx.restore();
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(-cw/2-8,-22,cw+16,3);
  ctx.restore();

  // Barrels
  const barrel=(bx,by)=>{
    const bg=ctx.createLinearGradient(bx-12,by,bx+12,by);
    bg.addColorStop(0,'#6A3E1C'); bg.addColorStop(0.4,'#8A5430');
    bg.addColorStop(0.7,'#7A4820'); bg.addColorStop(1,'#5A3418');
    ctx.beginPath(); ctx.roundRect(bx-12,by,24,28,4); ctx.fillStyle=bg; ctx.fill();
    ctx.fillStyle='#3A1E08'; ctx.fillRect(bx-12,by+8,24,3); ctx.fillRect(bx-12,by+17,24,3);
    ctx.beginPath(); ctx.ellipse(bx,by,12,4.5,0,0,Math.PI*2); ctx.fillStyle='#4A2A10'; ctx.fill();
  };
  barrel(-70,-22); barrel(-46,-22);

  // ── MAST
  const mwg=ctx.createLinearGradient(-6,0,6,0);
  mwg.addColorStop(0,'#4A2E10'); mwg.addColorStop(0.5,'#7A5030'); mwg.addColorStop(1,'#4A2E10');
  ctx.fillStyle=mwg; ctx.fillRect(-6,-200,12,190);
  ctx.beginPath(); ctx.arc(0,-200,8,0,Math.PI*2); ctx.fillStyle='#5A3818'; ctx.fill();
  // Yard arms
  ctx.fillStyle='#5A3818';
  ctx.fillRect(-112,-104,224,6); ctx.fillRect(-116,-22,232,5);
  // Rigging
  ctx.strokeStyle='rgba(74,46,14,0.62)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(-3,-197); ctx.lineTo(-116,-22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3,-197); ctx.lineTo(112,-100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 3,-197); ctx.lineTo(-112,-100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3,-18); ctx.lineTo(-116,-22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3,-18); ctx.lineTo(116,-22); ctx.stroke();

  // ── MAIN SAIL
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-3,-197);
  ctx.bezierCurveTo(28,-166,108,-128,112,-100);
  ctx.lineTo(112,-6); ctx.bezierCurveTo(80,-10,28,-14,-3,-14);
  ctx.closePath();
  const sailg=ctx.createLinearGradient(112,-197,-3,-6);
  sailg.addColorStop(0,'#F8F2DC'); sailg.addColorStop(0.30,'#EDE5C0');
  sailg.addColorStop(0.65,'#DDD5A8'); sailg.addColorStop(1,'#C8B878');
  ctx.fillStyle=sailg; ctx.fill();
  // Sail shadow fold
  ctx.beginPath();
  ctx.moveTo(-3,-197); ctx.bezierCurveTo(16,-168,46,-135,56,-112);
  ctx.bezierCurveTo(65,-82,62,-44,60,-6); ctx.lineTo(-3,-14); ctx.closePath();
  ctx.fillStyle='rgba(175,155,95,0.15)'; ctx.fill();
  // Stitch lines
  ctx.strokeStyle='rgba(148,118,55,0.22)'; ctx.lineWidth=1.3;
  [[0,-172,82,-105,84,-76],[0,-138,70,-84,72,-50],[0,-98,56,-58,58,-22]].forEach(([x1,y1,x2,y2,x3,y3])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(x2,y2,x3,y3); ctx.stroke();
  });
  // Compass rose on sail
  ctx.save(); ctx.translate(64,-106);
  ctx.strokeStyle='rgba(135,108,50,0.28)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(0,0,25,0,Math.PI*2); ctx.stroke();
  ctx.lineWidth=1.8;
  [[0,-16,0,16],[-16,0,16,0],[-11,-11,11,11],[-11,11,11,-11]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });
  ctx.beginPath(); ctx.arc(0,-9,5,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2);
  ctx.fillStyle='rgba(135,108,50,0.32)'; ctx.fill();
  ctx.restore();
  ctx.restore();

  // FLAG
  const flap=Math.sin(T*0.045)*4.2;
  ctx.save(); ctx.translate(2,-200);
  ctx.beginPath();
  ctx.moveTo(0,0); ctx.lineTo(36+flap,10+flap*0.3);
  ctx.lineTo(30+flap,22+flap*0.2); ctx.lineTo(0,20);
  ctx.closePath(); ctx.fillStyle='#E53935'; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.8; ctx.stroke();
  ctx.restore();

  // LANTERN (starboard)
  ctx.save(); ctx.translate(96,-38);
  ctx.strokeStyle='#5A3810'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(0,0); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-8,0,16,21,3); ctx.fillStyle='#C8900E'; ctx.fill();
  ctx.beginPath(); ctx.roundRect(-8,0,16,6,2); ctx.fillStyle='#8A6010'; ctx.fill();
  const lng=ctx.createRadialGradient(0,11,0,0,11,16);
  lng.addColorStop(0,'rgba(255,225,80,0.92)'); lng.addColorStop(1,'rgba(255,175,30,0)');
  ctx.beginPath(); ctx.arc(0,11,16,0,Math.PI*2); ctx.fillStyle=lng; ctx.fill();
  ctx.fillStyle='rgba(255,210,70,0.85)'; ctx.fillRect(-5,6,10,11);
  ctx.restore();

  // WHEEL
  ctx.save(); ctx.translate(-82,4);
  ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2);
  ctx.strokeStyle='#8A5025'; ctx.lineWidth=4.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fillStyle='#A86030'; ctx.fill();
  for(let s=0;s<8;s++){
    const a=s*Math.PI/4;
    ctx.beginPath(); ctx.moveTo(Math.cos(a)*6,Math.sin(a)*6);
    ctx.lineTo(Math.cos(a)*18,Math.sin(a)*18);
    ctx.strokeStyle='#8A5025'; ctx.lineWidth=2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(Math.cos(a)*19,Math.sin(a)*19,3,0,Math.PI*2);
    ctx.fillStyle='#8A5025'; ctx.fill();
  }
  ctx.restore();

  ctx.restore(); // ship
}

// ─────────────────────────────────────────────
// TREASURE CHEST (bottom-left)
// ─────────────────────────────────────────────
function drawChest(ctx, T) {
  ctx.save();
  const cx=170, cy=CH-155;

  // Shadow
  const sg=ctx.createRadialGradient(cx+5,cy+85,0,cx+5,cy+85,110);
  sg.addColorStop(0,'rgba(0,0,0,0.32)'); sg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.ellipse(cx+5,cy+85,110,28,0,0,Math.PI*2);
  ctx.fillStyle=sg; ctx.fill();

  // Scattered coins outside
  [[-40,cy+76],[-24,cy+80],[-8,cy+82],[8,cy+78],[26,cy+82],[44,cy+76]].forEach(([ox,oy])=>{
    const cg=ctx.createRadialGradient(cx+ox-1,oy-1,0,cx+ox,oy,8);
    cg.addColorStop(0,'#FFE082'); cg.addColorStop(0.5,'#FDD835'); cg.addColorStop(1,'#C49010');
    ctx.beginPath(); ctx.ellipse(cx+ox,oy,8,5,0,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
  });
  // Pearls outside
  [[-28,cy+84],[18,cy+86],[50,cy+80]].forEach(([ox,oy])=>{
    const pg=ctx.createRadialGradient(cx+ox-2,oy-2,0,cx+ox,oy,7);
    pg.addColorStop(0,'#FFF'); pg.addColorStop(0.4,'#E8EAF6'); pg.addColorStop(1,'#B8C0D8');
    ctx.beginPath(); ctx.arc(cx+ox,oy,7,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();
    ctx.beginPath(); ctx.arc(cx+ox-2,oy-2,2.5,0,Math.PI*2); ctx.fillStyle='#FFF'; ctx.fill();
  });

  // Chest body
  const CW2=100, CH2=70, chX=cx-CW2/2, chY=cy+8;
  const cbg=ctx.createLinearGradient(cx,chY,cx,chY+CH2);
  cbg.addColorStop(0,'#D08030'); cbg.addColorStop(0.45,'#9A5E18'); cbg.addColorStop(1,'#5E3608');
  ctx.beginPath(); ctx.roundRect(chX,chY,CW2,CH2,6); ctx.fillStyle=cbg; ctx.fill();
  // Planks
  ctx.save(); ctx.beginPath(); ctx.roundRect(chX,chY,CW2,CH2,6); ctx.clip();
  for(let cp=0;cp<7;cp++){ctx.fillStyle='rgba(0,0,0,0.07)';ctx.fillRect(chX+cp*(CW2/7),chY,2,CH2);}
  ctx.restore();
  // Metal bands
  const bn=ctx.createLinearGradient(chX,0,chX+CW2,0);
  bn.addColorStop(0,'#3A2808'); bn.addColorStop(0.5,'#5A4010'); bn.addColorStop(1,'#3A2808');
  ctx.fillStyle=bn;
  ctx.fillRect(chX,chY+17,CW2,7); ctx.fillRect(chX,chY+37,CW2,7); ctx.fillRect(chX,chY+55,CW2,6);
  // Rivets
  [[chX+6,chY+20],[chX+CW2-10,chY+20],[chX+6,chY+40],[chX+CW2-10,chY+40]].forEach(([rx,ry])=>{
    ctx.beginPath(); ctx.arc(rx,ry,3.5,0,Math.PI*2); ctx.fillStyle='#9A7820'; ctx.fill();
    ctx.beginPath(); ctx.arc(rx,ry,2,0,Math.PI*2); ctx.fillStyle='#C8A828'; ctx.fill();
  });
  // Lock
  ctx.beginPath(); ctx.roundRect(cx-10,chY+20,20,17,3);
  const lkg=ctx.createLinearGradient(cx-10,chY+20,cx+10,chY+37);
  lkg.addColorStop(0,'#E0C018'); lkg.addColorStop(1,'#A87808');
  ctx.fillStyle=lkg; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,chY+20,7,Math.PI,0); ctx.strokeStyle='#C89808'; ctx.lineWidth=3; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,chY+26,3,0,Math.PI*2); ctx.fillStyle='#7A5808'; ctx.fill();

  // Lid (animated)
  ctx.save();
  const lt=0.50+Math.sin(T*0.016)*0.22;
  ctx.translate(cx,chY); ctx.transform(1,0,0,Math.cos(lt),0,0);
  const ld=ctx.createLinearGradient(0,-30,0,0);
  ld.addColorStop(0,'#D89030'); ld.addColorStop(0.5,'#AA6818'); ld.addColorStop(1,'#7A4C10');
  ctx.beginPath(); ctx.roundRect(-CW2/2,-30,CW2,30,6); ctx.fillStyle=ld; ctx.fill();
  ctx.fillStyle='#3A2808'; ctx.fillRect(-CW2/2,-14,CW2,6);
  [[-CW2/2+6,-11],[CW2/2-10,-11]].forEach(([rx,ry])=>{
    ctx.beginPath(); ctx.arc(rx,ry,3.5,0,Math.PI*2); ctx.fillStyle='#9A7820'; ctx.fill();
  });
  ctx.restore();

  // Interior treasure glow
  ctx.save();
  ctx.beginPath(); ctx.roundRect(chX,chY,CW2,CH2,6); ctx.clip();
  const tb=ctx.createRadialGradient(cx,chY+24,0,cx,chY+24,42);
  tb.addColorStop(0,'rgba(255,218,40,0.78)'); tb.addColorStop(1,'rgba(200,140,0,0)');
  ctx.beginPath(); ctx.ellipse(cx,chY+26,38,16,0,0,Math.PI*2); ctx.fillStyle=tb; ctx.fill();
  // Coins inside
  [[-28,3],[-14,1],[0,0],[14,1],[28,3],[-22,13],[-8,11],[6,11],[20,13],[-14,22],[0,20],[14,22],[28,14],[-28,12]].forEach(([ox,oy])=>{
    const cg=ctx.createRadialGradient(cx+ox-1,chY+oy-1,0,cx+ox,chY+oy,7);
    cg.addColorStop(0,'#FFE082'); cg.addColorStop(0.5,'#FDD835'); cg.addColorStop(1,'#C49010');
    ctx.beginPath(); ctx.ellipse(cx+ox,chY+oy,7,4.5,0,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
  });
  // Pearls inside
  [[-26,7],[-10,5],[8,7],[24,9],[30,1],[-30,1],[-18,18],[10,20],[22,18]].forEach(([ox,oy])=>{
    const pg=ctx.createRadialGradient(cx+ox-2,chY+oy-2,0,cx+ox,chY+oy,6);
    pg.addColorStop(0,'#FFF'); pg.addColorStop(0.4,'#E8EAF6'); pg.addColorStop(1,'#B8C0D8');
    ctx.beginPath(); ctx.arc(cx+ox,chY+oy,6,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();
  });
  ctx.restore();

  // Floating particles
  [{x:cx-14,ph:0,g:'#FDD835'},{x:cx+4,ph:1.4,g:'#FFF'},{x:cx+20,ph:2.7,g:'#FDD835'},{x:cx-2,ph:4.0,g:'#FFF'}].forEach(p=>{
    const pr=(Math.sin(T*0.022+p.ph)+1)*0.5;
    const ry=chY-5-pr*50;
    ctx.beginPath(); ctx.arc(p.x,ry,3.5+pr*1.5,0,Math.PI*2);
    ctx.fillStyle=p.g; ctx.globalAlpha=(1-pr)*0.80; ctx.fill();
  });
  ctx.globalAlpha=1;

  // Decorative foliage
  ctx.save(); ctx.font='20px serif';
  ctx.fillText('🌿',cx-46,cy+60); ctx.fillText('🌿',cx+62,cy+54);
  ctx.font='22px serif'; ctx.fillText('⭐',cx+70,cy+90);
  ctx.restore();

  ctx.restore();
}

// ─────────────────────────────────────────────
// BIRDS
// ─────────────────────────────────────────────
function drawBirds(ctx, T) {
  [{ox:80,y:88,sp:0.38,sz:13,ph:0.0},{ox:230,y:72,sp:0.26,sz:11,ph:2.1},
   {ox:170,y:105,sp:0.32,sz:10,ph:4.3},{ox:340,y:80,sp:0.20,sz:9,ph:6.5},
   {ox:460,y:62,sp:0.17,sz:8,ph:1.8}].forEach(b=>{
    const bx=((b.ox+T*b.sp)%(CW+120))-60;
    const by=b.y+Math.sin(T*0.05+b.ph)*4;
    const fw=Math.sin(T*0.11+b.ph)*0.40;
    ctx.save(); ctx.translate(bx,by); ctx.scale(b.sz/13,b.sz/13);
    ctx.strokeStyle='rgba(255,255,255,0.76)'; ctx.lineWidth=1.6; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(-10,0); ctx.quadraticCurveTo(-5,-7+fw*8,-1,0);
    ctx.quadraticCurveTo(3,-7+fw*8,10,0); ctx.stroke();
    ctx.restore();
  });
}

function drawReferencePolish(ctx, T) {
  const sx=CW*0.62;

  const horizonGlow=ctx.createRadialGradient(sx,HY-8,20,sx,HY+28,430);
  horizonGlow.addColorStop(0,'rgba(255,240,155,0.52)');
  horizonGlow.addColorStop(0.28,'rgba(255,178,92,0.24)');
  horizonGlow.addColorStop(0.62,'rgba(58,177,214,0.10)');
  horizonGlow.addColorStop(1,'rgba(10,58,102,0)');
  ctx.fillStyle=horizonGlow;
  ctx.fillRect(0,0,CW,CH);

  const topShade=ctx.createLinearGradient(0,0,0,HY*0.78);
  topShade.addColorStop(0,'rgba(4,47,106,0.26)');
  topShade.addColorStop(0.58,'rgba(24,127,207,0.02)');
  topShade.addColorStop(1,'rgba(255,198,112,0.08)');
  ctx.fillStyle=topShade;
  ctx.fillRect(0,0,CW,HY);

  const waterDepth=ctx.createLinearGradient(0,HY,0,CH);
  waterDepth.addColorStop(0,'rgba(70,212,236,0.08)');
  waterDepth.addColorStop(0.46,'rgba(0,117,165,0.06)');
  waterDepth.addColorStop(1,'rgba(0,44,70,0.28)');
  ctx.fillStyle=waterDepth;
  ctx.fillRect(0,HY,CW,CH-HY);

  ctx.save();
  ctx.globalCompositeOperation='screen';
  for(let i=0;i<34;i++){
    const yy=HY+18+i*9.2;
    const spread=42+i*6.4;
    const phase=T*0.055+i*0.72;
    const x=sx+Math.sin(phase)*spread*0.16;
    const w=Math.max(12,86-i*1.35);
    const a=Math.max(0.02,0.23-i*0.005);
    ctx.beginPath();
    ctx.ellipse(x,yy,w*(0.62+Math.sin(phase*1.7)*0.22),1.3+i*0.035,0,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,235,142,${a})`;
    ctx.fill();
  }

  for(let i=0;i<95;i++){
    const y=HY+18+((i*37+T*1.15)%(CH-HY-24));
    const x=(i*83+Math.sin(T*0.025+i)*28)%CW;
    const near=(y-HY)/(CH-HY);
    const len=10+near*34;
    const alpha=0.04+near*0.08;
    ctx.strokeStyle=`rgba(210,250,255,${alpha})`;
    ctx.lineWidth=1+near*1.1;
    ctx.beginPath();
    ctx.moveTo(x-len*0.5,y+Math.sin(i)*2);
    ctx.quadraticCurveTo(x,y-2,x+len*0.5,y+Math.cos(i)*2);
    ctx.stroke();
  }
  ctx.restore();

  const vignette=ctx.createRadialGradient(CW*0.52,CH*0.50,CH*0.25,CW*0.52,CH*0.50,CH*0.86);
  vignette.addColorStop(0,'rgba(0,0,0,0)');
  vignette.addColorStop(0.74,'rgba(0,22,44,0.03)');
  vignette.addColorStop(1,'rgba(0,20,42,0.30)');
  ctx.fillStyle=vignette;
  ctx.fillRect(0,0,CW,CH);
}

// ─────────────────────────────────────────────
// RENDER FRAME
// ─────────────────────────────────────────────
function renderFrame(canvas, T) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  ctx.save();
  ctx.clearRect(0,0,W,H);
  const scale=Math.max(W/CW,H/CH);
  const ox=(W-CW*scale)*0.5;
  const oy=(H-CH*scale)*0.5;
  ctx.translate(ox,oy);
  ctx.scale(scale,scale);

  const off=Math.sin(T*0.002)*14;
  const wp =T*0.036;

  drawSky(ctx);
  drawClouds(ctx,off);
  drawSun(ctx);
  drawDistantIslets(ctx);
  drawRightIsland(ctx,T);
  drawOcean(ctx,wp);
  drawLeftIsland(ctx,T);
  drawShip(ctx,T);
  drawChest(ctx,T);
  drawBirds(ctx,T);
  drawReferencePolish(ctx,T);

  ctx.restore();
}

// ─────────────────────────────────────────────
// REACT COMPONENT
// ─────────────────────────────────────────────
const Ship = ({ streak=0, onClose }) => {
  const canvasRef=useRef(null);
  const [visible,setVisible]=useState(false);
  const [day,setDay]=useState(()=>{const s=loadState();return Math.max(s?.day||1,Math.min(streak||1,365));});
  const [toast,setToast]=useState(null);
  const toastRef=useRef(null);
  const stateRef=useRef({frame:0,animId:null});
  const onCloseRef=useRef(onClose);
  onCloseRef.current=onClose;

  useEffect(()=>{saveState({day,...calcTotals(day)});},[day]);

  useEffect(()=>{
    const scrollY=window.scrollY; const body=document.body;
    const ov=body.style.overflow,op=body.style.position,ot=body.style.top,ow=body.style.width;
    body.style.overflow='hidden'; body.style.position='fixed';
    body.style.top=`-${scrollY}px`; body.style.width='100%';
    const t=setTimeout(()=>setVisible(true),50);
    return()=>{clearTimeout(t);body.style.overflow=ov;body.style.position=op;body.style.top=ot;body.style.width=ow;window.scrollTo(0,scrollY);};
  },[]);

  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(!c)return;const dpr=Math.min(window.devicePixelRatio||1,2);c.width=Math.floor(window.innerWidth*dpr);c.height=Math.floor(window.innerHeight*dpr);};
    resize(); window.addEventListener('resize',resize);
    return()=>window.removeEventListener('resize',resize);
  },[]);

  useEffect(()=>{
    const onDown=(e)=>{
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'].includes(e.key)){e.preventDefault();e.stopPropagation();}
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onCloseRef.current?.();}
    };
    const onUp=(e)=>e.stopPropagation();
    window.addEventListener('keydown',onDown,true); window.addEventListener('keyup',onUp,true);
    return()=>{window.removeEventListener('keydown',onDown,true);window.removeEventListener('keyup',onUp,true);};
  },[]);

  useEffect(()=>{
    const s=stateRef.current;
    const tick=()=>{const c=canvasRef.current;if(c&&c.width&&c.height){s.frame++;renderFrame(c,s.frame);}s.animId=requestAnimationFrame(tick);};
    s.animId=requestAnimationFrame(tick);
    return()=>{if(s.animId)cancelAnimationFrame(s.animId);};
  },[day]);

  const showToast=(icon,title,sub)=>{setToast({icon,title,sub});clearTimeout(toastRef.current);toastRef.current=setTimeout(()=>setToast(null),2800);};
  const handleClaim=()=>{
    if(day>=365){showToast('🏆','Journey Complete!','You are Master of the Ocean');return;}
    const next=day+1; setDay(next);
    const hit=MILESTONES.find(m=>m.d===next);
    if(hit)setTimeout(()=>showToast(hit.e,hit.l,`Day ${next} reached!`),350);
  };

  const hud=useMemo(()=>{
    const cur=getRank(day); const nxt=getNext(day);
    const prevDay=getPrevDay(day);
    const pct=nxt?Math.min(100,((day-prevDay)/(nxt.d-prevDay))*100):100;
    return{cur,nxt,pct,totals:calcTotals(day),rewards:getDailyRewards(day)};
  },[day]);

  const font="'Nunito','Segoe UI',sans-serif";
  const smallGlow='0 2px 12px rgba(3,25,55,0.78)';
  const topCounterValue={fontSize:18,fontWeight:900,color:'#fff',lineHeight:1,textShadow:smallGlow};
  const topCounterLabel={fontSize:10,color:'rgba(220,238,255,.70)',letterSpacing:'.12em',textTransform:'uppercase',marginTop:5};
  const softButton={pointerEvents:'all',cursor:'pointer',border:'1px solid rgba(178,218,255,.26)',background:'rgba(8,34,68,.50)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',color:'rgba(231,244,255,.88)',fontFamily:font,fontSize:14,fontWeight:800,borderRadius:12,padding:'7px 13px',boxShadow:'0 8px 20px rgba(0,16,40,.18)'};
  const progressText=hud.nxt?`${hud.nxt.e} ${hud.nxt.l} in ${hud.nxt.d-day} day${hud.nxt.d-day!==1?'s':''}`:'⚓ Full ocean journey achieved — all milestones unlocked';

  return(
    <div onClick={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}
      style={{position:'fixed',inset:0,zIndex:99999,background:'#000',overflow:'hidden',pointerEvents:'all',opacity:visible?1:0,transition:'opacity 0.6s ease-out'}}>
      <canvas ref={canvasRef} style={{display:'block',position:'fixed',top:0,left:0,width:'100vw',height:'100vh'}}/>

      {/* Top HUD */}
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:20,padding:'10px 24px 42px',background:'linear-gradient(180deg,rgba(4,30,66,.62) 0%,rgba(4,30,66,.24) 45%,transparent 100%)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',pointerEvents:'none',fontFamily:font}}>
        <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
          {[
            [day,'Days'],
            [hud.totals.pearls.toLocaleString(),'Pearls'],
            [hud.totals.coins.toLocaleString(),'Coins'],
            [hud.totals.stars.toLocaleString(),'Stars'],
            [`+${hud.rewards.pearls}/+${hud.rewards.coins}`,'Today']
          ].map(([val,label])=>(
            <div key={label} style={{textAlign:'center',minWidth:label==='Today'?74:48}}>
              <div style={topCounterValue}>{val}</div>
              <div style={topCounterLabel}>{label}</div>
            </div>
          ))}
        </div>
        <button onClick={e=>{e.stopPropagation();onCloseRef.current?.();}} style={softButton}>✕ Close</button>
      </div>

      {/* Bottom HUD */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:20,padding:'54px 26px 16px',background:'linear-gradient(0deg,rgba(3,36,55,.64) 0%,rgba(3,36,55,.24) 48%,transparent 100%)',display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:20,pointerEvents:'none',fontFamily:font}}>
        <div>
          <div style={{fontSize:30,fontWeight:900,color:'#fff',letterSpacing:'.03em',textShadow:smallGlow,lineHeight:1.08}}>{day} Days</div>
          <div style={{fontSize:14,color:'rgba(229,244,255,.84)',lineHeight:1.8,marginTop:5}}>{hud.cur.e} {hud.cur.l}</div>
          <div style={{fontSize:12,color:'rgba(214,235,255,.64)',maxWidth:620}}>{progressText}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,pointerEvents:'none'}}>
          <button onClick={e=>{e.stopPropagation();showToast('☸️','Goals',`${MILESTONES.filter(m=>m.d>0&&m.d<=day).length} milestones reached`);}} style={softButton}>☸ Goals</button>
          <button onClick={e=>{e.stopPropagation();showToast('🗺️','Map',`Day ${day} — ${hud.cur.l}`);}} style={softButton}>🗺 Map</button>
          <button onClick={e=>{e.stopPropagation();handleClaim();}} style={softButton}>⚓ Harbor</button>
          <button onClick={e=>{e.stopPropagation();showToast('🔭','Logbook',`Day ${day} — ${hud.cur.l}`);}} style={softButton}>🔭 Logbook</button>
        </div>
      </div>

      {/* TOAST */}
      {toast&&(
        <div style={{position:'fixed',top:68,left:'50%',transform:'translateX(-50%)',background:'rgba(10,18,45,0.96)',border:'1px solid rgba(120,180,255,0.28)',borderRadius:12,padding:'10px 18px',textAlign:'center',pointerEvents:'none',whiteSpace:'nowrap',zIndex:20,backdropFilter:'blur(12px)',fontFamily:font}}>
          <span style={{fontSize:22,display:'block',marginBottom:2}}>{toast.icon}</span>
          <div style={{fontSize:13,fontWeight:800,color:'#FDE68A'}}>{toast.title}</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:1}}>{toast.sub}</div>
        </div>
      )}
    </div>
  );
};

Ship.isCanvasScene=true;
export default Ship;
