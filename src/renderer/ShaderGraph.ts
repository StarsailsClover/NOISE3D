// Node-based material editor - visual shader graph for NOISE3D

export type ShaderNodeType =
  | 'output'
  | 'color'
  | 'texture'
  | 'mix'
  | 'math'
  | 'vector'
  | 'normal'
  | 'multiply'
  | 'add'
  | 'subtract';

export type SocketType = 'color' | 'float' | 'vec3' | 'normal' | 'uv';

export interface ShaderNodeSocket {
  id: string;
  name: string;
  type: SocketType;
}

export interface ShaderGraphNode {
  id: string;
  type: ShaderNodeType;
  position: { x: number; y: number };
  inputs: ShaderNodeSocket[];
  outputs: ShaderNodeSocket[];
  properties: Record<string, number | string | boolean | number[]>;
}

export interface ShaderNodeConnection {
  id: string;
  fromNode: string;
  fromSocket: string;
  toNode: string;
  toSocket: string;
}

export interface ShaderGraph {
  nodes: ShaderGraphNode[];
  connections: ShaderNodeConnection[];
  name: string;
}

let nodeIdCounter = 1;

export function createShaderNodeId(): string {
  return `snode_${nodeIdCounter++}`;
}

export function resetShaderNodeIdCounter(): void {
  nodeIdCounter = 1;
}

export function createShaderNode(type: ShaderNodeType, x: number = 100, y: number = 100): ShaderGraphNode {
  const base: ShaderGraphNode = {
    id: createShaderNodeId(),
    type,
    position: { x, y },
    inputs: [],
    outputs: [],
    properties: {},
  };

  switch (type) {
    case 'output':
      base.inputs = [
        { id: 'color', name: 'Color', type: 'color' },
      ];
      break;
    case 'color':
      base.outputs = [{ id: 'color', name: 'Color', type: 'color' }];
      base.properties = { r: 1, g: 1, b: 1, a: 1 };
      break;
    case 'texture':
      base.inputs = [{ id: 'uv', name: 'UV', type: 'uv' }];
      base.outputs = [{ id: 'color', name: 'Color', type: 'color' }];
      base.properties = { textureId: '', tiling: [1, 1] };
      break;
    case 'mix':
      base.inputs = [
        { id: 'a', name: 'A', type: 'color' },
        { id: 'b', name: 'B', type: 'color' },
        { id: 'factor', name: 'Factor', type: 'float' },
      ];
      base.outputs = [{ id: 'result', name: 'Result', type: 'color' }];
      base.properties = { factor: 0.5 };
      break;
    case 'math':
      base.inputs = [
        { id: 'a', name: 'A', type: 'float' },
        { id: 'b', name: 'B', type: 'float' },
      ];
      base.outputs = [{ id: 'result', name: 'Result', type: 'float' }];
      base.properties = { operation: 'add' };
      break;
    case 'vector':
      base.outputs = [{ id: 'vec', name: 'Vector', type: 'vec3' }];
      base.properties = { x: 0, y: 0, z: 0 };
      break;
    case 'normal':
      base.outputs = [{ id: 'normal', name: 'Normal', type: 'normal' }];
      break;
    case 'multiply':
      base.inputs = [
        { id: 'a', name: 'A', type: 'color' },
        { id: 'b', name: 'B', type: 'color' },
      ];
      base.outputs = [{ id: 'result', name: 'Result', type: 'color' }];
      break;
    case 'add':
      base.inputs = [
        { id: 'a', name: 'A', type: 'color' },
        { id: 'b', name: 'B', type: 'color' },
      ];
      base.outputs = [{ id: 'result', name: 'Result', type: 'color' }];
      break;
    case 'subtract':
      base.inputs = [
        { id: 'a', name: 'A', type: 'color' },
        { id: 'b', name: 'B', type: 'color' },
      ];
      base.outputs = [{ id: 'result', name: 'Result', type: 'color' }];
      break;
  }

  return base;
}

