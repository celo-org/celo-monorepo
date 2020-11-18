const Mocha = require('mocha')
const FlakeManager = require('../manager')
const db = require('../db')
const { getTestID, fmtError } = require('./utils')
const { shouldLogRetryErrorsOnFailure, shouldSkipKnownFlakes } = require('../config')
const { Spec } = Mocha.reporters

function FlakeReporter(runner) {
  Spec.call(this, runner)

  let manager
  let skip = []
  let skipped = []
  let currErrors = []

  before('Fetch Flakey Tests', async function() {
    manager = await FlakeManager.build()
    skip = shouldSkipKnownFlakes ? db.readKnownFlakes().map((i) => i.title) : []
  })

  after('Process Flakey Tests', async function() {
    db.writeSkippedFlakes(skipped)
    await manager.finish()
  })

  runner.on('retry', function(test, err) {
    console.log('Retry #' + (test.currentRetry() + 1) + ' for test ' + getTestID(test))
    if (shouldLogRetryErrorsOnFailure) {
      console.log('\n' + fmtError(err) + '\n')
    }
    currErrors.push(fmtError(err))
  })

  runner.on('test', function(test) {
    if (skip.length) {
      let testID = getTestID(test)
      if (skip.some((knownFlake) => knownFlake.includes(testID))) {
        console.log('Skipped known flakey test: ' + testID)
        skipped.push(testID)
        test.pending = true
      }
    }
  })

  runner.on('pass', function(test) {
    if (test.currentRetry() > 0) {
      // Note that we could store these errors locally in a map and not use the db at all.
      // We use the db here for consistency with jest which must use the db, and also because
      // writing to a tmp file (the db) is convenient for debugging. This design could be improved.
      db.writeErrors(getTestID(test), currErrors)
    }
  })

  runner.on('test end', function(test) {
    currErrors = []
  })
}

Mocha.utils.inherits(FlakeReporter, Mocha.reporters.Spec)

module.exports = FlakeReporter
