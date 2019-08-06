#!/usr/bin/env bash

#####
# Unlocks the phone using the pin in the variable SECRET_PIN
# Test are expected to fail if the phone doesn't have the PIN set
#####

SECRET_PIN="123456"

if !( adb devices | grep "emu" ); then
  echo "Error: The emulator is not running or not connected to adb. "
  exit 1
fi

# sleep until Android is done booting
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
adb shell input text $SECRET_PIN		# Input Pin
sleep 1
adb shell input keyevent 66		# Enter


echo "waiting for device to connect to Wifi, this is a good proxy the device is ready"
until adb shell dumpsys wifi | grep "mNetworkInfo" |grep "state: CONNECTED"
do
  sleep 10
done