import { shellEscape } from "../lib/shell.js";

export default {
	name: "shellEscape()",
	run: shellEscape,
	tests: [
		{
			name: "No quotes",
			arg: "/Users/alice/.claude-sandbox",
			expect: "/Users/alice/.claude-sandbox",
		},
		{
			name: "Single quote in path",
			arg: "/Users/O'Brien/.claude-sandbox",
			expect: "/Users/O'Brien/.claude-sandbox".replace(/'/g, "'\\''"),
		},
		{
			name: "Multiple single quotes",
			arg: "it's a 'test'",
			expect: "it'\\''s a '\\''test'\\''",
		},
		{
			name: "Empty string",
			arg: "",
			expect: "",
		},
		{
			name: "Double quotes unchanged",
			arg: '/Users/"alice"/.claude',
			expect: '/Users/"alice"/.claude',
		},
	],
};
