import { TestResult } from '@jest/types/build/Circus'
//import { Octokit } from '@octokit/rest'

export class FlakeNotifier {
  // github = new Octokit({
  //   //TODO(Alec)
  // })

  processFlakes(flakes: TestResult[]) {
    return Promise.all(flakes.map((f) => this.processFlake(f)))
  }

  processFlake(flake: TestResult) {
    return Promise.all([this.createFlakeIssue(flake), this.leavePrComment(flake)])
  }

  async createFlakeIssue(flake: TestResult) {
    //TODO(Alec)
    console.log('FLAKE ISSUE TRIGGERED: ' + flake.testPath + ' ' + flake.errors)
    // this.github.issues.create({
    //   'FlakeReporter',
    //   'ce'
    // })
  }

  async leavePrComment(flake: TestResult) {
    //TODO(Alec)
    console.log('PR COMMENT TRIGGERED: ' + flake.testPath + ' ' + flake.errors)
  }
}
