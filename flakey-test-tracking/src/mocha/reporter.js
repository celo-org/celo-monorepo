const Mocha = require('mocha')
const FlakeManager = require('../manager')
const { getTestID, fmtError } = require('./utils')
const { shouldLogRetryErrorsOnFailure } = require('../config')
const { Spec } = Mocha.reporters

function FlakeReporter(runner) {
  Spec.call(this, runner)

  let manager
  let skips = []
  let currErrors = []

  before('Fetch Flakey Tests', async function() {
    manager = await FlakeManager.build()
    skips = manager.knownFlakes
  })

  after('Process Flakey Tests', async function() {
    await manager.finish()
  })

  runner.on('retry', function(test, err) {
    console.log('Retry #' + test.currentRetry() + ' for test ' + getTestID(test))
    if (shouldLogRetryErrorsOnFailure) {
      // Note that this error will not be formatted
      console.log('\n' + err + '\n')
    }
    currErrors.push(fmtError(err))
  })

  runner.on('test', function(test) {
    if (skips.length) {
      let testID = getTestID(test)
      if (skips.some((knownFlake) => knownFlake.includes(testID))) {
        console.log('Skipped known flakey test: ' + testID)
        test.pending = true
      }
    }
  })

  runner.on('pass', function(test) {
    if (test.currentRetry() > 0) {
      // Note that we could store these errors locally in a map and not use the db at all.
      // We use the db here for consistency with jest which must use the db, and also because
      // writing to a tmp file (the db) is convenient for debugging.
      // This design could be improved.
      manager.saveErrors(getTestID(test), currErrors) // This writes errors to the db.
    }
  })

  runner.on('test end', function(test) {
    currErrors = []
  })
}

Mocha.utils.inherits(FlakeReporter, Mocha.reporters.Spec)

module.exports = FlakeReporter
