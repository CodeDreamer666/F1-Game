# Apex Grand Prix — Formula Racing Simulator

A 3D Formula-style racing simulator that runs in a desktop browser. Everything (HTML, CSS, physics, AI, shaders, audio synthesis, UI) lives in **`index.html`**; only Three.js (r160) is loaded from a CDN, with jsDelivr → unpkg → cdnjs fallbacks.

## Running

Open `index.html` in Chrome, Edge or Firefox. If your browser blocks module imports from `file://`, serve the folder:

```sh
npx serve .        # or: python3 -m http.server
```

An internet connection is needed the first time to fetch Three.js and the Titillium Web font.

## Driving

The player has one keyboard-friendly arcade driving model. The handling is tuned from playing Super Star Car on Poki: stronger acceleration, light coasting, speed-dependent braking and fast, planted steering. The requested W+S+A/D drift and brake-only S behavior are retained. See [reference measurements](tests/reference/poki-measurements.md) for the captured HUD values, comparison and measurement limits.

| Input | Movement |
|---|---|
| `W` | Accelerate smoothly in the current heading. |
| Release `W` | Coast and slow down through engine braking and drag. |
| `W` + `A`/`D` | Accelerate and turn. Brief taps make corrections; sustained steering holds the turn. Speed changes follow throttle, drag and tyre forces. |
| `S` | Brake quickly and hold the car stopped. Never reverse. |
| `W` + `S` | Braking takes priority. The engine does not fight the brakes. |
| `S` + `A`/`D` | Brake and turn with stable grip. |
| `W` + `S` + `A`/`D` | Enter a controlled drift, losing speed during the turn. Release S to regain grip and accelerate out. |
| Release `A`/`D` | Steering recentres quickly and the car settles into its current direction. |
| `A` + `D` | The opposing steering inputs cancel. |

Throttle and braking are controlled by the player's inputs. Steering never applies the brakes or imposes a corner speed target. Player acceleration, braking, yaw and lateral slide use arcade force curves. Surface resistance, fuel exhaustion, DRS and the pit limiter still affect it. Steering responds immediately to digital input, with a short rotation transient and automatic slide recovery. Brief key segments that fall between rendered frames are buffered. Collisions remain in the vehicle model. The handling runs inside the 240 Hz physics loop, independently of the rendering frame rate.

**Bots drive the same car.** Every AI driver, and the autopilot that takes the player's car through the pit lane, uses the player's handling: they press the same steering, throttle and brake controls, which go through the same arcade acceleration, braking, coasting, yaw and slide response. Bots plan corner speeds from the steering's turn-rate limit and braking points from the arcade braking, never reverse, and use the same respawn as the player when stuck.

