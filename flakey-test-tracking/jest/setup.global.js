require('regenerator-runtime/runtime') // See https://stackoverflow.com/questions/42535270/regeneratorruntime-is-not-defined-when-running-jest-test

const FlakeManager = require('../manager')

module.exports = async function jestFlakeTrackerSetup() {
  global.FlakeManager = await FlakeManager.build()
}
