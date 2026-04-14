import { claudeCommand } from "../lib/config.js";

export default {
	name: "claudeCommand()",
	run: claudeCommand,
	tests: [
		{
			name: "No config",
			arg: undefined,
			expect: "claude",
		},
		{
			name: "Empty config",
			arg: {},
			expect: "claude",
		},
		{
			name: "Empty flags",
			arg: { flags: [] },
			expect: "claude",
		},
		{
			name: "Single flag",
			arg: { flags: ["--verbose"] },
			expect: "claude --verbose",
		},
		{
			name: "Plugin dir",
			arg: { flags: ["--plugin-dir", "/path/to/plugins"] },
			expect: "claude --plugin-dir /path/to/plugins",
		},
		{
			name: "Multiple flags (array)",
			arg: { flags: ["--plugin-dir", "./plugins", "--verbose"] },
			expect: "claude --plugin-dir ./plugins --verbose",
		},
		{
			name: "String flags",
			arg: { flags: "--plugin-dir ./plugins --verbose" },
			expect: "claude --plugin-dir ./plugins --verbose",
		},
		{
			name: "Empty string flags",
			arg: { flags: "" },
			expect: "claude",
		},
	],
};
