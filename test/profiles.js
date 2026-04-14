import { validateName, getProfileDir } from "../lib/profiles.js";
import path from "node:path";
import os from "node:os";

const HOME = os.homedir();

export default {
	tests: [
		{
			name: "validateName()",
			run: validateName,
			tests: [
				{
					name: "Valid names",
					throws: false,
					tests: [
						{ arg: "sandbox" },
						{ arg: "my-profile" },
						{ arg: "test_123" },
						{ arg: "UPPER" },
						{ arg: "a" },
					],
				},
				{
					name: "Invalid names",
					throws: true,
					tests: [
						{ name: "Path traversal", arg: "../evil" },
						{ name: "Slash", arg: "foo/bar" },
						{ name: "Backslash", arg: "foo\\bar" },
						{ name: "Dot-dot", arg: ".." },
						{ name: "Single dot", arg: "." },
						{ name: "Empty string", arg: "" },
						{ name: "Spaces", arg: "has space" },
						{ name: "Special chars", arg: "hello@world" },
						{ name: "Starts with dot", arg: ".hidden" },
					],
				},
			],
		},
		{
			name: "getProfileDir()",
			run: getProfileDir,
			tests: [
				{
					arg: "sandbox",
					expect: path.join(HOME, ".claude-sandbox"),
				},
				{
					arg: "my-profile",
					expect: path.join(HOME, ".claude-my-profile"),
				},
			],
		},
	],
};
