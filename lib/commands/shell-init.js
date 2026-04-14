import { shellEscape } from "../shell.js";

function run () {
	const bin = shellEscape(process.argv[1]);

	process.stdout.write(`claudes() {
  local output
  output=$(command '${ bin }' "$@")
  local rc=$?
  [ -n "$output" ] && eval "$output"
  return $rc
}
`);
}

export default {
	description: "Output shell wrapper (add to .bashrc/.zshrc)",
	run,
};
