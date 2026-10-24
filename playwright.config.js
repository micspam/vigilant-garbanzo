// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 240_000,
  workers: 1,
  reporter: [['list']],
  use: {
    viewport: { width: 1280, height: 720 },
    // Route 9 is WebGL; CI runners have no GPU, so use SwiftShader.
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
});
