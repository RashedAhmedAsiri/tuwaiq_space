# Rahat Relay

**Tuwaiq SPACE · NASA Space Apps Challenge**

Rahat Relay is a full-screen 3D map that shows where terrain cuts a rover's radio link to its base, and where one relay station brings it back.

| Site | Elevation | Surface |
|---|---|---|
| Harrat Rahat, southern vent axis (8.4 km window) | NASA SRTM GL1 v003, about 30 m | Sentinel-2 L2A, 8 Nov 2025 |
| Nobile Rim 1, lunar south pole | NASA LRO / LOLA Site06, 5 m (shown on a 20 m grid) | Shaded from the elevation model |
| Jezero Crater, Mars | USGS / NASA JPL CTX DEM, 20 m | Shaded from the elevation model |
| Ingenuity story, Jezero delta front | HiRISE DTM, 1 m | HiRISE ortho image |

## Tabs

- **Ingenuity story**: replay the 63 days in 2023 when a hill blocked the link between Ingenuity and Perseverance. The positions are illustrative; the dates and numbers come from JPL.
- **Map**: drive the rover along the route, raise the base antenna, place a relay, then compare your spot with the best of 729 candidates. On Harrat Rahat the 7.85 km route has 262 samples: 22.1% see the base directly (58), and 93.1% are connected with the best relay (244).
- **Presentation**: the team's 7-slide competition deck, with full screen (button or F key), arrow keys, swipe and a PDF download.
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
```

## Files

- `index.html`: the whole app
- `vendor.js`: three.js r160 with OrbitControls and Line2 (MIT License)
- `data/axis.txt`, `nobile.txt`, `jezero.txt`: elevation grids, gzip-compressed Uint16 at 0.1 m above each grid's base, stored as base64
- `data/atlas.json`: site metadata and the relay experiment
- `data/mars_h.txt`: the HiRISE grid for the Ingenuity story
- `data/*_tex.jpg`: surface textures
- `deck/`: the presentation slides as images
- `submission/`: the competition deck as PDF and PPTX

## Sources

- SRTM GL1: https://portal.opentopography.org/raster?opentopoID=OTSRTM.082016.4326.1
- LOLA Site06: https://pgda.gsfc.nasa.gov/products/78
- Mars 2020 CTX DEM: https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic
- Sentinel-2 L2A: https://registry.opendata.aws/sentinel-2-l2a-cogs/
- HiRISE DTEEC_045994_1985_046060_1985, NASA / JPL / University of Arizona
- [NASA's Ingenuity Mars Helicopter Phones Home](https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-phones-home/), JPL
- Geologic map of Harrat Rahat: https://doi.org/10.3133/sim3428
