// Route 9: the 3D bus greybox.
const { test, expect } = require('@playwright/test');
const { openGame } = require('./helpers');

test('title screen shows, and a shift starts on click', async ({ page }, info) => {
  const errors = await openGame(page, 'route-9', '__r9');
  await expect(page.locator('#title')).toBeVisible();
  await page.screenshot({ path: info.outputPath('title.png') });
  await page.click('#startBtn');
  await expect(page.locator('#title')).toBeHidden();
  expect(await page.evaluate(() => __r9.game.mode)).toBe('play');
  await page.evaluate(() => { __r9.look.yaw = 0; __r9.look.pitch = -0.08; __r9.keys.up = 1; __r9.step(45, 1 / 30); __r9.keys.up = 0; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: info.outputPath('cab.png') });
  expect(errors).toEqual([]);
});

test('autopilot drives the whole route and every stop is served', async ({ page }, info) => {
  const errors = await openGame(page, 'route-9', '__r9');
  const result = await page.evaluate(() => {
    const R = __r9; R.startShift();
    const legs = [
      [[-20, -37.5], [0, -37.5]],
      [[-115, -42.5], [-165, -42.5]],
      [[-125, -40], [-122.5, 40], [-122.5, 117.5], [-40, 117.5], [40, 122.5], [80, 122.5]],
      [[117.5, 122.5], [117.5, -37.5], [145, -32], [162, -48], [182, -50], [198, -34], [205, -9]],
    ];
    const steer = (tx, tz) => {
      const fx = -Math.sin(R.bus.yaw), fz = -Math.cos(R.bus.yaw), dx = tx - R.bus.x, dz = tz - R.bus.z;
      const ang = Math.atan2(fx * dz - fz * dx, fx * dx + fz * dz);
      R.keys.left = ang < -0.04 ? 1 : 0; R.keys.right = ang > 0.04 ? 1 : 0;
      return { d: Math.hypot(dx, dz), ang };
    };
    for (const leg of legs) {
      for (let wi = 0; wi < leg.length; wi++) {
        const last = wi === leg.length - 1; let n = 0;
        while (n++ < 4000 && R.game.mode === 'play') {
          const s = steer(leg[wi][0], leg[wi][1]);
          const target = last ? Math.min(14, s.d * 0.9) : (Math.abs(s.ang) > 0.5 ? 6 : 15);
          R.keys.up = R.bus.speed < target ? 1 : 0; R.keys.brake = R.bus.speed > target + 2 ? 1 : 0;
          if (last && s.d < 3) { R.keys.up = 0; R.keys.brake = 1; }
          if (!last && s.d < 7) break;
          if (last && s.d < 4 && Math.abs(R.bus.speed) < 0.3) break;
          R.step(1, 1 / 30);
        }
      }
      Object.assign(R.keys, { up: 0, left: 0, right: 0, brake: 1 });
      let n = 0; while (n++ < 600 && (R.game.dwell || n < 30) && R.game.mode === 'play') R.step(1, 1 / 30);
      R.keys.brake = 0;
    }
    return { stops: R.game.stats.stops, ty: R.game.ty, corn: R.game.stats.corn, mode: R.game.mode };
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: info.outputPath('after-route.png') });
  expect(result.stops).toBeGreaterThanOrEqual(4);
  expect(result.corn).toBeGreaterThan(0); // the route cuts through the cornfield
  expect(errors).toEqual([]);
});

test('rules: fair slaps give strikes, two strikes means ejection, unfair slaps cost mood', async ({ page }) => {
  const errors = await openGame(page, 'route-9', '__r9');
  const r = await page.evaluate(() => {
    const R = __r9, T = THREE; R.startShift();
    const aim = p => { const v = new T.Vector3(); p.fig.body.getWorldPosition(v); const l = p.g.parent.worldToLocal(v.clone()); const dx = l.x + 0.62, dy = l.y - 2.32, dz = l.z + 4.1; R.look.yaw = Math.atan2(-dx, -dz); R.look.pitch = Math.atan2(dy, Math.hypot(dx, dz)); R.step(1, 1 / 60); };
    const seated = R.riders.filter(p => p.state === 'seated').sort((a, b) => Math.hypot(a.seat.x + 0.62, a.seat.z + 4.1) - Math.hypot(b.seat.x + 0.62, b.seat.z + 4.1));
    const target = seated[0]; target.dest = 3; R.game.rules = ['snore', 'call'];
    target.beh = 'snore'; target.behT = 20; aim(target); R.slap(); R.step(40, 1 / 60);
    const afterOne = { strikes: target.strikes, out: target.out };
    target.beh = 'call'; target.behT = 20; aim(target); R.slap(); R.step(40, 1 / 60);
    const afterTwo = { strikes: target.strikes, out: target.out };
    const unfairBefore = R.game.stats.unfair;
    R.riders.forEach(p => { if (p.state === 'seated' && p !== target) { p.beh = null; p.nextBeh = 1e9; } });
    aim(seated[1]); R.slap(); R.step(40, 1 / 60);
    const unfair = R.game.stats.unfair - unfairBefore;
    Object.assign(R.bus, { x: -2, z: -37.5, speed: 0, yaw: -Math.PI / 2 }); R.keys.brake = 1;
    let n = 0; while (n++ < 900 && R.game.stats.stops === 0) R.step(1, 1 / 30);
    return { afterOne, afterTwo, unfair, ejected: R.game.stats.ejected, stops: R.game.stats.stops };
  });
  expect(r.afterOne).toEqual({ strikes: 1, out: false });
  expect(r.afterTwo).toEqual({ strikes: 2, out: true });
  expect(r.unfair).toBe(1);
  expect(r.stops).toBe(1);
  expect(r.ejected).toBe(1);
  expect(errors).toEqual([]);
});

test('driving off mid-stop closes the doors and moves the route on', async ({ page }) => {
  const errors = await openGame(page, 'route-9', '__r9');
  const r = await page.evaluate(() => {
    const R = __r9; R.startShift();
    Object.assign(R.bus, { x: -2, z: -37.5, speed: 0, yaw: -Math.PI / 2 }); R.keys.brake = 1;
    let n = 0; while (n++ < 60 && !R.game.dwell) R.step(1, 1 / 30);
    const docked = !!R.game.dwell; R.keys.brake = 0; R.keys.up = 1;
    n = 0; while (n++ < 120 && R.game.dwell) R.step(1, 1 / 30);
    return { docked, stillDwelling: !!R.game.dwell, next: R.STOPS[R.game.next].name };
  });
  expect(r).toEqual({ docked: true, stillDwelling: false, next: 'Old Mill' });
  expect(errors).toEqual([]);
});

test('phone width: the start button is reachable', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = await openGame(page, 'route-9', '__r9');
  await page.locator('#startBtn').scrollIntoViewIfNeeded();
  await expect(page.locator('#startBtn')).toBeVisible();
  await expect(page.locator('#touch')).toBeVisible();
  expect(errors).toEqual([]);
  await ctx.close();
});
