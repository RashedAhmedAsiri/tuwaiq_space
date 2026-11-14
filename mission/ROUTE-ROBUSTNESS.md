# Does the field decision transfer?

Rahat Relay tests terrain-induced geometric obstruction so a rover team can choose a field trial and measure relay performance. Choose the Earth sector and route direction by the intended obstruction, then evaluate a fixed relay on routes held out of the placement search. This separates the value of reproducing an outage from the ability to remove it.

## Route stability

Eleven equal-length rotations of the atlas route use the same start, vertices relative to one another, nominal antenna heights and sample count. They are scenario variations around a fixed base. The mirrored check route from the original analysis remains separate. [Protocol fixed before scoring](../data/mission/route-sweep.json), local commit ed24b8d.

| Saudi sector | Nobile matches, native / common | Jezero matches, native / common |
| --- | --- | --- |
| Al Anahi | 5/11 · 5/11 | 0/11 · 0/11 |
| Rahat axis | 0/11 · 0/11 | 1/11 · 1/11 |
| Al Labah | 0/11 · 0/11 | 0/11 · 0/11 |

At the reference thresholds (15 percentage points blocked, 750 m longest gap, 35 m clearance), native and 60 m common grids agree on every pass/fail result. Al Anahi matches Nobile for −60°, −45°, −30°, −15° and 0°. The axis sector matches Jezero only at +30°. Reducing all tolerances by 25% reduces the Al Anahi lunar count to three and removes the common-grid Jezero match. Increasing tolerances by 25% keeps Al Anahi at five and produces one common-grid Jezero match in each sector. Route direction and tolerance thus matter to the field decision. The angles are clockwise in projected east/south coordinates and are measured relative to the original polyline.

## Fixed-station validation

Each sector's optimization independently evaluates 729 grid positions. Five angles (−60°, −30°, 0°, +30°, +60°) go into selection. Candidates need a clear backhaul and a slope of at most 20° in the training model's grids and antenna cases. The objective minimizes the worst longest blocked stretch. The three antenna height triples and two elevation resolutions are defined in the original protocol. Six other angles produce 36 terrain/antenna scenarios. The selected relay stays fixed throughout those scenarios. The comparison station maximizes coverage at 0° on the native grid at nominal antenna heights and also stays fixed during validation.

| Sector | No relay, worst blocked gap (km) | Primary-route station (km) | Multi-route station (km) | Lowest clear share, multi-route |
| --- | ---: | ---: | ---: | ---: |
| Al Anahi | 7.49 | 4.70 | 4.70 | 21.8% |
| Rahat axis | 7.49 | 3.65 | 5.36 | 26.7% |
| Al Labah | 6.68 | 4.46 | 1.71 | 50.8% |

- **Nobile obstruction trial.** Prioritize Al Anahi in one of the five matching directions. Both objectives choose UTM 37N E 580,078.86 N 2,684,377.16. On the held-out routes the longest-gap worst case improves by 2.79 km (37.2%) against no relay, with a 4.70 km residual gap. The single-route and multi-route objectives converge here.
- **Jezero obstruction trial.** The +30° Rahat axis configuration is the sole match at the original thresholds. Treat this as a direction-specific result. In that sector the multi-route objective lowers the training worst case from 3.14 km to 2.46 km, but the stricter validation result is 5.36 km versus 3.65 km for the primary-route station. No general Mars analog or stronger multi-route placement is established by these data.
- **Relay engineering trial.** In Al Labah, multi-route selection reduces the held-out worst gap from 6.68 km to 1.71 km. Al Labah has no matching direction to either planetary site at the reference limits. Use its result to distinguish a favorable relay test from a demonstrated terrain-obstruction analogy.

## Reproduce

```sh
node mission/recalculate-sweep.mjs --check
```

The check recomputes [all per-angle measurements and station validation outcomes](../data/mission/route-sweep-results.json) from the local grids, including both native and 60 m resolutions. See [DEM sources and the geometric engine](README.md). The scenario counts are not occurrence probabilities. The withheld routes share a base, geometry and DEM with the training routes. Actual rover access, antenna siting, radio propagation, and out-of-region validation require fieldwork or additional data.
