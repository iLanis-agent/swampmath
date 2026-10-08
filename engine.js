/* swampmath engine - evaporative (swamp) cooler truth-teller.
   Pure functions, shared by browser and node test runner.
   Published anchors: August-Roche-Magnus dew point (b=17.62, c=243.12 C);
   Stull (2011) wet-bulb approximation (valid RH 5-99%, T -20..50 C);
   direct evaporative saturation effectiveness ~70-85% typical for rigid media (published range);
   humidity ratio W = 0.622 p/(P-p) at P=101.325 kPa (sea level assumed, labeled). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Swamp = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const B = 17.62, C = 243.12, P_ATM = 101.325; // kPa, sea level

  // Magnus: saturation vapor pressure (kPa) over water
  const psat = t => 0.61094 * Math.exp(B * t / (C + t));

  function dewPoint(t, rh) {
    const g = Math.log(rh / 100) + B * t / (C + t);
    return C * g / (B - g);
  }

  // Stull 2011 wet-bulb approximation (deg C, RH in %)
  function wetBulb(t, rh) {
    const at = x => Math.atan(x);
    return t * at(0.151977 * Math.sqrt(rh + 8.313659)) + at(t + rh) - at(rh - 1.676331)
      + 0.00391838 * Math.pow(rh, 1.5) * at(0.023101 * rh) - 4.686035;
  }

  const humidityRatio = td => { const p = psat(td); return 0.622 * p / (P_ATM - p); }; // kg/kg dry air

  // Direct evaporative cooling rides a constant wet-bulb line: find RH at tOut with the same wet bulb.
  function rhAtWetBulb(t, twTarget) {
    if (t <= twTarget) return 100;
    let lo = 0.1, hi = 100;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (wetBulb(t, mid) < twTarget) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function cooler(t, rh, effectiveness) {
    const td = dewPoint(t, rh);
    const tw = wetBulb(t, rh);
    const depression = t - tw; // the ceiling on what evaporation can do
    const drop = depression * (effectiveness / 100);
    const supplyT = t - drop;
    const supplyRH = rhAtWetBulb(supplyT, tw);
    let verdict, band;
    if (depression >= 11) { verdict = 'Swamp cooler territory'; band = 'great'; }
    else if (depression >= 6) { verdict = 'Marginal - takes the edge off only'; band = 'warn'; }
    else { verdict = 'Do not buy one - fan or AC territory'; band = 'bad'; }
    return { td, tw, depression, drop, supplyT, supplyRH, effectiveness, verdict, band,
             humidityRatio: humidityRatio(td) };
  }

  const cToF = c => c * 9 / 5 + 32;
  const fmt = (x, dp) => x.toFixed(dp == null ? 1 : dp);

  return { B, C, P_ATM, psat, dewPoint, wetBulb, humidityRatio, rhAtWetBulb, cooler, cToF, fmt };
});
