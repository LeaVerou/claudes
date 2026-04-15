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

	// Interactive selector needs a TTY — print the list and bail otherwise
	// so we don't hang on a stdin that will never deliver a keypress.
	if (!process.stdin.isTTY) {
		for (const name of profiles) {
			log(name === active ? `● ${ name }` : `  ${ name }`);
		}

		return;
	}

	const selected = await selectProfile(profiles, active);

	if (!selected) {
		return;
	}

	use.run([selected]);
}

export default {
	aliases: ["ls"],
	description: "List profiles and select one interactively",
	run,
};
