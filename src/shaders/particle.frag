uniform sampler2D uAtlas;
uniform vec2 uGridSize;
uniform float uFocusedIndex;
uniform float uFocusAmount;

varying float vTextureIndex;
varying float vParticleIndex;
varying float vHoverMix;
varying float vFocusMix;

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
  float focus = vFocusMix;
  float glow = max(hover, focus);

  vec3 lit = color.rgb;
  lit = mix(lit, lit * 1.22 + vec3(0.07), hover);
  lit = mix(lit, lit * 1.35 + vec3(0.12), focus);

  float halo = smoothstep(0.62, 0.32, radial) * glow;
  lit += vec3(0.92, 0.94, 1.0) * halo * (0.72 + focus * 0.45);

  float rim = smoothstep(0.52, 0.46, radial) * smoothstep(0.38, 0.44, radial) * glow;
  lit += vec3(0.35 + focus * 0.2) * rim;

  if (uFocusAmount > 0.0 && floor(vParticleIndex + 0.5) != floor(uFocusedIndex + 0.5)) {
    lit *= mix(1.0, 0.42, uFocusAmount);
  }

  float alpha = color.a + halo * (0.22 + focus * 0.18);
  gl_FragColor = vec4(min(lit, vec3(1.0)), alpha);
}
