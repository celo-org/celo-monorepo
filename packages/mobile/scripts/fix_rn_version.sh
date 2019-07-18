#!/usr/bin/env bash
set -euo pipefail

sed -i -- "s/com\.facebook\.react:react-native:0.13.*'/com\.facebook\.react:react-native:0.14.0'/" ./node_modules/**/android/build.gradle
sed -i -- "s/com\.android\.tools\.build:gradle:2.*'/com\.android\.tools\.build:gradle:2.3.0'/" ../../node_modules/**/android/build.gradle
sed -i -- "s/com\.android\.tools\.build:gradle:2.*'/com\.android\.tools\.build:gradle:2.3.0'/" ./node_modules/**/android/build.gradle