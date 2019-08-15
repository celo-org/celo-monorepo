#!/usr/bin/env bash

#####
# This file creates apk that will be used for the tests
#####

ENVFILE=".env.test"

# set the IS_E2E_ENV value in .env during build only if it does not exist already
grep -qF -- "IS_E2E=1" $ENVFILE || printf "\nIS_E2E=1" >> $ENVFILE

ENVFILE=$ENVFILE yarn detox build -c android.emu.debug

# Remove the temp flag from file
sed -i '' '/IS_E2E=1/d' $ENVFILE
