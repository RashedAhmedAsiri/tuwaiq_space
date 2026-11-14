# Rahat Relay

**Tuwaiq SPACE · NASA Space Apps Challenge**

Rahat Relay is a full-screen 3D map that shows where terrain cuts a rover's radio link to its base, and where one relay station brings the link back. It uses real open elevation data from three places:

| Site | Elevation | Imagery |
|---|---|---|
| Harrat Rahat, near Madinah | Copernicus GLO-30 (30 m) | Sentinel-2 L2A, 8 Nov 2025 |
| Shackleton crater rim, Moon south pole | LRO LOLA laser shots, gridded at 20 m (8 km window, 3.5 km of relief) | Shaded from the elevation model, sun 7° above the horizon |
| Jezero crater, Mars | HiRISE DTM (1 m) | HiRISE ortho image |

## What you can do

- **Ingenuity story**: replay the 63 days in 2023 when a hill blocked the link between Ingenuity and Perseverance, on the real Jezero terrain. Click the ground to place a relay and see how many days it would have saved.
- **Presentation**: the team's slide deck, with arrow keys, swipe and a PDF download.
- **Map**: drive the rover along a 3 km route. The line of sight turns purple where the ground blocks it. Raise the base antenna from 2 to 10 m, place a relay yourself, then compare your spot with the best one the computer finds.

The page is in Arabic by default, with an English toggle.

## How the line of sight is computed

1. Cut a window of the elevation model around the base and resample it to a 512 × 512 grid.
2. Lower every point by the planet's curvature from the base (r² / 2R), so the radio line becomes a straight line. R is 6371 km for Earth, 1737.4 km for the Moon and 3396.19 km for Mars.
3. Walk the line from the base antenna to the rover every half grid cell. If the ground rises above it, that point is blocked.
4. Try over 1,300 relay positions and keep the one that can see the base and restores the largest part of the route.

This is geometric line of sight only. It does not model Fresnel zones, diffraction or transmit power. The Ingenuity and Perseverance positions are illustrative, and the dates and numbers come from JPL.

## Run it locally

The page loads its data with `fetch`, so it needs a local web server rather than opening the file directly:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

It also works on GitHub Pages: in **Settings → Pages**, choose **Deploy from a branch**, then `main` and `/ (root)`.

## Files

- `index.html`: the whole app (layout, line-of-sight engine, 3D view)
- `vendor.js`: three.js r160 with OrbitControls and Line2, bundled so the page doesn't depend on a CDN (MIT License)
- `data/*_h.txt`: 512 × 512 elevation grids, as base64 Uint16
- `data/*_tex.jpg`: 2048 × 2048 surface textures
- `deck/`: the presentation slides (JPG) and PDF
- `logo.png`, `logo_full.png`: the Tuwaiq SPACE logo

## Sources

- Copernicus DEM GLO-30 and Sentinel-2 L2A, from the AWS Open Data registry
- LRO LOLA RDR, NASA / GSFC
- HiRISE DTEEC_045994_1985_046060_1985 and ESP_045994_1985_RED, NASA / JPL / University of Arizona
- [NASA's Ingenuity Mars Helicopter Phones Home](https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-phones-home/), JPL, 30 June 2023
