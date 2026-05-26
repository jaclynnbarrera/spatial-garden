import * as THREE from 'three';

const TYPE_COLORS = {
  link: new THREE.Color('#5b9bd5'),
  image: new THREE.Color('#e07b39'),
  text: new THREE.Color('#4caf82'),
};

export function createParticles(posts) {
  const count = posts.length;
  const positions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  posts.forEach((post, i) => {
    const [tx, ty, tz] = post.position;
    const i3 = i * 3;

    positions[i3] = 0;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = 0;

    targetPositions[i3] = tx;
    targetPositions[i3 + 1] = ty;
    targetPositions[i3 + 2] = tz;

    const color = TYPE_COLORS[post.type] ?? TYPE_COLORS.text;
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.4,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.posts = posts;

  return {
    mesh: points,
    geometry,
    positions,
    targetPositions,
  };
}
