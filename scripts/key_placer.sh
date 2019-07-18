#!/usr/bin/env bash
set -euo pipefail


# Note: Encryption includes changing the metadata with a timestamp of when
# the file was encrypted, so every time you run this it will produce a diff
# in all of the files. Please only check in the files you intend to change

# files to be processed

echo "Processing ecrypted files"

files=(
  "packages/mobile/android/app/google-services.json"
  "packages/mobile/android/app/src/staging/google-services.json"
  "packages/mobile/android/app/src/integration/google-services.json"
  "packages/mobile/android/app/src/alfajores/google-services.json"
  "packages/mobile/android/app/src/debug/google-services.json"
  "packages/verifier/android/app/google-services.json"
  "packages/verifier/android/app/src/staging/google-services.json"
  "packages/verifier/android/app/src/integration/google-services.json"
  "packages/verifier/android/app/src/debug/google-services.json"
  "packages/mobile/secrets.json"
  "packages/web/env-config.js"
  "packages/web/server-env-config.js"
  ".env.mnemonic"
  ".env.mnemonic.alfajores"
  ".env.mnemonic.alfajoresstaging"
  ".env.mnemonic.appintegration"
  ".env.mnemonic.integration"
  ".env.mnemonic.integrationtesting"
)

# this is to allow the script to be called from anywhere
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
cd ..

for file_path in "${files[@]}"; do
  file_path_without_extension=`echo "$file_path" | sed "s/.*\///"`
  file_dir=$(dirname "${file_path}")
  echo $file_path_without_extension
  encrypted="$file_dir/$file_path_without_extension.enc"

  echo "Processing $file_path to $encrypted"
  gcloud kms $1 --ciphertext-file=$encrypted --plaintext-file=$file_path --key=github-key --keyring=celo-keyring --location=global --project celo-testnet \
  || echo "Could not process file, maybe you don't have access to KMS? Note only C-labs keys would be able to decrypt files in this repo." \
  || true # this makes the script return 0 even if the gcloud kms command failed
done