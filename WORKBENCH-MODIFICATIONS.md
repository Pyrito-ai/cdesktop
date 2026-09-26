# Tencent Workbench trial modifications

This fork modifies cdesktop revision `75bd015` for use inside Tencent Agent
Memory's Workbench page. The original `LICENSE` and `NOTICE` are retained.
cdesktop and the incorporated upstream components retain their original
copyright and attribution. These modifications are under Apache-2.0.

## Embedded URL contract

- `/workspaces/create?embed=1` opens the new-session composer.
- `/workspaces/<workspaceId>?embed=1` opens an existing workspace.
- `/workspaces/<workspaceId>?embed=1&sessionId=<sessionId>` selects an inner
  agent session belonging to that workspace.
- `/workspaces?embed=1` redirects to the composer and retains embedded mode.
- The same workspace routes without `embed=1` keep the standalone cdesktop UI.

`embed=1` is retained by the local router through ordinary navigation and
redirects. `sessionId` is specific to the current workspace and is not retained
when navigating to another workspace. Query parameters are UI state, not an
authentication or authorization mechanism. The iframe does not read or change
the parent page and has no cross-window command channel.
Unavailable session links show a dismissible notice and fall back to the
workspace's latest session. They cannot select a session from another workspace.

## Presentation and capability

Embedded mode has a compact Workbench header, a session list hidden behind the
Sessions button, and light colors and typography that match the Tencent shell.
Sidebar visibility is local to the embed and does not overwrite the standalone
app's saved layout. Its light theme does not overwrite the saved theme.
Tencent keeps its main navigation and coordinator outside the iframe.

Workspace content remains the upstream session grid: agent chat, file browser,
diffs, terminal, preview, Git tools, and multi-session capabilities. Search,
commands, settings, archived sessions, and routines remain accessible. Inner
session selection is visible in embedded mode. Mobile views retain their
workspace-tool tabs. Release-note popups and redundant application navigation
are omitted while embedded.

The normal in-app workspace navigation stays inside the iframe. Explicit
external links, editor launches, and preview-open actions retain their upstream
behavior. This frontend change does not replace agent executors, subscriptions,
credentials, or the Orca integration.

Existing embedded follow-ups restore the model and reasoning from the latest
execution receipt, filling missing fields from that receipt's named preset.
Historical model IDs remain usable even when absent from discovery. Explicit
user picks take precedence until the next execution receipt; reopening restores
the last executed settings. Provider routing is inherited from the session until
the user explicitly selects a provider. Variant and permissions remain explicit.

## Local runtime isolation

`CDT_DATA_DIR` accepts an absolute directory for a separate trial database,
configuration and profiles. `CDT_SKIP_SKILL_INSTALL=1` skips startup writes to
shared agent skill directories. `CDT_NO_OPEN=1` suppresses the production
server's automatic browser launch. These opt-in flags leave normal startup
behavior unchanged.

The trial also uses the existing dedicated workspace directory, loopback host,
origin allowlist, separate temporary directory and
`DISABLE_WORKTREE_CLEANUP=1`. Native API access still assumes a trusted local
user; these changes do not provide a public or multi-tenant authentication layer.
