import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Primary workspaces' })).toBeVisible();
});

test('all eight functional workspaces are reachable', async ({ page }) => {
  const workspaces = [
    ['Mission Control', 'EARTH SYSTEM'],
    ['Vehicle Design', 'VEHICLE DESIGN'],
    ['Mission Planning', 'MISSION PLANNING'],
    ['Simulation', 'No simulation selected'],
    ['Analysis', 'Analysis requires a run'],
    ['Comparison', 'Two runs are required'],
    ['Laboratory', 'IDEAL ROCKET EQUATION'],
    ['Documentation', 'OVERVIEW'],
  ];
  for (const [navigation, content] of workspaces) {
    await page.getByRole('button', { name: navigation, exact: true }).click();
    await expect(page.getByText(content, { exact: false }).first()).toBeVisible();
  }
});

test('synthetic scenario produces stored telemetry, playback and analysis', async ({ page }) => {
  await page.getByRole('button', { name: 'Mission Planning', exact: true }).click();
  await page.getByRole('button', { name: 'Run simulation', exact: true }).click();
  await expect(page.getByText('Stored numerical run')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Actual saved run playback')).toBeVisible();
  await page.getByRole('button', { name: 'Analyze run' }).click();
  await expect(page.getByText('Key results')).toBeVisible();
  await expect(page.getByLabel('Altitude chart')).toBeVisible();
});

test('theme switch preserves readable shell', async ({ page }) => {
  await page.getByRole('button', { name: 'Use light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByText('Mission Control', { exact: true }).first()).toBeVisible();
});
