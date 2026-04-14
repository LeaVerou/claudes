import { DEFAULT_PROFILE, getProfileDir, listProfiles, ensureProfile, validateName } from "../profiles.js";
import { mergeLocalFiles } from "../merge.js";
import { readConfig, claudeCommand } from "../config.js";
import { shellEscape } from "../shell.js";
import { flags, log, emit } from "../cli.js";

/**
 * Emit the shell alias for `claude` if the profile has flags configured,
 * or unalias if switching away from a flagged profile.
 * @param {object} [config]
 */
function emitClaudeAlias (config) {
	const cmd = claudeCommand(config);

	if (cmd !== "claude") {
		emit(`alias claude='${ shellEscape(cmd) }'`);
	}
	else {
		// Clear any alias from a previous profile
		emit("unalias claude 2>/dev/null || true");
	}
}

/**
 * Switch to a profile: ensure it exists, merge .local files, emit export.
 * @param {string[]} args
 */
function run ([name]) {
	if (name === DEFAULT_PROFILE) {
		emit("unset CLAUDE_CONFIG_DIR");
		emit("unalias claude 2>/dev/null || true");
		log(`Switched to profile "${ DEFAULT_PROFILE }"`);

		if (flags.exec.value) {
			emit("claude");
		}

		return;
	}

	if (flags.dryRun.value) {
		validateName(name);
		const dir = getProfileDir(name);
		const exists = listProfiles().includes(name);

		if (!exists) {
			log(`Would create profile "${ name }"`);
		}

		log(`Would merge .local files in ${ dir }`);
		emit(`export CLAUDE_CONFIG_DIR='${ shellEscape(dir) }'`);

		const config = readConfig(dir);
		emitClaudeAlias(config);

		if (flags.exec.value) {
			emit(claudeCommand(config));
		}

		return;
	}

	const { dir, created } = ensureProfile(name);

	if (created) {
		log(`Created profile "${ name }"`);
	}

	const merged = mergeLocalFiles(dir);

	if (merged.length > 0) {
		log(`Merged: ${ merged.join(", ") }`);
	}

	emit(`export CLAUDE_CONFIG_DIR='${ shellEscape(dir) }'`);

	const config = readConfig(dir);
	emitClaudeAlias(config);

	log(`Switched to profile "${ name }"`);

	if (flags.exec.value) {
		emit(claudeCommand(config));
	}
}

export default {
	args: "<name>",
	description: "Switch to a profile (creates it if needed)",
	run,
};
