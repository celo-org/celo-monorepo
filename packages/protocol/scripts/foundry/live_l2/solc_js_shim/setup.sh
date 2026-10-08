#!/usr/bin/env bash
set -euo pipefail

### Builds a private HOME whose ~/.svm has working solc 0.5.14 and 0.5.17, for machines that cannot run
### the x86_64-only native builds of solc 0.5.x (Apple Silicon without Rosetta fails with
### "Bad CPU type in executable"). The two versions are served by solc-js through the `solc` shim in
### this directory; every other version already installed by svm is linked in unchanged.
###
### usage:  setup.sh <dir>
### then:   HOME=<dir> forge build ...        (svm-rs prefers $HOME/.svm when it exists)
###
### Only the forge processes should see that HOME. Tools that keep credentials under the real HOME
### (bao, gcloud, kubectl) must run before it is switched.

DIR=${1:?usage: setup.sh <dir>}
mkdir -p "$DIR" && DIR=$(cd "$DIR" && pwd)
HERE=$(cd "$(dirname "$0")" && pwd)

for VERSION in 0.5.14 0.5.17; do
  mkdir -p "$DIR/solcjs-$VERSION" "$DIR/.svm/$VERSION"
  (cd "$DIR/solcjs-$VERSION" && npm init -y >/dev/null && npm install --silent --no-audit --no-fund solc@$VERSION)
  cp "$HERE/solc" "$DIR/solcjs-$VERSION/solc" && chmod +x "$DIR/solcjs-$VERSION/solc"
  printf '#!/bin/sh\nexec %s/solcjs-%s/solc "$@"\n' "$DIR" "$VERSION" > "$DIR/.svm/$VERSION/solc-$VERSION"
  chmod +x "$DIR/.svm/$VERSION/solc-$VERSION"
  echo "solc $VERSION -> $("$DIR/.svm/$VERSION/solc-$VERSION" --version | tail -1)"
done

# Reuse the native compilers svm already has for every other version.
for SVM in "$HOME/.svm" "$HOME/Library/Application Support/svm" "${XDG_DATA_HOME:-$HOME/.local/share}/svm"; do
  [ -d "$SVM" ] || continue
  for INSTALLED in "$SVM"/*/; do
    VERSION=$(basename "$INSTALLED")
    [ -e "$DIR/.svm/$VERSION" ] || ln -s "${INSTALLED%/}" "$DIR/.svm/$VERSION"
  done
done
echo "compiler home ready: HOME=$DIR"
