# Sources and credits

Where every map, fact, photo and 3D model in ReStory comes from, and who made it. The per-object tables below are generated from `data/artifacts.json`, the same file the site loads, so they match what visitors see. Each photo also shows its author on the museum page (field `image_credit`).

Usage terms for NASA material: https://www.nasa.gov/nasa-brand-center/images-and-media/ (NASA content is generally not copyrighted in the United States; credit NASA and the named partners). The NASA logo and insignia are not used.

## Surface maps and background

| What | Source | Author / credit | Files |
|---|---|---|---|
| Moon map, 2k, 4k and 8k, from `lroc_color_poles_8k.tif` (2019), downscaled from one file so colours match | [NASA SVS, CGI Moon Kit](https://svs.gsfc.nasa.gov/4720) | NASA's Scientific Visualization Studio; data from the Lunar Reconnaissance Orbiter LROC WAC | `static/textures/moon_*.jpg` |
| Mars map, 2k, 4k and 8k: Viking MDIM 2.1 colour mosaic, 512 tiles of level 4 joined into 8192x4096 | [NASA Solar System Treks](https://trek.nasa.gov/mars/) | NASA/JPL/USGS (Viking Orbiter mosaic), served by NASA Solar System Treks | `static/textures/mars_*.jpg` |
| Earth map, layer `BlueMarble_NextGeneration` | [NASA GIBS](https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api) | NASA EOSDIS GIBS, Blue Marble Next Generation | `static/textures/earth_2k.jpg` |
| Mercury in the background, cropped to the planet edge, 512 px, black made transparent | [PIA15160](https://images.nasa.gov/details/PIA15160) | NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington (MESSENGER) | `static/textures/planets/mercury.png` |
| Venus in the background, cropped to the planet edge, 512 px, black made transparent | [PIA23791](https://images.nasa.gov/details/PIA23791) | NASA/JPL-Caltech (Mariner 10) | `static/textures/planets/venus.png` |
| Jupiter in the background, cropped to the planet edge, 512 px, black made transparent | [PIA02873](https://images.nasa.gov/details/PIA02873) | NASA/JPL/University of Arizona (Cassini) | `static/textures/planets/jupiter.png` |
| Saturn in the background, cropped to the planet edge, 512 px, black made transparent | [PIA06193](https://images.nasa.gov/details/PIA06193) | NASA/JPL/Space Science Institute (Cassini) | `static/textures/planets/saturn.png` |
| Uranus in the background, cropped to the planet edge, 512 px, black made transparent | [PIA18182](https://images.nasa.gov/details/PIA18182) | NASA/JPL-Caltech (Voyager 2) | `static/textures/planets/uranus.png` |
| Neptune in the background, cropped to the planet edge, 512 px, black made transparent | [PIA01492](https://images.nasa.gov/details/PIA01492) | NASA/JPL (Voyager 2) | `static/textures/planets/neptune.png` |

Generated in code, not taken from any source: the star field (5000 random points), the Sun's glow (canvas gradient), the orange object markers and the hidden Moon message.

## Objects: facts, photos and 3D models

Facts, dates and coordinates come from the NASA Space Science Data Coordinated Archive (NSSDCA) and mission pages, listed per object. The first-person stories are written by the team from those facts. Photo authors are copied from the NASA Image and Video Library record of each photo. 3D model authors are copied from the NASA 3D Resources page of each model.

### Moon (11)

| Object | Place | Facts from | Photo (author) | Then and now (author) | 3D model (author) |
|---|---|---|---|---|---|
| Apollo Lunar Module Descent Stage (Eagle) | 0.674° N, 23.473° E | [NASA NSSDCA Apollo 11 Lunar Module / EASEP (1969-059C)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C) | [as11-40-5927](https://images.nasa.gov/details/as11-40-5927) (NASA/JSC) | [PIA12909](https://images.nasa.gov/details/PIA12909), Lunar Reconnaissance Orbiter (LROC), 2009 (NASA/GSFC/Arizona State University) | [apollo-lunar-module.glb](https://science.nasa.gov/3d-resources/apollo-lunar-module/) (NASA/Michael D. Carbajal) |
| Lunar Roving Vehicle 1 (Apollo 15) | 26.134° N, 3.639° E | [NASA NSSDCA Apollo 15 Lunar Roving Vehicle (1971-063C)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C) | [as15-88-11901](https://images.nasa.gov/details/as15-88-11901) (NASA/JSC) | - | - |
| Apollo 12 ALSEP Package | 3.012° S, 23.422° W | [NASA NSSDCA Apollo 12 ALSEP (1969-099C)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C) | [as12-47-6919](https://images.nasa.gov/details/as12-47-6919) (NASA/JSC) | - | - |
| Surveyor 3 | 3.016° S, 23.418° W | [NASA Science Mission: Surveyor 3](https://science.nasa.gov/mission/surveyor-3/) | [AS12-48-7134](https://images.nasa.gov/details/AS12-48-7134) (NASA/JSC) | - | - |
| Lunar Orbiter 1 | 6.700° N, 162.000° E | [NASA NSSDCA Lunar Orbiter 1 (1966-073A)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1966-073A) | [LRC-1966-B701_P-07825](https://images.nasa.gov/details/LRC-1966-B701_P-07825) (NASA/Langley) | - | - |
| LCROSS & Centaur Upper Stage | 84.675° S, 48.725° W | [NASA NSSDCA LCROSS (2009-031B)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2009-031B) | [ARC-2008-ACD07-0073-412](https://images.nasa.gov/details/ARC-2008-ACD07-0073-412) (NASA/Ames, Dominic Hart) | - | - |
| SMART-1 (ESA) | 34.260° S, 46.190° W | [ESA Planetary Science Archive: SMART-1](https://www.cosmos.esa.int/web/psa/smart-1) | none (no matching NASA photo) | - | - |
| Kaguya (SELENE) (JAXA) | 65.500° S, 80.400° E | [JAXA DARTS: Kaguya (SELENE)](https://www.darts.isas.jaxa.jp/planet/project/selene/) | none (no matching NASA photo) | - | - |
| SLIM Lander & LEV-1/2 (JAXA) | 13.316° S, 25.244° E | [JAXA SLIM Mission & DARTS Archive](https://www.isas.jaxa.jp/en/missions/spacecraft/current/slim.html) | none (no matching NASA photo) | - | - |
| Luna 9 (USSR) | 7.080° N, 64.370° W | [NASA NSSDCA: Soviet Missions to the Moon (Luna 9)](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunarussr.html) | none (no matching NASA photo) | - | - |
| Lunokhod 1 (Luna 17) (USSR) | 38.333° N, 35.000° W | [NASA NSSDCA: Soviet Missions to the Moon (Luna 17, Lunokhod 1)](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunarussr.html) | [PIA12967](https://images.nasa.gov/details/PIA12967) (NASA/GSFC/Arizona State University) | - | - |

### Mars (11)

| Object | Place | Facts from | Photo (author) | Then and now (author) | 3D model (author) |
|---|---|---|---|---|---|
| Sojourner Rover & Mars Pathfinder | 19.330° N, 33.550° W | [NASA Science Mission: Mars Pathfinder and Sojourner Rover](https://science.nasa.gov/mission/mars-pathfinder/) | [PIA01122](https://images.nasa.gov/details/PIA01122) (NASA/JPL) | - | - |
| Spirit Rover (MER-A) | 14.568° S, 175.473° E | [NASA Science Mission: Spirit Rover (MER-A)](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/) | [PIA16442](https://images.nasa.gov/details/PIA16442) (NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.) | - | [mer-opportunity.glb](https://science.nasa.gov/3d-resources/mars-exploration-rover-opportunity-mer-b/) (NASA/Ames Research Center) |
| Opportunity Rover (MER-B) | 1.948° S, 5.526° W | [NASA Science Mission: Opportunity Rover (MER-B)](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/) | [PIA17759](https://images.nasa.gov/details/PIA17759) (NASA/JPL-Caltech/Cornell Univ./Arizona State Univ.) | [PIA22549](https://images.nasa.gov/details/PIA22549), Mars Reconnaissance Orbiter (HiRISE), 2018-09-20 (NASA/JPL-Caltech/Univ. of Arizona) | [mer-opportunity.glb](https://science.nasa.gov/3d-resources/mars-exploration-rover-opportunity-mer-b/) (NASA/Ames Research Center) |
| Viking 1 Lander | 22.697° N, 48.222° W | [NASA Science Mission: Viking 1 Lander](https://science.nasa.gov/mission/viking-1/) | [PIA00563](https://images.nasa.gov/details/PIA00563) (NASA/JPL) | [PIA01881](https://images.nasa.gov/details/PIA01881), Mars Reconnaissance Orbiter (HiRISE), 2006 (NASA/JPL-Caltech/University of Arizona) | [viking-lander.glb](https://science.nasa.gov/3d-resources/viking-lander/) (NASA/Michael D. Carbajal) |
| Phoenix Mars Lander | 68.219° N, 125.749° W | [NASA Science Mission: Phoenix Mars Lander](https://science.nasa.gov/mission/phoenix/) | [PIA10710](https://images.nasa.gov/details/PIA10710) (NASA/JPL-Caltech/University of Arizona) | [PIA22223](https://images.nasa.gov/details/PIA22223), Mars Reconnaissance Orbiter (HiRISE), 2017 (NASA/JPL-Caltech/Univ. of Arizona) | - |
| InSight Lander | 4.502° N, 135.623° E | [NASA Science Mission: InSight Lander](https://science.nasa.gov/mission/insight/) | [PIA22874](https://images.nasa.gov/details/PIA22874) (NASA/JPL-Caltech) | [PIA26515](https://images.nasa.gov/details/PIA26515), Mars Reconnaissance Orbiter (HiRISE), 2024-10 (NASA/JPL-Caltech/University of Arizona) | [insight-lander.glb](https://science.nasa.gov/3d-resources/insight-cruise-lander/) (NASA/Brian E. Kumanchik) |
| Ingenuity Mars Helicopter | 18.445° N, 77.451° E | [NASA Science Mission: Ingenuity Mars Helicopter](https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/) | [PIA24542](https://images.nasa.gov/details/PIA24542) (NASA/JPL-Caltech/MSSS) | [PIA26236](https://images.nasa.gov/details/PIA26236), Perseverance rover (Mastcam-Z), 2024-02-04 (NASA/JPL-Caltech/ASU/MSSS) | [ingenuity.glb](https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/) (NASA/Brian E. Kumanchik) |
| Mariner 9 | no fixed place (orbit or deep space) | [NASA NSSDCA Mariner 9 (1971-051A)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-051A) | [PIA02996](https://images.nasa.gov/details/PIA02996) (NASA/JPL) | - | - |
| Mars Global Surveyor | no fixed place (orbit or deep space) | [NASA NSSDCA Mars Global Surveyor (1996-062A)](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-062A) | [PIA17486](https://images.nasa.gov/details/PIA17486) (NASA/JPL-Caltech) | - | [mars-global-surveyor.glb](https://science.nasa.gov/3d-resources/mars-global-surveyor/) (NASA/JPL/Eyes on the Solar System) |
| Beagle 2 (UK / ESA) | 11.529° N, 90.426° E | [NASA Photojournal PIA19107: Beagle 2 Lander on Mars, With Panels Deployed](https://science.nasa.gov/photojournal/beagle-2-lander-on-mars-with-panels-deployed/) | [PIA19107](https://images.nasa.gov/details/PIA19107) (NASA/JPL-Caltech/Univ. of Arizona/University of Leicester) | - | - |
| Mars 3 Lander (USSR) | 45.000° S, 158.000° W | [NASA Photojournal PIA16920: Could This Be the Mars Soviet 3 Lander?](https://science.nasa.gov/photojournal/could-this-be-the-mars-soviet-3-lander/) | [PIA16920](https://images.nasa.gov/details/PIA16920) (NASA/JPL-Caltech/Univ. of Arizona) | - | - |

### Ceres (1)

| Object | Place | Facts from | Photo (author) | Then and now (author) | 3D model (author) |
|---|---|---|---|---|---|
| Dawn Spacecraft | no fixed place (orbit or deep space) | [NASA Science Mission: Dawn Spacecraft](https://science.nasa.gov/mission/dawn/) | [PIA21921](https://images.nasa.gov/details/PIA21921) (NASA/JPL-Caltech/UCLA/MPS/DLR/IDA) | - | [dawn.glb](https://science.nasa.gov/3d-resources/dawn/) (NASA/Brian E. Kumanchik) |

### 433 Eros (1)

| Object | Place | Facts from | Photo (author) | Then and now (author) | 3D model (author) |
|---|---|---|---|---|---|
| NEAR Shoemaker | 35.000° S, 81.000° E | [NASA Science Mission: NEAR Shoemaker](https://science.nasa.gov/mission/near-shoemaker/) | [PIA03114](https://images.nasa.gov/details/PIA03114) (NASA/JPL/JHUAPL) | - | [near-shoemaker.glb](https://science.nasa.gov/3d-resources/near-shoemaker/) (NASA) |

### Deep space (4)

| Object | Place | Facts from | Photo (author) | Then and now (author) | 3D model (author) |
|---|---|---|---|---|---|
| Pioneer 10 & 11 | no fixed place (orbit or deep space) | [NASA Science Mission: Pioneer 10 and 11](https://science.nasa.gov/mission/pioneer-10/) | [ARC-1972-AC72-2135](https://images.nasa.gov/details/ARC-1972-AC72-2135) (NASA/Ames) | - | [pioneer-10.glb](https://science.nasa.gov/3d-resources/pioneer/) (NASA/JPL/Eyes on the Solar System) |
| Kepler Space Telescope | no fixed place (orbit or deep space) | [NASA Science Mission: Kepler Space Telescope](https://science.nasa.gov/mission/kepler/) | [PIA11824](https://images.nasa.gov/details/PIA11824) (NASA/Ames/JPL-Caltech) | - | [kepler.glb](https://science.nasa.gov/3d-resources/kepler-a/) (NASA/Brian E. Kumanchik, NASA/Christian A. Lopez) |
| Philae Lander & Rosetta (ESA (lander by DLR, CNES and partners)) | no fixed place (orbit or deep space) | [ESA Planetary Science Archive: Rosetta & Philae](https://www.cosmos.esa.int/web/psa/rosetta) | [PIA19096](https://images.nasa.gov/details/PIA19096) (ESA/Rosetta/Philae/CNES/FD) | - | [rosetta.glb](https://science.nasa.gov/3d-resources/rosetta/) (NASA (Rosetta, the orbiter that carried Philae)) |
| MASCOT Lander & Hayabusa2 (DLR and CNES on JAXA Hayabusa2) | no fixed place (orbit or deep space) | [JAXA DARTS: Hayabusa2 & MASCOT](https://www.darts.isas.jaxa.jp/planet/project/hayabusa2/) | none (no matching NASA photo) | - | - |

### Notes on the objects

- Nine objects were not built by NASA (marked with their agency above). Their facts and coordinates come from NSSDCA records or from the ESA and JAXA mission pages listed in the table. Only NASA photos are used for them; where the NASA library has no photo of the object (Luna 9, Kaguya, SMART-1, SLIM, MASCOT) the museum page shows none.
- The JAXA DARTS pages (Kaguya, Hayabusa2 and MASCOT) did not answer from our network when the links were checked; all other source links were checked and open.
- The Philae photo (PIA19096) is hosted by the NASA library but is copyright ESA/Rosetta/Philae/CNES/FD; it is credited as such on the page.
- The Philae page shows the NASA 3D model of Rosetta, the ESA orbiter that carried Philae; there is no model of Philae itself.
- Spirit uses the Opportunity model: the two rovers are twins of the same design (Mars Exploration Rover).
- Apollo 11: only the descent stage stayed on the Moon, so the upper part of the Lunar Module model (the ascent stage) is hidden (`keep_below` in the data).
- Models are enlarged on the globe so they can be seen; the plaque says so.
- No NASA 3D models exist for the Lunar Roving Vehicle, Surveyor, Sojourner, Phoenix, ALSEP, Lunar Orbiter, LCROSS, Mariner 9 or the non-NASA machines in NASA 3D Resources (checked on https://github.com/nasa/NASA-3D-Resources).

## Chat guide (AIstronaut)

| What | Source | License |
|---|---|---|
| Knowledge base `data/knowledge/<lang>/equipment-catalog.txt` | generated from the catalog texts above (Amaliya Aijan) | same sources as the objects |
| Other knowledge files in `data/knowledge/` | prepared by the team from the NASA pages above | NASA material, see usage terms |
| Chat model Gemma (`gemma4:e2b` by default) run locally through Ollama | https://ollama.com/ | Gemma Terms of Use; Ollama MIT |
| Embedding model `nomic-embed-text` | https://ollama.com/library/nomic-embed-text | Apache-2.0 |

## Code libraries

| What | Source | License | Used for |
|---|---|---|---|
| Django 5.2 | [https://www.djangoproject.com/](https://www.djangoproject.com/) | BSD-3-Clause | server, database, admin |
| python-dotenv | [https://github.com/theskumar/python-dotenv](https://github.com/theskumar/python-dotenv) | BSD-3-Clause | reading `.env` |
| WhiteNoise | [https://whitenoise.readthedocs.io/](https://whitenoise.readthedocs.io/) | MIT | serving static files |
| gunicorn | [https://gunicorn.org/](https://gunicorn.org/) | MIT | web server for hosting |
| psycopg 3 | [https://www.psycopg.org/](https://www.psycopg.org/) | LGPL-3.0 | PostgreSQL driver |
| PostgreSQL and pgvector, pgvector-python | [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector) | PostgreSQL License; MIT | database and vector search for the chat |
| Three.js r170: core, OrbitControls, GLTFLoader, DRACOLoader, BufferGeometryUtils | [https://threejs.org/](https://threejs.org/) | MIT (`static/vendor/three/LICENSE`) | 3D scene, camera, 3D models |
| Draco decoder | [https://github.com/google/draco](https://github.com/google/draco) | Apache-2.0 (`static/vendor/three/draco/LICENSE`) | unpacking compressed NASA models |
