#!/usr/bin/env bash

if ! [ -x "$(command -v jq)" ]; then
  echo "Error: jq is not installed." >&2
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")"

filter='paths | join(".") | [(input_filename | gsub(".*/|\\.json$";"")), .] | join("/")'

en_keys=$(jq -r "$filter" ../locales/en-US/*.json | sort)
es_keys=$(jq -r "$filter" ../locales/es-419/*.json | sort)

diff <(echo "$en_keys") <(echo "$es_keys")

exit $?
