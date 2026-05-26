uniform sampler2D uAtlas;
uniform vec2 uGridSize;

varying float vTextureIndex;

void main() {
  float index = floor(vTextureIndex + 0.5);
  float col = mod(index, uGridSize.x);
  float row = floor(index / uGridSize.x);

  vec2 cellUv = vec2(
    (col + gl_PointCoord.x) / uGridSize.x,
    (row + (1.0 - gl_PointCoord.y)) / uGridSize.y
  );

  vec4 color = texture2D(uAtlas, cellUv);
  gl_FragColor = color;
}
