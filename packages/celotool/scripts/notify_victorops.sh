#!/bin/bash

set -eu
result=$1

if [ "$result" == "FAILURE" ]; then
  fail_modes=$2
  message=":red_circle: Job $CIRCLE_JOB failed: The syncmodes $fail_modes failed to sync on Mainnet"
else
  message=":tada: Job $CIRCLE_JOB succeeded. All modes could sync successfully on Mainnet"
fi

payload="{
    \"entity_type\": \"Build System\",
    \"event_type\": \"Build\",
    \"source\": \"CircleCI\",
    \"summary\": \"Geth syncmode tests to Mainnet\",
    \"url\": \"$CIRCLE_BUILD_URL\",
    \"action\": \"test\",
    \"result\": \"$result\",
    \"long_message\": \"$message\"
}"

curl -H "Content-Type: application/json; charset=UTF-8" -X POST --data "$payload" "$VICTOROPS_NOTIFICATION_URL"
