#!/usr/bin/env bash
set -euo pipefail

rsync -avyz src/account/LicenseDisclaimer.txt android/app/src/main/assets/custom/LicenseDisclaimer.txt
