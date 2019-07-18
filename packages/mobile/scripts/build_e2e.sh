#!/usr/bin/env bash


# set the IS_E2E_ENV value in .env during build only if it does not exist already
grep -qF -- "IS_E2E=1" .env || echo "IS_E2E=1" >> .env


yarn detox build -c android.emu.debug

# Remove the temp flag from file
sed -i '' '/IS_E2E=1/d' .env
