import { Vec3 } from '@math/Vec';
import { Mat4 } from '@math/Mat4';

export class OrbitCamera {
  public target: Vec3 = new Vec3(0, 0, 0);
  public distance: number = 10;
  public azimuth: number = Math.PI / 4;
  public elevation: number = Math.PI / 6;
  public minDistance: number = 0.5;
  public maxDistance: number = 500;
  public minElevation: number = -Math.PI / 2 + 0.01;
  public maxElevation: number = Math.PI / 2 - 0.01;
  public panSpeed: number = 0.002;
  public rotateSpeed: number = 0.005;
  public zoomSpeed: number = 0.001;

  get position(): Vec3 {
    const ce = Math.cos(this.elevation);
    return new Vec3(
      this.target.x + this.distance * ce * Math.cos(this.azimuth),
      this.target.y + this.distance * Math.sin(this.elevation),
      this.target.z + this.distance * ce * Math.sin(this.azimuth),
    );
  }

  rotate(deltaX: number, deltaY: number): void {
    this.azimuth -= deltaX * this.rotateSpeed;
    this.elevation += deltaY * this.rotateSpeed;
    this.elevation = Math.max(
      this.minElevation,
      Math.min(this.maxElevation, this.elevation),
    );
  }

  pan(deltaX: number, deltaY: number, _viewportWidth: number, viewportHeight: number): void {
    const right = this.right;
    const up = this.up;
    const scale = this.distance / viewportHeight;
    const panX = -deltaX * scale * this.panSpeed * 100;
    const panY = deltaY * scale * this.panSpeed * 100;
    this.target = new Vec3(
      this.target.x + right.x * panX + up.x * panY,
      this.target.y + right.y * panX + up.y * panY,
      this.target.z + right.z * panX + up.z * panY,
    );
  }

  zoom(delta: number): void {
    this.distance += delta * this.zoomSpeed * this.distance;
    this.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.distance),
    );
  }

  frame(target: Vec3, radius: number): void {
    this.target = target.clone();
    this.distance = Math.max(radius * 2.5, 1);
  }

  private get forward(): Vec3 {
    return Vec3.normalize(Vec3.sub(this.target, this.position));
  }

  private get right(): Vec3 {
    const fwd = this.forward;
    return Vec3.normalize(Vec3.cross(fwd, new Vec3(0, 1, 0)));
  }

  private get up(): Vec3 {
    const right = this.right;
    const fwd = this.forward;
    return Vec3.cross(right, fwd);
  }

  getViewMatrix(): Mat4 {
    return Mat4.lookAt(this.position, this.target, new Vec3(0, 1, 0));
  }
}
