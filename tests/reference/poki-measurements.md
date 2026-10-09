# Super Star Car handling measurements

Reference: https://poki.com/en/g/super-star-car, played on 9 October 2026 in Chromium, first/default car at Landsdowne Circuit. Base: `7e96a57`.

The game was played using actual keyboard events. A continuous Chromium screencast captured the in-game race clock and integer km/h speedometer during W, release-W, S, steering, steering release and W+S+D runs. Unity was paused between separate runs. An additional coast segment was captured with Unity paused between screenshots. The selected screenshots are saved in [poki-captures.jpg](poki-captures.jpg).

| Input / usable segment | Reference clocks | Reference speed | Base result | Tuned result |
|---|---|---|---|---|
| W acceleration | 00:29.047 → 00:30.898 (1.851 s) | 35 → 158 km/h | 107 km/h | 153 km/h |
| Release W, first coast interval | 00:22.020 → 00:22.648 (0.628 s) | 191 → 183 km/h | 181 km/h | 183 km/h |
| S braking | 00:24.995 → 00:27.684 (2.689 s) | 58 → 17 km/h | Stopped | 14 km/h |

Base and tuned results use the actual simulation on a flat dry surface with the same starting speed, default team, no ERS, fuel consumption or wear, and rounded 240 Hz step counts. They are behavior comparisons, not recovered Unity parameters.

## Detailed steering and combination playtest

A second session investigated the reported weak micro-adjustments and W+S+steering. It included short native keyboard taps, a 31-phase matrix covering all 16 WASD states at rest or moving, releases, and a further 35 phases with repeated centred left/right brake/drift tests, equivalent arrow inputs and both orders of opposing steering. The received keyboard events, phase boundaries and selected player poses are saved in [poki-handling-trials.json](poki-handling-trials.json).

The short-tap trial used Playwright's native key events. For the longer combination sweeps, DOM KeyboardEvents with the same key/code/keyCode were dispatched to Unity's canvas and logged by the receiving frame. Space reset the car between centred trials. WebGL ObjectToWorld matrices exposed the rendered car's position and heading without changing its movement. The cockpit view/projection depth and body height distinguished its chassis from wheels and opponents. Body-versus-travel angles were computed from successive horizontal positions; they describe the rendered slide, not Unity's internal tyre-slip values.

| Reference segment | Rendered samples | Heading change | Path distance | Body/travel angle range |
|---|---:|---:|---:|---:|
| Short left tap, usable 187 ms wall-clock span | 3 | +8.88° | 5.30 m | −0.06° to +0.50° |
| Left W+S+A, centred repeat | 5 | +24.92° | 20.05 m | −4.13° to −0.34° |
| Right W+S+D, centred repeat | 4 | −13.39° | 13.07 m | +0.35° to +1.90° |
| Left S+A | 7 | +15.88° | 15.78 m | −0.15° to +0.97° |
| Right S+D | 7 | −36.96° | 14.05 m | −2.70° to −0.13° |
| Up+Down+Right arrows | 6 | −58.22° | 18.72 m | −0.17° to +2.92° |
| W+A+D, A pressed first | 6 | −0.27° | 20.79 m | −0.05° to +0.04° |
| W+D+A, D pressed first | 6 | +0.25° | 19.81 m | −0.08° to −0.01° |

These are observations from separate runs, **not matched initial-speed experiments**. Left/right signs follow the reference's world axes. Frame delivery delays make wall-clock yaw rates unreliable. The usable tap's native keydown-to-keyup interval was 244.5 ms despite requesting a 100 ms hold; its rendered endpoints cover only part of that interval. Collision-affected releases were excluded. The important behavior is prompt rotation, a mostly planted car with modest automatic slide during the three-key turn, and neutral opposing steering in either press order.

| Key state | Checked behavior / implementation |
|---|---|
| None | Coast while moving; rest at standstill. |
| W | Accelerate. |
| S | Brake; requested brake-only standstill behavior retained. |
| A, D | Turn while rolling; no rotation at rest. |
| W+S | Brake priority. |
| W+A, W+D | Powered steering; short taps affect the heading. |
| S+A, S+D | Brake and turn with stable grip. |
| A+D | Opposing steering cancels. |
| W+S+A, W+S+D | Prompt turn with controlled slide; release a drift input to recover. |
| W+A+D | Accelerate with neutral steering, in either press order. |
| S+A+D | Brake with neutral steering. |
| W+S+A+D | Brake priority, neutral steering, no drift. |

## Resulting handling changes

- Retain the measured acceleration/coast/braking curves from the first session.
- Digital steering enters immediately; yaw builds with a short transient. At 108 km/h, a 190 ms steering hold previously rotated the local car only 3.73°. The revised regression requires 7–12° across 54, 108 and 216 km/h, with useful 60 ms corrections in both directions. These are local acceptance ranges informed by the reference, not exact reference clock fits.
- Preserve taps that begin and end between rendered frames. Consume those unseen segments in order, capped at 150 ms each; discard them on pause, blur or reset. Already sampled holds are not replayed.
- W+S+steering tightens the arc and introduces a modest speed-sensitive slide, with automatic recovery when the combination is released. This replaces the prior large, slow-building drift. S+steering remains planted.
- Player yaw and lateral recovery now use arcade force responses rather than waiting for the simulation tyre model to build rotation. Collision impulses still apply. AI and pit autopilot keep the original drivetrain and tyre forces, checked against `7e96a57`.
- Keep brake-only S, manual pedals and neutral opposing steering. Steering never applies automatic brakes or cuts the throttle. No tutorial, coloured racing line, corner guide, braking markers or coaching footer.

## Measurement limits

The software renderer runs slowly (roughly 6–12 rendered frames per second). HUD speed, race clock, keyboard delivery and pose samples can lag one another. Pausing Unity can affect timing on resume, and speed is rounded to whole km/h. No reliable Unity simulation clock was recovered for the pose traces, so wall-clock durations must not be treated as exact physics durations. Position/heading changes and body-versus-travel angles provide stronger evidence than inferred wall-clock speeds. Reset, collision, wall and off-road portions are excluded from the numerical handling comparison.

The Unity physics source and constants were not recovered. These changes reproduce observed movement and the requested input semantics; **exact physics parity is not verified**. Long top-speed runs, wet-weather response, gamepad combinations and every starting-speed/tyre/upgrade configuration were not measured. Brake-only S is an explicit user requirement.

## Verification

`node tests/movement.cjs` exercises the actual controller and physics, including all 16 WASD/arrow mappings and moving combinations, between-frame taps, micro steering at three speeds, tighter controlled drift/recovery, measured longitudinal ranges, exact stopping without reverse, 30/60/120 Hz grouping, fuel, pit limits, ERS, DRS, loose surfaces and unchanged AI/autopilot trajectories. Browser checks use real keyboard events through the race controller, including short taps released before physics advances, opposing inputs, drift/recovery, Settings, pause/resume and Space respawn. Simulation time is advanced in fixed steps during browser input checks because rendering is slow.
