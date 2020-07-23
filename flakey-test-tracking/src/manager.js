const { shouldAddCheckToPR, shouldUseGitHub, shouldSkipKnownFlakes } = require('./config')
const db = require('./db')
const GitHub = require('./github')
const { fmtSummary } = require('./utils')

class FlakeManager {
  constructor(github, knownFlakes) {
    if (github === undefined || knownFlakes === undefined) {
      throw new Error(
        'FlakeManager constructor should not be called directly. Please use FlakeManager.build()'
      )
    }
    this.github = github
    this.knownFlakes = knownFlakes
  }

  static async build() {
    db.init()
    let github
    let knownFlakes = []
    if (shouldUseGitHub) {
      github = await GitHub.build()
      if (shouldSkipKnownFlakes) {
        knownFlakes = await github.fetchKnownFlakesToSkip()
        db.writeKnownFlakes(knownFlakes)
        if (shouldAddCheckToPR) {
          await github.startCheck()
        }
      }
    }
    return new FlakeManager(github, knownFlakes)
  }

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
