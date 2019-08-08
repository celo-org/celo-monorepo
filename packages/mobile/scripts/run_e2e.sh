#!/usr/bin/env bash

#####
# This file launches the emulator and fires the tests
#####

export CELO_TEST_CONFIG=e2e

adb kill-server && adb start-server

DEFAULT_AVD="Nexus_5X_API_28_x86"

if [[ ! $($ANDROID_SDK_ROOT/emulator/emulator -list-avds | grep ^$DEFAULT_AVD$) ]]; then
  echo "AVD $DEFAULT_AVD not installed. Pleas install it or change detox' configuration in package.json"
  echo "You can see the list of available installed devices with $ANDROID_SDK_ROOT/emulator/emulator -list-avds"
  exit 1
fi

yarn dev:emulator

# Just to be safe kill any process that listens on the port 'yarn start' is going to use
lsof -t -i :8081 | xargs kill -9
yarn start:bg

bash ./scripts/unlock.sh
adb reconnect
if [ $? -ne 0 ]
then
  exit 1
fi

echo "Waiting for emulator to unlock..."
# TODO: improve this to actually poll if the screen is unlocked
# https://stackoverflow.com/questions/35275828/is-there-a-way-to-check-if-android-device-screen-is-locked-via-adb
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
   echo "Test failed"
else
   #http POST $SLACK_HOOK_URL < e2e/test_pass.json
   echo "Test passed"
fi

react-native-kill-packager

exit $STATUS
