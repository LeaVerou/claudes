import select from "@inquirer/select";
import confirm from "@inquirer/confirm";

/**
 * Show an interactive profile selector. All prompts render to stderr
 * so stdout stays clean for shell eval.
 *
 * @param {string[]} profiles - List of profile names
 * @param {string | null} active - Currently active profile name
 * @returns {Promise<string | null>} Selected profile name, or null if cancelled
 */
export async function selectProfile (profiles, active) {
	const choices = profiles.map(name => ({
		name: name === active ? `● ${ name }` : `  ${ name }`,
		value: name,
	}));

	try {
		return await select({
			message: "Select a profile",
			choices,
			output: process.stderr,
		});
	}
	catch {
		// User cancelled (Ctrl+C)
		return null;
	}
}

/**
 * Ask the user to confirm an action. Renders to stderr.
 *
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export async function confirmAction (message) {
	try {
		return await confirm({
			message,
			default: false,
			output: process.stderr,
		});
	}
	catch {
		return false;
	}
}
