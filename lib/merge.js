import fs from "node:fs";
import path from "node:path";
import { getClaudeDir } from "./profiles.js";

/**
 * Type-specific merge strategies. Each type has a shallow and deep function
 * that takes (base, local) and returns the merged result.
 */
const TYPES = {
	json: {
		read: readJSONSync,
		write: (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, "\t") + "\n"),
		shallow: (base, local) => Object.assign({}, base ?? {}, local ?? {}),
		deep: (base, local) => deepMerge(base ?? {}, local ?? {}),
	},
	md: {
		read: readText,
		write: (filePath, data) => fs.writeFileSync(filePath, data),
		shallow: (base, local) => base + (base && local ? "\n\n" : "") + local,
		deep: mergeMarkdownByHeading,
	},
};

/**
 * Parse a filename into { base, ext, depth } if it matches a known .local suffix.
 * Returns undefined if no suffix matches.
 * @param {string} filename
 */
export function parseLocalName (filename) {
	// Extract extension to determine type
	const extMatch = filename.match(/\.(json|md)$/);

	if (!extMatch) {
		return undefined;
	}

	const ext = extMatch[1];
	const withoutExt = filename.slice(0, -ext.length - 1);

	// Check .local.deep before .local (longer suffix first)
	if (withoutExt.endsWith(".local.deep")) {
		return { base: withoutExt.slice(0, -".local.deep".length) + "." + ext, ext, depth: "deep" };
	}

	if (withoutExt.endsWith(".local")) {
		return { base: withoutExt.slice(0, -".local".length) + "." + ext, ext, depth: "shallow" };
	}

	return undefined;
}

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

	try {
		return JSON.parse(raw);
	}
	catch (err) {
		throw new SyntaxError(`Invalid JSON in ${ filePath }: ${ err.message }`);
	}
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
 * Parse markdown into sections keyed by heading text.
 * Returns { preamble, sections } where preamble is text before the first
 * heading, and sections is a Map of heading → { level, content }.
 * @param {string} md
 */
export function parseMarkdownSections (md) {
	const lines = md.split("\n");
	const sections = new Map();
	let preamble = "";
	let currentHeading = null;
	let currentContent = [];

	for (const line of lines) {
		const match = line.match(/^(#{1,6})\s+(.+)$/);

		if (match) {
			// Flush previous section
			if (currentHeading) {
				sections.set(currentHeading.text, {
					level: currentHeading.level,
					content: currentContent.join("\n"),
				});
			}
			else {
				preamble = currentContent.join("\n");
			}

			currentHeading = { level: match[1].length, text: match[2].trim() };
			currentContent = [line];
		}
		else {
			currentContent.push(line);
		}
	}

	// Flush last section
	if (currentHeading) {
		sections.set(currentHeading.text, {
			level: currentHeading.level,
			content: currentContent.join("\n"),
		});
	}
	else {
		preamble = currentContent.join("\n");
	}

	return { preamble, sections };
}

/**
 * Deep merge for markdown: local sections with the same heading replace
 * the base section. New headings are appended.
 * @param {string} base
 * @param {string} local
 * @returns {string}
 */
export function mergeMarkdownByHeading (base, local) {
	if (!base) {
		return local;
	}
	if (!local) {
		return base;
	}

	const baseParsed = parseMarkdownSections(base);
	const localParsed = parseMarkdownSections(local);

	// Start with base preamble, override if local has one
	let preamble = localParsed.preamble.trim()
		? localParsed.preamble
		: baseParsed.preamble;

	// Merge sections: base order, with local overrides
	const merged = new Map(baseParsed.sections);

	for (const [heading, section] of localParsed.sections) {
		merged.set(heading, section);
	}

	const parts = [preamble.trimEnd()];

	for (const [, section] of merged) {
		parts.push(section.content.trimEnd());
	}

	return parts.filter(Boolean).join("\n\n") + "\n";
}

/**
 * Scan profile directory for .local files, merge each with the corresponding
 * base file from ~/.claude, and write the result into the profile directory.
 *
 * @param {string} profileDir - Absolute path to the profile directory
 * @returns {string[]} List of files that were merged
 */
export function mergeLocalFiles (profileDir) {
	const claudeDir = getClaudeDir();
	const merged = [];

	let files;

	try {
		files = fs.readdirSync(profileDir);
	}
	catch {
		return merged;
	}

	// Group by base filename, preserving depth order
	const groups = new Map();

	for (const file of files) {
		const parsed = parseLocalName(file);

		if (!parsed) {
			continue;
		}

		if (!groups.has(parsed.base)) {
			groups.set(parsed.base, []);
		}

		groups.get(parsed.base).push({ file, ...parsed });
	}

	for (const [base, entries] of groups) {
		const basePath = path.join(claudeDir, base);
		const outPath = path.join(profileDir, base);
		const type = TYPES[entries[0].ext];

		if (!type) {
			continue;
		}

		// Deep before shallow
		entries.sort((a, b) => (a.depth === "deep" ? -1 : 1) - (b.depth === "deep" ? -1 : 1));

		let result = type.read(basePath);

		for (const entry of entries) {
			const localData = type.read(path.join(profileDir, entry.file));
			result = type[entry.depth](result, localData);
			merged.push(`${ entry.file } → ${ base }`);
		}

		type.write(outPath, result);
	}

	return merged;
}
