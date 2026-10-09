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
    assert.ok(r.car.speed < 0.01);
    assert.ok(r.car.u >= -0.01);
    assert.equal(r.car.gear, 1);
    assert.equal(r.car.input.throttle, 0);
  }
  const stopped = run(rig(0), raw(1, 0, 1), 8);
  assert.equal(stopped.car.x, 0);
  assert.equal(stopped.car.z, 0);
  assert.equal(stopped.car.psi, 0);
});

test('held steering turns and sheds speed; quick taps preserve momentum', () => {
  const held = run(rig(60), raw(1, 1), 3);
  const tapped = rig(60);
  for (let n = 0; n < 12; n++) {
    run(tapped, raw(1, 1), 0.05);
    run(tapped, raw(0, 1), 0.2);
  }
  assert.ok(held.car.psi > 0.5);
  assert.ok(held.car.speed < 30);
  assert.ok(tapped.car.speed > held.car.speed + 25);
  assert.ok(held.maxSlip < 0.1);
});

test('W+S+steering produces a bounded drift; S+steering stays planted', () => {
  const brake = run(rig(30), raw(1, 0, 1), 1);
  for (const direction of [-1, 1]) {
    const drift = run(rig(30), raw(direction, 1, 1), 1);
    assert.ok(drift.maxSlip > 0.15 && drift.maxSlip < 0.5);
    assert.ok(drift.maxSlip > brake.maxSlip + 0.1);
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
