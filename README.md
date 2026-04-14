# claudes

Manage [Claude Code](https://docs.anthropic.com/en/docs/claude-code) configuration profiles.
Each profile is an isolated config directory (`~/.claude-<name>/`).

Profiles can have their own entirely separate `settings.json`, `CLAUDE.md`, `.claude.json`, plugins, agents, and commands.
Alternatively, they can define incremental modifications over the default profile's settings.


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

### `claudes` / `claudes list` (alias: `ls`)

List all profiles with an interactive selector. The active profile is marked with `●`. Running `claudes` with no arguments is equivalent to `claudes list`.

```bash
claudes
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

### `claudes -x <name>`

Shorthand for `claudes use <name>` that also launches Claude after switching.

```bash
claudes -x sandbox
# Equivalent to: claudes use sandbox && claude
```

If the profile has a `claudes.json` with `flags`, those are passed to Claude automatically.

### `claudes help` / `claudes --help`

Show available commands and options.

### `claudes shell-init`

Output the shell wrapper function. Not called directly — used in your shell rc file.

## Options

| Flag | Description |
|---|---|
| `--help` | Show help message |
| `--dry-run` | Show what would happen without making changes |
| `-x` | Also launch Claude after switching (use only) |

## Profile configuration (`claudes.json`)

A profile can include a `claudes.json` file for claudes-specific settings:

```json
{
  "flags": "--plugin-dir ./my-plugins --verbose"
}
```

The `flags` field (string or array) is passed to Claude on every launch. When you `use` a profile with flags, a shell alias is created so that running `claude` directly also picks them up.

## Profile-local files

You can place `.local` and `.local.deep` files in a profile directory to override settings from `~/.claude/`:

| Profile file | Merged with | Strategy |
|---|---|---|
| `settings.local.json` | `~/.claude/settings.json` | Shallow — top-level keys replaced |
| `settings.local.deep.json` | `~/.claude/settings.json` | Deep — nested objects merged recursively |
| `.claude.local.json` | `~/.claude/.claude.json` | Shallow |
| `.claude.local.deep.json` | `~/.claude/.claude.json` | Deep |
| `CLAUDE.local.md` | `~/.claude/CLAUDE.md` | Appended after a blank line |

Merging happens every time you `use` a profile. The merged result is written to the profile directory as the non-`.local` filename (e.g. `settings.json`), so Claude Code picks it up directly.

If both `.local` and `.local.deep` exist for the same base file, `.local.deep` is applied first, then `.local` on top. This lets you deep-merge most settings while still replacing specific top-level keys.

## How it works

Claude Code respects the `CLAUDE_CONFIG_DIR` environment variable to redirect its config storage.
Profiles are stored as `~/.claude-<name>/` directories, discovered by globbing `~/.claude-*`.

Since a child process (Node.js) can't set environment variables in the parent shell, the `shell-init` wrapper function captures the script's stdout (which contains `export`/`unset` commands) and `eval`s it in the current shell. All user-facing messages go to stderr.
