#!/usr/bin/env sh
#
# Xcode scheme pre action script 

set -exu

# This makes the scheme use the specified envfile
# See https://github.com/luggit/react-native-config#ios-1
echo "$1" > /tmp/envfile

# This makes envfile config available in xcode build settings
# See https://github.com/luggit/react-native-config#availability-in-build-settings-and-infoplist
"${SRCROOT}/../../../node_modules/react-native-config/ios/ReactNativeConfig/BuildXCConfig.rb" "${SRCROOT}/.." "${SRCROOT}/env.xcconfig"
