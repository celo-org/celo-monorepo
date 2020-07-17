const {
  shouldUseGitHub,
  shouldSkipKnownFlakes,
  shouldReportFlakes,
  shouldAddCheckToPR,
} = require('./config')
const db = require('./db')
const GitHub = require('./github')
const { fmtSummary } = require('./utils')

class FlakeManager {
  constructor(github, knownFlakes) {
    if (github === undefined && shouldUseGitHub) {
      throw new Error('GitHub cannot be undefined if flake skipping, PR check, or issues enabled.')
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
      if (shouldReportFlakes) {
        knownFlakes = await github.fetchKnownFlakes()
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
    const skippedTests = shouldSkipKnownFlakes ? db.readKnownFlakes() : []

    if (shouldUseGitHub) {
      await this.github.report(flakes, skippedTests)
    }

    console.log(fmtSummary(flakes, skippedTests, 2))
  }

  saveErrors(testID, errors) {
    db.writeErrors(testID, errors)
  }
}

module.exports = FlakeManager
