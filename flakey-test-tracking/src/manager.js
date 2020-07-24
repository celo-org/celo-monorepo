const { shouldUseGitHub, shouldSkipKnownFlakes } = require('./config')
const db = require('./db')
const GitHub = require('./github')
const { fmtSummary } = require('./utils')

class FlakeManager {
  constructor(github, knownFlakes) {
    if (knownFlakes === undefined || (github === undefined && shouldUseGitHub)) {
      throw new Error(
        'FlakeManager constructor should not be called directly. Please use FlakeManager.build()'
      )
    }
    this.github = github
    this.knownFlakes = knownFlakes
  }

  // Called at the beginning of each test suite
  static async build() {
    db.init()
    let github
    let knownFlakes = []
    if (shouldUseGitHub) {
      github = await GitHub.build()
      if (shouldSkipKnownFlakes) {
        knownFlakes = await github.fetchKnownFlakesToSkip()
        db.writeKnownFlakes(knownFlakes)
      }
    }
    return new FlakeManager(github, knownFlakes)
  }

  // Called at the end of each test suite
  async finish() {
    const flakes = db.readNewFlakes()
    const skippedTests = this.knownFlakes
    if (shouldUseGitHub) {
      await this.github.report(flakes, skippedTests)
    }
    console.log(fmtSummary(flakes, skippedTests, 3))
  }

  saveErrors(testID, errors) {
    db.writeErrors(testID, errors)
  }
}

module.exports = FlakeManager
