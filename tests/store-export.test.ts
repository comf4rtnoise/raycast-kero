import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const root = join(__dirname, "..");
const script = join(root, "scripts/export-store.mjs");
const json = (file: string) => JSON.parse(readFileSync(file, "utf8"));

test("Store export excludes development material without deleting the independent repository's tests or licenses", () => {
  const destination = mkdtempSync(join(tmpdir(), "kero-store-export-"));
  try {
    writeFileSync(join(destination, "package.json"), JSON.stringify({ name: "kero" }));
    writeFileSync(join(destination, "LICENSE"), "old per-extension license");
    mkdirSync(join(destination, "tests"));
    writeFileSync(join(destination, "tests/old.test.ts"), "old test");
    const result = spawnSync(process.execPath, [script, destination], { encoding: "utf8", timeout: 90_000 });
    assert.equal(result.status, 0, result.stderr);
    for (const file of ["tests", "scripts", "LICENSE", "RELEASING.md", "raycast-env.d.ts", "node_modules"]) {
      assert.equal(existsSync(join(destination, file)), false, file);
    }
    assert.ok(existsSync(join(root, "LICENSE")));
    assert.ok(existsSync(join(root, "tests/session-creation.test.ts")));
    assert.equal(
      readFileSync(join(destination, "assets/licenses/Kero-MIT.txt"), "utf8"),
      readFileSync(join(root, "assets/licenses/Kero-MIT.txt"), "utf8"),
    );
    assert.equal(
      readFileSync(join(destination, "src/new-session.tsx"), "utf8"),
      readFileSync(join(root, "src/new-session.tsx"), "utf8"),
    );
    const manifest = json(join(destination, "package.json"));
    assert.equal(manifest.scripts.test, undefined);
    assert.equal(manifest.scripts["export:store"], undefined);
    assert.equal(manifest.scripts.publish, "npx @raycast/api@latest publish");
    assert.equal(manifest.devDependencies.tsx, undefined);
    assert.equal(
      manifest.dependencies["@raycast/utils"],
      json(join(root, "package.json")).dependencies["@raycast/utils"],
    );
    const lock = json(join(destination, "package-lock.json"));
    assert.deepEqual(lock.packages[""].devDependencies, manifest.devDependencies);
    assert.equal(lock.packages["node_modules/tsx"], undefined);
    assert.deepEqual(json(join(destination, "tsconfig.json")).include, ["src/**/*", "raycast-env.d.ts"]);
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});

test("Store export refuses to overwrite the development repository or unrelated folders", () => {
  const self = spawnSync(process.execPath, [script, root], { encoding: "utf8" });
  assert.notEqual(self.status, 0);
  assert.match(self.stderr, /outside the development repository/);
  const destination = mkdtempSync(join(tmpdir(), "kero-store-unrelated-"));
  try {
    writeFileSync(join(destination, "keep.txt"), "untouched");
    const result = spawnSync(process.execPath, [script, destination], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.equal(readFileSync(join(destination, "keep.txt"), "utf8"), "untouched");
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});

test("Store export refuses unexpected private material in the destination", () => {
  const destination = mkdtempSync(join(tmpdir(), "kero-store-private-"));
  try {
    writeFileSync(join(destination, "package.json"), JSON.stringify({ name: "kero" }));
    writeFileSync(join(destination, "RELEASING.md"), "local-only");
    const result = spawnSync(process.execPath, [script, destination], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Review unexpected destination entry/);
    assert.equal(readFileSync(join(destination, "RELEASING.md"), "utf8"), "local-only");
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});
