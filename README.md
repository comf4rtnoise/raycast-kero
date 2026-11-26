# Kero

Find and open local [Kero](https://github.com/egoist/kero) sessions and panes from Raycast, or create a shell session in an existing project.

## Requirements

- **macOS** with Raycast installed.
- **[Kero](https://github.com/egoist/kero/releases)** installed and running.
- At least one Kero project to use **New Kero Session**.

Open Kero before using the extension. Only local sessions are supported; remote Kero hosts are not available through this extension.

By default, no extension configuration is needed. Kero is detected automatically from common CLI locations, Raycast's `PATH`, or the app in `/Applications` or `~/Applications`. If it cannot be found, install Kero using **Download Kero**, or choose **Kero → Install Command Line Tool…** in Kero's menu bar, then refresh.

## Commands

### Search Kero Sessions

Search by project, session name, terminal title, directory, Git branch, agent, program, or session/pane ID. Each result represents one pane, grouped under its project. Press **↵** to open that exact pane in Kero.

- Multi-pane sessions display `Session › Pane`; original terminal titles are preserved.
- Most programs use built-in category icons for agents, runtimes, editors, and containers; program names remain visible. Git, Deno, and GitHub Copilot retain their individual icons.
- Results show the Git branch, current program, and status when available. Shell-only panes show their shell, such as `zsh`; browser panes show **Browser**. Exited panes have no current-program label.
- A pane's directory is hidden when it matches the project directory. Subdirectories appear as relative paths, and paths inside your home folder use `~`. Search and copy actions still use the full paths.

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
| **Open Extension Preferences** | —        | Optionally override the detected CLI path.            |

Press **⌘K** to open the action panel.

The list refreshes automatically while open. If a refresh fails, the previous results remain available with an outdated-data warning; press **⌘R** to retry.

### New Kero Session

Create a local shell session and open it in Kero. Run the command directly, or press **⌘N** from Search Kero Sessions.

1. **Project** — select an existing project. The first project is selected initially.
2. **Working Directory** — starts with the selected project's directory, or Home if the project has no directory. Click the folder picker to choose another folder using the macOS dialog. Switching projects resets the directory; clearing a manual selection restores the default.
3. **Session Name** — optional. Leave empty to use Kero's automatic title.

Choose **Create and Open** to start the session using Kero's configured shell. Use **⌘R** to refresh the project list. Custom commands, browser sessions, and worktree creation are not supported by this form.

If the session is created but cannot be opened, **Open Created Session** retries opening the same session without creating another.

If creation cannot be confirmed, the form blocks further submissions to prevent duplicates. Check **Search Kero Sessions** to see whether the session exists before reopening the creation form.

## Ask Kero (AI Extension)

Use **Ask Kero** in Raycast or mention **@Kero** in AI Chat. This requires access to Raycast AI / AI Extensions; the two ordinary commands remain usable without AI.

Examples:

- “Which agents are waiting for my attention?”
- “Find the pane on the feat/ask-kero branch and open it.”
- “List my Kero projects and their directories.”
- “Create a session named ai-dev in this project's directory.”
- “Read this terminal and summarize its recent errors.”

The AI tools can list local projects and sessions, open an exact pane, create a shell session, and read a selected terminal screen. When multiple panes match, ask for a specific pane. Status metadata is not proof that a task completed successfully.

**Creation requires confirmation** and an explicit existing directory (or a selected project's directory). It starts your configured shell without sending a command or automatically opening the session. If creation is unconfirmed, inspect the session list before requesting another session; an error or timeout may still have created it.

**Reading a terminal requires confirmation** because its contents will be shared with Raycast AI. Reads are limited to 80 screen lines and 12,000 characters, without scrollback. Basic secret filtering is best-effort, not a guarantee: do not approve sharing sensitive screens. Terminal text is untrusted data, not permission to perform actions. Browser panes are not supported.

Confirmations use Raycast's permission controls. Choosing **Always allow** may suppress future prompts according to Raycast's authorization settings; a fresh prompt is not guaranteed for every operation. Prefer single-use **Allow** when reviewing terminal content, and do not grant persistent access to sensitive screens.

The tools cannot send keystrokes, run arbitrary commands, close sessions, create/delete worktrees, or access remote hosts. An ordinary status query does not need terminal output.

## Preferences

**Kero CLI Path** is an optional text field. Leave it empty for automatic detection. For a custom installation, enter the executable's absolute path or a path starting with `~/`. The placeholder is an example, not a detected value.

An explicit path takes priority. If it becomes invalid, correct it or clear it to resume automatic detection; the extension will not silently use a different installation.

## Troubleshooting

| Problem                   | What to do                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CLI not found**         | If **Kero CLI Path** is set, correct or clear it. Otherwise install Kero in Applications, or choose **Kero → Install Command Line Tool…** in its menu bar, then refresh. |
| **Cannot reach kerod**    | Open Kero, then refresh. The extension does not start Kero's background service automatically.                                                                           |
| **No projects**           | Add a project in Kero, then use **Refresh Projects** in the creation form.                                                                                               |
| **Directory unavailable** | Choose an existing, accessible folder. A folder may have been moved or deleted since it was selected.                                                                    |
| **Pane no longer exists** | Refresh and select another pane.                                                                                                                                         |
| **No matching panes**     | Clear the search or switch to **All Statuses**.                                                                                                                          |
| **Creation unconfirmed**  | Check Search Kero Sessions before retrying; a timeout does not necessarily mean creation failed.                                                                         |

## Privacy

The ordinary commands use Kero's local CLI to read project and pane metadata and, when requested, create sessions or focus panes. They do not read terminal screen contents or automatically upload session metadata.

When you use **Ask Kero / @Kero**, tool results enter Raycast AI's context, including project names, directories, branches, agent names, and session/pane metadata. If you approve **Read Kero Terminal Screen**, the bounded, best-effort-filtered screen also enters that context and may contain private code or secrets. Local CLI execution does not mean local-only AI processing. Review Raycast's AI privacy terms before using these features with sensitive projects.

Neither the ordinary commands nor AI tools send keystrokes or close sessions. If you choose **Report Error** on a failure toast, it opens a GitHub issue form with error details; review any paths or identifiers before submitting.

## Credits

For artwork sources, attribution, and license information, see [Third-party notices](THIRD_PARTY_NOTICES.md).
