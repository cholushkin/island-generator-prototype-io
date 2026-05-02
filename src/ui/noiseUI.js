import { generateNoise } from '../modules/noise.js';

export function createNoiseModule(container) {
  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>1. Noise</span>
      <span>Output: noise_base</span>
    </div>

    <div class="module-body">
      <div class="controls">
        <label>Scale <span class="val-scale">0.01</span></label>
        <input type="range" class="scale" min="0.001" max="0.05" step="0.001" value="0.01">

        <label>Octaves <span class="val-octaves">4</span></label>
        <input type="range" class="octaves" min="1" max="6" step="1" value="4">

        <label>Persistence <span class="val-persistence">0.5</span></label>
        <input type="range" class="persistence" min="0.3" max="0.8" step="0.01" value="0.5">

        <label>Seed</label>
        <div class="seed-row">
          <input type="number" class="seed" value="1234">
          <button class="random">🎲</button>
        </div>

        <button class="regen">Regenerate</button>
      </div>

      <div class="output">
        <canvas width="256" height="256"></canvas>
      </div>
    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const scale = module.querySelector('.scale');
  const octaves = module.querySelector('.octaves');
  const persistence = module.querySelector('.persistence');
  const seed = module.querySelector('.seed');

  const valScale = module.querySelector('.val-scale');
  const valOctaves = module.querySelector('.val-octaves');
  const valPersistence = module.querySelector('.val-persistence');

  const regen = module.querySelector('.regen');
  const random = module.querySelector('.random');

  let outputField = null;

  const params = {
    scale: 0.01,
    octaves: 4,
    persistence: 0.5,
    seed: 1234
  };

  function updateParams() {
    params.scale = parseFloat(scale.value);
    params.octaves = parseInt(octaves.value);
    params.persistence = parseFloat(persistence.value);
    params.seed = parseInt(seed.value);

    valScale.textContent = params.scale.toFixed(3);
    valOctaves.textContent = params.octaves;
    valPersistence.textContent = params.persistence.toFixed(2);
  }

  function renderField(field) {
    const img = ctx.createImageData(field.width, field.height);

    for (let i = 0; i < field.data.length; i++) {
      let v = field.data[i];
      v = Math.floor(v * 255);

      img.data[i * 4 + 0] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
  }

  function update() {
    updateParams();
    outputField = generateNoise(params);
    renderField(outputField);
  }

  [scale, octaves, persistence].forEach(el => {
    el.addEventListener('input', update);
  });

  seed.addEventListener('change', update);

  regen.addEventListener('click', update);

  random.addEventListener('click', () => {
    seed.value = Math.floor(Math.random() * 100000);
    update();
  });

  update();

  return {
    getOutput: () => outputField
  };
}