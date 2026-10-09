# Apex Grand Prix — Formula Racing Simulator

A 3D Formula-style racing simulator that runs in a desktop browser. Everything (HTML, CSS, physics, AI, shaders, audio synthesis, UI) lives in **`index.html`**; only Three.js (r160) is loaded from a CDN, with jsDelivr → unpkg → cdnjs fallbacks.

## Running

Open `index.html` in Chrome, Edge or Firefox. If your browser blocks module imports from `file://`, serve the folder:

```sh
npx serve .        # or: python3 -m http.server
```

An internet connection is needed the first time to fetch Three.js and the Titillium Web font.

## Driving

There is one driving system for every player, built for the keyboard and inspired by the simple controls of arcade racers such as Super Star Car, with smoother, tighter steering. It runs on top of the same vehicle physics the AI uses, so tyre grip, downforce, weight transfer, tyre temperature and wear, rain, kerbs and collisions all still apply.

| Keys | What happens |
|---|---|
| `W` | Accelerate. Throttle builds smoothly and traction control prevents wheelspin. Hold it through the ordinary corners and just steer. |
| `S` | Brake, progressively. Hold it when stopped to reverse. |
| `A` / `D` | Steer. The steering is smoothed and speed-sensitive: sharp enough for hairpins at low speed, calmer at high speed. Full lock always stays within the grip the tyres have, and the car straightens itself when you let go. |
| `W` + `S` + `A`/`D` | Brake into a sharp corner. Braking takes priority, but the engine stays ready. The car slows, rotates harder and can slide in a controlled way, more in slow corners and less in fast ones, where downforce holds it. Release `S` while still holding `W` and the tyres regain grip, the car straightens and it accelerates out of the corner. |

How it works:
- **Steering**: the keys set how hard you want to turn. The game picks the front-wheel angle that produces that yaw rate with the grip available (tyres, rain, surface, downforce). This gives a predictable response with no snapping, and automatic opposite lock when the rear steps out.
- **Braking while turning**: cornering brake control keeps part of each tyre's grip for cornering. In slow corners the rear brakes harder than the front, so braking into a turn rotates the car. The rear brake eases off when the slide grows past what is allowed.
- **Stability control**: the car may slide to a limited angle, larger while you brake into a turn. Past that, a correcting yaw moment (bounded by tyre grip) catches it. After you release the brake, the allowed angle shrinks gradually, so grip returns smoothly instead of snapping.
- **Automatic**: gearbox, traction control, ABS and stability control. There is no drift button and no scripted animation. Slides come from braking and steering through the tyre model.
- **Consequences**: a corner taken far too fast still runs wide onto the kerbs, grass or gravel, and walls still cause damage.

The handling runs inside the 240 Hz physics loop, so it behaves the same at any frame rate.

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

| Action | Keys |
|---|---|
| Throttle / brake (reverse when stopped) | `W` `S` or `↑` `↓` |
| Steer | `A` `D` or `←` `→` |
| Brake into a turn (controlled slide) | `W` + `S` + `A`/`D` |
| DRS | `G` (or `Space` on a straight) |
| ERS overtake (hold) / cycle ERS mode | `Shift` / `X` |
| Box this lap, then pick tyres | `P`, then `1`–`4` |
| Camera / look back | `C` / `B` |
| Full leaderboard / telemetry / racing line | `Tab` / `T` / `L` |
| Reset car to track | `R` |
| Pause menu | `Esc` |
| Qualifying: skip to the end | `K` |

Gamepads are supported (left stick steer, right trigger throttle, left trigger brake, X DRS, Y camera, Start pause).
