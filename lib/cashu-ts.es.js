import { schnorr as J, secp256k1 as x } from "@noble/curves/secp256k1";
import { sha256 as F } from "@noble/hashes/sha2";
import { bytesToHex as R, randomBytes as It, hexToBytes as D, numberToBytesBE as Oe } from "@noble/curves/utils";
import { HDKey as oe } from "@scure/bip32";
import { hmac as xe } from "@noble/hashes/hmac";
import { hexToBytes as ct, bytesToHex as nt, randomBytes as Vt } from "@noble/hashes/utils";
const ut = {
  UNPAID: "UNPAID",
  PENDING: "PENDING",
  PAID: "PAID"
}, St = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  ISSUED: "ISSUED"
};
class ht extends Error {
  constructor(t, e) {
    super(t), this.status = e, this.name = "HttpResponseError", Object.setPrototypeOf(this, ht.prototype);
  }
}
class Ct extends Error {
  constructor(t) {
    super(t), this.name = "NetworkError", Object.setPrototypeOf(this, Ct.prototype);
  }
}
class Ot extends ht {
  constructor(t, e) {
    super(e || "Unknown mint operation error", 400), this.code = t, this.name = "MintOperationError", Object.setPrototypeOf(this, Ot.prototype);
  }
}
const $ = {
  error() {
  },
  warn() {
  },
  info() {
  },
  debug() {
  },
  trace() {
  },
  log() {
  }
};
function kt(r, t = $, e) {
  throw t.error(r, e), new Error(r);
}
function ae(r, t, e = $, n) {
  r && kt(t, e, n);
}
function ce(r, t, e = $, n) {
  r == null && kt(t, e, n);
}
function lt(r, t, e = $, n) {
  if (r)
    try {
      const s = r(t);
      s && typeof s.then == "function" && s.catch((i) => {
        try {
          e.warn("callback failed", {
            ...n ?? {},
            error: i,
            cb: r.name ?? ""
          });
        } catch {
        }
      });
    } catch (s) {
      try {
        e.warn("callback failed", {
          ...n ?? {},
          error: s,
          cb: r.name ?? ""
        });
      } catch {
      }
    }
}
const Jt = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};
class Yn {
  constructor(t = "info") {
    this.minLevel = t;
  }
  should(t) {
    return Jt[t] <= Jt[this.minLevel];
  }
  method(t) {
    switch (t) {
      case "error":
        return console.error;
      case "warn":
        return console.warn;
      case "info":
        return console.info;
      case "debug":
        return console.debug;
      case "trace":
        return console.trace;
      default:
        return console.log;
    }
  }
  header(t, e) {
    return `[${t.toUpperCase()}] ${e}`;
  }
  flattenContext(t) {
    if (!t) return;
    const e = {};
    for (const [n, s] of Object.entries(t))
      e[n] = s instanceof Error ? { message: s.message, stack: s.stack } : s;
    return e;
  }
  emit(t, e, n) {
    if (!this.should(t)) return;
    const s = this.header(t, e), i = this.flattenContext(n), o = this.method(t);
    i && Object.keys(i).length ? o(s, i) : o(s);
  }
  error(t, e) {
    this.emit("error", t, e);
  }
  warn(t, e) {
    this.emit("warn", t, e);
  }
  info(t, e) {
    this.emit("info", t, e);
  }
  debug(t, e) {
    this.emit("debug", t, e);
  }
  trace(t, e) {
    this.emit("trace", t, e);
  }
  log(t, e, n) {
    this.emit(t, e, n);
  }
}
function Be() {
  const r = Date.now();
  return {
    elapsed: () => Date.now() - r
  };
}
let ue = {}, he = $;
function Zn(r) {
  ue = r;
}
function qe(r) {
  he = r;
}
async function De({
  endpoint: r,
  requestBody: t,
  headers: e,
  ...n
}) {
  const s = t ? JSON.stringify(t) : void 0, i = {
    Accept: "application/json, text/plain, */*",
    ...s ? { "Content-Type": "application/json" } : void 0,
    ...e
  };
  let o;
  try {
    o = await fetch(r, { body: s, headers: i, ...n });
  } catch (a) {
    throw new Ct(a instanceof Error ? a.message : "Network request failed");
  }
  if (!o.ok) {
    let a;
    try {
      a = await o.json();
    } catch {
      a = { error: "bad response" };
    }
    if (o.status === 400 && "code" in a && typeof a.code == "number" && "detail" in a && typeof a.detail == "string")
      throw new Ot(a.code, a.detail);
    let c = "HTTP request failed";
    throw "error" in a && typeof a.error == "string" ? c = a.error : "detail" in a && typeof a.detail == "string" && (c = a.detail), new ht(c, o.status);
  }
  try {
    return await o.json();
  } catch (a) {
    throw he.error("Failed to parse HTTP response", { err: a }), new ht("bad response", o.status);
  }
}
async function le(r) {
  return await De({ ...r, ...ue });
}
let pt;
typeof WebSocket < "u" && (pt = WebSocket);
function ts(r) {
  pt = r;
}
function Ke() {
  if (pt === void 0)
    throw new Error("WebSocket implementation not initialized");
  return pt;
}
class P {
  static fromHex(t) {
    if (t = t.trim(), t.length === 0)
      return new Uint8Array(0);
    if (t.length < 2 || t.length & 1)
      throw new Error("Invalid hex string: odd length.");
    if ((t.startsWith("0x") || t.startsWith("0X")) && (t = t.slice(2)), !t.match(/^[0-9a-fA-F]*$/))
      throw new Error("Invalid hex string: contains non-hex characters");
    const n = t.match(/.{1,2}/g);
    if (!n)
      throw new Error("Invalid hex string");
    return new Uint8Array(n.map((s) => parseInt(s, 16)));
  }
  static toHex(t) {
    return Array.from(t, (e) => e.toString(16).padStart(2, "0")).join("");
  }
  static fromString(t) {
    return t = t.trim(), new TextEncoder().encode(t);
  }
  static toString(t) {
    return new TextDecoder("utf-8").decode(t);
  }
  static concat(...t) {
    const e = t.reduce((i, o) => i + o.length, 0), n = new Uint8Array(e);
    let s = 0;
    for (const i of t)
      n.set(i, s), s += i.length;
    return n;
  }
  static alloc(t) {
    return new Uint8Array(t);
  }
  static writeBigUint64BE(t) {
    const e = new ArrayBuffer(8);
    return new DataView(e).setBigUint64(0, t, !1), new Uint8Array(e);
  }
  static toBase64(t) {
    if (typeof Buffer < "u")
      return Buffer.from(t).toString("base64");
    if (t.length > 32768) {
      let e = "";
      for (let n = 0; n < t.length; n += 32768) {
        const s = t.slice(n, n + 32768);
        e += btoa(String.fromCharCode(...s));
      }
      return e;
    }
    return btoa(String.fromCharCode(...t));
  }
  static fromBase64(t) {
    t = t.trim();
    let e = t.replace(/-/g, "+").replace(/_/g, "/");
    for (; e.length % 4; )
      e += "=";
    return typeof Buffer < "u" ? new Uint8Array(Buffer.from(e, "base64")) : new Uint8Array([...atob(e)].map((n) => n.charCodeAt(0)));
  }
  static equals(t, e) {
    if (t.length !== e.length) return !1;
    let n = 0;
    for (let s = 0; s < t.length; s++)
      n |= t[s] ^ e[s];
    return n === 0;
  }
  static compare(t, e) {
    const n = Math.min(t.length, e.length);
    for (let s = 0; s < n; s++) {
      if (t[s] < e[s]) return -1;
      if (t[s] > e[s]) return 1;
    }
    return t.length - e.length;
  }
}
function Tt(r) {
  return P.toBase64(r).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function xt(r) {
  return P.fromBase64(r);
}
function de(r) {
  const t = JSON.stringify(r);
  return Fe(P.toBase64(P.fromString(t)));
}
function Ue(r) {
  const t = P.toString(P.fromBase64(Re(r)));
  return JSON.parse(t);
}
function Re(r) {
  return r.replace(/-/g, "+").replace(/_/g, "/").split("=")[0];
}
function Fe(r) {
  return r.replace(/\+/g, "-").replace(/\//g, "_").split("=")[0];
}
function Bt(r) {
  if (typeof r != "string" || r.length === 0) return !1;
  const t = /^[A-Za-z0-9\-_]+={0,2}$/, e = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!t.test(r) && !e.test(r)) return !1;
  const n = r.replace(/-/g, "+").replace(/_/g, "/"), s = (4 - n.length % 4) % 4;
  if (s > 2) return !1;
  const i = n + "=".repeat(s);
  try {
    const o = P.fromBase64(i), a = P.toBase64(o), c = a.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), u = n.replace(/=+$/, "");
    return a.replace(/=+$/, "") === u || c === u;
  } catch {
    return !1;
  }
}
function Ne(r) {
  return typeof r == "number" || typeof r == "string";
}
function qt(r) {
  const t = [];
  return Dt(r, t), new Uint8Array(t);
}
function Dt(r, t) {
  if (r === null)
    t.push(246);
  else if (r === void 0)
    t.push(247);
  else if (typeof r == "boolean")
    t.push(r ? 245 : 244);
  else if (typeof r == "number")
    fe(r, t);
  else if (typeof r == "string")
    pe(r, t);
  else if (Array.isArray(r))
    $e(r, t);
  else if (r instanceof Uint8Array)
    Le(r, t);
  else if (
    // Defensive: POJO only (null/array handled above)
    typeof r == "object" && r !== null && !Array.isArray(r)
  )
    We(r, t);
  else
    throw new Error("Unsupported type");
}
function fe(r, t) {
  if (r < 24)
    t.push(r);
  else if (r < 256)
    t.push(24, r);
  else if (r < 65536)
    t.push(25, r >> 8, r & 255);
  else if (r < 4294967296)
    t.push(26, r >> 24, r >> 16 & 255, r >> 8 & 255, r & 255);
  else
    throw new Error("Unsupported integer size");
}
function Le(r, t) {
  const e = r.length;
  if (e < 24)
    t.push(64 + e);
  else if (e < 256)
    t.push(88, e);
  else if (e < 65536)
    t.push(89, e >> 8 & 255, e & 255);
  else if (e < 4294967296)
    t.push(
      90,
      e >> 24 & 255,
      e >> 16 & 255,
      e >> 8 & 255,
      e & 255
    );
  else
    throw new Error("Byte string too long to encode");
  for (let n = 0; n < r.length; n++)
    t.push(r[n]);
}
function pe(r, t) {
  const e = new TextEncoder().encode(r), n = e.length;
  if (n < 24)
    t.push(96 + n);
  else if (n < 256)
    t.push(120, n);
  else if (n < 65536)
    t.push(121, n >> 8 & 255, n & 255);
  else if (n < 4294967296)
    t.push(
      122,
      n >> 24 & 255,
      n >> 16 & 255,
      n >> 8 & 255,
      n & 255
    );
  else
    throw new Error("String too long to encode");
  for (let s = 0; s < e.length; s++)
    t.push(e[s]);
}
function $e(r, t) {
  const e = r.length;
  if (e < 24)
    t.push(128 | e);
  else if (e < 256)
    t.push(152, e);
  else if (e < 65536)
    t.push(153, e >> 8, e & 255);
  else
    throw new Error("Unsupported array length");
  for (const n of r)
    Dt(n, t);
}
function We(r, t) {
  const e = Object.keys(r);
  fe(e.length, t), t[t.length - 1] |= 160;
  for (const n of e)
    pe(n, t), Dt(r[n], t);
}
function Kt(r) {
  const t = new DataView(r.buffer, r.byteOffset, r.byteLength);
  return gt(t, 0).value;
}
function gt(r, t) {
  if (t >= r.byteLength)
    throw new Error("Unexpected end of data");
  const e = r.getUint8(t++), n = e >> 5, s = e & 31;
  switch (n) {
    case 0:
      return je(r, t, s);
    case 1:
      return He(r, t, s);
    case 2:
      return Qe(r, t, s);
    case 3:
      return ze(r, t, s);
    case 4:
      return Ge(r, t, s);
    case 5:
      return Ve(r, t, s);
    case 7:
      return Xe(r, t, s);
    default:
      throw new Error(`Unsupported major type: ${n}`);
  }
}
function it(r, t, e) {
  if (e < 24) return { value: e, offset: t };
  if (e === 24) return { value: r.getUint8(t++), offset: t };
  if (e === 25) {
    const n = r.getUint16(t, !1);
    return t += 2, { value: n, offset: t };
  }
  if (e === 26) {
    const n = r.getUint32(t, !1);
    return t += 4, { value: n, offset: t };
  }
  if (e === 27) {
    const n = r.getUint32(t, !1), s = r.getUint32(t + 4, !1);
    return t += 8, { value: n * 2 ** 32 + s, offset: t };
  }
  throw new Error(`Unsupported length: ${e}`);
}
function je(r, t, e) {
  const { value: n, offset: s } = it(r, t, e);
  return { value: n, offset: s };
}
function He(r, t, e) {
  const { value: n, offset: s } = it(r, t, e);
  return { value: -1 - n, offset: s };
}
function Qe(r, t, e) {
  const { value: n, offset: s } = it(r, t, e);
  if (s + n > r.byteLength)
    throw new Error("Byte string length exceeds data length");
  return { value: new Uint8Array(r.buffer, r.byteOffset + s, n), offset: s + n };
}
function ze(r, t, e) {
  const { value: n, offset: s } = it(r, t, e);
  if (s + n > r.byteLength)
    throw new Error("String length exceeds data length");
  const i = new Uint8Array(r.buffer, r.byteOffset + s, n);
  return { value: new TextDecoder().decode(i), offset: s + n };
}
function Ge(r, t, e) {
  const { value: n, offset: s } = it(r, t, e), i = [];
  let o = s;
  for (let a = 0; a < n; a++) {
    const c = gt(r, o);
    i.push(c.value), o = c.offset;
  }
  return { value: i, offset: o };
}
function Ve(r, t, e) {
  const { value: n, offset: s } = it(r, t, e), i = {};
  let o = s;
  for (let a = 0; a < n; a++) {
    const c = gt(r, o);
    if (!Ne(c.value))
      throw new Error("Invalid key type");
    const u = gt(r, c.offset);
    i[c.value] = u.value, o = u.offset;
  }
  return { value: i, offset: o };
}
function Je(r) {
  const t = (r & 31744) >> 10, e = r & 1023, n = r & 32768 ? -1 : 1;
  return t === 0 ? n * 2 ** -14 * (e / 1024) : t === 31 ? e ? NaN : n * (1 / 0) : n * 2 ** (t - 15) * (1 + e / 1024);
}
function Xe(r, t, e) {
  if (e < 24)
    switch (e) {
      case 20:
        return { value: !1, offset: t };
      case 21:
        return { value: !0, offset: t };
      case 22:
        return { value: null, offset: t };
      case 23:
        return { value: void 0, offset: t };
      default:
        throw new Error(`Unknown simple value: ${e}`);
    }
  if (e === 24) return { value: r.getUint8(t++), offset: t };
  if (e === 25) {
    const n = Je(r.getUint16(t, !1));
    return t += 2, { value: n, offset: t };
  }
  if (e === 26) {
    const n = r.getFloat32(t, !1);
    return t += 4, { value: n, offset: t };
  }
  if (e === 27) {
    const n = r.getFloat64(t, !1);
    return t += 8, { value: n, offset: t };
  }
  throw new Error(`Unknown simple or float value: ${e}`);
}
const es = (r) => {
  const t = [
    "P2PK",
    {
      nonce: R(It(32)),
      data: r
    }
  ];
  return JSON.stringify(t);
}, V = (r) => {
  try {
    return r instanceof Uint8Array && (r = new TextDecoder().decode(r)), JSON.parse(r);
  } catch {
    throw new Error("can't parse secret");
  }
}, Ye = (r, t) => {
  const e = F(r), n = J.sign(e, t);
  return R(n);
}, Ze = (r, t) => {
  const e = F(r), n = J.sign(e, t);
  return R(n);
}, Ut = (r, t, e) => {
  try {
    const n = F(t), s = e.length === 66 ? e.slice(2) : e;
    if (J.verify(r, n, D(s)))
      return !0;
  } catch (n) {
    console.error("verifyP2PKsecret error:", n);
  }
  return !1;
}, ns = (r, t) => t.witness ? Ft(t.witness).some((n) => {
  try {
    return Ut(n, t.secret, r);
  } catch {
    return !1;
  }
}) : !1;
function Rt(r) {
  try {
    const t = typeof r == "string" ? V(r) : r;
    if (t[0] !== "P2PK")
      throw new Error('Invalid P2PK secret: must start with "P2PK"');
    const e = Math.floor(Date.now() / 1e3);
    return ge(t) > e ? tn(t) : en(t);
  } catch {
  }
  return [];
}
function tn(r) {
  const t = typeof r == "string" ? V(r) : r;
  if (t[0] !== "P2PK")
    throw new Error('Invalid P2PK secret: must start with "P2PK"');
  const { data: e, tags: n } = t[1], s = n && n.find((o) => o[0] === "pubkeys"), i = s && s.length > 1 ? s.slice(1) : [];
  return [e, ...i].filter(Boolean);
}
function en(r) {
  const t = typeof r == "string" ? V(r) : r;
  if (t[0] !== "P2PK")
    throw new Error('Invalid P2PK secret: must start with "P2PK"');
  const { tags: e } = t[1], n = e && e.find((s) => s[0] === "refund");
  return n && n.length > 1 ? n.slice(1).filter(Boolean) : [];
}
function ge(r) {
  const t = typeof r == "string" ? V(r) : r;
  if (t[0] !== "P2PK")
    throw new Error('Invalid P2PK secret: must start with "P2PK"');
  const { tags: e } = t[1], n = e && e.find((s) => s[0] === "locktime");
  return n && n.length > 1 ? parseInt(n[1], 10) : 1 / 0;
}
function nn(r) {
  const t = typeof r == "string" ? V(r) : r;
  if (t[0] !== "P2PK")
    throw new Error('Invalid P2PK secret: must start with "P2PK"');
  if (!Rt(t).length)
    return 0;
  const { tags: n } = t[1], s = Math.floor(Date.now() / 1e3);
  if (ge(t) > s) {
    const a = n && n.find((c) => c[0] === "n_sigs");
    return a && a.length > 1 ? parseInt(a[1], 10) : 1;
  }
  const o = n && n.find((a) => a[0] === "n_sigs_refund");
  return o && o.length > 1 ? parseInt(o[1], 10) : 1;
}
function ss(r) {
  const t = typeof r == "string" ? V(r) : r;
  if (t[0] !== "P2PK")
    throw new Error('Invalid P2PK secret: must start with "P2PK"');
  const { tags: e } = t[1], n = e && e.find((s) => s[0] === "sigflag");
  return n && n.length > 1 ? n[1] : "SIG_INPUTS";
}
const Ft = (r) => {
  if (!r) return [];
  if (typeof r == "string")
    try {
      return JSON.parse(r).signatures || [];
    } catch (t) {
      return console.error("Failed to parse witness string:", t), [];
    }
  return r.signatures || [];
}, sn = (r, t, e = $) => r.map((n, s) => {
  try {
    const i = Array.isArray(t) ? t : [t];
    let o = n;
    for (const a of i)
      try {
        o = rn(o, a);
      } catch (c) {
        const u = c instanceof Error ? c.message : "Unknown error";
        e.warn(`Proof #${s + 1}: ${u}`);
      }
    return o;
  } catch (i) {
    const o = i instanceof Error ? i.message : "Unknown error";
    throw e.error(`Proof #${s + 1}: ${o}`), new Error(`Failed signing proof #${s + 1}: ${o}`);
  }
}), rn = (r, t) => {
  const e = V(r.secret);
  if (e[0] !== "P2PK")
    throw new Error("not a P2PK secret");
  const n = R(J.getPublicKey(t)), s = Rt(e);
  if (!s.length || !s.some((c) => c.includes(n)))
    throw new Error(`Signature not required from [02|03]${n}`);
  const i = Ft(r.witness);
  if (i.some((c) => {
    try {
      return Ut(c, r.secret, n);
    } catch {
      return !1;
    }
  }))
    throw new Error(`Proof already signed by [02|03]${n}`);
  const a = Ye(r.secret, t);
  return i.push(a), { ...r, witness: { signatures: i } };
}, rs = (r) => {
  if (!r.witness)
    throw new Error("could not verify signature, no witness provided");
  const t = V(r.secret), e = Rt(t);
  if (!e.length)
    throw new Error("no signatures required, proof is unlocked");
  let n = 0;
  const s = nn(t), i = Ft(r.witness);
  for (const o of e)
    i.some((c) => {
      try {
        return Ut(c, r.secret, o);
      } catch {
        return !1;
      }
    }) && n++;
  return n >= s;
}, is = (r, t) => {
  if (!r.witness?.signatures || r.witness.signatures.length === 0)
    throw new Error("could not verify signature, no witness signatures provided");
  return J.verify(
    r.witness.signatures[0],
    F(r.B_.toHex(!0)),
    t.slice(2)
  );
}, me = (r, t) => {
  const e = r.B_.toHex(!0), n = Ze(e, t);
  return r.witness = { signatures: [n] }, r;
}, os = (r, t) => r.map((e) => me(e, t)), on = D("536563703235366b315f48617368546f43757276655f43617368755f");
function dt(r) {
  const t = F(P.concat(on, r)), e = new Uint32Array(1), n = 2 ** 16;
  for (let s = 0; s < n; s++) {
    const i = new Uint8Array(e.buffer), o = F(P.concat(t, i));
    try {
      return rt(R(P.concat(new Uint8Array([2]), o)));
    } catch {
      e[0]++;
    }
  }
  throw new Error("No valid point found");
}
function ye(r) {
  const e = r.map((n) => n.toHex(!1)).join("");
  return F(new TextEncoder().encode(e));
}
function as(r) {
  return x.Point.fromHex(R(r));
}
function rt(r) {
  return x.Point.fromHex(r);
}
const an = (r) => {
  let t;
  return /^[a-fA-F0-9]+$/.test(r) ? t = Lt(r) % BigInt(2 ** 31 - 1) : t = Q(xt(r)) % BigInt(2 ** 31 - 1), t;
};
function we() {
  return x.utils.randomSecretKey();
}
function cs(r, t, e, n) {
  return { C_: r.multiply(Q(t)), amount: e, id: n };
}
function us(r) {
  return ft(
    It(32),
    Q(x.utils.randomSecretKey()),
    r
  );
}
function ft(r, t, e) {
  const n = dt(r);
  t || (t = Q(x.utils.randomSecretKey()));
  const s = x.Point.BASE.multiply(t), i = n.add(s);
  return e !== void 0 ? me({ B_: i, r: t, secret: r }, e) : { B_: i, r: t, secret: r };
}
function cn(r, t, e) {
  return r.subtract(e.multiply(t));
}
function un(r, t, e, n) {
  const s = n, i = cn(r.C_, t, s);
  return {
    id: r.id,
    amount: r.amount,
    secret: e,
    C: i
  };
}
const hn = (r) => ({
  amount: r.amount,
  C: r.C.toHex(!0),
  id: r.id,
  secret: new TextDecoder().decode(r.secret),
  witness: JSON.stringify(r.witness)
}), hs = (r) => ({
  amount: r.amount,
  C: rt(r.C),
  id: r.id,
  secret: new TextEncoder().encode(r.secret),
  witness: r.witness ? JSON.parse(r.witness) : void 0
}), Xt = "m/0'/0'/0'";
function ln(r) {
  const t = {};
  return Object.keys(r).forEach((e) => {
    t[e] = R(r[e]);
  }), t;
}
function ls(r) {
  const t = {};
  return Object.keys(r).forEach((e) => {
    t[e] = D(r[e]);
  }), t;
}
function dn(r) {
  return x.getPublicKey(r, !0);
}
function ds(r, t) {
  let e = 0n;
  const n = {}, s = {};
  let i;
  for (t && (i = oe.fromMasterSeed(t)); e < r; ) {
    const a = (2n ** e).toString();
    if (i) {
      const c = i.derive(`${Xt}/${e}`).privateKey;
      if (c)
        s[a] = c;
      else
        throw new Error(`Could not derive Private key from: ${Xt}/${e}`);
    } else
      s[a] = we();
    n[a] = dn(s[a]), e++;
  }
  const o = Wt(ln(n));
  return { pubKeys: n, privKeys: s, keysetId: o };
}
function fs(r, t) {
  return dt(r.secret).multiply(Q(t)).equals(r.C);
}
const fn = "m/129372'/0'", pn = (r, t, e) => {
  const n = /^[a-fA-F0-9]+$/.test(t);
  if (!n && Bt(t) || n && t.startsWith("00"))
    return mt(
      r,
      t,
      e,
      0
      /* SECRET */
    );
  if (n && t.startsWith("01"))
    return ke(
      r,
      t,
      e,
      0
      /* SECRET */
    );
  throw new Error(`Unrecognized keyset ID version ${t.slice(0, 2)}`);
}, gn = (r, t, e) => {
  const n = /^[a-fA-F0-9]+$/.test(t);
  if (!n && Bt(t) || n && t.startsWith("00"))
    return mt(
      r,
      t,
      e,
      1
      /* BLINDING_FACTOR */
    );
  if (n && t.startsWith("01"))
    return ke(
      r,
      t,
      e,
      1
      /* BLINDING_FACTOR */
    );
  throw new Error(`Unrecognized keyset ID version ${t.slice(0, 2)}`);
}, ke = (r, t, e, n) => {
  let s = P.concat(
    P.fromString("Cashu_KDF_HMAC_SHA256"),
    P.fromHex(t),
    P.writeBigUint64BE(BigInt(e))
  );
  switch (n) {
    case 0:
      s = P.concat(s, P.fromHex("00"));
      break;
    case 1:
      s = P.concat(s, P.fromHex("01"));
  }
  return xe(F, r, s);
}, mt = (r, t, e, n) => {
  const s = oe.fromMasterSeed(r), i = an(t), o = `${fn}/${i}'/${e}'/${n}`, a = s.derive(o);
  if (a.privateKey === null)
    throw new Error("Could not derive private key");
  return a.privateKey;
};
function mn(r, t) {
  if (r.length !== t.length) return !1;
  for (let e = 0; e < r.length; e++)
    if (r[e] !== t[e]) return !1;
  return !0;
}
const yn = (r, t, e, n) => {
  const s = x.Point.BASE.multiply(x.Point.Fn.fromBytes(r.s)), i = n.multiply(Q(r.e)), o = t.multiply(Q(r.s)), a = e.multiply(Q(r.e)), c = s.subtract(i), u = o.subtract(a), l = ye([c, u, n, e]);
  return mn(l, r.e);
}, wn = (r, t, e, n) => {
  if (t.r === void 0) throw new Error("verifyDLEQProof_reblind: Undefined blinding factor");
  const s = dt(r), i = e.add(n.multiply(t.r)), o = x.Point.BASE.multiply(t.r), a = s.add(o);
  return yn(t, a, i, n);
}, ps = (r, t) => {
  const e = x.Point.Fn.fromBytes(we()), n = x.Point.BASE.multiply(e), s = r.multiply(e), i = x.Point.Fn.fromBytes(t), o = r.multiply(i), a = x.Point.BASE.multiply(i), c = ye([n, s, a, o]), u = x.Point.Fn.fromBytes(c), l = x.Point.Fn.add(e, x.Point.Fn.mul(u, i));
  return { s: Oe(l, 32), e: c };
};
function _e(r, t) {
  let e = r;
  for (const s of t)
    e += s.B_;
  const n = new TextEncoder().encode(e);
  return F(n);
}
function kn(r, t, e) {
  const n = _e(t, e), s = ct(r), i = J.sign(n, s);
  return nt(i);
}
function gs(r, t, e, n) {
  const s = ct(n);
  let i = ct(r);
  if (i.length !== 33) return !1;
  i = i.slice(1);
  const o = _e(t, e);
  return J.verify(s, o, i);
}
class Nt {
  constructor(t, e, n, s, i, o, a = !1, c) {
    this.transport = t, this.id = e, this.amount = n, this.unit = s, this.mints = i, this.description = o, this.singleUse = a, this.nut10 = c;
  }
  toRawRequest() {
    const t = {};
    return this.transport && (t.t = this.transport.map((e) => ({
      t: e.type,
      a: e.target,
      g: e.tags
    }))), this.id && (t.i = this.id), this.amount && (t.a = this.amount), this.unit && (t.u = this.unit), this.mints && (t.m = this.mints), this.description && (t.d = this.description), this.singleUse && (t.s = this.singleUse), this.nut10 && (t.nut10 = {
      k: this.nut10.kind,
      d: this.nut10.data,
      t: this.nut10.tags
    }), t;
  }
  toEncodedRequest() {
    const t = this.toRawRequest(), e = qt(t);
    return "creqA" + P.toBase64(e);
  }
  getTransport(t) {
    return this.transport?.find((e) => e.type === t);
  }
  static fromRawRequest(t) {
    const e = t.t ? t.t.map((s) => ({
      type: s.t,
      target: s.a,
      tags: s.g
    })) : void 0, n = t.nut10 ? {
      kind: t.nut10.k,
      data: t.nut10.d,
      tags: t.nut10.t
    } : void 0;
    return new Nt(
      e,
      t.i,
      t.a,
      t.u,
      t.m,
      t.d,
      t.s,
      n
    );
  }
  static fromEncodedRequest(t) {
    if (!t.startsWith("creq"))
      throw new Error("unsupported pr: invalid prefix");
    if (t[4] !== "A")
      throw new Error("unsupported pr version");
    const n = t.slice(5), s = xt(n), i = Kt(s);
    return this.fromRawRequest(i);
  }
}
function G(r, t, e, n) {
  if (e) {
    const i = Yt(e);
    if (r === 0 && i === 0)
      return e;
    const o = e.filter((c) => c > 0), a = Yt(o);
    if (a > r)
      throw new Error(`Split is greater than total amount: ${a} > ${r}`);
    if (o.some((c) => !Pe(c, t)))
      throw new Error("Provided amount preferences do not match the amounts of the mint keyset.");
    if (a === r)
      return o;
    e = o, r -= a;
  } else
    e = [];
  const s = be(t, "desc");
  if (!s || s.length === 0)
    throw new Error("Cannot split amount, keyset is inactive or contains no keys");
  for (const i of s) {
    if (i <= 0) continue;
    const o = Math.floor(r / i);
    if (e.push(...Array(o).fill(i)), r -= i * o, r === 0) break;
  }
  if (r !== 0)
    throw new Error(`Unable to split remaining amount: ${r}`);
  return n ? e.sort((i, o) => n === "desc" ? o - i : i - o) : e;
}
function _n(r, t, e, n) {
  const s = [], i = r.map((c) => c.amount);
  be(e, "asc").forEach((c) => {
    const u = i.filter((h) => h === c).length, l = Math.max(n - u, 0);
    for (let h = 0; h < l && !(s.reduce((d, g) => d + g, 0) + c > t); ++h)
      s.push(c);
  });
  const a = t - s.reduce((c, u) => c + u, 0);
  return a && G(a, e).forEach((u) => {
    s.push(u);
  }), s.sort((c, u) => c - u);
}
function be(r, t = "desc") {
  return t == "desc" ? Object.keys(r).map((e) => parseInt(e)).sort((e, n) => n - e) : Object.keys(r).map((e) => parseInt(e)).sort((e, n) => e - n);
}
function Pe(r, t) {
  return r in t;
}
function Q(r) {
  return Lt(R(r));
}
function Lt(r) {
  return BigInt(`0x${r}`);
}
function bn(r) {
  return r.toString(16).padStart(64, "0");
}
function Et(r) {
  return /^[a-f0-9]*$/i.test(r);
}
function $t(r) {
  return Array.isArray(r) ? r.some((t) => !Et(t.id)) : !Et(r.id);
}
function ms(r, t) {
  return typeof t == "bigint" ? t.toString() : t;
}
function Pn(r, t) {
  $t(r.proofs) || (r.proofs = ve(r.proofs)), t && (r.proofs = jt(r.proofs));
  const e = { token: [{ mint: r.mint, proofs: r.proofs }] };
  return r.unit && (e.unit = r.unit), r.memo && (e.memo = r.memo), "cashu" + "A" + de(e);
}
function ve(r) {
  return r.map((t) => {
    const e = { ...t };
    return e.id = e.id.slice(0, 16), e;
  });
}
function ys(r, t) {
  if ($t(r.proofs) || t?.version === 3) {
    if (t?.version === 4)
      throw new Error("can not encode to v4 token if proofs contain non-hex keyset id");
    return Pn(r, t?.removeDleq);
  }
  return vn(r, t?.removeDleq);
}
function vn(r, t) {
  if (t && (r.proofs = jt(r.proofs)), r.proofs.forEach((c) => {
    if (c.dleq && c.dleq.r == null)
      throw new Error("Missing blinding factor in included DLEQ proof");
  }), $t(r.proofs))
    throw new Error("can not encode to v4 token if proofs contain non-hex keyset id");
  r.proofs = ve(r.proofs);
  const n = Ae(r), s = qt(n), i = "cashu", o = "B", a = Tt(s);
  return i + o + a;
}
function Ae(r) {
  const t = {}, e = r.mint;
  for (let s = 0; s < r.proofs.length; s++) {
    const i = r.proofs[s];
    t[i.id] ? t[i.id].push(i) : t[i.id] = [i];
  }
  const n = {
    m: e,
    u: r.unit || "sat",
    t: Object.keys(t).map(
      (s) => ({
        i: D(s),
        p: t[s].map(
          (i) => ({
            a: i.amount,
            s: i.secret,
            c: D(i.C),
            ...i.dleq && {
              d: {
                e: D(i.dleq.e),
                s: D(i.dleq.s),
                r: D(i.dleq.r ?? "00")
              }
            },
            ...i.witness && {
              w: JSON.stringify(i.witness)
            }
          })
        )
      })
    )
  };
  return r.memo && (n.d = r.memo), n;
}
function Se(r) {
  const t = [];
  r.t.forEach(
    (n) => n.p.forEach((s) => {
      t.push({
        secret: s.s,
        C: R(s.c),
        amount: s.a,
        id: R(n.i),
        ...s.d && {
          dleq: {
            r: R(s.d.r),
            s: R(s.d.s),
            e: R(s.d.e)
          }
        },
        ...s.w && {
          witness: s.w
        }
      });
    })
  );
  const e = { mint: r.m, proofs: t, unit: r.u || "sat" };
  return r.d && (e.memo = r.d), e;
}
function An(r, t) {
  ["web+cashu://", "cashu://", "cashu:", "cashu"].forEach((s) => {
    r.startsWith(s) && (r = r.slice(s.length));
  });
  const n = Sn(r);
  return n.proofs = Mn(n.proofs, t), n;
}
function Sn(r) {
  const t = r.slice(0, 1), e = r.slice(1);
  if (t === "A") {
    const n = Ue(e);
    if (n.token.length > 1)
      throw new Error("Multi entry token are not supported");
    const s = n.token[0], i = {
      mint: s.mint,
      proofs: s.proofs,
      unit: n.unit || "sat"
    };
    return n.memo && (i.memo = n.memo), i;
  } else if (t === "B") {
    const n = xt(e), s = Kt(n);
    return Se(s);
  }
  throw new Error("Token version is not supported");
}
function Wt(r, t, e, n = 0, s = !1) {
  if (s) {
    const c = Object.entries(r).sort((h, d) => +h[0] - +d[0]).map(([, h]) => h).reduce((h, d) => h + d, ""), u = F(c);
    return P.toBase64(u).slice(0, 12);
  }
  let i = Object.entries(r).sort((c, u) => +c[0] - +u[0]).map(([, c]) => D(c)).reduce((c, u) => bt(c, u), new Uint8Array()), o, a;
  switch (n) {
    case 0:
      return o = F(i), a = P.toHex(o).slice(0, 14), "00" + a;
    case 1:
      if (!t)
        throw new Error("Cannot compute keyset ID version 01: unit is required.");
      return i = bt(i, P.fromString("unit:" + t)), e && (i = bt(
        i,
        P.fromString("final_expiry:" + e.toString())
      )), o = F(i), a = P.toHex(o), "01" + a;
    default:
      throw new Error(`Unrecognized keyset ID version: ${n}`);
  }
}
function bt(r, t) {
  const e = new Uint8Array(r.length + t.length);
  return e.set(r), e.set(t, r.length), e;
}
function ws(r) {
  return r.sort((t, e) => t.id.localeCompare(e.id));
}
function M(r) {
  return typeof r == "object";
}
function ks(r) {
  if (M(r)) {
    if ("error" in r && r.error)
      throw new Error(r.error);
    if ("detail" in r && r.detail)
      throw new Error(r.detail);
  }
}
function j(...r) {
  return r.map((t) => t.replace(/(^\/+|\/+$)/g, "")).join("/");
}
function Te(r) {
  return r.replace(/\/$/, "");
}
function tt(r) {
  return r.reduce((t, e) => t + e.amount, 0);
}
function _s(r) {
  return Nt.fromEncodedRequest(r);
}
class Tn {
  get value() {
    return this._value;
  }
  set value(t) {
    this._value = t;
  }
  get next() {
    return this._next;
  }
  set next(t) {
    this._next = t;
  }
  constructor(t) {
    this._value = t, this._next = null;
  }
}
class En {
  get first() {
    return this._first;
  }
  set first(t) {
    this._first = t;
  }
  get last() {
    return this._last;
  }
  set last(t) {
    this._last = t;
  }
  get size() {
    return this._size;
  }
  set size(t) {
    this._size = t;
  }
  constructor() {
    this._first = null, this._last = null, this._size = 0;
  }
  enqueue(t) {
    const e = new Tn(t);
    return this._size === 0 || !this._last ? (this._first = e, this._last = e) : (this._last.next = e, this._last = e), this._size++, !0;
  }
  dequeue() {
    if (this._size === 0 || !this._first) return null;
    const t = this._first;
    return this._first = t.next, t.next = null, this._size--, t.value;
  }
}
function jt(r) {
  return r.map((t) => {
    const e = { ...t };
    return delete e.dleq, e;
  });
}
function bs(r) {
  const t = Bt(r.id), e = /^[a-fA-F0-9]+$/.test(r.id), n = e ? D(r.id)[0] : 0;
  return Wt(
    r.keys,
    r.unit,
    r.final_expiry,
    n,
    t && !e
  ) === r.id;
}
function Mn(r, t) {
  const e = [];
  for (const n of r) {
    let s;
    try {
      s = D(n.id);
    } catch {
      e.push(n);
      continue;
    }
    if (s[0] === 0)
      e.push(n);
    else if (s[0] === 1) {
      if (!t)
        throw new Error("A short keyset ID v2 was encountered, but got no keysets to map it to.");
      let i = !1;
      for (const o of t)
        if (n.id === o.id.slice(0, n.id.length)) {
          n.id = o.id, e.push(n), i = !0;
          break;
        }
      if (!i)
        throw new Error(
          `Couldn't map short keyset ID ${n.id} to any known keysets of the current Mint`
        );
    } else
      throw new Error(`Unknown keyset ID version: ${s[0]}`);
  }
  return e;
}
function Ee(r, t) {
  if (r.dleq == null)
    return !1;
  const e = {
    e: D(r.dleq.e),
    s: D(r.dleq.s),
    r: Lt(r.dleq.r ?? "00")
  };
  if (!Pe(r.amount, t.keys))
    throw new Error(`undefined key for amount ${r.amount}`);
  const n = t.keys[r.amount];
  return wn(
    new TextEncoder().encode(r.secret),
    e,
    rt(r.C),
    rt(n)
  );
}
function In(...r) {
  const t = r.reduce((s, i) => s + i.length, 0), e = new Uint8Array(t);
  let n = 0;
  for (let s = 0; s < r.length; s++)
    e.set(r[s], n), n = n + r[s].length;
  return e;
}
function Ps(r) {
  const t = new TextEncoder(), e = Ae(r), n = qt(e), s = t.encode("craw"), i = t.encode("B");
  return In(s, i, n);
}
function vs(r) {
  const t = new TextDecoder(), e = t.decode(r.slice(0, 4)), n = t.decode(new Uint8Array([r[4]]));
  if (e !== "craw" || n !== "B")
    throw new Error("not a valid binary token");
  const s = r.slice(5), i = Kt(s);
  return Se(i);
}
function Yt(r) {
  return r.reduce((t, e) => t + e, 0);
}
function Zt(r, t) {
  if (r === t) return !0;
  if (r == null || t == null || typeof r != "object" || typeof t != "object") return !1;
  if (Array.isArray(r) && Array.isArray(t))
    return r.length !== t.length ? !1 : r.every((s, i) => Zt(s, t[i]));
  if (Array.isArray(r) || Array.isArray(t)) return !1;
  const e = Object.keys(r), n = Object.keys(t);
  return e.length !== n.length ? !1 : e.every((s) => n.includes(s) && Zt(r[s], t[s]));
}
class st {
  constructor() {
    this.connectionMap = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    return st.instance || (st.instance = new st()), st.instance;
  }
  getConnection(t, e) {
    if (this.connectionMap.has(t))
      return this.connectionMap.get(t);
    const n = new Cn(t, e);
    return this.connectionMap.set(t, n), n;
  }
}
class Cn {
  constructor(t, e) {
    this.subListeners = {}, this.rpcListeners = {}, this.rpcId = 0, this.onCloseCallbacks = [], this._WS = Ke(), this.url = new URL(t), this.messageQueue = new En(), this._logger = e ?? $;
  }
  connect() {
    return this.connectionPromise || (this.connectionPromise = new Promise((t, e) => {
      try {
        this.ws = new this._WS(this.url.toString()), this.onCloseCallbacks = [];
      } catch (n) {
        e(n instanceof Error ? n : new Error(String(n)));
        return;
      }
      this.ws.onopen = () => {
        t();
      }, this.ws.onerror = () => {
        e(new Error("Failed to open WebSocket"));
      }, this.ws.onmessage = (n) => {
        this.messageQueue.enqueue(n.data), this.handlingInterval || (this.handlingInterval = setInterval(
          this.handleNextMessage.bind(this),
          0
        ));
      }, this.ws.onclose = (n) => {
        this.connectionPromise = void 0, this.onCloseCallbacks.forEach((s) => s(n));
      };
    })), this.connectionPromise;
  }
  sendRequest(t, e) {
    if (this.ws?.readyState !== 1) {
      if (t === "unsubscribe")
        return;
      throw this._logger.error("Attempted sendRequest, but socket was not open"), new Error("Socket not open");
    }
    const n = this.rpcId;
    this.rpcId++;
    const s = JSON.stringify({ jsonrpc: "2.0", method: t, params: e, id: n });
    this.ws?.send(s);
  }
  /**
   * @deprecated Use cancelSubscription for JSONRPC compliance.
   */
  closeSubscription(t) {
    this.ws?.send(JSON.stringify(["CLOSE", t]));
  }
  addSubListener(t, e) {
    (this.subListeners[t] = this.subListeners[t] || []).push(
      e
    );
  }
  addRpcListener(t, e, n) {
    this.rpcListeners[n] = { callback: t, errorCallback: e };
  }
  removeRpcListener(t) {
    delete this.rpcListeners[t];
  }
  removeListener(t, e) {
    if (this.subListeners[t]) {
      if (this.subListeners[t].length === 1) {
        delete this.subListeners[t];
        return;
      }
      this.subListeners[t] = this.subListeners[t].filter(
        (n) => n !== e
      );
    }
  }
  async ensureConnection() {
    this.ws?.readyState !== 1 && await this.connect();
  }
  handleNextMessage() {
    if (this.messageQueue.size === 0) {
      clearInterval(this.handlingInterval), this.handlingInterval = void 0;
      return;
    }
    const t = this.messageQueue.dequeue();
    let e;
    try {
      if (e = JSON.parse(t), "result" in e && e.id != null)
        this.rpcListeners[e.id] && (this.rpcListeners[e.id].callback(), this.removeRpcListener(e.id));
      else if ("error" in e && e.id != null)
        this.rpcListeners[e.id] && (this.rpcListeners[e.id].errorCallback(new Error(e.error.message)), this.removeRpcListener(e.id));
      else if ("method" in e && !("id" in e)) {
        const n = e.params?.subId;
        if (!n)
          return;
        if (this.subListeners[n]?.length > 0) {
          const s = e;
          this.subListeners[n].forEach((i) => i(s.params?.payload));
        }
      }
    } catch (n) {
      this._logger.error("Error doing handleNextMessage", { e: n });
      return;
    }
  }
  createSubscription(t, e, n) {
    if (this.ws?.readyState !== 1)
      throw this._logger.error("Attempted createSubscription, but socket was not open"), new Error("Socket is not open");
    const s = (Math.random() + 1).toString(36).substring(7);
    return this.addRpcListener(
      () => {
        this.addSubListener(s, e);
      },
      n,
      this.rpcId
    ), this.sendRequest("subscribe", { ...t, subId: s }), this.rpcId++, s;
  }
  /**
   * Cancels a subscription, sending an unsubscribe request and handling responses.
   *
   * @param subId The subscription ID to cancel.
   * @param callback The original payload callback to remove.
   * @param errorCallback Optional callback for unsubscribe errors (defaults to logging).
   */
  cancelSubscription(t, e, n) {
    this.removeListener(t, e), this.addRpcListener(
      () => {
        this._logger.info("Unsubscribed {subId}", { subId: t });
      },
      n || ((s) => this._logger.error("Unsubscribe failed", { e: s })),
      this.rpcId
    ), this.sendRequest("unsubscribe", { subId: t });
  }
  get activeSubscriptions() {
    return Object.keys(this.subListeners);
  }
  close() {
    this.ws && this.ws?.close();
  }
  onClose(t) {
    this.onCloseCallbacks.push(t);
  }
}
function at(r, t) {
  return r.state || (t.warn(
    "Field 'state' not found in MeltQuoteResponse. Update NUT-05 of mint: https://github.com/cashubtc/nuts/pull/136)"
  ), typeof r.paid == "boolean" && (r.state = r.paid ? ut.PAID : ut.UNPAID)), r;
}
function te(r, t) {
  return r.state || (t.warn(
    "Field 'state' not found in MintQuoteResponse. Update NUT-04 of mint: https://github.com/cashubtc/nuts/pull/141)"
  ), typeof r.paid == "boolean" && (r.state = r.paid ? St.PAID : St.UNPAID)), r;
}
function On(r, t) {
  return Array.isArray(r?.contact) && r?.contact.length > 0 && (r.contact = r.contact.map((e) => Array.isArray(e) && e.length === 2 && typeof e[0] == "string" && typeof e[1] == "string" ? (t.warn(
    "Mint returned deprecated 'contact' field: Update NUT-06: https://github.com/cashubtc/nuts/pull/117"
  ), { method: e[0], info: e[1] }) : e)), r;
}
class yt {
  constructor(t) {
    this.REGEX_METACHAR = /[\\^$.*+?()[\]{}|]/, this._mintInfo = t;
    const e = this.toEndpoints(t?.nuts?.[22]?.protected_endpoints);
    this._protected22 = this.buildIndex(e);
    const n = this.toEndpoints(t?.nuts?.[21]?.protected_endpoints);
    this._protected21 = this.buildIndex(n);
  }
  isSupported(t) {
    switch (t) {
      case 4:
      case 5:
        return this.checkMintMelt(t);
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 14:
      case 20:
        return this.checkGenericNut(t);
      case 17:
        return this.checkNut17();
      case 15:
        return this.checkNut15();
      default:
        throw new Error("nut is not supported by cashu-ts");
    }
  }
  requiresBlindAuthToken(t, e) {
    return this.matchesProtected(this._protected22, t, e);
  }
  requiresClearAuthToken(t, e) {
    return this.matchesProtected(this._protected21, t, e);
  }
  matchesProtected(t, e, n) {
    if (!t) return !1;
    const s = `${e} ${n}`, i = t.cache[s];
    if (typeof i == "boolean") return i;
    const o = t.exact.some((u) => u.method === e && u.path === n), a = o ? !1 : t.regex.some((u) => u.method === e && u.regex.test(n)), c = o || a;
    return t.cache[s] = c, c;
  }
  checkGenericNut(t) {
    return this._mintInfo.nuts[t]?.supported ? { supported: !0 } : { supported: !1 };
  }
  checkMintMelt(t) {
    const e = this._mintInfo.nuts[t];
    return e && e.methods.length > 0 && !e.disabled ? { disabled: !1, params: e.methods } : { disabled: !0, params: e?.methods ?? [] };
  }
  checkNut17() {
    return this._mintInfo.nuts[17] && this._mintInfo.nuts[17].supported.length > 0 ? { supported: !0, params: this._mintInfo.nuts[17].supported } : { supported: !1 };
  }
  checkNut15() {
    return this._mintInfo.nuts[15] && this._mintInfo.nuts[15].methods.length > 0 ? { supported: !0, params: this._mintInfo.nuts[15].methods } : { supported: !1 };
  }
  // ---------- private helpers ----------
  toEndpoints(t) {
    if (!Array.isArray(t)) return [];
    const e = [];
    for (const n of t)
      if (n && typeof n == "object") {
        const s = n, i = s.method, o = s.path;
        if (typeof i == "string" && typeof o == "string") {
          const a = i.toUpperCase();
          (a === "GET" || a === "POST") && e.push({ method: a, path: o });
        }
      }
    return e;
  }
  buildIndex(t) {
    if (!t || t.length === 0) return;
    const e = [], n = [], s = this.REGEX_METACHAR;
    for (const o of t) {
      if (o.path.startsWith("^") || o.path.endsWith("$") || s.test(o.path))
        try {
          n.push({ method: o.method, regex: new RegExp(o.path) });
          continue;
        } catch {
        }
      e.push({ method: o.method, path: o.path });
    }
    return { cache: {}, exact: e, regex: n };
  }
  // ---------- getters ----------
  get contact() {
    return this._mintInfo.contact;
  }
  get description() {
    return this._mintInfo.description;
  }
  get description_long() {
    return this._mintInfo.description_long;
  }
  get name() {
    return this._mintInfo.name;
  }
  get pubkey() {
    return this._mintInfo.pubkey;
  }
  get nuts() {
    return this._mintInfo.nuts;
  }
  get version() {
    return this._mintInfo.version;
  }
  get motd() {
    return this._mintInfo.motd;
  }
  /**
   * Checks if the mint supports creating BOLT12 offers with a description.
   *
   * @returns True if the mint supports offers with a description, false otherwise.
   */
  get supportsBolt12Description() {
    return this._mintInfo.nuts[4]?.methods.some(
      (t) => t.method === "bolt12" && t.options?.description === !0
    );
  }
}
class Ht {
  constructor(t, e) {
    this.tokenListeners = [], this.discoveryUrl = t, this.logger = e?.logger ?? $, this.clientId = e?.clientId ?? "cashu-client", this.scope = e?.scope ?? "openid", this.onTokens = e?.onTokens;
  }
  static fromMintInfo(t, e) {
    const n = t?.nuts?.["21"];
    if (!n?.openid_discovery)
      throw new Error("OIDCAuth: mint does not advertise NUT-21 openid_discovery");
    const s = e?.clientId ?? n.client_id ?? "cashu-client";
    return new Ht(n.openid_discovery, { ...e, clientId: s });
  }
  setClient(t) {
    this.clientId = t;
  }
  setScope(t) {
    this.scope = t ?? "openid";
  }
  /**
   * Subscribe to token updates. Listeners are called after the primary onTokens callback.
   */
  addTokenListener(t) {
    this.tokenListeners.push(t);
  }
  // ---- Discovery ----
  async loadConfig() {
    if (this.config) return this.config;
    const t = await fetch(this.discoveryUrl, {
      method: "GET",
      headers: { Accept: "application/json" }
    }), e = await t.text();
    let n;
    try {
      n = e ? JSON.parse(e) : void 0;
    } catch (i) {
      this.logger.warn("OIDCAuth: bad discovery JSON", { err: i });
    }
    if (!t.ok || !n)
      throw new Error("OIDCAuth: invalid discovery document");
    const s = n;
    if (typeof s.token_endpoint != "string" || s.token_endpoint.length === 0)
      throw new Error("OIDCAuth: invalid discovery document, missing token_endpoint");
    return this.config = s, s;
  }
  // --- Authorization Code with PKCE ---
  /**
   * Generate a PKCE verifier and S256 challenge.
   *
   * - Verifier: base64url of random bytes, length >= 43, RFC 7636 compliant.
   * - Challenge: base64url(sha256(verifier))
   */
  generatePKCE() {
    const t = It(48), e = Tt(t), n = P.fromString(e), s = F(n), i = Tt(s);
    return { verifier: e, challenge: i };
  }
  /**
   * Build an Authorization Code + PKCE URL.
   */
  async buildAuthCodeUrl(t) {
    const e = await this.loadConfig(), n = t.scope ?? this.scope, s = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: t.redirectUri,
      scope: n,
      code_challenge_method: t.codeChallengeMethod ?? "S256",
      code_challenge: t.codeChallenge
    });
    if (t.state && s.set("state", t.state), !e.authorization_endpoint)
      throw new Error("OIDCAuth: discovery lacks authorization_endpoint");
    return `${e.authorization_endpoint}?${s.toString()}`;
  }
  /**
   * Exchange an auth code for tokens, using the PKCE verifier.
   */
  async exchangeAuthCode(t) {
    const e = await this.loadConfig(), n = this.toForm({
      grant_type: "authorization_code",
      code: t.code,
      redirect_uri: t.redirectUri,
      client_id: this.clientId,
      code_verifier: t.codeVerifier
    }), s = await this.postFormStrict(e.token_endpoint, n);
    return this.handleTokens(s), s;
  }
  // ---- Device Code (recommended for CLIs) ----
  async deviceStart() {
    const e = (await this.loadConfig()).device_authorization_endpoint;
    if (!e) throw new Error("OIDCAuth: provider lacks device_authorization_endpoint");
    const n = this.toForm({ client_id: this.clientId, scope: this.scope });
    return this.postFormStrict(e, n);
  }
  async devicePoll(t, e = 5) {
    const n = await this.loadConfig();
    let s = Math.max(1, e);
    for (; ; ) {
      await this.sleep(s * 1e3);
      const i = this.toForm({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: t,
        client_id: this.clientId
      }), o = await this.postFormLoose(n.token_endpoint, i);
      if (o.access_token)
        return this.handleTokens(o), o;
      const a = (o.error ?? "").toString();
      if (a === "authorization_pending") continue;
      if (a === "slow_down") {
        s = Math.max(s + 5, s * 2);
        continue;
      }
      const c = o.error_description || a || "device authorization failed";
      throw new Error(`OIDCAuth: ${c}`);
    }
  }
  /**
   * One call convenience for Device Code flow.
   *
   * @remarks
   * Polling interval will be the MAX of intervalSec and Mint interval.
   * @param intervalSec Desired polling interval in seconds.
   * @returns The start fields and helpers to poll or cancel.
   */
  async startDeviceAuth(t = 5) {
    const e = await this.deviceStart(), n = Math.max(e.interval ?? 1, t);
    let s = !1;
    return { ...e, poll: async () => {
      const a = await this.loadConfig();
      let c = Math.max(1, n);
      for (; ; ) {
        if (s) throw new Error("OIDCAuth: device polling cancelled");
        await this.sleep(c * 1e3);
        const u = this.toForm({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: e.device_code,
          client_id: this.clientId
        }), l = await this.postFormLoose(a.token_endpoint, u);
        if (l.access_token)
          return this.handleTokens(l), l;
        const h = (l.error ?? "").toString();
        if (h === "authorization_pending") continue;
        if (h === "slow_down") {
          c = Math.max(c + 5, c * 2);
          continue;
        }
        const d = l.error_description || h || "device authorization failed";
        throw new Error(`OIDCAuth: ${d}`);
      }
    }, cancel: () => {
      s = !0;
    } };
  }
  // ---- Refresh ----
  async refresh(t) {
    const e = await this.loadConfig(), n = this.toForm({
      grant_type: "refresh_token",
      refresh_token: t,
      client_id: this.clientId
    }), s = await this.postFormStrict(e.token_endpoint, n);
    return this.handleTokens(s), s;
  }
  // ---- ROPC (discouraged, but some mints allow it) ----
  async passwordGrant(t, e) {
    const n = await this.loadConfig(), s = this.toForm({
      grant_type: "password",
      client_id: this.clientId,
      username: t,
      password: e,
      scope: this.scope
    }), i = await this.postFormStrict(n.token_endpoint, s);
    return this.handleTokens(i), i;
  }
  // ---- internals ----
  /**
   * Fire and forget token fan out. Any listener errors are logged inside safeCallback. Nothing
   * thrown here will come from listeners.
   */
  handleTokens(t) {
    if (!t.access_token) {
      const e = t.error_description || t.error || "token response missing access_token";
      throw new Error(`OIDCAuth: ${e}`);
    }
    queueMicrotask(
      () => lt(this.onTokens, t, this.logger, { where: "OIDCAuth.handleTokens" })
    );
    for (const e of this.tokenListeners)
      queueMicrotask(
        () => lt(e, t, this.logger, {
          where: "OIDCAuth.handleTokens.listener"
        })
      );
  }
  toForm(t) {
    const e = (n) => encodeURIComponent(n).replace(/%20/g, "+");
    return Object.entries(t).map(([n, s]) => `${e(n)}=${e(s)}`).join("&");
  }
  // Strict, throws on non 2xx
  async postFormStrict(t, e) {
    try {
      this.logger.debug("OIDCAuth Request", { formBody: e });
      const n = await fetch(t, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: e
      }), s = await n.text();
      let i;
      try {
        i = s ? JSON.parse(s) : void 0;
      } catch (o) {
        this.logger.warn("OIDCAuth: bad JSON (strict)", { err: o });
      }
      if (!n.ok) {
        const o = i ?? {}, a = o.error_description || o.error || `HTTP ${n.status}`;
        throw new Error(`OIDCAuth: ${a}`);
      }
      return this.logger.debug("OIDCAuth Response", { json: i }), i ?? {};
    } catch (n) {
      throw this.logger.error("OIDCAuth: postFormStrict failed", { err: n }), n;
    }
  }
  // Loose, returns JSON payload even on non 2xx
  async postFormLoose(t, e) {
    try {
      this.logger.debug("OIDCAuth Request", { formBody: e });
      const s = await (await fetch(t, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: e
      })).text();
      let i;
      try {
        i = s ? JSON.parse(s) : void 0;
      } catch (o) {
        this.logger.warn("OIDCAuth: bad JSON (loose)", { err: o });
      }
      return this.logger.debug("OIDCAuth Response", { json: i }), i ?? {};
    } catch (n) {
      return this.logger.error("OIDCAuth: postFormLoose network error", { err: n }), { error: "network_error", error_description: String(n) };
    }
  }
  sleep(t) {
    return new Promise((e) => setTimeout(e, t));
  }
}
class Qt {
  /**
   * @param mintUrl Requires mint URL to create this object.
   * @param customRequest Optional, for custom network communication with the mint.
   * @param authTokenGetter Optional. Function to obtain a NUT-22 BlindedAuthToken (e.g. from a
   *   database or localstorage)
   */
  constructor(t, e) {
    this._mintUrl = Te(t), this._request = e?.customRequest ?? le, this._authProvider = e?.authProvider, this._logger = e?.logger ?? $, qe(this._logger);
  }
  get mintUrl() {
    return this._mintUrl;
  }
  /**
   * Create an OIDC client using this mint’s NUT-21 metadata.
   *
   * @example
   *
   * ```ts
   * const oidc = await mint.oidcAuth({ onTokens: (t) => authMgr.setCAT(t.access_token!) });
   * const start = await oidc.deviceStart();
   * // show start.user_code / start.verification_uri to the user
   * const token = await oidc.devicePoll(start.device_code, start.interval ?? 5);
   * // token.access_token is your CAT
   * ```
   */
  async oidcAuth(t) {
    const e = (await this.getLazyMintInfo()).nuts[21];
    if (!e?.openid_discovery)
      throw new Error("Mint: no NUT-21 openid_discovery");
    return new Ht(e.openid_discovery, {
      ...t,
      clientId: t?.clientId ?? e.client_id ?? "cashu-client"
    });
  }
  /**
   * Fetches mint's info at the /info endpoint.
   *
   * @param customRequest Optional override for the request function.
   * @returns The mint's information response.
   */
  async getInfo(t) {
    const n = await (t ?? this._request)({
      endpoint: j(this._mintUrl, "/v1/info")
    });
    return On(n, this._logger);
  }
  /**
   * Lazily fetches and caches the mint's info if not already loaded.
   *
   * @returns The parsed MintInfo object.
   */
  async getLazyMintInfo() {
    if (this._mintInfo)
      return this._mintInfo;
    const t = await this.getInfo();
    return this._mintInfo = new yt(t), this._mintInfo;
  }
  /**
   * Performs a swap operation with ecash inputs and outputs.
   *
   * @param swapPayload Payload containing inputs and outputs.
   * @param customRequest Optional override for the request function.
   * @returns Signed outputs.
   */
  async swap(t, e) {
    const n = await this.requestWithAuth(
      "POST",
      "/v1/swap",
      { requestBody: t },
      e
    );
    if (!M(n) || !Array.isArray(n?.signatures)) {
      const s = M(n) && "detail" in n ? n.detail : void 0;
      throw new Error(s ?? "bad response");
    }
    return n;
  }
  /**
   * Requests a new mint quote from the mint.
   *
   * @param mintQuotePayload Payload for creating a new mint quote.
   * @param customRequest Optional override for the request function.
   * @returns A new mint quote containing a payment request for the specified amount and unit.
   */
  async createMintQuoteBolt11(t, e) {
    const n = await this.requestWithAuth("POST", "/v1/mint/quote/bolt11", { requestBody: t }, e);
    return te(n, this._logger);
  }
  /**
   * Requests a new BOLT12 mint quote from the mint using Lightning Network offers.
   *
   * @param mintQuotePayload Payload containing amount, unit, optional description, and required
   *   pubkey.
   * @param customRequest Optional override for the request function.
   * @returns A mint quote containing a BOLT12 offer.
   */
  async createMintQuoteBolt12(t, e) {
    return await this.requestWithAuth(
      "POST",
      "/v1/mint/quote/bolt12",
      { requestBody: t },
      e
    );
  }
  /**
   * Gets an existing mint quote from the mint.
   *
   * @param quote Quote ID.
   * @param customRequest Optional override for the request function.
   * @returns The status of the mint quote, including payment details and state.
   */
  async checkMintQuoteBolt11(t, e) {
    const n = await this.requestWithAuth("GET", `/v1/mint/quote/bolt11/${t}`, {}, e);
    return te(n, this._logger);
  }
  /**
   * Gets an existing BOLT12 mint quote from the mint.
   *
   * @param quote Quote ID to check.
   * @param customRequest Optional override for the request function.
   * @returns Updated quote with current payment and issuance amounts.
   */
  async checkMintQuoteBolt12(t, e) {
    return await this.requestWithAuth(
      "GET",
      `/v1/mint/quote/bolt12/${t}`,
      {},
      e
    );
  }
  /**
   * Mints new tokens by requesting blind signatures on the provided outputs.
   *
   * @param mintPayload Payload containing the outputs to get blind signatures on.
   * @param customRequest Optional override for the request function.
   * @returns Serialized blinded signatures.
   */
  async mintBolt11(t, e) {
    const n = await this.requestWithAuth(
      "POST",
      "/v1/mint/bolt11",
      { requestBody: t },
      e
    );
    if (!M(n) || !Array.isArray(n?.signatures)) {
      const s = M(n) && "detail" in n ? n.detail : void 0;
      throw new Error(s ?? "bad response");
    }
    return n;
  }
  /**
   * Mints new tokens using a BOLT12 quote by requesting blind signatures on the provided outputs.
   *
   * @param mintPayload Payload containing the quote ID and outputs to get blind signatures on.
   * @param customRequest Optional override for the request function.
   * @returns Serialized blinded signatures for the requested outputs.
   */
  async mintBolt12(t, e) {
    const n = await this.requestWithAuth(
      "POST",
      "/v1/mint/bolt12",
      { requestBody: t },
      e
    );
    if (!M(n) || !Array.isArray(n?.signatures)) {
      const s = M(n) && "detail" in n ? n.detail : void 0;
      throw new Error(s ?? "bad response");
    }
    return n;
  }
  /**
   * Generic method to create a mint quote for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods without modifying the Mint class. It
   * constructs the endpoint as `/v1/mint/quote/{method}` and POSTs the payload.
   * @example
   *
   * ```ts
   * const response = await mint.createMintQuote('bolt11', { unit: 'sat', amount: 100 });
   * const response = await mint.createMintQuote('custom-payment', {
   * 	unit: 'sat',
   * 	amount: 100,
   * });
   * ```
   *
   * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param mintQuotePayload Payload for creating a mint quote.
   * @param customRequest Optional override for the request function.
   * @returns The mint quote response (must contain quote, amount, unit, expiry).
   */
  async createMintQuote(t, e, n) {
    return await this.requestWithAuth("POST", `/v1/mint/quote/${t}`, { requestBody: e }, n);
  }
  /**
   * Generic method to check the status of a mint quote for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods without modifying the Mint class. It
   * constructs the endpoint as `/v1/mint/quote/{method}/{quote}` and performs a GET request.
   * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param quote The quote ID to check.
   * @param customRequest Optional override for the request function.
   * @returns The mint quote status (must contain quote, amount, unit, expiry).
   */
  async checkMintQuote(t, e, n) {
    return await this.requestWithAuth("GET", `/v1/mint/quote/${t}/${e}`, {}, n);
  }
  /**
   * Generic method to create a melt quote for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods without modifying the Mint class. It
   * constructs the endpoint as `/v1/melt/quote/{method}` and POSTs the payload.
   * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param meltQuotePayload Payload for creating a melt quote.
   * @param customRequest Optional override for the request function.
   * @returns The melt quote response (must contain quote, amount, fee_reserve, state, expiry).
   */
  async createMeltQuote(t, e, n) {
    return await this.requestWithAuth("POST", `/v1/melt/quote/${t}`, { requestBody: e }, n);
  }
  /**
   * Generic method to check the status of a melt quote for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods without modifying the Mint class. It
   * constructs the endpoint as `/v1/melt/quote/{method}/{quote}` and performs a GET request.
   * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param quote The quote ID to check.
   * @param customRequest Optional override for the request function.
   * @returns The melt quote status (must contain quote, amount, fee_reserve, state, expiry).
   */
  async checkMeltQuote(t, e, n) {
    return await this.requestWithAuth("GET", `/v1/melt/quote/${t}/${e}`, {}, n);
  }
  /**
   * Requests a new melt quote from the mint.
   *
   * @param meltQuotePayload Payload for creating a new melt quote.
   * @param customRequest Optional override for the request function.
   * @returns The melt quote response.
   */
  async createMeltQuoteBolt11(t, e) {
    const n = await this.requestWithAuth("POST", "/v1/melt/quote/bolt11", { requestBody: t }, e), s = at(n, this._logger);
    if (!M(s) || typeof s?.amount != "number" || typeof s?.fee_reserve != "number" || typeof s?.quote != "string") {
      const i = M(s) && "detail" in s ? s.detail : void 0;
      throw new Error(i ?? "bad response");
    }
    return s;
  }
  /**
   * Requests a new BOLT12 melt quote from the mint for paying a Lightning Network offer. For
   * amount-less offers, specify the amount in options.amountless.amount_msat.
   *
   * @param meltQuotePayload Payload containing the BOLT12 offer to pay and unit.
   * @param customRequest Optional override for the request function.
   * @returns Melt quote with amount, fee reserve, and payment state.
   */
  async createMeltQuoteBolt12(t, e) {
    return await this.requestWithAuth(
      "POST",
      "/v1/melt/quote/bolt12",
      { requestBody: t },
      e
    );
  }
  /**
   * Gets an existing melt quote.
   *
   * @param quote Quote ID.
   * @param customRequest Optional override for the request function.
   * @returns The melt quote response.
   */
  async checkMeltQuoteBolt11(t, e) {
    const n = await this.requestWithAuth("GET", `/v1/melt/quote/bolt11/${t}`, {}, e), s = at(n, this._logger);
    if (!M(s) || typeof s?.amount != "number" || typeof s?.fee_reserve != "number" || typeof s?.quote != "string" || typeof s?.state != "string" || !Object.values(ut).includes(s.state)) {
      const i = M(s) && "detail" in s ? s.detail : void 0;
      throw new Error(i ?? "bad response");
    }
    return s;
  }
  /**
   * Gets an existing BOLT12 melt quote from the mint. Returns current payment state (UNPAID,
   * PENDING, or PAID) and payment preimage if paid.
   *
   * @param quote Quote ID to check.
   * @param customRequest Optional override for the request function.
   * @returns Updated quote with current payment state and preimage if available.
   */
  async checkMeltQuoteBolt12(t, e) {
    return await this.requestWithAuth(
      "GET",
      `/v1/melt/quote/bolt12/${t}`,
      {},
      e
    );
  }
  /**
   * Requests the mint to pay for a Bolt11 payment request by providing ecash as inputs to be spent.
   * The inputs contain the amount and the fee_reserves for a Lightning payment. The payload can
   * also contain blank outputs in order to receive back overpaid Lightning fees.
   *
   * @param meltPayload The melt payload containing inputs and optional outputs.
   * @param options.customRequest Optional override for the request function.
   * @param options.preferAsync Optional override to set 'respond-async' header.
   * @returns The melt response.
   */
  async meltBolt11(t, e) {
    const n = {
      ...e?.preferAsync ? { Prefer: "respond-async" } : {}
    }, s = await this.requestWithAuth(
      "POST",
      "/v1/melt/bolt11",
      {
        requestBody: t,
        headers: n
      },
      e?.customRequest
    ), i = at(s, this._logger);
    if (!M(i) || typeof i?.state != "string" || !Object.values(ut).includes(i.state)) {
      const o = M(i) && "detail" in i ? i.detail : void 0;
      throw new Error(o ?? "bad response");
    }
    return i;
  }
  /**
   * Requests the mint to pay a BOLT12 offer by providing ecash inputs to be spent. The inputs must
   * cover the amount plus fee reserves. Optional outputs can be included to receive change for
   * overpaid Lightning fees.
   *
   * @param meltPayload Payload containing quote ID, inputs, and optional outputs for change.
   * @param options.customRequest Optional override for the request function.
   * @param options.preferAsync Optional override to set 'respond-async' header.
   * @returns Payment result with state and optional change signatures.
   */
  async meltBolt12(t, e) {
    const n = {
      ...e?.preferAsync ? { Prefer: "respond-async" } : {}
    };
    return await this.requestWithAuth(
      "POST",
      "/v1/melt/bolt12",
      {
        requestBody: t,
        headers: n
      },
      e?.customRequest
    );
  }
  /**
   * Checks if specific proofs have already been redeemed.
   *
   * @param checkPayload The payload containing proofs to check.
   * @param customRequest Optional override for the request function.
   * @returns Redeemed and unredeemed ordered list of booleans.
   */
  async check(t, e) {
    const n = await this.requestWithAuth(
      "POST",
      "/v1/checkstate",
      { requestBody: t },
      e
    );
    if (!M(n) || !Array.isArray(n?.states)) {
      const s = M(n) && "detail" in n ? n.detail : void 0;
      throw new Error(s ?? "bad response");
    }
    return n;
  }
  /**
   * Get the mint's public keys.
   *
   * @param keysetId Optional param to get the keys for a specific keyset. If not specified, the
   *   keys from all active keysets are fetched.
   * @param mintUrl Optional alternative mint URL to use for this request.
   * @param customRequest Optional override for the request function.
   * @returns The mint's public keys.
   */
  async getKeys(t, e, n) {
    const s = e || this._mintUrl;
    t && (t = t.replace(/\//g, "_").replace(/\+/g, "-"));
    const o = await (n ?? this._request)({
      endpoint: t ? j(s, "/v1/keys", t) : j(s, "/v1/keys")
    });
    if (!M(o) || !Array.isArray(o.keysets)) {
      const a = M(o) && "detail" in o ? o.detail : void 0;
      throw new Error(a ?? "bad response");
    }
    return o;
  }
  /**
   * Get the mint's keysets in no specific order.
   *
   * @param customRequest Optional override for the request function.
   * @returns All the mint's past and current keysets.
   */
  async getKeySets(t) {
    return (t ?? this._request)({ endpoint: j(this._mintUrl, "/v1/keysets") });
  }
  /**
   * Restores proofs from the provided blinded messages.
   *
   * @param restorePayload The payload containing outputs to restore.
   * @param customRequest Optional override for the request function.
   * @returns The restore response with outputs and signatures.
   */
  async restore(t, e) {
    const s = await (e ?? this._request)({
      endpoint: j(this._mintUrl, "/v1/restore"),
      method: "POST",
      requestBody: t
    });
    if (!M(s) || !Array.isArray(s?.outputs) || !Array.isArray(s?.signatures)) {
      const i = M(s) && "detail" in s ? s.detail : void 0;
      throw new Error(i ?? "bad response");
    }
    return s;
  }
  /**
   * Tries to establish a websocket connection with the websocket mint url according to NUT-17.
   */
  async connectWebSocket() {
    if (this.ws)
      await this.ws.ensureConnection();
    else {
      const t = new URL(this._mintUrl), e = "v1/ws";
      t.pathname && (t.pathname.endsWith("/") ? t.pathname += e : t.pathname += "/" + e), this.ws = st.getInstance().getConnection(
        `${t.protocol === "https:" ? "wss" : "ws"}://${t.host}${t.pathname}`
      );
      try {
        await this.ws.connect();
      } catch (n) {
        throw this._logger.error("Failed to connect to WebSocket...", { e: n }), new Error("Failed to connect to WebSocket...");
      }
    }
  }
  /**
   * Generic method to mint tokens using any payment method endpoint.
   *
   * @remarks
   * This method enables support for custom payment methods without modifying the Mint class. It
   * constructs the endpoint as `/v1/mint/{method}` and POSTs the payload.
   * @example
   *
   * ```ts
   * const response = await mint.mint('bolt11', { quote: 'q1', outputs: [...] });
   * const response = await mint.mint('custom-payment', { quote: 'c1', outputs: [...] });
   * ```
   *
   * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param mintPayload Payload containing the quote ID and outputs.
   * @param customRequest Optional override for the request function.
   * @returns Serialized blinded signatures for the requested outputs.
   */
  async mint(t, e, n) {
    const s = await this.requestWithAuth(
      "POST",
      `/v1/mint/${t}`,
      { requestBody: e },
      n
    );
    if (!M(s) || !Array.isArray(s?.signatures)) {
      const i = M(s) && "detail" in s ? s.detail : void 0;
      throw new Error(i ?? "bad response");
    }
    return s;
  }
  /**
   * Generic method to melt tokens using any payment method endpoint.
   *
   * @remarks
   * This method enables support for custom payment methods without modifying the Mint class. It
   * constructs the endpoint as `/v1/melt/{method}` and POSTs the payload. The response must contain
   * the common fields: quote, amount, fee_reserve, state, expiry.
   * @example
   *
   * ```ts
   * const response = await mint.melt('bolt11', { quote: 'q1', inputs: [...], outputs: [...] });
   * const response = await mint.melt('custom-payment', { quote: 'c1', inputs: [...], outputs: [...] });
   * ```
   *
   * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param meltPayload The melt payload containing inputs and optional outputs.
   * @param options.customRequest Optional override for the request function.
   * @param options.preferAsync Optional override to set 'respond-async' header.
   * @returns A response object with at least the required melt quote fields.
   */
  async melt(t, e, n) {
    const s = {
      ...n?.preferAsync ? { Prefer: "respond-async" } : {}
    };
    return await this.requestWithAuth(
      "POST",
      `/v1/melt/${t}`,
      {
        requestBody: e,
        headers: s
      },
      n?.customRequest
    );
  }
  /**
   * Closes a websocket connection.
   */
  disconnectWebSocket() {
    this.ws && this.ws.close();
  }
  get webSocketConnection() {
    return this.ws;
  }
  /**
   * Returns the Clear Authentication Token (CAT) to use in the 'Clear-auth' header, or undefined if
   * not required for the given path and method.
   *
   * @param method The method to call on the path.
   * @param path The API path to check for blind auth requirement.
   * @returns The blind auth token if required, otherwise undefined.
   */
  async handleClearAuth(t, e) {
    if (!(!this._authProvider || !(await this.getLazyMintInfo()).requiresClearAuthToken(t, e)))
      return this._logger.error("Clear Authentication Token...", { cat: this._authProvider.getCAT() }), this._authProvider.getCAT();
  }
  /**
   * Returns a serialized Blind Authentication Token (BAT) to use in the 'Blind-auth' header, or
   * undefined if not required for the given path and method.
   *
   * @param method The method to call on the path.
   * @param path The API path to check for blind auth requirement.
   * @returns The blind auth token if required, otherwise undefined.
   */
  async handleBlindAuth(t, e) {
    if (!this._authProvider || !(await this.getLazyMintInfo()).requiresBlindAuthToken(t, e)) return;
    const s = await this._authProvider.getBlindAuthToken({ method: t, path: e });
    return this._logger.error("Blind Authentication Token...", { bat: s }), s;
  }
  async requestWithAuth(t, e, n = {}, s) {
    const i = s ?? this._request, o = await this.handleBlindAuth(t, e), a = await this.handleClearAuth(t, e), c = {
      ...n.headers ?? {},
      ...o ? { "Blind-auth": o } : {},
      ...a ? { "Clear-auth": a } : {}
    };
    return i({
      ...n,
      endpoint: j(this._mintUrl, e),
      method: t,
      headers: c
    });
  }
}
class xn {
  constructor(t, e, n, s, i) {
    this._keys = {}, this._id = t, this._unit = e, this._active = n, this._input_fee_ppk = s, this._final_expiry = i;
  }
  get id() {
    return this._id;
  }
  get unit() {
    return this._unit;
  }
  get isActive() {
    return this._active;
  }
  get fee() {
    return this._input_fee_ppk ?? 0;
  }
  get expiry() {
    return this._final_expiry;
  }
  get hasKeys() {
    return Object.keys(this._keys).length > 0;
  }
  get hasHexId() {
    return Et(this._id);
  }
  get keys() {
    return this._keys;
  }
  set keys(t) {
    this._keys = t;
  }
  /**
   * For compat with v2 MintKeyset type.
   */
  get active() {
    return this._active;
  }
  /**
   * For compat with v2 MintKeyset type.
   */
  get input_fee_ppk() {
    return this._input_fee_ppk ?? 0;
  }
  /**
   * For compat with v2 MintKeyset type.
   */
  get final_expiry() {
    return this._final_expiry;
  }
  /**
   * To Mint API MintKeyset format.
   *
   * @returns MintKeyset object.
   */
  toMintKeyset() {
    return {
      id: this._id,
      unit: this._unit,
      active: this._active,
      input_fee_ppk: this._input_fee_ppk,
      final_expiry: this._final_expiry
    };
  }
  /**
   * To Mint API MintKeys format.
   *
   * @returns MintKeys object.
   */
  toMintKeys() {
    return this.hasKeys ? {
      id: this._id,
      unit: this._unit,
      keys: this._keys
    } : null;
  }
  /**
   * Verifies that the keyset's ID matches the derived ID from its keys, unit, and expiry.
   *
   * @returns True if verification succeeds, false otherwise (e.g., no keys or mismatch).
   */
  verify() {
    if (!this.hasKeys)
      return !1;
    const t = D(this._id)[0];
    return Wt(this._keys, this._unit, this._final_expiry, t) === this._id;
  }
}
class Me {
  constructor(t, e, n, s) {
    if (this.keysets = {}, this.mint = typeof t == "string" ? new Qt(t) : t, this.unit = e, n && s) {
      const i = Array.isArray(s) ? s : [s];
      this.buildKeychain(n, i);
    }
  }
  /**
   * Single entry point to load or refresh keysets and keys for the unit.
   *
   * @remarks
   * Fetches in parallel, filters by unit, assigns keys.
   * @param forceRefresh If true, refetch even if loaded.
   */
  async init(t) {
    if (Object.keys(this.keysets).length > 0 && !t)
      return;
    const [e, n] = await Promise.all([this.mint.getKeySets(), this.mint.getKeys()]);
    this.buildKeychain(e.keysets, n.keysets), this.getCheapestKeyset();
  }
  /**
   * Builds keychain from Mint Keyset and Keys data.
   *
   * @param allKeysets Keyset data from mint.getKeySets() API.
   * @param allKeys Keys data from mint.getKeys() API.
   */
  buildKeychain(t, e) {
    this.keysets = {}, t.filter((i) => i.unit === this.unit).forEach((i) => {
      this.keysets[i.id] = new xn(i.id, i.unit, i.active, i.input_fee_ppk, i.final_expiry);
    });
    const s = new Map(
      e.filter((i) => i.unit === this.unit).map((i) => [i.id, i])
    );
    Object.values(this.keysets).forEach((i) => {
      if (!i.hasHexId || !i.isActive) return;
      const o = s.get(i.id);
      if (o && (i.keys = o.keys, !i.verify()))
        throw new Error(`Keyset verification failed for ID ${i.id}`);
    });
  }
  /**
   * Get a keyset by ID or the cheapest keyset if no ID is provided.
   *
   * @param id Optional keyset ID.
   * @returns Keyset with keys.
   * @throws If keyset not found or uninitialized.
   */
  getKeyset(t) {
    const e = t ? this.keysets[t] : this.getCheapestKeyset();
    if (!e)
      throw new Error(`Keyset '${t}' not found`);
    return e;
  }
  /**
   * Get the cheapest active keyset.
   *
   * @remarks
   * Selects active keyset with lowest fee and hex ID.
   * @returns Active Keyset.
   * @throws If none found or uninitialized.
   */
  getCheapestKeyset() {
    if (Object.keys(this.keysets).length === 0)
      throw new Error("KeyChain not initialized");
    const t = Object.values(this.keysets).filter(
      (e) => e.isActive && e.hasHexId && e.hasKeys
    );
    if (t.length === 0)
      throw new Error("No active keyset found");
    return t.sort((e, n) => e.fee - n.fee)[0];
  }
  /**
   * Get list of all keysets for the unit.
   *
   * @returns Array of Keysets.
   * @throws If uninitialized.
   */
  getKeysets() {
    if (Object.keys(this.keysets).length === 0)
      throw new Error("KeyChain not initialized");
    return Object.values(this.keysets);
  }
  /**
   * Extract the Mint API data from the keychain.
   *
   * @remarks
   * Useful for instantiating new wallets / keychains without repeatedly calling the mint API.
   */
  getCache() {
    const t = this.getKeysets(), e = t.filter((n) => n.hasKeys).map((n) => n.toMintKeys()).filter((n) => n !== null);
    return {
      keysets: t.map((n) => n.toMintKeyset()),
      keys: e,
      unit: this.unit,
      mintUrl: this.mint.mintUrl
    };
  }
}
function ee(r) {
  const t = r.toLowerCase();
  if (t.length === 66 && (t.startsWith("02") || t.startsWith("03"))) return t;
  if (t.length === 64) return `02${t}`;
  throw new Error(
    `Invalid pubkey, expected 33 byte compressed or 32 byte x only, got length ${t.length}`
  );
}
function Bn(r) {
  return r instanceof Date ? Math.floor(r.getTime() / 1e3) : r < 1e12 ? Math.floor(r) : Math.floor(r / 1e3);
}
class Ie {
  constructor() {
    this.lockSet = /* @__PURE__ */ new Set(), this.refundSet = /* @__PURE__ */ new Set();
  }
  addLockPubkey(t) {
    const e = Array.isArray(t) ? t : [t];
    for (const n of e) this.lockSet.add(ee(n));
    return this;
  }
  addRefundPubkey(t) {
    const e = Array.isArray(t) ? t : [t];
    for (const n of e) this.refundSet.add(ee(n));
    return this;
  }
  lockUntil(t) {
    return this.locktime = Bn(t), this;
  }
  requireLockSignatures(t) {
    return this.nSigs = Math.max(1, Math.trunc(t)), this;
  }
  requireRefundSignatures(t) {
    return this.nSigsRefund = Math.max(1, Math.trunc(t)), this;
  }
  toOptions() {
    const t = Array.from(this.lockSet), e = Array.from(this.refundSet);
    if (t.length === 0) throw new Error("At least one lock pubkey is required");
    if (e.length > 0 && this.locktime === void 0)
      throw new Error(
        "Refund pubkeys require a locktime, add lockUntil(...) or remove refund keys"
      );
    const n = t.length + e.length;
    if (n > 10)
      throw new Error(`Too many pubkeys, ${n} provided, maximum allowed is 10 in total`);
    const s = this.nSigs ? Math.min(Math.max(1, this.nSigs), t.length) : void 0, i = this.nSigsRefund ? Math.min(Math.max(1, this.nSigsRefund), Math.max(1, e.length)) : void 0;
    return {
      pubkey: t.length === 1 ? t[0] : t,
      ...this.locktime !== void 0 ? { locktime: this.locktime } : {},
      ...e.length ? { refundKeys: e } : {},
      ...s && s > 1 ? { requiredSignatures: s } : {},
      ...i && i > 1 ? { requiredRefundSignatures: i } : {}
    };
  }
  static fromOptions(t) {
    const e = new Ie(), n = Array.isArray(t.pubkey) ? t.pubkey : [t.pubkey];
    return e.addLockPubkey(n), t.locktime !== void 0 && e.lockUntil(t.locktime), t.refundKeys?.length && e.addRefundPubkey(t.refundKeys), t.requiredSignatures !== void 0 && e.requireLockSignatures(t.requiredSignatures), t.requiredRefundSignatures !== void 0 && e.requireRefundSignatures(t.requiredRefundSignatures), e;
  }
}
const qn = (r, t, e, n = !1, s = !1, i = $) => {
  const h = Be();
  let d = null, g = 1 / 0, y = 0, k = 0;
  const v = (f) => {
    try {
      return e.getKeyset(f.id).fee;
    } catch (p) {
      kt(`Could not get fee. No keyset found for keyset id: ${f.id}`, i, {
        error: p,
        keychain: e.getKeysets()
      });
    }
  }, A = (f, p) => f - (n ? Math.ceil(p / 1e3) : 0), _ = (f) => {
    const p = [...f];
    for (let w = p.length - 1; w > 0; w--) {
      const m = Math.floor(Math.random() * (w + 1));
      [p[w], p[m]] = [p[m], p[w]];
    }
    return p;
  }, B = (f, p, w) => {
    let m = 0, N = f.length - 1, E = null;
    for (; m <= N; ) {
      const z = Math.floor((m + N) / 2), Y = f[z].exFee;
      (w ? Y <= p : Y >= p) ? (E = z, w ? m = z + 1 : N = z - 1) : w ? N = z - 1 : m = z + 1;
    }
    return w ? E : m < f.length ? m : null;
  }, S = (f, p) => {
    const w = p.exFee;
    let m = 0, N = f.length;
    for (; m < N; ) {
      const E = Math.floor((m + N) / 2);
      f[E].exFee < w ? m = E + 1 : N = E;
    }
    f.splice(m, 0, p);
  }, C = (f, p) => A(f, p) < t ? 1 / 0 : f + p / 1e3 - t;
  let I = 0, b = 0;
  const K = r.map((f) => {
    const p = v(f), w = n ? f.amount - p / 1e3 : f.amount, m = { proof: f, exFee: w, ppkfee: p };
    return (!n || w > 0) && (I += f.amount, b += p), m;
  });
  let T = n ? K.filter((f) => f.exFee > 0) : K;
  if (T.sort((f, p) => f.exFee - p.exFee), T.length > 0) {
    let f;
    if (s) {
      const p = B(T, t, !0);
      f = p !== null ? p + 1 : 0;
    } else {
      const p = B(T, t, !1);
      if (p !== null) {
        const w = T[p].exFee, m = B(T, w, !0);
        ce(m, "Unexpected null rightIndex in binary search", i), f = m + 1;
      } else
        f = T.length;
    }
    for (let p = f; p < T.length; p++)
      I -= T[p].proof.amount, b -= T[p].ppkfee;
    T = T.slice(0, f);
  }
  const W = A(I, b);
  if (t <= 0 || t > W)
    return { keep: r, send: [] };
  const X = Math.min(
    Math.ceil(t * (1 + 0 / 100)),
    t + 0,
    W
  );
  for (let f = 0; f < 60; f++) {
    const p = [];
    let w = 0, m = 0;
    for (const O of _(T)) {
      const U = w + O.proof.amount, q = m + O.ppkfee, H = A(U, q);
      if (s && H > t || (p.push(O), w = U, m = q, H >= t)) break;
    }
    const N = new Set(p), E = T.filter((O) => !N.has(O)), z = _(Array.from({ length: p.length }, (O, U) => U)).slice(
      0,
      5e3
    );
    for (const O of z) {
      const U = A(w, m);
      if (U === t || !s && U >= t && U <= X)
        break;
      const q = p[O], H = w - q.proof.amount, Z = m - q.ppkfee, Ce = A(H, Z), Gt = t - Ce, _t = B(E, Gt, s);
      if (_t !== null) {
        const ot = E[_t];
        (!s || ot.exFee > q.exFee) && (Gt >= 0 || ot.exFee <= q.exFee) && (p[O] = ot, w = H + ot.proof.amount, m = Z + ot.ppkfee, E.splice(_t, 1), S(E, q));
      }
    }
    const Y = C(w, m);
    if (Y < g) {
      i.debug(
        `selectProofsToSend: best solution found in trial #${f} - amount: ${w}, delta: ${Y}`
      ), d = [...p].sort((U, q) => q.exFee - U.exFee), g = Y, y = w, k = m;
      const O = [...d];
      for (; O.length > 1 && g > 0; ) {
        const U = O.pop(), q = w - U.proof.amount, H = m - U.ppkfee, Z = C(q, H);
        if (Z == 1 / 0) break;
        Z < g && (d = [...O], g = Z, y = q, k = H, w = q, m = H);
      }
    }
    if (d && g < 1 / 0) {
      const O = A(y, k);
      if (O === t || !s && O >= t && O <= X)
        break;
    }
    if (h.elapsed() > 1e3) {
      ae(
        s,
        "Proof selection took too long. Try again with a smaller proof set.",
        i
      ), i.warn("Proof selection took too long. Returning best selection so far.");
      break;
    }
  }
  if (d && g < 1 / 0) {
    const f = d.map((m) => m.proof), p = new Set(f), w = r.filter((m) => !p.has(m));
    return i.info(`Proof selection took ${h.elapsed()}ms`), { keep: w, send: f };
  }
  return { keep: r, send: [] };
};
class Dn {
  constructor(t) {
    if (this.next = /* @__PURE__ */ new Map(), this.locks = /* @__PURE__ */ new Map(), t)
      for (const [e, n] of Object.entries(t)) this.next.set(e, n);
  }
  async withLock(t, e) {
    const n = this.locks.get(t) ?? Promise.resolve();
    let s;
    const i = new Promise((a) => s = a), o = n.then(() => i);
    this.locks.set(t, o);
    try {
      return await n, await e();
    } finally {
      s(), this.locks.get(t) === o && this.locks.delete(t);
    }
  }
  async reserve(t, e) {
    if (e < 0) throw new Error("reserve called with negative count");
    return this.withLock(t, () => {
      const n = this.next.get(t) ?? 0;
      return e === 0 ? { start: n, count: 0 } : (this.next.set(t, n + e), { start: n, count: e });
    });
  }
  async advanceToAtLeast(t, e) {
    await this.withLock(t, () => {
      const n = this.next.get(t) ?? 0;
      e > n && this.next.set(t, e);
    });
  }
  async setNext(t, e) {
    await this.withLock(t, () => {
      if (e < 0) throw new Error("setNext: negative next not allowed");
      this.next.set(t, e);
    });
  }
  snapshot() {
    return Promise.resolve(Object.fromEntries(this.next.entries()));
  }
}
class Kn {
  constructor(t) {
    this.wallet = t;
  }
  send(t, e) {
    return new Un(this.wallet, t, e);
  }
  receive(t) {
    return new Rn(this.wallet, t);
  }
  /**
   * Generic method to mint proofs for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods using the fluent builder pattern. The
   * payload factory function receives the blinded messages and should return the complete mint
   * payload.
   * @example
   *
   * ```ts
   * const proofs = await wallet.ops
   * 	.mintGeneric('custom-payment', 100, (blindedMessages) => ({
   * 		quote: customQuote.quote,
   * 		outputs: blindedMessages,
   * 		customField: 'value',
   * 	}))
   * 	.asDeterministic()
   * 	.run();
   * ```
   *
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param amount Amount to mint.
   * @param payloadFactory Function that receives blinded messages and returns the mint payload.
   * @returns A MintBuilder for composing the mint operation.
   */
  mintGeneric(t, e, n) {
    return new Fn(this.wallet, t, e, n);
  }
  mintBolt11(t, e) {
    return new ne(this.wallet, "bolt11", t, e);
  }
  mintBolt12(t, e) {
    return new ne(this.wallet, "bolt12", t, e);
  }
  /**
   * Generic method to melt proofs for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods using the fluent builder pattern. The
   * payload factory function receives the proofs and change outputs.
   * @example
   *
   * ```ts
   * const result = await wallet.ops
   * 	.meltGeneric(
   * 		'custom-payment',
   * 		customQuote,
   * 		customQuote.amount + customQuote.fee_reserve,
   * 		proofs,
   * 		(proofs, outputs) => ({
   * 			quote: customQuote.quote,
   * 			inputs: proofs,
   * 			outputs,
   * 		}),
   * 	)
   * 	.asDeterministic()
   * 	.run();
   * ```
   *
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param quote Quote response for the payment method.
   * @param amount Total amount from the quote (amount + fee_reserve).
   * @param proofs Proofs to melt.
   * @param payloadFactory Function that receives proofs and outputs, returns melt payload.
   * @returns A MeltBuilderGeneric for composing the melt operation.
   */
  meltGeneric(t, e, n, s, i) {
    return new Nn(this.wallet, t, e, n, s, i);
  }
  meltBolt11(t, e) {
    return new se(this.wallet, "bolt11", t, e);
  }
  meltBolt12(t, e) {
    return new se(this.wallet, "bolt12", t, e);
  }
}
class Un {
  constructor(t, e, n) {
    this.wallet = t, this.amount = e, this.proofs = n, this.config = {};
  }
  /**
   * Use random blinding for the sent outputs.
   *
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asRandom(t) {
    return this.sendOT = { type: "random", denominations: t }, this;
  }
  /**
   * Use deterministic outputs for the sent proofs.
   *
   * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asDeterministic(t = 0, e) {
    return this.sendOT = { type: "deterministic", counter: t, denominations: e }, this;
  }
  /**
   * Use P2PK locked outputs for the sent proofs.
   *
   * @param options NUT 11 options like pubkey and locktime.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asP2PK(t, e) {
    return this.sendOT = { type: "p2pk", options: t, denominations: e }, this;
  }
  /**
   * Use a factory to generate OutputData for the sent proofs.
   *
   * @param factory OutputDataFactory used to produce blinded messages.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asFactory(t, e) {
    return this.sendOT = { type: "factory", factory: t, denominations: e }, this;
  }
  /**
   * Provide pre created OutputData for the sent proofs.
   *
   * @param data Fully formed OutputData. Their amounts must sum to the send amount, otherwise the
   *   wallet will throw.
   */
  asCustom(t) {
    return this.sendOT = { type: "custom", data: t }, this;
  }
  /**
   * Use random blinding for change outputs.
   *
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  keepAsRandom(t) {
    return this.keepOT = { type: "random", denominations: t }, this;
  }
  /**
   * Use deterministic outputs for change.
   *
   * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  keepAsDeterministic(t = 0, e) {
    return this.keepOT = { type: "deterministic", counter: t, denominations: e }, this;
  }
  /**
   * Use P2PK locked change (NUT 11).
   *
   * @param options Locking options applied to the kept proofs.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  keepAsP2PK(t, e) {
    return this.keepOT = { type: "p2pk", options: t, denominations: e }, this;
  }
  /**
   * Use a factory to generate OutputData for change.
   *
   * @param factory OutputDataFactory used to produce blinded messages.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  keepAsFactory(t, e) {
    return this.keepOT = { type: "factory", factory: t, denominations: e }, this;
  }
  /**
   * Provide pre created OutputData for change.
   *
   * @param data Fully formed OutputData for the keep (change) amount.
   */
  keepAsCustom(t) {
    return this.keepOT = { type: "custom", data: t }, this;
  }
  /**
   * Make the sender cover the receiver’s future spend fee.
   *
   * @param on When true, include fees in the sent amount. Default true if called.
   */
  includeFees(t = !0) {
    return this.config.includeFees = t, this;
  }
  /**
   * Use a specific keyset for the operation.
   *
   * @param id Keyset id to use for mint keys and fee lookup.
   */
  keyset(t) {
    return this.config.keysetId = t, this;
  }
  /**
  * Provide existing proofs to help optimise denomination selection.
  *
  * @remarks
  * Has no effect if denominations (custom split) was specified.
  * @param p Proofs currently held by the wallet, used to hit denomination targets.
  */
  proofsWeHave(t) {
    return this.config.proofsWeHave = t, this;
  }
  /**
   * Receive a callback once counters are atomically reserved for deterministic outputs.
   *
   * @param cb Called with OperationCounters when counters are reserved.
   */
  onCountersReserved(t) {
    return this.config.onCountersReserved = t, this;
  }
  /**
   * Force a pure offline, exact match selection. No mint calls are made. If an exact match cannot
   * be found, this throws.
   *
   * @param requireDleq Only consider proofs with a DLEQ when true.
   */
  offlineExactOnly(t = !1) {
    return this.offlineExact = { requireDleq: t }, this;
  }
  /**
   * Force a pure offline selection that allows a close match, overspend permitted per wallet RGLI.
   * No mint calls are made. Returns the best offline subset found, or throws if funds are
   * insufficient.
   *
   * @param requireDleq Only consider proofs with a DLEQ when true.
   */
  offlineCloseMatch(t = !1) {
    return this.offlineClose = { requireDleq: t }, this;
  }
  /**
   * Execute the send or swap.
   *
   * @returns The split result with kept and sent proofs.
   */
  async run() {
    if ((this.offlineExact || this.offlineClose) && (this.sendOT || this.keepOT))
      throw new Error(
        "Offline selection cannot be combined with custom output types. Remove send/keep output configuration, or use an online swap."
      );
    if (this.offlineExact)
      return this.wallet.sendOffline(this.amount, this.proofs, {
        includeFees: this.config.includeFees,
        exactMatch: !0,
        requireDleq: this.offlineExact.requireDleq
      });
    if (this.offlineClose)
      return this.wallet.sendOffline(this.amount, this.proofs, {
        includeFees: this.config.includeFees,
        exactMatch: !1,
        requireDleq: this.offlineClose.requireDleq
      });
    const t = {
      send: this.sendOT ?? this.wallet.defaultOutputType(),
      ...this.keepOT ? { keep: this.keepOT } : {}
    };
    return this.wallet.send(this.amount, this.proofs, this.config, t);
  }
}
class Rn {
  constructor(t, e) {
    this.wallet = t, this.token = e, this.config = {};
  }
  /**
   * Use random blinding for the received outputs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asRandom(t) {
    return this.outputType = { type: "random", denominations: t }, this;
  }
  /**
   * Use deterministic outputs for the received proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asDeterministic(t = 0, e) {
    return this.outputType = { type: "deterministic", counter: t, denominations: e }, this;
  }
  /**
   * Use P2PK locked outputs for the received proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param options NUT 11 options like pubkey and locktime.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asP2PK(t, e) {
    return this.outputType = { type: "p2pk", options: t, denominations: e }, this;
  }
  /**
   * Use a factory to generate OutputData for received proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param factory OutputDataFactory used to produce blinded messages.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asFactory(t, e) {
    return this.outputType = { type: "factory", factory: t, denominations: e }, this;
  }
  /**
   * Provide pre created OutputData for received proofs.
   *
   * @param data Fully formed OutputData for the final amount.
   */
  asCustom(t) {
    return this.outputType = { type: "custom", data: t }, this;
  }
  /**
   * Use a specific keyset for the operation.
   *
   * @param id Keyset id to use for mint keys and fee lookup.
   */
  keyset(t) {
    return this.config.keysetId = t, this;
  }
  /**
   * Require all incoming proofs to have a valid DLEQ for the selected keyset.
   *
   * @param on When true, proofs without DLEQ are rejected.
   */
  requireDleq(t = !0) {
    return this.config.requireDleq = t, this;
  }
  /**
   * Private key used to sign P2PK locked incoming proofs.
   *
   * @param k Single key or array of multisig keys.
   */
  privkey(t) {
    return this.config.privkey = t, this;
  }
  /**
   * Provide existing proofs to help optimise denomination selection.
   *
   * @remarks
   * Has no effect if denominations (custom split) was specified.
   * @param p Proofs currently held by the wallet, used to hit denomination targets.
   */
  proofsWeHave(t) {
    return this.config.proofsWeHave = t, this;
  }
  /**
   * Receive a callback once counters are atomically reserved for deterministic outputs.
   *
   * @param cb Called with OperationCounters when counters are reserved.
   */
  onCountersReserved(t) {
    return this.config.onCountersReserved = t, this;
  }
  async run() {
    return this.wallet.receive(this.token, this.config, this.outputType);
  }
}
class ne {
  constructor(t, e, n, s) {
    this.wallet = t, this.method = e, this.amount = n, this.quote = s, this.config = {}, this._hasPrivkey;
  }
  /**
   * Use random blinding for the minted proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asRandom(t) {
    return this.outputType = { type: "random", denominations: t }, this;
  }
  /**
   * Use deterministic outputs for the minted proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asDeterministic(t = 0, e) {
    return this.outputType = { type: "deterministic", counter: t, denominations: e }, this;
  }
  /**
   * Use P2PK locked outputs for the minted proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param options NUT 11 options like pubkey and locktime.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asP2PK(t, e) {
    return this.outputType = { type: "p2pk", options: t, denominations: e }, this;
  }
  /**
   * Use a factory to generate OutputData for minted proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param factory OutputDataFactory used to produce blinded messages.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asFactory(t, e) {
    return this.outputType = { type: "factory", factory: t, denominations: e }, this;
  }
  /**
   * Provide pre created OutputData for minted proofs.
   *
   * @param data Fully formed OutputData for the final amount.
   */
  asCustom(t) {
    return this.outputType = { type: "custom", data: t }, this;
  }
  /**
   * Use a specific keyset for the operation.
   *
   * @param id Keyset id to use for mint keys and fee lookup.
   */
  keyset(t) {
    return this.config.keysetId = t, this;
  }
  /**
   * Private key to sign locked mint quotes.
   *
   * @param k Private key for locked quotes.
   */
  privkey(t) {
    return this.config.privkey = t, this;
  }
  /**
   * Provide existing proofs to help optimise denomination selection.
   *
   * @remarks
   * Has no effect if denominations (custom split) was specified.
   * @param p Proofs currently held by the wallet, used to hit denomination targets.
   */
  proofsWeHave(t) {
    return this.config.proofsWeHave = t, this;
  }
  /**
   * Receive a callback once counters are atomically reserved for deterministic outputs.
   *
   * @param cb Called with OperationCounters when counters are reserved.
   */
  onCountersReserved(t) {
    return this.config.onCountersReserved = t, this;
  }
  /**
   * Execute minting against the quote.
   *
   * @remarks
   * This method can only be called for bolt12 quotes when .privkey() is set.
   * @returns The newly minted proofs.
   */
  async run() {
    if (this.method === "bolt11") {
      const e = this.quote;
      if (e.pubkey && !this.config.privkey)
        throw new Error("privkey is required for locked BOLT11 mint quotes");
      return this.wallet.mintProofsBolt11(this.amount, e, this.config, this.outputType);
    }
    const t = this.quote;
    if (!this.config.privkey)
      throw new Error("privkey is required for BOLT12 mint quotes");
    return this.wallet.mintProofsBolt12(
      this.amount,
      t,
      this.config.privkey,
      this.config,
      this.outputType
    );
  }
}
class se {
  constructor(t, e, n, s) {
    this.wallet = t, this.method = e, this.quote = n, this.proofs = s, this.config = {};
  }
  /**
   * Use random blinding for change outputs.
   *
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asRandom(t) {
    return this.outputType = { type: "random", denominations: t }, this;
  }
  /**
   * Use deterministic outputs for change.
   *
   * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asDeterministic(t = 0, e) {
    return this.outputType = { type: "deterministic", counter: t, denominations: e }, this;
  }
  /**
   * Use P2PK-locked change (NUT-11).
   *
   * @param options NUT-11 locking options (e.g., pubkey, locktime).
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asP2PK(t, e) {
    return this.outputType = { type: "p2pk", options: t, denominations: e }, this;
  }
  /**
   * Use a factory to generate OutputData for change.
   *
   * @param factory Factory used to produce blinded messages.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asFactory(t, e) {
    return this.outputType = { type: "factory", factory: t, denominations: e }, this;
  }
  /**
   * Provide pre-created OutputData for change.
   *
   * @param data Fully formed OutputData for the change amount.
   */
  asCustom(t) {
    return this.outputType = { type: "custom", data: t }, this;
  }
  /**
   * Use a specific keyset for the melt operation.
   *
   * @param id Keyset id to use for mint keys and fee lookup.
   */
  keyset(t) {
    return this.config.keysetId = t, this;
  }
  /**
   * Receive a callback once counters are atomically reserved for deterministic outputs.
   *
   * @param cb Called with OperationCounters when counters are reserved.
   */
  onCountersReserved(t) {
    return this.config.onCountersReserved = t, this;
  }
  /**
   * Receive a callback when NUT-08 blanks (0-sat change outputs) are created for async melts.
   *
   * @remarks
   * You can persist these blanks and later call `wallet.completeMelt(blanks)` to finalize and
   * recover change once the invoice/offer is paid.
   * @param cb Callback invoked with the created blanks payload.
   */
  onChangeOutputsCreated(t) {
    return this.config.onChangeOutputsCreated = t, this;
  }
  /**
   * Execute the melt against the quote.
   *
   * @returns The melt result: `{ quote, change }`.
   */
  async run() {
    return this.method === "bolt11" ? this.wallet.meltProofsBolt11(this.quote, this.proofs, this.config, this.outputType) : this.wallet.meltProofsBolt12(this.quote, this.proofs, this.config, this.outputType);
  }
}
class Fn {
  constructor(t, e, n, s) {
    this.wallet = t, this.method = e, this.amount = n, this.payloadFactory = s, this.config = {};
  }
  /**
   * Use random blinding for the minted proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asRandom(t) {
    return this.outputType = { type: "random", denominations: t }, this;
  }
  /**
   * Use deterministic outputs for the minted proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param counter Starting counter. Zero means auto reserve using the wallet's CounterSource.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asDeterministic(t = 0, e) {
    return this.outputType = { type: "deterministic", counter: t, denominations: e }, this;
  }
  /**
   * Use P2PK locked outputs for the minted proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param options NUT 11 options like pubkey and locktime.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asP2PK(t, e) {
    return this.outputType = { type: "p2pk", options: t, denominations: e }, this;
  }
  /**
   * Use a factory to generate OutputData for minted proofs.
   *
   * @remarks
   * If denoms specified, proofsWeHave() will have no effect.
   * @param factory OutputDataFactory used to produce blinded messages.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asFactory(t, e) {
    return this.outputType = { type: "factory", factory: t, denominations: e }, this;
  }
  /**
   * Provide pre created OutputData for minted proofs.
   *
   * @param data Fully formed OutputData for the final amount.
   */
  asCustom(t) {
    return this.outputType = { type: "custom", data: t }, this;
  }
  /**
   * Use a specific keyset for the operation.
   *
   * @param id Keyset id to use for mint keys and fee lookup.
   */
  keyset(t) {
    return this.config.keysetId = t, this;
  }
  /**
   * Provide existing proofs to help optimise denomination selection.
   *
   * @remarks
   * Has no effect if denominations (custom split) was specified.
   * @param p Proofs currently held by the wallet, used to hit denomination targets.
   */
  proofsWeHave(t) {
    return this.config.proofsWeHave = t, this;
  }
  /**
   * Receive a callback once counters are atomically reserved for deterministic outputs.
   *
   * @param cb Called with OperationCounters when counters are reserved.
   */
  onCountersReserved(t) {
    return this.config.onCountersReserved = t, this;
  }
  /**
   * Execute minting against the quote using any payment method.
   *
   * @returns The newly minted proofs.
   */
  async run() {
    return this.wallet.mintProofsGeneric(
      this.method,
      this.amount,
      this.payloadFactory,
      this.config,
      this.outputType
    );
  }
}
class Nn {
  constructor(t, e, n, s, i, o) {
    this.wallet = t, this.method = e, this.quote = n, this.amount = s, this.proofs = i, this.payloadFactory = o, this.config = {};
  }
  /**
   * Use random blinding for change outputs.
   *
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asRandom(t) {
    return this.outputType = { type: "random", denominations: t }, this;
  }
  /**
   * Use deterministic outputs for change.
   *
   * @param counter Starting counter. Zero means auto reserve using the wallet's CounterSource.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asDeterministic(t = 0, e) {
    return this.outputType = { type: "deterministic", counter: t, denominations: e }, this;
  }
  /**
   * Use P2PK-locked change (NUT-11).
   *
   * @param options NUT-11 locking options (e.g., pubkey, locktime).
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asP2PK(t, e) {
    return this.outputType = { type: "p2pk", options: t, denominations: e }, this;
  }
  /**
   * Use a factory to generate OutputData for change.
   *
   * @param factory Factory used to produce blinded messages.
   * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
   */
  asFactory(t, e) {
    return this.outputType = { type: "factory", factory: t, denominations: e }, this;
  }
  /**
   * Provide pre-created OutputData for change.
   *
   * @param data Fully formed OutputData for the change amount.
   */
  asCustom(t) {
    return this.outputType = { type: "custom", data: t }, this;
  }
  /**
   * Use a specific keyset for the melt operation.
   *
   * @param id Keyset id to use for mint keys and fee lookup.
   */
  keyset(t) {
    return this.config.keysetId = t, this;
  }
  /**
   * Receive a callback once counters are atomically reserved for deterministic outputs.
   *
   * @param cb Called with OperationCounters when counters are reserved.
   */
  onCountersReserved(t) {
    return this.config.onCountersReserved = t, this;
  }
  /**
   * Receive a callback when NUT-08 blanks (0-sat change outputs) are created for async melts.
   *
   * @remarks
   * You can persist these blanks and later call `wallet.completeMelt(blanks)` to finalize and
   * recover change once the invoice/offer is paid.
   * @param cb Callback invoked with the created blanks payload.
   */
  onChangeOutputsCreated(t) {
    return this.config.onChangeOutputsCreated = t, this;
  }
  /**
   * Execute the melt against the quote using any payment method.
   *
   * @returns The melt result: `{ quote, change }`.
   */
  async run() {
    return this.wallet.meltProofsGeneric(
      this.method,
      this.quote,
      this.amount,
      this.proofs,
      this.payloadFactory,
      this.config,
      this.outputType
    );
  }
}
function Ln(r) {
  const t = /* @__PURE__ */ new WeakSet();
  try {
    return JSON.stringify(r, (e, n) => {
      if (typeof n == "object" && n !== null) {
        if (t.has(n)) return "[Circular]";
        t.add(n);
      }
      return n;
    });
  } catch {
    return Object.prototype.toString.call(r);
  }
}
function re(r) {
  if (r instanceof Error) return r;
  const t = typeof r == "string" ? r : Ln(r), e = new Error(t);
  return e.cause = r, e;
}
function ie() {
  const r = new Error("Aborted");
  return Object.defineProperty(r, "name", { value: "AbortError" }), r;
}
function et(r) {
  r && Promise.resolve(r).then((t) => {
    try {
      t();
    } catch {
    }
  }).catch(() => {
  });
}
class $n {
  constructor(t) {
    this.wallet = t, this.countersReservedHandlers = /* @__PURE__ */ new Set(), this.meltBlanksHandlers = /* @__PURE__ */ new Set();
  }
  // Binds an abort signal to each subscription canceller
  withAbort(t, e) {
    if (!t) return e;
    if (t.aborted)
      return e(), () => {
      };
    const n = () => e();
    return t.addEventListener("abort", n, { once: !0 }), () => {
      t.removeEventListener("abort", n), e();
    };
  }
  // Subscribe to a quote-paid event and resolve when it fires.
  // Supports AbortSignal and timeout, and always cleans up.
  waitUntilPaid(t, e, n, s = "Timeout waiting for paid") {
    return new Promise((i, o) => {
      let a = null, c = null;
      const u = (h) => {
        et(a), c && (clearTimeout(c), c = null), n?.signal && n.signal.removeEventListener("abort", l), h && o(re(h));
      }, l = () => u(ie());
      if (n?.signal) {
        if (n.signal.aborted) return l();
        n.signal.addEventListener("abort", l, { once: !0 });
      }
      n?.timeoutMs && n.timeoutMs > 0 && (c = setTimeout(() => u(new Error(s)), n.timeoutMs)), a = t(
        e,
        (h) => {
          u(), i(h);
        },
        (h) => u(h),
        // reject if subscription itself errors
        { signal: n?.signal }
        // delegate abort to subscription as well
      );
    });
  }
  /**
   * Register a callback that fires whenever deterministic counters are reserved.
   *
   * Timing: the callback is invoked synchronously _after_ a successful reservation and _before_ the
   * enclosing wallet method returns. The wallet does **not** await your callback, it is
   * fire-and-forget.
   *
   * Responsibility for async work is on the consumer. If your handler calls an async function (e.g.
   * persisting `start + count` to storage), make sure to handle errors inside it to avoid unhandled
   * rejections.
   *
   * Typical use: persist `start + count` for the `keysetId` so counters survive restarts.
   *
   * @example
   *
   * ```ts
   * wallet.on.countersReserved(({ keysetId, start, count, next }) => {
   * 	saveNextToDb(keysetId, start + count); // handle async errors inside saveNextToDb
   * });
   * ```
   *
   * @param cb Handler called with { keysetId, start, count }.
   * @returns A function that unsubscribes the handler.
   */
  countersReserved(t, e) {
    this.countersReservedHandlers.add(t);
    const n = () => this.countersReservedHandlers.delete(t);
    return this.withAbort(e?.signal, n);
  }
  /**
   * @internal
   */
  _emitCountersReserved(t) {
    for (const e of this.countersReservedHandlers)
      lt(e, t, this.wallet.logger, { event: "countersReserved" });
  }
  /**
   * Register a callback fired whenever NUT-08 blanks are created during a melt.
   *
   * Called synchronously right after blanks are prepared (before the melt request), and the wallet
   * does not await your handler.
   *
   * Typical use: persist `payload` so you can later call `wallet.completeMelt(payload)`.
   */
  meltBlanksCreated(t, e) {
    this.meltBlanksHandlers.add(t);
    const n = () => this.meltBlanksHandlers.delete(t);
    return this.withAbort(e?.signal, n);
  }
  /**
   * @internal
   */
  _emitMeltBlanksCreated(t) {
    for (const e of this.meltBlanksHandlers)
      lt(e, t, this.wallet.logger, { event: "meltBlanksCreated" });
  }
  /**
   * Register a callback to be called whenever a mint quote's state changes.
   *
   * @param quoteIds List of mint quote IDs that should be subscribed to.
   * @param callback Callback function that will be called whenever a mint quote state changes.
   * @param errorCallback
   * @returns
   */
  async mintQuoteUpdates(t, e, n, s) {
    await this.wallet.mint.connectWebSocket();
    const i = this.wallet.mint.webSocketConnection;
    if (!i) throw new Error("Failed to establish WebSocket connection.");
    const o = i.createSubscription({ kind: "bolt11_mint_quote", filters: t }, e, n), a = () => i.cancelSubscription(o, e);
    return this.withAbort(s?.signal, a);
  }
  /**
   * Register a callback to be called when a single mint quote gets paid.
   *
   * @param quoteId Mint quote id that should be subscribed to.
   * @param callback Callback function that will be called when this mint quote gets paid.
   * @param errorCallback
   * @returns
   */
  async mintQuotePaid(t, e, n, s) {
    return this.mintQuoteUpdates(
      [t],
      (i) => {
        i.state === St.PAID && e(i);
      },
      n,
      s
    );
  }
  /**
   * Register a callback to be called whenever a melt quote’s state changes.
   *
   * @param quoteId Melt quote id that should be subscribed to.
   * @param callback Callback function that will be called when this melt quote gets paid.
   * @param errorCallback
   * @returns
   */
  async meltQuoteUpdates(t, e, n, s) {
    await this.wallet.mint.connectWebSocket();
    const i = this.wallet.mint.webSocketConnection;
    if (!i) throw new Error("Failed to establish WebSocket connection.");
    const o = i.createSubscription({ kind: "bolt11_melt_quote", filters: t }, e, n), a = () => i.cancelSubscription(o, e);
    return this.withAbort(s?.signal, a);
  }
  /**
   * Register a callback to be called when a single melt quote gets paid.
   *
   * @param quoteIds List of melt quote IDs that should be subscribed to.
   * @param callback Callback function that will be called whenever a melt quote state changes.
   * @param errorCallback
   * @returns
   */
  async meltQuotePaid(t, e, n, s) {
    return this.meltQuoteUpdates(
      [t],
      (i) => {
        i.state === ut.PAID && e(i);
      },
      n,
      s
    );
  }
  /**
   * Register a callback to be called whenever a subscribed proof state changes.
   *
   * @param proofs List of proofs that should be subscribed to.
   * @param callback Callback function that will be called whenever a proof's state changes.
   * @param errorCallback
   * @returns
   */
  async proofStateUpdates(t, e, n, s) {
    await this.wallet.mint.connectWebSocket();
    const i = this.wallet.mint.webSocketConnection;
    if (!i) throw new Error("Failed to establish WebSocket connection.");
    const o = new TextEncoder(), a = {};
    for (const h of t) {
      const d = dt(o.encode(h.secret)).toHex(!0);
      a[d] = h;
    }
    const c = Object.keys(a), u = i.createSubscription(
      { kind: "proof_state", filters: c },
      (h) => {
        e({ ...h, proof: a[h.Y] });
      },
      n
    ), l = () => i.cancelSubscription(u, e);
    return this.withAbort(s?.signal, l);
  }
  /**
   * Resolve once a mint quote transitions to PAID, with automatic unsubscription, optional abort
   * signal, and optional timeout.
   *
   * The underlying subscription is always cancelled after resolution or rejection, including on
   * timeout or abort.
   *
   * @example
   *
   * ```ts
   * const ac = new AbortController();
   * // Cancel if the user navigates away
   * window.addEventListener('beforeunload', () => ac.abort(), { once: true });
   *
   * try {
   * 	const paid = await wallet.on.onceMintPaid(quoteId, {
   * 		signal: ac.signal,
   * 		timeoutMs: 60_000,
   * 	});
   * 	console.log('Mint paid, amount', paid.amount);
   * } catch (e) {
   * 	if ((e as Error).name === 'AbortError') {
   * 		console.log('User aborted');
   * 	} else {
   * 		console.error('Mint not paid', e);
   * 	}
   * }
   * ```
   *
   * @param id Mint quote id to watch.
   * @param opts Optional controls.
   * @param opts.signal AbortSignal to cancel the wait early.
   * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
   * @returns A promise that resolves with the latest `MintQuoteResponse` once PAID.
   */
  onceMintPaid(t, e) {
    return this.waitUntilPaid(
      this.mintQuotePaid.bind(this),
      t,
      e,
      "Timeout waiting for mint paid"
    );
  }
  /**
   * Resolve when ANY of several mint quotes is PAID, cancelling the rest.
   *
   * Subscribes to all distinct ids, resolves with `{ id, quote }` for the first PAID, and cancels
   * all remaining subscriptions.
   *
   * Errors from individual subscriptions are ignored by default so a single noisy stream does not
   * abort the whole race. Set `failOnError: true` to reject on the first error instead. If all
   * subscriptions error and none paid, the promise rejects with the last seen error.
   *
   * @example
   *
   * ```ts
   * // Race multiple quotes obtained from splitting a large top up
   * const { id, quote } = await wallet.on.onceAnyMintPaid(batchQuoteIds, {
   * 	timeoutMs: 120_000,
   * });
   * console.log('First top up paid', id, quote.preimage?.length);
   * ```
   *
   * @param ids Array of mint quote ids (duplicates are ignored).
   * @param opts Optional controls.
   * @param opts.signal AbortSignal to cancel the wait early.
   * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
   * @param opts.failOnError When true, reject on first error. Default false.
   * @returns A promise resolving to the id that won and its `MintQuoteResponse`.
   */
  onceAnyMintPaid(t, e) {
    return new Promise((n, s) => {
      const i = Array.from(new Set(t)), o = /* @__PURE__ */ new Map();
      let a = null, c = null, u = !1;
      const l = (d) => {
        for (const g of o.values()) et(g);
        o.clear(), a && (clearTimeout(a), a = null), e?.signal && e.signal.removeEventListener("abort", h), d && s(re(d));
      }, h = () => l(ie());
      if (e?.signal) {
        if (e.signal.aborted) return h();
        e.signal.addEventListener("abort", h, { once: !0 });
      }
      if (e?.timeoutMs && e.timeoutMs > 0 && (a = setTimeout(
        () => l(new Error("Timeout waiting for any mint paid")),
        e.timeoutMs
      )), i.length === 0) return l(new Error("No quote ids provided"));
      for (const d of i) {
        const g = this.mintQuotePaid(
          d,
          (y) => {
            l(), n({ id: d, quote: y });
          },
          (y) => {
            if (e?.failOnError) {
              l(y);
              return;
            }
            c = y;
            const k = o.get(d);
            k && (et(k), o.delete(d)), u && o.size === 0 && l(c ?? new Error("No subscriptions remaining"));
          }
        );
        o.set(d, g);
      }
      u = !0;
    });
  }
  /**
   * Resolve once a melt quote transitions to PAID, with automatic unsubscription, optional abort
   * signal, and optional timeout.
   *
   * Mirrors onceMintPaid, but for melts.
   *
   * @example
   *
   * ```ts
   * try {
   * 	const paid = await wallet.on.onceMeltPaid(meltId, { timeoutMs: 45_000 });
   * 	console.log('Invoice paid by mint, paid msat', paid.paid ?? 0);
   * } catch (e) {
   * 	console.error('Payment did not complete in time', e);
   * }
   * ```
   *
   * @param id Melt quote id to watch.
   * @param opts Optional controls.
   * @param opts.signal AbortSignal to cancel the wait early.
   * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
   * @returns A promise that resolves with the `MeltQuoteResponse` once PAID.
   */
  onceMeltPaid(t, e) {
    return this.waitUntilPaid(
      this.meltQuotePaid.bind(this),
      t,
      e,
      "Timeout waiting for melt paid"
    );
  }
  /**
   * Async iterable that yields proof state updates for the provided proofs.
   *
   * Adds a bounded buffer option:
   *
   * - If `maxBuffer` is set and the queue is full when a new payload arrives, either drop the oldest
   *   queued payload (`drop: 'oldest'`, default) or the incoming payload (`drop: 'newest'`). In
   *   both cases `onDrop` is invoked with the dropped payload.
   *
   * The stream ends and cleans up on abort or on the wallet error callback. Errors from the wallet
   * are treated as a graceful end for this iterator.
   *
   * @example
   *
   * ```ts
   * const ac = new AbortController();
   * try {
   * 	for await (const update of wallet.on.proofStatesStream(myProofs)) {
   * 		if (update.state === CheckStateEnum.SPENT) {
   * 			console.warn('Spent proof', update.proof.id);
   * 		}
   * 	}
   * } catch (e) {
   * 	if ((e as Error).name !== 'AbortError') {
   * 		console.error('Stream error', e);
   * 	}
   * }
   * ```
   *
   * @param proofs The proofs to subscribe to. Only `secret` is required.
   * @param opts Optional controls.
   * @param opts.signal AbortSignal that stops the stream when aborted.
   * @param opts.maxBuffer Maximum number of queued items before applying the drop strategy.
   * @param opts.drop Overflow strategy when `maxBuffer` is reached, 'oldest' | 'newest'. Default
   *   'oldest'.
   * @param opts.onDrop Callback invoked with the payload that was dropped.
   * @returns An async iterable of update payloads.
   */
  proofStatesStream(t, e) {
    return async function* () {
      const n = [];
      let s = !1, i = null;
      const o = e?.maxBuffer && e.maxBuffer > 0 ? e.maxBuffer : 1 / 0, a = e?.drop ?? "oldest", c = () => {
        const d = i;
        i = null, d && d();
      }, u = (d) => {
        if (n.length >= o)
          if (a === "oldest") {
            const g = n.shift();
            if (g !== void 0)
              try {
                e?.onDrop?.(g);
              } catch {
              }
            n.push(d);
          } else {
            try {
              e?.onDrop?.(d);
            } catch {
            }
            return;
          }
        else
          n.push(d);
        c();
      }, l = this.proofStateUpdates(
        t,
        (d) => {
          u(d);
        },
        () => {
          s = !0, c();
        },
        { signal: e?.signal }
      ), h = () => {
        s = !0, c();
      };
      try {
        for (e?.signal && (e.signal.aborted ? h() : e.signal.addEventListener("abort", h, { once: !0 })); !s || n.length; ) {
          for (; n.length; ) yield n.shift();
          if (s) break;
          await new Promise((d) => i = d);
        }
      } finally {
        et(l), e?.signal && e.signal.removeEventListener("abort", h);
      }
    }.call(this);
  }
  /**
   * Create a composite canceller that can collect many subscriptions and dispose them all in one
   * call.
   *
   * Accepts both a `SubscriptionCanceller` and a `Promise<SubscriptionCanceller>`. When the
   * composite canceller is called, all collected cancellations are invoked. Errors from individual
   * cancellers are caught and ignored.
   *
   * The returned function also has an `.add()` method to register more cancellers, and a
   * `.cancelled` boolean property for debugging.
   *
   * @example
   *
   * ```ts
   * const cancelAll = wallet.on.group();
   * cancelAll.add(wallet.on.mintQuotes(ids, onUpdate, onErr));
   * cancelAll.add(asyncSubscribeElsewhere());
   *
   * // later
   * cancelAll(); // disposes everything
   * ```
   *
   * @returns Composite canceller function with `.add()` and `.cancelled` members.
   */
  group() {
    const t = [];
    let e = !1;
    const n = (() => {
      if (!e)
        for (e = !0; t.length; ) et(t.pop());
    });
    return n.add = (s) => e ? (et(s), s) : (t.push(s), s), Object.defineProperty(n, "cancelled", {
      get: () => e,
      enumerable: !0
    }), n;
  }
}
class Wn {
  constructor(t) {
    this.src = t;
  }
  /**
   * Returns the "next" counter for a specified keyset.
   */
  async peekNext(t) {
    return (await this.src.reserve(t, 0)).start;
  }
  /**
   * Bumps the counter if it is behind `minNext` (no-op if ahead).
   */
  async advanceToAtLeast(t, e) {
    await this.src.advanceToAtLeast(t, e);
  }
  /**
   * Hard-sets the cursor (useful for tests or migrations).
   *
   * @throws If the CounterSource does not support setNext()
   */
  async setNext(t, e) {
    if (typeof this.src.setNext == "function") {
      await this.src.setNext(t, e);
      return;
    }
    throw new Error("CounterSource does not support setNext()");
  }
  /**
   * Returns the current "next" per keyset (what will be reserved next).
   *
   * @throws If the CounterSource does not support snapshot()
   */
  async snapshot() {
    if (typeof this.src.snapshot == "function")
      return await this.src.snapshot();
    throw new Error("CounterSource does not support snapshot()");
  }
}
const Pt = {
  UNSPENT: "UNSPENT",
  PENDING: "PENDING",
  SPENT: "SPENT"
};
class vt {
  constructor(t, e, n) {
    this.amount = t, this.B_ = e, this.id = n;
  }
  getSerializedBlindedMessage() {
    return { amount: this.amount, B_: this.B_.toHex(!0), id: this.id };
  }
}
class L {
  constructor(t, e, n) {
    this.secret = n, this.blindingFactor = e, this.blindedMessage = t;
  }
  toProof(t, e) {
    let n;
    t.dleq && (n = {
      s: ct(t.dleq.s),
      e: ct(t.dleq.e),
      r: this.blindingFactor
    });
    const s = {
      id: t.id,
      amount: t.amount,
      C_: rt(t.C_)
    }, i = rt(e.keys[t.amount]), o = un(s, this.blindingFactor, this.secret, i);
    return {
      ...hn(o),
      ...n && {
        dleq: {
          s: nt(n.s),
          e: nt(n.e),
          r: bn(n.r ?? BigInt(0))
        }
      }
    };
  }
  static createP2PKData(t, e, n, s) {
    return G(e, n.keys, s).map((o) => this.createSingleP2PKData(t, o, n.id));
  }
  static createSingleP2PKData(t, e, n) {
    const s = Array.isArray(t.pubkey) ? t.pubkey : [t.pubkey], i = Math.max(1, Math.min(t.requiredSignatures || 1, s.length)), o = Math.max(
      1,
      Math.min(t.requiredRefundSignatures || 1, t.refundKeys ? t.refundKeys.length : 1)
    ), a = [
      "P2PK",
      {
        nonce: nt(Vt(32)),
        data: s[0],
        // Primary key
        tags: []
      }
    ];
    t.locktime && a[1].tags.push(["locktime", String(t.locktime)]), s.length > 1 && (a[1].tags.push(["pubkeys", ...s.slice(1)]), i > 1 && a[1].tags.push(["n_sigs", String(i)])), t.refundKeys && (a[1].tags.push(["refund", ...t.refundKeys]), o > 1 && a[1].tags.push(["n_sigs_refund", String(o)]));
    const c = JSON.stringify(a), u = new TextEncoder().encode(c), { r: l, B_: h } = ft(u);
    return new L(
      new vt(e, h, n).getSerializedBlindedMessage(),
      l,
      u
    );
  }
  static createRandomData(t, e, n) {
    return G(t, e.keys, n).map((i) => this.createSingleRandomData(i, e.id));
  }
  static createSingleRandomData(t, e) {
    const n = nt(Vt(32)), s = new TextEncoder().encode(n), { r: i, B_: o } = ft(s);
    return new L(
      new vt(t, o, e).getSerializedBlindedMessage(),
      i,
      s
    );
  }
  static createDeterministicData(t, e, n, s, i) {
    return G(t, s.keys, i).map(
      (a, c) => this.createSingleDeterministicData(a, e, n + c, s.id)
    );
  }
  static createSingleDeterministicData(t, e, n, s) {
    const i = pn(e, s, n), o = nt(i), a = new TextEncoder().encode(o), c = Q(gn(e, s, n)), { r: u, B_: l } = ft(a, c);
    return new L(
      new vt(t, l, s).getSerializedBlindedMessage(),
      u,
      a
    );
  }
  /**
   * Calculates the sum of amounts in an array of OutputDataLike objects.
   *
   * @param outputs Array of OutputDataLike objects.
   * @returns The total sum of amounts.
   */
  static sumOutputAmounts(t) {
    return t.reduce((e, n) => e + n.blindedMessage.amount, 0);
  }
}
const At = "__PENDING__";
class zt {
  /**
   * Create a wallet for a given mint and unit. Call `loadMint` before use.
   *
   * Binding, if `options.keysetId` is omitted, the wallet binds to the cheapest active keyset for
   * this unit during `loadMint`. The keychain only loads keysets for this unit.
   *
   * Caching, to preload, provide both `keysets` and `keys`, otherwise the cache is ignored.
   *
   * Deterministic secrets, pass `bip39seed` and optionally `secretsPolicy`. Deterministic outputs
   * reserve counters from `counterSource`, or an ephemeral in memory source if not supplied.
   * `initialCounter` applies only with a supplied `keysetId` and the ephemeral source.
   *
   * Splitting, `denominationTarget` guides proof splits, default is 3. Override coin selection with
   * `selectProofs` if needed. Logging defaults to a null logger.
   *
   * @param mint Mint instance or URL.
   * @param options Optional settings.
   * @param options.unit Wallet unit, default 'sat'.
   * @param options.keysetId Bind to this keyset id, else bind on `loadMint`.
   * @param options.bip39seed BIP39 seed for deterministic secrets.
   * @param options.secretsPolicy Secrets policy, default 'auto'.
   * @param options.counterSource Counter source for deterministic outputs. If provided, this takes
   *   precedence over counterInit. Use when you need persistence across processes or devices.
   * @param options.counterInit Seed values for the built-in EphemeralCounterSource. Ignored if
   *   counterSource is also provided.
   * @param options.keys Cached keys for this unit, only used when `keysets` is also provided.
   * @param options.keysets Cached keysets for this unit, only used when `keys` is also provided.
   * @param options.mintInfo Optional cached mint info.
   * @param options.denominationTarget Target proofs per denomination, default 3.
   * @param options.selectProofs Custom proof selection function.
   * @param options.logger Logger instance, default null logger.
   */
  constructor(t, e) {
    this._seed = void 0, this._unit = "sat", this._mintInfo = void 0, this._denominationTarget = 3, this._secretsPolicy = "auto", this._boundKeysetId = At, this.swap = this.send.bind(this), this.ops = new Kn(this), this.on = new $n(this), this._logger = e?.logger ?? $, this._selectProofs = e?.selectProofs ?? qn, this.mint = typeof t == "string" ? new Qt(t, { authProvider: e?.authProvider, logger: this._logger }) : t, this._unit = e?.unit ?? this._unit, this._boundKeysetId = e?.keysetId ?? this._boundKeysetId, e?.bip39seed && (this.failIf(
      !(e.bip39seed instanceof Uint8Array),
      "bip39seed must be a valid Uint8Array",
      {
        bip39seed: e.bip39seed
      }
    ), this._seed = e.bip39seed), this._secretsPolicy = e?.secretsPolicy ?? this._secretsPolicy, e?.counterSource ? this._counterSource = e.counterSource : this._counterSource = new Dn(e?.counterInit), this.counters = new Wn(this._counterSource), this.keyChain = new Me(this.mint, this._unit, e?.keysets, e?.keys), this._mintInfo = e?.mintInfo ? new yt(e.mintInfo) : this._mintInfo, this._denominationTarget = e?.denominationTarget ?? this._denominationTarget;
  }
  // Convenience wrappers for "log and throw"
  fail(t, e) {
    return kt(t, this._logger, e);
  }
  failIf(t, e, n) {
    return ae(t, e, this._logger, n);
  }
  failIfNullish(t, e, n) {
    return ce(t, e, this._logger, n);
  }
  safeCallback(t, e, n) {
    lt(t, e, this._logger, n);
  }
  /**
   * Load mint information, keysets, and keys. Must be called before using other methods.
   *
   * @param forceRefresh If true, re-fetches data even if cached.
   * @throws If fetching mint info, keysets, or keys fails.
   */
  async loadMint(t) {
    const e = [];
    if ((!this._mintInfo || t) && e.push(
      this.mint.getInfo().then((n) => (this._mintInfo = new yt(n), null))
    ), e.push(this.keyChain.init(t).then(() => null)), await Promise.all(e), this._logger.debug("KeyChain", { keychain: this.keyChain.getCache() }), this._boundKeysetId === At)
      this._boundKeysetId = this.keyChain.getCheapestKeyset().id;
    else {
      const n = this.keyChain.getKeyset(this._boundKeysetId);
      this.failIf(!n.hasKeys, "Wallet keyset has no keys after refresh", { keyset: n.id });
    }
  }
  // -----------------------------------------------------------------
  // Section: Getters
  // -----------------------------------------------------------------
  /**
   * Get the wallet's unit.
   *
   * @returns The unit (e.g., 'sat').
   */
  get unit() {
    return this._unit;
  }
  /**
   * Get information about the mint.
   *
   * @remarks
   * Returns cached mint info. Call `loadMint` first to initialize the wallet.
   * @returns Mint info.
   * @throws If mint info is not initialized.
   */
  getMintInfo() {
    return this.failIfNullish(this._mintInfo, "Mint info not initialized; call loadMint first"), this._mintInfo;
  }
  /**
   * The keyset ID bound to this wallet instance.
   */
  get keysetId() {
    return this.failIf(this._boundKeysetId === At, "Wallet not initialised, call loadMint"), this._boundKeysetId;
  }
  /**
   * Gets the requested keyset or the keyset bound to the wallet.
   *
   * @remarks
   * This method enforces wallet policies. If `id` is omitted, it returns the keyset bound to this
   * wallet, including validation that:
   *
   * - The keyset exists in the keychain,
   * - The unit matches the wallet's unit,
   * - Keys are loaded for that keyset.
   *
   * Contrast with `keyChain.getKeyset(id?)`, which, when called without an id, returns the cheapest
   * active keyset for the unit, ignoring the wallet binding.
   * @param id Optional keyset id to resolve. If omitted, the wallet's bound keyset is used.
   * @returns The resolved `Keyset`.
   * @throws If the keyset is not found, has no keys, or its unit differs from the wallet.
   */
  getKeyset(t) {
    const e = this.keyChain.getKeyset(t ?? this.keysetId);
    return this.failIf(e.unit !== this._unit, "Keyset unit does not match wallet unit", {
      keyset: e.id,
      unit: e.unit,
      walletUnit: this._unit
    }), this.failIf(!e.hasKeys, "Keyset has no keys loaded", { keyset: e.id }), e;
  }
  get logger() {
    return this._logger;
  }
  // -----------------------------------------------------------------
  // Section: Counters
  // -----------------------------------------------------------------
  async reserveFor(t, e) {
    return e <= 0 ? { start: 0, count: 0 } : this._counterSource.reserve(t, e);
  }
  countersNeeded(t) {
    return t.type !== "deterministic" || t.counter !== 0 ? 0 : (t.denominations ?? []).length;
  }
  async addCountersToOutputTypes(t, ...e) {
    const n = e.reduce((c, u) => c + this.countersNeeded(u), 0);
    if (n === 0) return { outputTypes: e };
    const s = await this.reserveFor(t, n);
    let i = s.start;
    const o = e.map((c) => {
      if (c.type === "deterministic" && c.counter === 0) {
        const u = (c.denominations ?? []).length;
        if (u > 0) {
          const l = { ...c, counter: i };
          return i += u, l;
        }
      }
      return c;
    }), a = {
      keysetId: t,
      start: s.start,
      count: s.count,
      next: s.start + s.count
    };
    return this.on._emitCountersReserved(a), { outputTypes: o, used: a };
  }
  /**
   * Bind this wallet to a specific keyset id.
   *
   * @remarks
   * This changes the default keyset used by all operations that do not explicitly pass a keysetId.
   * The method validates that the keyset exists in the keychain, matches the wallet unit, and has
   * keys loaded.
   *
   * Typical uses:
   *
   * 1. After loadMint, to pin the wallet to a particular active keyset.
   * 2. After a refresh, to rebind deliberately rather than falling back to cheapest.
   *
   * @param id The keyset identifier to bind to.
   * @throws If keyset not found, if it has no keys loaded, or if its unit is not the wallet unit.
   */
  bindKeyset(t) {
    const e = this.keyChain.getKeyset(t);
    this.failIf(e.unit !== this._unit, "Keyset unit does not match wallet unit", {
      keyset: e.id,
      unit: e.unit,
      walletUnit: this._unit
    }), this.failIf(!e.hasKeys, "Keyset has no keys loaded", { keyset: e.id }), this._boundKeysetId = e.id, this._logger.debug("Wallet bound to keyset", {
      keysetId: e.id,
      unit: e.unit,
      feePPK: e.fee
    });
  }
  /**
   * Creates a new Wallet bound to a different keyset, sharing the same CounterSource.
   *
   * Use this to operate on multiple keysets concurrently without mutating your original wallet.
   * Counters remain monotonic across instances because the same CounterSource is reused.
   *
   * Do NOT pass a fresh CounterSource for the same seed unless you know exactly why. Reusing
   * counters can recreate secrets that a mint will reject.
   *
   * @param id The keyset identifier to bind to.
   * @throws If keyset not found, if it has no keys loaded, or if its unit is not the wallet unit.
   */
  withKeyset(t, e) {
    return new zt(this.mint, {
      keysetId: t,
      bip39seed: this._seed,
      secretsPolicy: this._secretsPolicy,
      logger: this._logger,
      counterSource: e?.counterSource ?? this._counterSource,
      ...this.keyChain.getCache()
    });
  }
  /**
   * Returns the default OutputType for this wallet, based on its configured secrets policy
   * (options?.secretsPolicy) and seed state.
   *
   * - If the secrets policy is 'random', returns { type: 'random' }.
   * - If the policy is 'deterministic', requires a seed and returns { type: 'deterministic', counter:
   *   0 }. Counter 0 is a flag meaning "auto-increment from current state".
   * - If no explicit policy is set, falls back to:
   *
   *   - Deterministic if a seed is present.
   *   - Random if no seed is present.
   *
   * @returns An OutputType object describing the default output strategy.
   * @throws Error if the policy is 'deterministic' but no seed has been set.
   */
  defaultOutputType() {
    return this._secretsPolicy === "random" ? { type: "random" } : this._secretsPolicy === "deterministic" ? (this.failIfNullish(this._seed, "Deterministic policy requires a seed"), { type: "deterministic", counter: 0 }) : this._seed ? { type: "deterministic", counter: 0 } : { type: "random" };
  }
  // -----------------------------------------------------------------
  // Section: Output Creation
  // -----------------------------------------------------------------
  /**
   * Configures output denominations with fee adjustments and optimization.
   *
   * @remarks
   * If 'custom' outputType, data outputs MUST sum to the amount. Other outputTypes may supply
   * denominations. If no denominations are passed in, they will be calculated based on proofsWeHave
   * or the default split. If partial denominations are passed in, the balance will be added using
   * default split. Additional denominations to cover fees will then be added if required.
   * @param amount The total amount for outputs.
   * @param keyset The mint keyset.
   * @param outputType The output configuration.
   * @param includeFees Whether to include swap fees in the output amount.
   * @param proofsWeHave Optional proofs for optimizing denomination splitting.
   * @returns OutputType with required denominations.
   */
  configureOutputs(t, e, n, s = !1, i = []) {
    let o = t;
    if (n.type === "custom") {
      this.failIf(s, "The custom OutputType does not support automatic fee inclusion");
      const c = L.sumOutputAmounts(n.data);
      return this.failIf(
        c !== t,
        `Custom output data total (${c}) does not match amount (${t})`
      ), n;
    }
    let a = n.denominations ?? [];
    if (a.length === 0 && i.length > 0 && (a = _n(
      i,
      o,
      e.keys,
      this._denominationTarget
    )), a = G(o, e.keys, a), s) {
      let c = this.getFeesForKeyset(a.length, e.id), u = G(c, e.keys);
      for (; this.getFeesForKeyset(a.length + u.length, e.id) > c; )
        c++, u = G(c, e.keys);
      o += c, a = [...a, ...u];
    }
    return { ...n, denominations: a };
  }
  /**
   * Sum total implied by a prepared OutputType. Note: Empty denomination is valid (e.g: zero
   * change).
   */
  preparedTotal(t) {
    return t.type === "custom" ? L.sumOutputAmounts(t.data) : (t.denominations ?? []).reduce((n, s) => n + s, 0);
  }
  /**
   * Generates blinded messages based on the specified output type.
   *
   * @param amount The total amount for outputs.
   * @param keyset The mint keys.
   * @param outputType The output configuration.
   * @returns Prepared output data.
   */
  createOutputData(t, e, n) {
    if (this.failIf(t < 0, "Amount was negative", { amount: t }), // 'custom' OutputType has no denominations. Every other OutputType does.
    // so let's sanity check those were filled properly (eg: configureOutputs)
    n.type != "custom" && n.denominations && n.denominations.length > 0) {
      const i = n.denominations.reduce((o, a) => o + a, 0);
      this.failIf(i !== t, "Denominations do not sum to the expected amount", {
        splitSum: i,
        expected: t
      });
    }
    let s;
    switch (n.type) {
      case "random":
        s = L.createRandomData(t, e, n.denominations);
        break;
      case "deterministic":
        this.failIfNullish(
          this._seed,
          "Deterministic outputs require a seed configured in the wallet"
        ), s = L.createDeterministicData(
          t,
          this._seed,
          n.counter,
          e,
          n.denominations
        );
        break;
      case "p2pk":
        s = L.createP2PKData(
          n.options,
          t,
          e,
          n.denominations
        );
        break;
      case "factory": {
        s = G(t, e.keys, n.denominations).map((o) => n.factory(o, e));
        break;
      }
      case "custom": {
        s = n.data;
        const i = L.sumOutputAmounts(s);
        this.failIf(
          i !== t,
          `Custom output data total (${i}) does not match amount (${t})`
        );
        break;
      }
      default:
        this.fail("Invalid OutputType");
    }
    return s;
  }
  /**
   * Creates a swap transaction with sorted outputs for privacy. This prevents a mint working out
   * which proofs will be sent or kept.
   *
   * @param inputs Prepared input proofs.
   * @param keepOutputs Outputs to keep (change or receiver's proofs).
   * @param sendOutputs Outputs to send (optional, default empty for receive/mint).
   * @returns Swap transaction with payload and metadata for processing signatures.
   */
  createSwapTransaction(t, e, n = []) {
    t = this._prepareInputsForMint(t);
    const s = [...e, ...n], i = s.map((h, d) => d).sort(
      (h, d) => s[h].blindedMessage.amount - s[d].blindedMessage.amount
    ), o = [
      ...Array.from({ length: e.length }, () => !0),
      ...Array.from({ length: n.length }, () => !1)
    ], a = i.map((h) => s[h]), c = i.map((h) => o[h]), u = a.map((h) => h.blindedMessage);
    return this._logger.debug("createSwapTransaction:", {
      indices: i,
      sortedKeepVector: c
      // outputs, // <-- removed for security
    }), {
      payload: {
        inputs: t,
        outputs: u
      },
      outputData: a,
      keepVector: c,
      sortedIndices: i
    };
  }
  // -----------------------------------------------------------------
  // Section: Send and Receive
  // -----------------------------------------------------------------
  /**
   * Receive a token (swaps with mint for new proofs)
   *
   * @example
   *
   * ```typescript
   * const result = await wallet.receive(
   * 	token,
   * 	{ includeFees: true },
   * 	{ type: 'deterministic', counter: 0 },
   * );
   * ```
   *
   * @param token Token string or decoded token.
   * @param config Optional receive config.
   * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
   * @returns Newly minted proofs.
   */
  async receive(t, e, n) {
    const { keysetId: s, privkey: i, requireDleq: o, proofsWeHave: a, onCountersReserved: c } = e || {};
    n = n ?? this.defaultOutputType();
    const u = typeof t == "string" ? this.decodeToken(t) : t, l = Te(u.mint);
    this.failIf(l !== this.mint.mintUrl, "Token belongs to a different mint", {
      token: l,
      wallet: this.mint.mintUrl
    }), this.failIf(u.unit !== this._unit, "Token is not in wallet unit", {
      token: u.unit,
      wallet: this._unit
    });
    let h = [];
    ({ proofs: h } = u);
    const d = tt(h);
    if (d === 0)
      return [];
    i && (h = this.signP2PKProofs(h, i));
    const g = this.getKeyset(s);
    if (o)
      for (const I of h) {
        const b = this.keyChain.getKeyset(I.id);
        Ee(I, b) || this.fail("Token contains proofs with invalid or missing DLEQ");
      }
    const y = d - this.getFeesForProofs(h);
    let k = this.configureOutputs(
      y,
      g,
      n,
      !1,
      // includeFees is not applicable for receive
      a
    );
    const v = await this.addCountersToOutputTypes(g.id, k);
    [k] = v.outputTypes, v.used && this.safeCallback(c, v.used, { op: "receive" }), this._logger.debug("receive counter", { counter: v.used, receiveOT: k });
    const A = this.createOutputData(this.preparedTotal(k), g, k), _ = this.createSwapTransaction(h, A, []), { signatures: B } = await this.mint.swap(_.payload), S = _.outputData.map(
      (I, b) => I.toProof(B[b], g)
    ), C = [];
    return _.sortedIndices.forEach((I, b) => {
      C[I] = S[b];
    }), this._logger.debug("RECEIVE COMPLETED", { amounts: C.map((I) => I.amount) }), C;
  }
  /**
   * Sends proofs of a given amount from provided proofs.
   *
   * @remarks
   * If proofs are P2PK-locked to your public key, call signP2PKProofs first to sign them. The
   * default config uses exact match selection, and does not includeFees or requireDleq. Because the
   * send is offline, the user will unlock the signed proofs when they receive them online.
   * @param amount Amount to send.
   * @param proofs Array of proofs (must sum >= amount; pre-sign if P2PK-locked).
   * @param config Optional parameters for the send.
   * @returns SendResponse with keep/send proofs.
   * @throws Throws if the send cannot be completed offline.
   */
  sendOffline(t, e, n) {
    const { requireDleq: s = !1, includeFees: i = !1, exactMatch: o = !0 } = n || {};
    s && (e = e.filter((l) => l.dleq != null)), this.failIf(tt(e) < t, "Not enough funds available to send");
    const { keep: a, send: c } = this.selectProofsToSend(e, t, i, o), u = this._prepareInputsForMint(c, s);
    return { keep: a, send: u };
  }
  /**
   * Send proofs with online swap if necessary.
   *
   * @remarks
   * If proofs are P2PK-locked to your public key, call signP2PKProofs first to sign them.
   * @example
   *
   * ```typescript
   * // Simple send
   * const result = await wallet.send(5, proofs);
   *
   * // With a SendConfig
   * const result = await wallet.send(5, proofs, { includeFees: true });
   *
   * // With Custom output configuration
   * const customConfig: OutputConfig = {
   * 	send: { type: 'p2pk', options: { pubkey: '...' } },
   * 	keep: { type: 'deterministic', counter: 0 },
   * };
   * const customResult = await wallet.send(5, proofs, { includeFees: true }, customConfig);
   * ```
   *
   * @param amount Amount to send (receiver gets this net amount).
   * @param proofs Array of proofs to split.
   * @param config Optional parameters for the swap.
   * @returns SendResponse with keep/send proofs.
   * @throws Throws if the send cannot be completed offline or if funds are insufficient.
   */
  async send(t, e, n, s) {
    const { keysetId: i, includeFees: o = !1, onCountersReserved: a } = n || {};
    s = s ?? {
      send: this.defaultOutputType(),
      keep: this.defaultOutputType()
    };
    try {
      const f = this.defaultOutputType().type === "deterministic", p = (E) => !E || E.type === "random" && (!E.denominations || E.denominations.length === 0);
      if (i || f || !p(s.send) || s.keep && !p(s.keep)) {
        const E = [];
        throw i && E.push("keysetId override"), f && E.push("wallet default is deterministic"), p(s.send) || E.push("non-default send output type"), s.keep && !p(s.keep) && E.push("non-default keep output type"), new Error(`Options require a swap: ${E.join(", ")}`);
      }
      const { keep: w, send: m } = this.sendOffline(t, e, {
        includeFees: o,
        exactMatch: !0,
        requireDleq: !1
        // safety
      }), N = o ? this.getFeesForProofs(m) : 0;
      if (tt(m) === t + N)
        return this._logger.info("Successful exactMatch offline selection!"), { keep: w, send: m };
    } catch (f) {
      const p = f instanceof Error ? f.message : "Unknown error";
      this._logger.debug("ExactMatch offline selection failed.", { e: p });
    }
    const c = this.getKeyset(i);
    let u = this.configureOutputs(
      t,
      c,
      s.send ?? this.defaultOutputType(),
      o
    );
    const l = this.preparedTotal(u), { keep: h, send: d } = this.selectProofsToSend(
      e,
      l,
      !0
      // Include fees to cover swap fee
    );
    if (d.length === 0)
      throw new Error("Not enough funds available to send");
    const g = tt(d), y = this.getFeesForProofs(d), k = g - y - l;
    this.failIf(k < 0, "Not enough funds available for swap", {
      selectedSum: g,
      swapFee: y,
      sendAmount: l,
      changeAmount: k
    });
    let v = this.configureOutputs(
      k,
      c,
      s.keep ?? this.defaultOutputType(),
      !1,
      n?.proofsWeHave
    );
    const A = this.preparedTotal(v), _ = await this.addCountersToOutputTypes(c.id, u, v);
    [u, v] = _.outputTypes, _.used && this.safeCallback(a, _.used, { op: "send" }), this._logger.debug("send counters", { counter: _.used, sendOT: u, keepOT: v });
    const B = this.createOutputData(l, c, u), S = this.createOutputData(A, c, v), C = this.createSwapTransaction(d, S, B), { signatures: I } = await this.mint.swap(C.payload), b = C.outputData.map((f, p) => f.toProof(I[p], c)), K = Array(b.length), T = Array(C.keepVector.length);
    C.sortedIndices.forEach((f, p) => {
      T[f] = C.keepVector[p], K[f] = b[p];
    });
    const W = [], X = [];
    return K.forEach((f, p) => {
      T[p] ? W.push(f) : X.push(f);
    }), this._logger.debug("SEND COMPLETED", {
      unselectedProofs: h.map((f) => f.amount),
      keepProofs: W.map((f) => f.amount),
      sendProofs: X.map((f) => f.amount)
    }), {
      keep: [...W, ...h],
      send: X
    };
  }
  // -----------------------------------------------------------------
  // Section: Transaction Helpers
  // -----------------------------------------------------------------
  /**
   * Selects proofs to send based on amount and fee inclusion.
   *
   * @remarks
   * Uses an adapted Randomized Greedy with Local Improvement (RGLI) algorithm, which has a time
   * complexity O(n log n) and space complexity O(n).
   * @param proofs Array of Proof objects available to select from.
   * @param amountToSend The target amount to send.
   * @param includeFees Optional boolean to include fees; Default: false.
   * @param exactMatch Optional boolean to require exact match; Default: false.
   * @returns SendResponse containing proofs to keep and proofs to send.
   * @throws Throws an error if an exact match cannot be found within MAX_TIMEMS.
   * @see https://crypto.ethz.ch/publications/files/Przyda02.pdf
   */
  selectProofsToSend(t, e, n = !1, s = !1) {
    const { keep: i, send: o } = this._selectProofs(
      t,
      e,
      this.keyChain,
      n,
      s
    );
    return { keep: i, send: o };
  }
  /**
   * Prepares proofs for sending by signing P2PK-locked proofs.
   *
   * @remarks
   * Call this method before operations like send if the proofs are P2PK-locked and need unlocking.
   * This is a public wrapper for signing.
   * @param proofs The proofs to sign.
   * @param privkey The private key for signing.
   * @returns Signed proofs.
   */
  signP2PKProofs(t, e) {
    return sn(t, e);
  }
  /**
   * Calculates the fees based on inputs (proofs)
   *
   * @param proofs Input proofs to calculate fees for.
   * @returns Fee amount.
   * @throws Throws an error if the proofs keyset is unknown.
   */
  getFeesForProofs(t) {
    const e = t.reduce((n, s) => n + this.getProofFeePPK(s), 0);
    return Math.ceil(e / 1e3);
  }
  /**
   * Returns the current fee PPK for a proof according to the cached keyset.
   *
   * @param proof {Proof} A single proof.
   * @returns FeePPK {number} The feePPK for the selected proof.
   * @throws Throws an error if the proofs keyset is unknown.
   */
  getProofFeePPK(t) {
    try {
      return this.keyChain.getKeyset(t.id).fee;
    } catch (e) {
      this.fail(`Could not get fee. No keyset found for keyset id: ${t.id}`, {
        e,
        keychain: this.keyChain.getKeysets()
      });
    }
  }
  /**
   * Calculates the fees based on inputs for a given keyset.
   *
   * @param nInputs Number of inputs.
   * @param keysetId KeysetId used to lookup `input_fee_ppk`
   * @returns Fee amount.
   */
  getFeesForKeyset(t, e) {
    try {
      const n = this.keyChain.getKeyset(e).fee;
      return Math.floor(Math.max((t * n + 999) / 1e3, 0));
    } catch (n) {
      this.fail(`No keyset found with ID ${e}`, { e: n });
    }
  }
  /**
   * Prepares inputs for a mint operation.
   *
   * @remarks
   * Internal method; strips DLEQ for privacy and serializes witnesses.
   * @param proofs The proofs to prepare.
   * @param keepDleq Optional boolean to keep DLEQ (default: false, strips for privacy).
   * @returns Prepared proofs for mint payload.
   */
  _prepareInputsForMint(t, e = !1) {
    return e || (t = jt(t)), t.map((n) => ({
      ...n,
      witness: n.witness && typeof n.witness != "string" ? JSON.stringify(n.witness) : n.witness
    }));
  }
  /**
   * Decodes a string token.
   *
   * @remarks
   * Rehydrates a token from the space-saving CBOR format, including mapping short keyset ids to
   * their full representation.
   * @param token The token in string format (cashuB...)
   * @returns Token object.
   */
  decodeToken(t) {
    const e = this.keyChain.getKeysets();
    return An(t, e);
  }
  // -----------------------------------------------------------------
  // Section: Restore
  // -----------------------------------------------------------------
  /**
   * Restores batches of deterministic proofs until no more signatures are returned from the mint.
   *
   * @param [gapLimit=300] The amount of empty counters that should be returned before restoring
   *   ends (defaults to 300). Default is `300`
   * @param [batchSize=100] The amount of proofs that should be restored at a time (defaults to
   *   100). Default is `100`
   * @param [counter=0] The counter that should be used as a starting point (defaults to 0). Default
   *   is `0`
   * @param [keysetId] Which keysetId to use for the restoration. If none is passed the instance's
   *   default one will be used.
   */
  async batchRestore(t = 300, e = 100, n = 0, s) {
    const i = Math.ceil(t / e), o = [];
    let a, c = 0;
    for (; c < i; ) {
      const u = await this.restore(n, e, { keysetId: s });
      u.proofs.length > 0 ? (c = 0, o.push(...u.proofs), a = u.lastCounterWithSignature) : c++, n += e;
    }
    return { proofs: o, lastCounterWithSignature: a };
  }
  /**
   * Regenerates.
   *
   * @param start Set starting point for count (first cycle for each keyset should usually be 0)
   * @param count Set number of blinded messages that should be generated.
   * @param options.keysetId Set a custom keysetId to restore from. @see `keyChain)`
   */
  async restore(t, e, n) {
    const { keysetId: s } = n || {}, i = this.getKeyset(s);
    this.failIfNullish(this._seed, "Cashu Wallet must be initialized with a seed to use restore");
    const o = Array(e).fill(0), a = L.createDeterministicData(0, this._seed, t, i, o), { outputs: c, signatures: u } = await this.mint.restore({
      outputs: a.map((g) => g.blindedMessage)
    }), l = {};
    c.forEach((g, y) => l[g.B_] = u[y]);
    const h = [];
    let d;
    for (let g = 0; g < a.length; g++) {
      const y = l[a[g].blindedMessage.B_];
      y && (d = t + g, a[g].blindedMessage.amount = y.amount, h.push(a[g].toProof(y, i)));
    }
    return {
      proofs: h,
      lastCounterWithSignature: d
    };
  }
  // -----------------------------------------------------------------
  // Section: Create Mint Quote
  // -----------------------------------------------------------------
  /**
   * @deprecated Use createMintQuoteBolt11()
   */
  async createMintQuote(t, e) {
    return this.createMintQuoteBolt11(t, e);
  }
  /**
   * Requests a mint quote from the mint. Response returns a Lightning payment request for the
   * requested given amount and unit.
   *
   * @param amount Amount requesting for mint.
   * @param description Optional description for the mint quote.
   * @param pubkey Optional public key to lock the quote to.
   * @returns The mint will return a mint quote with a Lightning invoice for minting tokens of the
   *   specified amount and unit.
   */
  async createMintQuoteBolt11(t, e) {
    const n = {
      unit: this._unit,
      amount: t,
      description: e
    }, s = await this.mint.createMintQuoteBolt11(n);
    return { ...s, amount: s.amount || t, unit: s.unit || this._unit };
  }
  /**
   * Requests a mint quote from the mint that is locked to a public key.
   *
   * @param amount Amount requesting for mint.
   * @param pubkey Public key to lock the quote to.
   * @param description Optional description for the mint quote.
   * @returns The mint will return a mint quote with a Lightning invoice for minting tokens of the
   *   specified amount and unit. The quote will be locked to the specified `pubkey`.
   */
  async createLockedMintQuote(t, e, n) {
    const { supported: s } = this.getMintInfo().isSupported(20);
    this.failIf(!s, "Mint does not support NUT-20");
    const i = {
      unit: this._unit,
      amount: t,
      description: n,
      pubkey: e
    }, o = await this.mint.createMintQuoteBolt11(i);
    this.failIf(typeof o.pubkey != "string", "Mint returned unlocked mint quote");
    const a = o.pubkey;
    return {
      ...o,
      pubkey: a,
      amount: o.amount || t,
      unit: o.unit || this._unit
    };
  }
  /**
   * Requests a mint quote from the mint. Response returns a Lightning BOLT12 offer for the
   * requested given amount and unit.
   *
   * @param pubkey Public key to lock the quote to.
   * @param options.amount BOLT12 offer amount requesting for mint. If not specified, the offer will
   *   be amountless.
   * @param options.description Description for the mint quote.
   * @returns The mint will return a mint quote with a BOLT12 offer for minting tokens of the
   *   specified amount and unit.
   */
  async createMintQuoteBolt12(t, e) {
    const n = this.getMintInfo();
    e?.description && !n.supportsBolt12Description && this.fail("Mint does not support description for bolt12");
    const s = {
      pubkey: t,
      unit: this._unit,
      amount: e?.amount,
      description: e?.description
    };
    return this.mint.createMintQuoteBolt12(s);
  }
  // -----------------------------------------------------------------
  // Section: Check Mint Quote
  // -----------------------------------------------------------------
  /**
   * @deprecated Use checkMintQuoteBolt11()
   */
  async checkMintQuote(t) {
    return this.checkMintQuoteBolt11(t);
  }
  /**
   * Gets an existing mint quote from the mint.
   *
   * @param quote Quote ID.
   * @returns The mint will create and return a Lightning invoice for the specified amount.
   */
  async checkMintQuoteBolt11(t) {
    const e = typeof t == "string" ? t : t.quote, n = await this.mint.checkMintQuoteBolt11(e);
    return typeof t == "string" ? n : { ...n, amount: n.amount || t.amount, unit: n.unit || t.unit };
  }
  /**
   * Gets an existing BOLT12 mint quote from the mint.
   *
   * @param quote Quote ID.
   * @returns The latest mint quote for the given quote ID.
   */
  async checkMintQuoteBolt12(t) {
    return this.mint.checkMintQuoteBolt12(t);
  }
  // -----------------------------------------------------------------
  // Section: Mint Proofs
  // -----------------------------------------------------------------
  /**
   * Generic method to mint proofs using any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods. The method parameter is passed directly
   * to the internal _mintProofsGeneric function, enabling any endpoint of the form
   * `/v1/mint/{method}`.
   *
   * The payload factory function receives the blinded messages and should return the complete
   * payload object for the mint request. This allows custom payment methods to include additional
   * fields beyond the standard quote and outputs.
   * @example
   *
   * ```ts
   * // Standard bolt11 mint
   * const proofs = await wallet.mintProofsGeneric('bolt11', 100, (blindedMessages) => ({
   * 	quote: 'quote-id',
   * 	outputs: blindedMessages,
   * }));
   *
   * // Custom payment method with additional fields
   * const customProofs = await wallet.mintProofsGeneric(
   * 	'custom-payment',
   * 	100,
   * 	(blindedMessages) => ({
   * 		quote: customQuote.quote,
   * 		outputs: blindedMessages,
   * 		signature: signPayload(customQuote, blindedMessages),
   * 	}),
   * 	config,
   * );
   * ```
   *
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param amount Amount to mint.
   * @param payloadFactory Function that receives blinded messages and returns the mint payload.
   * @param config Optional configuration including keysetId and counter management.
   * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
   * @returns Array of newly minted proofs.
   */
  async mintProofsGeneric(t, e, n, s, i) {
    return this._mintProofsWithFactory(t, e, n, s, i);
  }
  /**
   * @deprecated Use mintProofsBolt11()
   */
  async mintProofs(t, e, n, s) {
    return this._mintProofs("bolt11", t, e, n, s);
  }
  /**
   * Mint proofs for a bolt11 quote.
   *
   * @param amount Amount to mint.
   * @param quote Mint quote ID or object (bolt11).
   * @param config Optional parameters (e.g. privkey for locked quotes).
   * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
   * @returns Minted proofs.
   */
  async mintProofsBolt11(t, e, n, s) {
    return this._mintProofs("bolt11", t, e, n, s);
  }
  /**
   * Mints proofs for a bolt12 quote.
   *
   * @param amount Amount to mint.
   * @param quote Bolt12 mint quote.
   * @param privkey Private key to unlock the quote.
   * @param config Optional parameters (e.g. keysetId).
   * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
   * @returns Minted proofs.
   */
  async mintProofsBolt12(t, e, n, s, i) {
    return this._mintProofs("bolt12", t, e, { ...s, privkey: n }, i);
  }
  /**
   * Internal helper for minting proofs with bolt11 or bolt12.
   *
   * @remarks
   * Handles blinded messages, signatures, and proof construction. Use public methods like
   * mintProofs or helpers for API access.
   * @param method 'bolt11' or 'bolt12'.
   * @param amount Amount to mint (must be positive).
   * @param quote Quote ID or object.
   * @param config Optional (privkey, keysetId).
   * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
   * @returns Minted proofs.
   * @throws If params are invalid or mint returns errors.
   */
  /**
   * Internal helper for minting proofs with any payment method.
   *
   * @remarks
   * This generic method now supports any payment method. The method parameter is passed directly to
   * the mint, enabling support for custom payment methods without code changes.
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
   * @param amount Amount to mint.
   * @param quote Quote ID (string) or quote response object. For string quotes, no signature is
   *   required.
   * @param config Optional configuration including private key for locked quotes.
   * @param outputType Configuration for proof generation.
   * @returns Array of newly minted proofs.
   * @throws If params are invalid or mint returns errors.
   */
  async _mintProofs(t, e, n, s, i) {
    return this._mintProofsGeneric(t, e, n, s, i);
  }
  /**
   * Generic internal helper for minting proofs with any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods. The method parameter is passed directly
   * to mint.mint(), allowing any endpoint of the form `/v1/mint/{method}`.
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
   * @param amount Amount to mint.
   * @param quote Quote ID (string) or quote response object.
   * @param config Optional configuration including private key for locked quotes.
   * @param outputType Configuration for proof generation.
   * @returns Array of newly minted proofs.
   */
  async _mintProofsGeneric(t, e, n, s, i) {
    i = i ?? this.defaultOutputType();
    const { privkey: o, keysetId: a, proofsWeHave: c, onCountersReserved: u } = s ?? {};
    this.failIf(e <= 0, "Invalid mint amount: must be positive", { amount: e });
    const l = this.getKeyset(a);
    let h = this.configureOutputs(
      e,
      l,
      i,
      !1,
      // no fees
      c
    );
    const d = this.preparedTotal(h), g = await this.addCountersToOutputTypes(l.id, h);
    [h] = g.outputTypes, g.used && this.safeCallback(u, g.used, { op: "mintProofs" }), this._logger.debug("mint counter", { counter: g.used, mintOT: h });
    const y = this.createOutputData(d, l, h), k = y.map((_) => _.blindedMessage), v = {
      outputs: k,
      quote: typeof n == "string" ? n : n.quote
    };
    if (typeof n != "string" && n.pubkey) {
      this.failIf(!o, "Can not sign locked quote without private key");
      const _ = kn(o, n.quote, k);
      v.signature = _;
    }
    const { signatures: A } = await this.mint.mint(t, v);
    return this.failIf(
      A.length !== y.length,
      `Mint returned ${A.length} signatures, expected ${y.length}`
    ), this._logger.debug("MINT COMPLETED", { amounts: y.map((_) => _.blindedMessage.amount) }), y.map((_, B) => _.toProof(A[B], l));
  }
  /**
   * Generic internal helper for minting proofs with a payload factory.
   *
   * @remarks
   * This method allows custom payment methods to provide their own payload creation logic.
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
   * @param amount Amount to mint.
   * @param payloadFactory Function that receives blinded messages and returns the mint payload.
   * @param config Optional configuration.
   * @param outputType Configuration for proof generation.
   * @returns Array of newly minted proofs.
   */
  async _mintProofsWithFactory(t, e, n, s, i) {
    i = i ?? this.defaultOutputType();
    const { keysetId: o, proofsWeHave: a, onCountersReserved: c } = s ?? {};
    this.failIf(e <= 0, "Invalid mint amount: must be positive", { amount: e });
    const u = this.getKeyset(o);
    let l = this.configureOutputs(
      e,
      u,
      i,
      !1,
      // no fees
      a
    );
    const h = this.preparedTotal(l), d = await this.addCountersToOutputTypes(u.id, l);
    [l] = d.outputTypes, d.used && this.safeCallback(c, d.used, { op: "mintProofs" }), this._logger.debug("mint counter", { counter: d.used, mintOT: l });
    const g = this.createOutputData(h, u, l), y = g.map((A) => A.blindedMessage), k = n(y), { signatures: v } = await this.mint.mint(t, k);
    return this.failIf(
      v.length !== g.length,
      `Mint returned ${v.length} signatures, expected ${g.length}`
    ), this._logger.debug("MINT COMPLETED", { amounts: g.map((A) => A.blindedMessage.amount) }), g.map((A, _) => A.toProof(v[_], u));
  }
  // -----------------------------------------------------------------
  // Section: Create Melt Quote
  // -----------------------------------------------------------------
  /**
   * @deprecated Use createMeltQuoteBolt11.
   */
  async createMeltQuote(t) {
    return this.createMeltQuoteBolt11(t);
  }
  /**
   * Requests a melt quote from the mint. Response returns amount and fees for a given unit in order
   * to pay a Lightning invoice.
   *
   * @param invoice LN invoice that needs to get a fee estimate.
   * @returns The mint will create and return a melt quote for the invoice with an amount and fee
   *   reserve.
   */
  async createMeltQuoteBolt11(t) {
    const e = {
      unit: this._unit,
      request: t
    }, n = await this.mint.createMeltQuoteBolt11(e);
    return {
      ...n,
      unit: n.unit || this._unit,
      request: n.request || t
    };
  }
  /**
   * Requests a melt quote from the mint. Response returns amount and fees for a given unit in order
   * to pay a BOLT12 offer.
   *
   * @param offer BOLT12 offer that needs to get a fee estimate.
   * @param amountMsat Amount in millisatoshis for amount-less offers. If this is defined and the
   *   offer has an amount, they **MUST** be equal.
   * @returns The mint will create and return a melt quote for the offer with an amount and fee
   *   reserve.
   */
  async createMeltQuoteBolt12(t, e) {
    return this.mint.createMeltQuoteBolt12({
      unit: this._unit,
      request: t,
      options: e ? {
        amountless: {
          amount_msat: e
        }
      } : void 0
    });
  }
  /**
   * Requests a multi path melt quote from the mint.
   *
   * @remarks
   * Uses NUT-15 Partial multi-path payments for BOLT11.
   * @param invoice LN invoice that needs to get a fee estimate.
   * @param partialAmount The partial amount of the invoice's total to be paid by this instance.
   * @returns The mint will create and return a melt quote for the invoice with an amount and fee
   *   reserve.
   * @see https://github.com/cashubtc/nuts/blob/main/15.md
   */
  async createMultiPathMeltQuote(t, e) {
    const { supported: n, params: s } = this.getMintInfo().isSupported(15);
    this.failIf(!n, "Mint does not support NUT-15"), this.failIf(
      !s?.some((u) => u.method === "bolt11" && u.unit === this._unit),
      `Mint does not support MPP for bolt11 and ${this._unit}`
    );
    const o = {
      mpp: {
        amount: e
      }
    }, a = {
      unit: this._unit,
      request: t,
      options: o
    };
    return { ...await this.mint.createMeltQuoteBolt11(a), request: t, unit: this._unit };
  }
  // -----------------------------------------------------------------
  // Section: Check Melt Quote
  // -----------------------------------------------------------------
  /**
   * @deprecated Use checkMeltQuoteBolt11()
   */
  async checkMeltQuote(t) {
    return this.checkMeltQuoteBolt11(t);
  }
  /**
   * Returns an existing bolt11 melt quote from the mint.
   *
   * @param quote ID of the melt quote.
   * @returns The mint will return an existing melt quote.
   */
  async checkMeltQuoteBolt11(t) {
    const e = typeof t == "string" ? t : t.quote, n = await this.mint.checkMeltQuoteBolt11(e);
    return typeof t == "string" ? n : { ...n, request: t.request, unit: t.unit };
  }
  /**
   * Returns an existing bolt12 melt quote from the mint.
   *
   * @param quote ID of the melt quote.
   * @returns The mint will return an existing melt quote.
   */
  async checkMeltQuoteBolt12(t) {
    return this.mint.checkMeltQuoteBolt12(t);
  }
  // -----------------------------------------------------------------
  // Section: Generic Quote Methods
  // -----------------------------------------------------------------
  /**
   * Generic method to create a mint quote for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods. The method parameter is passed directly
   * to the Mint class, enabling any endpoint of the form `/v1/mint/quote/{method}`.
   *
   * The payload factory function receives the wallet's unit and should return the complete payload
   * object for the mint quote request. This allows custom payment methods to include additional
   * fields beyond the standard amount and description.
   * @example
   *
   * ```ts
   * // Standard bolt11 mint quote
   * const quote = await wallet.createMintQuoteGeneric('bolt11', (unit) => ({
   * 	unit,
   * 	amount: 100,
   * 	description: 'My payment',
   * }));
   *
   * // Custom payment method with additional fields
   * const customQuote = await wallet.createMintQuoteGeneric('custom-payment', (unit) => ({
   * 	unit,
   * 	amount: 100,
   * 	customField: 'custom value',
   * }));
   * ```
   *
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param payloadFactory Function that receives the wallet unit and returns the mint quote
   *   payload.
   * @returns The mint will return a mint quote with payment details for the specified method.
   */
  async createMintQuoteGeneric(t, e) {
    const n = e(this._unit);
    return this.mint.createMintQuote(t, n);
  }
  /**
   * Generic method to check a mint quote status for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods. The method parameter is passed directly
   * to the Mint class, enabling any endpoint of the form `/v1/mint/quote/{method}/{quote}`.
   * @example
   *
   * ```ts
   * const status = await wallet.checkMintQuoteGeneric('bolt11', 'quote-id');
   * const status = await wallet.checkMintQuoteGeneric('custom-payment', 'custom-quote-id');
   * ```
   *
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param quote Quote ID.
   * @returns The mint will return the current state of the mint quote.
   */
  async checkMintQuoteGeneric(t, e) {
    return this.mint.checkMintQuote(t, e);
  }
  /**
   * Generic method to create a melt quote for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods. The method parameter is passed directly
   * to the Mint class, enabling any endpoint of the form `/v1/melt/quote/{method}`.
   *
   * The payload factory function receives the wallet's unit and should return the complete payload
   * object for the melt quote request. This allows custom payment methods to include additional
   * fields beyond the standard request.
   * @example
   *
   * ```ts
   * // Standard bolt11 melt quote
   * const quote = await wallet.createMeltQuoteGeneric('bolt11', (unit) => ({
   * 	unit,
   * 	request: 'lnbc...',
   * }));
   *
   * // Custom payment method with additional options
   * const customQuote = await wallet.createMeltQuoteGeneric('custom-payment', (unit) => ({
   * 	unit,
   * 	request: 'custom-request-string',
   * 	options: { foo: 'bar' },
   * }));
   * ```
   *
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param payloadFactory Function that receives the wallet unit and returns the melt quote
   *   payload.
   * @returns The mint will return a melt quote with fee and status information.
   */
  async createMeltQuoteGeneric(t, e) {
    const n = e(this._unit);
    return this.mint.createMeltQuote(t, n);
  }
  /**
   * Generic method to check a melt quote status for any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods. The method parameter is passed directly
   * to the Mint class, enabling any endpoint of the form `/v1/melt/quote/{method}/{quote}`.
   * @example
   *
   * ```ts
   * const status = await wallet.checkMeltQuoteGeneric('bolt11', 'quote-id');
   * const status = await wallet.checkMeltQuoteGeneric('custom-payment', 'custom-quote-id');
   * ```
   *
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param quote Quote ID.
   * @returns The mint will return the current state of the melt quote.
   */
  async checkMeltQuoteGeneric(t, e) {
    return this.mint.checkMeltQuote(t, e);
  }
  // -----------------------------------------------------------------
  // Section: Melt Proofs
  // -----------------------------------------------------------------
  /**
   * Generic method to melt proofs using any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods. The method parameter is passed directly
   * to the internal _meltProofsWithFactory function, enabling any endpoint of the form
   * `/v1/melt/{method}`. ProofsToSend must be at least amount+fee_reserve. This function does not
   * perform coin selection!
   *
   * The payload factory function receives the proofs and change outputs, allowing custom payment
   * methods to construct their own payload structure.
   * @example
   *
   * ```ts
   * // Standard bolt11 melt
   * const response = await wallet.meltProofsGeneric(
   * 	'bolt11',
   * 	quote,
   * 	100, // amount
   * 	proofsToSend,
   * 	(proofs, outputs) => ({
   * 		quote: quote.quote,
   * 		inputs: proofs,
   * 		outputs,
   * 	}),
   * );
   *
   * // Custom payment method with additional fields
   * const customResponse = await wallet.meltProofsGeneric(
   * 	'custom-payment',
   * 	customQuote,
   * 	100,
   * 	proofsToSend,
   * 	(proofs, outputs) => ({
   * 		quote: customQuote.quote,
   * 		inputs: proofs,
   * 		outputs,
   * 		customField: 'custom value',
   * 	}),
   * );
   * ```
   *
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom method name).
   * @param meltQuote Quote response object containing quote ID, amount, and fee_reserve.
   * @param amount Total amount from the quote (amount + fee_reserve).
   * @param proofsToSend Proofs to melt (must be >= amount + fee_reserve).
   * @param payloadFactory Function that receives proofs and change outputs, returns melt payload.
   * @param config Optional configuration including callbacks.
   * @param outputType Configuration for change proof generation. Defaults to
   *   wallet.defaultOutputType().
   * @returns MeltProofsResponse with quote and change proofs.
   */
  async meltProofsGeneric(t, e, n, s, i, o, a) {
    return this._meltProofsWithFactory(
      t,
      e,
      n,
      s,
      i,
      o,
      a
    );
  }
  /**
   * @deprecated Use meltProofsBolt11()
   */
  async meltProofs(t, e, n, s) {
    return this._meltProofs("bolt11", t, e, n, s);
  }
  /**
   * Melt proofs for a bolt11 melt quote.
   *
   * @remarks
   * ProofsToSend must be at least amount+fee_reserve from the melt quote. This function does not
   * perform coin selection!.
   * @param meltQuote ID of the melt quote.
   * @param proofsToSend Proofs to melt.
   * @param config Optional parameters.
   * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
   * @returns MeltProofsResponse with quote and change proofs.
   */
  async meltProofsBolt11(t, e, n, s) {
    return this._meltProofs("bolt11", t, e, n, s);
  }
  /**
   * Melt proofs for a bolt12 melt quote, returns change proofs using specified outputType.
   *
   * @remarks
   * ProofsToSend must be at least amount+fee_reserve from the melt quote. This function does not
   * perform coin selection!.
   * @param meltQuote ID of the melt quote.
   * @param proofsToSend Proofs to melt.
   * @param config Optional parameters.
   * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
   * @returns MeltProofsResponse with quote and change proofs.
   */
  async meltProofsBolt12(t, e, n, s) {
    return this._meltProofs("bolt12", t, e, n, s);
  }
  /**
   * Melt proofs for a given melt quote created with the bolt11 or bolt12 method.
   *
   * @remarks
   * Creates NUT-08 blanks (1-sat) for Lightning fee return. Get these by setting a
   * config.onChangeOutputsCreated callback for async melting. @see completeMelt.
   * @param method Payment method of the quote.
   * @param meltQuote The bolt11 or bolt12 melt quote.
   * @param proofsToSend Proofs to melt.
   * @param config Optional (keysetId, onChangeOutputsCreated).
   * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
   * @returns MeltProofsResponse.
   * @throws If params are invalid or mint returns errors.
   * @see https://github.com/cashubtc/nuts/blob/main/08.md.
   */
  async _meltProofs(t, e, n, s, i) {
    return this._meltProofsGeneric(t, e, n, s, i);
  }
  /**
   * Generic internal helper for melting proofs with any payment method.
   *
   * @remarks
   * This method enables support for custom payment methods. The method parameter is passed directly
   * to mint.melt(), allowing any endpoint of the form `/v1/melt/{method}`.
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
   * @param meltQuote Quote response object containing quote ID, amount, and fee_reserve.
   * @param proofsToSend Proofs to melt.
   * @param config Optional configuration including callbacks.
   * @param outputType Configuration for change proof generation.
   * @returns Melt response with quote and change proofs.
   */
  async _meltProofsGeneric(t, e, n, s, i) {
    i = i ?? this.defaultOutputType();
    const { keysetId: o, onChangeOutputsCreated: a, onCountersReserved: c } = s || {}, u = this.getKeyset(o), l = tt(n), h = l - e.amount;
    let d = [];
    if (this.failIf(h < 0, "Not enough proofs to cover amount + fee reserve", {
      sendAmount: l,
      quoteAmount: e.amount
    }), h > 0) {
      let S = Math.ceil(Math.log2(h)) || 1;
      S < 0 && (S = 0);
      const C = S ? new Array(S).fill(0) : [];
      this._logger.debug("Creating NUT-08 blanks for fee reserve", {
        feeReserve: h,
        denominations: C
      }), i.type === "custom" && this.fail("Custom OutputType not supported for melt change (must be 0-sat blanks)");
      let I = { ...i, denominations: C };
      const b = await this.addCountersToOutputTypes(u.id, I);
      [I] = b.outputTypes, b.used && this.safeCallback(c, b.used, { op: "meltProofs" }), this._logger.debug("melt counter", { counter: b.used, meltOT: I }), d = this.createOutputData(0, u, I);
    }
    n = this._prepareInputsForMint(n);
    const g = {
      quote: e.quote,
      inputs: n,
      outputs: d.map((S) => S.blindedMessage)
    };
    if (d.length > 0) {
      const S = {
        method: t,
        payload: g,
        outputData: d,
        keyset: u,
        quote: e
      };
      this.safeCallback(a, S, { op: "meltProofs" }), this.on._emitMeltBlanksCreated(S);
    }
    const y = typeof a == "function", k = await this.mint.melt(
      t,
      g,
      { preferAsync: y }
    );
    if (this.failIf(
      (k.change?.length ?? 0) > d.length,
      `Mint returned ${k.change?.length ?? 0} signatures, but only ${d.length} blanks were provided`
    ), Object.keys(k).length === 0)
      throw new Error("bad response");
    const v = k.change?.map((S, C) => d[C].toProof(S, u)) ?? [];
    this._logger.debug("MELT COMPLETED", { changeAmounts: v.map((S) => S.amount) });
    const A = at(
      k,
      this._logger
    ), _ = A.state || k.state || e.state;
    return { quote: {
      quote: e.quote,
      amount: e.amount,
      fee_reserve: e.fee_reserve,
      state: _,
      expiry: e.expiry ?? 0,
      payment_preimage: A.payment_preimage ?? null,
      unit: e.unit || this._unit,
      request: e.request || "",
      ...k.change && { change: k.change }
    }, change: v };
  }
  /**
   * Generic internal helper for melting proofs with a payload factory.
   *
   * @remarks
   * This method allows custom payment methods to provide their own payload creation logic.
   * @param method Payment method name (e.g., 'bolt11', 'bolt12', or custom).
   * @param meltQuote Quote response object containing quote ID, amount, and fee_reserve.
   * @param amount Total amount from the quote (amount + fee_reserve).
   * @param proofsToSend Proofs to melt.
   * @param payloadFactory Function that receives proofs and outputs, returns melt payload.
   * @param config Optional configuration including callbacks.
   * @param outputType Configuration for change proof generation.
   * @returns Melt response with quote and change proofs.
   */
  async _meltProofsWithFactory(t, e, n, s, i, o, a) {
    a = a ?? this.defaultOutputType();
    const { keysetId: c, onChangeOutputsCreated: u, onCountersReserved: l } = o || {}, h = this.getKeyset(c), d = tt(s), g = d - n;
    let y = [];
    if (this.failIf(g < 0, "Not enough proofs to cover amount + fee reserve", {
      sendAmount: d,
      quoteAmount: n
    }), g > 0) {
      let b = Math.ceil(Math.log2(g)) || 1;
      b < 0 && (b = 0);
      const K = b ? new Array(b).fill(0) : [];
      this._logger.debug("Creating NUT-08 blanks for fee reserve", {
        feeReserve: g,
        denominations: K
      }), a.type === "custom" && this.fail("Custom OutputType not supported for melt change (must be 0-sat blanks)");
      let T = { ...a, denominations: K };
      const W = await this.addCountersToOutputTypes(h.id, T);
      [T] = W.outputTypes, W.used && this.safeCallback(l, W.used, { op: "meltProofs" }), this._logger.debug("melt counter", { counter: W.used, meltOT: T }), y = this.createOutputData(0, h, T);
    }
    s = this._prepareInputsForMint(s);
    const k = y.map((b) => b.blindedMessage), v = i(s, k);
    if (y.length > 0 && u) {
      const b = {
        quote: e.quote,
        amount: e.amount,
        fee_reserve: e.fee_reserve,
        state: e.state ?? "UNPAID",
        expiry: e.expiry ?? 0,
        payment_preimage: null,
        unit: e.unit ?? this._unit,
        request: e.request ?? ""
      }, K = {
        method: t,
        payload: v,
        outputData: y,
        keyset: h,
        quote: b
      };
      this.safeCallback(u, K, { op: "meltProofs" }), this.on._emitMeltBlanksCreated(K);
    }
    const A = typeof u == "function", _ = await this.mint.melt(
      t,
      v,
      { preferAsync: A }
    );
    if (Object.keys(_).length === 0)
      throw new Error("bad response");
    const B = _.change?.map((b, K) => y[K].toProof(b, h)) ?? [];
    this._logger.debug("MELT COMPLETED", { changeAmounts: B.map((b) => b.amount) });
    const S = at(
      _,
      this._logger
    ), C = S.state || _.state || e.state;
    return { quote: {
      quote: e.quote,
      amount: e.amount,
      fee_reserve: e.fee_reserve,
      state: C,
      expiry: e.expiry ?? 0,
      payment_preimage: S.payment_preimage ?? null,
      unit: e.unit || this._unit,
      request: e.request || "",
      ..._.change && { change: _.change }
    }, change: B };
  }
  /**
   * Completes a pending melt by re-calling the melt endpoint and constructing change proofs.
   *
   * @remarks
   * Use with blanks from onChangeOutputsCreated to retry pending melts. Works for Bolt11/Bolt12.
   * Returns change proofs if paid, else empty change.
   * @param blanks The blanks from onChangeOutputsCreated.
   * @returns Updated MeltProofsResponse.
   * @throws If melt fails or signatures don't match output count.
   */
  async completeMelt(t) {
    const e = t.method === "bolt12" ? await this.mint.meltBolt12(t.payload) : await this.mint.meltBolt11(t.payload);
    this.failIf(
      (e.change?.length ?? 0) > t.outputData.length,
      `Mint returned ${e.change?.length ?? 0} signatures, but only ${t.outputData.length} blanks were provided`
    );
    const n = e.change?.map((s, i) => t.outputData[i].toProof(s, t.keyset)) ?? [];
    return this._logger.debug("COMPLETE MELT", { changeAmounts: n.map((s) => s.amount) }), {
      quote: { ...e, unit: t.quote.unit, request: t.quote.request },
      change: n
    };
  }
  // -----------------------------------------------------------------
  // Section: Proof States
  // -----------------------------------------------------------------
  /**
   * Get an array of the states of proofs from the mint (as an array of CheckStateEnum's)
   *
   * @param proofs (only the `secret` field is required)
   * @returns NUT-07 state for each proof, in same order.
   */
  async checkProofsStates(t) {
    const e = new TextEncoder(), n = t.map((o) => dt(e.encode(o.secret)).toHex(!0)), s = 100, i = [];
    for (let o = 0; o < n.length; o += s) {
      const a = n.slice(o, o + s), { states: c } = await this.mint.check({
        Ys: a
      }), u = {};
      c.forEach((l) => {
        u[l.Y] = l;
      });
      for (let l = 0; l < a.length; l++) {
        const h = u[a[l]];
        this.failIfNullish(h, "Could not find state for proof with Y: " + a[l]), i.push(h);
      }
    }
    return i;
  }
  /**
   * Groups proofs by their corresponding state, preserving order within each group.
   *
   * @param proofs (only the `secret` field is required)
   * @returns An object with arrays of proofs grouped by CheckStateEnum state.
   */
  async groupProofsByState(t) {
    const e = await this.checkProofsStates(t), n = {
      unspent: [],
      pending: [],
      spent: []
    };
    for (let s = 0; s < e.length; s++) {
      const i = t[s];
      switch (e[s].state) {
        case Pt.UNSPENT:
          n.unspent.push(i);
          break;
        case Pt.PENDING:
          n.pending.push(i);
          break;
        case Pt.SPENT:
          n.spent.push(i);
          break;
      }
    }
    return n;
  }
}
var jn = /* @__PURE__ */ ((r) => (r.POST = "post", r.NOSTR = "nostr", r))(jn || {});
const wt = class wt {
  constructor(t, e) {
    this.tokens = {}, this.pool = [], this.desiredPoolSize = 10, this.maxPerMint = 10, this.mintUrl = t, this.req = e?.request ?? le, this.logger = e?.logger ?? $, this.desiredPoolSize = Math.max(1, e?.desiredPoolSize ?? this.desiredPoolSize), this.maxPerMint = Math.max(1, e?.maxPerMint ?? this.maxPerMint);
  }
  // ------------------------------
  // Public API
  // ------------------------------
  /**
   * Attach an OIDCAuth instance so this manager can refresh CATs. Registers a listener to update
   * internal CAT/refresh state on new tokens.
   */
  attachOIDC(t) {
    return this.oidc = t, this.oidc.addTokenListener((e) => this.updateFromOIDC(e)), this;
  }
  get poolSize() {
    return this.pool.length;
  }
  get poolTarget() {
    return this.desiredPoolSize;
  }
  get activeAuthKeysetId() {
    try {
      return this.keychain?.getCheapestKeyset().id;
    } catch {
      return;
    }
  }
  get hasCAT() {
    return !!this.tokens.accessToken;
  }
  // ------------------------------
  // AuthProvider (NUT-21, Clear-auth)
  // ------------------------------
  getCAT() {
    return this.tokens.accessToken;
  }
  setCAT(t) {
    this.tokens.accessToken = t, t || (this.tokens.refreshToken = void 0, this.tokens.expiresAt = void 0);
  }
  /**
   * Ensure a valid CAT is available (refresh if expiring soon). Returns a token safe to send right
   * now, or undefined if unobtainable.
   */
  async ensureCAT(t) {
    return this.validForAtLeast(t) ? this.tokens.accessToken : !this.oidc || !this.tokens.refreshToken ? this.tokens.accessToken : (this.inflightRefresh || (this.inflightRefresh = (async () => {
      try {
        const e = await this.oidc.refresh(this.tokens.refreshToken);
        this.updateFromOIDC(e);
      } catch (e) {
        this.logger.warn("AuthManager: CAT refresh failed", { err: e });
      } finally {
        this.inflightRefresh = void 0;
      }
    })()), await this.inflightRefresh, this.validForAtLeast(0) ? this.tokens.accessToken : void 0);
  }
  // Returns true if expiry date is >minValidSecs away
  validForAtLeast(t = wt.MIN_VALID_SECS) {
    const { accessToken: e, expiresAt: n } = this.tokens;
    return e ? n ? Date.now() + t * 1e3 < n : !0 : !1;
  }
  // Updates access and refresh tokens in our store, using either the explicit expires_in key or falling back to the JWT expiry.
  updateFromOIDC(t) {
    if (!t.access_token) return;
    const e = Date.now();
    if (this.tokens.accessToken = t.access_token, t.refresh_token && (this.tokens.refreshToken = t.refresh_token), typeof t.expires_in == "number" && t.expires_in > 0)
      this.tokens.expiresAt = e + t.expires_in * 1e3;
    else {
      const n = this.parseJwtExpSec(t.access_token);
      this.tokens.expiresAt = n ? n * 1e3 : void 0;
    }
    this.logger.debug("AuthManager: OIDC tokens updated", { expiresAt: this.tokens.expiresAt });
  }
  // ------------------------------
  // AuthProvider (NUT-22, Blind-auth)
  // ------------------------------
  /**
   * Ensure there are enough BAT tokens (topping up if needed)
   *
   * @param minTokens Minimum tokens needed.
   */
  async ensure(t) {
    if (await this.init(), this.pool.length >= t) return;
    const e = Math.max(this.desiredPoolSize, t), n = this.getBatMaxMint(), s = Math.min(e - this.pool.length, n);
    s <= 0 || await this.topUp(s);
  }
  /**
   * Gets a Blind Authentication Token (BAT)
   *
   * @param {method, path} to Call (not used in our implementation)
   * @returns The serialized BAT ready to insert into request header.
   */
  async getBlindAuthToken({
    method: t,
    path: e
  }) {
    return this.info && !this.info.requiresBlindAuthToken(t, e) && this.logger.warn("Endpoint is not marked as protected by NUT-22; still issuing BAT", {
      method: t,
      path: e
    }), this.withLock(async () => {
      if (await this.ensure(1), this.pool.length === 0)
        throw new Error("AuthManager: no BATs available and minting failed");
      const n = this.pool.pop();
      return this.logger.debug("AuthManager: BAT requested", {
        method: t,
        path: e,
        remaining: this.pool.length
      }), Hn(n);
    });
  }
  /**
   * Replace or merge the current BAT pool with previously persisted BATs.
   */
  importPool(t, e = "replace") {
    e === "replace" && (this.pool = []);
    const n = new Map(this.pool.map((s) => [s.secret, s]));
    for (const s of t)
      !s || !s.secret || !s.C || !s.id || n.has(s.secret) || (this.pool.push(s), n.set(s.secret, s));
  }
  /**
   * Return a deep-copied snapshot of the current BAT pool (full Proofs, including dleq).
   */
  exportPool() {
    return this.pool.map((t) => ({ ...t, dleq: t.dleq ? { ...t.dleq } : void 0 }));
  }
  // ------------------------------
  // Internals
  // ------------------------------
  /**
   * Extract exp, seconds since epoch, from a JWT access token.
   */
  parseJwtExpSec(t) {
    if (!t) return;
    const e = t.split(".");
    if (e.length === 3)
      try {
        const n = P.toString(P.fromBase64(e[1])), s = JSON.parse(n), i = typeof s.exp == "number" ? s.exp : Number(s.exp);
        if (Number.isFinite(i) && i > 0) return i;
      } catch {
        this.logger.warn("JWT access token was malformed.", {
          token: t
        });
      }
  }
  /**
   * Simple mutex lock - chains promises in order.
   */
  async withLock(t) {
    const e = this.lockChain ?? Promise.resolve();
    let n;
    const s = new Promise((o) => {
      n = o;
    }), i = e.then(() => s);
    this.lockChain = i;
    try {
      return await e, await t();
    } finally {
      n(), this.lockChain === i && (this.lockChain = void 0);
    }
  }
  /**
   * Initialise mint info and auth keysets/keys as needed.
   */
  async init() {
    if (!this.info) {
      const t = await this.req({
        endpoint: j(this.mintUrl, "/v1/info"),
        method: "GET"
      });
      this.info = new yt(t);
    }
    if (!this.keychain) {
      const [t, e] = await Promise.all([
        this.req({
          endpoint: j(this.mintUrl, "/v1/auth/blind/keysets"),
          method: "GET"
        }),
        this.req({
          endpoint: j(this.mintUrl, "/v1/auth/blind/keys"),
          method: "GET"
        })
      ]);
      this.keychain = new Me(this.mintUrl, "auth", t.keysets, e.keysets), this.keychain.getCheapestKeyset();
    }
  }
  /**
   * Gets the BAT minting limit: lower of manager limit and Mint’s NUT-22 limit.
   */
  getBatMaxMint() {
    if (!this.info) throw new Error("AuthManager: mint info not loaded");
    const e = this.info.nuts[22]?.bat_max_mint ?? this.maxPerMint;
    return Math.max(1, Math.min(this.maxPerMint, e));
  }
  getActiveKeys() {
    if (!this.keychain) throw new Error("AuthManager: keyset not loaded for active keyset");
    return this.keychain.getCheapestKeyset();
  }
  /**
   * Mint a batch of BATs using the current CAT if the endpoint is protected by NUT-21.
   */
  async topUp(t) {
    if (!this.info) throw new Error("AuthManager: mint info not loaded");
    const e = this.info.requiresClearAuthToken("POST", "/v1/auth/blind/mint");
    let n;
    if (e && (n = await this.ensureCAT(), !n))
      throw new Error(
        "AuthManager: Clear-auth token required for /v1/auth/blind/mint but not available. Authenticate with the mint to obtain a CAT first."
      );
    const s = this.getActiveKeys(), i = L.createRandomData(t, s), o = { outputs: i.map((l) => l.blindedMessage) }, a = {};
    n && (a["Clear-auth"] = n);
    const c = await this.req({
      endpoint: j(this.mintUrl, "/v1/auth/blind/mint"),
      method: "POST",
      headers: a,
      requestBody: o
    });
    if (!Array.isArray(c?.signatures) || c.signatures.length !== i.length)
      throw new Error("AuthManager: bad BAT mint response");
    const u = i.map((l, h) => l.toProof(c.signatures[h], s));
    for (const l of u)
      if (!Ee(l, s))
        throw new Error("AuthManager: mint returned BAT with invalid DLEQ");
    this.pool.push(...u), this.logger.debug("AuthManager: performed topUp", {
      minted: u.length,
      pool: this.pool.length
    });
  }
};
wt.MIN_VALID_SECS = 30;
let Mt = wt;
function Hn(r) {
  const t = { id: r.id, secret: r.secret, C: r.C };
  return `authA${de(t)}`;
}
async function As(r, t) {
  const e = new Mt(r, {
    desiredPoolSize: t?.authPool ?? 10,
    logger: t?.logger
  }), n = new Qt(r, { authProvider: e, logger: t?.logger }), s = await n.oidcAuth({
    ...t?.oidc,
    logger: t?.logger,
    onTokens: (o) => e.setCAT(o.access_token)
    // set CAT automatically
  });
  e.attachOIDC(s);
  const i = new zt(n, { authProvider: e, logger: t?.logger });
  return await i.loadMint(), { mint: n, auth: e, oidc: s, wallet: i };
}
export {
  Mt as AuthManager,
  Pt as CheckStateEnum,
  Yn as ConsoleLogger,
  ht as HttpResponseError,
  Me as KeyChain,
  xn as Keyset,
  se as MeltBuilder,
  ut as MeltQuoteState,
  Tn as MessageNode,
  En as MessageQueue,
  Qt as Mint,
  ne as MintBuilder,
  yt as MintInfo,
  Ot as MintOperationError,
  St as MintQuoteState,
  Ct as NetworkError,
  Ht as OIDCAuth,
  L as OutputData,
  Ie as P2PKBuilder,
  Nt as PaymentRequest,
  jn as PaymentRequestTransportType,
  Rn as ReceiveBuilder,
  Un as SendBuilder,
  Cn as WSConnection,
  zt as Wallet,
  Wn as WalletCounters,
  $n as WalletEvents,
  Kn as WalletOps,
  ms as bigIntStringify,
  ft as blindMessage,
  Q as bytesToNumber,
  ks as checkResponse,
  un as constructProofFromPromise,
  As as createAuthWallet,
  cs as createBlindSignature,
  ps as createDLEQProof,
  ds as createNewMintKeys,
  es as createP2PKsecret,
  us as createRandomBlindedMessage,
  we as createRandomSecretKey,
  _s as decodePaymentRequest,
  Zt as deepEqual,
  gn as deriveBlindingFactor,
  Wt as deriveKeysetId,
  pn as deriveSecret,
  ls as deserializeMintKeys,
  hs as deserializeProof,
  An as getDecodedToken,
  vs as getDecodedTokenBinary,
  ys as getEncodedToken,
  Ps as getEncodedTokenBinary,
  Pn as getEncodedTokenV3,
  vn as getEncodedTokenV4,
  _n as getKeepAmounts,
  be as getKeysetAmounts,
  an as getKeysetIdInt,
  Rt as getP2PKExpectedKWitnessPubkeys,
  ge as getP2PKLocktime,
  nn as getP2PKNSigs,
  ss as getP2PKSigFlag,
  tn as getP2PKWitnessPubkeys,
  en as getP2PKWitnessRefundkeys,
  Ft as getP2PKWitnessSignatures,
  dn as getPubKeyFromPrivKey,
  me as getSignedOutput,
  os as getSignedOutputs,
  Sn as handleTokens,
  Pe as hasCorrespondingKey,
  $t as hasNonHexId,
  ns as hasP2PKSignedProof,
  Ee as hasValidDleq,
  dt as hashToCurve,
  ye as hash_e,
  Lt as hexToNumber,
  ts as injectWebSocketImpl,
  M as isObj,
  Et as isValidHex,
  j as joinUrls,
  bt as mergeUInt8Arrays,
  bn as numberToHexPadded64,
  V as parseP2PKSecret,
  as as pointFromBytes,
  rt as pointFromHex,
  Te as sanitizeUrl,
  qn as selectProofsRGLI,
  ln as serializeMintKeys,
  hn as serializeProof,
  Zn as setGlobalRequestOptions,
  Ze as signBlindedMessage,
  kn as signMintQuote,
  rn as signP2PKProof,
  sn as signP2PKProofs,
  Ye as signP2PKSecret,
  ws as sortProofsById,
  G as splitAmount,
  jt as stripDleq,
  tt as sumProofs,
  cn as unblindSignature,
  yn as verifyDLEQProof,
  wn as verifyDLEQProof_reblind,
  bs as verifyKeysetId,
  gs as verifyMintQuoteSignature,
  Ut as verifyP2PKSecretSignature,
  rs as verifyP2PKSig,
  is as verifyP2PKSigOutput,
  fs as verifyProof
};
//# sourceMappingURL=cashu-ts.es.js.map
