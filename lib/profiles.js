import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, ".claude");
const PREFIX = ".claude-";
export const DEFAULT_PROFILE = "default";

/**
 * Validate a profile name — must be alphanumeric, hyphens, or underscores.
 * Rejects anything that could cause path traversal.
 * @param {string} name
 */
export function validateName (name) {
	if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
		throw new Error(`Invalid profile name: "${ name }". Use only letters, digits, hyphens, underscores.`);
	}
}

/**
 * Get the base ~/.claude directory path.
 */
export function getClaudeDir () {
	return CLAUDE_DIR;
}

/**
 * Get the directory path for a named profile (~/.claude-<name>),
 * or ~/.claude for the default profile.
 * @param {string} name
 */
export function getProfileDir (name) {
	if (name === DEFAULT_PROFILE) {
		return CLAUDE_DIR;
	}
	return path.join(HOME, PREFIX + name);
}

/**
 * Return the name of the currently active profile (from CLAUDE_CONFIG_DIR).
 * @returns {string | false} Profile name (or "default"), or false if
 *          CLAUDE_CONFIG_DIR is set to an unrecognized path.
 */
export function getActiveProfile () {
	const configDir = process.env.CLAUDE_CONFIG_DIR;
	if (!configDir) {
		return DEFAULT_PROFILE;
	}

	const resolved = path.resolve(configDir);
	const basename = path.basename(resolved);

	if (basename.startsWith(PREFIX) && path.dirname(resolved) === HOME) {
		return basename.slice(PREFIX.length);
	}

	// CLAUDE_CONFIG_DIR is set but points somewhere we don't manage
	return false;
}

/**
 * List all existing profile names by globbing ~/.claude-*, sorted alphabetically.
 * @returns {string[]}
 */
export function listProfiles () {
	const profiles = fs.globSync(PREFIX + "*", { cwd: HOME })
		.map(name => name.slice(PREFIX.length))
		.filter(name => {
			// Only include actual directories, skip files
			try {
				return fs.statSync(path.join(HOME, PREFIX + name)).isDirectory();
			}
			catch {
				return false;
			}
		})
		.sort();

	// Include the default profile (~/.claude) if it exists
	if (fs.existsSync(CLAUDE_DIR)) {
		profiles.unshift(DEFAULT_PROFILE);
	}

	return profiles;
}

/**
 * Ensure a profile directory exists; create it if it doesn't.
 * @param {string} name
 * @returns {{ dir: string, created: boolean }}
 */
export function ensureProfile (name) {
	validateName(name);
	const dir = getProfileDir(name);
	const existed = fs.existsSync(dir);

	if (!existed) {
		fs.mkdirSync(dir, { recursive: true });
	}

	return { dir, created: !existed };
}

/**
 * Remove a profile directory and all its contents.
 * @param {string} name
 */
export function removeProfile (name) {
	validateName(name);
	const dir = getProfileDir(name);

	if (!fs.existsSync(dir)) {
		throw new Error(`Profile "${ name }" does not exist.`);
	}

	fs.rmSync(dir, { recursive: true, force: true });
}
