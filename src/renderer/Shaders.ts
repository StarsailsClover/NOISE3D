export const SHADER_PRELUDE = `#version 300 es
precision highp float;
`;

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
uniform vec3 uCameraPos;
uniform vec3 uAmbient;
uniform vec3 uLightDir;
uniform vec3 uLightColor;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(-uLightDir);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);

  vec3 ambient = uAmbient * uBaseColor.rgb;
  vec3 diffuse = uLightColor * diff * uBaseColor.rgb;
  vec3 specular = uLightColor * spec * 0.5;

  vec3 finalColor = ambient + diffuse + specular;
  fragColor = vec4(finalColor, uBaseColor.a);
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
