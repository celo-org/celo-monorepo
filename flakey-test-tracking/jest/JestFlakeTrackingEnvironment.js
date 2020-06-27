const NodeEnvironment = require('jest-environment-node')
const { processFlakeyTestResults } = require('../FlakeNotifier')
const { getTestID, addFlakeErrorsToDescribeBlock } = require('./utils')
const clone = require('clone')

const Circus = require('jest-circus')
const { makeRunResult } = require('jest-circus/build/utils')

class JestFlakeTrackingEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    this.global.FLAKES = new Map() //TODO(Alec): keeping this global for now in case we want to use it in a custom reporter.
  }

  async handleTestEvent(event, state) {
    if (event.name === 'test_retry') {
      console.log('Retry #' + event.test.invocations + ' for test: ' + getTestID(event.test))
    }

    if (event.name === 'run_finish') {
      const describeBlock = addFlakeErrorsToDescribeBlock(
        clone(state.rootDescribeBlock),
        this.global.FLAKES
      )

      const flakeyTestResults = makeRunResult(
        describeBlock,
        state.unhandledErrors
      ).testResults.filter((tr) => tr.status === 'flakey')

      await processFlakeyTestResults(flakeyTestResults)
    }

    if (event.name === 'test_done') {
      const testID = getTestID(event.test)
      const failed = event.test.errors.length > 0
      const isFinalRetry = event.test.invocations == this.global.RETRY_TIMES + 1

      if (failed) {
        if (isFinalRetry) {
          // Test failed on every retry => not flakey
          this.global.FLAKES.delete(testID)
        } else {
          // Test will be retried => store error
          let errors = []
          let prevErrors = this.global.FLAKES.get(testID)
          if (prevErrors !== undefined) {
            errors.push(...prevErrors)
          }
          errors.push(...event.test.errors)
          this.global.FLAKES.set(testID, errors)
        }
      }
    }
  }
}

module.exports = JestFlakeTrackingEnvironment
