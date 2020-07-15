const FlakeManager = require('../manager')

module.exports = async function jestFlakeTrackerSetup() {
  global.FlakeManager = await FlakeManager.build()
}
