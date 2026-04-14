/**
 * Escape a value for safe embedding in a single-quoted shell string.
 * Handles the edge case where the value contains single quotes
 * (e.g. a home dir like /Users/O'Brien).
 * @param {string} val
 */
export function shellEscape (val) {
	return val.replace(/'/g, "'\\''");
}