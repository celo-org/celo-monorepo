#!/bin/bash

set -eu
result=$1

if [ "$result" == "FAILURE" ]; then
  message_type="CRITICAL"
  fail_modes=$2
  message="Geth Integration tests: Job $CIRCLE_JOB failed: The syncmodes $fail_modes failed to sync on Mainnet: $CIRCLE_BUILD_URL"
else
  message_type="INFO"
  message="Geth Integration tests: Job $CIRCLE_JOB succeeded. All modes could sync successfully on Mainnet: $CIRCLE_BUILD_URL"
fi

payload="{
    \"message_type\": \"$message_type\",
    \"entity_id\": \"$CIRCLE_BUILD_NUM\",
    \"entity_display_name\": \"CircleCI JOB $CIRCLE_BUILD_NUM\",
    \"state_message\": \"$message\"
}"

curl -H "Content-Type: application/json; charset=UTF-8" -X POST --data "$payload" "$VICTOROPS_NOTIFICATION_URL"
