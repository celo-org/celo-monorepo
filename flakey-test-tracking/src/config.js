const org = process.env.CIRCLE_PROJECT_USERNAME || 'celo-org'
const repo = process.env.CIRCLE_PROJECT_REPONAME || 'celo-monorepo'

// shouldTrackFlakes => tests are retried `numRetries` times and flakey results are logged w/ test output
const shouldTrackFlakes =
  (process.env.CIRCLECI && process.env.FLAKEY !== 'false') || process.env.FLAKEY === 'true'

// shouldLogRetryErrorsOnFailure => log raw test error immediately after every retry.
//const shouldLogRetryErrorsOnFailure = shouldTrackFlakes && process.env.LOG_ALL_RETRY_ERRORS
const shouldLogRetryErrorsOnFailure = true

// numRetries === times test is run after the initial failure
const numRetries = process.env.NUM_RETRIES ? Number(process.env.NUM_RETRIES) : 25

// shouldSkipKnownFlakes => flakey test issues are fetched from github and corresponding tests are skipped
const shouldSkipKnownFlakes =
  shouldTrackFlakes && process.env.CIRCLECI && process.env.SKIP_KNOWN_FLAKES !== 'false'

// shouldAddCheckToPR => GitHub Check added to PR
const shouldAddCheckToPR = shouldTrackFlakes && process.env.CIRCLECI

// shouldCreateIssues => GitHub Issues created for new flakey tests
const shouldCreateIssues = true
// const shouldCreateIssues =
//   shouldTrackFlakes && process.env.CIRCLECI && process.env.CIRCLE_BRANCH === 'master'

// For convenience...
const shouldReportFlakes = shouldAddCheckToPR || shouldCreateIssues
const shouldUseGitHub = shouldSkipKnownFlakes || shouldReportFlakes

module.exports = {
  numRetries: numRetries,
  org: org,
  repo: repo,
  shouldAddCheckToPR: shouldAddCheckToPR,
  shouldCreateIssues: shouldCreateIssues,
  shouldLogRetryErrorsOnFailure: shouldLogRetryErrorsOnFailure,
  shouldReportFlakes: shouldReportFlakes,
  shouldSkipKnownFlakes: shouldSkipKnownFlakes,
  shouldTrackFlakes: shouldTrackFlakes,
  shouldUseGitHub: shouldUseGitHub,
}
