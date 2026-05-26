uniform sampler2D uAtlas;
uniform vec2 uGridSize;

varying float vTextureIndex;
varying float vHoverMix;

void main() {
  float index = floor(vTextureIndex + 0.5);
  float col = mod(index, uGridSize.x);
  float row = floor(index / uGridSize.x);

  vec2 cellUv = vec2(
    (col + gl_PointCoord.x) / uGridSize.x,
    (row + gl_PointCoord.y) / uGridSize.y
  );

  vec4 color = texture2D(uAtlas, cellUv);

  vec2 centered = gl_PointCoord - 0.5;
  float radial = length(centered) * 2.0;
  float hover = vHoverMix;

  vec3 lit = color.rgb;
  lit = mix(lit, lit * 1.22 + vec3(0.07), hover);

  float halo = smoothstep(0.62, 0.36, radial) * hover;
  lit += vec3(0.92, 0.94, 1.0) * halo * 0.72;

  float rim = smoothstep(0.52, 0.46, radial) * smoothstep(0.38, 0.44, radial) * hover;
  lit += vec3(0.35) * rim;

  float alpha = color.a + halo * 0.22;
  gl_FragColor = vec4(min(lit, vec3(1.0)), alpha);
}
