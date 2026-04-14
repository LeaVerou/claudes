import { DEFAULT_PROFILE, getActiveProfile, listProfiles, removeProfile } from "../profiles.js";
import { confirmAction } from "../ui.js";
import { flags, log, emit } from "../cli.js";

async function run ([name]) {
	if (name === DEFAULT_PROFILE) {
		log("Cannot remove the default profile.");
		process.exitCode = 1;
		return;
	}

	const profiles = listProfiles();

	if (!profiles.includes(name)) {
		log(`Profile "${ name }" does not exist.`);
		process.exitCode = 1;
		return;
	}

	if (flags.dryRun.value) {
		const wasActive = getActiveProfile() === name;
		log(`Would remove profile "${ name }"`);

		if (wasActive) {
			emit("unset CLAUDE_CONFIG_DIR");
		}

		return;
	}

	const ok = await confirmAction(`Remove profile "${ name }" and all its data?`);

	if (!ok) {
		log("Cancelled.");
		return;
	}

	const wasActive = getActiveProfile() === name;
	removeProfile(name);
	log(`Removed profile "${ name }"`);

	if (wasActive) {
		emit("unset CLAUDE_CONFIG_DIR");
		log("Switched to default profile");
	}
}

export default {
	aliases: ["remove"],
	args: "<name>",
	description: "Remove a profile",
	run,
};
