import { Scene } from '@scene/Scene';
import { MeshData, GeometryGenerator } from './Geometry';
import type { Material } from './Material';

export class SceneExporter {
  static exportOBJ(scene: Scene, _materials: Map<number, Material>): string {
    const lines: string[] = ['# NOISE3D OBJ Export'];
    let vertexOffset = 1;

    for (const node of scene.getAllNodes()) {
      if (!node.visible || node.type === 'empty') continue;
      const mesh = this.getMeshForNode(node);
      if (!mesh) continue;

      lines.push(`o ${node.name}`);
      for (let i = 0; i < mesh.positions.length; i += 3) {
        lines.push(`v ${mesh.positions[i].toFixed(6)} ${mesh.positions[i + 1].toFixed(6)} ${mesh.positions[i + 2].toFixed(6)}`);
      }
      for (let i = 0; i < mesh.normals.length; i += 3) {
        lines.push(`vn ${mesh.normals[i].toFixed(6)} ${mesh.normals[i + 1].toFixed(6)} ${mesh.normals[i + 2].toFixed(6)}`);
      }
      for (let i = 0; i < mesh.uvs.length; i += 2) {
        lines.push(`vt ${mesh.uvs[i].toFixed(6)} ${mesh.uvs[i + 1].toFixed(6)}`);
      }
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const a = mesh.indices[i] + vertexOffset;
        const b = mesh.indices[i + 1] + vertexOffset;
        const c = mesh.indices[i + 2] + vertexOffset;
        lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`);
      }
      lines.push('');
      vertexOffset += mesh.positions.length / 3;
    }

    return lines.join('\n');
  }

  static exportJSON(scene: Scene, materials: Map<number, Material>): string {
    const data = {
      metadata: {
        version: '8.0.0',
        generator: 'NOISE3D',
        type: 'Scene',
      },
      scene: scene.serialize(),
      lights: scene.lights.map((l) => ({
        type: l.type,
        name: l.name,
        position: l.position.toArray(),
        direction: l.direction.toArray(),
        color: l.color.toArray(),
        intensity: l.intensity,
        range: l.range,
        innerConeAngle: l.innerConeAngle,
        outerConeAngle: l.outerConeAngle,
        enabled: l.enabled,
      })),
      materials: Array.from(materials.entries()).map(([id, mat]) => ({
        nodeId: id,
        baseColor: mat.baseColor.toArray(),
        metallic: mat.metallic,
        roughness: mat.roughness,
        emissive: mat.emissive.toArray(),
        emissiveIntensity: mat.emissiveIntensity,
        doubleSided: mat.doubleSided,
        textureTiling: mat.textureTiling,
        textureOffset: mat.textureOffset,
      })),
    };
    return JSON.stringify(data, null, 2);
  }

  static downloadOBJ(scene: Scene, materials: Map<number, Material>, name: string): void {
    const content = SceneExporter.exportOBJ(scene, materials);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.obj`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static downloadJSON(scene: Scene, materials: Map<number, Material>, name: string): void {
    const content = SceneExporter.exportJSON(scene, materials);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static downloadPNG(canvas: HTMLCanvasElement, name: string): void {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  private static getMeshForNode(node: any): MeshData | null {
    switch (node.type) {
      case 'cube': return GeometryGenerator.createCube();
      case 'sphere': return GeometryGenerator.createSphere();
      case 'plane': return GeometryGenerator.createPlane();
      case 'cylinder': return GeometryGenerator.createCylinder();
      case 'cone': return GeometryGenerator.createCone();
      default: return null;
    }
  }
}
