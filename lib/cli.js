import fs from "node:fs";

/**
 * CLI flag definitions. Each key is the programmatic name, with the flag
 * string, description (used in --help), and runtime value.
 * The dispatcher parses argv and sets .value; other modules just import and read.
 */
export const flags = {
	help: { flag: "--help", description: "Show this help message", value: false },
	dryRun: { flag: "--dry-run", description: "Show what would happen without making changes", value: false },
	exec: { flag: "-x", description: "Also launch Claude after switching (use only)", value: false },
};

/** Map from flag string to flag object, for fast lookup during parsing. */
export const flagsByString = Object.fromEntries(
	Object.values(flags).map(f => [f.flag, f]),
);

/**
 * Recorded output from log() and emit() calls.
 * Tests can inspect these after calling a command directly.
 */
export const output = {
	messages: [],
	shell: [],

	/** Reset recorded output. Call before each test. */
	reset () {
		this.messages.length = 0;
		this.shell.length = 0;
	},

	/** Return a plain snapshot for assertions. */
	snapshot () {
		return { messages: [...this.messages], shell: [...this.shell] };
	},
};

/**
 * Parse argv: set flag values, return positional args.
 * @param {string[]} argv
 * @returns {string[]} Positional arguments (flags stripped out)
 */
export function parseFlags (argv) {
	const positional = [];

	for (const arg of argv) {
		if (flagsByString[arg]) {
			flagsByString[arg].value = true;
		}
		else {
			positional.push(arg);
		}
	}

	return positional;
}

/**
 * Print a message to stderr (visible to the user, not captured by shell eval).
 * @param {string} msg
 */
export function log (msg) {
	output.messages.push(msg);
	process.stderr.write(msg + "\n");
}

/**
 * fd 3 is used by the shell wrapper to capture shell commands, keeping
 * stdout free for interactive UI and data output. If fd 3 isn't open,
 * we're running without the wrapper.
 */
let fd3;
try {
	fd3 = fs.createWriteStream(null, { fd: 3 });
	fd3.on("error", () => {}); // Suppress errors if fd closes
}
catch {
	fd3 = null;
}

export const hasWrapper = fd3 !== null;

let wrapperWarned = false;

/**
 * Emit a shell command for the wrapper to eval via fd 3.
 * In dry-run mode, prints to stderr prefixed with $ instead.
 * When no wrapper is active, suppresses output and warns once.
 * @param {string} cmd
 */
export function emit (cmd) {
	output.shell.push(cmd);

	if (flags.dryRun.value) {
		process.stderr.write(`$ ${ cmd }\n`);
	}
	else if (fd3) {
		fd3.write(cmd + "\n");
	}
	else if (!wrapperWarned) {
		wrapperWarned = true;
		log("Shell wrapper not active. Run `claudes install` then restart your shell.");
	}
}
