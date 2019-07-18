#!/usr/bin/env bash
set -euo pipefail

. ../../scripts/check_if_changed.sh

CHANGED=$(checkIfChangedFolder)

while getopts ':n:' flag; do
  case "${flag}" in
    n) BUILD="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BUILD" ] && echo "Need to set the BUILD via the -n flag" && exit 1;

echo $BUILD

if [ $CHANGED = true ] ; then
  echo "Changes detected in verifier - shipping to Google Play"

  bundle install
  openssl aes-256-cbc -d -in ../mobile/fastlane/google-play-service-account.json.enc -out fastlane/google-play-service-account.json -k $CIRCLE_DECRYPT_KEY -md md5
  openssl aes-256-cbc -d -in ../mobile/android/app/celo-release-key.keystore.enc -out android/app/celo-release-key.keystore -k $CIRCLE_DECRYPT_KEY -md md5
  bundle exec fastlane $BUILD
else
  echo "No changes in verifier - skipping deploy"
  exit 0;
fi