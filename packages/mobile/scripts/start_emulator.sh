#!/usr/bin/env bash


#$ANDROID_SDK_ROOT/emulator/emulator -avd `$ANDROID_SDK_ROOT/emulator/emulator -list-avds | grep 'x86' | head -n 1`

emulator -avd $AVD_NAME -noaudio -no-boot-anim -no-window -accel on -verbose &