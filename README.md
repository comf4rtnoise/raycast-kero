# Kero for Raycast

Search local Kero sessions and panes without leaving your keyboard. Search by project, session name, terminal title, directory, Git branch, agent, or pane ID, then press **Enter** to open the exact pane in Kero.

## Requirements

- macOS with Raycast and Kero installed.
- A working Kero CLI and reachable local `kerod`. Tested against **Kero 2.1.35 (protocol 3)**. Older versions have not been verified.
- For development: Node.js **22.22.2 or newer** and npm (required by the currently installed Raycast SDK).
- No Raycast Pro or external API key is required by this extension.

## Local installation

This project is not yet published to the Raycast Store.

```bash
npm install
npm run dev
```

Run **Search Kero Sessions** in Raycast. If necessary, use Raycast's **Import Extension** command and select this project directory. Raycast's extension development commands require signing in.

`npm run dev` builds/registers the local extension and watches source files. Keep it running while developing; press Ctrl+C to stop the watcher.

### Kero CLI Path

In extension preferences, optionally set **Kero CLI Path** to the absolute executable path. Find it in your terminal with:

```bash
command -v kero
```

Automatic detection checks `/usr/local/bin/kero`, `/opt/homebrew/bin/kero`, then absolute directories in the Raycast process's `PATH`. The preferences field also accepts `~/…`. An explicitly configured but invalid path produces an error instead of silently selecting another executable.

This extension always targets the **local machine**. It removes inherited `KERO_HOST`, `KERO_SESSION`, and `KERO_PANE` values from child-process environments and always supplies a full pane ID for focus actions.

## Usage

- One row per pane, grouped in Kero's project order. Project paths distinguish duplicate names. Multi-pane sessions use `Session › Pane` titles; single-pane titles and the original terminal title text are unchanged.
- The **Current Program** label shows the agent, foreground program, or shell (in that order). Shell-only panes consistently show `zsh`, `bash`, etc., whether or not Kero sets its `process` field. Browser panes show `Browser`; exited panes have no current-program label. Visible program labels are searchable.
- Kero's own terminal, browser, and program icons identify panes. Selection follows Kero's agent → process → runtime fallback; for example, pi can display the Node.js icon. Agent brand colors are preserved, while status remains visible in a separate tag.
- **Enter:** Open in Kero (`kero focus <pane-id>`).
- **⌘R:** Refresh sessions and projects.
- **⌘⇧C:** Copy the working directory when available.
- **⌘K:** Open the action panel. **Copy Session ID** copies the owning session's ID; **Copy Pane ID** copies the selected pane's ID. Both are available even in single-pane sessions. **Open in Kero** still targets the exact pane.
- Session and pane IDs have different scopes: for example, `kero close <session-id>` closes the session, while `kero close <pane-id>` closes that pane. Choose the appropriate copy action for your CLI command.
- Status filter: All Statuses, Needs Attention (`waiting` / `error`), Working, Idle, or Exited.
- Working directory prefers `processDir`, falling back to `dir`. Pane rows hide directories identical to the project directory, show project subdirectories as relative paths, and retain other paths with home-directory abbreviation (`~`). Full paths remain searchable and copyable; terminal titles are unchanged.

Statuses are Kero's own signals, not an inference about process completion. An idle pane can still contain a running server. Progress appears only when Kero supplies a valid percentage for a working pane.

While the command is mounted, sessions refresh five seconds after each completed query. Project metadata is cached for up to one minute; manual refresh reloads both. Rows are not sorted by changing status. Requests are canceled on unmount, and focusing a pane closes Raycast and immediately returns its view to root to release polling resources.

If a refresh fails, the last successful list remains visible with an outdated-data warning. A failed focus request does not close Raycast.

## Troubleshooting

