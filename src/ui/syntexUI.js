import { generateSynTex } from '../modules/syntex/syntex.js';
import { loadPatternImage } from '../modules/syntex/loadPattern.js';
import { PATTERNS } from '../modules/syntex/patterns.js';
import { createEmitter } from '../core/reactive.js';

export function createSynTexModule(container) {
  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>5. SynTex</span>
    </div>

    <div class="module-body">
      <div class="controls">

        <label>Algorithm</label>
        <select id="algo">
          <option value="wfc">WFC</option>
        </select>

        <label>Pattern</label>
        <div class="pattern-grid" id="patternGrid"></div>

        <div class="drop-zone" id="dropZone">
          Drop PNG(s) here, or click to add patterns
          <input type="file" id="fileInput" accept="image/png" multiple hidden>
        </div>

        <label>Tile Size <span id="pVal">16</span></label>
        <input type="range" id="patch" min="4" max="64" step="4" value="16">

        <label>Size <span id="sizeVal">256</span></label>
        <input type="range" id="size" min="32" max="256" step="32" value="32">

        <label>Seed</label>
        <div class="seed-row">
          <input type="number" id="seed" value="1234">
          <button id="random">🎲</button>
        </div>

        <label>Mask</label>
        <input type="checkbox" id="mask" checked>

        <label>Mask Radius</label>
        <input type="range" id="maskRadius" min="0.1" max="0.8" step="0.05" value="0.4">

        <label>Mask Softness</label>
        <input type="range" id="maskSoftness" min="0.01" max="0.5" step="0.01" value="0.2">

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

  ctx.imageSmoothingEnabled = false;
  canvas.style.imageRendering = 'pixelated';

  const algo = module.querySelector('#algo');
  const patch = module.querySelector('#patch');
  const seed = module.querySelector('#seed');
  const random = module.querySelector('#random');

  const size = module.querySelector('#size');
  const sizeVal = module.querySelector('#sizeVal');

  const pVal = module.querySelector('#pVal');
  const patternGrid = module.querySelector('#patternGrid');
  const dropZone = module.querySelector('#dropZone');
  const fileInput = module.querySelector('#fileInput');

  const mask = module.querySelector('#mask');
  const maskRadius = module.querySelector('#maskRadius');
  const maskSoftness = module.querySelector('#maskSoftness');

  const emitter = createEmitter();

  let patternField = null;
  let outputField = null;

  // built-in manifest entries + anything dropped in at runtime
  const patterns = PATTERNS
    .slice()
    .sort()
    .map(name => ({
      name: name.replace('.png', ''),
      src: `assets/patterns/${name}`
    }));

  let selectedIndex = 0;

  function renderGrid() {
    patternGrid.innerHTML = '';

    patterns.forEach((p, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'pattern-thumb' + (i === selectedIndex ? ' active' : '');
      thumb.title = p.name;

      const img = document.createElement('img');
      img.src = p.src;
      img.width = 64;
      img.height = 64;

      thumb.appendChild(img);
      thumb.addEventListener('click', () => selectPattern(i));

      patternGrid.appendChild(thumb);
    });
  }

  function render(field) {
    canvas.width = field.width;
    canvas.height = field.height;

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
      height: parseInt(size.value),
      algorithm: "wfc",

      mask: mask.checked,
      maskRadius: parseFloat(maskRadius.value),
      maskSoftness: parseFloat(maskSoftness.value)
    };

    pVal.textContent = params.patchSize;
    sizeVal.textContent = params.width;

    outputField = generateSynTex(params, patternField);
    render(outputField);
    emitter.emit();
  }

  async function selectPattern(index) {
    selectedIndex = index;
    renderGrid();

    const entry = patterns[index];

    try {
      patternField = await loadPatternImage(entry.src);
      update();
    } catch (e) {
      console.error("Pattern load failed:", entry.src, e);
    }
  }

  function addPatternFiles(files) {
    const pngFiles = Array.from(files).filter(f => f.type === 'image/png');
    if (pngFiles.length === 0) return;

    pngFiles.forEach(file => {
      patterns.push({
        name: file.name.replace(/\.png$/i, ''),
        src: URL.createObjectURL(file)
      });
    });

    renderGrid();

    // select the first newly added pattern
    selectPattern(patterns.length - pngFiles.length);
  }

  // events
  patch.addEventListener('input', update);
  size.addEventListener('input', update);
  seed.addEventListener('change', update);

  mask.addEventListener('change', update);
  maskRadius.addEventListener('input', update);
  maskSoftness.addEventListener('input', update);

  random.addEventListener('click', () => {
    seed.value = Math.floor(Math.random() * 100000);
    update();
  });

  module.querySelector('#regen').onclick = update;

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => addPatternFiles(fileInput.files));

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    addPatternFiles(e.dataTransfer.files);
  });

  renderGrid();
  selectPattern(selectedIndex);

  return {
    el: module,
    getOutput: () => outputField,
    subscribe: emitter.subscribe
  };
}
