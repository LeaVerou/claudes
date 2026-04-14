import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { log } from "../cli.js";

const HOME = os.homedir();
export const SHELL_LINE = 'eval "$(claudes shell-init)"';

const RC_FILES = [
	path.join(HOME, ".zshrc"),
	path.join(HOME, ".bashrc"),
];

/**
 * Check if a file contains the shell-init line.
 * @param {string} filePath
 * @returns {boolean}
 */
export function hasShellInit (filePath) {
	try {
		const content = fs.readFileSync(filePath, "utf-8");
		return content.includes(SHELL_LINE);
	}
	catch {
		return false;
	}
}

/**
 * Append the shell-init line to a file.
 * @param {string} filePath
 */
export function appendShellInit (filePath) {
	const content = fs.readFileSync(filePath, "utf-8");
	const separator = content.endsWith("\n") ? "\n" : "\n\n";
	fs.appendFileSync(filePath, `${ separator }${ SHELL_LINE }\n`);
}

function run () {
	let modified = 0;
	let alreadyInstalled = 0;

	for (const rcFile of RC_FILES) {
		if (!fs.existsSync(rcFile)) {
			continue;
		}

		if (hasShellInit(rcFile)) {
			alreadyInstalled++;
			log(`Already installed in ${ path.basename(rcFile) }`);
			continue;
		}

		appendShellInit(rcFile);
		modified++;
		log(`Added shell wrapper to ${ path.basename(rcFile) }`);
	}

	if (modified === 0 && alreadyInstalled === 0) {
		log("No shell rc files found (.zshrc, .bashrc)");
		process.exitCode = 1;
	}
	else if (modified > 0) {
		log("Restart your shell or run: source ~/" + path.basename(RC_FILES[0]));
	}
}

export default {
	description: "Add shell wrapper to .zshrc/.bashrc",
	run,
};
