const { formatIssueBody, parseTestFile } = require('./jest/utils')
const { Octokit } = require('@octokit/rest')
const { retry } = require('@octokit/plugin-retry')
const GitHubClient = Octokit.plugin(retry)

const client = new GitHubClient({
  //log: console,
})

function processFlakeyTestResults(flakeyTestResults) {
  // console.log('PROCESS FLAKEY TEST RESULTS \n')
  // console.log(flakeyTestResults)

  const flakes = flakeyTestResults.map((tr) => {
    tr.testPath.shift() // Remove ROOT_DESCRIBE_BLOCK
    return {
      header: tr.testPath.join(' -> '),
      body: formatIssueBody(tr.errors),
    }
  })

  return Promise.all(flakes.map(processFlake))
}

function processFlake(flake) {
  return Promise.all([createFlakeIssue(flake), leavePrComment(flake)])
}

async function createFlakeIssue(flake) {
  console.log('FLAKE ISSUE TRIGGERED \n')

  console.log(parseTestFile(flake.body))

  try {
    await client.issues.create({
      owner: 'celo-org',
      repo: 'celo-monorepo',
      title: '[FLAKEY TEST] ' + flake.header + ', at ' + parseTestFile(flake.body),
      body: flake.body,
      labels: ['FLAKEY :snowflake:'],
    })
  } catch (error) {
    console.error(
      '\nFailed to create issue for flakey test. ' +
        'Header: "' +
        flake.header +
        '", Client Error: ' +
        error
    )
  }
}

async function leavePrComment(flake) {
  //TODO(Alec)
  // console.log('PR COMMENT TRIGGERED \n')
  // console.log(flake)
}

module.exports = {
  processFlakeyTestResults: processFlakeyTestResults,
}
