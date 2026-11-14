# Rahat Atlas · أطلس رهط

**Tuwaiq Space · NASA Space Apps Challenge 2026 · Jeddah**

Rahat Atlas is a full-screen 3D site. It compares terrain in Harrat Rahat with sites on the Moon and Mars, then tests how terrain blocks the line of sight between antennas. Everything runs from files in this repository, with no outside requests.

| Site | Elevation model | Surface |
|---|---|---|
| Harrat Rahat, three 8.4 km sectors (Al Labah, Al Anahi, southern vent axis) | NASA SRTM GL1 v003, about 30 m | Sentinel-2 L2A, 8 Nov 2025 |
| Nobile Rim 1, lunar south pole | NASA LRO / LOLA Site06, 5 m (shown on a 20 m grid) | Shaded from the elevation model |
| Jezero Crater, Mars | USGS / NASA JPL Mars 2020 CTX DEM, 20 m | Shaded from the elevation model |

## Tabs

- **Mission**: Earth, Harrat Rahat, Nobile Rim 1, Jezero, then Flight 52. Ingenuity flies the published path on the Jezero terrain with the NASA models of Ingenuity and Perseverance, and the line of sight is tested from the elevation grid as they move. The recovery position is estimated from the terrain.
- **Terrain Lab**: surface, relative elevation, slope and roughness for each site, a split view to compare two sites at the same scale, and an elevation profile between two points.
- **Rover Simulation**: drive the rover along a 7.85 km route in the southern vent axis. Place a relay, search the 729 candidate locations, or remove it.
- **Results**: 22.1% direct, 93.1% with the best tested relay. Route samples with line of sight rise from 58 to 244 of 262.
- **Presentation Mode**: step through the scenes by hand, reset the experiment, and open the slides.

The page is in Arabic by default, with an English toggle.

## Method

- Comparison windows are 8.4 × 8.4 km. The primary comparison uses a 70 m grid, rechecked at 50 and 100 m.
- Antennas: base 6 m, rover 2 m, relay 8 m. Planetary curvature is included.
- A route sample is covered when it has a direct line of sight, or when both relay links are clear.
- This is geometric line of sight only. Radio performance needs separate testing.

## Run it locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

- `index.html`: the whole app
- `vendor.js`: three.js r160 with OrbitControls, Line2, GLTFLoader and DRACOLoader (MIT License)
- `data/*.txt`: elevation grids, gzip-compressed Uint16 at 0.1 m above each grid's base, stored as base64
- `data/atlas.json`: site metadata, comparison scores and the relay experiment
- `data/*_tex.jpg`: surface textures
- `flight52/`: Flight 52 record, terrain, NASA models (base64 GLB) and the Draco decoder
- `deck/`: the presentation slides and PDF
- `licenses/`: third-party licenses

## Sources

- SRTM GL1: https://portal.opentopography.org/raster?opentopoID=OTSRTM.082016.4326.1
- LOLA Site06: https://pgda.gsfc.nasa.gov/products/78
- Mars 2020 CTX DEM: https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic
- Sentinel-2 L2A: AWS Open Data registry
- Flight 52: NASA MMGIS mission map and [NASA's Ingenuity Mars Helicopter Phones Home](https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-phones-home/), JPL
- Geologic map of Harrat Rahat: https://doi.org/10.3133/sim3428
