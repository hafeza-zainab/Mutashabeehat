// C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getTheme } from '../utils/themeRegistry';
import '../../styles/ImmersiveView.css';

const srand = (s) => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const makeStars = (count, seedBase = 0, w = 100, h = 100, color = '255,255,255') => {
    const shadows = [];
    for (let i = 0; i < count; i++) {
        const s = (seedBase + i) * 37 + 7;
        const x = srand(s) * w;
        const y = srand(s + 500) * h;
        const sz = srand(s + 1000) > 0.88 ? 1.5 : 1;
        const a = (0.2 + srand(s + 2000) * 0.7).toFixed(2);
        shadows.push(`${x}vw ${y}vh 0 ${sz}px rgba(${color},${a})`);
    }
    return shadows.join(',');
};

// ═══════════════════════════════════════════════════════
// ALL THEME FUNCTIONS FIRST (before THEMES object)
// ═════════════════════════════════════════════════════

const SKY = () => [
    { id: 'sky-deep', speed: 0.06, style: { background: 'radial-gradient(ellipse at 70% 30%, #0a0a20 0%, #050510 50%, #020208 100%)' } },
    { id: 'sky-stars', speed: 0.12, style: { boxShadow: makeStars(400, 0, 100, 80) } },
    { id: 'sky-nebula1', speed: 0.18, style: { background: 'radial-gradient(ellipse at 30% 40%, rgba(80,40,180,0.08) 0%, transparent 60%)' } },
    { id: 'sky-nebula2', speed: 0.22, style: { background: 'radial-gradient(ellipse at 70% 50%, rgba(40,80,180,0.06) 0%, transparent 55%)' } },
    { id: 'sky-moon-group', speed: 0.32, children: [0,1,2,3].map(i => ({
        id: `moon-${i}`, style: {
            position: 'absolute', left: `${18 + i * 22}%`, top: `${18 + srand(i * 77) * 25}%`,
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #fff8e1 0%, #fcd34d 40%, transparent 60%)',
            boxShadow: `0 0 25px 8px rgba(255,220,100,0.35), 0 0 60px 15px rgba(255,200,80,0.15)`,
            transform: `rotate(${srand(i * 99) * 20 - 10}deg)`
        }
    })) },
    { id: 'sky-big-stars', speed: 0.45, children: [0,1,2,3,4,5,6,7,8,9,10,11].map(i => ({
        id: `big-${i}`, style: {
            position: 'absolute', left: `${10 + srand(i * 127) * 80}%`, top: `${10 + srand(i * 333) * 65}%`,
            width: '6px', height: '6px', borderRadius: '50%', background: '#fff',
            boxShadow: `0 0 8px 3px rgba(255,255,255,0.8), 0 0 20px 5px rgba(180,200,255,0.4)`,
            animation: `star-pulse ${2 + srand(i * 71) * 2}s ease-in-out infinite ${srand(i * 55) * 3}s`
        }
    })) },
    { id: 'sky-glow', speed: 0.6, style: { background: 'radial-gradient(ellipse at 50% 95%, rgba(100,120,255,0.12) 0%, transparent 50%)' } },
    { id: 'sky-mtn', speed: 0, style: { position: 'absolute', bottom: 0, width: '140%', left: '-20%', height: '30%', background: 'linear-gradient(180deg, #0e0e25 0%, #14142d 50%, #0a0a1e 100%)', clipPath: 'polygon(0% 100%, 0% 45%, 8% 28%, 18% 18%, 30% 25%, 48% 30%, 65% 45%, 82% 55%, 100% 50%, 100% 100%)' } },
    { id: 'sky-ground', speed: 0, style: { position: 'absolute', bottom: 0, width: '100%', height: '8%', background: 'linear-gradient(180deg, #0a0a15 0%, #060610 100%)' } }
];

