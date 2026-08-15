export class Vec2 {
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  static get ZERO(): Vec2 {
    return new Vec2(0, 0);
  }
  static get ONE(): Vec2 {
    return new Vec2(1, 1);
  }

  static add(a: Vec2, b: Vec2): Vec2 {
    return new Vec2(a.x + b.x, a.y + b.y);
  }
  static sub(a: Vec2, b: Vec2): Vec2 {
    return new Vec2(a.x - b.x, a.y - b.y);
  }
  static scale(v: Vec2, s: number): Vec2 {
    return new Vec2(v.x * s, v.y * s);
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }
  toArray(): [number, number] {
    return [this.x, this.y];
  }
}

export class Vec3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}

  static get ZERO(): Vec3 {
    return new Vec3(0, 0, 0);
  }
  static get ONE(): Vec3 {
    return new Vec3(1, 1, 1);
  }
  static get UP(): Vec3 {
    return new Vec3(0, 1, 0);
  }
  static get FORWARD(): Vec3 {
    return new Vec3(0, 0, -1);
  }
  static get RIGHT(): Vec3 {
    return new Vec3(1, 0, 0);
  }

  static add(a: Vec3, b: Vec3): Vec3 {
    return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
  }
  static sub(a: Vec3, b: Vec3): Vec3 {
    return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
  }
  static scale(v: Vec3, s: number): Vec3 {
    return new Vec3(v.x * s, v.y * s, v.z * s);
  }
  static multiply(a: Vec3, b: Vec3): Vec3 {
    return new Vec3(a.x * b.x, a.y * b.y, a.z * b.z);
  }
  static dot(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  static cross(a: Vec3, b: Vec3): Vec3 {
    return new Vec3(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x,
    );
  }
  static lerp(a: Vec3, b: Vec3, t: number): Vec3 {
    return new Vec3(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      a.z + (b.z - a.z) * t,
    );
  }
  static distance(a: Vec3, b: Vec3): number {
    return Math.sqrt(
      (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2,
    );
  }
  static normalize(v: Vec3): Vec3 {
    const len = v.length();
    if (len < 1e-9) return Vec3.ZERO;
    const inv = 1 / len;
    return new Vec3(v.x * inv, v.y * inv, v.z * inv);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  normalized(): Vec3 {
    return Vec3.normalize(this);
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }
  copy(v: Vec3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }
  static fromArray(arr: number[]): Vec3 {
    return new Vec3(arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0);
  }
}

export class Vec4 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 0,
  ) {}

  static get ZERO(): Vec4 {
    return new Vec4(0, 0, 0, 0);
  }
  static get ONE(): Vec4 {
    return new Vec4(1, 1, 1, 1);
  }

  clone(): Vec4 {
    return new Vec4(this.x, this.y, this.z, this.w);
  }
  toArray(): [number, number, number, number] {
    return [this.x, this.y, this.z, this.w];
  }
  static fromArray(arr: number[]): Vec4 {
    return new Vec4(arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0, arr[3] ?? 0);
  }
}

export class Color {
  constructor(
    public r = 1,
    public g = 1,
    public b = 1,
    public a = 1,
  ) {}

  static get WHITE(): Color {
    return new Color(1, 1, 1, 1);
  }
  static get BLACK(): Color {
    return new Color(0, 0, 0, 1);
  }
  static get RED(): Color {
    return new Color(1, 0, 0, 1);
  }
  static get GREEN(): Color {
    return new Color(0, 1, 0, 1);
  }
  static get BLUE(): Color {
    return new Color(0, 0, 1, 1);
  }
  static get GRAY(): Color {
    return new Color(0.5, 0.5, 0.5, 1);
  }

  static fromHex(hex: number): Color {
    const r = ((hex >> 16) & 0xff) / 255;
    const g = ((hex >> 8) & 0xff) / 255;
    const b = (hex & 0xff) / 255;
    return new Color(r, g, b, 1);
  }

  static fromString(str: string): Color {
    const m = str.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if (m) {
      return new Color(
        parseInt(m[1], 16) / 255,
        parseInt(m[2], 16) / 255,
        parseInt(m[3], 16) / 255,
        1,
      );
    }
    return Color.WHITE;
  }

  toHex(): string {
    const toHex2 = (n: number) =>
      Math.round(Math.max(0, Math.min(1, n)) * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex2(this.r)}${toHex2(this.g)}${toHex2(this.b)}`;
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }
  toArray(): [number, number, number, number] {
    return [this.r, this.g, this.b, this.a];
  }
}
