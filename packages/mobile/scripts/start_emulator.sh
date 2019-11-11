#!/usr/bin/env bash

ENABLE_EMULATOR_WINDOW="${ENABLE_EMULATOR_WINDOW:-false}"

PARAMS=""

if ! $ENABLE_EMULATOR_WINDOW ; then
  PARAMS="${PARAMS} -no-window"
  echo "Not showing emulator windown due ENABLE_EMULATOR_WINDOW env variable"
fi

$ANDROID_SDK_ROOT/emulator/emulator -avd `$ANDROID_SDK_ROOT/emulator/emulator -list-avds | grep 'x86' | head -n 1` -no-boot-anim $PARAMS