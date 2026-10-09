# Apex Grand Prix — Formula Racing Simulator

A 3D Formula-style racing simulator that runs in a desktop browser. Everything (HTML, CSS, physics, AI, shaders, audio synthesis, UI) lives in **`index.html`**; only Three.js (r160) is loaded from a CDN, with jsDelivr → unpkg → cdnjs fallbacks.

## Running

Open `index.html` in Chrome, Edge or Firefox. If your browser blocks module imports from `file://`, serve the folder:

```sh
npx serve .        # or: python3 -m http.server
```

An internet connection is needed the first time to fetch Three.js and the Titillium Web font.

## Driving

The player has one keyboard-friendly arcade driving model. This implementation aims to reproduce Super Star Car's planted handling, steering slowdown and responsive braking, with the requested W+S+A/D drift and brake-only S behavior. The reference's internal tuning and exact input timing have not been measured, so this is a behavioral approximation.

| Input | Movement |
|---|---|
| `W` | Accelerate smoothly in the current heading. |
| Release `W` | Coast and slow down through engine braking and drag. |
| `W` + `A`/`D` | Accelerate and turn. Brief taps make corrections; sustained steering sheds speed and tightens the turn. |
| `S` | Brake quickly and hold the car stopped. Never reverse. |
| `W` + `S` | Braking takes priority. The engine does not fight the brakes. |
| `S` + `A`/`D` | Brake and turn with stable grip. |
| `W` + `S` + `A`/`D` | Enter a controlled drift, losing speed during the turn. Release S to regain grip and accelerate out. |
| Release `A`/`D` | Steering recentres quickly and the car settles into its current direction. |
| `A` + `D` | The opposing steering inputs cancel. |

Corner speed assistance follows the player's steering demand, not a scripted path or racing-line target. The player still chooses where to drive. Tyre grip, surfaces, aero and collisions remain in the vehicle model. The handling runs inside the 240 Hz physics loop, independently of the rendering frame rate.

Reference: [Super Star Car on Poki](https://poki.com/en/g/super-star-car) for bindings and [Drifted's hands-on review](https://www.drifted.com/super-star-car/) for movement observations.

Visual guidance (all optional):
- A colour-changing racing line (`L`).
- Braking-distance markers.
- A corner guide naming the next corner with a safe speed. It turns amber or red when you need to lift or brake.
- A SLIDE indicator on the dashboard showing the current slide angle.
- A short tutorial the first time you race. You can replay it from the Controls screen.

## What's inside

- **Circuit**: Lakeside Alpine Circuit (4.67 km, 8 corners, 2 DRS zones) with kerbs, gravel, painted run-off, braking-zone skid marks, ad-board walls, catch fences, grandstands with crowds, a pit lane with team garages, a start gantry with working lights, brake boards, marshal light panels, rolling forested terrain, an animated lake, a castle, a village and snow-capped mountains.
- **Graphics**: HDR rendering with multisampling, bloom, ACES tone mapping and colour grading; reflections captured from the real scenery; team liveries; contact shadows; stable sun shadows; optional speed blur; dynamic resolution to hold the frame rate. Low quality turns post-processing off.
- **Physics** (240 Hz, identical for all cars): four-wheel tyre model (Pacejka-style lateral force, friction circle, load sensitivity, lock-ups and wheelspin), downforce and drag (DRS, slipstream, dirty air, wing damage), longitudinal and lateral weight transfer, 8-speed gearbox, ERS deploy/harvest, fuel mass and consumption, tyre temperature and wear (soft, medium, hard, wet), surface grip, wall and car-to-car collisions.
- **AI drivers**: 19 opponents, each with pace, consistency, braking, racecraft, aggression, risk, tyre-management, strategy and start ratings. They plan their own racing line, compute braking points from their current grip, learn each corner as they go, choose lanes around traffic, use slipstream, DRS and ERS to attack, defend the inside, give room, respect yellow and blue flags, make mistakes (late braking, lock-ups, running wide, snap oversteer), recover from spins, and plan and react to pit strategy (undercut, covering, damage stops).
- **Race weekend**: qualifying with out-laps and a session clock, standing starts, sector timing (purple/green/yellow), time gaps, track-limit warnings, penalties (track limits, causing a collision, overtaking under yellow), yellow flags, pit stops with double-stacking, chequered flag and classified results with points.
- **Modes**: race weekend (qualifying + race), quick race, and spectator mode with car switching, five cameras, an auto-director and up to 4× time.
- **Settings**: race length, AI difficulty, qualifying length, field size, weather, tyre wear, two-compound rule, damage, starting tyre, driver name and team, corner guide, racing-line assist, default camera, graphics quality, volume and units.

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
| Camera / look back | `C` / `B` |
| Full leaderboard / telemetry / racing line | `Tab` / `T` / `L` |
| Respawn car on track | `Space` (or `R`) |
| Pause menu | `Esc` |
| Qualifying: skip to the end | `K` |

Gamepads are supported (left stick steer, right trigger throttle, left trigger brake, X DRS, Y camera, Start pause).

## Movement checks

Run `node --test tests/movement.cjs` to check acceleration, coasting, brake-only S, steering taps, direction changes, three-key drift, drift recovery and consistency at different frame rates using the actual physics engine.
