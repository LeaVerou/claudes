import { readJSONSync, readText } from "../lib/merge.js";

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
	],
};
