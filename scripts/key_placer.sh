#!/usr/bin/env bash

echo "Processing encrypted files v2"

# Set list of secret files to encrypt and decrypt.
files=(
  ".env.mnemonic:celo-testnet"
  ".env.mnemonic.alfajores:celo-testnet"
  ".env.mnemonic.baklava:celo-testnet"
  ".env.mnemonic.rc1:celo-testnet-production"
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
  for file_path_map in "${files[@]}"; do
    file_path=${file_path_map%%:*}
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

for file_path_map in "${files[@]}"; do
  file_path=${file_path_map%%:*}
  environment=${file_path_map#*:}
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
  gcloud kms $1 --ciphertext-file=$encrypted_file_path --plaintext-file=$file_path --key=github-mnemonic-key --keyring=celo-keyring --location=global --project $environment
  if [[ $? -eq 1 ]]; then
    echo "Only cLabs employees with $environment access can $1 keys - skipping ${1}ion"
    exit 0
  fi
done

if [[ $1 == "decrypt" ]]; then
  echo "Encrypted files decrypted"
elif [[ $1 == "encrypt" ]]; then
  echo "Decrypted files encrypted"
fi

exit 0
