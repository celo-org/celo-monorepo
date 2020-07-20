const Mocha = require('mocha')
const FlakeManager = require('../manager')
const { getTestID, fmtError } = require('./utils')
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
      manager.saveErrors(getTestID(test), currErrors)
    }
  })

  runner.on('test end', function(test) {
    currErrors = []
  })
}

Mocha.utils.inherits(FlakeReporter, Mocha.reporters.Spec)

module.exports = FlakeReporter
