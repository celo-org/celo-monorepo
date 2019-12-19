#!/usr/bin/env bash

echo "This will prepare the mobile app for deployment to the store"

# Prompt for new version number
echo "===Updating app version==="
yarn version --no-git-tag-version
echo "===Running react-native-version to update the android/ios build files==="
# Uses `--legacy` option (iOS only) otherwise it fails to parse the xcode project because of some specific strings
# used in the Sentry build phase script
yarn run react-native-version --legacy
echo "===Done updating versions. Note: you may need to update the VERSION_CODE in gradle.properties as well if deploying manually==="

echo "===Update license list and disclaimer==="
# TODO have this update iOS too
yarn deploy:update-disclaimer
echo "===Done updating licenses==="

echo "Pre-deploy steps complete"

# TODO have this script auto update the android version code too
echo "DON'T FORGET TO UDPATE THE ANDROID VERSION CODE in /android/gradle.properties, THIS STILL NEEDS TO BE DONE MANUALLY"
echo "DON'T FORGET TO UDPATE THE ANDROID VERSION CODE in /android/gradle.properties, THIS STILL NEEDS TO BE DONE MANUALLY"
echo "DON'T FORGET TO UDPATE THE ANDROID VERSION CODE in /android/gradle.properties, THIS STILL NEEDS TO BE DONE MANUALLY"