require('regenerator-runtime/runtime') // See https://stackoverflow.com/questions/42535270/regeneratorruntime-is-not-defined-when-running-jest-test

const FlakeManager = require('../manager')

// This is called at the beginning of each jest test suite
module.exports = async function jestFlakeTrackerSetup() {
  global.FlakeManager = await FlakeManager.build() // Note that this global variable is not available anywhere else besides global.teardown
}
