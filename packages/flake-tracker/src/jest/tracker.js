require('jest-circus') // We need this in order for makeRunResult (below) to work
const { makeRunResult } = require('jest-circus/build/utils')
const db = require('../db')
const { getTestID, getTestIDFromTestPath, buildFlakeyDescribe } = require('./utils')
const { shouldLogRetryErrorsOnFailure, shouldSkipKnownFlakes, numRetries } = require('./config')
const clone = require('clone')

class JestFlakeTracker {
  async setup() {
    // For each describe block, we cache errors in this map as tests execute and
    // only write them to the db on 'run_finish'.
    this.flakes = new Map()
    this.skip = shouldSkipKnownFlakes ? db.readKnownFlakes().map((i) => i.title) : []
    this.skipped = []
  }

  async handleTestEvent(event, state) {
    // This event is fired before every test retry but after errors are cleared
    if (event.name === 'test_retry') {
      console.log('Retry #' + event.test.invocations + ' for test: ' + getTestID(event.test))
    }

    // This event is fired at the end of each top-level describe block.
    if (event.name === 'run_finish') {
      // We make a fake describe block with all the accumulated errors and then use it
      // to call `makeRunResult`. This converts our `TestEntry` objects into `TestResults`
      // which have formatted errors
      const describeBlock = buildFlakeyDescribe(clone(state.rootDescribeBlock), this.flakes)
      makeRunResult(describeBlock, state.unhandledErrors)
        .testResults.filter((tr) => tr.status === 'flakey')
        .forEach((tr) => db.writeErrors(getTestIDFromTestPath(tr.testPath), tr.errors))
      // The alternative to using the db would be to send results to github at the
      // end of each describe block. Instead,  we use the db and only message github
      // on global.setup and global.teardown.
      db.writeSkippedFlakes(this.skipped)
    }

    // This event is fired at the end of each test (including retries) before errors are cleared
    if (event.name === 'test_done') {
      const testID = getTestID(event.test)
      const failed = event.test.errors.length > 0
      const isFinalRetry = event.test.invocations === numRetries + 1

      if (failed) {
        if (isFinalRetry) {
          // Test failed on every retry => not flakey
          this.flakes.delete(testID)
        } else {
          if (shouldLogRetryErrorsOnFailure) {
            // Note that this error will not be formatted
            console.log('\n' + event.test.errors + '\n')
          }
          // Test will be retried => store error
          const prevErrors = this.flakes.get(testID)
          const errors = prevErrors || []
          errors.push(...event.test.errors)
          this.flakes.set(testID, errors)
        }
      }
    }

    // This event is fired right before a test is executed
    if (event.name === 'test_start' && shouldSkipKnownFlakes) {
      const testID = getTestID(event.test)
      if (this.skip.some((knownFlake) => knownFlake.includes(testID))) {
        console.log('Skipped known flakey test: ' + testID)
        this.skipped.push(testID)
        event.test.mode = 'skip' // This tricks jest into skipping the test
      }
    }
  }
}

module.exports = JestFlakeTracker
