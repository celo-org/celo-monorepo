set -euo pipefail

# get package to check and move its directory
PACKAGE=${1}
cd packages/${PACKAGE}

# latest commit
LATEST_COMMIT=$(git rev-parse HEAD)

echo "LATEST_COMMIT: ${LATEST_COMMIT}"

# latest commit where path/to/PACKAGE was changed
CHANGE_COMMIT=$(git log -1 --format=format:%H --full-diff CHANGELOG.md)
echo "CHANGE_COMMIT: ${CHANGE_COMMIT}"

if [[ $CHANGE_COMMIT != $LATEST_COMMIT ]]; then
  echo "Please commit to the ${PACKAGE}/CHANGELOG.md file"
  exit 1
fi


