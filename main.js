import { createNoiseModule } from './src/ui/noiseUI.js';
import { createMaskModule } from './src/ui/maskUI.js';
import { createTerrain3DModule } from './src/ui/terrain3DUI.js';
import { createSynTexModule } from './src/ui/syntexUI.js';
import { createMarchingCubesModule } from './src/ui/marchingCubesUI.js';


const app = document.getElementById('app');

const noise = createNoiseModule(app);
const mask = createMaskModule(app);
const terrain = createTerrain3DModule(app);
const syntex = createSynTexModule(app);
const mc = createMarchingCubesModule(app);

mask.setInput(() => noise.getOutput());
terrain.setInput(() => mask.getOutput());
mc.setInput(() => true);