//C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\utils\ForestSimulation.js
import { srand } from './sceneHelpers';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BASE_DATE_ISO = '2025-01-01T00:00:00.000Z';

const PLANT_FLOWER_EMOJIS = ['🌸', '🌺', '🌷', '🌼', '🌹'];
const TREE_EMOJIS = ['🌳', '🌲', '🌴'];
const FRUIT_EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍐'];

const ANIMAL_SPECIES = [
    { id: 'lion', emoji: '🦁', label: 'Lion' },
    { id: 'wolf', emoji: '🐺', label: 'Wolf' },
    { id: 'elephant', emoji: '🐘', label: 'Elephant' },
    { id: 'dog', emoji: '🐕', label: 'Dog' },
    { id: 'crow', emoji: '🐦', label: 'Crow / Raven' },
    { id: 'hoopoe', emoji: '🪶', label: 'Hoopoe' },
    { id: 'ant', emoji: '🐜', label: 'Ant' },
    { id: 'bee', emoji: '🐝', label: 'Bee' },
    { id: 'spider', emoji: '🕷️', label: 'Spider' },
    { id: 'locust', emoji: '🪲', label: 'Locust' }
];

export class ForestSimulation {
    constructor(dayCount, options = {}) {
        this.dayCount = Math.max(0, Math.floor(dayCount));
        this.startDate = options.startDate ? new Date(options.startDate) : new Date(BASE_DATE_ISO);
        this.config = {
            daysPerTree: 7,
            daysToFlower: 1,
            daysToFruit: 7,
            animalUnlockPlants: 14,
            animalUnlockTrees: 2,
            animalSpawnInterval: 7,
            firstLakeDay: 180,
            pondInterval: 30,
            maximumPonds: 5
        };
    }

    getDateForDay(day) {
        return new Date(this.startDate.getTime() + (day - 1) * ONE_DAY_MS).toISOString();
    }

    get plantCount() {
        return this.dayCount;
    }

    get smallPlants() {
        return Array.from({ length: this.plantCount }, (_, index) => {
            const createdDay = index + 1;
            const ageDays = Math.max(0, this.dayCount - createdDay + 1);
            const isFlowering = ageDays > this.config.daysToFlower;
            return {
                id: `plant-${createdDay}`,
                createdAt: this.getDateForDay(createdDay),
                createdDay,
                ageDays,
                stage: isFlowering ? 'flowering' : 'seedling',
                emoji: isFlowering ? PLANT_FLOWER_EMOJIS[index % PLANT_FLOWER_EMOJIS.length] : '🌱',
                label: isFlowering ? 'Blooming plant' : 'Small plant'
            };
        });
    }

    get treeCount() {
        return Math.floor(this.dayCount / this.config.daysPerTree);
    }

    get trees() {
        return Array.from({ length: this.treeCount }, (_, index) => {
            const createdDay = (index + 1) * this.config.daysPerTree;
            const ageDays = Math.max(0, this.dayCount - createdDay + 1);
            const hasFruit = ageDays > this.config.daysToFruit;
            return {
                id: `tree-${index + 1}`,
                createdAt: this.getDateForDay(createdDay),
                createdDay,
                ageDays,
                emoji: TREE_EMOJIS[index % TREE_EMOJIS.length],
                hasFruit,
                fruitEmoji: FRUIT_EMOJIS[index % FRUIT_EMOJIS.length],
                label: hasFruit ? 'Fruit-bearing tree' : 'Young tree'
            };
        });
    }

    get worldReadyDay() {
        return this.config.animalUnlockPlants;
    }

    get canSpawnAnimals() {
        return this.plantCount >= this.config.animalUnlockPlants && this.treeCount >= this.config.animalUnlockTrees;
    }

    get animalSpawnDay() {
        if (!this.canSpawnAnimals) return null;
        return this.worldReadyDay + this.config.animalSpawnInterval;
    }

    get animals() {
        if (!this.canSpawnAnimals) return [];
        if (this.dayCount < this.animalSpawnDay) return [];

        const availableSpecies = ANIMAL_SPECIES;
        const elapsedDays = this.dayCount - this.animalSpawnDay;
        const unlockedSpecies = Math.min(
            availableSpecies.length,
            Math.floor(elapsedDays / this.config.animalSpawnInterval) + 1
        );

        return Array.from({ length: unlockedSpecies }, (_, index) => {
            const createdDay = this.animalSpawnDay + index * this.config.animalSpawnInterval;
            const ageDays = Math.max(0, this.dayCount - createdDay + 1);
            const species = availableSpecies[index];
            return {
                id: `animal-${species.id}`,
                createdAt: this.getDateForDay(createdDay),
                createdDay,
                ageDays,
                emoji: species.emoji,
                label: species.label,
                isWaterAnimal: false
            };
        });
    }

