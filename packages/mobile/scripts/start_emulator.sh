#!/usr/bin/env bash

$ANDROID_SDK_ROOT/emulator/emulator -avd `$ANDROID_SDK_ROOT/emulator/emulator -list-avds | grep 'x86' | head -n 1` -no-boot-anim -no-window