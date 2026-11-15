# Sources and asset credits

## Data used in the geometric line-of-sight calculations

| Input | Source and rights reference | How Rahat Relay uses it |
| --- | --- | --- |
| Earth elevation, tile N24E039 | NASA JPL, SRTM Global 1 arc second V003. [NASA Earthdata DOI](https://doi.org/10.5067/MEaSUREs/SRTM/SRTMGL1.003) and [OpenTopography distribution](https://portal.opentopography.org/raster?opentopoID=OTSRTM.082016.4326.1). | Crops for Al Anahi, Al Labah and the Rahat axis, processed onto 30 m projected grids. Used for ray tracing, slope limits and relay selection. |
| Lunar elevation, LOLA Site06 | NASA GSFC planetary geodesy archive, derived from NASA Lunar Reconnaissance Orbiter (LRO) laser altimetry. [Product 78](https://pgda.gsfc.nasa.gov/products/78), [Barker et al. 2021](https://doi.org/10.1016/j.pss.2020.105119) and the [challenge Resources tab](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/?tab=resources). | Native 5 m grid spacing for the Nobile window. The model interpolates between laser measurements. The spacing does not specify vertical accuracy or independent measurements at each pixel. Used in the lunar comparison and render. |
| Mars elevation, Science Investigation CTX DEM Mosaic | USGS Astrogeology and NASA / JPL Mars 2020 data, CTX on NASA Mars Reconnaissance Orbiter. [USGS product](https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic) and [USGS copyright and credits policy](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits). | 20 m grid for the Jezero window. Used in the Mars comparison and render. |
| Ingenuity Flight 52 facts | [NASA/JPL-Caltech mission report](https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-phones-home/). | Narrative context. The engineering routes in the project represent test scenarios. The report is cited as a source of facts. |

Exact source URLs, coordinates, checksums and analysis settings are recorded in the [source manifest](../data/mission/original-sources.json), [per-site protocol](../data/mission/protocol.json) and [rotation protocol](../data/mission/route-sweep.json).

## Visual assets, code and fonts in the judging build

- The Tuwaiq Space team wordmark comes from the project owner and appears in the mission and five-slide demo. It identifies the team. Confirm the team's authority to include its mark in the official submission.
- The terrain is drawn from the documented elevation grids using Three.js, local colors, lighting and computed geometry. The mission package and five-slide demo contain no separate stock imagery, NASA/JPL logos, participant portraits, music or video. The logo file represents the Tuwaiq Space identity. [NASA media policy](https://www.nasa.gov/nasa-brand-center/images-and-media/) · [JPL image policy](https://www.jpl.nasa.gov/jpl-image-use-policy/)
- Original project code uses [Apache 2.0](../LICENSE). Three.js r160 and OrbitControls are distributed under [the bundled MIT notice](../THIRD-PARTY-THREE-LICENSE.txt) and the [upstream license](https://github.com/mrdoob/three.js/blob/r160/LICENSE).
- Thmanyah Sans and Serif Display are used via local font lookup where installed. The package distributes no Thmanyah font binaries and falls back to installed system fonts. [Thmanyah license and downloads](https://font.thmanyah.com/)
