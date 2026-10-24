# Self-review

Claude reviewed its own code before anyone else did. Items are numbered so a review can refer to them ("that's #6"). Each has a severity:

- **Fix:** a real defect or risk.
- **Debt:** works, but would hurt as the project grows.
- **Nit:** style.

Paths are `route-9/index.html` (R9) and `orbit-line/index.html` (OL).

## Structure

**1. Debt: each game is one giant file.** R9 is about 1,520 lines and OL about 1,060, with HTML, CSS, rendering, physics, game rules, UI and audio in one `<script>`. That suited quick iteration and single-file publishing. It is not how you'd structure something you plan to maintain.

**2. Debt: everything is global, mutable state.** `bus`/`ship`, `game`, `riders` and `keys` are module-level objects that any function can change. Update order matters, but nothing enforces it beyond the order of calls in `update()`. This is also why the tests drive whole games through hooks instead of unit-testing functions.

**3. Debt: the two games duplicate their systems.**
- **Shared ideas:** riders, mood, behaviours, slapping, stop dwell (boarding and alighting queues), dispatcher messages, unlocks, save data, the end-of-shift screen and the synth audio.
- **Copied code:** they were adapted from one game to the other, not extracted into a shared module.
- **Consequence:** a rules change has to be made twice, and the two copies have already drifted. For example, OL removes ejected riders with a `setTimeout`, while R9 uses `removeAt`.

**4. Fix: test hooks ship to production.** `window.__r9` and `window.__ol` give the console full control of the game, including a `step()` that advances time. They should sit behind a query flag or be stripped from the published build.

## Readability

**5. Nit: dense one-line functions and very long lines.** The longest line is about 500 characters. Many functions are written as a single line. Hard to read and hard to diff.

**6. Nit: terse names.** `g`, `r`, `st`, `sp`, `dr`, `rr`, `rr2`, `fy`, `hy`, `lw`. Most are local and obvious in context. Several are not.

**7. Debt: magic numbers everywhere.**
- **Physics:** thrust 250, reverse 140, stabiliser 170, top speed 560 (OL); acceleration 6.5, braking 16–20, wheelbase 6.2 (R9).
- **Mood:** drain of 4.5 per second near an offender, unfair-slap penalty 40, fair-slap bonus 7, thank-you threshold 55.
- **Layout:** cabin seat coordinates and the dashboard layout in pixels.

None of these are named constants or grouped in a tuning table. They are also untuned guesses (see #18).

## Correctness and robustness

**8. Fix: game speed depends on frame rate below 20 fps.** `dt` is capped at 0.05 s per frame. On a slow machine the whole game, shift clock included, runs in slow motion instead of dropping frames. A fixed-timestep loop with an accumulator would fix it.

**9. Fix: ejection uses wall-clock time in OL.** `onTag(…, 'door')` removes ejected riders after `setTimeout(…, 300)`, which keeps running when the game is paused. In practice it's harmless, but it's the only timer outside the game clock.

**10. Debt: unversioned save data.** Both games store `{ total, day, variant }` in `localStorage` with no version field. Any future change to the format has no migration path. Reads and writes are wrapped in `try/catch`, so missing or blocked storage is handled.

**11. Fix: no Subresource Integrity on the Three.js script tag.** R9 loads `three.min.js` from cdnjs without an `integrity` hash. The version is pinned, but a hash would protect against the CDN serving something else.

**12. Debt: crude simulation in R9.**
- Passengers walk through seats and poles.
- Pedestrians knocked over by the bus are teleported back to respawn.
- Traffic ignores other traffic and junctions.
- Bus collisions use four circles against axis-aligned boxes, so it can snag on corners.

Fine for a greybox; listed so nobody thinks it's hidden.

**13. Debt: imprecise hit-testing in OL.** `riderAt()` uses bounding boxes. Back-row and front-row passengers overlap on screen, so clicking a gap near an overlap can hit the passenger you didn't mean. Front-row passengers take priority by design.

## Performance

**14. Debt: R9 has no draw-call budget.**
- **Draw calls:** hundreds of separate meshes, because buildings, figures, fences and props aren't merged or instanced.
- **Per-frame work:** the shadow map re-renders every frame, the rear-view mirror renders the whole scene every other frame, and there's a full-screen post-process pass.
- **Testing:** only measured under software rendering in CI, never on a real GPU, so frame rate on low-end hardware is unknown.

**15. Nit: per-frame DOM queries in OL.** `tick()` calls `document.querySelector` for the dispatch and toast elements every frame. Cheap, but it should cache them.

## Accessibility

**16. Fix: the OL proximity alarm flashes at the WCAG threshold.** Both the cabin border and the HUD warning toggle at 3 Hz. WCAG 2.3.1 allows at most three flashes per second, so this sits exactly on the line. It should flash slower or pulse smoothly instead. Also:
- **Reduced motion:** the solar-flare white-out and camera shake ignore `prefers-reduced-motion`.
- **Controls:** keys can't be remapped.
- **Screen readers:** game state exists only on the canvas, so there's nothing for them to read.

## Tests

**17. Debt: the tests are integration tests that rely on hooks.** Each test drives a whole game through `window.__r9` / `window.__ol`, including scripted autopilots with hard-coded waypoints. They prove the main paths work end to end. They don't unit-test the pure logic (collision, docking checks, mood maths), and a layout change could break an autopilot without any real bug. R9's tests also need a software WebGL renderer, SwiftShader, which is slow.

One of these tests had a bug of its own. It measured a passenger's mood after docking, which legitimately raises mood, so it failed intermittently. Found and fixed during packaging; the suite has since passed 30 runs out of 30.

## Product

**18. Fix: nobody has played this by hand.** Handling, docking tolerance, the timer, mood drain and unlock thresholds were all chosen once and checked only by autopilot. An automated test can confirm a shift is completable. It can't tell you whether drifting is fun or frustrating. That needs a person.
