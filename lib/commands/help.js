import { flags, log } from "../cli.js";

/**
 * Generate and print help text. Receives the commands map from the dispatcher
 * so it doesn't need to import itself circularly.
 * @param {Map<string, object>} commands
 */
export function printHelp (commands) {
	const commandHelp = [...new Set(commands.values())]
		.map(cmd => {
			const names = [];

			for (const [n, c] of commands) {
				if (c === cmd) {
					names.push(n);
				}
			}

			const label = names.join(", ") + (cmd.args ? " " + cmd.args : "");
			return `  ${ label.padEnd(18) }${ cmd.description }`;
		})
		.join("\n");

	const flagHelp = Object.values(flags)
		.map(f => `  ${ f.flag.padEnd(18) }${ f.description }`)
		.join("\n");

	log(`claudes — Manage Claude Code configuration profiles

Commands:
${ commandHelp }

Options:
${ flagHelp }`);
}
