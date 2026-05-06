import { createNoiseModule } from './src/ui/noiseUI.js';
import { createMaskModule } from './src/ui/maskUI.js';
import { createTerrain3DModule } from './src/ui/terrain3DUI.js';
import { createSynTexModule } from './src/ui/syntexUI.js';
import { createMarchingCubesModule } from './src/ui/marchingCubesUI.js';
import { createCompilationModule } from './src/ui/compilationUI.js';

const app = document.getElementById('app');

// create modules
const noise = createNoiseModule(app);

const mask = createMaskModule(app);

const terrain = createTerrain3DModule(app);

const syntex = createSynTexModule(app);

const mc = createMarchingCubesModule(app);

const compilation = createCompilationModule(app);

// connect pipeline
mask.setInput(() => noise.getOutput());

terrain.setInput(() => mask.getOutput());

mc.setInput(() => syntex.getOutput());

// connect compilation
compilation.setTerrain(() => terrain.getMesh());

compilation.setMarching(() => mc.getMesh());

// IMPORTANT:
// SynTex generation is async,
// so MC rebuild must happen later
setTimeout(() => {

  // force MC generation
  mc.rebuild();

  // rebuild final compilation
  compilation.rebuild();

}, 500);