const FOREST = () => [
    { id: 'for-rays', speed: 0.08, style: { background: 'conic-gradient(from 65% 0%, rgba(255,240,180,0.08) 0%, transparent 15%, rgba(255,255,200,0.04) 30%, transparent 100%)' } },
    { id: 'for-far', speed: 0.18, children: Array.from({length: 12}, (_, i) => ({
        id: `tf-${i}`, style: {
            position: 'absolute', bottom: '15%', left: `${3 + i * 8}%`,
            width: '30px', height: `${55 + srand(i * 77) * 25}px`,
            background: '#071807',
            clipPath: 'polygon(35% 100%, 38% 55%, 30% 35%, 25% 15%, 18% 0%, 82% 0%, 75% 15%, 68% 35%, 35% 100%)',
            opacity: 0.7 + (i / 12) * 0.3
        }
    })) },
    { id: 'for-mid', speed: 0.32, children: Array.from({length: 8}, (_, i) => ({
        id: `tm-${i}`, style: {
            position: 'absolute', bottom: '10%', left: `${8 + i * 11}%`,
            width: '45px', height: `${65 + srand(i * 55) * 30}px`,
            background: '#051505',
            clipPath: 'polygon(38% 100%, 40% 50%, 32% 30%, 22% 10%, 15% 0%, 85% 0%, 78% 10%, 72% 30%, 38% 50%, 38% 100%)',
            opacity: 0.8 + (i / 8) * 0.2
        }
    })) },
    { id: 'for-near', speed: 0.5, children: Array.from({length: 5}, (_, i) => ({
        id: `tn-${i}`, style: {
            position: 'absolute', bottom: '0', left: `${5 + i * 20}%`,
            width: '60px', height: '100%',
            background: 'linear-gradient(180deg, #0a2a0a 0%, #041804 100%)',
            clipPath: 'polygon(42% 100%, 45% 60%, 35% 40%, 25% 15%, 15% 0%, 85% 0%, 80% 15%, 70% 40%, 42% 60%, 42% 100%)',
            opacity: 0.9
        }
    })) },
    { id: 'for-fireflies', speed: 0.6, children: Array.from({length: 15}, (_, i) => ({
        id: `ff-${i}`, style: {
            position: 'absolute',
            left: `${5 + srand(i * 83) * 90}%`, top: `${20 + srand(i * 47) * 55}%`,
            width: '4px', height: '4px', borderRadius: '50%',
            background: '#fef08a',
            boxShadow: '0 0 8px 3px rgba(254,240,138,0.6), 0 0 18px 5px rgba(254,240,138,0.2)',
            animation: `firefly-float ${4 + srand(i * 67) * 3}s ease-in-out infinite ${srand(i * 31) * 5}s`
        }
    })) },
    { id: 'for-ground', speed: 0, style: { position: 'absolute', bottom: 0, width: '100%', height: '12%', background: 'linear-gradient(180deg, #0a1f0a 0%, #051505 100%)' } }
];

