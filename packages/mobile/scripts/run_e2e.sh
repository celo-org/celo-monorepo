#!/usr/bin/env bash
set -euo pipefail

# Default ENVFILE if not set
export ENVFILE="${ENVFILE:-.env.test}"

# ========================================
# Build and run the end-to-end tests
# ========================================

# Flags:
# -p: Platform (android or ios)
# -v (Optional): Name of virual machine to run
# -f (Optional): Fast (skip build step)
# -r (Optional): Use release build (by default uses debug)
# -n (Optional): Network delay (gsm, hscsd, gprs, edge, umts, hsdpa, lte, evdo, none)
# TODO ^ release doesn't work currently b.c. the run_app.sh script assumes we want a debug build

PLATFORM=""
VD_NAME="Nexus_5X_API_28_x86"
FAST=false
RELEASE=false
NET_DELAY="none"
while getopts 'p:fr' flag; do
  case "${flag}" in
    p) PLATFORM="$OPTARG" ;;
    v) VD_NAME="$OPTARG" ;;
    f) FAST=true ;;
    r) RELEASE=true ;;
    n) NET_DELAY="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$PLATFORM" ] && echo "Need to set the PLATFORM via the -p flag" && exit 1;
echo "Network delay: $NET_DELAY"

# Start the packager and wait until ready
startPackager() {
    echo "Starting metro packager"
    yarn react-native start &

    waitForPackager
    preloadBundle
}

# Wait for the package to start
waitForPackager() {
  local -i max_attempts=60
  local -i attempt_num=1

  until curl -s http://localhost:8081/status | grep "packager-status:running" -q; do
    if (( attempt_num == max_attempts )); then
      echo "Packager did not respond in time. No more attempts left."
      exit 1
    else
      (( attempt_num++ ))
      echo "Packager did not respond. Retrying for attempt number $attempt_num..."
      sleep 1
    fi
  done

  echo "Packager is ready!"
}

# Preload bundle, this is to prevent random red screen "Could not connect to development server" on the CI
preloadBundle() {
  echo "Preloading bundle..."
  local response_code=$(curl --write-out %{http_code} --silent --output /dev/null "http://localhost:8081/index.bundle?platform=$PLATFORM&dev=true")
  if [ "$response_code" != "200" ]; then
    echo "Failed to preload bundle, http response code: $response_code"
    exit 1
  fi
  echo "Preload bundle finished with http code: $response_code"
}

runTest() {
  yarn detox test \
    --configuration $CONFIG_NAME \
    --artifacts-location e2e/artifacts \
    --take-screenshots=all \
    --record-logs=failing \
    --detectOpenHandles \
    --loglevel verbose
  TEST_STATUS=$?
}

# Needed by metro packager to use .e2e.ts overrides
# See metro.config.js
export CELO_TEST_CONFIG=e2e

# Ensure jest is accessible to detox
cp ../../node_modules/.bin/jest node_modules/.bin/

# Just to be safe kill any process that listens on the port 'yarn start' is going to use
echo "Killing previous metro server (if any)"
yarn react-native-kill-packager || echo "Failed to kill package manager, proceeding anyway"

# Build the app and run it
if [ $PLATFORM = "android" ]; then
  echo "Using platform android"

  if [ -z $ANDROID_SDK_ROOT ]; then
    echo "No Android SDK root set"
    exit 1
  fi

  if [[ ! $($ANDROID_SDK_ROOT/emulator/emulator -list-avds | grep ^$VD_NAME$) ]]; then
    echo "AVD $VD_NAME not installed. Please install it or change the detox configuration in package.json"
    echo "You can see the list of available installed devices with $ANDROID_SDK_ROOT/emulator/emulator -list-avds"
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

  startPackager

  NUM_DEVICES=`adb devices -l | wc -l`
  if [ $NUM_DEVICES -gt 2 ]; then
    echo "Emulator already running or device attached. Please shutdown / remove first"
    exit 1
  fi

  echo "Starting the emulator"
  $ANDROID_SDK_ROOT/emulator/emulator -avd $VD_NAME -no-boot-anim -noaudio -gpu swiftshader_indirect -no-snapshot -no-window -netdelay $NET_DELAY &

  echo "Waiting for device to connect to Wifi, this is a good proxy the device is ready"
  until [ `adb shell dumpsys wifi | grep "mNetworkInfo" | grep "state: CONNECTED" | wc -l` -gt 0 ]
  do
    sleep 3
  done

  runTest

  echo "Closing emulator (if active)"
  adb devices | grep emulator | cut -f1 | while read line; do adb -s $line emu kill; done

elif [ $PLATFORM = "ios" ]; then
  echo "Using platform ios"

  if [ "$RELEASE" = false ]; then
    CONFIG_NAME="ios.sim.debug"
  else
    CONFIG_NAME="ios.sim.release"
  fi

  if [ "$FAST" = false ]; then
    echo "Configuring the app"
    ./scripts/run_app.sh -p $PLATFORM -b
  fi

  echo "Building detox"
  yarn detox build -c $CONFIG_NAME

  startPackager

  runTest

else
  echo "Invalid value for platform, must be 'android' or 'ios'"
  exit 1
fi

echo "Done test, cleaning up"
yarn react-native-kill-packager

echo "Exiting with test result status $TEST_STATUS"
exit $TEST_STATUS
