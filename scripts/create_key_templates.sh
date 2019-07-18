#!/usr/bin/env bash
set -euo pipefail

echo "Creating placeholder files"

# this is to allow the script to be called from anywhere
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

placeholder_files=(
  "../packages/mobile/secrets.json"
  "../packages/web/env-config.js"
  "../packages/web/server-env-config.js"
)

TEMPLATE_DIR='./secrets_templates'
cd $DIR

for file_path in "${placeholder_files[@]}"; do
  dir_path=$(dirname "${file_path}")
  if ! [ -d "$dir_path" ]; then
    echo "${dir_path} does not exist, skipping creating placeholder ${file_path}..."
    continue
  fi

  if ! [ -f "$file_path" ]; then
    echo "$file_path does not exist, create placeholder"

    filename=`echo "$file_path" | sed "s/.*\///"`

    cp "$TEMPLATE_DIR/$filename" $file_path
  fi
done