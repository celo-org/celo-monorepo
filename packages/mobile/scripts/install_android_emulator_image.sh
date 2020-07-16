#!/usr/bin/env bash
set -euo pipefail

sdkmanager "platform-tools" \
  "platforms;android-29" \
  "build-tools;29.0.2" \
  "system-images;android-29;google_apis;x86" \
  "emulator" \
  --verbose
