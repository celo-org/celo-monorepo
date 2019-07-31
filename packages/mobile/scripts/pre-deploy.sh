#!/usr/bin/env bash

echo "This will prepare the mobile app for deployment to the store"

# Prompt for new version number
echo "===Updating app version==="
yarn version --no-git-tag-version
echo "===Running react-native-version to update the android/ios build files==="
yarn run react-native-version
echo "===Done updating versions. Note: you may need to update the VERSION_CODE in gradle.properties as well if deploying manually==="

echo "===Update license list and disclaimer==="
yarn update-disclaimer
echo "===Done updating licenses==="

echo "Pre-deploy steps complete"