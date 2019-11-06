#!/usr/bin/env bash

#####
# Unlocks the phone using the pin in the variable SECRET_PIN
# Test are expected to fail if the phone doesn't have the PIN set
#####

SECRET_PIN="123456"

while ! (adb devices | grep "emu")
do
  echo "Error: The emulator is not running or not connected to adb. "
  sleep 1 
done


# sleep until Android is done booting
adb wait-for-device shell \
  'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done;'


echo "locksettings set-pin $SECRET_PIN" | adb shell || echo "Failed to change pin, probably already set"


sleep 1
echo "Device is done booting"
sleep 10


# back to ensure the screen is turned on
adb shell input keyevent 4		# Back
sleep 1
# then double power button tap to lock in case it was unlocked
adb shell input keyevent 26		# Power
sleep 1
adb shell input keyevent 26		# Power
sleep 1
# trigger the unlock menu
adb shell input keyevent 82		# Menu
sleep 2
# Unlock
adb shell input text $SECRET_PIN		# Input Pin
sleep 1
adb shell input keyevent 66		# Enter

echo "Done this unlock"