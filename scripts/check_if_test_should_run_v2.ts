// This is a helpful script to figure out whether to run incremental testing in a directory or not.
// Say the caller is in the celotool dir and wants to check if celotool or protocol dir has changed then
// the sample usage will be
// node -r ts-node/register scripts/check_if_test_should_run_v2.ts --dirs packages/protocol,packages/celotool
// Prints "true" to stdout if the tests should run
// Prints "false" otherwise
// All console logging intentionally sent to stderr, so that, stdout is not corrupted
import { execCmdWithExitOnFailure } from '@celo/celotool/src/lib/utils'
import { existsSync } from 'fs'

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
  logMessage(`Checking if any of dirs [${dirs}] have changed in commit ${commit}...`)
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
  // "git rev-parse --abbrev-ref HEAD" returns the branch name
  // "git merge-base master $(git rev-parse --abbrev-ref HEAD)" returns the merge point of master and the current branch
  // And then we finally print out all the commit hashes between the two commits.
  const cmd =
    'git log --format=format:%H $(git merge-base master $(git rev-parse --abbrev-ref HEAD))..HEAD'
  const stdout = (await execCmdWithExitOnFailure(cmd))[0]
  const commitHashes = stdout.split('\n')
  logMessage(`Commit hashes in this branch are [${commitHashes}]`)
  const commits = stdout.split('\n')
  return commits.filter((x) => x.trim().length > 0)
}

async function getChangeCommit(file: string): Promise<string> {
  if (!existsSync(file)) {
    logMessage(`File ${file} does not exist`)
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
