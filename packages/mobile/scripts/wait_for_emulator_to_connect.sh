#!/usr/bin/env bash
set -euo pipefail

until adb shell dumpsys wifi | grep "mNetworkInfo" | grep "state: CONNECTED"; do sleep 10 ; done