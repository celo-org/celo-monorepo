#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Configure, build, and run the mobile app
# ========================================

# Flags:
# -p: Platform (android or ios)
# -n (Optional): Name of the network to run on 
# -f (Optional): Fast (skip steps not required unless network or depedencies changes)
# -r (Optional): Hot Reload (Restore nav state on reload, useful for UI dev-ing)
# -b (Optional): Just configure and build sdk, skip running 

NETWORK=""
PLATFORM=""
FAST=false
HOT_RELOAD=false
BUILD_ONLY=false
while getopts 'p:n:frb' flag; do
  case "${flag}" in
    p) PLATFORM="$OPTARG" ;;
    n) NETWORK="$OPTARG" ;;
    f) FAST=true ;;
    r) HOT_RELOAD=true ;;
    b) BUILD_ONLY=true ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$PLATFORM" ] && echo "Need to set the PLATFORM via the -p flag" && exit 1;

# Get machine type (needed later)
unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${unameOut}"
esac
echo "Machine type: $MACHINE"
echo "Current directory: `pwd`"

# Read values from the .env file and put them in env vars
ENV_FILENAME="${ENVFILE:-.env}"
# From https://stackoverflow.com/a/56229034/158525
# Supports vars with spaces and single or double quotes
eval $(grep -v -e '^#' $ENV_FILENAME | xargs -I {} echo export \'{}\')

if [ -z "$NETWORK" ]; then
  echo "No network set, using $DEFAULT_TESTNET network set in $ENV_FILENAME file."
  NETWORK=$DEFAULT_TESTNET
fi

# Set DEFAULT_TESTNET in .env file
sed -i.bak "s/DEFAULT_TESTNET=.*/DEFAULT_TESTNET=$NETWORK/g" $ENV_FILENAME

# Set Hot Reload (saved nav state) in .env file
sed -i.bak "s/DEV_RESTORE_NAV_STATE_ON_RELOAD=.*/DEV_RESTORE_NAV_STATE_ON_RELOAD=$HOT_RELOAD/g" $ENV_FILENAME

# Set Firebase settings in google service config files
ANDROID_GSERVICES_PATH="./android/app/src/debug/google-services.json"
IOS_GSERVICES_PATH="./ios/$IOS_GOOGLE_SERVICE_PLIST"
sed -i.bak "s/celo-org-mobile-.*firebaseio.com/celo-org-mobile-$NETWORK.firebaseio.com/g" $ANDROID_GSERVICES_PATH || true
sed -i.bak "s/celo-org-mobile-.*firebaseio.com/celo-org-mobile-$NETWORK.firebaseio.com/g" $IOS_GSERVICES_PATH || true

# Cleanup artifacts from in-place sed replacement on BSD based systems (macOS)
rm -f $ENV_FILENAME.bak
rm -f $ANDROID_GSERVICES_PATH.bak
rm -f $IOS_GSERVICES_PATH.bak

# Build the app and run it
if [ $PLATFORM = "android" ]; then
  echo "Using platform android"

  if [ "$BUILD_ONLY" = true ]; then
    echo "Build only enabled, stopping here."
    exit 0
  fi

  NUM_DEVICES=`adb devices -l | wc -l`
  if [ $NUM_DEVICES -lt 3 ]; then 
    echo "No android devices found"
    exit 1
  fi

  if [ $MACHINE = "Mac" ]; then
    echo "Starting packager in new terminal"
    RN_START_CMD="cd `pwd` && (yarn react-native start || yarn react-native start)"
    OSASCRIPT_CMD="tell application \"Terminal\" to do script \"$RN_START_CMD\""
    echo "FULLCMD: $OSASCRIPT_CMD"
    osascript -e "$OSASCRIPT_CMD"
    # Run android without packager because RN cli doesn't work with yarn workspaces
    yarn react-native run-android --appIdSuffix "debug" --no-packager
  else 
    # Run android without packager because RN cli doesn't work with yarn workspaces
    yarn react-native run-android --appIdSuffix "debug" --no-packager
    yarn react-native start 
  fi

elif [ $PLATFORM = "ios" ]; then
  echo "Using platform ios"
  # TODO have iOS build and start from command line
  echo -e "\nFor now ios must be build and run from xcode\nStarting RN bundler\n"


  if [ "$BUILD_ONLY" = true ]; then
    echo "Build only enabled, stopping here."
    exit 0
  fi

  yarn react-native start 

else
  echo "Invalid value for platform, must be 'android' or 'ios'"
  exit 1
fi

