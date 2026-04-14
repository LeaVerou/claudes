import { DEFAULT_PROFILE, getActiveProfile } from "../profiles.js";
import { flags, log, emit } from "../cli.js";

function run () {
	const active = getActiveProfile();

	if (active === DEFAULT_PROFILE) {
		log("Already on default profile");
		return;
	}

	emit("unset CLAUDE_CONFIG_DIR");

	if (!flags.dryRun.value) {
		log("Switched to default profile");
	}
}

export default {
	description: "Switch back to the default profile",
	run,
};
