// C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\utils\sceneHelpers.js

/**
 * Deterministic seeded random - never use Math.random in render
 */
export const srand = (seed) => {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
};

/**
 * Generate star shadows for CSS box-shadow
 */
export const makeStars = (
    count,
    seedBase = 0,
    width = 100,
    height = 100,
    color = '255,255,255',
    minSize = 1,
    maxSize = 2
) => {
    const shadows = [];
    for (let i = 0; i < count; i++) {
        const s = (seedBase + i) * 37 + 7;
        const x = (srand(s) * width).toFixed(2);
        const y = (srand(s + 500) * height).toFixed(2);
        const size = minSize + srand(s + 1000) * (maxSize - minSize);
        const alpha = (0.3 + srand(s + 2000) * 0.7).toFixed(2);
        shadows.push(`${x}vw ${y}vh 0 ${size}px rgba(${color},${alpha})`);
    }
    return shadows.join(',');
};

/**
 * Generate array of children with random positions
 */
export const generateArray = (count, seedBase, createStyle) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `item-${seedBase}-${i}`,
        style: createStyle(i, seedBase)
    }));
};

/**
 * Common layer presets
 */
export const LAYER_PRESETS = {
    // Full-width background for parallax (prevents gaps)
    fullBackground: (gradient) => ({
        speed: 0,
        style: { background: gradient, width: '140%', left: '-20%' }
    }),

    // Stars layer
    stars: (count, seed = 0, height = 100) => ({
        speed: 0.08,
        style: {
            position: 'absolute', inset: 0,
            width: '2px', height: '2px',
            boxShadow: makeStars(count, seed, 140, height)
        }
    }),

    // Moon
    moon: (top, left, size = 50) => ({
        speed: 0.15,
        style: {
            position: 'absolute', top, left,
            width: `${size}px`, height: `${size}px`, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fffde8 0%, #fef3c7 50%, #fcd34d 70%, transparent 85%)',
            boxShadow: `0 0 ${size * 0.6}px ${size * 0.3}px rgba(255,220,100,0.5), 0 0 ${size * 1.2}px ${size * 0.6}px rgba(255,200,80,0.2)`
        }
    }),

    // Ground
    ground: (height = 15, gradient) => ({
        speed: 0,
        style: {
            position: 'absolute', bottom: 0, width: '140%', left: '-20%', height: `${height}%`,
            background: gradient
        }
    }),

    // Cloud
    cloud: (top, left, width = 150, opacity = 0.7) => ({
        id: `cloud-${top}-${left}`,
        style: {
            position: 'absolute', top, left,
            width: `${width}px`, height: `${width * 0.3}px`,
            borderRadius: '50px',
            background: `rgba(255,255,255,${opacity})`,
            filter: 'blur(8px)'
        }
    }),

    // Emoji element
    emoji: (id, content, bottom, left, size = 40, dropShadow = '0 4px 8px rgba(0,0,0,0.3)') => ({
        id,
        style: {
            position: 'absolute', bottom, left,
            fontSize: `${size}px`,
            lineHeight: 1,
            filter: `drop-shadow(${dropShadow})`
        },
        content
    }),

    // Animated emoji
    animatedEmoji: (id, content, bottom, left, size, animation, dropShadow, delay = 0) => ({
        id,
        style: {
            position: 'absolute', bottom, left,
            fontSize: `${size}px`,
            lineHeight: 1,
            filter: `drop-shadow(${dropShadow})`,
            animation: `${animation} ${3 + delay}s ease-in-out infinite ${delay}s`,
            transformOrigin: 'top center'
        },
        content
    }),

    // Light glow effect
    glowPool: (id, left, bottom, width = 8, height = 10, color = '255,140,20') => ({
        id,
        style: {
            position: 'absolute', left, bottom,
            width: `${width}%`, height: `${height}%`,
            background: `radial-gradient(ellipse, rgba(${color},0.15) 0%, transparent 70%)`,
            filter: 'blur(8px)'
        }
    })
};

// C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\utils\sceneHelpers.js

// ... existing code ...

/**
 * STAR HELPERS for Celestial Sky theme
 */

