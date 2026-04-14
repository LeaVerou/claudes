import { getActiveProfile } from "../profiles.js";
import { emit } from "../cli.js";

/**
 * Outputs to stdout (not stderr) so it can be captured in scripts.
 */
function run () {
	const active = getActiveProfile();

	if (active === false) {
		// CLAUDE_CONFIG_DIR is set but not a recognized profile
		emit(process.env.CLAUDE_CONFIG_DIR);
	}
	else {
		emit(active);
	}
}

export default {
	description: "Show the active profile name",
	run,
};
