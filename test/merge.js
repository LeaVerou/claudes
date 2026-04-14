import { readJSONSync, readText, deepMerge } from "../lib/merge.js";

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
	],
};
