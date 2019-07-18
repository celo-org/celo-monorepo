# This script is meant to be invoked only inside Circle CI environment.
set -euo pipefail

# Uncomment the following line to disable incremental testing and enable all tests on all pull requests.
# exit

# Usage: ci_check_if_test_should_run_v2.sh <comma separate list of paths to check>
DIRS_TO_CHECK=${1}
# This code has to be executed from a dir with 'esModuleInterop' set to true or it fails.
cd packages/mobile
CHANGED=$(node -r ts-node/register ../../scripts/check_if_test_should_run_v2.ts --dirs ${DIRS_TO_CHECK})
cd -
if [ $CHANGED = false ] ; then
  echo "No changes in ${1} - skipping  testing"
  # https://discuss.circleci.com/t/ability-to-return-successfully-from-a-job-before-completing-all-the-next-steps/12969/6
  circleci step halt
fi
echo "Something $CHANGED, tests should not be skipped"
