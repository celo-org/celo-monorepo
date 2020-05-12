// This is a helpful script to figure out whether to run incremental testing in a directory or not.
// Say the caller is in the celotool dir and wants to check if celotool or protocol dir has changed then
// the sample usage will be
// node -r ts-node/register scripts/check_if_test_should_run_v2.ts --dirs packages/protocol,packages/celotool
// Prints "false" if tests shouldn't run, anything else will cause tests to run
// All console logging intentionally sent to stderr, so that, stdout is not corrupted
import { execCmdWithExitOnFailure } from '@celo/celotool/src/lib/cmd-utils'
import { existsSync, readFileSync } from 'fs'
import fetch from 'node-fetch'
import { join } from 'path'
import { filename as dependencyGraphFileName } from './dependency-graph-utils'

const rootDirectory = join(__dirname, '..')
const dependencyGraph = JSON.parse(
  readFileSync(join(rootDirectory, dependencyGraphFileName)).toString()
)

const argv = require('minimist')(process.argv.slice(2))
const packagesToTest: string[] = argv.packages.split(',')
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

  const circleciChangeCommit = await getChangeCommit(join(rootDirectory, '.circleci', 'config.yml'))
  const yarnLockChangeCommit = await getChangeCommit(join(rootDirectory, 'yarn.lock'))
  if (
    branchCommits.includes(yarnLockChangeCommit) ||
    branchCommits.includes(circleciChangeCommit)
  ) {
    // always run tests when yarn.lock or circlici config have changed
    console.info('circleci config or yarn.lock file changed')
    return
  }

  const changedPackages = await getChangedPackages(branchCommits)
  logMessage(`Found ${changedPackages.length} changed packages (${changedPackages.join(', ')})`)

  function hasChangedDependencies(packageName: string): Boolean {
    if (changedPackages.includes(packageName)) {
      return true
    }

    return dependencyGraph[packageName].map(hasChangedDependencies).some(Boolean)
  }

  const anyDependenciesChanged = packagesToTest.map(hasChangedDependencies).some(Boolean)
  if (anyDependenciesChanged) {
    console.info(`${packagesToTest.join(', ')} or dependencies have changed`)
    return
  }

  console.info('false')
}

async function getChangedPackages(commits: string[]): Promise<string[]> {
  const changedPackages = new Set<string>()
  for (const pkg of Object.keys(dependencyGraph)) {
    const changeCommit = await getChangeCommit(join(rootDirectory, 'packages', pkg))
    if (commits.includes(changeCommit)) {
      changedPackages.add(pkg)
    }
  }

  return Array.from(changedPackages)
}

async function getBranchCommits(): Promise<string[]> {
  const isCI = process.env.CI
  if (!isCI) {
    // Running locally, let's just compare commits with master instead of fetching
    // commits from a potentially not existing PR
    const [commits] = await execCmdWithExitOnFailure('git cherry master')
    return commits
      .split('\n')
      .filter(Boolean)
      .map((c) => c.slice(1).trim())
  }

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
    const commits = await getAllCommits(url)
    logMessage(`Found ${commits.length} commits in PR ${prNumber}: ${commits}`)
    return commits
  }

  async function getAllCommits(url: string, commits: string[] = []): Promise<string[]> {
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
    commits = commits.concat(commitObjects.map((commitObject: any) => commitObject.sha))

    const nextPageLink: string | null = getNextPageLink(response)
    if (nextPageLink) {
      logMessage(`Getting commits from the next page: ${nextPageLink}`)
      return getAllCommits(nextPageLink, commits)
    }
    return commits
  }
}

// Reference: https://www.w3.org/wiki/LinkHeader
// linkHeaderValue value would look similar to this
// <https://api.github.com/repositories/197642503/pulls/1152/commits?page=2>; rel="next", <https://api.github.com/repositories/197642503/pulls/1152/commits?page=2>; rel="last"
function getNextPageLink(response: Response): string | null {
  const linkHeaderValue: string | null = response.headers.get('link')
  if (!linkHeaderValue) {
    logMessage(`Link header not found in ${response.url}`)
    return null
  }
  logMessage(`Link header value is \"${linkHeaderValue}\"`)
  const linkEntries = linkHeaderValue.split(',')
  for (let i = 0; i < linkEntries.length; i++) {
    if (linkEntries[i].endsWith('rel="next"')) {
      const lastSemiColon = linkEntries[i].lastIndexOf(';')
      let nextPageLink = linkEntries[i].substring(0, lastSemiColon)
      nextPageLink = nextPageLink.trim()
      if (nextPageLink.startsWith('<')) {
        nextPageLink = nextPageLink.substring(1)
      }
      if (nextPageLink.endsWith('>')) {
        nextPageLink = nextPageLink.substring(0, nextPageLink.length - 1)
      }
      return nextPageLink
    }
  }
  logMessage(`next page link not found in "${linkHeaderValue}"`)
  return null
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
