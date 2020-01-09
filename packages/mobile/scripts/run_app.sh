#!/usr/bin/env bash
set -euo pipefail

# ====================================
# Configure and run the mobile app
# ====================================

# Flags:
# -n: Name of the network to run on
# -p: Platform (android or ios)
# -f: Fast (skip steps not required unless network or depedencies changes)
# -r: Hot Reload (Restore nav state on reload)

NETWORK=""
PLATFORM=""
FAST=false
HOT_RELOAD=false
while getopts 'n:p:fr' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    p) PLATFORM="$OPTARG" ;;
    f) FAST=true ;;
    r) HOT_RELOAD=true ;;
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
export $(grep -v '^#' $ENV_FILENAME | xargs)

if [ -z "$NETWORK" ]; then
  echo "No network set."
  read -p "Use $DEFAULT_TESTNET network set in .env file (y/n)? "
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    NETWORK=$DEFAULT_TESTNET
  else 
    echo "No network chosen. Exiting."
    exit 1
  fi
fi

# Set DEFAULT_TESTNET in .env file
sed -i.bak "s/DEFAULT_TESTNET=.*/DEFAULT_TESTNET=$NETWORK/g" $ENV_FILENAME

# Set Hot Reload (saved nav state) in .env file
sed -i.bak "s/DEV_RESTORE_NAV_STATE_ON_RELOAD=.*/DEV_RESTORE_NAV_STATE_ON_RELOAD=$HOT_RELOAD/g" $ENV_FILENAME

# Set Firebase settings in google service config files
ANDROID_GSERVICES_PATH="./android/app/src/debug/google-services.json"
IOS_GSERVICES_PATH="./ios/GoogleService-Info.plist"
sed -i.bak "s/celo-org-mobile-.*firebaseio.com/celo-org-mobile-$NETWORK.firebaseio.com/g" $ANDROID_GSERVICES_PATH || true
sed -i.bak "s/celo-org-mobile-.*firebaseio.com/celo-org-mobile-$NETWORK.firebaseio.com/g" $IOS_GSERVICES_PATH || true

# Cleanup artifacts from in-place sed replacement on BSD based systems (macOS)
rm -f $ENV_FILENAME.bak
rm -f $ANDROID_GSERVICES_PATH.bak
rm -f $IOS_GSERVICES_PATH.bak


# Build Wallet Kit for env
if [ "$FAST" = false ]; then
  echo "Building sdk for testnet $NETWORK"
  yarn build:sdk $NETWORK
  echo "Done building sdk"
fi

# Build the app and run it
if [ $PLATFORM = "android" ]; then
  echo "Using platform android"

  NUM_DEVICES=`adb devices -l | wc -l`
  if [ $NUM_DEVICES -lt 3 ]; then 
    echo "No android devices found"
    exit 1
  fi

  # Run jettify to fix non-android-x compatible libs
  if [ "$FAST" = false ]; then
    echo "Jetifying react native libraries"
    cd ../../ && yarn run jetify && cd packages/mobile
    echo "Jetified"
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
  yarn react-native start 

else
  echo "Invalid value for platform, must be 'android' or 'ios'"
  exit 1
fi

