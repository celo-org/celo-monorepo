const { shouldUseGitHub, shouldSkipKnownFlakes } = require('./config')
const db = require('./db')
const GitHub = require('./github')
const { fmtSummary, calcObsoleteFlakeIssues } = require('./utils')

class FlakeManager {
  constructor(github) {
    if (github === undefined && shouldUseGitHub) {
      throw new Error(
        'FlakeManager constructor should not be called directly. Please use FlakeManager.build()'
      )
    }
    this.github = github
  }

  // Called at the beginning of each test suite
  static async build() {
    db.init()
    let github
    if (shouldUseGitHub) {
      github = await GitHub.build()
      if (shouldSkipKnownFlakes) {
        db.writeKnownFlakes(await github.fetchKnownFlakesToSkip())
      }
    }
    return new FlakeManager(github)
  }

  // Called at the end of each test suite
  async finish() {
    const flakes = db.readNewFlakes()
    let skippedTests = []
    if (shouldUseGitHub) {
      let obsoleteIssues = []
      if (shouldSkipKnownFlakes) {
        skippedTests = db.readSkippedFlakes()
        obsoleteIssues = calcObsoleteFlakeIssues(skippedTests, db.readKnownFlakes())
      }
      await this.github.report(flakes, skippedTests, obsoleteIssues)
    }
    console.log(fmtSummary(flakes, skippedTests, 3))
  }
}

module.exports = FlakeManager