    get lake() {
        if (this.dayCount < this.config.firstLakeDay) return null;
        return {
            id: 'lake',
            createdAt: this.getDateForDay(this.config.firstLakeDay),
            createdDay: this.config.firstLakeDay,
            label: 'Small lake'
        };
    }

    get ponds() {
        if (!this.lake) return [];
        const pondCount = Math.min(
            Math.floor((this.dayCount - this.config.firstLakeDay) / this.config.pondInterval),
            this.config.maximumPonds
        );

        return Array.from({ length: pondCount }, (_, index) => {
            const createdDay = this.config.firstLakeDay + (index + 1) * this.config.pondInterval;
            return {
                id: `pond-${index + 1}`,
                createdAt: this.getDateForDay(createdDay),
                createdDay,
                label: `Pond ${index + 1}`
            };
        });
    }

    get fish() {
        const firstPond = this.ponds[0];
        if (!firstPond) return [];
        const fishSpawnDay = firstPond.createdDay + 7;
        if (this.dayCount < fishSpawnDay) return [];
        return [{
            id: 'fish-1',
            createdAt: this.getDateForDay(fishSpawnDay),
            createdDay: fishSpawnDay,
            ageDays: this.dayCount - fishSpawnDay + 1,
            emoji: '🐟',
            label: 'Fish',
            pondId: firstPond.id
        }];
    }

    get frogs() {
        const secondPond = this.ponds[1];
        if (!secondPond) return [];
        const frogSpawnDay = secondPond.createdDay + 7;
        if (this.dayCount < frogSpawnDay) return [];
        return [{
            id: 'frog-1',
            createdAt: this.getDateForDay(frogSpawnDay),
            createdDay: frogSpawnDay,
            ageDays: this.dayCount - frogSpawnDay + 1,
            emoji: '🐸',
            label: 'Frog',
            pondId: secondPond.id
        }];
    }

    get stats() {
        return {
            plants: this.smallPlants.length,
            floweringPlants: this.smallPlants.filter(p => p.stage === 'flowering').length,
            trees: this.trees.length,
            fruitingTrees: this.trees.filter(t => t.hasFruit).length,
            animals: this.animals.length,
            lake: Boolean(this.lake),
            ponds: this.ponds.length,
            fish: this.fish.length,
            frogs: this.frogs.length
        };
    }
}

export const generateForestPlantElements = (simulation) => {
    return simulation.smallPlants.map((plant, index) => {
        const seed = index * 43 + 11;
        return {
            id: plant.id,
            style: {
                position: 'absolute',
                left: `${srand(seed) * 82 + 8}%`,
                bottom: `${srand(seed + 500) * 34 + 6}%`,
                fontSize: plant.stage === 'flowering' ? `${18 + srand(seed + 300) * 12}px` : `${14 + srand(seed + 300) * 8}px`,
                lineHeight: 1,
                opacity: 0,
                transformOrigin: 'bottom center',
                animation: `plant-grow 2s ease-out forwards ${index * 0.08}s`
            },
            content: plant.emoji
        };
    });
};

export const generateForestTreeElements = (simulation) => {
    const treeLayers = [];
    simulation.trees.forEach((tree, index) => {
        const seed = index * 37 + 19;
        treeLayers.push({
            id: tree.id,
            style: {
                position: 'absolute',
                left: `${srand(seed) * 78 + 10}%`,
                bottom: `${srand(seed + 500) * 36 + 8}%`,
                fontSize: `${42 + srand(seed + 900) * 34}px`,
                lineHeight: 1,
                opacity: 0,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                animation: `tree-appear 3s ease-out forwards ${index * 0.18}s`
            },
            content: tree.emoji
        });

        if (tree.hasFruit) {
            treeLayers.push({
                id: `fruit-${tree.id}`,
                style: {
                    position: 'absolute',
                    left: `${srand(seed + 1200) * 68 + 14}%`,
                    bottom: `${srand(seed + 1300) * 18 + 30}%`,
                    fontSize: '18px',
                    lineHeight: 1,
                    opacity: 0,
                    animation: `fruit-sway ${2 + srand(seed + 500) * 2}s ease-in-out infinite ${srand(seed + 700) * 2}s`
                },
                content: tree.fruitEmoji
            });
        }
    });
    return treeLayers;
};

