import { generateSynTex } from '../modules/syntex/syntex.js';
import { loadPatternImage } from '../modules/syntex/loadPattern.js';
import { PATTERNS } from '../modules/syntex/patterns.js';

export function createSynTexModule(container) {
  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>SynTex</span>
      <span>Output: texture</span>
    </div>

    <div class="module-body">
      <div class="controls">

        <label>Algorithm</label>
        <select id="algo">
          <option value="patch">Patch</option>
        </select>

        <label>Pattern</label>
        <select id="pattern"></select>

        <img id="preview" style="
          width:100%;
          border-radius:6px;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        " />

        <label>Patch Size <span id="pVal">16</span></label>
        <input type="range" id="patch" min="4" max="64" step="4" value="16">

        <label>Size <span id="sizeVal">256</span></label>
        <input type="range" id="size" min="32" max="256" step="32" value="256">

        <label>Seed</label>
        <div class="seed-row">
          <input type="number" id="seed" value="1234">
          <button id="random">🎲</button>
        </div>

        <button id="regen">Generate</button>
      </div>

      <div class="output">
        <canvas></canvas>
      </div>
    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  // 🔥 critical: no smoothing EVER
  ctx.imageSmoothingEnabled = false;
  canvas.style.imageRendering = 'pixelated';

  const patch = module.querySelector('#patch');
  const seed = module.querySelector('#seed');
  const random = module.querySelector('#random');

  const size = module.querySelector('#size');
  const sizeVal = module.querySelector('#sizeVal');

  const pVal = module.querySelector('#pVal');
  const patternSelect = module.querySelector('#pattern');
  const preview = module.querySelector('#preview');

  let patternField = null;
  let outputField = null;

  // 🔥 populate patterns dynamically
  PATTERNS.sort().forEach(name => {
    const opt = document.createElement('option');
    opt.value = `assets/patterns/${name}`;
    opt.textContent = name.replace('.png', '');
    patternSelect.appendChild(opt);
  });

  function render(field) {
    // ✅ IMPORTANT: match canvas resolution to texture
    canvas.width = field.width;
    canvas.height = field.height;

    // ✅ keep UI size fixed (scaled view)
    canvas.style.width = '256px';
    canvas.style.height = '256px';

    const img = ctx.createImageData(field.width, field.height);

    for (let i = 0; i < field.data.length; i++) {
      const v = Math.floor(field.data[i] * 255);

      img.data[i * 4 + 0] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
  }

  function update() {
    if (!patternField) return;

    const params = {
      patchSize: parseInt(patch.value),
      seed: parseInt(seed.value),
      width: parseInt(size.value),
      height: parseInt(size.value)
    };

    pVal.textContent = params.patchSize;
    sizeVal.textContent = params.width;

    outputField = generateSynTex(params, patternField);
    render(outputField);
  }

  async function loadSelectedPattern() {
    const src = patternSelect.value;

    try {
      preview.src = src;
      patternField = await loadPatternImage(src);
      update();
    } catch (e) {
      console.error("Pattern load failed:", src, e);
    }
  }

  // 🔧 events
  patternSelect.addEventListener('change', loadSelectedPattern);
  patch.addEventListener('input', update);
  size.addEventListener('input', update);
  seed.addEventListener('change', update);

  random.addEventListener('click', () => {
    seed.value = Math.floor(Math.random() * 100000);
    update();
  });

  module.querySelector('#regen').onclick = update;

  // 🚀 initial load
  loadSelectedPattern();

  return {
    setPattern(field) {
      patternField = field;
      update();
    },
    getOutput: () => outputField
  };
}