const HOUSE = () => [
    { id: 'hou-sky', speed: 0.08, style: { background: 'linear-gradient(180deg, #87ceeb 0%, #60a5fa 40%, #3b82f6 100%)' } },
    { id: 'hou-clouds', speed: 0.15, children: [0,1,2].map(i => ({
        id: `hc-${i}`, style: {
            position: 'absolute', top: `${8 + i * 12}%`, left: `${10 + i * 30}%`,
            width: `${80 + i * 20}px`, height: '30px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.7)', filter: 'blur(8px)', opacity: 0.5
        }
    })) },
    { id: 'hou-hills', speed: 0.25, style: { position: 'absolute', bottom: '15%', width: '140%', left: '-20%', height: '20%', background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)', clipPath: 'polygon(0% 100%, 5% 40%, 15% 20%, 30% 30%, 50% 25%, 70% 35%, 85% 40%, 100% 50%, 100% 100%)' } },
    { id: 'hou-body', speed: 0.4, style: { position: 'absolute', bottom: '12%', left: '35%', width: '30%', height: '40%', background: 'linear-gradient(180deg, #d4a574 0%, #a0845c 100%)', borderRadius: '4px 4px 0 0' } },
    { id: 'hou-roof', speed: 0.42, style: { position: 'absolute', bottom: '50%', left: '33%', width: '34%', height: 0, borderLeft: '17% solid transparent', borderRight: '17% solid transparent', borderBottom: '10px solid #8B5E3C' } },
    { id: 'hou-windows', speed: 0.44, children: [
        { id: 'hw1', style: { position: 'absolute', bottom: '32%', left: '42%', width: '8%', height: '8%', background: 'radial-gradient(circle, rgba(255,200,100,0.9), rgba(255,150,50,0.5) 50%, transparent 70%)', borderRadius: '2px' } },
        { id: 'hw2', style: { position: 'absolute', bottom: '32%', left: '56%', width: '8%', height: '8%', background: 'radial-gradient(circle, rgba(255,200,100,0.9), rgba(255,150,50,0.5) 50%, transparent 70%)', borderRadius: '2px' } }
    ] },
    { id: 'hou-door', speed: 0.44, style: { position: 'absolute', bottom: '12%', left: '47%', width: '6%', height: '12%', background: '#5D4037', borderRadius: '3px 3px 0 0' } },
    { id: 'hou-tree1', speed: 0.55, style: { position: 'absolute', left: '18%', bottom: '12%', fontSize: '28px' }, content: '🌳' },
    { id: 'hou-tree2', speed: 0.6, style: { position: 'absolute', left: '78%', bottom: '12%', fontSize: '24px' }, content: '🌳' },
    { id: 'hou-path', speed: 0.7, style: { position: 'absolute', bottom: '0', left: '30%', width: '40%', height: '12%', background: 'linear-gradient(180deg, #92400e 0%, #78350f 50%, #65300c 100%)', borderRadius: '0' } },
    { id: 'hou-grass', speed: 0, style: { position: 'absolute', bottom: 0, width: '100%', height: '14%', background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)' } }
];

const LANTERNS = () => [
    { id: 'lan-sky', speed: 0.06, style: { background: 'linear-gradient(180deg, #0a0815 0%, #120a20 50%, #0d0818 100%)' } },
    { id: 'lan-stars', speed: 0.1, style: { boxShadow: makeStars(150, 100, 100, 90, '255,200,100') } },
    { id: 'lan-moon', speed: 0.2, style: { position: 'absolute', top: '8%', left: '75%', width: '20px', height: '20px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #fff8e1 0%, #fcd34d 40%, transparent 65%)', boxShadow: '0 0 30px 10px rgba(255,220,100,0.4), 0 0 70px 20px rgba(255,200,80,0.15)' } },
    { id: 'lan-fog1', speed: 0.3, style: { position: 'absolute', bottom: '20%', width: '140%', left: '-20%', height: '40%', background: 'linear-gradient(180deg, transparent 0%, rgba(20,15,30,0.3) 50%, rgba(20,15,30,0.5) 100%)', filter: 'blur(15px)' } },
    { id: 'lan-path', speed: 0.35, style: { position: 'absolute', bottom: '18%', left: '25%', width: '50%', height: '4%', background: 'rgba(180,140,80,0.15)', borderRadius: '2px' } },
    { id: 'lan-lanterns', speed: 0.45, children: [0,1,2,3,4,5,6,7].map(i => ({
        id: `lan-${i}`, style: {
            position: 'absolute', left: `${10 + i * 11}%`, top: `${30 + srand(i * 67) * 35}%`,
            fontSize: '26px',
            filter: `drop-shadow(0 0 ${12 + i * 2}px rgba(255,180,50,0.6)) drop-shadow(0 0 ${25 + i * 4}px rgba(255,150,30,0.25))`,
            animation: `lantern-sway ${3 + srand(i * 43) * 2}s ease-in-out infinite ${srand(i * 77) * 2}s`
        }, content: '🏮'
    })) },
    { id: 'lan-fog2', speed: 0.6, style: { position: 'absolute', bottom: '10%', width: '140%', left: '-20%', height: '30%', background: 'linear-gradient(180deg, transparent 0%, rgba(20,10,30,0.4) 40%, rgba(10,5,20,0.6) 100%)', filter: 'blur(20px)' } },
    { id: 'lan-ground', speed: 0, style: { position: 'absolute', bottom: 0, width: '100%', height: '18%', background: 'linear-gradient(180deg, #1a1208 0%, #120e06 100%)' } }
];

const GARDEN = () => [
    { id: 'gar-sky', speed: 0.08, style: { background: 'linear-gradient(180deg, #87CEEB 0%, #6CB4EE 30%, #FFB7C5 100%)' } },
    { id: 'gar-clouds', speed: 0.15, children: [0,1].map(i => ({ id: `gc-${i}`, style: { position: 'absolute', top: `${6 + i * 18}%`, left: `${15 + i * 35}%`, width: '100px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', filter: 'blur(6px)', opacity: 0.5 } })) },
    { id: 'gar-flowers', speed: 0.3, children: Array.from({length: 40}, (_, i) => ({
        id: `gf-${i}`, style: {
            position: 'absolute', left: `${srand(i * 59) * 96}%`, bottom: `${25 + srand(i * 400) * 45}%`,
            fontSize: `${10 + srand(i * 800) * 8}px`,
            animation: `garden-sway ${3 + srand(i * 71) * 3}s ease-in-out infinite ${srand(i * 31) * 4}s`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15)'
        }, content: ['🌸', '🌺', '🌻', '🌷', '🌼', '💐', '🌹', '🌱'][i % 8]
    })) },
    { id: 'gar-butterflies', speed: 0.5, children: Array.from({length: 6}, (_, i) => ({
        id: `gb-${i}`, style: {
            position: 'absolute', left: `${10 + srand(i * 73) * 80}%`, top: `${15 + srand(i * 47) * 55}%`,
            fontSize: '18px',
            animation: `butterfly-path ${8 + i * 3}s ease-in-out infinite ${i * 2}s`,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))'
        }, content: '🦋'
    })) },
    { id: 'gar-fountain', speed: 0.35, style: { position: 'absolute', left: '45%', bottom: '20%', width: '10%', height: '15%', background: 'radial-gradient(ellipse, rgba(100,200,255,0.5) 0%, rgba(150,220,255,0.3) 40%, transparent 70%)', borderRadius: '40%', boxShadow: '0 0 30px 10px rgba(100,200,255,0.2)' } },
    { id: 'gar-ground', speed: 0, style: { position: 'absolute', bottom: 0, width: '100%', height: '20%', background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 40%, #16a34a 100%)' } }
];

const LIBRARY = () => [
    { id: 'lib-wall', speed: 0, style: { width: '100%', height: '100%', background: 'linear-gradient(180deg, #2a1810 0%, #3d2515 100%)' } },
    { id: 'lib-shelf1', speed: 0.08, style: { position: 'absolute', top: '10%', left: '10%', width: '35%', height: '55%', background: 'linear-gradient(180deg, #3d2515 0%, #4a3020 100%)', boxShadow: 'inset 0 -2px 8px rgba(0,0,0,0.5), inset 0 2px 8px rgba(0,0,0,0.2)' } },
    { id: 'lib-shelf2', speed: 0.1, style: { position: 'absolute', top: '15%', left: '55%', width: '35%', height: '50%', background: 'linear-gradient(180deg, #4a3020 0%, #5d3d28 100%)', boxShadow: 'inset 0 -2px 8px rgba(0,0,0,0.5), inset 0 2px 8px rgba(0,0,0,0.2)' } },
    { id: 'lib-books1', speed: 0.15, children: Array.from({length: 12}, (_, i) => ({ style: { position: 'absolute', top: '12%', left: `${12 + srand(i * 23) * 2}%`, width: '3%', height: '12%', background: ['#c0392b','#2563eb','#dc2626','#059669','#d97706','#7c3aed','#db2777','#ea580c','#65a30d','#0891b2','#059669','#16a34a','#059669'][i % 12], borderRadius: '1px', boxShadow: '1px 2px 4px rgba(0,0,0,0.3)' } })) },
    { id: 'lib-books2', speed: 0.18, children: Array.from({length: 10}, (_, i) => ({ style: { position: 'absolute', top: '17%', left: `${56 + srand(i * 29) * 2.5}%`, width: '3%', height: '10%', background: ['#c0392b','#2563eb','#dc2626','#059669','#d97706','#7c3aed','#db2777','#ea580c','#65a30d','#0891b2','#059669'][i % 10], borderRadius: '1px', boxShadow: '1px 2px 4px rgba(0,0,0,0.3)' } })) },
    { id: 'lib-lamp', speed: 0.25, style: { position: 'absolute', top: '0', left: '46%', width: '8%', height: '15%', background: 'radial-gradient(ellipse, rgba(255,200,100,0.9) 0%, rgba(200,150,50,0.4) 40%, transparent 65%)', filter: 'blur(2px)' } },
    { id: 'lib-lamp2', speed: 0.28, style: { position: 'absolute', top: '0', left: '53%', width: '6%', height: '12%', background: 'radial-gradient(ellipse, rgba(255,200,100,0.8) 0%, rgba(200,150,50,0.3) 40%, transparent 65%)', filter: 'blur(2px)' } },
    { id: 'lib-carpet', speed: 0, style: { position: 'absolute', bottom: 0, width: '80%', left: '10%', height: '12%', background: 'linear-gradient(180deg, #7c2d12 0%, #5c2210 100%)', borderRadius: '2px' } },
    { id: 'lib-chair', speed: 0, style: { position: 'absolute', bottom: '10%', left: '15%', fontSize: '32px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }, content: '🪑' },
    { id: 'lib-plant', speed: 0, style: { position: 'absolute', bottom: '10%', right: '18%', fontSize: '24px' }, content: '🪴' }
];

const MOUNTAIN = () => [
    { id: 'mnt-sky', speed: 0.06, style: { background: 'linear-gradient(180deg, #4a5568 0%, #2d3748 40%, #1a1a2e 100%)' } },
    { id: 'mnt-clouds', speed: 0.1, children: [0,1].map(i => ({ style: { position: 'absolute', top: `${5 + i * 15}%`, left: `${20 + i * 40}%`, width: '120px', height: '25px', borderRadius: '50%', background: 'rgba(255,255,255,0.5)', filter: 'blur(6px)', opacity: 0.4 } })) },
    { id: 'mnt-snow', speed: 0.15, style: { position: 'absolute', top: 0, width: '100%', height: '100%', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)' } },
    { id: 'mnt-far', speed: 0.25, style: { position: 'absolute', bottom: '20%', width: '140%', left: '-20%', height: '35%', background: 'linear-gradient(180deg, #374151 0%, #2d3748 100%)', clipPath: 'polygon(0% 100%, 0% 45%, 8% 25%, 20% 15%, 35% 10%, 55% 18%, 75% 35%, 90% 50%, 100% 55%, 100% 100%)' } },
    { id: 'mnt-mid', speed: 0.35, style: { position: 'absolute', bottom: '10%', width: '140%', left: '-20%', height: '30%', background: 'linear-gradient(180deg, #4b5563 0%, #374151 100%)', clipPath: 'polygon(0% 100%, 3% 50%, 10% 28%, 22% 12%, 38% 8%, 55% 20%, 72% 35%, 88% 50%, 100% 60%, 100% 100%)' } },
    { id: 'mnt-near', speed: 0.5, style: { position: 'absolute', bottom: '0%', width: '140%', left: '-20%', height: '25%', background: 'linear-gradient(180deg, #5a6577 0%, #4b5563 100%)', clipPath: 'polygon(0% 100%, 5% 55%, 12% 30%, 25% 15%, 40% 8%, 60% 5%, 78% 20%, 92% 45%, 100% 55%, 100% 100%)' } },
    { id: 'mnt-path', speed: 0.6, style: { position: 'absolute', bottom: '2%', left: '42%', width: '16%', height: '3%', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' } },
    { id: 'mnt-ground', speed: 0, style: { position: 'absolute', bottom: 0, width: '100%', height: '10%', background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)' } }
];

const OASIS = () => [
    { id: 'oas-sky', speed: 0.06, style: { background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 30%, #fbbf24 100%)' } },
    { id: 'oas-sun', speed: 0.12, style: { position: 'absolute', top: '5%', right: '15%', width: '60px', height: '60px', borderRadius: '50%', background: 'radial-gradient(circle, #fff7ed 0%, #fcd34d 30%, #f59e0b 60%, transparent 70%)', boxShadow: '0 0 60px 20px rgba(251,191,36,0.5)' } },
    { id: 'oas-dunes-far', speed: 0.18, style: { position: 'absolute', bottom: '22%', width: '140%', left: '-20%', height: '40%', background: 'linear-gradient(180deg, #d4a76a 0%, #c2956a 100%)', clipPath: 'polygon(0% 100%, 0% 60%, 8% 40%, 20% 25%, 35% 15%, 55% 8%, 75% 18%, 90% 30%, 100% 45%, 100% 100%)' } },
    { id: 'oas-dunes-mid', speed: 0.28, style: { position: 'absolute', bottom: '15%', width: '140%', left: '-20%', height: '35%', background: 'linear-gradient(180deg, #c2956a 0%, #a67c52 100%)', clipPath: 'polygon(0% 100%, 0% 55%, 10% 35%, 25% 18%, 45% 8%, 65% 15%, 80% 22%, 95% 38%, 100% 55%, 100% 100%)' } },
    { id: 'oas-palms', speed: 0.4, children: [0,1,2,3,4].map(i => ({ id: `palm-${i}`, style: { position: 'absolute', left: `${5 + i * 22}%`, bottom: '15%', fontSize: '36px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }, content: '🌴' })) },
    { id: 'oas-pool', speed: 0.35, style: { position: 'absolute', left: '30%', bottom: '18%', width: '40%', height: '18%', background: 'radial-gradient(ellipse at 50% 60%, rgba(100,200,220,0.5) 0%, rgba(150,220,240,0.3) 40%, transparent 70%)', borderRadius: '40%', boxShadow: '0 0 25px 10px rgba(100,200,220,0.2)' } },
    { id: 'oas-ground', speed: 0, style: { position: 'fixed', bottom: 0, width: '100%', height: '15%', background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 40%, #16a34a 100%)' } }
];

const SHIP = () => [
    { id: 'shp-sky', speed: 0.06, style: { background: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 30%, #0c4a6e 100%)' } },
    { id: 'shp-clouds', speed: 0.12, children: [0,1,2].map(i => ({ style: { position: 'absolute', top: `${4 + i * 10}%`, left: `${15 + i * 35}%`, width: `${80 + i * 25}px`, height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', filter: 'blur(5px)', opacity: 0.5 } })) },
    { id: 'shp-sun', speed: 0.15, style: { position: 'absolute', top: '3%', right: '20%', width: '50px', height: '50px', borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #fef08a 30%, transparent 60%)', boxShadow: '0 0 40px 15px rgba(254,240,138,0.6)' } },
    { id: 'shp-ocean-far', speed: 0.22, style: { position: 'absolute', bottom: '25%', width: '140%', left: '-20%', height: '35%', background: 'linear-gradient(180deg, #0c4a6e 0%, #0ea5e9 50%, #38bdf8 100%)' } },
    { id: 'shp-wave1', speed: 0.35, style: { position: 'absolute', bottom: '22%', width: '140%', left: '-20%', height: '8%', background: 'rgba(56,189,248,0.15)', borderRadius: '50% 50% 0 0 / 100% 50% 0', animation: 'wave-drift 6s ease-in-out infinite' } },
    { id: 'shp-wave2', speed: 0.4, style: { position: 'absolute', bottom: '18%', width: '140%', left: '-20%', height: '6%', background: 'rgba(56,189,248,0.12)', borderRadius: '50% 50% 0 0 / 100% 50% 0', animation: 'wave-drift 8s ease-in-out infinite reverse' } },
    { id: 'shp-ship', speed: 0.55, style: { position: 'absolute', bottom: '18%', left: '35%', fontSize: '48px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }, content: '⛵' },
    { id: 'shp-deck', speed: 0.58, style: { position: 'absolute', bottom: '15%', left: '30%', width: '40%', height: '8%', background: 'linear-gradient(180deg, #8B6914 0%, #6B5310 100%)', borderRadius: '4px 4px 0 0' } },
    { id: 'shp-railing', speed: 0.62, children: [
        { style: { position: 'absolute', bottom: '15%', left: '31%', width: '2px', height: '12%', background: '#8B6914' } },
        { style: { position: 'absolute', bottom: '15%', left: '69%', width: '2px', height: '12%', background: '#8B6914' } }
    ] },
    { id: 'shp-birds', speed: 0.5, children: [0,1,2].map(i => ({
        id: `bird-${i}`, style: {
            position: 'absolute', fontSize: '14px',
            left: '0%', animation: `bird-fly ${10 + i * 3}s linear infinite`,
            animationDelay: `${i * 4}s`,
            top: `${15 + i * 5}%`
        }, content: '🐦'
    })) },
    { id: 'shp-ground', speed: 0, style: { position: 'absolute', bottom: 0, width: '100%', height: '15%', background: 'linear-gradient(180deg, #0c4a6e 0%, #072a4e 100%)' } }
];

const CITY = () => [
    { id: 'cit-sky', speed: 0.06, style: { background: 'linear-gradient(180deg, #1e293b 0%, #334155 40%, #1f2937 100%)' } },
    { id: 'cit-sunset', speed: 0.1, style: { position: 'absolute', bottom: '35%', width: '140%', left: '-20%', height: '25%', background: 'linear-gradient(180deg, transparent 0%, rgba(255,100,50,0.15) 30%, rgba(255,150,50,0.08) 60%, transparent 100%)' } },
    { id: 'cit-far', speed: 0.18, style: { position: 'absolute', bottom: '15%', width: '140%', left: '-20%', height: '45%', background: 'linear-gradient(180deg, #1f2937 0%, #1f2937 100%)', clipPath: 'polygon(0% 100%, 0% 60%, 3% 45%, 8% 35%, 15% 22%, 25% 12%, 38% 5%, 55% 2%, 72% 15%, 88% 30%, 95% 50%, 100% 55%, 100% 100%)' } },
    { id: 'cit-mid', speed: 0.28, style: { position: 'absolute', bottom: '10%', width: '140%', left: '-20%', height: '40%', background: 'linear-gradient(180deg, #253545 0%, #1f2937 100%)', clipPath: 'polygon(0% 100%, 0% 50%, 4% 38%, 10% 25%, 18% 15%, 28% 8%, 42% 5%, 58% 2%, 75% 15%, 88% 35%, 95% 50%, 100% 55%, 100% 100%)' } },
    { id: 'cit-near', speed: 0.4, style: { position: 'absolute', bottom: '0%', width: '140%', left: '-20%', height: '30%', background: 'linear-gradient(180deg, #374151 0%, #2d3748 100%)', clipPath: 'polygon(0% 100%, 2% 60%, 6% 42%, 12% 25%, 20% 12%, 30% 5%, 42% -2%, 55% -5%, 70% 8%, 85% 20%, 95% 45%, 100% 60%, 100% 100%)' } },
    { id: 'cit-windows', speed: 0.42, children: Array.from({length: 40}, (_, i) => {
        const seed = i * 47 + 1;
        return { style: { position: 'absolute', left: `${srand(seed) * 96}%`, bottom: `${30 + srand(seed + 200) * 50}%`, width: '2px', height: '2px', background: Math.random() > 0.3 ? '#fbbf24' : '#fef3c7', opacity: 0.3 + srand(seed + 400) * 0.7, boxShadow: Math.random() > 0.3 ? '0 0 6px 2px rgba(251,191,36,0.5)' : 'none', animation: `window-flicker ${2 + srand(seed + 600) * 3}s ease-in-out infinite ${srand(seed + 700) * 2}s` } };
    }) },
    { id: 'cit-mosque', speed: 0.35, style: { position: 'absolute', left: '40%', bottom: '12%', fontSize: '30px', filter: 'drop-shadow(0 0 15px rgba(255,200,100,0.5))' }, content: '🕌' },
    { id: 'cit-ground', speed: 0, style: { position: 'absolute', bottom: 0, width: '100%', height: '12%', background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)' } }
];

// ═════════════════════════════════════════════════════════
// THEMES OBJECT (AFTER all functions)
// ═════════════════════════════════════════════════════
const THEMES = { sky: SKY, forest: FOREST, house: HOUSE, lanterns: LANTERNS, garden: GARDEN, library: LIBRARY, mountain: MOUNTAIN, oasis: OASIS, ship: SHIP, city: CITY };

export default function ImmersiveView({ themeId, streak, onClose }) {
    
    const [currentX, setCurrentX] = useState(0);
    const [visible, setVisible] = useState(false);
    const animRef = useRef(null);
    const velRef = useRef(0);
    const targetRef = useRef(0);
    const keysRef = useRef({});
    const touchRef = useRef({ startX: 0 });

    const sceneTheme = THEMES[themeId] || THEMES.sky;
    const theme = getTheme(themeId);
    const layers = useMemo(() => sceneTheme(), [sceneTheme]);

    useEffect(() => {
    if (!visible) return;

    let animId;

    const animate = () => {
        const tgt = targetRef.current;

        setCurrentX(prev => {
            let vel = velRef.current;

            vel += (tgt - prev) * 0.055;
            vel *= 0.9;

            if (Math.abs(vel) < 0.05 && Math.abs(tgt - prev) < 0.05) {
                vel = 0;
            }

            velRef.current = vel;

            return prev + vel;
        });

        animId = requestAnimationFrame(animate);
        animRef.current = animId;
    };

    animate();

    return () => {
        if (animRef.current) {
            cancelAnimationFrame(animRef.current);
        }
    };
}, [visible, themeId]);

    useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);

    return () => clearTimeout(timer);
}, []);

    useEffect(() => {
        const SPEED = 60;
        const onKeyDown = (e) => { keysRef.current[e.key] = true; if (e.key === 'ArrowRight') targetRef.current = Math.min(targetRef.current + SPEED, 400); else if (e.key === 'ArrowLeft') targetRef.current = Math.max(targetRef.current - SPEED, -400); };
        const onKeyUp = (e) => { delete keysRef.current[e.key]; if (!Object.keys(keysRef.current).length) targetRef.current = currentX; };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
    }, []);

    const handleTouchStart = (e) => { touchRef.current.startX = e.touches[0].clientX; };
    const handleTouchMove = (e) => {
        e.preventDefault();
        const dx = e.touches[0].clientX - touchRef.current.startX;
        targetRef.current = Math.max(-400, Math.min(targetRef.current + dx * 0.6, 400));
    };

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 400);
    };
    if (!theme) return null;
    const milestone = (theme.milestones || []).reduce(
    (best, m) => streak >= m.days ? m : best,
    theme.milestones?.[0] || { emoji: '🌑', label: 'Beginning' }
    );
    const next = (theme.milestones || []).find(m => streak < m.days);

    return (
        <div className={`immersive-overlay ${visible ? 'immersive-enter' : ''}`}>
            <div className="immersive-scene">
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        className="immersive-layer"
                        style={{
                            ...layer.style,
                            transform: `translateX(${currentX * layer.speed}px)`,
                            willChange: 'transform'
                        }}
                    >
                        {layer.children?.map(child => (
                            <div
                                key={child.id}
                                style={child.style}
                                >
                                {child.content}
                            </div>
                        ))}
                    </div>
                ))}

                <div className="immersive-vignette" />
                <div className="immersive-grain" />

                <div className="immersive-hud">
                    <button className="immersive-close" onClick={handleClose} title="Close (Esc)">✕</button>
                    
                    <div className="immersive-hud-left">
                        <span className="hud-icon">{theme.icon}</span>
                        <span className="hud-name">{theme.name}</span>
                    </div>

                    <div className="immersive-hud-center">
                        <div className="hud-streak">{streak} Day{streak !== 1 ? 's' : ''}</div>
                        <div className="hud-milestone">{milestone.emoji} {milestone.label}</div>
                    </div>

                    <div className="immersive-hud-right">
                        {next && (
                            <div className="hud-next">
                                <span>{next.emoji} {next.days}d</span>
                            </div>
                        )}
                        <div className="hud-tagline">{theme.tagline}</div>
                    </div>
                </div>

                <div className="immersive-controls-hint">
                    ← → to explore · Esc to close
                </div>

                <div
                    className="immersive-touch-area"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => { if (!Object.keys(keysRef.current).length) targetRef.current = currentX; }}
                />
            </div>
        </div>
    );
}
