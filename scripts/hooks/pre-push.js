const { execSync } = require('child_process')
const chalk = require('chalk')
const path = require('path')
const exec = (args) => execSync(args).toString().trim()

////////////////////////////////////////////////////////////////
/// CONFIG
////////////////////////////////////////////////////////////////

// Set this to the FIRST day where commits are valid!
const THRESHOLD_DATE = new Date('2019-07-17')

////////////////////////////////////////////////////////////////
/// UTILITY FUNCTIONS
////////////////////////////////////////////////////////////////

function mergeBaseFor(refA, refB) {
  return exec(`git merge-base ${refA} ${refB}`)
}

function getCommitRange(change, remoteName) {
  if (change.remoteSHA === '0000000000000000000000000000000000000000') {
    // pushing a new branch
    // => commit range = changes from master
    const fromSHA = mergeBaseFor(`${remoteName}/master`, change.localSHA)
    return [fromSHA, change.localSHA]
  } else {
    // push can be fast forward or not (push -f)
    // so we get the common ancestor and commits from there
    const fromSHA = mergeBaseFor(change.remoteSHA, change.localSHA)
    // assuming a fast forward => fromSHA is remoteBranch current HEAD
    return [fromSHA, change.remoteSHA, change.localSHA]
  }
}

/** Get the list for changed files between two commits */
function getChangedFiled(fromSHA, toSHA) {
  return exec(`git diff --name-only ${fromSHA}..${toSHA}`).split('\n')
}

/**
 * Get date from the first commit from all commits between
 * to given commits
 */
function getDateFromFirstCommit(fromSHA, toSHA) {
  const args = [
    'log',
    "--pretty='%cd'", // show only the commiterDate
    '--date=short', // date in YYYY-MM-DD format
    '--date-order', // order commits by date
    '--reverse', // show olders commits first
    `${fromSHA}..${toSHA}`, // show commits fromSHA to toSHA
  ]
  const dateStr = exec(`git ${args.join(' ')} | head -1`)
  return new Date(dateStr)
}

////////////////////////////////////////////////////////////////
/// MAIN
////////////////////////////////////////////////////////////////

// change if the remote name is different
const remoteName = 'origin'
// create remote tracking branches to ensure we can compare current to origin/master
execSync('git ls-remote --heads origin master')

execSync('git fetch origin')

const changes = process.env.HUSKY_GIT_STDIN.split('\n')
  .filter((line) => line !== '')
  .map((line) => {
    const [localRef, localSHA, remoteRef, remoteSHA] = line.split(' ')
    return { localRef, localSHA, remoteRef, remoteSHA }
  })
for (const change of changes) {
  const [from, to] = getCommitRange(change, remoteName)

  const changedFiles = getChangedFiled(from, to)

  const pushedMnemonicFiles = changedFiles.filter(
    (name) => path.basename(name).startsWith('.env.mnemonic') && path.extname(name) !== '.enc'
  )
  if (pushedMnemonicFiles.length > 0) {
    console.error(`Trying to push conflicting files`)
    console.info(`Conflicting Files:\n  ${pushedMnemonicFiles.join('\n  ')}`)
    console.error(chalk.red(`(${change.remoteRef}) Push rejected!`))
    process.exit(1)
  }

  const firstCommitDate = getDateFromFirstCommit(from, to)
  if (firstCommitDate < THRESHOLD_DATE) {
    console.error(`Trying to push a commit from a date older than ${THRESHOLD_DATE.toUTCString()}`)
    console.error(`FirstCommitDate: ${firstCommitDate.toUTCString()}`)
    console.error(chalk.red(`(${change.remoteRef}) Push rejected!`))
    process.exit(1)
  }
}
