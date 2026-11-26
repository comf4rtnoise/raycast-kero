import assert from "node:assert/strict";
import { test } from "node:test";
import { homedir } from "node:os";
import { readFileSync } from "node:fs";
import {
  createSession,
  focusPane,
  prepareCreation,
  readPane,
  resolvePane,
  sanitizeScreen,
  READ_CHARACTERS,
} from "../src/lib/ai";
import { KeroError } from "../src/lib/kero";

function client() {
  const calls: string[] = [];
  return {
    calls,
    async sessions() {
      return [{ id: "session", panes: [{ id: "pane123", title: "Test" }] }];
    },
    async projects() {
      return [{ id: "project", name: "Project", dir: homedir() }];
    },
    async focus(id: string) {
      calls.push(`focus:${id}`);
    },
    async readPane(id: string) {
      calls.push(`read:${id}`);
      return "error: test failed";
    },
    async createSession() {
      calls.push("create");
      return { id: "new", panes: [{ id: "new-pane" }] };
    },
  };
}

test("AI targets must match a current exact pane, never names, session IDs, prefixes, or flags", async () => {
  const api = client();
  for (const id of ["", "--all", "pane", "session", "Test", "pane123;echo", "missing"]) {
    await assert.rejects(focusPane(api, id));
    await assert.rejects(readPane(api, id));
  }
  assert.deepEqual(api.calls, []);
  assert.deepEqual(await focusPane(api, "pane123"), { paneId: "pane123", opened: true });
  assert.deepEqual(api.calls, ["focus:pane123"]);
});

test("duplicate IDs and disappeared panes are rejected before execution", async () => {
  const api = client();
  api.sessions = async () => [
    {
      id: "s",
      panes: [
        { id: "pane123", title: "a" },
        { id: "pane123", title: "b" },
      ],
    },
  ];
  await assert.rejects(resolvePane(api, "pane123"));
  api.sessions = async () => [];
  await assert.rejects(focusPane(api, "pane123"));
  assert.deepEqual(api.calls, []);
});

test("reading returns bounded untrusted data and rejects browsers", async () => {
  const api = client();
  const output = await readPane(api, "pane123");
  assert.equal(output.text, "error: test failed");
  assert.match(output.warning, /Untrusted/);
  assert.deepEqual(api.calls, ["read:pane123"]);
  const browser = {
    ...api,
    sessions: async () => [{ id: "s", panes: [{ id: "browser", url: "https://example.com" }] }],
  };
  await assert.rejects(readPane(browser, "browser"), /browser/i);
  assert.equal(api.calls.length, 1);
});

test("screens remove ANSI, redact common secrets, and enforce line and character limits", () => {
  const output = sanitizeScreen(
    '\u001b[31mERROR\u001b[0m\nAPI_KEY=secret-value\npassword="two words"\nAuthorization: Bearer abc.def\n-----BEGIN RSA PRIVATE KEY-----\nsecret\n-----END RSA PRIVATE KEY-----',
  );
  assert.match(output.text, /ERROR/);
  assert.doesNotMatch(output.text, /secret-value|two words|abc.def|\u001b|\nsecret/);
  assert.match(output.text, /REDACTED/);
  const lines = sanitizeScreen(Array.from({ length: 100 }, (_, i) => `line ${i}`).join("\n"));
  assert.equal(lines.text.split("\n").length, 80);
  assert.equal(lines.truncated, true);
  assert.ok(lines.text.startsWith("line 20\n"));
  const long = sanitizeScreen("x".repeat(20_000));
  assert.equal(long.text.length, READ_CHARACTERS);
  assert.equal(long.truncated, true);
  assert.equal(sanitizeScreen("").truncated, false);
});

test("creation requires a validated explicit directory and never implicitly focuses", async () => {
  const api = client();
  await assert.rejects(prepareCreation(api, {}), /explicit/);
  await assert.rejects(prepareCreation(api, { directory: "relative" }));
  await assert.rejects(prepareCreation(api, { directory: homedir(), projectId: "missing" }));
  await assert.rejects(prepareCreation(api, { directory: homedir(), name: "bad\nname" }));
  assert.deepEqual(api.calls, []);
  assert.equal((await prepareCreation(api, { directory: "~", projectId: "project" })).directory, homedir());
  const result = await createSession(api, { directory: homedir() });
  assert.equal(result.status, "created");
  assert.deepEqual(api.calls, ["create"]);
});

test("uncertain creation returns explicit no-retry guidance; other errors remain failures", async () => {
  const api = client();
  api.createSession = async () => {
    api.calls.push("create");
    throw new KeroError("creation-uncertain", "timeout");
  };
  const result = await createSession(api, { directory: homedir() });
  assert.equal(result.status, "creation-uncertain");
  assert.ok("retryAllowed" in result && result.retryAllowed === false);
  assert.deepEqual(api.calls, ["create"]);
  api.createSession = async () => {
    throw new KeroError("unreachable", "offline");
  };
  await assert.rejects(createSession(api, { directory: homedir() }), /offline/);
});

test("AI manifest exposes only the five scoped tools and read/create require confirmation", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  assert.deepEqual(
    manifest.tools.map((tool: { name: string }) => tool.name),
    ["list-projects", "list-sessions", "focus-pane", "create-session", "read-pane"],
  );
  for (const name of ["read-pane", "create-session"]) {
    const source = readFileSync(`src/tools/${name}.ts`, "utf8");
    assert.match(source, /export const confirmation: Tool\.Confirmation<Input>/);
  }
  assert.match(manifest.ai.instructions, /do not retry/i);
  assert.equal(manifest.ai.evals.length, 3);
});
