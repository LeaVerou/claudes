import path from "node:path";
import { readJSONSync } from "./merge.js";

/**
 * Read claudes.json from a profile directory.
 * Returns the parsed config, or undefined if the file doesn't exist.
 * @param {string} profileDir
 * @returns {object | undefined}
 */
export function readConfig (profileDir) {
	return readJSONSync(path.join(profileDir, "claudes.json"));
}

/**
 * Build the `claude` shell command from a profile's claudes.json config.
 * Returns just "claude" if no flags are configured.
 * @param {object} [config]
 * @returns {string}
 */
export function claudeCommand (config) {
	const flags = config?.flags;

	if (!flags) {
		return "claude";
	}

	if (typeof flags === "string") {
		return flags ? `claude ${ flags }` : "claude";
	}

	return ["claude", ...flags].join(" ");
}