// Star shape clip-path (5-pointed star)
const STAR_SHAPE = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';

/**
 * Generate background stars (tiny, organic, random)
 */
export const generateBgStars = (count, seed = 0) => {
    const shadows = [];
    for (let i = 0; i < count; i++) {
        const s = (seed + i) * 37 + 7;
        const x = (srand(s) * 200 - 50).toFixed(2);
        const y = (srand(s + 500) * 200 - 50).toFixed(2);
        const size = 1 + srand(s + 1000) * 2;
        const alpha = (0.2 + srand(s + 2000) * 0.6).toFixed(2);
        shadows.push(`${x}vh ${y}vh 0 ${size}px rgba(220,230,255,${alpha})`);
    }
    return shadows.join(',');
};

/**
 * Generate a single star element (star-shaped)
 */
export const createStarElement = (id, left, top, size, brightness, delay = 0) => ({
    id,
    style: {
        position: 'absolute',
        left,
        top,
        width: `${size}px`,
        height: `${size}px`,
        clipPath: STAR_SHAPE,
        background: `radial-gradient(circle, rgba(255,255,255,${brightness}) 0%, rgba(200,220,255,${brightness * 0.7}) 50%, transparent 100%)`,
        boxShadow: `0 0 ${size * 2}px ${size * 0.5}px rgba(200,220,255,${brightness * 0.3})`,
        animation: `star-twinkle ${2 + delay * 0.5}s ease-in-out infinite ${delay}s`
    }
});

/**
 * Generate milestone stars (unlocked by consistency)
 */
export const generateMilestoneStars = (streak) => {
    const stars = [];
    const maxStars = Math.min(streak, 365);
    
    for (let i = 0; i < maxStars; i++) {
        const angle = (i / maxStars) * Math.PI * 2;
        const radius = 20 + Math.sqrt(i) * 15;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        const size = 6 + (i % 5) * 2;
        const brightness = 0.6 + (i % 3) * 0.2;
        
        stars.push(createStarElement(
            `milestone-${i}`,
            `${x}%`,
            `${y}%`,
            size,
            brightness,
            i * 0.3
        ));
    }
    
    return stars;
};

/**
 * Generate constellation data (28 days milestone)
 */
export const generateConstellation = () => {
    // Define constellation shape (like Orion)
    const points = [
        { id: 'c1', x: 25, y: 35 },
        { id: 'c2', x: 35, y: 30 },
        { id: 'c3', x: 45, y: 28 },
        { id: 'c4', x: 55, y: 32 },
        { id: 'c5', x: 65, y: 38 },
        { id: 'c6', x: 40, y: 45 },
        { id: 'c7', x: 50, y: 50 }
    ];
    
    const elements = [];
    
    // Stars at each point
    points.forEach((p, i) => {
        elements.push(createStarElement(
            `const-star-${p.id}`,
            `${p.x}%`,
            `${p.y}%`,
            10 + (i % 3) * 3,
            0.9,
            i * 0.4
        ));
    });
    
    // Connecting lines
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        // Calculate line length and angle
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        elements.push({
            id: `const-line-${i}`,
            style: {
                position: 'absolute',
                left: `${p1.x}%`,
                top: `${p1.y}%`,
                width: `${length}%`,
                height: '1.5px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(200,220,255,0.3))',
                transformOrigin: '0 50%',
                transform: `rotate(${angle}deg)`,
                boxShadow: '0 0 4px 2px rgba(200,220,255,0.4)',
                animation: `constellation-draw 2s ease-out forwards ${i * 0.3}s`,
                opacity: 0
            }
        });
    }
    
    return elements;
};

/**
 * Generate multiple constellations across the sky
 */
