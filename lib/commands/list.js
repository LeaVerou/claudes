import { getActiveProfile, listProfiles } from "../profiles.js";
import { selectProfile } from "../ui.js";
import { log } from "../cli.js";
import use from "./use.js";

async function run () {
	const profiles = listProfiles();

	if (profiles.length === 0) {
		log("No profiles yet. Create one with: claudes use <name>");
		return;
	}

	const active = getActiveProfile();
	const selected = await selectProfile(profiles, active);

	if (!selected) {
		return;
	}

	if (selected !== active) {
		use.run([selected]);
	}
	else {
		log(`Already on profile "${ active }"`);
	}
}

export default {
	aliases: ["ls"],
	description: "List profiles and select one interactively",
	run,
};
