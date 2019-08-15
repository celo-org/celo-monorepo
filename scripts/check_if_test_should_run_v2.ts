// This is a helpful script to figure out whether to run incremental testing in a directory or not.
// Say the caller is in the celotool dir and wants to check if celotool or protocol dir has changed then
// the sample usage will be
// node -r ts-node/register scripts/check_if_test_should_run_v2.ts --dirs packages/protocol,packages/celotool
// Prints "true" to stdout if the tests should run
// Prints "false" otherwise
// All console logging intentionally sent to stderr, so that, stdout is not corrupted
import { execCmdWithExitOnFailure } from '@celo/celotool/src/lib/utils'
import { existsSync } from 'fs'
import fetch from 'node-fetch'

const argv = require('minimist')(process.argv.slice(2))
const dirs: string[] = argv.dirs.split(',')
main()

async function main() {
  try {
    await checkIfTestShouldRun()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

async function checkIfTestShouldRun() {
  const currentBranch: string = await getCurrentBranch()
  const isCriticalBranch: boolean =
    isStagingBranch(currentBranch) ||
    isProductionBranch(currentBranch) ||
    isMasterBranch(currentBranch)
  if (isCriticalBranch) {
    logMessage('We are on staging or production branch')
    console.info('true')
    return
  }

  const branchCommits: string[] = await getBranchCommits()
  if (branchCommits.length === 0) {
    logMessage('No commits found; this is most likely a bug in the checking script')
    process.exit(1)
  }
  for (const commit of branchCommits) {
    logMessage(`\nChecking commit ${commit}...`)
    const paths: string[] = dirs.concat(['../../yarn.lock'])
    const anyPathsChanged: boolean = await checkIfAnyPathsChangedInCommit(commit, paths)
    if (anyPathsChanged) {
      console.info('true')
      return
    }
  }
  console.info('false')
}

async function checkIfAnyPathsChangedInCommit(commit: string, dirs: string[]): Promise<boolean> {
  logMessage(`Checking if any of the paths [${dirs}] have changed in commit ${commit}...`)
  for (const dir of dirs) {
    const changeCommit = await getChangeCommit(dir)
    if (commit == changeCommit) {
      logMessage(`\nDir "${dir}" has changed in commit ${commit}\n`)
      return true
    } else {
      logMessage(`Dir "${dir}" has not changed in commit ${commit}`)
    }
  }
  return false
}

async function getBranchCommits(): Promise<string[]> {
  // GitHub + Circle CI-specific approach.
  // Note: Environment variable CIRCLE_PR_NUMBER is only defined when the PR is opened from a
  // repository different than the base respository.
  // Environment variable CIRCLE_PULL_REQUEST is always defined.
  const prUrl = process.env.CIRCLE_PULL_REQUEST
  if (prUrl === undefined) {
    // This won't happen on critical branches like master since we short-circuit and run
    // all tests on that.
    throw new Error(
      '$CIRCLE_PULL_REQUEST is undefined. Incremental testing only supports pull requests and not branches in general'
    )
  }
  const urlSegments = prUrl.split('/')
  const prNumber = urlSegments.pop() || urlSegments.pop() // handle potential trailing slash

  if (prNumber === undefined) {
    throw new Error(`Unable to get pull request number from $CIRCLE_PULL_REQUEST: ${prUrl}`)
  } else {
    const owner = process.env.CIRCLE_PROJECT_USERNAME
    const repo = process.env.CIRCLE_PROJECT_REPONAME
    if (owner === undefined) {
      throw new Error('Environment variable CIRCLE_PROJECT_USERNAME is not defined')
    }
    if (repo === undefined) {
      throw new Error('Environment variable CIRCLE_PROJECT_REPONAME is not defined')
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits`
    const response: any = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'https://celo.org', // https://developer.github.com/v3/#user-agent-required
      },
    })
    if (response.status !== 200) {
      throw new Error(
        `Failed to get commits from GitHub, url: "${url}", status: ${
          response.status
        } response: "${JSON.stringify(response)}"`
      )
    }
    const commitObjects: any = await response.json()
    if (commitObjects === undefined) {
      throw new Error(
        `Failed to get commits from GitHub, url: "${url}", response: "${JSON.stringify(response)}"`
      )
    }
    // logMessage(`Commit objects are ${JSON.stringify(commitObjects)}`)
    const commits = commitObjects.map((commitObject: any) => commitObject.sha)
    logMessage(`Commits corresponding to ${prNumber} are ${commits}`)
    return commits
  }
}

async function getChangeCommit(file: string): Promise<string> {
  if (!existsSync(file)) {
    logMessage(`File "${file}" does not exist`)
    process.exit(1)
  }
  const cmd = `git log -1 --format=format:%H --full-diff ${file}`
  return (await execCmdWithExitOnFailure(cmd))[0].trim()
}

async function getCurrentBranch(): Promise<string> {
  const cmd = 'git rev-parse --abbrev-ref HEAD'
  return (await execCmdWithExitOnFailure(cmd))[0].trim()
}

function isStagingBranch(branchName: string): boolean {
  return branchName.endsWith('staging')
}

function isProductionBranch(branchName: string): boolean {
  return branchName.endsWith('production')
}

function isMasterBranch(branchName: string): boolean {
  return branchName === 'master'
}

function logMessage(message: string) {
  // Intentionally sent to stderr since bash will read stdout of this script
  console.error(message)
}