export const generateConstellations = (count = 1) => {
    const constellations = [];
    const baseShapes = [
        [{ x: 18, y: 25 }, { x: 28, y: 20 }, { x: 35, y: 28 }, { x: 42, y: 22 }, { x: 50, y: 30 }],
        [{ x: 10, y: 55 }, { x: 18, y: 48 }, { x: 26, y: 52 }, { x: 34, y: 46 }, { x: 42, y: 54 }],
        [{ x: 60, y: 15 }, { x: 68, y: 12 }, { x: 75, y: 20 }, { x: 83, y: 18 }, { x: 90, y: 25 }],
        [{ x: 65, y: 45 }, { x: 72, y: 40 }, { x: 79, y: 47 }, { x: 86, y: 42 }, { x: 92, y: 50 }]
    ];

    const normalize = (point, offsetX, offsetY, scale) => ({
        x: offsetX + (point.x - 50) * scale,
        y: offsetY + (point.y - 50) * scale
    });

    for (let i = 0; i < Math.min(count, 12); i++) {
        const shape = baseShapes[i % baseShapes.length];
        const offsetX = 10 + (i % 4) * 22;
        const offsetY = 10 + Math.floor(i / 4) * 24;
        const scale = 0.75 + (i % 3) * 0.12;
        const idPrefix = `const-${i}`;

        const points = shape.map((point) => normalize(point, offsetX, offsetY, scale));

        points.forEach((p, j) => {
            const size = 8 + (j % 2) * 3;
            const brightness = 0.85 + (j % 3) * 0.1;
            const delay = (i + j) * 0.2;
            constellations.push(createStarElement(
                `${idPrefix}-star-${j}`,
                `${p.x}%`,
                `${p.y}%`,
                size,
                brightness,
                delay
            ));
        });

        for (let j = 0; j < points.length - 1; j++) {
            const p1 = points[j];
            const p2 = points[j + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            constellations.push({
                id: `${idPrefix}-line-${j}`,
                style: {
                    position: 'absolute',
                    left: `${p1.x}%`,
                    top: `${p1.y}%`,
                    width: `${length}%`,
                    height: '2px',
                    background: 'linear-gradient(90deg, rgba(100,200,255,0.7), rgba(200,220,255,0.5))',
                    transformOrigin: '0 50%',
                    transform: `rotate(${angle}deg)`,
                    opacity: 1,
                    filter: 'drop-shadow(0 0 3px rgba(100,200,255,0.6))'
                }
            });
        }
    }

    return constellations;
};

/**
 * Generate shooting star elements
 */
export const generateShootingStars = (count, seed = 0) => {
    return Array.from({ length: count }, (_, i) => {
        const s = (seed + i) * 47 + 1;
        const top = 5 + srand(s) * 40;
        const left = 5 + srand(s + 200) * 60;
        const angle = -20 + srand(s + 300) * 40;
        const duration = 3 + srand(s + 400) * 3;
        
        return {
            id: `shooting-${i}`,
            speed: 0.25 + i * 0.05,
            style: {
                position: 'absolute',
                top: `${top}%`,
                left: `${left}%`,
                width: `${100 + i * 20}px`,
                height: '2px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 30%, rgba(200,220,255,0.6) 60%, transparent 100%)',
                transform: `rotate(${angle}deg)`,
                animation: `shooting-star-move ${duration}s linear infinite ${i * 4}s`,
                opacity: 0.9
            }
        };
    });
};

// ══════════════════════════════════════════════════════════════
// FOREST HELPERS
// ══════════════════════════════════════════════════════════════

/**
 * Generate plant elements based on streak (daily progression)
 */
export const generateForestPlants = (streak) => {
    const plants = [];
    const FLOWERS = ['🌸', '🌺', '🌻', '🌷', '🌼', '🌹', '💐', '🍀', '🌿', '🌱'];
    const MUSHROOMS = ['🍄'];
    
    for (let i = 0; i < streak; i++) {
        const s = i * 37 + 77;
        const plantType = i < streak * 0.6 ? 'flower' : (Math.random() < 0.15 ? 'mushroom' : 'flower');
        
        plants.push({
            id: `plant-${i}`,
            style: {
                position: 'absolute',
                left: `${(srand(s) * 90 + 5)}%`,
                bottom: `${(srand(s + 500) * 35 + 5)}%`,
                fontSize: `${14 + srand(s + 1000) * 10}px`,
                lineHeight: 1,
                transformOrigin: 'bottom center',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                animation: `plant-grow 2s ease-out forwards ${i * 0.1}s`,
                opacity: 0
            },
            content: plantType === 'mushroom' ? MUSHROOMS[0] : FLOWERS[Math.floor(srand(s + 200) * FLOWERS.length)]
        });
    }
    return plants;
};

/**
 * Generate tree elements (every 7 days)
 */
export const generateForestTrees = (streak) => {
    const trees = [];
    const treeCount = Math.min(Math.floor(streak / 7), 20);
    const TREE_TYPES = ['🌳', '🌲', '🌴', '🎄', '🌳'];
    const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍐'];
    
    for (let i = 0; i < treeCount; i++) {
        const s = (i * 73 + 13) * 7;
        const treeType = TREE_TYPES[i % TREE_TYPES.length];
        const hasFruit = i >= 3;
        
        trees.push({
            id: `tree-${i}`,
            style: {
                position: 'absolute',
                left: `${srand(s) * 85 + 5}%`,
                bottom: `${(srand(s + 500) * 40 + 10)}%`,
                fontSize: `${45 + srand(s + 1000) * 35}px`,
                lineHeight: 1,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                animation: `tree-appear 3s ease-out forwards ${i * 0.2}s`,
                opacity: 0
            },
            content: treeType
        });
        
        // Fruit hanging from tree (after day 21)
        if (hasFruit) {
            trees.push({
                id: `fruit-${i}`,
                style: {
                    position: 'absolute',
                    left: `${srand(s + 1500) * 85 + 5}%`,
                    bottom: `${(srand(s + 2000) * 40 + 30)}%`,
                    fontSize: '18px',
                    lineHeight: 1,
                    animation: `fruit-sway ${2 + srand(s + 2500) * 2}s ease-in-out infinite ${srand(s + 3000) * 2}s`,
                    opacity: 0
                },
                content: FRUITS[Math.floor(srand(s + 1800) * FRUITS.length)]
            });
        }
    }
    return trees;
};

/**
 * Generate animal elements (one per month, 12 total)
 */
export const generateForestAnimals = (streak) => {
    const ANIMALS = [
        { emoji: '🦌', name: 'Deer', day: 1 },
        { emoji: '🦊', name: 'Fox', day: 30 },
        { emoji: '🐘', name: 'Elephant', day: 60 },
        { emoji: '🦉', name: 'Owl', day: 90 },
        { emoji: '🐢', name: 'Turtle', day: 120 },
        { emoji: '🐰', name: 'Rabbit', day: 150 },
        { emoji: '🦋', name: 'Squirrel', day: 180 },
        { emoji: '🦋', name: 'Rabbit2', day: 210 },
        { emoji: '🦋', name: 'Rabbit3', day: 240 },
        { emoji: '🐟', name: 'Fish', day: 270 },
        { emoji: '🦁️', name: 'Lion', day: 300 },
        { emoji: '🦎', name: 'Squirrel2', day: 330 }
    ];
    
    const animals = [];
    
    ANIMALS.forEach((animal, idx) => {
        if (streak >= animal.day) {
            const s = (animal.day + idx) * 47 + 1;
            const animId = `animal-${idx}`;
            
            // Create 2-3 instances of each animal at different positions
            for (let j = 0; j < 2 + Math.floor(srand(s) * 2); j++) {
                animals.push({
                    id: `${animId}-${j}`,
                    style: {
                        position: 'absolute',
                        left: `${srand(s + j * 100) * 85 + 5}%`,
                        bottom: `${srand(s + j * 200) * 40 + 10}%`,
                        fontSize: '40px',
                        lineHeight: 1,
                        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
                        animation: `animal-idle-${idx} ${4 + srand(s + j * 300) * 3}s ease-in-out infinite ${srand(s + j * 400) * 3}s`
                    },
                    content: animal.emoji
                });
            }
        }
    });
    
    return animals;
};

/**
 * Generate lake elements (6 months = 180 days)
 */
export const generateLakeElements = () => [
    // Lake water surface
    {
        id: 'lake-surface',
        speed: 0.25,
        style: {
            position: 'absolute',
            left: '20%', bottom: '8%',
            width: '60%', height: '15%',
            background: 'linear-gradient(180deg, rgba(30,100,150,0.5) 0%, rgba(20,80,120,0.6) 50%, rgba(15,60,100,0.4) 100%)',
            borderRadius: '40% 40% 5% 5%',
            boxShadow: '0 0 40px 20px rgba(50,200,150,0.3), inset 0 0 30px 15px rgba(30,150,200,0.2)',
            border: '1px solid rgba(100,200,150,0.15)',
            animation: 'lake-shimmer 4s ease-in-out infinite'
        }
    },
    // Lily pads
    {
        id: 'lily-pads',
        speed: 0.26,
        children: Array.from({ length: 6 }, (_, i) => {
            const s = i * 31 + 5;
            return {
                id: `lily-${i}`,
                style: {
                    position: 'absolute',
                    left: `${25 + i * 10}%`,
                    bottom: `${9 + Math.sin(i * 1.2) * 2}%`,
                    fontSize: '22px',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                    animation: `lily-float ${3 + i * 0.5}s ease-in-out infinite ${i * 0.4}s`
                },
                content: '🪷'
            };
        })
    },
    // Water ripples
    {
        id: 'water-ripples',
        speed: 0.27,
        children: Array.from({ length: 4 }, (_, i) => ({
            id: `ripple-${i}`,
            style: {
                position: 'absolute',
                left: `${30 + i * 10}%`,
                bottom: `${10 + i * 2}%`,
                width: `${30 + i * 15}px`,
                height: '8px',
                borderRadius: '50%',
                border: '1px solid rgba(100,200,150,0.2)',
                animation: `ripple-expand ${3 + i}s ease-out infinite ${i * 1.5}s`
            }
        }))
    }
];

/**
 * Generate Tree of Life elements (1 year = 365 days)
 */
export const generateTreeOfLife = () => [
    // Massive trunk
    {
        id: 'tree-of-life-trunk',
        speed: 0.15,
        style: {
            position: 'absolute',
            left: '35%', bottom: '15%',
            width: '30%', height: '55%',
            background: 'linear-gradient(90deg, #3e2723 0%, #5d4037 30%, #4a3520 60%, #3e2723 100%)',
            clipPath: 'polygon(45% 0%, 55% 0%, 60% 15%, 55% 100%, 45% 100%, 40% 15%)',
            boxShadow: '0 0 60px 20px rgba(0,0,0,0.4)',
            borderLeft: '3px solid rgba(255,200,50,0.3)',
            borderRight: '3px solid rgba(255,200,50,0.3)'
        }
    },
    // Glowing roots
    {
        id: 'tree-of-life-roots',
        speed: 0.1,
        children: [
            { id: 'root-1', style: { position: 'absolute', left: '38%', bottom: '12%', width: '4%', height: '10%', background: 'linear-gradient(180deg, rgba(255,200,50,0.6), rgba(200,150,50,0.3), transparent)', borderRadius: '0 0 10px 5px', transform: 'rotate(-15deg)', filter: 'blur(3px)' }},
            { id: 'root-2', style: { position: 'absolute', left: '48%', bottom: '10%', width: '4%', height: '12%', background: 'linear-gradient(180deg, rgba(255,200,50,0.5), rgba(200,150,50,0.2), transparent)', borderRadius: '0 0 10px 5px', transform: 'rotate(10deg)', filter: 'blur(3px)' }},
            { id: 'root-3', style: { position: 'absolute', left: '55%', bottom: '11%', width: '5%', height: '8%', background: 'linear-gradient(180deg, rgba(255,200,50,0.4), transparent)', borderRadius: '0 0 10px 5px', transform: 'rotate(-5deg)', filter: 'blur(2px)' }},
            { id: 'root-4', style: { position: 'absolute', left: '36%', bottom: '8%', width: '3%', height: '10%', background: 'linear-gradient(180deg, rgba(255,200,50,0.5), transparent)', borderRadius: '0 0 10px 5px', transform: 'rotate(20deg)', filter: 'blur(2px)' }},
            { id: 'root-5', style: { position: 'absolute', left: '58%', bottom: '9%', width: '4%', height: '9%', background: 'linear-gradient(180deg, rgba(255,200,50,0.4), transparent)', borderRadius: '0 0 10px 5px', transform: 'rotate(-18deg)', filter: 'blur(2px)' }}
        ]
    },
    // Golden canopy
    {
        id: 'tree-of-life-canopy',
        speed: 0.12,
        style: {
            position: 'absolute', left: '25%', bottom: '65%',
            width: '50%', height: '40%',
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255,200,50,0.25) 0%, rgba(200,150,50,0.15) 40%, transparent 70%)',
            filter: 'blur(20px)',
            animation: 'canopy-pulse 8s ease-in-out infinite'
        }
    },
    // Golden leaves (scattered around canopy)
    {
        id: 'tree-of-life-leaves',
        speed: 0.14,
        children: Array.from({ length: 20 }, (_, i) => {
            const s = i * 67 + 3;
            return {
                id: `leaf-${i}`,
                style: {
                    position: 'absolute',
                    left: `${25 + srand(s) * 45}%`,
                    top: `${35 + srand(s + 200) * 30}%`,
                    fontSize: '14px',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 0 8px 2px rgba(255,200,50,0.6))',
                    animation: `leaf-fall ${4 + srand(s + 300) * 4}s ease-in-out infinite ${srand(s + 400) * 4}s`
                },
                content: '🍃'
            };
        })
    },
    // Magical particles
    {
        id: 'tree-of-life-particles',
        speed: 0.18,
        children: Array.from({ length: 30 }, (_, i) => {
            const s = i * 51 + 11;
            return {
                id: `particle-${i}`,
                style: {
                    position: 'absolute',
                    left: `${30 + srand(s) * 40}%`,
                    top: `${20 + srand(s + 200) * 50}%`,
                    width: `${3 + srand(s + 300) * 4}px`,
                    height: `${3 + srand(s + 400) * 4}px`,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(255,200,50,0.8), rgba(255,220,100,0.4), transparent)`,
                    animation: `particle-float ${5 + srand(s + 500) * 5}s ease-in-out infinite ${srand(s + 600) * 5}s`
                }
            };
        })
    },
    // Animals gathered around Tree of Life
    {
        id: 'tree-of-life-animals',
        speed: 0.2,
        children: [
            { id: 'totl-1', style: { position: 'absolute', left: '20%', bottom: '18%', fontSize: '35px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))', animation: 'animal-idle-0 5s ease-in-out infinite' }, content: '🦌' },
            { id: 'totl-2', style: { position: 'absolute', left: '70%', bottom: '16%', fontSize: '30px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))', animation: 'animal-idle-1 6s ease-in-out infinite' }, content: '🦁️' },
            { id: 'totl-3', style: { position: 'absolute', left: '25%', bottom: '22%', fontSize: '25px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))', animation: 'animal-idle-2 5s ease-in-out infinite' }, content: '🦊' },
            { id: 'totl-4', style: { position: 'absolute', right: '22%', bottom: '20%', fontSize: '28px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))', animation: 'animal-idle-3 7s ease-in-out infinite' }, content: '🐘' },
            { id: 'totl-5', style: { position: 'absolute', right: '35%', bottom: '18%', fontSize: '20px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))', animation: 'animal-idle-4 4s ease-in-out infinite' }, content: '🦉' },
            { id: 'totl-6', style: { position: 'absolute', left: '15%', bottom: '25%', fontSize: '22px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))', animation: 'animal-idle-5 6s ease-in-out infinite' }, content: '🦋' }
        ]
    }
];

/**
 * Environmental effects
 */
export const generateForestEnvironment = () => [
    // Ground layers with depth
    {
        id: 'forest-ground-far',
        speed: 0.35,
        style: {
            position: 'absolute',
            bottom: '-10%', left: '-30%',
            width: '160%', height: '30%',
            background: 'linear-gradient(180deg, #0d3d0d 0%, #0a2a0a 40%, #081808 100%)'
        }
    },
    {
        id: 'forest-ground-mid',
        speed: 0.45,
        style: {
            position: 'absolute',
            bottom: '-5%', left: '-20%',
            width: '140%', height: '25%',
            background: 'linear-gradient(180deg, #0f350f 0%, #0c280c 40%, #091f09 100%)'
        }
    },
    {
        id: 'forest-ground-near',
        speed: 0.55,
        style: {
            position: 'absolute',
            bottom: '0%', left: '-10%',
            width: '120%', height: '15%',
            background: 'linear-gradient(180deg, #0a250a 0%, #081808 100%)'
        }
    },
    // Fog layers
    {
        id: 'forest-fog-1',
        speed: 0.4,
        style: {
            position: 'absolute',
            bottom: '0%', left: '-20%',
            width: '140%', height: '50%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(10,30,10,0.15) 30%, rgba(10,30,10,0.25) 60%, transparent 100%)',
            filter: 'blur(25px)',
            animation: 'fog-drift 40s ease-in-out infinite'
        }
    },
    {
        id: 'forest-fog-2',
        speed: 0.5,
        style: {
            position: 'absolute',
            bottom: '10%', left: '-30%',
            width: '160%', height: '40%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(20,50,20,0.1) 20%, rgba(20,50,20,0.15) 50%, transparent 100%)',
            filter: 'blur(30px)',
            animation: 'fog-drift 55s ease-in-out infinite reverse'
        }
    },
    // Falling leaves
    {
        id: 'falling-leaves',
        speed: 0.6,
        children: Array.from({ length: 25 }, (_, i) => {
            const s = i * 59 + 3;
            const LEAVES = ['🍃', '🍂', '🍁'];
            return {
                id: `leaf-${i}`,
                style: {
                    position: 'absolute',
                    left: `${srand(s) * 120 - 10}%`,
                    top: '-10%',
                    fontSize: `${12 + srand(s + 200) * 8}px`,
                    opacity: 0.7 + srand(s + 300) * 0.3,
                    animation: `leaf-fall ${8 + srand(s + 400) * 8}s linear infinite ${srand(s + 500) * 8}s`,
                    transform: `rotate(${srand(s + 600) * 360}deg)`
                },
                content: LEAVES[Math.floor(srand(s + 700) * LEAVES.length)]
            };
        })
    },
    // Light rays through trees (subtle)
    {
        id: 'light-rays',
        speed: 0.1,
        style: {
            position: 'absolute',
            top: '0', left: '30%',
            width: '40%', height: '100%',
            background: 'linear-gradient(180deg, rgba(255,220,100,0.03) 0%, transparent 30%, rgba(255,220,100,0.02) 60%, transparent 100%)',
            transform: 'skewX(-10deg)',
            animation: 'ray-drift 20s ease-in-out infinite alternate'
        }
    }
];

/**
 * Base forest layers (always present)
 */
export const getBaseForestLayers = () => [
    // Background gradient
    {
        id: 'forest-bg',
        speed: 0,
        style: {
            background: 'linear-gradient(180deg, #030a03 0%, #061206 25%, #0a1a0a 50%, #071207 100%)',
            width: '300%', height: '300%',
            left: '-100%', top: '-100%'
        }
    },
    // Subtle sky through trees
    {
        id: 'forest-sky',
        speed: 0.02,
        style: {
            position: 'absolute',
            top: '-50%', left: '-50%',
            width: '200%', height: '80%',
            background: 'linear-gradient(180deg, #0a1a2a 0%, #0d2d0d 100%)'
        }
    },
    // Stars through canopy
    {
        id: 'forest-stars',
        speed: 0.05,
        style: {
            position: 'absolute',
            top: '-50%', left: '-50%',
            width: '200%', height: '80%',
            boxShadow: '0 5vw 8vh 1px rgba(200,220,180,0.3), 10vw 15vh 1px rgba(200,220,180,0.2), 20vw 12vh 2px rgba(200,220,180,0.15), 30vw 10vh 1.5px rgba(200,220,180,0.1)',
            animation: 'stars-subtle-twinkle 8s ease-in-out infinite'
        }
    }
];