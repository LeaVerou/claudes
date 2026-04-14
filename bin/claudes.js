#!/usr/bin/env node

import { flags, parseFlags, log } from "../lib/cli.js";
import { printHelp } from "../lib/commands/help.js";
import * as commandDefs from "../lib/commands/index.js";

// Build lookup map: command name + aliases → descriptor
const commands = new Map();

for (const [name, cmd] of Object.entries(commandDefs)) {
	// Convert camelCase export name to kebab-case command name
	const cmdName = name.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
	commands.set(cmdName, cmd);

	for (const alias of cmd.aliases ?? []) {
		commands.set(alias, cmd);
	}
}

const positional = parseFlags(process.argv.slice(2));
let [command, ...args] = positional;

// `claudes -x foo` is shorthand for `claudes use -x foo`
if (flags.exec.value && command && !commands.has(command)) {
	args = [command, ...args];
	command = "use";
}

// --help or `help` command
if (flags.help.value || command === "help" || !command) {
	printHelp(commands);

	if (command && command !== "help" && !commands.has(command)) {
		log(`\nUnknown command: ${ command }`);
		process.exitCode = 1;
	}
}
else {
	try {
		const cmd = commands.get(command);

		if (cmd) {
			if (cmd.args && !args[0]) {
				log(`Usage: claudes ${ command } ${ cmd.args }`);
				process.exitCode = 1;
			}
			else {
				await cmd.run(args);
			}
		}
		else {
			printHelp(commands);
			log(`\nUnknown command: ${ command }`);
			process.exitCode = 1;
		}
	}
	catch (err) {
		log(`Error: ${ err.message }`);
		process.exitCode = 1;
	}
}
