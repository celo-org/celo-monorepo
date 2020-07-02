const NodeEnvironment = require('jest-environment-node')
const Circus = require('jest-circus')
const { makeRunResult } = require('jest-circus/build/utils')
const { processFlakes } = require('../processor')
const GitHub = require('../github')
const { getTestID, buildFlakeyDescribe, parseFlake } = require('./utils')
const clone = require('clone')

class FlakeTrackingEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    this.global.FLAKES = new Map() //TODO(Alec, nth): keeping this global for now in case we want to use it in a custom reporter.
    if (process.env.CI) {
      this.github = await GitHub.build()
      await this.github.renew()
      if (this.global.SKIP_KNOWN_FLAKES) {
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
      const describeBlock = buildFlakeyDescribe(clone(state.rootDescribeBlock), this.global.FLAKES)

      const flakes = makeRunResult(describeBlock, state.unhandledErrors)
        .testResults.filter((tr) => tr.status === 'flakey')
        .map(parseFlake)

      if (flakes.length) {
        await processFlakes(flakes, this.github)
      }
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
            errors.push(prevErrors)
          }
          errors.push(event.test.errors)
          this.global.FLAKES.set(testID, errors)
        }
      }
    }

    if (process.env.CI && this.global.SKIP_KNOWN_FLAKES && event.name === 'test_start') {
      const testID = getTestID(event.test)
      for (const knownFlake of this.skip) {
        if (knownFlake.includes(testID)) {
          event.test.mode = 'skip'
          return
        }
      }
    }
  }
}

module.exports = FlakeTrackingEnvironment
