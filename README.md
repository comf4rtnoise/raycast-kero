# Kero for Raycast

A [Raycast](https://www.raycast.com) extension for [Kero](https://github.com/egoist/kero). Find and open local terminal sessions and panes, or create a shell session in an existing project.

## Requirements

- **macOS** with Raycast installed.
- **[Kero](https://github.com/egoist/kero/releases)** and its command-line tool. Open Kero, then choose **Kero → Install Command Line Tool…** from the menu bar to install `kero` on your `PATH`.
- At least one Kero project to use **New Kero Session**.

Keep Kero available while using the extension. It connects only to the local machine; remote Kero hosts are not supported.

The extension detects the CLI automatically. If it cannot find Kero, use **Download Kero** or **Open Extension Preferences** from the action panel. For a custom installation, set **Kero CLI Path** to the absolute path returned by:

```bash
command -v kero
```

## Install from source

This extension is not yet available in the Raycast Store. With Node.js **22.22.2 or newer** and npm installed, open this repository's directory and run:

```bash
npm ci
npm run dev
```

Sign in to Raycast if prompted. Keep the development command running, then open **Search Kero Sessions** or **New Kero Session** in Raycast. If the commands do not appear, use Raycast's **Import Extension** command and select this directory.

## Commands

### Search Kero Sessions

Search by project, session name, terminal title, directory, Git branch, agent, program, or pane ID. Each result represents one pane, grouped under its project. Press **↵** to open that exact pane in Kero.

- Multi-pane sessions display `Session › Pane`; original terminal titles are preserved.
- The right side shows **Git branch → current program → status**. Shell-only panes show their shell, such as `zsh`; exited panes have no current-program label.
- A pane's directory is hidden when it matches the project directory. Subdirectories appear as relative paths; other paths use `~` for Home. Search and copy actions still use the full paths.

Use the status dropdown to show **All Statuses**, **Needs Attention**, **Working**, **Idle**, or **Exited**. Needs Attention includes waiting and error states. Status comes from Kero: an idle pane may still contain a running server.

Available actions:

| Action                         | Shortcut | Description                                           |
| ------------------------------ | -------- | ----------------------------------------------------- |
| **Open in Kero**               | ↵        | Focus the selected pane.                              |
| **New Kero Session**           | ⌘N       | Open the creation form, including from an empty list. |
| **Refresh Sessions**           | ⌘R       | Reload sessions and projects.                         |
| **Copy Working Directory**     | ⌘⇧C      | Copy the full working directory, when available.      |
| **Copy Session ID**            | —        | Copy the ID of the pane's owning session.             |
| **Copy Pane ID**               | —        | Copy the selected pane's ID.                          |
| **Open Extension Preferences** | —        | Configure the Kero CLI path.                          |

Press **⌘K** to open the action panel. Session IDs and pane IDs have different scopes in the Kero CLI; choose the appropriate copy action for your command.

The list refreshes automatically while open. If a refresh fails, the previous results remain available with an outdated-data warning; press **⌘R** to retry.

### New Kero Session

Create a local shell session and open it in Kero. Run the command directly, or press **⌘N** from Search Kero Sessions.

1. **Project** — select an existing project. The first project is selected initially; there is no automatic-project option.
2. **Working Directory** — starts with the selected project's directory, or Home if the project has no directory. Click the folder picker to choose another folder using the macOS dialog. Switching projects resets the directory; clearing a manual selection restores the default.
3. **Session Name** — optional. Leave empty to use Kero's automatic title.

Choose **Create and Open** to start the session using Kero's configured shell. Use **⌘R** to refresh the project list. Custom commands, browser sessions, and worktree creation are not supported by this form.

If the session is created but cannot be opened, **Open Created Session** retries opening the same session without creating another. If creation cannot be confirmed, use **Search Kero Sessions** to check whether it already exists before trying again.

## Preferences

| Preference        | Description                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kero CLI Path** | Optional absolute path to the Kero executable, such as `/usr/local/bin/kero`. Paths starting with `~/` are also accepted. Leave empty for automatic detection. |

Automatic detection checks `/usr/local/bin/kero`, `/opt/homebrew/bin/kero`, then absolute directories in Raycast's `PATH`. A manually configured path takes priority; correct or clear it if the executable moves.

## Troubleshooting

| Problem                                | What to do                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **CLI not found**                      | Install Kero's command-line tool from its menu bar, or set **Kero CLI Path**. Raycast may not inherit the same `PATH` as your shell. |
| **Cannot reach kerod**                 | Open Kero, then refresh. The extension does not start the daemon automatically.                                                      |
| **No projects**                        | Add a project in Kero, then use **Refresh Projects** in the creation form.                                                           |
| **Directory unavailable**              | Choose an existing, accessible folder. A folder may have been moved or deleted since it was selected.                                |
| **Pane no longer exists**              | Refresh and select another pane.                                                                                                     |
| **No matching panes**                  | Clear the search or switch to **All Statuses**.                                                                                      |
| **Permission or Remote Control error** | Follow Kero's permission guidance. The extension does not bypass its restrictions.                                                   |
| **Creation unconfirmed**               | Check Search Kero Sessions before retrying; a timeout does not necessarily mean creation failed.                                     |

## Privacy

The extension reads local session/project metadata and sends explicit create/focus requests to Kero. It does not read terminal screen contents, send keystrokes, close sessions, or send metadata to an external service.

Kero artwork and program icons are reused with attribution. See [Third-party notices](THIRD_PARTY_NOTICES.md).
