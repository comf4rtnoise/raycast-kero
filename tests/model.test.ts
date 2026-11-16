import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGroups, matchesStatus, normalizeStatus, parseProjects, parseSessions } from "../src/lib/model";

const projects = parseProjects([
  { id: "p1", name: "kero", dir: "/work/oss/kero" },
  { id: "p2", name: "kero", dir: "/work/personal/kero" },
]);

const sessions = parseSessions([
  {
    id: "s2",
    project: "p2",
    name: "Review",
    panes: [
      {
        id: "a",
        title: "Agent",
        dir: "/home",
        processDir: "/work/personal/kero",
        agent: "pi",
        process: "node",
        status: "working",
        progress: 40,
        git: { branch: "feature/search" },
      },
      { id: "b", process: "zsh", dir: "/work/personal/kero", status: "idle", progress: -1 },
    ],
  },
  { id: "s1", project: "p1", name: "Server", panes: [{ id: "c", status: "waiting" }] },
]);

test("groups by project ID in sidebar order, including duplicate project names", () => {
  const groups = buildGroups(sessions, projects);
  assert.deepEqual(
    groups.map((g) => g.id),
    ["p1", "p2"],
  );
  assert.deepEqual(
    groups.map((g) => g.subtitle),
    ["/work/oss/kero", "/work/personal/kero"],
  );
  assert.equal(groups[1].items.length, 2);
});

test("one row per pane with explicit target and process directory", () => {
  const item = buildGroups(sessions, projects)[1].items[0];
  assert.equal(item.id, "a");
  assert.equal(item.sessionId, "s2");
  assert.equal(item.title, "Review / Agent");
  assert.equal(item.directory, "/work/personal/kero");
  assert.equal(item.process, "pi");
  assert.equal(item.progress, 40);
  for (const keyword of [
    "kero",
    "p2",
    "Review",
    "s2",
    "a",
    "/home",
    "/work/personal/kero",
    "pi",
    "node",
    "feature/search",
  ]) {
    assert.ok(item.keywords.includes(keyword), `Missing search keyword: ${keyword}`);
  }
  assert.equal(buildGroups(sessions, projects)[0].items[0].title, "Server");
  assert.equal(buildGroups(sessions, projects)[1].items[1].progress, undefined);
});

test("handles missing projects, optional fields, and future statuses", () => {
  const groups = buildGroups(
    parseSessions([
      { id: "s1", panes: [{ id: "a", status: "future", progress: 101 }] },
      { id: "s2", project: "deleted", panes: [{ id: "b", dir: "/tmp", processDir: "" }] },
    ]),
    [],
  );
  assert.equal(groups[0].title, "Other Sessions");
  assert.equal(groups[0].items[0].status, "unknown");
  assert.equal(groups[0].items[0].progress, undefined);
  assert.equal(groups[1].title, "Project deleted");
  assert.equal(groups[1].items[0].directory, "/tmp");
  assert.deepEqual(buildGroups([], projects), []);
});

test("status filters use Kero states, not process presence", () => {
  for (const status of ["working", "waiting", "idle", "error", "exited", "unknown"] as const) {
    assert.equal(matchesStatus(status, "all"), true);
    assert.equal(matchesStatus(status, "attention"), status === "waiting" || status === "error");
    for (const filter of ["working", "idle", "exited"] as const) {
      assert.equal(matchesStatus(status, filter), status === filter);
    }
  }
  assert.equal(normalizeStatus(undefined), "unknown");
});

test("status changes do not reorder panes", () => {
  const before = buildGroups(sessions, projects).flatMap((g) => g.items.map((p) => p.id));
  const changed = structuredClone(sessions);
  changed[0].panes[0].status = "error";
  const after = buildGroups(changed, projects).flatMap((g) => g.items.map((p) => p.id));
  assert.deepEqual(after, before);
});

test("rejects malformed structural JSON and duplicate pane IDs", () => {
  for (const value of [
    null,
    {},
    [{ id: "s" }],
    [{ id: "s", panes: [{}] }],
    [{ id: "s", panes: [{ id: "a" }, { id: "a" }] }],
  ]) {
    assert.throws(() => parseSessions(value));
  }
  assert.throws(() => parseProjects({}));
  assert.throws(() => parseProjects([{ name: "no-id" }]));
});

test("ignores unknown fields and invalid optional data", () => {
  const [session] = parseSessions([
    { id: "s", future: true, panes: [{ id: "a", title: 123, git: null, progress: "50" }] },
  ]);
  assert.equal(session.panes[0].title, undefined);
  assert.equal(session.panes[0].progress, undefined);
  assert.equal(session.panes[0].git, undefined);
  assert.equal(parseProjects([{ id: "p" }])[0].name, "p");
});
