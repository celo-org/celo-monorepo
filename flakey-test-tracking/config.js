// shouldTrackFlakes => tests are retried `numRetries` times and flakey results are logged w/ test output
const shouldTrackFlakes =
  (process.env.CI && process.env.FLAKEY !== 'false') || process.env.FLAKEY === 'true'

// numRetries === times test is run after the initial failure
const numRetries = process.env.NUM_RETRIES ? Number(process.env.NUM_RETRIES) : 10

// shouldReportFlakes => flakey results are reported to github
const shouldReportFlakes =
  shouldTrackFlakes && process.env.CIRCLECI && process.env.CIRCLE_BRANCH === 'master'

// shouldSkipKnownFlakes => flakey test issues are fetched from github and corresponding tests are skipped
const shouldSkipKnownFlakes = shouldTrackFlakes && process.env.SKIP_KNOWN_FLAKES !== 'false'

module.exports = {
  numRetries: numRetries,
  shouldReportFlakes: shouldReportFlakes,
  shouldSkipKnownFlakes: shouldSkipKnownFlakes,
  shouldTrackFlakes: shouldTrackFlakes,
}
