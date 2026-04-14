import fs from "node:fs";
import path from "node:path";
import { getClaudeDir } from "./profiles.js";

/**
 * Files that support .local merging.
 * `merge` is "shallow" (Object.assign) or "deep" (recursive).
 * A base file can have both a .local and .local.deep variant;
 * if both exist, .local.deep is applied first, then .local on top.
 */
const MERGEABLE = [
	{ local: "settings.local.json", base: "settings.json", type: "json", merge: "shallow" },
	{ local: "settings.local.deep.json", base: "settings.json", type: "json", merge: "deep" },
	{ local: ".claude.local.json", base: ".claude.json", type: "json", merge: "shallow" },
	{ local: ".claude.local.deep.json", base: ".claude.json", type: "json", merge: "deep" },
	{ local: "CLAUDE.local.md", base: "CLAUDE.md", type: "md" },
];

/**
 * Read and parse a JSON file. Returns undefined if the file doesn't exist.
 * Throws on malformed JSON so the caller can surface the error.
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
 * Recursively merge source into target. Arrays and non-plain-objects
 * are replaced, plain objects are merged recursively.
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
export function deepMerge (target, source) {
	const result = { ...target };

	for (const key in source) {
		const s = source[key];
		const t = result[key];

		if (isPlainObject(s) && isPlainObject(t)) {
			result[key] = deepMerge(t, s);
		}
		else {
			result[key] = s;
		}
	}

	return result;
}

/**
 * @param {unknown} val
 * @returns {val is Record<string, unknown>}
 */
function isPlainObject (val) {
	return val !== null && typeof val === "object" && !Array.isArray(val);
}

/**
 * For each .local / .local.deep file found in the profile directory, merge it
 * with the corresponding base file from ~/.claude and write the result into
 * the profile directory (without the .local prefix).
 *
 * When both .local and .local.deep exist for the same base file, .local.deep
 * is applied first (recursive), then .local on top (shallow).
 *
 * @param {string} profileDir - Absolute path to the profile directory
 * @returns {string[]} List of files that were merged
 */
export function mergeLocalFiles (profileDir) {
	const claudeDir = getClaudeDir();
	const merged = [];

	// Group by base file so we can apply deep then shallow in order
	const groups = new Map();

	for (const entry of MERGEABLE) {
		const localPath = path.join(profileDir, entry.local);

		if (!fs.existsSync(localPath)) {
			continue;
		}

		if (!groups.has(entry.base)) {
			groups.set(entry.base, { type: entry.type, entries: [] });
		}

		groups.get(entry.base).entries.push(entry);
	}

	for (const [base, { type, entries }] of groups) {
		const basePath = path.join(claudeDir, base);
		const outPath = path.join(profileDir, base);

		if (type === "json") {
			let result = readJSONSync(basePath) ?? {};

			// Sort: deep first, then shallow
			entries.sort((a, b) => (a.merge === "deep" ? -1 : 1) - (b.merge === "deep" ? -1 : 1));

			for (const entry of entries) {
				const localData = readJSONSync(path.join(profileDir, entry.local)) ?? {};

				if (entry.merge === "deep") {
					result = deepMerge(result, localData);
				}
				else {
					result = Object.assign({}, result, localData);
				}

				merged.push(`${ entry.local } → ${ base }`);
			}

			fs.writeFileSync(outPath, JSON.stringify(result, null, "\t") + "\n");
		}
		else {
			// Markdown: append local after a blank line
			const baseContent = readText(basePath);
			const localContent = readText(path.join(profileDir, entries[0].local));
			const separator = baseContent && localContent ? "\n\n" : "";
			fs.writeFileSync(outPath, baseContent + separator + localContent);
			merged.push(`${ entries[0].local } → ${ base }`);
		}
	}

	return merged;
}
