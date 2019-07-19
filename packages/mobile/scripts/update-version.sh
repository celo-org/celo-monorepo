#!/usr/bin/env bash

echo "This will update the package version and create a new Git tag."

# Update yarn configs for more descriptive tag / commit message
echo "Updating yarn configs"
yarn config set version-tag-prefix "wallet-v"
yarn config set version-git-message "Update Wallet App Version to v%s"

# Prompt for new version number
yarn version
echo "Running react-native-version to update the android/ios build files"
yarn run react-native-version

echo "Restoring yarn configs"
yarn config set version-tag-prefix "v"
yarn config set version-git-message "v%s"

echo "Update license list and disclaimer"
yarn update-disclaimer

echo "Done"
echo "YOU HAVE CREATED A NEW TAG, RUN git push origin --tags TO PUBLISH IT TO GITHUB"
echo "YOU HAVE CREATED A NEW TAG, RUN git push origin --tags TO PUBLISH IT TO GITHUB"
echo "YOU HAVE CREATED A NEW TAG, RUN git push origin --tags TO PUBLISH IT TO GITHUB"