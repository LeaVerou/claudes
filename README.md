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

Any file in a profile directory matching these suffixes is merged with the corresponding base file from `~/.claude/`:

| Suffix | Type | Strategy |
|---|---|---|
| `*.local.json` | JSON | Shallow — top-level keys replaced |
| `*.local.deep.json` | JSON | Deep — nested objects merged recursively |
| `*.local.md` | Markdown | Appended after a blank line |
| `*.local.deep.md` | Markdown | Sections with the same heading are replaced, new headings appended |

For example, `settings.local.json` merges with `~/.claude/settings.json`, `CLAUDE.local.deep.md` merges with `~/.claude/CLAUDE.md`, etc.

Merging happens every time you `use` a profile. The merged result is written to the profile directory without the `.local` suffix (e.g. `settings.json`), so Claude Code picks it up directly.

If both `.local` and `.local.deep` exist for the same base file, `.local.deep` is applied first, then `.local` on top.

## How it works

Claude Code respects the `CLAUDE_CONFIG_DIR` environment variable to redirect its config storage.
Profiles are stored as `~/.claude-<name>/` directories, discovered by globbing `~/.claude-*`.
