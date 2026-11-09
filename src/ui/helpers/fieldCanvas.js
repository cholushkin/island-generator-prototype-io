export function renderFieldGrayscale(ctx, field) {
  const img = ctx.createImageData(field.width, field.height);

  for (let i = 0; i < field.data.length; i++) {
    let v = field.data[i];
    v = Math.max(0, Math.min(1, v));
    v = Math.floor(v * 255);

    img.data[i * 4 + 0] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
}
