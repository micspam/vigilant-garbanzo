// Orbit Line 42: the 2D space version.
const { test, expect } = require('@playwright/test');
const { openGame } = require('./helpers');

test('title screen shows, and a shift starts on click', async ({ page }, info) => {
  const errors = await openGame(page, 'orbit-line', '__ol');
  await expect(page.locator('#title')).toBeVisible();
  await page.click('#startBtn');
  await expect(page.locator('#title')).toBeHidden();
  expect(await page.evaluate(() => __ol.game.mode)).toBe('play');
  await page.evaluate(() => { __ol.keys.thrust = 1; __ol.step(40, 1 / 30); __ol.keys.thrust = 0; __ol.step(20, 1 / 30); });
  await page.screenshot({ path: info.outputPath('space.png') });
  await page.evaluate(() => { __ol.toggleView(); __ol.step(10, 1 / 30); });
  await page.screenshot({ path: info.outputPath('cabin.png') });
  expect(await page.evaluate(() => __ol.game.view)).toBe('cabin');
  expect(errors).toEqual([]);
});

test('autopilot flies the whole route with inertia and gravity and docks at every station', async ({ page }, info) => {
  const errors = await openGame(page, 'orbit-line', '__ol');
  const result = await page.evaluate(() => {
    const O = __ol, s = O.ship; O.startShift();
    const legs = [
      [[-600, -1260], [600, -1460], [1630, -1140]],
      [[2350, -300], [2250, 700], [1500, 1150]],
      [[1150, 2350], [-500, 2560], [-1500, 1950], [-1560, 1290]],
      [[-2350, 420], [-2250, -480], [-1500, -715]],
    ];
    const fly = (tx, ty, final) => {
      let n = 0;
      while (n++ < 5000 && O.game.mode === 'play') {
        if (final && O.game.dwell) return 'docked';
        const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
        if (!final && d < 160) return 'waypoint';
        const vmax = final ? Math.min(300, Math.sqrt(2 * 120 * Math.max(0, d - 10)) * 0.7 + 8) : 330;
        const dvx = dx / d * vmax - s.vx, dvy = dy / d * vmax - s.vy;
        const da = Math.atan2(Math.sin(Math.atan2(dvy, dvx) - s.a), Math.cos(Math.atan2(dvy, dvx) - s.a));
        O.keys.left = da < -0.05 ? 1 : 0; O.keys.right = da > 0.05 ? 1 : 0;
        O.keys.thrust = Math.abs(da) < 0.35 && Math.hypot(dvx, dvy) > 12 ? 1 : 0;
        O.keys.brake = (Math.hypot(s.vx, s.vy) > vmax + 40 || (final && d < 60 && Math.hypot(s.vx, s.vy) > 30)) ? 1 : 0;
        O.step(1, 1 / 30);
      }
      return 'timeout';
    };
    const outcomes = [];
    for (const leg of legs) {
      leg.forEach(([x, y], i) => outcomes.push(fly(x, y, i === leg.length - 1)));
      Object.keys(O.keys).forEach(k => O.keys[k] = 0);
      let n = 0; while (n++ < 900 && O.game.dwell && O.game.mode === 'play') O.step(1, 1 / 30);
    }
    return { outcomes, stops: O.game.stats.stops, ty: O.game.ty, mode: O.game.mode };
  });
  await page.screenshot({ path: info.outputPath('after-route.png') });
  expect(result.outcomes).not.toContain('timeout');
  expect(result.stops).toBe(4);
  expect(result.ty).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('rules: fair slaps give strikes, two strikes means the airlock, unfair slaps cost mood', async ({ page }) => {
  const errors = await openGame(page, 'orbit-line', '__ol');
  const r = await page.evaluate(() => {
    const O = __ol; O.startShift(); O.toggleView();
    const seated = O.riders.filter(p => p.state === 'seated'); const target = seated[0]; target.dest = 3; O.game.rules = ['float', 'hum'];
    target.beh = 'float'; target.behT = 20; O.slap(target); O.step(30, 1 / 60);
    const afterOne = { strikes: target.strikes, out: target.out };
    target.beh = 'hum'; target.behT = 20; O.slap(target); O.step(30, 1 / 60);
    const afterTwo = { strikes: target.strikes, out: target.out };
    const innocent = seated[1]; innocent.beh = 'glow'; innocent.behT = 20; const before = innocent.mood;
    O.slap(innocent); O.step(30, 1 / 60);
    const moodDrop = before - innocent.mood; // measure now: docking below legitimately raises mood again
    const hitTest = O.riderAt(target.seat.x, target.seat.y - 30) === target;
    const st = O.STATIONS[O.game.next]; Object.assign(O.ship, { x: st.px, y: st.py, vx: 5, vy: 0 });
    let n = 0; while (n++ < 900 && !O.game.stats.stops) O.step(1, 1 / 30);
    return { afterOne, afterTwo, unfair: O.game.stats.unfair, moodDrop, hitTest, ejected: O.game.stats.ejected };
  });
  expect(r.afterOne).toEqual({ strikes: 1, out: false });
  expect(r.afterTwo).toEqual({ strikes: 2, out: true });
  expect(r.unfair).toBe(1);
  expect(r.moodDrop).toBeGreaterThanOrEqual(30);
  expect(r.hitTest).toBe(true);
  expect(r.ejected).toBe(1);
  expect(errors).toEqual([]);
});

test('thrusting while docked undocks with the airlock open', async ({ page }) => {
  const errors = await openGame(page, 'orbit-line', '__ol');
  const r = await page.evaluate(() => {
    const O = __ol; O.startShift();
    const st = O.STATIONS[O.game.next]; Object.assign(O.ship, { x: st.px, y: st.py, vx: 0, vy: 0 });
    let n = 0; while (n++ < 60 && !O.game.dwell) O.step(1, 1 / 30);
    const docked = !!O.game.dwell; O.keys.thrust = 1; O.step(3, 1 / 30); O.keys.thrust = 0;
    return { docked, stillDocked: !!O.game.dwell };
  });
  expect(r).toEqual({ docked: true, stillDocked: false });
  expect(errors).toEqual([]);
});

test('phone width: the start button is reachable and touch controls appear', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = await openGame(page, 'orbit-line', '__ol');
  await page.locator('#startBtn').scrollIntoViewIfNeeded();
  await expect(page.locator('#startBtn')).toBeVisible();
  await expect(page.locator('#touch')).toBeVisible();
  expect(errors).toEqual([]);
  await ctx.close();
});
