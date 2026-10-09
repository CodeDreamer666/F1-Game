# Apex Grand Prix — Formula Racing Simulator

A 3D Formula-style racing simulator that runs in a desktop browser. Everything (HTML, CSS, physics, AI, shaders, audio synthesis, UI) lives in **`index.html`**; only Three.js (r160) is loaded from a CDN, with jsDelivr → unpkg → cdnjs fallbacks.

## Running

Open `index.html` in Chrome, Edge or Firefox. If your browser blocks module imports from `file://`, serve the folder:

```sh
npx serve .        # or: python3 -m http.server
```

An internet connection is needed the first time to fetch Three.js and the Titillium Web font.

## Driving modes

Pick a driving mode on the main menu, in the pause menu, in Race Settings or on the Controls screen. It only changes how **your** car responds to your inputs. The AI opponents, race rules, physics, tyres and strategy are the same in every mode, and AI skill is still set by *AI difficulty*. The choice is saved and carries over to restarts and new sessions. New players start in Beginner.

| | Beginner (Arcade) | Balanced (Assisted) | Simulation (Realistic) |
|---|---|---|---|
| Corner speed | Automatic: brakes progressively for the corners ahead (from the real track curvature, your lateral position and current tyre grip) and eases the throttle, so you can hold W through most corners | Only trims speed when you are far too fast | None |
| Steering | Smoothed and speed-sensitive, limited to the grip available, strong slide catching | Responsive, moderate slide catching | Raw input, or the original Steering assist if enabled |
| Traction / ABS | Full, grip-aware traction control; ABS on | Grip-aware traction control (at least Medium); ABS on | Exactly as set in Race Settings |
| Stability (ESC) | Strong. Brakes individual wheels to stop spins | Moderate | Off |
| Gearbox | Automatic | Race Settings (automatic or manual) | Race Settings |
| Space + W + A/D | Assisted sharp turn: entry, rotation, a held slide and a smooth exit, losing speed throughout | Drift that needs the right entry speed and steering | — (Space is DRS only) |
| DRS | Opens automatically on straights | G, or Space on a straight | G, or Space on a straight |

The assists only act through the pedals, the steering and per-wheel brake forces, so they obey tyre grip and cost time. Nothing moves or rotates the car directly. The assisted turn is always slower than driving the racing line properly.

Visual guidance (all optional):
- A colour-changing racing line (`L`).
- Braking-distance markers.
- A corner guide naming the next corner with a safe speed. It turns amber or red when you need to lift or brake, and shows when auto-brake is working. It is on by default in Beginner and Balanced.
- A short tutorial the first time you race. You can replay it from the Controls screen.

## What's inside

- **Circuit**: Lakeside Alpine Circuit (4.67 km, 8 corners, 2 DRS zones) with kerbs, gravel, painted run-off, braking-zone skid marks, ad-board walls, catch fences, grandstands with crowds, a pit lane with team garages, a start gantry with working lights, brake boards, marshal light panels, rolling forested terrain, an animated lake, a castle, a village and snow-capped mountains.
- **Graphics**: HDR rendering with multisampling, bloom, ACES tone mapping and colour grading; reflections captured from the real scenery; team liveries; contact shadows; stable sun shadows; optional speed blur; dynamic resolution to hold the frame rate. Low quality turns post-processing off.
- **Physics** (240 Hz, identical for all cars): four-wheel tyre model (Pacejka-style lateral force, friction circle, load sensitivity, lock-ups and wheelspin), downforce and drag (DRS, slipstream, dirty air, wing damage), longitudinal and lateral weight transfer, 8-speed gearbox, ERS deploy/harvest, fuel mass and consumption, tyre temperature and wear (soft, medium, hard, wet), surface grip, wall and car-to-car collisions.
- **AI drivers**: 19 opponents, each with pace, consistency, braking, racecraft, aggression, risk, tyre-management, strategy and start ratings. They plan their own racing line, compute braking points from their current grip, learn each corner as they go, choose lanes around traffic, use slipstream, DRS and ERS to attack, defend the inside, give room, respect yellow and blue flags, make mistakes (late braking, lock-ups, running wide, snap oversteer), recover from spins, and plan and react to pit strategy (undercut, covering, damage stops).
- **Race weekend**: qualifying with out-laps and a session clock, standing starts, sector timing (purple/green/yellow), time gaps, track-limit warnings, penalties (track limits, causing a collision, overtaking under yellow), yellow flags, pit stops with double-stacking, chequered flag and classified results with points.
- **Modes**: race weekend (qualifying + race), quick race, and spectator mode with car switching, five cameras, an auto-director and up to 4× time.
- **Settings**: driving mode, race length, AI difficulty, qualifying length, field size, weather, tyre wear, two-compound rule, damage, starting tyre, driver name and team, gearbox, traction control, ABS, steering assist, racing-line assist, default camera, graphics quality, volume and units.

## Controls

| Action | Keys |
|---|---|
| Throttle / brake (reverse when stopped) | `W` `S` or `↑` `↓` |
| Steer | `A` `D` or `←` `→` |
| Gear up / down (manual gearbox) | `E` / `Q` |
| Assisted turn / drift (Beginner, Balanced; steering sets the slide angle) | `Space` + `W` + `A`/`D` |
| DRS | `G` (or `Space` on a straight; automatic in Beginner) |
| ERS overtake (hold) / cycle ERS mode | `Shift` / `X` |
| Box this lap, then pick tyres | `P`, then `1`–`4` |
| Camera / look back | `C` / `B` |
| Full leaderboard / telemetry / racing line | `Tab` / `T` / `L` |
| Reset car to track | `R` |
| Pause menu | `Esc` |
| Qualifying: skip to the end | `K` |

Gamepads are supported (left stick, triggers, A/B gears, X DRS, Y camera, left-stick click drift, Start pause).

### Drifting

In Beginner and Balanced, hold `Space` with the throttle and a steering direction. The rear breaks loose, and your steering sets how far the car slides: up to roughly 18–24° in slow corners, much less at high speed because downforce pins the rear. The front wheels apply opposite lock automatically. Beginner also bleeds off speed during the turn and straightens the car quickly when you release `Space`. Sliding heats and wears the rear tyres.
