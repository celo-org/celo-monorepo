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
    const flakes = db.readNewFlakes()
    const skippedTests = shouldSkipKnownFlakes ? db.readKnownFlakes() : []

    if (shouldUseGitHub) {
      await this.github.report(flakes, skippedTests)
    }

    console.log('\n_____Flakey Test Summary_____')

    if (skippedTests.length) {
      if (skippedTests.length === 1) {
        console.log('\n1 known flakey test was skipped: \n')
      } else {
        console.log('\n' + skippedTests.length + ' known flakey tests skipped: \n')
      }
      skippedTests.forEach((skip) => console.log(skip))
    } else {
      console.log('\nNo known flakey tests were skipped')
    }

    if (flakes.length) {
      if (flakes.length === 1) {
        console.log('\n1 new flakey test found :(')
      } else {
        console.log('\n' + flakes.length + ' new flakey tests found :(')
      }
      let i = 0
      flakes.forEach((f) => {
        console.log('\n' + ++i + ')\n')
        console.log(f.title + '\n\n' + f.body)
      })
    } else {
      console.log('\nNo new flakey tests found!\n')
    }
  }

  saveErrors(testID, errors) {
    db.writeErrors(testID, errors)
  }
}

module.exports = FlakeManager
