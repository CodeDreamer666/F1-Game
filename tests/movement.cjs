const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual game controller and tyre physics on a flat, unobstructed test surface.
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const context = { module: { exports: {} } };
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const SIM = context.module.exports;
const dt = SIM.PHYS_DT;
const track = { cx: [0], cz: [0], rx: [0], rz: [1], surfaceAt: () => 0, pit: { limit: 22 } };
const env = { wet: 0, wearScale: 0, fuelRate: 0, pitLimiter: false, holdStart: false };
const raw = (steer = 0, throttle = 0, brake = 0) => ({ steer, throttle, brake, analog: false });
function rig(speed = 30) {
  const car = new SIM.Car({ driver: SIM.DRIVERS[0], isPlayer: true }, {});
  car.vx = car.u = car.speed = speed;
  car.gear = speed > 50 ? 7 : speed > 20 ? 4 : 1;
  car.rpm = 10000;
  car.input.ers = 0;
  return { car, handling: new SIM.PlayerHandling(), maxSlip: 0 };
}
function run(r, input, seconds, fps = 60) {
  const steps = Math.round(seconds / dt), perFrame = 240 / fps;
  for (let frame = 0; frame < steps; frame += perFrame) {
    for (let step = frame; step < Math.min(frame + perFrame, steps); step++) {
      r.handling.step(r.car, dt, { lightsOut: true, wet: 0 }, input);
      SIM.stepCarPhysics(r.car, dt, track, env);
      r.maxSlip = Math.max(r.maxSlip, Math.abs(r.car.slideAngle));
      for (const k of ['x', 'z', 'psi', 'speed', 'u', 'v', 'r']) assert.ok(Number.isFinite(r.car[k]), k);
    }
  }
  return r;
}

test('W accelerates; releasing it coasts rather than applying full brakes', () => {
  const drive = run(rig(60), raw(0, 1), 3);
  const coast = run(rig(60), raw(), 3);
  assert.ok(drive.car.speed > 70);
  assert.ok(coast.car.speed > 30 && coast.car.speed < 60);
  assert.equal(coast.car.input.brake, 0);
});

test('S stops and holds the car without selecting reverse or generating drive', () => {
  for (const input of [raw(0, 0, 1), raw(1, 0, 1), raw(0, 1, 1)]) {
    const r = run(rig(30), input, 8);
    assert.equal(r.car.speed, 0);
    assert.equal(r.car.u, 0);
    assert.equal(r.car.gear, 1);
    assert.equal(r.car.input.throttle, 0);
  }
  const stopped = run(rig(0), raw(1, 0, 1), 8);
  assert.equal(stopped.car.x, 0);
  assert.equal(stopped.car.z, 0);
  assert.equal(stopped.car.psi, 0);
});

test('steering never applies brakes or imposes a throttle cut at any speed', () => {
  for (const speed of [15, 30, 60, 85]) {
    for (const direction of [-1, 1]) {
      for (const analog of [false, true]) {
        const r = rig(speed);
        for (let step = 0; step < 240; step++) {
          r.handling.step(r.car, dt, { lightsOut: true, wet: 0 }, { ...raw(direction, 1), analog });
          assert.equal(r.car.input.brake, 0);
          // With no rear slip, steering cannot cut the requested throttle.
          if (step > 60 && Math.abs(r.car.slipA[2] + r.car.slipA[3]) / 2 <= 0.1) {
            assert.equal(r.car.input.throttle, 1);
          }
          SIM.stepCarPhysics(r.car, dt, track, env);
        }
        assert.ok(r.car.psi * direction > 0.1);
        assert.ok(r.car.speed > speed * 0.75);
      }
    }
  }
});

test('W+S+steering produces a bounded drift; S+steering stays planted', () => {
  const brake = run(rig(30), raw(1, 0, 1), 1);
  for (const direction of [-1, 1]) {
    const drift = run(rig(30), raw(direction, 1, 1), 1);
    assert.ok(drift.maxSlip > 0.06 && drift.maxSlip < 0.15);
    assert.ok(drift.maxSlip > brake.maxSlip + 0.05);
    assert.ok(drift.car.psi * direction > 0.4);
    assert.ok(drift.car.speed < 25 && drift.car.u > 0);
  }
  assert.equal(brake.handling.drift, 0);
  assert.ok(brake.maxSlip < 0.08);
});

