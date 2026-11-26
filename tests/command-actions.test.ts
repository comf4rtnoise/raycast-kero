import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Compile the actual event handler without loading Raycast's host-only render
// module. Also verify that the form action is wired to the tested handler.
function loadSearchAction(
  launchCommand: (options: unknown) => Promise<void>,
  showFailureToast: (error: unknown, options: unknown) => Promise<void>,
) {
  const filename = join(__dirname, "../src/new-session.tsx");
  const text = readFileSync(filename, "utf8");
  assert.match(text, /onAction=\{openSessionSearch\}/);
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  const handler = source.statements.find(
    (node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === "openSessionSearch",
  );
  assert.ok(handler);
  const compiled = ts.transpileModule(handler.getText(source), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} as { openSessionSearch: () => Promise<void> } };
  runInNewContext(
    compiled,
    {
      module,
      exports: module.exports,
      launchCommand,
      LaunchType: { UserInitiated: "user" },
      showFailureToast,
    },
    { filename },
  );
  return module.exports.openSessionSearch;
}

test("the search recovery action launches the correct command", async () => {
  let calls = 0;
  const action = loadSearchAction(
    async (options) => {
      calls++;
      assert.equal(JSON.stringify(options), JSON.stringify({ name: "search-sessions", type: "user" }));
    },
    async () => assert.fail("Success must not show an error toast"),
  );
  await action();
  assert.equal(calls, 1);
});

test("a disabled search command is caught and its failure toast is awaited", { timeout: 2_000 }, async () => {
  const failure = new Error("Command is disabled");
  let release!: () => void;
  const toast = new Promise<void>((resolve) => {
    release = resolve;
  });
  let toasts = 0;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const action = loadSearchAction(
    async () => {
      throw failure;
    },
    async (error, options) => {
      toasts++;
      entered();
      assert.equal(error, failure);
      assert.equal((options as { title: string }).title, "Could Not Open Search Kero Sessions");
      await toast;
    },
  );
  let settled = false;
  const pending = action().then(() => {
    settled = true;
  });
  await started;
  assert.equal(toasts, 1);
  assert.equal(settled, false);
  release();
  await pending;
  assert.equal(settled, true);
});
