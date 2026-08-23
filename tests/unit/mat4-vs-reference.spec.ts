import { describe, it } from 'vitest';
import { Mat4 } from '@math/Mat4';
import { Vec3 } from '@math/Vec';

// ---- Reference implementations (textbook; storage idx = row + col*4, i.e. m[col][row]) ----

function refMul(A: Float32Array, B: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += A[r + k * 4] * B[k + c * 4]; // A[r][k] * B[k][c]
      o[r + c * 4] = s;
    }
  return o;
}

function refInv(m: Float32Array): Float32Array {
  const a = [...m];
  const get = (r: number, c: number) => a[r + c * 4];

  const aug: number[][] = [];
  for (let r = 0; r < 4; r++) {
    aug.push([get(r,0), get(r,1), get(r,2), get(r,3), r===0?1:0, r===1?1:0, r===2?1:0, r===3?1:0]);
  }
  for (let col = 0; col < 4; col++) {
    let piv = col;
    for (let r2 = col + 1; r2 < 4; r2++) if (Math.abs(aug[r2][col]) > Math.abs(aug[piv][col])) piv = r2;
    [aug[col], aug[piv]] = [aug[piv], aug[col]];
    const pv = aug[col][col];
    for (let c2 = 0; c2 < 8; c2++) aug[col][c2] /= pv;
    for (let r2 = 0; r2 < 4; r2++) {
      if (r2 === col) continue;
      const f = aug[r2][col];
      for (let c2 = 0; c2 < 8; c2++) aug[r2][c2] -= f * aug[col][c2];
    }
  }
  const inv = new Float32Array(16);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) inv[r + c * 4] = aug[r][c + 4];
  return inv;
}

const IDENT = new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);

function rnd(): Mat4 {
  const d = new Float32Array(16);
  for (let i = 0; i < 16; i++) d[i] = Math.round((Math.random() * 4 - 2) * 100) / 100;
  d[15] = 1;
  return new Mat4(d);
}

function maxDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let m = 0;
  for (let i = 0; i < 16; i++) m = Math.max(m, Math.abs(a[i] - b[i]));
  return m;
}

describe('engine math vs textbook reference', () => {
  it('multiply matches A·B or B·A?', () => {
    for (let t = 0; t < 3; t++) {
      const A = rnd(), B = rnd();
      const eng = Mat4.multiply(A, B).data;
      console.log(`mul#${t}: |eng-(A·B)|=${maxDiff(eng, refMul(A.data, B.data)).toExponential(2)}  |eng-(B·A)|=${maxDiff(eng, refMul(B.data, A.data)).toExponential(2)}`);
    }
  });

  it('invert correctness (checked with reference multiply)', () => {
    for (let t = 0; t < 3; t++) {
      const M = rnd();
      const engInv = M.invert().data;
      const errM_invM = maxDiff(refMul(M.data, engInv), IDENT);
      const errInv_M = maxDiff(refMul(engInv, M.data), IDENT);
      // Also compare against textbook inverse
      const errText = maxDiff(engInv, refInv(M.data));
      console.log(`inv#${t}: |M·inv-I|=${errM_invM.toExponential(2)} |inv·M-I|=${errInv_M.toExponential(2)} |inv-refInv|=${errText.toExponential(2)}`);
    }
  });

  it('lookAt: V·eye == origin?', () => {
    const eye = new Vec3(6.123724356957946, 5, 6.123724356957945);
    const V = Mat4.lookAt(eye, new Vec3(0,0,0), new Vec3(0,1,0));
    // Column-major apply: out_r = Σ_c V[r+c*4]*v[c]
    const v = eye;
    const out = [0,1,2,3].map((r) => V.data[r] * v.x + V.data[r+4] * v.y + V.data[r+8] * v.z + V.data[r+12]);
    console.log('lookAt·eye =', out.map((n)=>n.toFixed(4)).join(', '), '(expected 0,0,0,1)');
    const invRef = refInv(V.data);
    const e2 = [0,1,2,3].map((r) => invRef[r] * 0 + invRef[r+4] * 0 + invRef[r+8] * 0 + invRef[r+12]);
    console.log('refInv(V)·origin =', e2.map((n)=>n.toFixed(4)).join(', '), '(expected eye 6.1237,5,6.1237)');
    const engInv = V.invert().data;
    const e3 = [0,1,2,3].map((r) => engInv[r] * 0 + engInv[r+4] * 0 + engInv[r+8] * 0 + engInv[r+12]);
    console.log('engineInv(V)·origin =', e3.map((n)=>n.toFixed(4)).join(', '));
  });
});