test('drift entry at high speed uses a smaller slide angle', () => {
  const slow = run(rig(30), raw(1, 1, 1), 0.75);
  const fast = run(rig(85), raw(1, 1, 1), 0.75);
  assert.ok(fast.maxSlip < slow.maxSlip);
  assert.ok(fast.maxSlip < 0.25);
});

test('releasing the combination recovers grip, steering and acceleration', () => {
  const r = run(rig(30), raw(1, 1, 1), 1);
  const exitSpeed = r.car.speed;
  run(r, raw(0, 1), 2);
  assert.equal(r.handling.drift, 0);
  assert.equal(r.handling.steer, 0);
  assert.ok(Math.abs(r.car.slideAngle) < 0.02);
  assert.ok(Math.abs(r.car.r) < 0.02);
  assert.ok(r.car.speed > exitSpeed + 10);
});

test('dropping any one drift input ends the drift request', () => {
  for (const input of [raw(1, 1, 0), raw(1, 0, 1), raw(0, 1, 1)]) {
    const r = run(rig(30), raw(1, 1, 1), 0.5);
    run(r, input, 0.5);
    assert.equal(r.handling.drift, 0);
  }
});

test('changing steering direction responds without spinning', () => {
  const r = run(rig(30), raw(1, 1), 0.3);
  run(r, raw(-1, 1), 0.3);
  assert.ok(r.handling.steer < -0.9 && r.car.r < 0);
  assert.ok(r.maxSlip < 0.1);
});

test('physics produces the same movement with 30, 60 and 120 Hz frame grouping', () => {
  const snapshots = [30, 60, 120].map(fps => {
    const r = run(rig(30), raw(1, 1, 1), 0.5, fps);
    run(r, raw(0, 1), 1, fps);
    return ['x', 'z', 'psi', 'speed', 'r'].map(k => r.car[k]);
  });
  assert.deepEqual(snapshots[0], snapshots[1]);
  assert.deepEqual(snapshots[1], snapshots[2]);
});

// Targets come from the usable HUD segments in reference/poki-measurements.md.
// Allow for integer HUD rounding and the reference renderer's clock/display lag.
test('arcade acceleration matches the observed 35–158 km/h segment', () => {
  const r = run(rig(35 / 3.6), raw(0, 1), 1.85);
  assert.ok(r.car.speed * 3.6 > 145 && r.car.speed * 3.6 < 170);
});

test('coasting matches the observed 191–183 km/h segment', () => {
  const r = run(rig(191 / 3.6), raw(), 0.63);
  assert.ok(r.car.speed * 3.6 > 178 && r.car.speed * 3.6 < 188);
  assert.equal(r.car.input.brake, 0);
});

test('S sheds speed progressively like the observed 58–17 km/h segment', () => {
  const r = run(rig(58 / 3.6), raw(0, 0, 1), 2.69);
  assert.ok(r.car.speed * 3.6 > 13 && r.car.speed * 3.6 < 23);
  run(r, raw(0, 0, 1), 6);
  assert.ok(r.car.speed < 0.01 && r.car.u >= -0.01);
});

test('arcade force respects fuel exhaustion and the pit limiter', () => {
  const empty = rig(20); empty.car.fuel = 0;
  run(empty, raw(0, 1), 2);
  assert.ok(empty.car.speed < 20);
  const pit = rig(30);
  for (let i = 0; i < 480; i++) {
    pit.handling.step(pit.car, dt, { lightsOut: true, wet: 0 }, raw(0, 1));
    SIM.stepCarPhysics(pit.car, dt, track, { ...env, pitLimiter: true });
  }
  assert.ok(pit.car.speed < track.pit.limit + 0.5);
});

function headlessRace(count, cfg = {}) {
  const realTrack = new SIM.Track(SIM.TRACK_DEF);
  const entries = SIM.DRIVERS.slice(0, count).map(driver => ({ driver }));
  return new SIM.Session(realTrack, { type: 'race', laps: 1, difficulty: 0.8, entries, seed: 7, spectate: true, ...cfg });
}

