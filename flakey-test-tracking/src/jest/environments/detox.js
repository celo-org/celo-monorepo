const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest-circus')
const JestFlakeTracker = require('../tracker')

class FlakeTrackingDetoxEnv extends DetoxCircusEnvironment {
  constructor(config) {
    super(config)

    this.tracker = new JestFlakeTracker(this.global)

    // Can be safely removed, if you are content with the default value (=300000ms)
    this.initTimeout = 300000

    // This takes care of generating status logs on a per-spec basis. By default, Jest only reports at file-level.
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    })
  }

  async setup() {
    await super.setup()
    await this.tracker.setup()
  }

  async handleTestEvent(event, state) {
    await super.handleTestEvent(event, state)
    await this.tracker.handleTestEvent(event, state)
  }
}

module.exports = FlakeTrackingDetoxEnv
