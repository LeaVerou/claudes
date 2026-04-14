import { readJSONSync, readText, deepMerge, parseLocalName, mergeMarkdownByHeading } from "../lib/merge.js";

// Use a non-existent path for ENOENT tests
const MISSING = "/tmp/claudes-test-nonexistent-" + Date.now();

export default {
	tests: [
		{
			name: "readJSONSync()",
			run: readJSONSync,
			tests: [
				{
					name: "Missing file returns undefined",
					arg: MISSING + "/settings.json",
					expect: undefined,
				},
				{
					name: "Malformed JSON throws",
					throws: true,
					run () {
						return readJSONSync(import.meta.dirname + "/fixtures/malformed.json");
					},
				},
				{
					name: "Valid JSON parsed correctly",
					arg: import.meta.dirname + "/fixtures/valid.json",
					expect: { key: "value", nested: { a: 1 } },
				},
			],
		},
		{
			name: "readText()",
			run: readText,
			tests: [
				{
					name: "Missing file returns empty string",
					arg: MISSING + "/CLAUDE.md",
					expect: "",
				},
				{
					name: "Existing file returns contents",
					arg: import.meta.dirname + "/fixtures/sample.md",
					expect: "# Hello\n\nWorld\n",
				},
			],
		},
		{
			name: "deepMerge()",
			run: deepMerge,
			tests: [
				{
					name: "Flat keys",
					args: [{ a: 1, b: 2 }, { b: 3, c: 4 }],
					expect: { a: 1, b: 3, c: 4 },
				},
				{
					name: "Nested objects merge recursively",
					args: [
						{ permissions: { allow: ["Read"], deny: ["Write"] } },
						{ permissions: { allow: ["Bash"] } },
					],
					expect: { permissions: { allow: ["Bash"], deny: ["Write"] } },
				},
				{
					name: "Arrays are replaced, not merged",
					args: [{ items: [1, 2, 3] }, { items: [4] }],
					expect: { items: [4] },
				},
				{
					name: "Deeply nested",
					args: [
						{ a: { b: { c: 1, d: 2 }, e: 3 } },
						{ a: { b: { c: 10 } } },
					],
					expect: { a: { b: { c: 10, d: 2 }, e: 3 } },
				},
				{
					name: "Source overrides non-object with object",
					args: [{ a: "string" }, { a: { nested: true } }],
					expect: { a: { nested: true } },
				},
				{
					name: "Source overrides object with non-object",
					args: [{ a: { nested: true } }, { a: "string" }],
					expect: { a: "string" },
				},
				{
					name: "Empty source returns target",
					args: [{ a: 1 }, {}],
					expect: { a: 1 },
				},
				{
					name: "Empty target returns source",
					args: [{}, { a: 1 }],
					expect: { a: 1 },
				},
			],
		},
		{
			name: "parseLocalName() base",
			run: (arg) => parseLocalName(arg)?.base,
			tests: [
				{ arg: "settings.local.json", expect: "settings.json" },
				{ arg: "settings.local.deep.json", expect: "settings.json" },
				{ arg: "CLAUDE.local.md", expect: "CLAUDE.md" },
				{ arg: "CLAUDE.local.deep.md", expect: "CLAUDE.md" },
				{ arg: ".claude.local.json", expect: ".claude.json" },
				{ arg: "custom-config.local.deep.json", expect: "custom-config.json" },
				{ arg: "settings.json", expect: undefined },
				{ arg: "README.md", expect: undefined },
			],
		},
		{
			name: "parseLocalName() depth",
			run: (arg) => parseLocalName(arg)?.depth,
			tests: [
				{ arg: "settings.local.json", expect: "shallow" },
				{ arg: "settings.local.deep.json", expect: "deep" },
				{ arg: "CLAUDE.local.md", expect: "shallow" },
				{ arg: "CLAUDE.local.deep.md", expect: "deep" },
			],
		},
		{
			name: "mergeMarkdownByHeading()",
			run: mergeMarkdownByHeading,
			tests: [
				{
					name: "Local overrides matching heading",
					args: [
						"# Title\n\nIntro\n\n## Section A\n\nBase A\n\n## Section B\n\nBase B\n",
						"## Section A\n\nOverridden A\n",
					],
					expect: "# Title\n\nIntro\n\n## Section A\n\nOverridden A\n\n## Section B\n\nBase B\n",
				},
				{
					name: "New heading is appended",
					args: [
						"## Existing\n\nContent\n",
						"## New\n\nNew content\n",
					],
					expect: "## Existing\n\nContent\n\n## New\n\nNew content\n",
				},
				{
					name: "Empty base returns local",
					args: ["", "## Hello\n\nWorld\n"],
					expect: "## Hello\n\nWorld\n",
				},
				{
					name: "Empty local returns base",
					args: ["## Hello\n\nWorld\n", ""],
					expect: "## Hello\n\nWorld\n",
				},
				{
					name: "Preamble overridden by local preamble",
					args: [
						"Base preamble\n\n## A\n\nContent\n",
						"Local preamble\n",
					],
					expect: "Local preamble\n\n## A\n\nContent\n",
				},
			],
		},
	],
};
