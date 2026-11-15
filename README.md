# Rahat Relay

**Tuwaiq SPACE · NASA Space Apps Challenge**

Rahat Relay is a full-screen 3D map that shows where terrain cuts a rover's radio link to its base, and where one relay station brings it back.

| Site | Elevation | Surface |
|---|---|---|
| Harrat Rahat, southern vent axis (8.4 km window) | NASA SRTM GL1 v003, about 30 m | Sentinel-2 L2A, 8 Nov 2025 |
| Nobile Rim 1, lunar south pole | NASA LRO / LOLA Site06, 5 m (shown on a 20 m grid) | Shaded from the elevation model |
| Jezero Crater, Mars | USGS / NASA JPL CTX DEM, 20 m | Shaded from the elevation model |
| Ingenuity story, Jezero delta front | HiRISE DTM, 1 m | HiRISE ortho image |

## Research question

Can a particular Saudi rover test reproduce the geometry of a Moon or Mars communications outage, and does a relay selected on known routes help on new routes from the same base?

Across 11 fixed-base route directions, Al Anahi matches Nobile on five directions at both grid resolutions; the Rahat axis matches Jezero on one. In Al Anahi, the training-selected relay cuts the worst longest blocked segment on six held-out directions from **7.49 km to 4.70 km**. Al Labah's own relay reduces that sector's worst gap further, but Al Labah did not match either space site under the fixed limits. In the axis sector, the multi-route optimizer improves its training result and loses to the primary-route relay in validation. See the [protocol, per-sector decisions and limitations](mission/ROUTE-ROBUSTNESS.md).

## Judging mission

The bilingual mission (the **Interactive mission** tab, https://rashedahmedasiri.github.io/tuwaiq_space/#mission) uses the same local terrain archive and adds route-matched comparison of Nobile Rim and Jezero, a verification route, a relay sensitivity comparison, and inspectable line-of-sight profiles. See [the mission method](mission/README.md) to reproduce the results.

On the Al Anahi primary route (30 m grid, antennas 6 / 2 / 8 m), one relay cuts the longest blocked span from **6,918.8 m to 2,246.4 m** and raises the clear share of the route from **8.4% to 53.8%**. Across six height and grid assumptions the longest gap stays between 2,036.7 and 2,366.2 m.

## Tabs

- **Ingenuity story**: replay the 63 days in 2023 when a hill blocked the link between Ingenuity and Perseverance. The positions are illustrative; the dates and numbers come from JPL.
- **Map**: a free exploration of the Rahat axis sector. Drive the rover, raise the base antenna, place a relay, then compare your spot with the best of 729 candidates. Its numbers change with your choices.
- **Interactive mission**: the judging mission with the matched-route results, inside the site (code in [mission/](mission/)).
- **Results**: the before-relay comparison, the relay result in Al Anahi and the 11-direction stress test.
- **Presentation**: the team's 7-slide competition deck. Slides animate in, full screen fills the display, and presentation clickers work (PageDown/PageUp, arrows, Space, Enter, B or period to blank, F5 to start). PDF download included.
- **Sources**: every dataset with its link, plus the method.

The page is in Arabic by default, with an English toggle.

## Method

- Antennas: base 6 m (adjustable), rover 2 m, relay 8 m. Planetary curvature is included.
- A route sample is covered when it has a direct line of sight, or when both relay links are clear.
- Relay candidates: a 27 × 27 grid over the window, kept only if the slope is under 20° and the spot sees the base.
- This is geometric line of sight only. Radio performance needs separate testing.

## Run it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
npm test   # Node.js 20+: engine tests and exact regeneration of the results
```

## Files

- `index.html`: the whole app
- `logo_loader.svg`: the animated TS logo shown while the site loads and on the 404 page (a still logo with reduced motion)
- `404.html`: the not-found page
- `vendor.js`: three.js r160 with OrbitControls and Line2 (MIT License)
- `data/axis.txt`, `nobile.txt`, `jezero.txt`: elevation grids, gzip-compressed Uint16 at 0.1 m above each grid's base, stored as base64
- `data/atlas.json`: site metadata and the relay experiment
- `data/mission/`: the mission protocol, compact grids for Al Labah, Al Anahi and Nobile (5 m), and all computed results
- `mission/`: the mission page and the line-of-sight engine; `npm test` checks it and reproduces every result
- `data/mars_h.txt`: the HiRISE grid for the Ingenuity story
- `data/*_tex.jpg`: surface textures
- `deck/`: the presentation slides as images (`s-*` full slides, `b-*` backgrounds that the Presentation tab builds each slide on)
- `submission/`: the competition deck as PDF and PPTX

## Licenses

This project's code is released under the [Apache License 2.0](LICENSE). The data and libraries it uses keep their own licenses:

| Item | Use | License |
|---|---|---|
| NASA SRTM GL1 v003 | Harrat Rahat elevation | Public domain (NASA), no reuse restrictions |
| Sentinel-2 L2A | Harrat Rahat image | Free and open Copernicus data. Contains modified Copernicus Sentinel data 2025 |
| NASA LRO / LOLA Site06 | Nobile Rim 1 elevation | Public domain (NASA GSFC) |
| USGS / NASA JPL Mars 2020 CTX DEM | Jezero elevation | Public domain (USGS / NASA) |
| HiRISE DTM and ortho image | Ingenuity story terrain | Free to use with credit: NASA/JPL/University of Arizona |
| NASA JPL Flight 52 release | Story dates and numbers | NASA/JPL image use policy, free with credit |
| USGS geologic map of Harrat Rahat (SIM 3428) | Geologic context | Public domain (USGS) |
| three.js r160 (in `vendor.js`) | 3D engine | MIT |
| IBM Plex Sans Arabic | The site's font, from Google Fonts | SIL Open Font License 1.1 |
| Tuwaiq SPACE logo | Team identity | Owned by the team |

No item has an unclear license. The Moon and Mars surfaces on the map are shaded from the elevation models themselves.

## Sources

- SRTM GL1: https://portal.opentopography.org/raster?opentopoID=OTSRTM.082016.4326.1
- LOLA Site06: https://pgda.gsfc.nasa.gov/products/78
- Mars 2020 CTX DEM: https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic
- Sentinel-2 L2A: https://registry.opendata.aws/sentinel-2-l2a-cogs/
- HiRISE DTEEC_045994_1985_046060_1985, NASA / JPL / University of Arizona
- [NASA's Ingenuity Mars Helicopter Phones Home](https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-phones-home/), JPL
- Geologic map of Harrat Rahat: https://doi.org/10.3133/sim3428
