#!/usr/bin/env python3
"""Independent oracle for swampmath. Recomputes every case from the published
formulas (no shared code with engine.js) and writes expected.json."""
import json, math

B, C, P = 17.62, 243.12, 101.325

def psat(t):
    return 0.61094 * math.exp(B * t / (C + t))

def dew_point(t, rh):
    g = math.log(rh / 100.0) + B * t / (C + t)
    return C * g / (B - g)

def wet_bulb(t, rh):
    at = math.atan
    return (t * at(0.151977 * math.sqrt(rh + 8.313659)) + at(t + rh) - at(rh - 1.676331)
            + 0.00391838 * rh ** 1.5 * at(0.023101 * rh) - 4.686035)

def rh_at_wet_bulb(t, tw_target):
    if t <= tw_target:
        return 100.0
    lo, hi = 0.1, 100.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if wet_bulb(t, mid) < tw_target: lo = mid
        else: hi = mid
    return (lo + hi) / 2

def cooler(t, rh, eff):
    td = dew_point(t, rh)
    tw = wet_bulb(t, rh)
    dep = t - tw
    drop = dep * eff / 100.0
    supply = t - drop
    return {'td': td, 'tw': tw, 'depression': dep, 'drop': drop,
            'supplyT': supply, 'supplyRH': rh_at_wet_bulb(supply, tw),
            'humidityRatio': 0.622 * psat(td) / (P - psat(td))}

cases = []
grid_t = [-10, 5, 20, 25, 35, 45]
grid_rh = [5, 20, 50, 80, 99]
for t in grid_t:
    for rh in grid_rh:
        for eff in [65, 80, 90]:
            cases.append({'kind': 'cooler', 't': t, 'rh': rh, 'eff': eff, 'expected': cooler(t, rh, eff)})

# vapor pressure / dew point round trips
for t in [5, 15, 25, 35]:
    for rh in [10, 40, 75]:
        td = dew_point(t, rh)
        p_vapor = rh / 100.0 * psat(t)
        cases.append({'kind': 'roundtrip', 't': t, 'rh': rh,
                      'expected': {'td': td, 'psatAtTd': psat(td), 'pVapor': p_vapor}})

with open('expected.json', 'w') as f:
    json.dump({'cases': cases}, f, separators=(',', ':'))
print(f'{len(cases)} cases written')
