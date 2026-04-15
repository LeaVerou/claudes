import { getActiveProfile } from "../profiles.js";

/**
 * Outputs to stdout (not via emit) so it works with or without the wrapper,
 * and can be captured in scripts: $(claudes which)
 */
function run () {
	const active = getActiveProfile();

	if (active === false) {
		process.stdout.write(process.env.CLAUDE_CONFIG_DIR + "\n");
	}
	else {
		process.stdout.write(active + "\n");
	}
}

export default {
	description: "Show the active profile name",
	run,
};
