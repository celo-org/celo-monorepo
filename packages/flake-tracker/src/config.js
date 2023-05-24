const isCI = process.env.CIRCLECI || process.env.CI
const org =
  process.env.CIRCLE_PROJECT_USERNAME || process.env.GITHUB_REPOSITORY.split('/')[0] || 'celo-org'
const repo =
  process.env.CIRCLE_PROJECT_REPONAME ||
  process.env.GITHUB_REPOSITORY.split('/')[1] ||
  'celo-monorepo'
const branch = process.env.CIRCLE_BRANCH || process.env.GITHUB_REF_NAME
const sha = process.env.CIRCLE_SHA1 || process.env.GITHUB_SHA
const CiJob = process.env.CIRCLE_JOB || process.env.GITHUB_JOB
const prNumber = getPullNumber()
const defaultNumRetries = branch === 'master' ? 15 : 5
const flakeTrackerID = 71131 // This is the FlakeTracker GitHub App ID.

// NOTE: Avoid editing the following constants unless you are making changes to the flake trackers' functionality.
// This file serves mainly to distill various environment variables into easy to use booleans for the rest of the project.
// Configuration should be done via env variables in config.yaml (or command line if running locally)

// NOTE: Many env variables used in this project are provided automatically by circleci (CIRCLE_PROJECT_NAME, CIRCLECI, etc.)

// CUSTOM ENV VARIABLE OVERVIEW:
//  FLAKEY =>
//    - When running in CI, set to 'false' to disable the flake tracker (enabled by default)
//    - When running locally, set to 'true' to enable the flake tracker (disabled by default)
//  LOG_ALL_RETRY_ERRORS =>
//    - Only relevant when flake tracker is enabled.
//    - Enables error logging after retries even for tests that never pass. Useful for debugging flakey tests that don't respond to
//      retries. That is, tests that fail consistently when the first attempt fails but also sometimes pass on the first attempt.
//  NUM_RETRIES =>
//    - Specifies how many retries should be performed before a test is declared failing.
//  SKIP_KNOWN_FLAKES =>
//    - Must be set to 'false' to disable the skipping of known flakes in CI.
//    - Note that skipping individual flakey tests can be disabled via the 'Mandatory Tests' feature (See README).
//  FLAKES_FAIL_CHECK_SUITE =>
//    - If true, new flakey tests will be reported as 'failures' on GitHub Checks. Note this does not affect the CI workflow.

// shouldTrackFlakes => tests are retried `numRetries` times and flakey results are logged w/ test output
const shouldTrackFlakes =
  (isCI && repo !== 'celo-blockchain' && process.env.FLAKEY !== 'false') ||
  process.env.FLAKEY === 'true'

// shouldLogRetryErrorsOnFailure => log raw test error immediately after every retry.
const shouldLogRetryErrorsOnFailure = shouldTrackFlakes && process.env.LOG_ALL_RETRY_ERRORS

// numRetries === times test is run after the initial failure
const numRetries = process.env.NUM_RETRIES ? Number(process.env.NUM_RETRIES) : defaultNumRetries

// shouldSkipKnownFlakes => flakey test issues are fetched from github and corresponding tests are skipped
const shouldSkipKnownFlakes =
  shouldTrackFlakes &&
  isCI &&
  process.env.FLAKE_TRACKER_SECRET &&
  process.env.SKIP_KNOWN_FLAKES !== 'false'

// shouldAddCheckToPR => GitHub Check added to PR
const shouldAddCheckToPR = shouldTrackFlakes && isCI && process.env.FLAKE_TRACKER_SECRET

// newFlakesShouldFailCheckSuite => determines whether GitHub Check has status 'failure' or 'neutral' when new flakey tests are found.
const newFlakesShouldFailCheckSuite = shouldAddCheckToPR && process.env.FLAKES_FAIL_CHECK_SUITE

// shouldCreateIssues => GitHub Issues created for new flakey tests
const shouldCreateIssues =
  shouldTrackFlakes && isCI && process.env.FLAKE_TRACKER_SECRET && branch === 'master'

// For convenience...
const shouldReportFlakes = shouldAddCheckToPR || shouldCreateIssues
const shouldUseGitHub = shouldSkipKnownFlakes || shouldReportFlakes

function getPullNumber() {
  if (process.env.CIRCLE_PULL_REQUEST) {
    return process.env.CIRCLE_PULL_REQUEST.split('/').slice(-1)[0]
  } else if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME.split('/')[2]
  }
  console.info(
    'Unable to determine pull request number. Expected when run in local or not triggered by a PR event'
  )
  return null
}

module.exports = {
  flakeTrackerID: flakeTrackerID,
  newFlakesShouldFailCheckSuite: newFlakesShouldFailCheckSuite,
  numRetries: numRetries,
  isCI: isCI,
  org: org,
  repo: repo,
  branch: branch,
  sha: sha,
  CiJob: CiJob,
  prNumber: prNumber,
  shouldAddCheckToPR: shouldAddCheckToPR,
  shouldCreateIssues: shouldCreateIssues,
  shouldLogRetryErrorsOnFailure: shouldLogRetryErrorsOnFailure,
  shouldReportFlakes: shouldReportFlakes,
  shouldSkipKnownFlakes: shouldSkipKnownFlakes,
  shouldTrackFlakes: shouldTrackFlakes,
  shouldUseGitHub: shouldUseGitHub,
}
