# Super Star Car handling measurements

Reference: https://poki.com/en/g/super-star-car, played on 9 October 2026 in Chromium, first/default car at Landsdowne Circuit. Base: `7e96a57`.

The game was played using actual keyboard events. A continuous Chromium screencast captured the in-game race clock and integer km/h speedometer during W, release-W, S, steering, steering release and W+S+D runs. Unity was paused between separate runs. An additional coast segment was captured with Unity paused between screenshots. The selected screenshots are saved in [poki-captures.jpg](poki-captures.jpg).

| Input / usable segment | Reference clocks | Reference speed | Base result | Tuned result |
|---|---|---|---|---|
| W acceleration | 00:29.047 → 00:30.898 (1.851 s) | 35 → 158 km/h | 107 km/h | 153 km/h |
| Release W, first coast interval | 00:22.020 → 00:22.648 (0.628 s) | 191 → 183 km/h | 181 km/h | 183 km/h |
| S braking | 00:24.995 → 00:27.684 (2.689 s) | 58 → 17 km/h | Stopped | 14 km/h |

Base and tuned results use the actual simulation on a flat dry surface with the same starting speed, default team, no ERS, fuel consumption or wear, and rounded 240 Hz step counts. They are behavior comparisons, not recovered Unity parameters.

## Handling decisions

- Stronger player acceleration, tapering near maximum speed.
- Light coast drag. Braking force decreases with speed, with a small floor that brings the car to a true standstill.
- Faster steering entry and return. Short steering holds visibly rotate the reference car; releasing steering settles it. No precise yaw-angle or turn-radius measurement was available.
- Preserve brake-only S at a standstill and brake priority for W+S. Retain the requested W+S+A/D controlled drift. The reference's collision during the three-key run prevents a reliable drift-angle comparison.
- Manual pedals only: steering has no automatic brake or corner-speed target. Remove residual warm-up and pit-control coaching. No tutorial, coloured racing line, corner guide or braking markers.
- Keep AI and pit autopilot on their original drivetrain. Regression checks compare their trajectories against the base commit.

## Measurement limits

The software renderer runs slowly. HUD speed and clock updates can lag one another, keyboard events can be visible several frames later, and pausing Unity can affect its timing on resume. Speeds are rounded to whole km/h. Use the table as approximate segment targets with tolerances, not exact response curves. Collision, wall, off-road, automatic-respawn and corner-exit portions were excluded from the numerical comparison. Long top-speed runs, native yaw telemetry, per-frame input latency and wet-weather behavior were not measured. The retained brake-only S and explicit three-key drift are requested behavior; exact parity with every reference input combination is not claimed.

## Verification

`node tests/movement.cjs` checks the measured response ranges, stopping without reverse, coasting, steering without automatic braking, bounded drift and recovery, steering reversal, 30/60/120 Hz grouping, fuel exhaustion, pit limiting ERS, DRS, loose surfaces and unchanged AI/autopilot trajectories. Browser verification uses real WASD/arrow events through the actual controller and race physics, opposing steering inputs, drift/recovery, Settings, pause/resume and Space respawn. No browser runtime errors were observed. Simulation time was advanced in fixed steps during input checks because the software renderer is slow.
