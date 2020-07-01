const { parseFlake } = require('./jest/utils')
const { Octokit } = require('@octokit/rest')
const { retry } = require('@octokit/plugin-retry')
const GitHubClient = Octokit.plugin(retry)
const client = new GitHubClient({
  //log: console,
})
const FlakeLabel = 'FLAKEY :snowflake:'

//TODO(Alec, next): Add ssh key to circleci

function processFlakeyTestResults(flakeyTestResults) {
  console.log('PROCESS FLAKEY TEST RESULTS \n')
  if (process.env.CI) {
    return Promise.all(flakeyTestResults.map(processFlake))
  }
}

function processFlake(flakeyTestResult) {
  if (process.env.CI) {
    const flake = parseFlake(flakeyTestResult)
    const actions = [createFlakeIssue, leavePrComment]
    return Promise.all(actions.map((a) => a(flake)))
  }
}

//TODO(Alec): try to get codeframe as well

async function createFlakeIssue(flake) {
  console.log('FLAKE ISSUE TRIGGERED \n')
  if (!process.env.CI) return

  try {
    await client.issues.create({
      owner: 'celo-org',
      repo: 'celo-monorepo',
      title: flake.title,
      body: flake.body,
      labels: [FlakeLabel],
    })
  } catch (error) {
    // TODO(Alec): Should this fail the build?
    console.error(
      '\nFailed to create issue for flakey test. ' +
        'Title: "' +
        flake.title +
        '", Client Error: ' +
        error
    )
  }
}

async function leavePrComment(flake) {
  console.log('PR COMMENT TRIGGERED \n')
  if (!process.env.CI) return

  const prNumber = process.env.CIRCLE_PR_NUMBER

  console.log(prNumber)
  console.log(process.env.CIRCLE_PR_REPONAME)

  try {
    await client.pulls.createReviewComment({
      owner: 'celo-org',
      repo: 'celo-monorepo',
      pull_number: prNumber,
      commit_id: process.env.CIRCLE_SHA1,
      path: flake.title.slice(flake.title.indexOf('/packages'), flake.title.indexOf(':')),
      line: flake.title.split(':')[1],
      body: flake.title + '\n' + flake.body,
    })
  } catch (error) {
    // TODO(Alec): Add better error handling here
    console.error(
      '\nFailed to create PR comment for flakey test. ' +
        'Title: "' +
        flake.title +
        '", Client Error: ' +
        error
    )
  }
}

//TODO(Alec): Rename file
async function fetchKnownFlakes() {
  try {
    return (
      await client.paginate(client.issues.listForRepo, {
        owner: 'celo-org',
        repo: 'celo-monorepo',
        state: 'open',
        labels: [FlakeLabel],
      })
    ).map((i) => i.title.replace('[FLAKEY TEST]', '').trim())
  } catch (error) {
    // TODO(Alec): Should this fail the build?
    console.error('\nFailed to fetch existing flakey test issues from GitHub. Error: ' + error)
  }
}

module.exports = {
  processFlakeyTestResults: processFlakeyTestResults,
  fetchKnownFlakes: fetchKnownFlakes,
  client: client,
  FlakeLabel: FlakeLabel,
}