test('bots drive through the same arcade handling as the player', () => {
  const sess = headlessRace(4);
  for (let frame = 0; frame < 60 * 110 && !sess.over; frame++) {
    sess.update(1 / 60, 1, 1e9);
    if (!sess.lightsOut) continue;
    for (const car of sess.cars) {
      assert.ok(car.ai.handling instanceof SIM.PlayerHandling);
      assert.equal(car.aids.arcade, true);
      assert.ok(car.gear >= 1, 'bots never reverse, like the player');
      assert.notEqual(car.ai.mode, 'recover');
    }
  }
  assert.ok(sess.over, 'every bot finished the lap');
  for (const car of sess.cars) assert.ok(car.finished && !car.dnf && car.penaltyLog.length === 0);
});

test('a bot command reaches the car exactly as the same player input would', () => {
  const player = rig(40), bot = rig(40);
  const sess = { lightsOut: true, wet: 0 };
  const ai = new SIM.AIDriver(bot.car, { track: { length: 1000 }, difficulty: 0.8 });
  for (let step = 0; step < 720; step++) {
    const cmd = { steer: Math.sin(step / 90), throttle: step % 300 < 200 ? 1 : 0, brake: step % 300 >= 240 ? 0.6 : 0, analog: true };
    player.handling.step(player.car, dt, sess, cmd);
    Object.assign(ai.cmd, cmd); ai.handling.step(bot.car, dt, sess, ai.cmd);
    SIM.stepCarPhysics(player.car, dt, track, env);
    SIM.stepCarPhysics(bot.car, dt, track, env);
  }
  assert.deepEqual(['x', 'z', 'psi', 'speed', 'r'].map(k => bot.car[k]), ['x', 'z', 'psi', 'speed', 'r'].map(k => player.car[k]));
});

test('the pit autopilot stops in the box using the arcade handling', () => {
  const sess = headlessRace(2, { laps: 2, spectate: false, entries: [{ driver: SIM.DRIVERS[0] }, { driver: SIM.DRIVERS[1], isPlayer: true }] });
  const p = sess.player; p.autoDrive = true; p.boxRequest = true; p.boxCompound = 'H';
  let stopped = false;
  for (let frame = 0; frame < 60 * 200 && !sess.over; frame++) {
    p.autopilot.boxThisLap = p.boxRequest;
    sess.update(1 / 60, 1, 1e9);
    if (sess.lightsOut && !p.inGarage) assert.equal(p.aids.arcade, true);
    if (p.pit && p.pit.phase === 'stopped') stopped = true;
  }
  assert.ok(stopped);
  assert.equal(p.pitStops, 1);
  assert.equal(p.tyre.c, 'H');
});

test('ERS and DRS still improve arcade speed; loose surfaces slow acceleration', () => {
  const standard = run(rig(60), raw(0, 1), 2);
  const boost = rig(60); boost.car.input.ers = 2;
  run(boost, raw(0, 1), 2);
  assert.ok(boost.car.speed > standard.car.speed);
  const drs = rig(60); drs.car.drsOpen = true;
  run(drs, raw(0, 1), 2);
  assert.ok(drs.car.speed > standard.car.speed);
  const gravel = rig(60);
  for (let i = 0; i < 480; i++) {
    gravel.handling.step(gravel.car, dt, { lightsOut: true, wet: 0 }, raw(0, 1));
    SIM.stepCarPhysics(gravel.car, dt, { ...track, surfaceAt: () => 3 }, env);
  }
  assert.ok(gravel.car.speed < standard.car.speed);
});


test('short digital steering taps produce prompt micro-adjustments at road speeds', () => {
  for (const speed of [15, 30, 60]) {
    for (const direction of [-1, 1]) {
      const short = run(rig(speed), raw(direction, 1), 0.06);
      assert.ok(short.car.psi * direction > 0.025);
      const reference = run(rig(speed), raw(direction, 1), 0.19);
      const angle = reference.car.psi * direction * 180 / Math.PI;
      assert.ok(angle > 7 && angle < 12, `speed ${speed}: ${angle} degrees`);
      const entryRate = reference.car.r;
      run(reference, raw(0, 1), 0.3);
      assert.ok(Math.abs(reference.car.r) < Math.abs(entryRate) * 0.06);
    }
  }
});

test('automatic drift tightens the arc promptly and releases without manual countersteer', () => {
  for (const direction of [-1, 1]) {
    const turn = run(rig(30), raw(direction, 1), 0.4);
    const drift = run(rig(30), raw(direction, 1, 1), 0.4);
    assert.ok(Math.abs(drift.car.psi) > Math.abs(turn.car.psi) * 1.15);
    assert.ok(drift.maxSlip > 0.05 && drift.maxSlip < 0.15);
    const speed = drift.car.speed;
    run(drift, raw(0, 1), 0.35);
    assert.equal(drift.handling.drift, 0);
    assert.ok(Math.abs(drift.car.slideAngle) < 0.015);
    assert.ok(drift.car.speed > speed);
  }
});

