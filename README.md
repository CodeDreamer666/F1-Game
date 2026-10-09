# Apex Grand Prix — Formula Racing Simulator

A 3D Formula-style racing simulator that runs in a desktop browser. Everything (HTML, CSS, physics, AI, shaders, audio synthesis, UI) lives in **`index.html`**; only Three.js (r160) is loaded from a CDN, with jsDelivr → unpkg → cdnjs fallbacks.

## Running

Open `index.html` in Chrome, Edge or Firefox. If your browser blocks module imports from `file://`, serve the folder:

```sh
npx serve .        # or: python3 -m http.server
```

An internet connection is needed the first time to fetch Three.js and the Titillium Web font.

## What's inside

- **Circuit**: Lakeside Alpine Circuit (4.67 km, 8 corners, 2 DRS zones) with kerbs, gravel, painted run-off, ad-board walls, catch fences, grandstands with crowds, a pit lane with team garages, a start gantry with working lights, brake boards, marshal light panels, a lake, a castle and mountains.
- **Physics** (240 Hz, identical for all cars): four-wheel tyre model (Pacejka-style lateral force, friction circle, load sensitivity, lock-ups and wheelspin), downforce and drag (DRS, slipstream, dirty air, wing damage), longitudinal and lateral weight transfer, 8-speed gearbox, ERS deploy/harvest, fuel mass and consumption, tyre temperature and wear (soft, medium, hard, wet), surface grip, wall and car-to-car collisions.
- **AI drivers**: 19 opponents, each with pace, consistency, braking, racecraft, aggression, risk, tyre-management, strategy and start ratings. They plan their own racing line, compute braking points from their current grip, learn each corner as they go, choose lanes around traffic, use slipstream, DRS and ERS to attack, defend the inside, give room, respect yellow and blue flags, make mistakes (late braking, lock-ups, running wide, snap oversteer), recover from spins, and plan and react to pit strategy (undercut, covering, damage stops).
- **Race weekend**: qualifying with out-laps and a session clock, standing starts, sector timing (purple/green/yellow), time gaps, track-limit warnings, penalties (track limits, causing a collision, overtaking under yellow), yellow flags, pit stops with double-stacking, chequered flag and classified results with points.
- **Modes**: race weekend (qualifying + race), quick race, and spectator mode with car switching, five cameras, an auto-director and up to 4× time.
- **Settings**: race length, AI difficulty, qualifying length, field size, weather, tyre wear, two-compound rule, damage, starting tyre, driver name and team, gearbox, traction control, ABS, steering assist, racing-line assist, default camera, graphics quality, volume and units.

## Controls

| Action | Keys |
|---|---|
| Throttle / brake (reverse when stopped) | `W` `S` or `↑` `↓` |
| Steer | `A` `D` or `←` `→` |
| Gear up / down (manual gearbox) | `E` / `Q` |
| Drift (hold with throttle; steering sets the slide angle) | `Space` + `W` |
| DRS | `G` (or `Space` on a straight) |
| ERS overtake (hold) / cycle ERS mode | `Shift` / `X` |
| Box this lap, then pick tyres | `P`, then `1`–`4` |
| Camera / look back | `C` / `B` |
| Full leaderboard / telemetry / racing line | `Tab` / `T` / `L` |
| Reset car to track | `R` |
| Pause menu | `Esc` |
| Qualifying: skip to the end | `K` |

Gamepads are supported (left stick, triggers, A/B gears, X DRS, Y camera, left-stick click drift, Start pause).

### Drifting

Hold `Space` together with the throttle to break the rear loose. While you hold it, steering sets how far the car slides (up to roughly 17–24° in slow corners, much less at high speed because downforce pins the rear), and the front wheels apply opposite lock automatically. Release `Space` and the car straightens itself. Drifting heats and wears the rear tyres and is slower than the racing line, like in a real F1 car.
