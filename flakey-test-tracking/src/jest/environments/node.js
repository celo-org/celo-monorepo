const NodeEnvironment = require('jest-environment-node')
const FlakeTracker = require('../tracker')

class FlakeTrackingNodeEnv extends NodeEnvironment {
  constructor(config) {
    super(config)
    this.tracker = new FlakeTracker(this.global)
  }

  async setup() {
    await super.setup()
    await this.tracker.setup()
  }

  async handleTestEvent(event, state) {
    await this.tracker.handleTestEvent(event, state)
  }
}

module.exports = FlakeTrackingNodeEnv
