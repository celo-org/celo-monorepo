#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Build and run the end-to-end tests
# ========================================

# Flags:
# -p: Platform (android or ios)
# -v (Optional): Name of virual machine to run
# -f (Optional): Fast (skip build step)
# -r (Optional): Use release build (by default uses debug) 
# TODO ^ release doesn't work currently b.c. the run_app.sh script assumes we want a debug build

PLATFORM=""
VD_NAME="Nexus_5X_API_28_x86"
FAST=false
RELEASE=false
while getopts 'p:fr' flag; do
  case "${flag}" in
    p) PLATFORM="$OPTARG" ;;
    v) VD_NAME="$OPTARG" ;;
    f) FAST=true ;;
    r) RELEASE=true ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$PLATFORM" ] && echo "Need to set the PLATFORM via the -p flag" && exit 1;

# Ensure jest is accessible to detox
cp ../../node_modules/.bin/jest node_modules/.bin/

# Just to be safe kill any process that listens on the port 'yarn start' is going to use
echo "Killing previous metro server (if any)"
yarn react-native-kill-packager || echo "Failed to kill package manager, proceeding anyway"

# Build the app and run it
if [ $PLATFORM = "android" ]; then
  echo "Using platform android"

  if [ -z $ANDROID_HOME ]; then
    echo "No Android SDK root set"
    exit 1
  fi

  if [[ ! $($ANDROID_HOME/emulator/emulator -list-avds | grep ^$VD_NAME$) ]]; then
    echo "AVD $VD_NAME not installed. Please install it or change the detox configuration in package.json"
    echo "You can see the list of available installed devices with $ANDROID_HOME/emulator/emulator -list-avds"
    exit 1
  fi

  if [ "$RELEASE" = false ]; then
    CONFIG_NAME="android.emu.debug"
  else
    CONFIG_NAME="android.emu.release"
  fi

  if [ "$FAST" = false ]; then
    echo "Configuring the app"
    ./scripts/run_app.sh -p $PLATFORM -b
  fi

  echo "Building detox"
  yarn detox build -c $CONFIG_NAME

  echo "Starting the metro server"
  yarn react-native start &

  NUM_DEVICES=`adb devices -l | wc -l`
  if [ $NUM_DEVICES -gt 2 ]; then 
    echo "Emulator already running or device attached. Please shutdown / remove first"
    exit 1
  fi

  echo "Starting the emulator"
  $ANDROID_HOME/emulator/emulator -avd $VD_NAME -no-boot-anim &

  echo "Waiting for device to connect to Wifi, this is a good proxy the device is ready"
  until [ `adb shell dumpsys wifi | grep "mNetworkInfo" | grep "state: CONNECTED" | wc -l` -gt 0 ]
  do
    sleep 3 
  done

  CELO_TEST_CONFIG=e2e yarn detox test -c $CONFIG_NAME -a e2e/tmp/ --take-screenshots=failing --record-logs=failing --detectOpenHandles -l verbose
  STATUS=$?

  echo "Closing emulator (if active)"
  adb devices | grep emulator | cut -f1 | while read line; do adb -s $line emu kill; done

elif [ $PLATFORM = "ios" ]; then
  echo "Using platform ios"
  echo "IOS e2e tests not currently supported"
  exit 1

else
  echo "Invalid value for platform, must be 'android' or 'ios'"
  exit 1
fi

echo "Done test, cleaning up"
yarn react-native-kill-packager

echo "Exiting with test result status $STATUS"
exit $STATUS