export function canConnect(from: ShaderNodeSocket, to: ShaderNodeSocket): boolean {
  if (from.type === to.type) return true;
  // Color and vec3 are compatible
  if ((from.type === 'color' && to.type === 'vec3') || (from.type === 'vec3' && to.type === 'color')) return true;
  if ((from.type === 'color' && to.type === 'normal') || (from.type === 'normal' && to.type === 'color')) return true;
  return false;
}

export function compileShaderGraph(graph: ShaderGraph): string {
  const outputNode = graph.nodes.find((n) => n.type === 'output');
  if (!outputNode) return '';

  const lines: string[] = [];
  const visited = new Set<string>();

  function processNode(nodeId: string): string {
    if (visited.has(nodeId)) return `var_${nodeId}`;
    visited.add(nodeId);

    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return 'vec4(0.0)';

    // Find incoming connections to this node's inputs
    const inputValues: Record<string, string> = {};
    for (const input of node.inputs) {
      const conn = graph.connections.find((c) => c.toNode === nodeId && c.toSocket === input.id);
      if (conn) {
        inputValues[input.id] = processNode(conn.fromNode);
      }
    }

    const varName = `var_${nodeId}`;
    switch (node.type) {
      case 'color': {
        const r = node.properties.r as number;
        const g = node.properties.g as number;
        const b = node.properties.b as number;
        const a = node.properties.a as number;
        lines.push(`  vec4 ${varName} = vec4(${r}, ${g}, ${b}, ${a});`);
        break;
      }
      case 'mix': {
        const a = inputValues['a'] || 'vec4(0.0)';
        const b = inputValues['b'] || 'vec4(0.0)';
        const f = inputValues['factor'] || String(node.properties.factor ?? 0.5);
        lines.push(`  vec4 ${varName} = mix(${a}, ${b}, float(${f}));`);
        break;
      }
      case 'multiply': {
        const a = inputValues['a'] || 'vec4(1.0)';
        const b = inputValues['b'] || 'vec4(1.0)';
        lines.push(`  vec4 ${varName} = ${a} * ${b};`);
        break;
      }
      case 'add': {
        const a = inputValues['a'] || 'vec4(0.0)';
        const b = inputValues['b'] || 'vec4(0.0)';
        lines.push(`  vec4 ${varName} = ${a} + ${b};`);
        break;
      }
      case 'subtract': {
        const a = inputValues['a'] || 'vec4(0.0)';
        const b = inputValues['b'] || 'vec4(0.0)';
        lines.push(`  vec4 ${varName} = ${a} - ${b};`);
        break;
      }
      case 'vector': {
        const x = node.properties.x as number;
        const y = node.properties.y as number;
        const z = node.properties.z as number;
        lines.push(`  vec3 ${varName} = vec3(${x}, ${y}, ${z});`);
        break;
      }
      case 'texture': {
        lines.push(`  vec4 ${varName} = texture(uTexture, vUV);`);
        break;
      }
      case 'normal': {
        lines.push(`  vec3 ${varName} = vNormal;`);
        break;
      }
      case 'output': {
        const input = inputValues['color'] || 'vec4(1.0, 0.0, 1.0, 1.0)';
        lines.push(`  fragColor = ${input};`);
        break;
      }
    }

    return varName;
  }

  lines.push('// Compiled shader graph');
  lines.push('void graphMain() {');
  processNode(outputNode.id);
  lines.push('}');

  return lines.join('\n');
}

export function serializeShaderGraph(graph: ShaderGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function deserializeShaderGraph(json: string): ShaderGraph {
  return JSON.parse(json) as ShaderGraph;
}

export function createEmptyShaderGraph(name: string = 'New Material'): ShaderGraph {
  return {
    nodes: [createShaderNode('output', 400, 200)],
    connections: [],
    name,
  };
}
