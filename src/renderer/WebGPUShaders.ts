export const WGSL_VERTEX_SHADER = /* wgsl */ `
struct Uniforms {
  model: mat4x4<f32>,
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  cameraPos: vec4<f32>,
  ambient: vec4<f32>,
};

struct LightUniforms {
  lightCount: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
  lightTypes: array<u32, 8>,
  lightPositions: array<vec4<f32>, 8>,
  lightDirections: array<vec4<f32>, 8>,
  lightColors: array<vec4<f32>, 8>,
  lightIntensities: array<f32, 8>,
  lightRanges: array<f32, 8>,
  lightInnerCone: array<f32, 8>,
  lightOuterCone: array<f32, 8>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<uniform> lights: LightUniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let worldPos = u.model * vec4<f32>(input.position, 1.0);
  output.worldPos = worldPos.xyz;
  output.normal = normalize((u.normalMatrix * vec4<f32>(input.normal, 0.0)).xyz);
  output.uv = input.uv;
  output.clipPosition = u.projection * u.view * worldPos;
  return output;
}
`;

export const WGSL_FRAGMENT_SHADER = /* wgsl */ `
const PI: f32 = 3.14159265359;

struct Uniforms {
  model: mat4x4<f32>,
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  cameraPos: vec4<f32>,
  ambient: vec4<f32>,
};

struct LightUniforms {
  lightCount: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
  lightTypes: array<u32, 8>,
  lightPositions: array<vec4<f32>, 8>,
  lightDirections: array<vec4<f32>, 8>,
  lightColors: array<vec4<f32>, 8>,
  lightIntensities: array<f32, 8>,
  lightRanges: array<f32, 8>,
  lightInnerCone: array<f32, 8>,
  lightOuterCone: array<f32, 8>,
};

struct MaterialUniforms {
  baseColor: vec4<f32>,
  emissive: vec4<f32>,
  metallic: f32,
  roughness: f32,
  emissiveIntensity: f32,
  hasTexture: u32,
  textureTiling: vec2<f32>,
  textureOffset: vec2<f32>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<uniform> lights: LightUniforms;
@group(0) @binding(2) var<uniform> mat: MaterialUniforms;
@group(0) @binding(3) var texSampler: sampler;
@group(0) @binding(4) var texTexture: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
};

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  var albedo = mat.baseColor.rgb;
  if (mat.hasTexture == 1u) {
    let uv = input.uv * mat.textureTiling + mat.textureOffset;
    let texColor = textureSample(texTexture, texSampler, uv);
    albedo = albedo * texColor.rgb;
  }

  let metallic = clamp(mat.metallic, 0.0, 1.0);
  let roughness = clamp(mat.roughness, 0.05, 1.0);

  let N = normalize(input.normal);
  let V = normalize(u.cameraPos.xyz - input.worldPos);

  var result = vec3<f32>(0.0, 0.0, 0.0);

  for (var i: u32 = 0u; i < lights.lightCount; i = i + 1u) {
    let lightType = lights.lightTypes[i];
    var lightDir = vec3<f32>(0.0);
    var atten = 1.0;

    if (lightType == 0u) {
      lightDir = -normalize(lights.lightDirections[i].xyz);
    } else {
      let toLight = lights.lightPositions[i].xyz - input.worldPos;
      let dist = length(toLight);
      lightDir = toLight / max(dist, 0.001);
      atten = 1.0 - smoothstep(0.0, lights.lightRanges[i], dist);
    }

    var spot = 1.0;
    if (lightType == 2u) {
      let theta = dot(lightDir, normalize(-lights.lightDirections[i].xyz));
      let inner = cos(lights.lightInnerCone[i]);
      let outer = cos(lights.lightOuterCone[i]);
      spot = clamp((theta - outer) / max(inner - outer, 0.001), 0.0, 1.0);
    }

    let H = normalize(lightDir + V);
    let F0 = mix(vec3<f32>(0.04), albedo, metallic);

    let NdotH = max(dot(N, H), 0.0);
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, lightDir), 0.0);
    let HdotV = max(dot(H, V), 0.0);

    let a = roughness * roughness;
    let a2 = a * a;
    let denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
    let NDF = a2 / max(PI * denom * denom, 0.0001);

    let k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    let ggx2 = NdotV / max(NdotV * (1.0 - k) + k, 0.0001);
    let ggx1 = NdotL / max(NdotL * (1.0 - k) + k, 0.0001);
    let G = ggx2 * ggx1;

    let F = F0 + (1.0 - F0) * pow(clamp(1.0 - HdotV, 0.0, 1.0), 5.0);

    let numerator = NDF * G * F;
    let denominator = 4.0 * NdotV * NdotL + 0.0001;
    let specular = numerator / denominator;

    let kS = F;
    let kD = (1.0 - kS) * (1.0 - metallic);
    let diffuse = kD * albedo / PI;

    let radiance = lights.lightColors[i].rgb * lights.lightIntensities[i] * atten * spot;
    result = result + (diffuse + specular) * radiance * NdotL;
  }

  result = result + u.ambient.xyz * albedo;
  result = result + mat.emissive.rgb * mat.emissiveIntensity;

  return vec4<f32>(result, mat.baseColor.a);
}
`;

export const WGSL_GRID_SHADER = /* wgsl */ `
struct GridUniforms {
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> u: GridUniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) depth: f32,
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let viewPos = u.view * vec4<f32>(input.position, 1.0);
  output.depth = -viewPos.z;
  output.clipPosition = u.projection * viewPos;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  var alpha = 1.0 - clamp(input.depth / 50.0, 0.0, 1.0);
  alpha = alpha * 0.4;
  return vec4<f32>(0.5, 0.5, 0.5, alpha);
}
`;

export const WGSL_WIREFRAME_SHADER = /* wgsl */ `
struct WireUniforms {
  model: mat4x4<f32>,
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
  color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> u: WireUniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
};

@vertex
fn vs_main(input: VertexInput) -> @builtin(position) vec4<f32> {
  return u.projection * u.view * u.model * vec4<f32>(input.position, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return u.color;
}
`;
