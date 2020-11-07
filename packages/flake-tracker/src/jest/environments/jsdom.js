const JSDOMEnvironment = require('jest-environment-jsdom')
const JestFlakeTracker = require('../tracker')

class FlakeTrackingJSDOMEnv extends JSDOMEnvironment {
  constructor(config) {
    super(config)
    this.tracker = new JestFlakeTracker(this.global)
  }

  async setup() {
    await super.setup()
    await this.tracker.setup()
  }

  async handleTestEvent(event, state) {
    await this.tracker.handleTestEvent(event, state)
  }
}

module.exports = FlakeTrackingJSDOMEnv
