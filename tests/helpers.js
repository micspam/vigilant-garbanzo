const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const THREE_LOCAL = path.join(ROOT, 'node_modules/three/build/three.min.js');

/**
 * Open a game page from disk, serve Three.js locally instead of the CDN,
 * and collect every console error and uncaught exception.
 */
async function openGame(page, dir, hook) {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', route => route.fulfill({ path: THREE_LOCAL, contentType: 'application/javascript' }));
  await page.goto('file://' + path.join(ROOT, dir, 'index.html'));
  await page.waitForFunction(h => !!window[h], hook, { timeout: 30_000 });
  return errors;
}

module.exports = { openGame };
