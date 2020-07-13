require('jest-circus')
const { makeRunResult } = require('jest-circus/build/utils')
const processFlakes = require('../processor')
const GitHub = require('../github')
const { getTestID, buildFlakeyDescribe, fmtFlakeIssue, fmtTestTitles } = require('./utils')
const { shouldSkipKnownFlakes, shouldReportFlakes, numRetries } = require('./config')
const clone = require('clone')

class FlakeTracker {
  constructor(global) {
    this.global = global
  }

  async setup() {
    this.flakes = new Map() //TODO(Alec, nth): store these in db?
    if (shouldReportFlakes || shouldSkipKnownFlakes) {
      this.github = await GitHub.build()
      if (shouldSkipKnownFlakes) {
        this.skip = await this.github.fetchKnownFlakes()
      }
    }
    //TODO(Alec, nth): Make githubclient interactions less frequent
  }

  async handleTestEvent(event, state) {
    if (event.name === 'test_retry') {
      console.log('Retry #' + event.test.invocations + ' for test: ' + getTestID(event.test))
    }

    if (event.name === 'run_finish') {
      const describeBlock = buildFlakeyDescribe(clone(state.rootDescribeBlock), this.flakes)

      const flakes = makeRunResult(describeBlock, state.unhandledErrors)
        .testResults.filter((tr) => tr.status === 'flakey')
        .map((tr) => fmtFlakeIssue(fmtTestTitles(tr.testPath), tr.errors))

      await processFlakes(flakes, this.github)
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
          // Test will be retried => store error
          let errors = []
          let prevErrors = this.flakes.get(testID)
          if (prevErrors) {
            errors.push(...prevErrors)
          }
          errors.push(...event.test.errors)
          this.flakes.set(testID, errors)
        }
      }
    }

    if (event.name === 'test_start' && shouldSkipKnownFlakes) {
      const testID = getTestID(event.test)
      if (this.skip.some((knownFlake) => knownFlake.includes(testID))) {
        console.log('\nSkipped known flakey test: ' + testID)
        event.test.mode = 'skip'
      }
    }
  }
}

module.exports = FlakeTracker
