import { output, flags } from "../lib/cli.js";
import { DEFAULT_PROFILE } from "../lib/profiles.js";
import use from "../lib/commands/use.js";
import reset from "../lib/commands/reset.js";
import os from "node:os";

const HOME = os.homedir();

function setup () {
	output.reset();
	flags.dryRun.value = true;
	flags.exec.value = false;
}

export default {
	beforeEach: setup,
	tests: [
		{
			name: "use",
			tests: [
				{
					name: "Emits export for new profile",
					run () {
						use.run(["test-unit"]);
						return output.snapshot().shell;
					},
					expect: [`export CLAUDE_CONFIG_DIR='${ HOME }/.claude-test-unit'`],
				},
				{
					name: "Reports creation for new profile",
					run () {
						use.run(["test-unit"]);
						return output.snapshot().messages;
					},
					check: (msgs) => msgs.some(m => m.includes("Would create")),
					expect: true,
				},
				{
					name: "Default profile unsets CLAUDE_CONFIG_DIR",
					run () {
						use.run([DEFAULT_PROFILE]);
						return output.snapshot().shell;
					},
					expect: ["unset CLAUDE_CONFIG_DIR"],
				},
				{
					name: "-x emits claude after export",
					run () {
						flags.exec.value = true;
						use.run(["test-unit"]);
						return output.snapshot().shell;
					},
					check: (shell) =>
						shell[0]?.startsWith("export CLAUDE_CONFIG_DIR=") &&
						shell.at(-1) === "claude",
					expect: true,
				},
				{
					name: "Invalid name throws",
					throws: true,
					run () {
						use.run(["../evil"]);
					},
				},
			],
		},
		{
			name: "reset",
			tests: [
				{
					name: "Emits unset when a profile is active",
					run () {
						process.env.CLAUDE_CONFIG_DIR = `${ HOME }/.claude-test`;
						reset.run();
						delete process.env.CLAUDE_CONFIG_DIR;
						return output.snapshot().shell;
					},
					expect: ["unset CLAUDE_CONFIG_DIR"],
				},
				{
					name: "No shell output when already default",
					run () {
						delete process.env.CLAUDE_CONFIG_DIR;
						reset.run();
						return output.snapshot();
					},
					expect: {
						shell: [],
						messages: ["Already on default profile"],
					},
				},
			],
		},
	],
};
