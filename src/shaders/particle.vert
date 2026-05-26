uniform float uBaseSize;
uniform float uScale;
uniform float uMinSize;
uniform float uMaxSize;
uniform float uHoveredIndex;
uniform float uHoverAmount;
uniform float uHoverScale;

attribute float aTextureIndex;
attribute float aParticleIndex;

varying float vTextureIndex;
varying float vHoverMix;

void main() {
  vTextureIndex = aTextureIndex;

  float hoverMix = 0.0;
  if (uHoveredIndex >= 0.0 && floor(aParticleIndex + 0.5) == floor(uHoveredIndex + 0.5)) {
    hoverMix = uHoverAmount;
  }
  vHoverMix = hoverMix;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float dist = max(length(mvPosition.xyz), 0.001);

  gl_PointSize = uBaseSize * (uScale / dist);
  gl_PointSize = clamp(gl_PointSize, uMinSize, uMaxSize);
  gl_PointSize *= mix(1.0, uHoverScale, hoverMix);

  gl_Position = projectionMatrix * mvPosition;
}
