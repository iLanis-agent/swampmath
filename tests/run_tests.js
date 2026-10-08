#!/usr/bin/env node
/* Compares engine.js against the independent Python oracle (expected.json),
   plus property and published-anchor checks. */
const S = require('../engine.js');
const exp = require('./expected.json');
let pass = 0, fail = 0;
const T = (name, cond) => { if (cond) pass++; else { fail++; console.error('FAIL', name); } };
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9) * Math.max(1, Math.abs(b));

for (const c of exp.cases) {
  if (c.kind === 'cooler') {
    const r = S.cooler(c.t, c.rh, c.eff);
    T(`cooler Td ${c.t}/${c.rh}`, near(r.td, c.expected.td, 1e-12));
    T('cooler Tw', near(r.tw, c.expected.tw, 1e-12));
    T('cooler depression', near(r.depression, c.expected.depression, 1e-12));
    T('cooler drop', near(r.drop, c.expected.drop, 1e-12));
    T('cooler supplyT', near(r.supplyT, c.expected.supplyT, 1e-12));
    T('cooler supplyRH', near(r.supplyRH, c.expected.supplyRH, 1e-10));
    T('cooler W', near(r.humidityRatio, c.expected.humidityRatio, 1e-12));
  } else if (c.kind === 'roundtrip') {
    const td = S.dewPoint(c.t, c.rh);
    T(`roundtrip Td ${c.t}/${c.rh}`, near(td, c.expected.td, 1e-12));
    T('roundtrip psat(Td)=pVapor', near(S.psat(td), c.expected.pVapor, 1e-9));
  }
}

// --- published anchors (meteorology reference values, tolerance ~0.3 C) ---
T('anchor: 25C/50% Td ~ 13.9', near(S.dewPoint(25, 50), 13.9, 0.02));
T('anchor: 30C/60% Td ~ 21.4', near(S.dewPoint(30, 60), 21.4, 0.02));
T('anchor: 25C/50% Tw ~ 18.0', near(S.wetBulb(25, 50), 18.0, 0.02));
T('anchor: 35C/20% Tw ~ 19.3', near(S.wetBulb(35, 20), 19.3, 0.02));
T('anchor: 40C/10% Tw ~ 18.5', near(S.wetBulb(40, 10), 18.5, 0.02));
T('anchor: 0C/100% Tw ~ 0 (Stull boundary error ~0.13)', near(S.wetBulb(0, 100), 0, 0.2));
T('anchor: psat(0C) = 0.611 kPa', near(S.psat(0), 0.61094, 1e-8));
T('anchor: psat(20C) ~ 2.339 kPa (meteorological range)', near(S.psat(20), 2.339, 0.01));

// --- properties ---
const rng = (() => { let s = 7; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();
for (let i = 0; i < 80; i++) {
  const t = -10 + rng() * 55, rh = 5 + rng() * 94, eff = 50 + rng() * 45;
  const c = S.cooler(t, rh, eff);
  T('prop: Td <= Tw <= T', c.td <= c.tw + 1e-9 && c.tw <= t + 1e-9);
  T('prop: depression >= 0', c.depression >= -1e-9);
  T('prop: supply between Tw and T', c.supplyT >= c.tw - 1e-9 && c.supplyT <= t + 1e-9);
  T('prop: supply RH >= inlet RH when cooled', c.supplyT < t - 1e-6 ? c.supplyRH > rh : true);
  T('prop: supply RH <= 100', c.supplyRH <= 100.0001);
  T('prop: 100% eff hits wet bulb', near(S.cooler(t, rh, 100).supplyT, S.wetBulb(t, rh), 1e-9));
}
for (let i = 0; i < 40; i++) {
  const t = 5 + rng() * 40, rh1 = 5 + rng() * 90, rh2 = 5 + rng() * 90;
  const lo = Math.min(rh1, rh2), hi = Math.max(rh1, rh2);
  T('prop: wet bulb rises with RH', S.wetBulb(t, hi) >= S.wetBulb(t, lo) - 1e-9);
  T('prop: dew point rises with RH', S.dewPoint(t, hi) >= S.dewPoint(t, lo) - 1e-9);
}
T('prop: saturated air: Td = Tw = T', near(S.dewPoint(20, 100), 20, 1e-6) && near(S.wetBulb(20, 100), 20, 0.01));
T('prop: cToF round trip', near(S.cToF(100), 212) && near(S.cToF(0), 32));
T('prop: verdict bands', S.cooler(40, 10, 80).band === 'great' && S.cooler(30, 60, 80).band === 'warn' && S.cooler(32, 80, 80).band === 'bad');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
