const FlakeManager = require('../manager')

module.exports = async () => {
  global.FlakeManager = await FlakeManager.build()
}
