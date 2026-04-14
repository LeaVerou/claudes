# claudes

Manage [Claude Code](https://docs.anthropic.com/en/docs/claude-code) configuration profiles.
Each profile is an isolated config directory (`~/.claude-<name>/`) with its own `settings.json`, `CLAUDE.md`, `.claude.json`, plugins, agents, and commands.

## Install

```bash
npm install -g claudes
claudes install
```

`claudes install` appends the shell wrapper to your `~/.zshrc` and/or `~/.bashrc` (idempotent — safe to run multiple times). The shell wrapper is required so that `claudes use` can set `CLAUDE_CONFIG_DIR` in your current terminal session.

## Commands

### `claudes use <name>`

Switch to a profile. Creates it if it doesn't exist.

```bash
claudes use sandbox
# Creates ~/.claude-sandbox/ and sets CLAUDE_CONFIG_DIR
```

### `claudes list` (alias: `ls`)

List all profiles with an interactive selector. The active profile is marked with `●`.

```bash
claudes list
```

### `claudes rm <name>` (alias: `remove`)

Remove a profile (with confirmation). If the removed profile was active, resets to default.

```bash
claudes rm sandbox
```

### `claudes which`

Print the active profile name, or `default` if none is active.

### `claudes reset`

Switch back to the default Claude Code configuration (unsets `CLAUDE_CONFIG_DIR`).

### `claudes shell-init`

Output the shell wrapper function. Not called directly — used in your shell rc file.

## Profile-local files

You can place `.local` files in a profile directory to override settings from `~/.claude/`:

| Profile file | Merged with | Strategy |
|---|---|---|
| `settings.local.json` | `~/.claude/settings.json` | Shallow `Object.assign()` |
| `.claude.local.json` | `~/.claude/.claude.json` | Shallow `Object.assign()` |
| `CLAUDE.local.md` | `~/.claude/CLAUDE.md` | Appended after a blank line |

Merging happens every time you `use` a profile. The merged result is written to the profile directory as the non-`.local` filename (e.g. `settings.json`), so Claude Code picks it up directly.

**Note:** JSON merging is shallow — top-level keys in the `.local` file replace the corresponding keys from the base file entirely.

## How it works

Claude Code respects the `CLAUDE_CONFIG_DIR` environment variable to redirect its config storage.
Profiles are stored as `~/.claude-<name>/` directories, discovered by globbing `~/.claude-*`.

Since a child process (Node.js) can't set environment variables in the parent shell, the `shell-init` wrapper function captures the script's stdout (which contains `export`/`unset` commands) and `eval`s it in the current shell. All user-facing messages go to stderr.
