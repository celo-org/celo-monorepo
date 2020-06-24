const NodeEnvironment = require('jest-environment-node')
const FlakeNotifier = require('../FlakeNotifier')
const utils = require('./Utils')

class JestFlakeTrackingEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    this.global.FLAKES = new Map() //TODO(Alec): keeping this global for now in case we want to use it in a custom reporter.
    this.notifier = new FlakeNotifier()
  }

  async teardown() {
    await this.notifier.processFlakes(this.global.FLAKES)
    await super.teardown()
  }

  async handleTestEvent(event, state) {
    if (event.name === 'test_retry') {
      console.log('Retry #' + event.test.invocations + ' for test: ' + utils.getTestID(event.test))
    }

    if (event.name === 'test_done') {
      const testID = utils.getTestID(event.test)
      const failed = event.test.errors.length > 0
      const isFinalRetry = event.test.invocations == this.global.RETRY_TIMES + 1

      if (failed) {
        if (isFinalRetry) {
          // Test failed on every retry => not flakey
          this.global.FLAKES.delete(testID)
        } else {
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
