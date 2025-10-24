// Cel Shading Vertex Shader
export const celVertexShader = `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

// Cel Shading Fragment Shader
export const celFragmentShader = `
uniform vec3 color;
uniform vec3 lightDirection;
uniform float celLevels;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(lightDirection);
  
  // Calculate diffuse lighting
  float NdotL = max(dot(normal, lightDir), 0.0);
  
  // Apply cel shading steps
  float intensity = floor(NdotL * celLevels) / celLevels;
  
  // Add rim lighting for outline effect
  vec3 viewDir = normalize(vViewPosition);
  float rim = 1.0 - max(dot(viewDir, normal), 0.0);
  rim = smoothstep(0.6, 1.0, rim);
  
  // Combine colors
  vec3 finalColor = color * (0.3 + intensity * 0.7);
  finalColor += rim * vec3(0.5, 0.2, 0.8) * 0.3; // Purple rim light
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Outline Vertex Shader (for toon outline effect)
export const outlineVertexShader = `
uniform float outlineThickness;

void main() {
  vec3 newPosition = position + normal * outlineThickness;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

// Outline Fragment Shader
export const outlineFragmentShader = `
uniform vec3 outlineColor;

void main() {
  gl_FragColor = vec4(outlineColor, 1.0);
}
`;

// Glowing NFT Shader Vertex
export const glowVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Glowing NFT Shader Fragment
export const glowFragmentShader = `
uniform vec3 glowColor;
uniform float time;
uniform sampler2D texture1;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  // Pulsating glow effect
  float pulse = sin(time * 2.0) * 0.5 + 0.5;
  
  // Sample texture
  vec4 texColor = texture2D(texture1, vUv);
  
  // Add glow
  vec3 glow = glowColor * (0.5 + pulse * 0.5);
  vec3 finalColor = texColor.rgb + glow * 0.3;
  
  gl_FragColor = vec4(finalColor, texColor.a);
}
`;

