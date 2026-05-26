uniform float uBaseSize;
uniform float uScale;
uniform float uMinSize;
uniform float uMaxSize;

attribute float aTextureIndex;

varying float vTextureIndex;

void main() {
  vTextureIndex = aTextureIndex;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float dist = max(length(mvPosition.xyz), 0.001);

  gl_PointSize = uBaseSize * (uScale / dist);
  gl_PointSize = clamp(gl_PointSize, uMinSize, uMaxSize);

  gl_Position = projectionMatrix * mvPosition;
}