Reference: [Super Star Car on Poki](https://poki.com/en/g/super-star-car) for bindings and the directly observed handling.

## What's inside

- **Circuit**: Lakeside Alpine Circuit (4.67 km, 8 corners, 2 DRS zones) with ridged red/white kerbs, pebbled gravel traps, painted run-off, braking-zone skid marks, 300/200/100 m braking boards, ad-board walls, catch fences, grandstands with a cheering (animated) crowd, waving team flags, a pit lane with team garages and an illuminated event sign, a start gantry with working lights and APEX GRAND PRIX branding, a lattice sponsor bridge, TV camera towers, marshal light panels, rolling forested terrain, a lake with sailing boats, a castle, a village and snow-capped mountains.
- **Graphics**: late-afternoon sun with long shadows, a sky with a warm sun halo and high cirrus (a dark, rolling cloud deck in the rain), HDR rendering with multisampling, bloom, ACES tone mapping and colour grading; reflections captured from the real scenery; team liveries on clear-coated bodywork; airfoil wing elements with DRS flap, rounded tyres with compound bands, see-through wheel faces and wheel blur at speed; contact shadows; stable sun shadows; a spring-damped chase camera; a cockpit view with its own slim halo, a steering wheel with a live display and gloved hands, and mirrors, plus a T-cam on the airbox; dynamic resolution to hold the frame rate.
- **Visual effects** (see below): sparks, debris, tyre smoke, dust, gravel, spray, fire, brake glow, tyre marks, rain and screen effects, all driven by the simulation.
- **Physics** (240 Hz; arcade pedal/yaw/slide response for every car, player and AI alike): four-wheel tyre model (Pacejka-style lateral force, friction circle, load sensitivity, lock-ups and wheelspin), downforce and drag (DRS, slipstream, dirty air, aero damage), longitudinal and lateral weight transfer, 8-speed gearbox, ERS deploy/harvest, fuel mass and consumption, tyre temperature and wear (soft, medium, hard, wet), surface grip, wall and car-to-car collisions with component damage (see below).
- **AI drivers**: 19 opponents, each with pace, consistency, braking, racecraft, aggression, risk, tyre-management and strategy ratings. They drive the same arcade handling as the player, plan their own racing line, compute braking points and corner speeds from that handling's limits, learn each corner as they go, choose lanes around traffic, use slipstream, DRS and ERS to attack, defend the inside, give room, respect yellow and blue flags, make mistakes (late braking, over-braking, running wide, early throttle), recover after contact (respawning like the player when stuck), and plan and react to pit strategy (undercut, covering, damage stops). They predict where the car ahead is heading before committing to a gap, drive a damaged car with more margin, limp a punctured car back off the racing line, and stop safely when a failure ends their race.
- **Race weekend**: qualifying with out-laps and a session clock, standing starts with automatic launch control (see below), sector timing (purple/green/yellow), time gaps, track-limit warnings, penalties (track limits, causing a collision, overtaking under yellow), yellow flags, pit stops with double-stacking, chequered flag and classified results with points.
- **Modes**: race weekend (qualifying + race), quick race, and spectator mode with car switching, six cameras, an auto-director and up to 4× time.
- **Settings**: race length, AI difficulty, qualifying length, field size, weather, tyre wear, two-compound rule, vehicle damage (Reduced / Standard / Realistic), starting tyre, driver name and team, default camera, cockpit field of view, graphics quality, volume and units.

## Visual effects

Every effect reacts to what the simulation is doing; nothing is a looping decoration. Effects use fixed-size pools (no allocation while racing), and the pool sizes scale with the Graphics quality setting.

| Situation | What you see |
|---|---|
| Car-to-car or barrier contact | Scaled by the impact's energy and direction. Light contact: sparks sprayed along the direction of sliding, a short flash, a small jolt of the body; wheels rubbing smoke. Moderate: carbon and painted splinters thrown along the push, the tyres scrub and leave marks as the car is shoved sideways. Heavy: pieces of bodywork, a cloud of tyre smoke (dust and turf off track), a car that keeps smoking from the damaged area for a few seconds, and a bounce off the ground; a front wheel riding up another car's rear wheel throws the car up. The body leans, pitches and squashes with each shove. The driver involved gets a directional jolt (the head snaps towards the impact in the cockpit), a brief flash and chromatic fringing; new damage pulses the screen edge red. |
| Parts breaking off | Front-wing endplates, then upper flaps, then the whole wing half; both halves lost in a frontal hit take the nose cone with them; rear-wing endplates, the DRS flap, then the whole rear wing; mirrors in side impacts; floor fences; in a huge crash a broken corner's wheel can tear off its tethers. Each piece leaves the car where it was, keeps the car's momentum plus the push of the impact, tumbles, bounces, slides flat (sparking if it has metal on it, kicking up dust on the grass), stops at the barriers, gets kicked along by cars running over it, and is cleared after about 25 s. A new wing in the pits comes with its pieces. |
| Lock-ups, wheelspin, slides and drifts | Tyre smoke from the wheel that is scrubbing, and black rubber marks laid on the track. |
| Leaving the circuit | Dust clouds, flying gravel or turf, and ruts left in the gravel and grass. |
| Kerbs and rough ground | The car vibrates, the camera shakes, and over kerbs at speed the floor plank throws sparks. |
| Floor contact | Sparks when the plank touches down over kerbs, in the braking dive, when bottoming at top speed, and constantly with a damaged floor. |
| Heavy braking | Brake discs glow orange through the wheel spokes and cool down on the straights. |
| Damage | Sagging, swept-back and fluttering wings that scrape the ground and spark, wobbling bent suspension, broken corners whose wheel hangs on its tethers and flails about, punctured tyres that wobble and thump once per wheel turn (the car and the cockpit view bump with it), shredded tyres (rubber bits, rim sparks), scuffed paint, a grey smoke trail from a damaged power unit, white steam from damaged cooling or overheating, dark smoke from a failed engine. |
| Fire (rare) | A fireball when it starts, flames with a colour ramp, a column of black smoke, the fire lighting up its surroundings, the extinguisher, and soot on the bodywork afterwards. |
| Rain | Darker light, reflective wet asphalt, red rain lights that reflect on the road, rooster-tail spray and a mist cloud behind each car, rain streaks that slant at you with speed, splashes on the ground and drops on the lens. |
| Speed | Rising field of view, radial speed blur, faint speed lines at the screen edges above about 230 km/h, high-speed buffeting and wheel blur. The *Speed blur & speed lines* setting turns the blur and lines off. |
| Pit stops | Crews at the wheels and wings, the car on its jacks and puffs from the wheel guns. |

Cockpit view: the eye sits a little above the real eye line so the road and the front of the car stay clear, the halo's top bar runs along the top of the screen and its centre pillar stays narrow. The head rides on springs (forward under braking, back under power, outward in corners, bounced by kerbs and punctures, jolted by impacts) while the neck keeps the horizon steadier than the chassis, and the driver looks slightly into corners and towards a slide. The steering wheel turns with your steering and shows speed, gear, rpm, shift lights, ERS and delta; damage, punctures, lost wings and fires flash a warning on it, and a bent corner holds it off-centre. Damage you can see from the seat: missing wing elements and nose, a wing dragging and sparking, a wheel hanging off its broken suspension, mirrors knocked off. The *Cockpit field of view* setting picks Narrow, Normal or Wide. **T-cam** is the TV onboard camera on top of the airbox.

Graphics quality: **Low** turns off shadows and post-processing (screen flashes fall back to a lightweight overlay) and uses the smallest particle budgets; **Medium** adds shadows, bloom, grading and the lens effects; **High** adds sharper shadows and textures, more multisampling, denser scenery and the largest particle budgets.

## Damage, repairs and retirement

Every car (player, bots and the pit autopilot) uses the same component damage model. Each impact is judged on the energy it dissipates at the contact point: closing speed, effective mass, where on the car it lands, from which direction, and how much each part was already weakened. Absolute speed does not matter, so cars running side by side can touch without consequence.

| Component | Failure behaviour | Effect on the car |
|---|---|---|
| Front wing (left / right halves) | Endplate and upper flap break off, the half sags and is bent back, then detaches and lies on track as debris | Less front downforce: understeer, mostly at speed |
| Rear wing | Tilts, endplates and the DRS flap come off, then the whole wing; a destroyed rear structure retires the car | Less rear stability and downforce |
| Floor | Scrapes and sparks | Downforce loss everywhere |
| Suspension ×4 | Bent alignment, then breaks (retirement) | Less grip at that corner, the car pulls to that side, the steering shakes |
| Tyres ×4 | Slow leak or blow-out; a flat tyre shreds and the rim damages the corner | Grip, braking, traction and top speed loss, strong pull |
| Power unit | Misfires, then fails (stop safely) | Power loss |
| Cooling | Leaks and runs hot; overheating derates and wears the power unit | Lift-and-coast needed |
| Chassis | Structural; heavy damage retires the car | Slight handling loss |

Damage accumulates: repeated knocks below a part's threshold still weaken it, and a damaged part gives way sooner. Crushed wings pass leftover energy on to the suspension and tub behind them. Light contact leaves scratches and sparks; moderate impacts break wings, bend suspension or cut tyres; heavy crashes break suspension or the power unit and end the race.

**Pit repairs.** Tyre changes take about 2–4 s; a new front wing with tyres about 7–11 s; a rear wing about 16–22 s. Suspension, floor, power unit, cooling and chassis damage cannot be repaired. Press `5` while boxing to keep damaged wings for a faster stop.

**Failures and fire.** Fires are rare and need a plausible cause, such as a power unit failing hot or after a heavy impact, or a huge impact into the fuel cell or battery. A car with a fire or catastrophic failure pulls off the racing line, stops and retires. Race control shows a yellow flag until marshals recover it. The driver is classified DNF and cannot rejoin; every car is restored for the next session.

**Vehicle Damage setting** (main menu, Race Settings or the pause menu; Standard by default):
- **Reduced:** minor contact is mostly cosmetic, failures are unlikely, no fires; only serious crashes end a race.
- **Standard:** balanced damage, punctures and repair decisions; big crashes have real consequences.
- **Realistic:** stricter thresholds, more cumulative damage, rare reliability failures and fires; heavy crashes can end the race.

When the car is damaged, the tyre panel (bottom right) becomes a vehicle-status panel: the car diagram colours each component by its condition, and the panel lists the worst problems with their handling effect and what a pit stop could repair, with its estimated duration.

## Controls

The core keyboard controls follow Super Star Car on Poki: WASD or arrow keys to drive, `Space` to respawn, and `C` to change the camera. Extra race features use the keys below.

| Action | Keys |
|---|---|
| Throttle / brake only | `W` `S` or `↑` `↓` |
| Steer | `A` `D` or `←` `→` |
| Controlled drift | `W` + `S` + `A`/`D` |
| DRS | `G` |
| ERS overtake (hold) / cycle ERS mode | `Shift` / `X` |
| Box this lap, then pick tyres | `P`, then `1`–`4` |
| Pit: change / keep damaged wings | `5` |
| Camera / look back | `C` / `B` |
| Full leaderboard / telemetry | `Tab` / `T` |
| Race start: rev on the grid (launch control) | hold `W` |
| Respawn car on track | `Space` (or `R`) |
| Pause menu | `Esc` |
| Qualifying: skip to the end | `K` |

Gamepads are supported (left stick steer, right trigger throttle, left trigger brake, X DRS, Y camera, Start pause).

## Race start

Every car, player and AI alike, starts through the same automatic launch control. Hold `W` on the grid: the engine revs to the fixed launch rpm (`SPEC.launchRpm`, 7,000 rpm, the fastest 0–100 km/h launch in the drivetrain model) and the automatic clutch stays fully open, so no car can creep or jump the start and there is no false-start penalty. The rpm is regulated, not built up: holding `W` early gives exactly the same launch as holding it for a moment, and no fuel is metered on the grid. When the five red lights go out (after the usual random hold), the clutch engages automatically over 0.65 s while the throttle is applied. Pressing `W` at or after lights out launches the same way from that moment; without `W` the car stays where it is. AI drivers hold full throttle on the grid and launch through the identical code path, so after the start the field differs only by grid slot, tyres, team performance and traffic.

## Automated checks

Run `node tests/movement.cjs` to check all 16 WASD/arrow combinations, brief input buffering, micro steering taps, acceleration, coasting, brake-only S, steering without automatic braking or throttle cuts, direction changes, three-key drift, drift recovery and consistency at different frame rates using the actual physics engine. It also checks that bots and the pit autopilot drive through the player's handling: a bot command moves the car exactly as the same player input does, bots finish a lap on the real circuit without reversing or needing recovery, and the autopilot completes a pit stop. The damage tests stage impacts on the real circuit and cover gentle wheel-to-wheel contact, relative-speed and wall impacts, accumulated knocks, punctures, aero, suspension, tyre and power-unit effects, overheating, fire rarity, pit repair times and limits, retirement with clean timing and results, bot pit decisions and the three damage levels.
