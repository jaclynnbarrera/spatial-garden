import gsap from 'gsap';

export function animateScatterIn({ positions, targetPositions, onUpdate }) {
  const count = positions.length / 3;
  const timeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.8 } });

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const proxy = {
      x: positions[i3],
      y: positions[i3 + 1],
      z: positions[i3 + 2],
    };

    timeline.to(
      proxy,
      {
        x: targetPositions[i3],
        y: targetPositions[i3 + 1],
        z: targetPositions[i3 + 2],
        onUpdate: () => {
          positions[i3] = proxy.x;
          positions[i3 + 1] = proxy.y;
          positions[i3 + 2] = proxy.z;
          onUpdate();
        },
      },
      i * 0.08
    );
  }

  return timeline;
}
