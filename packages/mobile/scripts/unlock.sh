#!/usr/bin/env bash

adb wait-for-device
if !( adb devices | grep "emu" ); then
  echo "Error: The emulator is not running or not connected to adb. "
  exit 1
fi
adb wait-for-device shell \
  'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done;'


# Sequence to unlock the app lock screen in any state
adb shell input keyevent 26		# Power
adb shell input keyevent 26		# Power
sleep 1
adb shell input keyevent 4		# Back
sleep 1
adb shell input keyevent 4		# Back
sleep 1
adb shell input keyevent 82		# Menu
sleep 2
adb shell input text 123456		# Input Pin
sleep 1
adb shell input keyevent 66		# Enter

