# Usage: import this file with `source scripts/bash/ffi/ffi-script.sh`
# This allows for easy interfacing of any bash script with Forge's FFI.
# The script will exit by printing the RLP encoding of
# - The exit code (uint256)
# - The stdout logs (string)
# - The stderr logs (string)
# - The JSON output file (string, details below)
#
# The original script can still be run as a regular bash script (e.g. for debugging) by setting
# `NO_FFI` to 1 in the environment.
# Typical usage in solidity might look like this:
#     string[] memory cmd = new string[](2);
#     cmd[0] = "bash";
#     cmd[1] = "path/to/script.sh";
#     bytes memory output = vm.ffi(cmd);
#     (uint256 exit, string memory logs, string memory errLogs, string memory json) = abi.decode(output, (uint256, string, string, string));
#
# JSON output file:
# This is intended as a method for getting more complex/structured output through FFI, especially
# when there might be additional logging present in the script (e.g. debugging, extra output from
# yarn) that we don't want to parse through in Solidity.
# The FFI_JSON_OUTPUT variable will contain the path to a temporary file whose contents will be in
# the end included in the RLP output of the script when using FFI. When NO_FFI is set, this file
# will be /dev/stdout, so the data will be simply printed to the console.
# Despite the name, there's no checks that the written data is actually in JSON format.
#
# Warning: this relies on some bash trickery. In particular:
# - Do not mess with file descirptors 1, 2, or 3
# - Do not set an EXIT trap

if [[ $NO_FFI -eq 1 ]]; then
  FFI_MODE=0
else
  FFI_MODE=1
fi

function ffiPreExit() {
  local EXIT=$?
  local LOGS=`cat $FFI_LOGS`
  local ERR_LOGS=`cat $FFI_ERR_LOGS`
  local JSON_OUTPUT=`cat $FFI_JSON_OUTPUT`

  # Return to the original stdout
  exec 1<&3-
  cast abi-encode "output(uint256,string,string,string)" "$EXIT" "$LOGS" "$ERR_LOGS" "$JSON_OUTPUT"
}

if [[ $NO_FFI -eq 1 ]]; then
  FFI_JSON_OUTPUT=/dev/stdout
else
  FFI_LOGS=`mktemp`
  FFI_ERR_LOGS=`mktemp`
  FFI_JSON_OUTPUT=`mktemp`
  # Save the stdout file descriptor so we can later output to it again
  exec 3<&1
  # Redirect stdout
  exec 1>"$FFI_LOGS"
  # Redirect stderr
  exec 2>"$FFI_ERR_LOGS"
  # Will print the RLP encoded output of the script before exitting.
  trap "ffiPreExit" EXIT
fi
