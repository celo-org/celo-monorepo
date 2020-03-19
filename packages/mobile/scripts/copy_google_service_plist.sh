#!/usr/bin/env sh
#
# Xcode build phase script to copy the right GoogleService-Info.plist based on the configuration

set -exu

rsync -avyz "$SRCROOT/$IOS_GOOGLE_SERVICE_PLIST" "${CONFIGURATION_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/GoogleService-Info.plist"
