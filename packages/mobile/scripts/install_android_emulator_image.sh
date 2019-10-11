#!/usr/bin/env bash
set -euo pipefail

sdkmanager "platform-tools" "platforms;android-26" "extras;intel;Hardware_Accelerated_Execution_Manager" "build-tools;26.0.0" "system-images;android-26;google_apis;x86" "emulator" --verbose