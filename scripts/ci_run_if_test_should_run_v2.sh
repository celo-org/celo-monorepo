# This script is meant to be invoked only inside Circle CI environment.
set -euo pipefail

# Usage: ci_run_if_test_should_run_v2.sh <job name to run> <comma separate list of paths to check>
# Note: Job name is a single job. A comma-separated list is not supported yet.
JOB_NAME=${1}
DIRS_TO_CHECK=${2}

# This code has to be executed from a dir with 'esModuleInterop' set to true or it fails.
cd packages/mobile
CHANGED=$(node -r ts-node/register ../../scripts/check_if_test_should_run_v2.ts --dirs ${DIRS_TO_CHECK})
cd -
if [ $CHANGED = false ] ; then
  echo "No changes in ${1} - skipping job \"${JOB_NAME}\""
  RUN_PROTOCOL_TESTS=false
fi

# https://github.com/CircleCI-Public/api-preview-docs/blob/master/docs/conditional-workflows.md
echo "Something changed, job \"${JOB_NAME}\" should not be skipped"
# Source: https://circleci.com/docs/2.0/api-job-trigger/#section=jobs
# https://circleci.com/docs/2.0/env-vars/#built-in-environment-variables
cmd="curl \
  -X POST \
  --data build_parameters[CIRCLE_JOB]=${JOB_NAME} \
  https://circleci.com/api/v1.1/project/github/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/$CIRCLE_BUILD_NUM/retry?circle-token=${CIRCLE_API_USER_TOKEN}"
echo "Running command ${cmd}"
RUN_PROTOCOL_TESTS=true
$cmd

# cmd="curl \
#   --user ${CIRCLE_API_USER_TOKEN}: \
#   --data build_parameters[first_execution]=false \
#   --data build_parameters[run_protocol_tests]=$RUN_PROTOCOL_TESTS \
#   --data revision=$CIRCLE_SHA1 \
#   https://circleci.com/api/v1.1/project/github/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME/tree/$CIRCLE_BRANCH"
