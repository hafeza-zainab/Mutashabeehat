//C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\scenes\index.js// Central export for all immersive view scenes, allowing dynamic imports based on theme selection.
import Sky from './Sky';
import Forest from './Forest';
import Mountain from './Mountain';
import Oasis from './Oasis';
import Ship from './Ship';

const SCENES = {
    sky: Sky,
    forest: Forest,
    mountain: Mountain,
    oasis: Oasis,
    ship: Ship
};

export default SCENES;