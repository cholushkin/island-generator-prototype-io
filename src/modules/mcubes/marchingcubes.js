import * as THREE from 'https://esm.sh/three@0.160';

import {
  TRI_TABLE,
  EDGE_VERTEX_OFFSETS,
  CORNER_OFFSETS
} from './marchingcubedata.js';

export function buildMarchingCubes(field, size, iso = 0.5, cubeSize = 2) {
  const positions = [];
  const step = cubeSize / size;

  function sample(x, y, z) {
    if (x < 0 || y < 0 || z < 0) return 0;
    if (x >= size || y >= size || z >= size) return 0;
    return field.get(x, y, z);
  }

  function interp(p1, p2) {
    return [
      (p1[0] + p2[0]) * 0.5,
      (p1[1] + p2[1]) * 0.5,
      (p1[2] + p2[2]) * 0.5
    ];
  }

  for (let z = 0; z < size - 1; z++) {
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {

        const values = new Array(8);

        for (let i = 0; i < 8; i++) {
          const c = CORNER_OFFSETS[i];
          values[i] = sample(x + c[0], y + c[1], z + c[2]);
        }

        let idx = 0;
        for (let i = 0; i < 8; i++) {
          if (values[i] > iso) idx |= (1 << i);
        }

        const tri = TRI_TABLE[idx];
        if (!tri || tri[0] === -1) continue;

        for (let i = 0; i < tri.length; i += 3) {
          if (tri[i] === -1) break;

          const e0 = tri[i];
          const e1 = tri[i + 1];
          const e2 = tri[i + 2];

          if (e0 === -1 || e1 === -1 || e2 === -1) break;

          const verts = [];

          const edges = [e0, e1, e2];

          for (let j = 0; j < 3; j++) {
            const edge = edges[j];
            const [a, b] = EDGE_VERTEX_OFFSETS[edge];

            const p1 = [x + a[0], y + a[1], z + a[2]];
            const p2 = [x + b[0], y + b[1], z + b[2]];

            const p = interp(p1, p2);

            verts.push([
              p[0] * step - cubeSize / 2,
              p[1] * step - cubeSize / 2,
              p[2] * step - cubeSize / 2
            ]);
          }

          // consistent winding
          positions.push(
            ...verts[0],
            ...verts[2],
            ...verts[1]
          );
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geo.computeVertexNormals();

  return geo;
}