test('all 16 WASD states and their arrow equivalents reach the same controller inputs', () => {
  for (let bits = 0; bits < 16; bits++) {
    const expected = raw((bits & 8 ? 1 : 0) - (bits & 4 ? 1 : 0), bits & 1 ? 1 : 0, bits & 2 ? 1 : 0);
    for (const keys of [['KeyW', 'KeyS', 'KeyA', 'KeyD'], ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']]) {
      const keyboard = new SIM.KeyboardDriveInput();
      keys.forEach((key, i) => keyboard.setKey(key, !!(bits & 1 << i), 0));
      const input = keyboard.step(dt);
      for (const k of ['steer', 'throttle', 'brake', 'analog']) assert.equal(input[k], expected[k]);
    }
  }
});

test('a tap entirely between rendered frames still turns the real car', () => {
  const keyboard = new SIM.KeyboardDriveInput();
  keyboard.setKey('KeyW', true, 0);
  keyboard.step(dt);
  keyboard.setKey('KeyA', true, 1);
  keyboard.setKey('KeyA', false, 1.06);
  const r = rig(30);
  for (let i = 0; i < 60; i++) run(r, keyboard.step(dt), dt);
  assert.ok(r.car.psi < -0.06);
  assert.equal(keyboard.pending.length, 0);
  assert.equal(keyboard.step(dt).steer, 0);
});

test('buffered three-key drift preserves the combination and clears on reset', () => {
  const keyboard = new SIM.KeyboardDriveInput();
  for (const k of ['KeyW', 'KeyS', 'KeyD']) keyboard.setKey(k, true, 1);
  for (const k of ['KeyD', 'KeyS', 'KeyW']) keyboard.setKey(k, false, 1.08);
  const r = rig(30);
  for (let i = 0; i < 20; i++) run(r, keyboard.step(dt), dt);
  assert.ok(r.handling.drift > 0.5 && r.car.psi > 0.05);
  keyboard.reset();
  assert.equal(keyboard.pending.length, 0);
  assert.equal(keyboard.step(dt).steer, 0);
  assert.equal(keyboard.step(dt).throttle, 0);
  assert.equal(keyboard.step(dt).brake, 0);
});

test('a steering hold already consumed by physics gets no extra buffered turn', () => {
  const keyboard = new SIM.KeyboardDriveInput();
  keyboard.setKey('KeyA', true, 0);
  assert.equal(keyboard.step(dt).steer, -1);
  keyboard.setKey('KeyA', false, 1);
  assert.equal(keyboard.pending.length, 0);
  assert.equal(keyboard.step(dt).steer, 0);
});


test('all moving key combinations have the expected turn, brake and drift behavior', () => {
  for (let bits = 0; bits < 16; bits++) {
    const keyboard = new SIM.KeyboardDriveInput();
    ['KeyW', 'KeyS', 'KeyA', 'KeyD'].forEach((k, i) => keyboard.setKey(k, !!(bits & 1 << i), 0));
    const input = keyboard.step(dt), r = run(rig(30), input, 0.4);
    if (input.steer) assert.ok(r.car.psi * input.steer > 0.1);
    else assert.equal(r.car.psi, 0);
    const drift = input.throttle && input.brake && input.steer;
    assert.equal(r.handling.drift > 0, !!drift);
    if (input.brake && !drift) {
      assert.equal(r.car.input.throttle, 0);
      assert.ok(r.car.speed < 30);
    }
    assert.ok(r.car.u > 0);
  }
});

test('respawn discards queued taps while preserving currently held pedals', () => {
  const keyboard = new SIM.KeyboardDriveInput();
  keyboard.setKey('KeyW', true, 0);
  keyboard.step(dt);
  keyboard.setKey('KeyD', true, 1);
  keyboard.setKey('KeyD', false, 1.06);
  assert.ok(keyboard.pending.length);
  keyboard.clearPending();
  assert.equal(keyboard.pending.length, 0);
  assert.equal(keyboard.step(dt).throttle, 1);
  assert.equal(keyboard.step(dt).steer, 0);
});
