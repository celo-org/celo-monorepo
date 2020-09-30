#!/usr/bin/env bash
set -euo pipefail

echo "This will prepare the mobile app for deployment to the store"

# Prompt for new version number
echo "===Updating app version==="
yarn version --no-git-tag-version
new_version="$(node -p "require('./package.json').version")"

echo "===Updating android/ios build files==="
# Android: use react-native-version, however on iOS it doesn't follow Xcode 11+ way of doing it, see iOS section below
yarn react-native-version --target android --never-amend
# Now increment Android versionCode
gradle_properties="android/gradle.properties"
current_version_code="$(grep "VERSION_CODE" $gradle_properties | cut -d '=' -f 2)"
new_version_code=$((current_version_code + 1))
sed -i "" "s/^VERSION_CODE=.*/VERSION_CODE=$new_version_code/" $gradle_properties

# iOS uses fastlane-plugin-versioning which correctly updates MARKETING_VERSION and CURRENT_PROJECT_VERSION in the project 
export FASTLANE_SKIP_UPDATE_CHECK=1
export FASTLANE_HIDE_TIMESTAMP=1
ios_options=(
  xcodeproj:ios/celo.xcodeproj 
  target:celo
)
bundle exec fastlane run increment_version_number_in_xcodeproj "${ios_options[@]}" "version_number:$new_version"
bundle exec fastlane run increment_build_number_in_xcodeproj "${ios_options[@]}"
echo "===Done updating versions==="

echo "===Update license list and disclaimer==="
yarn deploy:update-disclaimer
echo "===Done updating licenses==="

echo "Pre-deploy steps complete"
