// Headless harness for stair-shove: stubs browser APIs, drives the real game code.
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/tmp/stair-shove/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ---- browser stubs ----
const noopFn = new Proxy(function () {}, {
  get: () => noopFn,
  apply: () => noopFn,
});
const ctxStub = new Proxy({}, {
  get: (t, p) => (p in t ? t[p] : noopFn),
  set: (t, p, v) => { t[p] = v; return true; },
});
function makeEl() {
  return {
    style: {}, dataset: {}, innerHTML: '', textContent: '', value: '',
    width: 0, height: 0, clientWidth: 1280, clientHeight: 720,
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() { return arguments[0]; }, removeChild() {}, children: [],
    firstChild: { remove() {} }, remove() {},
    addEventListener() {}, removeEventListener() {},
    getContext() { return ctxStub; },
    blur() {}, focus() {}, onclick: null,
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    querySelectorAll() { return []; }, closest() { return null; }, contains() { return false; },
    replaceChildren() {},
  };
}
const els = {};
const sandbox = {
  console, Math, Date, JSON, Object, Array, Number, String, Boolean, RegExp, Map, Set,
  isNaN, parseInt, parseFloat, structuredClone,
  performance: { now: () => Date.now() },
  devicePixelRatio: 1,
  requestAnimationFrame() {},
  setTimeout() {}, setInterval() {},
  addEventListener() {}, removeEventListener() {},
  localStorage: {
    _s: {},
    getItem(k) { return this._s[k] ?? null; },
    setItem(k, v) { this._s[k] = String(v); },
    removeItem(k) { delete this._s[k]; },
  },
  document: {
    getElementById(id) { return els[id] || (els[id] = makeEl()); },
    createElement() { return makeEl(); },
    addEventListener() {},
    querySelectorAll() { return []; },
    body: makeEl(),
    activeElement: null,
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
vm.createContext(sandbox);

// hook exposing script-scoped let variables
const hook = `
;globalThis.__h={
 get S(){return S}, get R(){return R}, get mode(){return mode}, get D(){return D},
 get meter(){return meter}, get ST(){return ST}, get ZC(){return ZC}, set ZC(v){ZC=v},
 start, shove, step, again, build, calc, fmt, nDummies, fameGain, rebootNeed, endRun,
 get UP(){return UP}, get cost(){return cost}, get lv(){return lv}
};`;
vm.runInContext(script + hook, sandbox, { filename: 'game.js' });

const g = sandbox.__h;
g.start();

function runTrial(kDummies, meterV) {
  g.S.st.reboots = kDummies - 1;
  g.again();                       // calc(false), newZone(), build() -> k dummies
  g.ZC = 0.5;                      // pin the bullseye zone
  g.meter.v = meterV;              // fixed decent non-perfect shove
  const cashBefore = g.S.cash;
  g.shove();
  let guard = 0;
  while (g.mode !== 'result' && guard++ < 40000) g.step();
  const earned = g.S.cash - cashBefore;
  return { earned, frames: g.R.f, secs: g.R.f / 60, steps: g.R.step, dummies: g.D.length };
}

// batch runner with mean + std
function measure(k, n) {
  const rs = [];
  for (let i = 0; i < n; i++) rs.push(runTrial(k, 0.75));
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const earned = mean(rs.map(r => r.earned));
  const secs = mean(rs.map(r => r.secs));
  const perSec = mean(rs.map(r => r.earned / r.secs));
  const perFrame = mean(rs.map(r => r.earned / r.frames));
  return { k, earned, secs, perSec, perFrame, n };
}

const TRIALS = +process.env.TRIALS || 40;
const results = [];
for (let k = 1; k <= 10; k++) {
  results.push(measure(k, TRIALS));
  console.log(`k=${k}: $/run=${results[results.length-1].earned.toFixed(1)}  secs/run=${results[results.length-1].secs.toFixed(1)}  $/sec=${results[results.length-1].perSec.toFixed(2)}`);
}
console.log('\n// ratio of $/sec vs previous dummy count (E_dummy for reboot r = k->k+1):');
for (let i = 1; i < results.length; i++) {
  console.log(`reboot ${i} (${i}->${i+1} dummies): ${results[i].perSec / results[i-1].perSec}`);
}
console.log('\n// ratio of $/run vs previous:');
for (let i = 1; i < results.length; i++) {
  console.log(`reboot ${i}: ${results[i].earned / results[i-1].earned}`);
}
fs.writeFileSync('/tmp/stair-shove/sim/results.json', JSON.stringify(results, null, 2));