| Problem                              | What to do                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| CLI not found                        | Install Kero or configure **Kero CLI Path**. Raycast does not necessarily inherit your shell's `PATH`.   |
| Cannot reach kerod                   | Open/check Kero and press ⌘R. The extension does not start or restart the daemon automatically.          |
| Pane no longer exists                | The list refreshes after this focus error. Select another pane.                                          |
| Remote Control / permission error    | Follow Kero's permission guidance. The extension surfaces the CLI error and does not bypass permissions. |
| No sessions                          | Create a session in Kero, then refresh.                                                                  |
| No matching panes                    | Clear the search or switch the status filter to All Statuses.                                            |
| Invalid JSON / incompatible response | Check the installed Kero version; retry after updating Kero.                                             |

## Scope and privacy

The extension only invokes `ls --json`, `projects --json`, and explicit `focus` commands. It does not read terminal screen contents, send keystrokes, close sessions, create panes, or connect to remote hosts. Session metadata stays in memory; the extension does not persist it or send it to an external service. The extension icon reuses Kero's application artwork. Resource provenance and licenses are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Raycast's native typography is retained; no unused font files are bundled.

## Development

```bash
npm test             # Model and CLI adapter tests, including timeout/cancellation
npm run typecheck    # TypeScript, including tests
npm run build        # Raycast production build
npm run lint         # Official metadata, icon, ESLint, and formatting checks
```

Tests use synthetic fixtures and temporary mock CLI executables; they do not focus, create, or close real Kero sessions.

### Manual acceptance checklist

The user has verified that the basic functionality works in Raycast. The checklist below remains the regression guide; individual edge cases have not all been confirmed.

- Open the command in Raycast; compare pane count and project grouping with `kero ls --json`.
- Search by session name, directory, branch, and agent; check all status filters.
- Confirm same-name projects are distinguishable by directory.
- Verify shell-only panes consistently show their shell name in both single- and multi-pane sessions; foreground programs/agents take precedence, browser panes show Browser, and exited panes have no current-program label.
- Verify matching pane/project directories are hidden on pane rows, child directories are relative, and unrelated/worktree paths remain visible. Confirm full-path search and directory copy still work.
- Press Enter on a non-focused pane in a multi-pane session; verify the correct Kero pane becomes active and Raycast closes.
- Verify ⌘R, directory copy, session ID copy, pane ID copy, and extension preferences. Compare both copied IDs with `kero ls --json`; panes in the same session must share a Session ID but have distinct Pane IDs.
- Set an invalid CLI path; verify the error and recovery after correcting it.
- Close a test pane from Kero while its row is displayed; verify the extension recovers gracefully.
- Stop the local development watcher when finished.

### Publishing blockers / known limitations

- `package.json` currently uses `xiaoyangsean` as a provisional author. Raycast's user API returned 404 for that username during lint. **Replace it with your actual Raycast account username before the full official lint/publish workflow.** This does not prevent local build/development.
- `npm audit` currently reports **7 moderate development-toolchain findings**, all stemming from the `typescript-eslint` dependency on `minimatch`. A non-forced `npm audit fix` did not resolve them; the latest queried `typescript-eslint` still requires the affected major. No cross-major override is applied. `npm audit --omit=dev` should be checked separately for production dependencies.
- Basic functionality has passed user verification in Raycast. Detailed edge-case and error-recovery checks remain part of manual acceptance; automated CLI tests do not replace them.
- No remote hosts, history recovery, session creation, screen previews, or destructive actions in this version.

## Structure

```text
src/search-sessions.tsx       Raycast list, filters, and actions
src/hooks/use-sessions.ts     Cancellable polling and project cache
src/lib/kero.ts               CLI discovery, execution, and error handling
src/lib/model.ts              JSON validation and pane list normalization
src/lib/icons.ts              Kero program icons, selection order, and colors
tests/                       Model and mock-CLI regression tests
assets/extension-icon.png    Kero application icon, resized to 512 × 512
assets/kero/                 Reused Kero UI and program SVGs
assets/licenses/             Redistributed resource licenses
```
