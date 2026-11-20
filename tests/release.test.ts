import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = join(__dirname, "..");

test("the npm prepublish guard fails locally and directs users to the reviewed Store export", () => {
  // Execute only the guard, never npm publish (not even its dry-run mode).
  const result = spawnSync("npm", ["run", "prepublishOnly"], { cwd: root, encoding: "utf8", timeout: 10_000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /npm run export:store/);
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.match(manifest.scripts.publish, /Do not publish the development repository/);
  assert.match(manifest.scripts.publish, /process\.exit\(1\)/);
  assert.doesNotMatch(manifest.scripts.publish, /npx|ray publish/);
  assert.equal(manifest.scripts["export:store"], "node scripts/export-store.mjs");
});

test("CLI override is optional text input with automatic detection as the default", () => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(manifest.preferences.length, 1);
  assert.deepEqual(manifest.preferences[0], {
    name: "keroPath",
    type: "textfield",
    required: false,
    title: "Kero CLI Path",
    description: "Leave empty for auto-detection.",
    placeholder: "/usr/local/bin/kero",
  });
  for (const command of manifest.commands) assert.equal(command.preferences, undefined);
  for (const file of ["src/search-sessions.tsx", "src/new-session.tsx"]) {
    const content = readFileSync(join(root, file), "utf8");
    assert.match(content, /getPreferenceValues<Preferences>/);
    assert.match(content, /openExtensionPreferences/);
  }
});

test("changelog release headings follow Raycast's bracketed title and date format", () => {
  const headings = readFileSync(join(root, "CHANGELOG.md"), "utf8")
    .split("\n")
    .filter((line) => line.startsWith("## "));
  assert.ok(headings.length > 0);
  for (const heading of headings) {
    assert.match(heading, /^## \[[^\]]+\] - (?:\{PR_MERGE_DATE\}|\d{4}-\d{2}-\d{2})$/);
  }
});
