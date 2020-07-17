module.exports = async function jestFlakeTrackerTeardown() {
  await global.FlakeManager.finish()
}
