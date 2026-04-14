import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hasShellInit, appendShellInit, SHELL_LINE } from "../lib/commands/install.js";

const TMP = path.join(os.tmpdir(), "claudes-test-" + Date.now());

function tmpFile (name, content) {
	const p = path.join(TMP, name);
	fs.writeFileSync(p, content);
	return p;
}

export default {
	beforeAll () {
		fs.mkdirSync(TMP, { recursive: true });
	},
	afterAll () {
		fs.rmSync(TMP, { recursive: true, force: true });
	},
	tests: [
		{
			name: "hasShellInit()",
			run: hasShellInit,
			tests: [
				{
					name: "Returns false for missing file",
					arg: path.join(TMP, "nonexistent"),
					expect: false,
				},
				{
					name: "Returns false for file without line",
					run: () => hasShellInit(tmpFile("empty.sh", "# my config\n")),
					expect: false,
				},
				{
					name: "Returns true when line present",
					run: () => hasShellInit(tmpFile("has-it.sh", `# config\n${ SHELL_LINE }\n`)),
					expect: true,
				},
			],
		},
		{
			name: "appendShellInit()",
			tests: [
				{
					name: "Appends line to file",
					run () {
						const p = tmpFile("append.sh", "# existing\n");
						appendShellInit(p);
						return fs.readFileSync(p, "utf-8");
					},
					check: (content) =>
						content.includes(SHELL_LINE) &&
						content.startsWith("# existing\n"),
					expect: true,
				},
				{
					name: "Idempotent — hasShellInit true after append",
					run () {
						const p = tmpFile("idem.sh", "# config\n");
						appendShellInit(p);
						return hasShellInit(p);
					},
					expect: true,
				},
			],
		},
	],
};
