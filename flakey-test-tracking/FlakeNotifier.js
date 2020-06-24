//const octokit = require('@octokit/rest')

class FlakeNotifier {
  // github = new Octokit({
  //   //TODO(Alec)
  // })

  processFlakes(flakes) {
    console.log('PROCESS FLAKES')
    console.log(flakes)

    //return Promise.all(flakes.map((f) => this.processFlake(f)))
  }

  processFlake(flake) {
    return Promise.all([this.createFlakeIssue(flake), this.leavePrComment(flake)])
  }

  async createFlakeIssue(flake) {
    //TODO(Alec)
    console.log('FLAKE ISSUE TRIGGERED: ' + flake.testPath + ' ' + flake.errors)
    // this.github.issues.create({
    //   'FlakeReporter',
    //   'ce'
    // })
  }

  async leavePrComment(flake) {
    //TODO(Alec)
    console.log('PR COMMENT TRIGGERED: ' + flake.testPath + ' ' + flake.errors)
  }
}

module.exports = FlakeNotifier
