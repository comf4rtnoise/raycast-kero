import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as ai from "../src/lib/ai";
import { KeroClient } from "../src/lib/kero";

type TestClient = Pick<KeroClient, "sessions" | "projects" | "focus" | "readPane" | "createSession">;

// Exercise real tool entry points without loading Raycast's host-only runtime.
function loadTool(name: string, client: TestClient) {
  const filename = join(__dirname, `../src/tools/${name}.ts`);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = {
    exports: {} as {
      default: (input: Record<string, string>) => Promise<unknown>;
      confirmation: (
        input: Record<string, string>,
      ) => Promise<{ message: string; info: { name: string; value: string }[] }>;
    },
  };
  runInNewContext(
    compiled,
    {
      module,
      exports: module.exports,
      require: (name: string) => {
        if (name === "../lib/ai-client") return { aiClient: () => client };
        if (name === "../lib/ai") return ai;
        throw new Error(`Unexpected runtime import: ${name}`);
      },
    },
    { filename },
  );
  return module.exports;
}

function fixture() {
  const calls: string[] = [];
  const client: TestClient = {
    sessions: async () => [{ id: "s", name: "Development", panes: [{ id: "pane123" }] }],
    projects: async () => [{ id: "project", name: "Project", dir: homedir() }],
    focus: async () => {
      calls.push("focus");
    },
    readPane: async () => {
      calls.push("read");
      return "screen";
    },
    createSession: async () => {
      calls.push("create");
      return { id: "new", panes: [{ id: "new-pane" }] };
    },
  };
  return { calls, client };
}

test("read confirmation identifies the pane and warns about AI sharing without reading any screen", async () => {
  const { client, calls } = fixture();
  const tool = loadTool("read-pane", client);
  const confirmation = await tool.confirmation({ paneId: "pane123" });
  assert.match(confirmation.message, /Raycast AI/);
  assert.match(confirmation.message, /secrets/);
  const privacy = confirmation.info.find((item) => item.name === "Privacy");
  assert.ok(privacy);
  assert.match(privacy.value, /Raycast AI/);
  assert.match(privacy.value, /not guaranteed/);
  assert.ok(confirmation.info.some((item) => item.value === "pane123"));
  assert.deepEqual(calls, [], "Canceling after confirmation must leave the screen unread");
  await tool.default({ paneId: "pane123" });
  assert.deepEqual(calls, ["read"]);
});

test("read execution revalidates a target that disappeared after confirmation", async () => {
  const { client, calls } = fixture();
  const tool = loadTool("read-pane", client);
  await tool.confirmation({ paneId: "pane123" });
  client.sessions = async () => [];
  await assert.rejects(tool.default({ paneId: "pane123" }), /no longer exists/);
  assert.deepEqual(calls, []);
});

test("create confirmation shows the validated directory; only execution creates, without focusing", async () => {
  const { client, calls } = fixture();
  const tool = loadTool("create-session", client);
  const input = { directory: "~", projectId: "project", name: "ai-dev" };
  const confirmation = await tool.confirmation(input);
  assert.ok(confirmation.info.some((item) => item.value === homedir()));
  assert.deepEqual(calls, []);
  await tool.default(input);
  assert.deepEqual(calls, ["create"]);
});

test("creation revalidates a project removed after confirmation", async () => {
  const { client, calls } = fixture();
  const tool = loadTool("create-session", client);
  const input = { directory: "~", projectId: "project" };
  await tool.confirmation(input);
  client.projects = async () => [];
  await assert.rejects(tool.default(input), /no longer exists/);
  assert.deepEqual(calls, []);
});

test("metadata tools and focus route to the scoped client methods", async () => {
  const { client, calls } = fixture();
  assert.deepEqual(await loadTool("list-projects", client).default({}), await client.projects());
  assert.deepEqual(await loadTool("list-sessions", client).default({}), await client.sessions());
  assert.deepEqual(await loadTool("focus-pane", client).default({ paneId: "pane123" }), {
    paneId: "pane123",
    opened: true,
  });
  assert.deepEqual(calls, ["focus"]);
});
