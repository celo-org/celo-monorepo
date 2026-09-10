#!/usr/bin/env bash
# Freezes the build artifacts of the Solidity 0.5 sources under contracts-0.5.
#
# The proxies deployed on mainnet are immutable and were compiled with Solidity 0.5.14,
# optimizer off, istanbul (the solc05 profile reproduces their runtime bytecode exactly).
# Nothing else in the repo is built with that compiler any more, so the artifacts the
# tooling needs from those sources (bytecode to deploy new proxies, ABIs, and the runtime
# bytecode to verify the live proxies against) are committed under artifacts/solc-0.5 in
# forge's <Name>.sol/<Name>.json layout, which lets every consumer treat that directory
# like a build output.
#
# Usage:
#   scripts/foundry/freeze-solc05-artifacts.sh           # (re)generate the frozen artifacts
#   scripts/foundry/freeze-solc05-artifacts.sh --check   # fail if the sources and the frozen artifacts disagree
set -euo pipefail

PROTOCOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROTOCOL_DIR"

SOURCE_DIR="contracts-0.5"
BUILD_DIR="out-solc-0.5"
FROZEN_DIR="artifacts/solc-0.5"
# Helpers that only exist to be inherited by the sources above are not deployed and
# therefore not frozen.
NOT_FROZEN="UsingRegistry Create2 ExternalCall"

FOUNDRY_PROFILE=solc05 forge build

frozen_artifact() {
  # Keep what the tooling reads and leave out what changes between environments
  # (ast, source maps, storage layout, build ids).
  jq --arg name "$2" '{
    contractName: $name,
    abi: .abi,
    bytecode: { object: .bytecode.object, linkReferences: .bytecode.linkReferences },
    deployedBytecode: { object: .deployedBytecode.object, linkReferences: .deployedBytecode.linkReferences },
    methodIdentifiers: .methodIdentifiers,
    metadata: .metadata
  }' "$1"
}

STAGE="$(mktemp -d)"
for source in $(find "$SOURCE_DIR" -name '*.sol' | sort); do
  file="$(basename "$source")"
  name="${file%.sol}"
  if [[ " $NOT_FROZEN " == *" $name "* ]]; then continue; fi
  artifact="$BUILD_DIR/$file/$name.json"
  if [[ ! -f "$artifact" ]]; then
    echo "ERROR: no artifact for $source at $artifact" >&2
    exit 1
  fi
  mkdir -p "$STAGE/$file"
  frozen_artifact "$artifact" "$name" > "$STAGE/$file/$name.json"
done

# What a consumer of a frozen artifact relies on: the ABI, the selectors and the code
# itself. Metadata hashes are left out of the comparison: they encode the build
# environment (for instance how a Foundry version spells a remapping), so they
# legitimately differ between machines without the compiled code changing. A factory
# embeds the creation code of the contract it deploys, hash included, so every
# occurrence is masked, not only the trailing one. Solidity 0.5.14 emits
# a265627a7a72315820 <32-byte bzzr1 hash> 64736f6c6343 <3-byte solc version> 0032.
METADATA_HASH='a265627a7a72315820[0-9a-f]{64}64736f6c6343[0-9a-f]{6}0032'
essence() {
  jq -S --arg m "$METADATA_HASH" '{
    abi,
    methodIdentifiers,
    bytecode: { object: (.bytecode.object | gsub($m; "<metadata>")), linkReferences: .bytecode.linkReferences },
    deployedBytecode: { object: (.deployedBytecode.object | gsub($m; "<metadata>")), linkReferences: .deployedBytecode.linkReferences }
  }' "$1"
}

if [[ "${1:-}" == "--check" ]]; then
  STATUS=0
  for artifact in $(cd "$STAGE" && find . -name '*.json' | sort); do
    if [[ ! -f "$FROZEN_DIR/$artifact" ]]; then
      echo "ERROR: $FROZEN_DIR/$artifact is missing" >&2
      STATUS=1
      continue
    fi
    if ! diff <(essence "$FROZEN_DIR/$artifact") <(essence "$STAGE/$artifact") > /dev/null; then
      echo "ERROR: $FROZEN_DIR/$artifact does not match the current build of $SOURCE_DIR" >&2
      STATUS=1
    fi
  done
  for artifact in $(cd "$FROZEN_DIR" && find . -name '*.json' | sort); do
    if [[ ! -f "$STAGE/$artifact" ]]; then
      echo "ERROR: $FROZEN_DIR/$artifact has no source under $SOURCE_DIR any more" >&2
      STATUS=1
    fi
  done
  if [[ $STATUS -ne 0 ]]; then
    echo "ERROR: run scripts/foundry/freeze-solc05-artifacts.sh to refresh $FROZEN_DIR" >&2
    rm -rf "$STAGE"
    exit 1
  fi
  echo "frozen artifacts in $FROZEN_DIR match $SOURCE_DIR"
else
  rm -rf "$FROZEN_DIR"
  mkdir -p "$(dirname "$FROZEN_DIR")"
  mv "$STAGE" "$FROZEN_DIR"
  echo "frozen $(find "$FROZEN_DIR" -name '*.json' | wc -l | tr -d ' ') artifacts into $FROZEN_DIR"
fi
rm -rf "$STAGE"
