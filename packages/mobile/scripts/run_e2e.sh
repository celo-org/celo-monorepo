#!/usr/bin/env bash
export CELO_TEST_CONFIG=e2e

# Just to be safe kill any process that listens on the port 'yarn start' is going to use
lsof -t -i :8081 | xargs kill -9
yarn start:bg

yarn dev:emulator
./scripts/unlock.sh

if [ $? -ne 0 ]
then
  exit 1
fi

echo "Waiting for emulator to unlock..."
# TODO: improve this to actually poll if the screen is unlocked
sleep 10
echo "Emulator unlocked!"

yarn test:detox
STATUS=$?

 # Retry on fail logic
if [ $STATUS -ne 0 ]; then
   echo "It failed once, let's try again"
   yarn test:detox
   STATUS=$?
fi

if [ $STATUS -ne 0 ]; then
   # TODO: upload e2e_run.log and attach the link
   #http POST $SLACK_HOOK_URL < e2e/test_fail.json
else
   #http POST $SLACK_HOOK_URL < e2e/test_pass.json
fi

react-native-kill-packager

exit $STATUS
