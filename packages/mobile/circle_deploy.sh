#!/usr/bin/env bash
set -euo pipefail

. ../../scripts/check_if_changed.sh

CHANGED=$(checkIfChangedFolder)
BUILD=""

while getopts ':n:' flag; do
  case "${flag}" in
    n) BUILD="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BUILD" ] && echo "Need to set the BUILD via the -n flag" && exit 1;

echo $BUILD

if [ $CHANGED = true ] ; then
  echo "Changes detected in mobile - shipping to Google Play"

  bundle install
  openssl aes-256-cbc -d -in fastlane/google-play-service-account.json.enc -out fastlane/google-play-service-account.json -k $CIRCLE_DECRYPT_KEY -md md5
  openssl aes-256-cbc -d -in android/app/celo-release-key.keystore.enc -out android/app/celo-release-key.keystore -k $CIRCLE_DECRYPT_KEY -md md5
  bundle exec fastlane $BUILD
else
  echo "No changes in mobile - skipping deploy"
  exit 0;
fi
