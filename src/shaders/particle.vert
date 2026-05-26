uniform float uBaseSize;
uniform float uScale;
uniform float uMinSize;
uniform float uMaxSize;
uniform float uHoveredIndex;
uniform float uHoverAmount;
uniform float uHoverScale;
uniform float uFocusedIndex;
uniform float uFocusAmount;
uniform float uFocusScale;

attribute float aTextureIndex;
attribute float aParticleIndex;

varying float vTextureIndex;
varying float vParticleIndex;
varying float vHoverMix;
varying float vFocusMix;

void main() {
  vTextureIndex = aTextureIndex;
  vParticleIndex = aParticleIndex;

  float hoverMix = 0.0;
  if (uHoveredIndex >= 0.0 && floor(aParticleIndex + 0.5) == floor(uHoveredIndex + 0.5)) {
    hoverMix = uHoverAmount;
  }

  float focusMix = 0.0;
  if (uFocusedIndex >= 0.0 && floor(aParticleIndex + 0.5) == floor(uFocusedIndex + 0.5)) {
    focusMix = uFocusAmount;
  }

  vHoverMix = hoverMix * (1.0 - focusMix);
  vFocusMix = focusMix;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float dist = max(length(mvPosition.xyz), 0.001);

  gl_PointSize = uBaseSize * (uScale / dist);
  gl_PointSize = clamp(gl_PointSize, uMinSize, uMaxSize);

  if (focusMix > 0.0) {
    gl_PointSize *= mix(1.0, uFocusScale, focusMix);
  } else {
    gl_PointSize *= mix(1.0, uHoverScale, hoverMix);
  }

  gl_Position = projectionMatrix * mvPosition;
}
