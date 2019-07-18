#!/usr/bin/env bash
set -euo pipefail
#
# Flags:
# -e: Environment for which to build
 ENVIRONMENT=""
 while getopts 'e:' flag; do
  case "${flag}" in
    e) ENVIRONMENT="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

yarn run --cwd=../celotool cli copy-contract-artifacts --output-path=../verification-pool-api/contracts/ --celo-env=$ENVIRONMENT --contracts=Attestations,GoldToken,StableToken && \
  yarn run tsc && \
  yarn run firebase-bolt schema.bolt
