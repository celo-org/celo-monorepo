#!/usr/bin/env bash
set -euo pipefail

sdkmanager "platform-tools" \
  "platforms;android-29" \
  "build-tools;30.0.0" \
  "system-images;android-29;google_apis;x86_64" \
  "extras;intel;Hardware_Accelerated_Execution_Manager" \
  "emulator" \
  --verbose
