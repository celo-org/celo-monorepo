const { shouldUseGitHub, shouldSkipKnownFlakes, shouldReportFlakes } = require('./config')
const db = require('./db')
const GitHub = require('./github')

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
      }
    }
    return new FlakeManager(github, knownFlakes)
  }

  async finish() {
    console.log('\nFlakey Test Summary\n')

    const flakes = db.readNewFlakes()
    if (flakes.length) {
      console.log('\nFlakey tests found :( \n')
      let i = 0
      flakes.forEach((f) => {
        console.log('\n' + ++i + ')')
        console.log(f.title + '\n\n' + f.body)
      })
    } else {
      console.log('\nNo flakey tests found! \n')
    }

    const skippedTests = shouldSkipKnownFlakes ? db.readKnownFlakes() : []

    if (skippedTests.length) {
      console.log('\nThe following known flakey tests were skipped: \n')
      skippedTests.forEach((skip) => console.log(skip))
    }

    if (shouldUseGitHub) {
      await this.github.report(flakes, skippedTests)
    }
  }

  saveErrors(testID, errors) {
    db.writeErrors(testID, errors)
  }
}

module.exports = FlakeManager
