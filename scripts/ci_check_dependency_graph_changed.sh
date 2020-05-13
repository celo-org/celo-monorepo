# This script is meant to be invoked only inside Circle CI environment.
set -euo pipefail

CHANGED=$(node -r ts-node/register ./scripts/check_dependency_graph_changed.ts)
if [ $CHANGED = true ] ; then
  echo "Generated dependency graph doesn't match what has been committed. Please verify and update it."
  exit 1
fi

echo "Generated dependency graph matches, all clear!"
