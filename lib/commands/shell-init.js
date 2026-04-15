import { shellEscape } from "../shell.js";

/**
 * Generate the shell wrapper function body.
 * Exported so `install` can emit it directly without a round-trip.
 */
export function wrapperSource () {
	const bin = shellEscape(process.argv[1]);

	return `claudes() {
  local shellcmds
  shellcmds=$(CLAUDES_WRAPPER=1 command '${ bin }' "$@" 3>&1 1>&2)
  local rc=$?
  if [ -n "$shellcmds" ]; then
    local line
    while IFS= read -r line; do
      case "$line" in
        export\\ *|unset\\ *|alias\\ *|unalias\\ *|eval\\ *) eval "$line" ;;
        *) printf '%s\\n' "$line" ;;
      esac
    done <<< "$shellcmds"
  fi
  return $rc
}`;
}

function run () {
	process.stdout.write(wrapperSource() + "\n");
}

export default {
	description: "Output shell wrapper (add to .bashrc/.zshrc)",
	run,
};
