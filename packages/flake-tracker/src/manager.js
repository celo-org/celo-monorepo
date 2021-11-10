const { shouldUseGitHub, shouldSkipKnownFlakes } = require('./config')
const db = require('./db')
const GitHub = require('./github')
const { fmtSummary, calcObsoleteFlakeIssues } = require('./utils')

class FlakeManager {
  constructor(github, setup) {
    this.setup = setup
    if (!setup) return

    if (github === undefined && shouldUseGitHub) {
      throw new Error(
        'FlakeManager constructor should not be called directly. Please use FlakeManager.build()'
      )
    }
    this.github = github
  }

  // Called at the beginning of each test suite
  static async build() {
    try {
      db.init()
      let github
      if (shouldUseGitHub) {
        github = await GitHub.build()
        if (shouldSkipKnownFlakes) {
          db.writeKnownFlakes(
            await github.fetchKnownFlakesToSkip().catch(() => {
              console.log('failed to fetch list of known flakey tests')
              return []
            })
          )
        }
      }
      return new FlakeManager(github, true)
    } catch (error) {
      console.log('Flake tracker setup failed')
      console.log(error)
      return new FlakeManager(undefined, false)
    }
  }

  // Called at the end of each test suite
  async finish() {
    if (!this.setup) return
    try {
      const flakes = db.readNewFlakes()
      let skippedTests = []
      if (shouldUseGitHub) {
        let obsoleteIssues = []
        if (shouldSkipKnownFlakes) {
          skippedTests = db.readSkippedFlakes()
          obsoleteIssues = calcObsoleteFlakeIssues(skippedTests, db.readKnownFlakes())
        }
        await this.github.report(flakes, skippedTests, obsoleteIssues).catch(() => {
          console.log('failed to report flake tracker results')
        })
      }
      console.log(fmtSummary(flakes, skippedTests, 3))
    } catch (error) {
      console.log('Flake tracker teardown failed')
      console.log(error)
    }
  }
}

module.exports = FlakeManager
