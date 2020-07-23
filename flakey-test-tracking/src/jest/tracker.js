require('jest-circus')
const { makeRunResult } = require('jest-circus/build/utils')
const db = require('../db')
const { getTestID, getTestIDFromTestPath, buildFlakeyDescribe } = require('./utils')
const { shouldLogRetryErrorsOnFailure, shouldSkipKnownFlakes, numRetries } = require('./config')
const clone = require('clone')

class FlakeTracker {
  async setup() {
    this.flakes = new Map()
    this.skip = shouldSkipKnownFlakes ? db.readKnownFlakes() : []
  }

  async handleTestEvent(event, state) {
    if (event.name === 'test_retry') {
      console.log('Retry #' + event.test.invocations + ' for test: ' + getTestID(event.test))
    }

    if (event.name === 'run_finish') {
      // We make a fake describe block with all the accumulated errors and then use it
      // to call `makeRunResult`. This converts our `TestEntry` objects into `TestResults`
      // which have formatted errors.
      const describeBlock = buildFlakeyDescribe(clone(state.rootDescribeBlock), this.flakes)
      makeRunResult(describeBlock, state.unhandledErrors)
        .testResults.filter((tr) => tr.status === 'flakey')
        .forEach((tr) => db.writeErrors(getTestIDFromTestPath(tr.testPath), tr.errors))
    }

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

    if (event.name === 'test_start' && shouldSkipKnownFlakes) {
      const testID = getTestID(event.test)
      if (this.skip.some((knownFlake) => knownFlake.includes(testID))) {
        console.log('Skipped known flakey test: ' + testID)
        event.test.mode = 'skip'
      }
    }
  }
}

module.exports = FlakeTracker
