export const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uNormalMatrix;

out vec3 vWorldPos;
out vec3 vNormal;
out vec2 vUV;

void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
  vUV = aUV;
  gl_Position = uProjection * uView * worldPos;
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vUV;

uniform vec4 uBaseColor;
uniform vec3 uEmissive;
uniform float uEmissiveIntensity;
uniform float uMetallic;
uniform float uRoughness;
uniform vec3 uCameraPos;
uniform vec3 uAmbient;
uniform vec3 uLightDir;
uniform vec3 uLightColor;

uniform sampler2D uTexture;
uniform bool uHasTexture;
uniform vec2 uTextureTiling;
uniform vec2 uTextureOffset;

out vec4 fragColor;

const float PI = 3.14159265359;

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;
  float num = a2;
  float denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;
  return num / max(denom, 0.0001);
}

float geometrySchlickGGX(float NdotV, float roughness) {
  float r = (roughness + 1.0);
  float k = (r * r) / 8.0;
  float num = NdotV;
  float denom = NdotV * (1.0 - k) + k;
  return num / max(denom, 0.0001);
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx2 = geometrySchlickGGX(NdotV, roughness);
  float ggx1 = geometrySchlickGGX(NdotL, roughness);
  return ggx2 * ggx1;
}

void main() {
  vec3 albedo = uBaseColor.rgb;
  if (uHasTexture) {
    vec2 uv = vUV * uTextureTiling + uTextureOffset;
    vec4 texColor = texture(uTexture, uv);
    albedo *= texColor.rgb;
  }

  float metallic = clamp(uMetallic, 0.0, 1.0);
  float roughness = clamp(uRoughness, 0.05, 1.0);

  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);

  vec3 L = normalize(-uLightDir);
  vec3 H = normalize(L + V);

  vec3 F0 = mix(vec3(0.04), albedo, metallic);

  float NDF = distributionGGX(N, H, roughness);
  float G = geometrySmith(N, V, L, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / denominator;

  vec3 kS = F;
  vec3 kD = (1.0 - kS) * (1.0 - metallic);

  float NdotL = max(dot(N, L), 0.0);
  vec3 radiance = uLightColor;
  vec3 diffuse = kD * albedo / PI;

  vec3 result = (diffuse + specular) * radiance * NdotL;
  result += uAmbient * albedo;

  vec3 emissive = uEmissive * uEmissiveIntensity;
  result += emissive;

  fragColor = vec4(result, uBaseColor.a);
}
`;

export const GRID_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uView;
uniform mat4 uProjection;

out float vDepth;

void main() {
  vec4 viewPos = uView * vec4(aPosition, 1.0);
  vDepth = -viewPos.z;
  gl_Position = uProjection * viewPos;
}
`;

export const GRID_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in float vDepth;
out vec4 fragColor;

void main() {
  float alpha = 1.0 - clamp(vDepth / 50.0, 0.0, 1.0);
  alpha *= 0.4;
  fragColor = vec4(0.5, 0.5, 0.5, alpha);
}
`;

export const LINE_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`;

export const LINE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec4 uColor;
out vec4 fragColor;

void main() {
  fragColor = uColor;
}
`;

export const WIREFRAME_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`;

export const WIREFRAME_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec4 uColor;
out vec4 fragColor;

void main() {
  fragColor = uColor;
}
`;
