# Rahat Relay | Mission evidence

This page tests whether Saudi terrain reproduces a specific geometric line-of-sight obstruction pattern. The answer depends on the route. It supports planning a communications **field trial**. Fresnel clearance, diffraction, atmospheric refraction, antenna patterns, radio link budget, traversability and site access need their own study.

## Run and reproduce

Run these commands from the project directory with Node.js 20 or newer. The production site is static and has no runtime installation in the browser.

```powershell
npm run build
npm run preview
npm test
node mission/recalculate.mjs
```

Open [the mission](http://localhost:4173/mission/). English is also available at `/mission/?lang=en`. The server prints the active IPv4 addresses. On the same Wi-Fi, use the address of the active Wi-Fi adapter with port 4173. If Windows shows a firewall prompt, grant private-network access for the local server only. Some guest networks isolate devices.

`npm test` checks flat terrain and curvature, a known ridge, missing elevation, failure of either relay hop, and exact regeneration of [all results](../data/mission/results.json). The browser recomputes route states and nominal results using the same engine as the generator. The [protocol](../data/mission/protocol.json) records both routes, input hashes and all numerical settings. The recorded protocol precedes scoring in branch commit `58b9248`.

## Type and assets

The mission uses original system-installed Thmanyah Sans Regular, Medium and Bold, and Thmanyah Serif Display Medium where available. Install the original fonts from the team’s archive on the presentation PC and restart the browser. The static bundle ships no copies of the font files. [Thmanyah licensing](https://font.thmanyah.com/). Team lockup by Tuwaiq Space. three.js r160 and OrbitControls are distributed under the [three.js MIT license](https://github.com/mrdoob/three.js/blob/r160/LICENSE).

## Elevation data

Each analysis window is 8.4 × 8.4 km. Window offsets, crop registrations and source hashes are in the [protocol](../data/mission/protocol.json) and [raw source manifest](../data/mission/original-sources.json). Original GeoTIFFs were cached locally. To reconstruct a crop, use the listed source and CRS, place the upper-left grid node at the protocol west/north and draw the raster pixel corner half a step west and north of that node. Reproject with bilinear interpolation to an n × n raster at the listed spacing, retaining a validity mask, and quantize relative to the listed origin. Use the shipped grids and input hashes for exact reproduction of the reported numbers. The site serves compact elevations only.

| Analysis site | Elevation source | Source → analysis grid |
| --- | --- | --- |
| Al Labah, Al Anahi and Rahat axis | NASA SRTMGL1 v003, OpenTopography tile N24E039, projected onto WGS 84 / UTM 37N | 1 arcsecond (~30 m) → 30 m |
| Nobile Rim, lunar south pole | NASA Goddard LRO / LOLA Site06, lunar south polar stereographic | 5 m → 5 m |
| Jezero Crater | USGS / NASA JPL Mars 2020 CTX DEM, Jezero equirectangular projection | 20 m → 20 m |

[SRTMGL1 in NASA Earthdata](https://doi.org/10.5067/MEaSUREs/SRTM/SRTMGL1.003) · [NASA LRO / LOLA archive](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) · [LOLA Site06 product](https://pgda.gsfc.nasa.gov/products/78) · [USGS Jezero CTX product](https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic)

Each grid uses little-endian unsigned 16-bit integers, each at 0.1 m above its own elevation origin. Code 65535 marks missing data. The centimeter digits in the candidate coordinate describe its location on the grid and do not express positional accuracy. The apparent slope on the 3D map is vertically exaggerated 1.25×. Analysis uses the unexaggerated grid.

## Matched experiment

- The primary route is the atlas route transferred in local grid coordinates. The second route reflects it north–south and was fixed before scoring. Both use a 7,847.25 m polyline, 262 equal-length intervals and their midpoints, with ~29.95 m between samples. The projected distances are in the local map plane. Neither route follows the real Ingenuity trajectory or implies a drivable route.
- Nominal antenna heights above terrain for base, rover and relay are 6 m, 2 m and 8 m. The low case uses 4 m, 1.5 m and 6 m. The high case uses 8 m, 3 m and 10 m. Earth, lunar and Martian radii are 6,371,000 m, 1,737,400 m and 3,396,190 m.
- The engine evaluates minimum clearance over the bilinear elevation profile and subtracts the spherical curvature term from the ray. Clearance must be strictly positive. Missing elevation makes an affected ray unknown. A known blocked hop prevents a two-hop connection. A valid direct link or two clear relay hops establish geometric coverage. Unknown intervals are counted separately and interrupt a run of known blocked intervals.
- Compare blocked share (of the full route), longest contiguous blocked span (sum of its intervals) and the lowest valid direct clearance (m). Thresholds fixed for this experiment are 15 percentage points, 750 m and 35 m. They are engineering screening thresholds. The closest site minimizes the largest deviation divided by its corresponding threshold. A passing comparison must meet all three limits and have full route data.
- For the common 60 m grid, the script averages valid native node footprints within the target footprint, using their overlap as weights. If any contributing source node is missing, the target node is missing. The 60 m comparison reduces the effect of unlike horizontal spacing. Vertical errors and unresolved terrain can still affect the result. These are two matched scenarios rather than a statistical validation of all routes or seasons.
- The station search checks 729 regularly spaced positions at 300 m increments (27 × 27). Candidates must have valid DEM coverage for the slope stencil, be at least 100 m from the base, have a clear nominal base link, and have slope ≤20°. The nominal objective uses the original one-grid-step central difference and maximizes route coverage, with closest-to-base tie break. The robust objective uses a fixed ±60 m central difference and requires a clear base link and acceptable slope on both grids under every height set, then minimizes the worst longest gap. Equal worst gaps prefer the shorter nominal gap, then better worst-case coverage. The “best–worst” range is over these six conditions and is not a confidence interval. Coordinates mark a candidate for field inspection.

## Route stress test

The [fixed-base route study](ROUTE-ROBUSTNESS.md) tests the analog decision across 11 orientations and measures relay performance on six withheld routes. The results below are the original per-route benchmarks.

## Results

Values below use the common 60 m grid and the nominal heights. See the mission comparison table for each sector in both grids and both routes. No intervals in the benchmark results were unknown.

| Case | Closest Saudi site | Blocked share (space / Earth) | Longest (m) | Minimum clearance (m) | Within limits |
| --- | --- | --- | --- | --- | --- |
| Nobile, primary | Al Anahi | 96.2% / 91.2% | 7,547.7 / 6,888.8 | −104.3 / −127.4 | Yes |
| Nobile, mirror | Rahat axis | 51.1% / 51.1% | 3,444.4 / 3,833.8 | −99.6 / −75.1 | Yes |
| Jezero, primary | Al Anahi | 98.5% / 91.2% | 7,727.4 / 6,888.8 | −39.0 / −127.4 | No |
| Jezero, mirror | Al Anahi | 88.2% / 78.6% | 6,918.8 / 5,660.8 | −28.2 / −112.5 | No |

The primary and mirror rankings and pass/fail findings agree at both resolutions in all four comparisons. For Jezero, Al Anahi remains the closest of the three tested sectors on either route, but the longest-gap and clearance differences are above the illustrated limits. For Nobile, the best Earth sector changes with the route.

On the **30 m Al Anahi primary grid**, the nominal longest gap falls from **6,918.8 m** to **2,246.4 m** (68% reduction, 4,672.4 m). Clear route coverage rises from **8.4%** to **53.8%** (+45.4 percentage points; 3,564.2 m gains line of sight). Both objectives select the same candidate, UTM 37N E 580,078.86 N 2,684,377.16. Across all six variants its longest gap ranges from **2,036.7 to 2,366.2 m** and its clear coverage from **50.0% to 63.0%**. This result describes the same Saudi test route when shown alongside either space case. [JPL historical account, Flight 52](https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-phones-home/).
