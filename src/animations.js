import gsap from 'gsap';

// Cards begin a little above and behind their resting spot, then settle
// gently into place — a soft float/fall rather than an explosion from center.
const ENTRY_RISE = 6;
const ENTRY_DEPTH = 5;
const ENTRY_JITTER = 1.5;

export function animateScatterIn({ positions, targetPositions, onUpdate }) {
  const count = positions.length / 3;
  const timeline = gsap.timeline({ defaults: { ease: 'power2.out', duration: 1.6 } });

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    const startX = targetPositions[i3] + (Math.random() - 0.5) * ENTRY_JITTER;
    const startY = targetPositions[i3 + 1] + ENTRY_RISE + Math.random() * ENTRY_JITTER;
    const startZ = targetPositions[i3 + 2] + ENTRY_DEPTH + Math.random() * ENTRY_JITTER;

    positions[i3] = startX;
    positions[i3 + 1] = startY;
    positions[i3 + 2] = startZ;

    const proxy = { x: startX, y: startY, z: startZ };

    timeline.to(
      proxy,
      {
        x: targetPositions[i3],
        y: targetPositions[i3 + 1],
        z: targetPositions[i3 + 2],
        ease: 'power3.out',
        duration: 2.1,
        onUpdate: () => {
          positions[i3] = proxy.x;
          positions[i3 + 1] = proxy.y;
          positions[i3 + 2] = proxy.z;
          onUpdate();
        },
      },
      i * 0.05
    );
  }

  onUpdate();

  return timeline;
}

export function animateShuffle({ positions, targetPositions, onUpdate }) {
  const count = positions.length / 3;
  const timeline = gsap.timeline();

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const proxy = { x: positions[i3], y: positions[i3 + 1], z: positions[i3 + 2] };

    timeline.to(
      proxy,
      {
        x: targetPositions[i3],
        y: targetPositions[i3 + 1],
        z: targetPositions[i3 + 2],
        duration: 1.7,
        ease: 'power2.inOut',
        onUpdate: () => {
          positions[i3] = proxy.x;
          positions[i3 + 1] = proxy.y;
          positions[i3 + 2] = proxy.z;
          onUpdate();
        },
      },
      Math.random() * 0.35
    );
  }

  return timeline;
}

export function animateParticleIn({ positions, targetPositions, index, onUpdate }) {
  const i3 = index * 3;

  const startX = targetPositions[i3];
  const startY = targetPositions[i3 + 1] + ENTRY_RISE;
  const startZ = targetPositions[i3 + 2] + ENTRY_DEPTH;

  positions[i3] = startX;
  positions[i3 + 1] = startY;
  positions[i3 + 2] = startZ;
  onUpdate();

  const proxy = { x: startX, y: startY, z: startZ };

  return gsap.to(proxy, {
    x: targetPositions[i3],
    y: targetPositions[i3 + 1],
    z: targetPositions[i3 + 2],
    duration: 2.1,
    ease: 'power3.out',
    onUpdate: () => {
      positions[i3] = proxy.x;
      positions[i3 + 1] = proxy.y;
      positions[i3 + 2] = proxy.z;
      onUpdate();
    },
  });
}
