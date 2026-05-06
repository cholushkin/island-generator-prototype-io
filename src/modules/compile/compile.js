import * as THREE from 'https://esm.sh/three@0.160';

export function compileWorld({
  terrainMesh,
  marchingMesh,
  offset = new THREE.Vector3(0, 0, 0),
  scale = new THREE.Vector3(1, 1, 1),
  rotation = new THREE.Vector3(0, 0, 0)
}) {

  const root = new THREE.Group();

  if (terrainMesh) {
    const terrain = terrainMesh.clone();
    root.add(terrain);
  }

  if (marchingMesh) {
    const city = marchingMesh.clone();

    city.position.set(
      offset.x,
      offset.y,
      offset.z
    );

    city.scale.set(
      scale.x,
      scale.y,
      scale.z
    );

    city.rotation.set(
      rotation.x,
      rotation.y,
      rotation.z
    );

    root.add(city);
  }

  return root;
}
