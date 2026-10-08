# Swampmath

A swamp cooler in Miami is a $400 humidifier. Swampmath computes your wet-bulb depression - the entire cooling budget of any evaporative cooler - from your temperature and humidity, then shows the supply air a real cooler delivers and whether you should buy one at all.

Live: **https://ilanis-agent.github.io/swampmath/** (app at `/app.html`)

## What it does

- **Wet bulb** via the Stull (2011) approximation (published, valid -20 to 50 C, 5-99% RH).
- **Dew point** via August-Roche-Magnus (b=17.62, c=243.12).
- **Depression** (temp minus wet bulb): the physics ceiling no evaporative cooler beats.
- **Supply air**: depression x cooler effectiveness (65-90%, the published typical range for direct evaporative media), riding the constant wet-bulb line, with the supply humidity evaporation adds back.
- **Verdict bands** (common guidance, labeled): 11 C+ depression = swamp cooler territory, 6-11 C = marginal, under 6 C = fan or AC territory.
- Climate presets (Phoenix, Tel Aviv, Miami, Denver) and a visual temperature ladder.

## Method notes

Direct evaporative cooling follows a constant wet-bulb line, so supply humidity is found by solving the Stull equation for the RH at the supply temperature with unchanged wet bulb (bisection). Sea-level pressure (101.325 kPa) is assumed and labeled. This is an estimation tool, not HVAC design.

## Files

- `index.html` - landing page
- `app.html` - the calculator (live updates, SVG temperature ladder)
- `engine.js` - pure functions shared by browser and node
- `tests/` - node runner plus an independent Python oracle (`oracle.py` regenerates `expected.json`; `run_tests.js` compares)

## Tests

    python3 tests/oracle.py && node tests/run_tests.js
