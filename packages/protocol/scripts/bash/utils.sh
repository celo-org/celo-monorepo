# USAGE: startInBgAndWaitForString <pattern> <command>
# This function will start `command` as a background process, but block until
# a line matching `pattern` appears on its standard output.
function startInBgAndWaitForString() {
    # Grab the first argument and remove it from the argument list.
    local patternToWaitFor=$1
    shift

    # The rest of the arguments are the command we will run.
    local cmd=$@

    # Create a named pipe. The command will write to it, and we will read from
    # it to wait for the expected output.
    local pipe=$(mktemp -u)
    mkfifo $pipe

    # Execute the given command, directing its output to both STDOUT and the
    # pipe we created.
    $cmd | tee $pipe &

    local gotIt=0
    while [[ $gotIt != 1 ]]; do
        local line
        read line
        if echo "$line" | grep "$patternToWaitFor" > /dev/null; then
            gotIt=1
        fi
    done <$pipe
}
