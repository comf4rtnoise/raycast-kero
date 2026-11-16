import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { KeroClient, KeroError, localEnvironment, resolveKeroPath, runKero } from "../src/lib/kero";

async function fakeKero(source: string, run: (binary: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "raycast kero test "));
  const binary = join(directory, "fake kero");
  try {
    await writeFile(binary, `#!${process.execPath}\n${source}\n`, { mode: 0o755 });
    await run(binary);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function hasKind(kind: string) {
  return (error: unknown) => error instanceof KeroError && error.kind === kind;
}

test("removes inherited target/host without mutating parent environment", () => {
  const source = { KERO_HOST: "remote", KERO_SESSION: "session", KERO_PANE: "pane", PATH: "/usr/bin", HOME: "/home" };
  assert.deepEqual(localEnvironment(source), { PATH: "/usr/bin", HOME: "/home" });
  assert.equal(source.KERO_HOST, "remote");
});

test("explicit executable path supports spaces; bad preferences never silently fall back", async () => {
  await fakeKero("", async (binary) => assert.equal(await resolveKeroPath(binary), binary));
  await assert.rejects(resolveKeroPath("/does/not/exist/kero"), hasKind("missing-cli"));
  await assert.rejects(resolveKeroPath("./kero"), hasKind("missing-cli"));
});

test("passes arguments literally without shell expansion", async () => {
  await fakeKero("console.log(JSON.stringify(process.argv.slice(2)))", async (binary) => {
    const args = ["focus", "a b; $(touch /tmp/should-not-run)"];
    assert.deepEqual(JSON.parse(await runKero(binary, args)), args);
  });
});

test("client reads JSON and focuses only an explicit pane", async () => {
  await fakeKero(
    `
    const args = process.argv.slice(2);
    if (args[0] === 'ls') console.log(JSON.stringify([{id:'s',panes:[{id:'p'}]}]));
    else if (args[0] === 'projects') console.log(JSON.stringify([{id:'project',name:'Project'}]));
    else if (JSON.stringify(args) !== JSON.stringify(['focus','p'])) process.exit(2);
  `,
    async (binary) => {
      const client = new KeroClient(binary);
      assert.equal((await client.sessions())[0].panes[0].id, "p");
      assert.equal((await client.projects())[0].id, "project");
      await client.focus("p");
      await assert.rejects(client.focus("--all"), hasKind("missing-target"));
      await assert.rejects(client.focus(""), hasKind("missing-target"));
    },
  );
});

for (const [code, kind] of [
  [3, "missing-target"],
  [4, "unreachable"],
  [1, "failed"],
  [2, "failed"],
] as const) {
  test(`maps CLI exit ${code} to ${kind}`, async () => {
    await fakeKero(`console.error('Remote control denied'); process.exit(${code});`, async (binary) => {
      await assert.rejects(runKero(binary, ["focus", "p"]), hasKind(kind));
    });
  });
}

test("reports invalid JSON instead of crashing the list", async () => {
  await fakeKero("console.log('not json')", async (binary) => {
    await assert.rejects(new KeroClient(binary).sessions(), hasKind("invalid-data"));
  });
});

test("missing executable produces actionable error", async () => {
  await assert.rejects(runKero("/does/not/exist/kero", ["ls"]), hasKind("missing-cli"));
});

test("an aborted request stops its child process", async () => {
  await fakeKero("setInterval(() => {}, 1000)", async (binary) => {
    const controller = new AbortController();
    const pending = runKero(binary, ["ls"], controller.signal);
    controller.abort();
    await assert.rejects(pending, (error: unknown) => error instanceof Error && error.name === "AbortError");
  });
});

test("a hung CLI is terminated by the timeout", async () => {
  await fakeKero("setInterval(() => {}, 1000)", async (binary) => {
    await assert.rejects(runKero(binary, ["ls"]), hasKind("timeout"));
  });
});
