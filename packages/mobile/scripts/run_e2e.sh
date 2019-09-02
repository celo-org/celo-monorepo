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

# unlock device
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
sleep 3
echo "Emulator unlocked!"

# start logs
pidcat -t "ReactNativeJS" > e2e_pidcat_run.log & 

# sometimes the emulator locks itself after boot
# this prevents that
bash ./scripts/unlock.sh

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
   echo "Test failed"
else
   echo "Test passed"
fi

react-native-kill-packager

echo "Closing emulator"
kill -s 9 `ps -a | grep "Nexus_5X_API_28_x86" | grep -v "grep"  | awk '{print $1}'`

echo "Closing pidcat"
kill -s 9 `ps -a | grep "pidcat" | grep -v "grep"  | awk '{print $1}'`

exit $STATUS
