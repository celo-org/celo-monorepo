#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Configure, build, and run the mobile app
# ========================================

# Flags:
# -p: Platform (android or ios)
# -e (Optional): Name of the env to run
# -r (Optional): Use release build (by default uses debug). Note: on Android the release keystore needs to be present and the password in the env variable for this to work.

PLATFORM=""
ENV_NAME="alfajoresdev"
RELEASE=false

while getopts 'p:e:r' flag; do
  case "${flag}" in
    p) PLATFORM="$OPTARG" ;;
    e) ENV_NAME="$OPTARG" ;;
    r) RELEASE=true ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$PLATFORM" ] && echo "Need to set the PLATFORM via the -p flag" && exit 1;

# Get machine type (needed later)
if [ -z "${MACHINE-}" ]; then
  unameOut="$(uname -s)"
  case "${unameOut}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${unameOut}"
  esac
fi

# Read values from the .env file and put them in env vars
ENV_FILENAME=".env.${ENV_NAME}"
# From https://stackoverflow.com/a/56229034/158525
# Supports vars with spaces and single or double quotes
eval "$(grep -v -e '^#' "$ENV_FILENAME" | xargs -I {} echo export \'{}\')"

echo "**************************"
echo "Current directory: $(pwd)"
echo "Machine type: $MACHINE"
echo "Environment: $ENV_FILENAME"
echo "Network: $DEFAULT_TESTNET"
echo "Platform: $PLATFORM"
echo "**************************"

startPackager() {
  export RCT_METRO_PORT="${RCT_METRO_PORT:=8081}"
  if [ -z "${RCT_NO_LAUNCH_PACKAGER+xxx}" ] ; then
    if nc -w 5 -z localhost ${RCT_METRO_PORT} ; then
      if ! curl -s "http://localhost:${RCT_METRO_PORT}/status" | grep -q "packager-status:running" ; then
        echo "Port ${RCT_METRO_PORT} already in use, packager is either not running or not running correctly"
        exit 2
      fi
      echo "Packager server already running"
    else
      terminal="${RCT_TERMINAL-${REACT_TERMINAL-$TERM_PROGRAM}}"
      echo "Starting packager in new terminal..."

      if [ "$MACHINE" = "Mac" ]; then
        open -a "$terminal" ./scripts/launch_packager.command || open ./scripts/launch_packager.command || open_failed=1
      elif [ "$MACHINE" = "Linux" ]; then
        "$terminal" -e "sh ./scripts/launch_packager.command" || open_failed=1
      else 
        echo "Unsupported machine for running in new terminal"
        open_failed=1
      fi

      if [ "${open_failed-}" = 1 ]; then
        echo "Could not open terminal '${terminal}'. Falling back to running the packager inline."
        yarn react-native start &
      fi
    fi
  fi
}

# Build the app and run it
if [ "$PLATFORM" = "android" ]; then

  NUM_DEVICES=$(adb devices -l | wc -l)
  if [ "$NUM_DEVICES" -lt 3 ]; then 
    echo "No android devices found"
    exit 1
  fi

  case "$RELEASE" in
    true) BUILD_TYPE="Release" ;;
    *) BUILD_TYPE="Debug" ;;
  esac

  # Launch our packager directly as RN launchPackager doesn't work correctly with monorepos
  startPackager
  yarn react-native run-android --variant "${ENV_NAME}${BUILD_TYPE}" --appId "$APP_BUNDLE_ID" --no-packager

elif [ "$PLATFORM" = "ios" ]; then

  case "$RELEASE" in
    true) CONFIGURATION="Release" ;;
    *) CONFIGURATION="Debug" ;;
  esac

  # Launch our packager directly as RN launchPackager doesn't work correctly with monorepos
  startPackager
  yarn react-native run-ios --scheme "celo-${ENV_NAME}" --configuration "$CONFIGURATION" --no-packager

else
  echo "Invalid value for platform, must be 'android' or 'ios'"
  exit 1
fi

