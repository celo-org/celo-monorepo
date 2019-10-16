#!/usr/bin/env bash

# Note: Encryption includes changing the metadata with a timestamp of when
# the file was encrypted, so every time you run this it will produce a diff
# in all of the files. Please only check in the files you intend to change

# files to be processed

echo "Processing encrypted files"

files=(
  "packages/mobile/android/app/google-services.json"
  "packages/mobile/android/app/src/staging/google-services.json"
  "packages/mobile/android/app/src/integration/google-services.json"
  "packages/mobile/android/app/src/alfajores/google-services.json"
  "packages/mobile/android/app/src/debug/google-services.json"
  "packages/mobile/android/app/src/pilot/google-services.json"
  "packages/mobile/android/sentry.properties"
  "packages/mobile/ios/GoogleService-Info.plist"
  "packages/mobile/ios/sentry.properties"
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
  ".env.mnemonic.integration"
  ".env.mnemonic.integrationtesting"
  ".env.mnemonic.pilot"
  ".env.mnemonic.pilotstaging"
)

# this is to allow the script to be called from anywhere
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
cd ..


command -v gcloud > /dev/null 2>&1

if [[ $? -eq 1 ]]; then
  echo "gcloud is not installed - skipping decryption"
  exit 0
fi

for file_path in "${files[@]}"; do
  file_path_without_extension=`echo "$file_path" | sed "s/.*\///"`
  file_dir=$(dirname "${file_path}")
  encrypted="$file_dir/$file_path_without_extension.enc"

  if test -f "$encrypted"; then
    gcloud kms $1 --ciphertext-file=$encrypted --plaintext-file=$file_path --key=github-key --keyring=celo-keyring --location=global --project celo-testnet > /dev/null 2>&1
    if [[ $? -eq 1 ]]; then
      echo "Only C Labs employees can decrypt keys - skipping decryption"
      exit 0
    fi
  fi
done

echo "Encrypted files decrypted"
exit 0
