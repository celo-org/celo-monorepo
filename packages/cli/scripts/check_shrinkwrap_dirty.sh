#!/usr/bin/env bash
set -euo pipefail

[ ! -z "$(git diff ./npm-shrinkwrap.json)" ] && echo "The npm-shrinkwrap.json changed. Commit those changes first" && exit 1;

exit 0;