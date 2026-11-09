import { applyMask } from '../modules/mask.js';
import { createEmitter } from '../core/reactive.js';
import { renderFieldGrayscale } from './helpers/fieldCanvas.js';

export function createMaskModule(container) {
  const module = document.createElement('div');
  module.className = 'module';

  module.innerHTML = `
    <div class="module-header">
      <span>3. Mask</span>
    </div>

    <div class="module-body">
      <div class="controls">
        <label>Radius <span id="radiusVal">0.4</span></label>
        <input type="range" id="radius" min="0.1" max="0.5" step="0.01" value="0.4">

        <label>Threshold <span id="thVal">0.0</span></label>
        <input type="range" id="threshold" min="0" max="1" step="0.01" value="0.0">

        <label>Softness <span id="softVal">0.10</span></label>
        <input type="range" id="softness" min="0" max="0.5" step="0.01" value="0.1">
      </div>

      <div class="output">
        <canvas id="maskCanvas" width="256" height="256"></canvas>
      </div>
    </div>
  `;

  container.appendChild(module);

  const canvas = module.querySelector('#maskCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const radius = module.querySelector('#radius');
  const threshold = module.querySelector('#threshold');

  const radiusVal = module.querySelector('#radiusVal');
  const thVal = module.querySelector('#thVal');

  const softness = module.querySelector('#softness');
  const softVal = module.querySelector('#softVal');

  const emitter = createEmitter();

  let inputNode = null;
  let outputField = null;

  function update() {
    if (!inputNode) return;

    const input = inputNode.getOutput();
    if (!input) return;

    const r = parseFloat(radius.value);
    const t = parseFloat(threshold.value);
    const s = parseFloat(softness.value);

    radiusVal.textContent = r.toFixed(2);
    thVal.textContent = t.toFixed(2);
    softVal.textContent = s.toFixed(2);

    outputField = applyMask(input, r, t, s);
    renderFieldGrayscale(ctx, outputField);
    emitter.emit();
  }

  [radius, threshold, softness].forEach(el => {
    el.addEventListener('input', update);
  });

  return {
    el: module,
    setInput(node) {
      inputNode = node;
      node.subscribe(update);
      update();
    },
    getOutput: () => outputField,
    subscribe: emitter.subscribe
  };
}