export const generateForestAnimalElements = (simulation) => {
    return simulation.animals.flatMap((animal, index) => {
        const items = [];
        const seed = index * 61 + 9;
        const count = 2 + Math.floor(srand(seed + 400) * 2);
        for (let j = 0; j < count; j += 1) {
            items.push({
                id: `${animal.id}-${j}`,
                style: {
                    position: 'absolute',
                    left: `${srand(seed + j * 47) * 80 + 8}%`,
                    bottom: `${srand(seed + j * 91) * 40 + 8}%`,
                    fontSize: `${34 + srand(seed + j * 103) * 18}px`,
                    lineHeight: 1,
                    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
                    animation: `animal-idle-${index % 5} ${4 + srand(seed + j * 50) * 3}s ease-in-out infinite ${srand(seed + j * 70) * 3}s`
                },
                content: animal.emoji
            });
        }
        return items;
    });
};

export const generateWaterEcosystemElements = (simulation) => {
    if (!simulation.lake) return [];

    const layers = [];

    layers.push({
        id: 'forest-lake',
        speed: 0.24,
        style: {
            position: 'absolute',
            left: '18%',
            bottom: '7%',
            width: '64%',
            height: '16%',
            background: 'linear-gradient(180deg, rgba(40,140,180,0.55) 0%, rgba(18,90,130,0.7) 55%, rgba(10,60,100,0.35) 100%)',
            borderRadius: '42% 42% 6% 6%',
            boxShadow: '0 0 36px 14px rgba(50,160,190,0.25), inset 0 0 24px 10px rgba(20,120,160,0.25)',
            border: '1px solid rgba(120,200,230,0.16)',
            animation: 'lake-shimmer 5s ease-in-out infinite'
        }
    });

    simulation.ponds.forEach((pond, index) => {
        const left = 16 + index * 12;
        const bottom = 4 + (index % 2) * 4;
        layers.push({
            id: pond.id,
            speed: 0.25,
            style: {
                position: 'absolute',
                left: `${left}%`,
                bottom: `${bottom}%`,
                width: `${16 + (index % 2) * 6}%`,
                height: `${8 + (index % 2) * 3}%`,
                background: 'linear-gradient(180deg, rgba(80,180,210,0.48) 0%, rgba(30,110,150,0.6) 60%, rgba(18,70,110,0.25) 100%)',
                borderRadius: '50% 55% 45% 50%',
                border: '1px solid rgba(130,220,240,0.18)',
                boxShadow: '0 0 24px 8px rgba(40,140,190,0.18)',
                animation: `pond-wobble ${6 + index}s ease-in-out infinite ${index * 0.8}s`
            }
        });
    });

    if (simulation.fish.length) {
        layers.push({
            id: 'forest-fish',
            speed: 0.25,
            children: simulation.fish.map((fish, index) => ({
                id: fish.id,
                style: {
                    position: 'absolute',
                    left: `${26 + srand(index * 47) * 30}%`,
                    bottom: `${10 + srand(index * 79) * 5}%`,
                    fontSize: '26px',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))',
                    animation: `fish-swim ${4 + srand(index * 130) * 3}s ease-in-out infinite ${index * 0.4}s`
                },
                content: fish.emoji
            }))
        });
    }

    if (simulation.frogs.length) {
        layers.push({
            id: 'forest-frogs',
            speed: 0.26,
            children: simulation.frogs.map((frog, index) => ({
                id: frog.id,
                style: {
                    position: 'absolute',
                    left: `${32 + srand(index * 41) * 28}%`,
                    bottom: `${12 + srand(index * 97) * 6}%`,
                    fontSize: '30px',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.25))',
                    animation: `frog-bounce ${3 + srand(index * 154) * 2}s ease-in-out infinite ${index * 0.3}s`
                },
                content: frog.emoji
            }))
        });
    }

    return layers;
};

export const generateForestStatsLayer = (simulation) => [
    {
        id: 'forest-stats-panel',
        speed: 0,
        style: {
            position: 'absolute',
            top: '18px',
            right: '22px',
            maxWidth: '220px',
            padding: '14px 16px',
            borderRadius: '18px',
            background: 'rgba(8, 18, 12, 0.85)',
            color: '#e6f4d9',
            fontSize: '13px',
            lineHeight: '1.5',
            border: '1px solid rgba(140, 220, 170, 0.2)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)'
        },
        content: (
            <div>
                <strong>Forest Progress</strong>
                <div>Plants: {simulation.stats.plants}</div>
                <div>Flowers: {simulation.stats.floweringPlants}</div>
                <div>Trees: {simulation.stats.trees}</div>
                <div>Fruiting: {simulation.stats.fruitingTrees}</div>
                <div>Animals: {simulation.stats.animals}</div>
                <div>Lake: {simulation.stats.lake ? 'Yes' : 'No'}</div>
                <div>Ponds: {simulation.stats.ponds}</div>
                <div>Fish: {simulation.stats.fish}</div>
                <div>Frogs: {simulation.stats.frogs}</div>
            </div>
        )
    }
];
