import { createConfigModule } from './src/ui/configUI.js';
import { createNoiseModule } from './src/ui/noiseUI.js';
import { createMaskModule } from './src/ui/maskUI.js';
import { createLandmassModule } from './src/ui/terrain3DUI.js';
import { createSynTexModule } from './src/ui/syntexUI.js';
import { createMarchingCubesModule } from './src/ui/marchingCubesUI.js';
import { createFinalModule } from './src/ui/compilationUI.js';

const app = document.getElementById('app');

// create modules
const config = createConfigModule(app);

const noise = createNoiseModule(app);
const mask = createMaskModule(app);
const landmass = createLandmassModule(app, config);

const syntex = createSynTexModule(app);
const mc = createMarchingCubesModule(app, config);

const final = createFinalModule(app, config);

// wire the pipeline - every module is reactive, so a change anywhere
// (sliders, seeds, dropped-in patterns, config) flows downstream on its own
mask.setInput(noise);
landmass.setInput(mask);

mc.setInput(syntex);

final.setTerrain(landmass);
final.setMarching(mc);
