import fs from "node:fs";
import path from "node:path";
import { getClaudeDir } from "./profiles.js";

/**
 * Files that support .local merging.
 * Each entry maps the .local filename (in the profile dir) to the
 * base filename (in both ~/.claude and the profile dir output).
 */
const MERGEABLE = [
	{ local: "settings.local.json", base: "settings.json", type: "json" },
	{ local: ".claude.local.json", base: ".claude.json", type: "json" },
	{ local: "CLAUDE.local.md", base: "CLAUDE.md", type: "md" },
];

/**
 * Read and parse a JSON file. Returns an empty object if the file doesn't
 * exist. Throws on malformed JSON so the caller can surface the error.
 * @param {string} filePath
 */
export function readJSONSync (filePath) {
	let raw;

	try {
		raw = fs.readFileSync(filePath, "utf-8");
	}
	catch (err) {
		if (err.code === "ENOENT") {
			return undefined;
		}
		throw err;
	}

	return JSON.parse(raw);
}

/**
 * Read a text file, returning an empty string if it doesn't exist.
 * Rethrows non-ENOENT errors (permissions, etc.).
 * @param {string} filePath
 */
export function readText (filePath) {
	try {
		return fs.readFileSync(filePath, "utf-8");
	}
	catch (err) {
		if (err.code === "ENOENT") {
			return "";
		}
		throw err;
	}
}

/**
 * For each .local file found in the profile directory, merge it with the
 * corresponding base file from ~/.claude and write the result into the
 * profile directory (without the .local prefix).
 *
 * JSON merging is shallow (Object.assign) — top-level keys in the .local
 * file replace the corresponding keys from the base file entirely.
 *
 * @param {string} profileDir - Absolute path to the profile directory
 * @returns {string[]} List of files that were merged
 */
export function mergeLocalFiles (profileDir) {
	const claudeDir = getClaudeDir();
	const merged = [];

	for (const { local, base, type } of MERGEABLE) {
		const localPath = path.join(profileDir, local);

		if (!fs.existsSync(localPath)) {
			continue;
		}

		const basePath = path.join(claudeDir, base);
		const outPath = path.join(profileDir, base);

		if (type === "json") {
			const baseData = readJSONSync(basePath) ?? {};
			const localData = readJSONSync(localPath) ?? {};
			const result = Object.assign({}, baseData, localData);
			fs.writeFileSync(outPath, JSON.stringify(result, null, "\t") + "\n");
		}
		else {
			// Markdown: append local after a blank line
			const baseContent = readText(basePath);
			const localContent = readText(localPath);
			const separator = baseContent && localContent ? "\n\n" : "";
			fs.writeFileSync(outPath, baseContent + separator + localContent);
		}

		merged.push(`${ local } → ${ base }`);
	}

	return merged;
}
