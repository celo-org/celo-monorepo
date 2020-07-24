// This is called at the end of each jest test suite.
module.exports = async function jestFlakeTrackerTeardown() {
  await global.FlakeManager.finish()
}
