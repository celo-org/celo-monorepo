#!/usr/bin/env bash

echo "Processing encrypted files"

# Set list of secret files to encrypt and decrypt.
files=(
  "packages/blockchain-api/serviceAccountKey.json"
  "packages/blockchain-api/src/secrets.json"
  "packages/mobile/android/app/google-services.json"
  "packages/mobile/android/app/src/staging/google-services.json"
  "packages/mobile/android/app/src/integration/google-services.json"
  "packages/mobile/android/app/src/alfajores/google-services.json"
  "packages/mobile/android/app/src/debug/google-services.json"
  "packages/mobile/android/app/src/pilot/google-services.json"
  "packages/mobile/android/sentry.properties"
  "packages/mobile/ios/GoogleService-Info.dev.plist"
  "packages/mobile/ios/GoogleService-Info.integration.plist"
  "packages/mobile/ios/GoogleService-Info.alfajores.plist"
  "packages/mobile/ios/GoogleService-Info.pilot.plist"
  "packages/mobile/ios/sentry.properties"
  "packages/verifier/android/app/google-services.json"
  "packages/verifier/android/app/src/staging/google-services.json"
  "packages/verifier/android/app/src/integration/google-services.json"
  "packages/verifier/android/app/src/debug/google-services.json"
  "packages/mobile/secrets.json"
  "packages/web/env-config.js"
  "packages/web/server-env-config.js"
  "packages/moonpay-auth/.env"
  ".env.mnemonic"
  ".env.mnemonic.alfajores"
  ".env.mnemonic.alfajoresstaging"
  ".env.mnemonic.baklava"
  ".env.mnemonic.baklavastaging"
  ".env.mnemonic.integration"
  ".env.mnemonic.pilot"
  ".env.mnemonic.pilotstaging"
  ".env.mnemonic.rc0"
  ".env.mnemonic.rc1"
)

if [[ -z "$1" ]]; then
  echo "Encrypt or decrypt secret files using GCP keystore."
  echo "usage: $0 < encrypt | decrypt >"
  exit 1
elif [[ $1 != "encrypt" ]] && [[ $1 != "decrypt" ]]; then
  echo "invalid action $1. Choose 'encrypt' or 'decrypt'"
  echo "usage: $0 < encrypt | decrypt >"
  exit 1
fi

# this is to allow the script to be called from anywhere
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
cd ..

# place templates to be used (if they exist) in case the environment
# doesn't have access to decryption keys
if [[ $1 == "decrypt" ]]; then
  for file_path in "${files[@]}"; do
    template_file_path="$file_path.template"

    if test -f "$template_file_path" && ! test -f "$file_path"; then
      cp "$template_file_path" "$file_path"
    fi
  done
fi

command -v gcloud > /dev/null 2>&1
if [[ $? -eq 1 ]]; then
  echo "gcloud is not installed - skipping ${1}ion"
  exit 0
fi

for file_path in "${files[@]}"; do
  encrypted_file_path="$file_path.enc"

  # When decrypting ensure the encrypted file exists or skip.
  if [[ $1 == "decrypt" ]] && ! test -f "$encrypted_file_path"; then
    echo "$encrypted_file_path does not exist, cannot decrypt - skipping file" >&2
    continue
  fi

  # When encrypting ensure the plaintext file exists.
  if [[ $1 == "encrypt" ]]; then
    if [[ ! -f "$file_path" ]]; then
        echo "$file_path does not exist, cannot encrypt - skipping file" >&2
        continue
    fi
  fi

  # Encrypt or decrypt this file.
  gcloud kms $1 --ciphertext-file=$encrypted_file_path --plaintext-file=$file_path --key=github-key --keyring=celo-keyring --location=global --project celo-testnet
  if [[ $? -eq 1 ]]; then
    echo "Only cLabs employees can $1 keys - skipping ${1}ion"
    exit 0
  fi
done

if [[ $1 == "decrypt" ]]; then
  echo "Encrypted files decrypted"
elif [[ $1 == "encrypt" ]]; then
  echo "Decrypted files encrypted"
fi

exit 0
