import { createNoiseModule } from './src/ui/noiseUI.js';
import { createMaskModule } from './src/ui/maskUI.js';
import { createTerrain3DModule } from './src/ui/terrain3DUI.js';

const app = document.getElementById('app');

const noise = createNoiseModule(app);
const mask = createMaskModule(app);
const terrain = createTerrain3DModule(app);

mask.setInput(() => noise.getOutput());
terrain.setInput(() => mask.getOutput());