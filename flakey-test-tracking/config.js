module.exports = {
  numRetries: process.env.NUM_RETRIES || 10,
  shouldTrackFlakes:
    (!process.env.DISABLE_CI_FLAKE_TRACKING && process.env.CI) || process.env.FLAKEY,
  skipKnownFlakes: process.env.SKIP_KNOWN_FLAKES !== 'false',
}
