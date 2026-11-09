export function syncLabel(input, labelEl, format = (v) => v) {
  const v = parseFloat(input.value);
  if (labelEl) labelEl.textContent = format(v);
  return v;
}
