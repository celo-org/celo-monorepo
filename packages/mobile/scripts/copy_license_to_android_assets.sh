#!/usr/bin/env bash
set -euo pipefail

destination="android/app/src/main/assets/custom/"

rsync -avyz src/account/LicenseDisclaimer.txt "$destination"
