import { spawnSync } from "node:child_process";
import path from "node:path";

const BIN = path.resolve(import.meta.dirname, "../bin/claudes.js");

/**
 * Run the CLI and return { stdout, stderr, exitCode }.
 * @param {string[]} args
 * @param {object} [env] - Extra environment variables
 */
function run (args, env = {}) {
	const result = spawnSync("node", [BIN, ...args], {
		encoding: "utf-8",
		env: { ...process.env, ...env },
	});

	return {
		stdout: result.stdout,
		stderr: result.stderr,
		exitCode: result.status,
	};
}

export default {
	name: "CLI integration",
	run: (arg) => run(Array.isArray(arg) ? arg : [arg]),
	tests: [
		{
			name: "No args runs list",
			arg: [],
			check: (r) => (r.stdout + r.stderr).includes("Select a profile"),
			expect: true,
		},
		{
			name: "help command",
			arg: "help",
			check: (r) => r.exitCode === 0 && r.stderr.includes("Commands:"),
			expect: true,
		},
		{
			name: "--help flag",
			arg: "--help",
			check: (r) => r.exitCode === 0 && r.stderr.includes("Commands:"),
			expect: true,
		},
		{
			name: "Unknown command exits 1",
			run: () => run(["bogus"]).exitCode,
			expect: 1,
		},
		{
			name: "use without name exits 1",
			run: () => run(["use"]).exitCode,
			expect: 1,
		},
		{
			name: "shell-init outputs wrapper function",
			arg: "shell-init",
			check: (r) => r.stdout.includes("claudes()") && r.stdout.includes("eval"),
			expect: true,
		},
		{
			name: "which outputs to stdout",
			run: () => run(["which"], { CLAUDE_CONFIG_DIR: "" }),
			check: (r) => r.stdout.trim() === "default" && r.exitCode === 0,
			expect: true,
		},
	],
};
