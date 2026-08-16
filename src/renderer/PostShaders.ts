export const SHADOW_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uLightSpaceMatrix;
uniform mat4 uModel;

void main() {
  gl_Position = uLightSpaceMatrix * uModel * vec4(aPosition, 1.0);
}
`;

export const SHADOW_FRAGMENT_SHADER = `#version 300 es
precision highp float;

void main() {
}
`;

export const POST_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;

out vec2 vUV;

void main() {
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const POST_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uScene;
uniform float uExposure;
uniform float uBloomThreshold;
uniform float uBloomIntensity;
uniform float uGamma;

vec3 acesToneMap(vec3 color) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

vec3 brightPass(vec3 color, float threshold) {
  float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return max(color * step(threshold, brightness), 0.0);
}

void main() {
  vec3 hdrColor = texture(uScene, vUV).rgb;
  hdrColor *= uExposure;

  vec3 bloomColor = brightPass(hdrColor, uBloomThreshold) * uBloomIntensity;
  hdrColor += bloomColor;

  vec3 mapped = acesToneMap(hdrColor);
  mapped = pow(mapped, vec3(1.0 / uGamma));

  fragColor = vec4(mapped, 1.0);
}
`;

export const DEPTH_DEBUG_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uShadowMap;

void main() {
  float depth = texture(uShadowMap, vUV).r;
  fragColor = vec4(vec3(depth), 1.0);
}
`;
