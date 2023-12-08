import { execSync } from 'child_process'
import { SemVer } from 'semver'
const DAILY_RELEASE_TAG = 'canary'
const WORKING_RELEASE_BRANCH_PREFIX = 'release/core-contracts/'
const npmTag = process.env.NPM_TAG?.trim() || ''
const gitTag = process.env.GITHUB_TAG || ''
let nextVersion: SemVer

// versioning is done by either
// A Git tag of the form `core-contracts.vX.Y.Z.post-audit` (e.g. `core-contracts.v10.0.0.post-audit`) === latest release
// Otherwise if on the release branch a canary tagged release well be created bumping
// the canary version by one (e.g. `@celo/contracts@11.0.0-canary.1`)
// if not on a release branch a dry-run will be done unless an NPM_TAG is provided
// in which case we will try to fetch the last published version with that tag and bump or use the canary to get major and start versioning from there the new tag at 0
//  (e.g. `@celo/contracts@11.0.0@custom-tag.0`)

const matchesReleaseTag = gitTag.match(/core-contracts.v(.+).post-audit/)
const matchesPreAuditTag = gitTag.match(/core-contracts.v(.+).pre-audit/)

const branchName = execSync('git branch --show-current').toString().trim()

if (matchesReleaseTag) {
  echoLog('Doing major release')
  nextVersion = getVersionFromGitTag(matchesReleaseTag)
} else if (matchesPreAuditTag) {
  echoLog('Doing pre-audit release')
  const tempVersion = getVersionFromGitTag(matchesPreAuditTag)
  nextVersion = new SemVer(
    `${tempVersion.major}.${tempVersion.minor}.${tempVersion.patch}-pre-audit.0`
  )
} else if (branchName.startsWith(WORKING_RELEASE_BRANCH_PREFIX)) {
  echoLog(`Doing ${DAILY_RELEASE_TAG} release`)
  const lastVersion = getPreviousVersion(DAILY_RELEASE_TAG, 'latest')
  const lastVersionSemVer = new SemVer(lastVersion)

  // since branch names are of the form release/core-contracts.XX we can check the major from the branch name
  const major = branchName.split(WORKING_RELEASE_BRANCH_PREFIX)[1]

  const firstCanaryOfMajor = lastVersionSemVer.major !== parseInt(major, 10)
  nextVersion = lastVersionSemVer.inc(
    firstCanaryOfMajor ? 'premajor' : 'prerelease',
    DAILY_RELEASE_TAG
  )
  nextVersion.major = parseInt(major, 10)
} else if (npmTag?.match(/^[a-zA-Z]+$/)) {
  // any string of letters only

  echoLog(`Doing custom tag release: ${npmTag}`)
  const lastVersion = getPreviousVersion(npmTag, DAILY_RELEASE_TAG)
  nextVersion = new SemVer(lastVersion).inc('prerelease', npmTag)
} else {
  echoLog('No release tag found, skipping release')
  // dry-run will build the package but not publish it
  process.exit(0)
}

// tslint:disable-next-line
console.log(`RELEASE_VERSION=${nextVersion.version}`)
// tslint:disable-next-line
console.log(`RELEASE_TYPE=${nextVersion.prerelease.length ? nextVersion.prerelease[0] : 'latest'}`)
process.exit(0)

// get the previous version for this tag or if not exists find the previous for the fallback
function getPreviousVersion(tag = DAILY_RELEASE_TAG, fallbackTag = 'latest') {
  try {
    return execSync(`npm view @celo/contracts@${tag} version`).toString().trim()
  } catch (e) {
    console.info('The  "npm ERR! 404 No match found for version" can be ignored')
    return execSync(`npm view @celo/contracts@${fallbackTag} version`).toString().trim()
  }
}

function getVersionFromGitTag(matchedTag: RegExpMatchArray) {
  const [, versionFromGitTag] = matchedTag
  const [major, minor, ...patchAndMore] = versionFromGitTag.split('.')
  return new SemVer(
    [major, minor || 0, ...(patchAndMore.length ? patchAndMore : [0])].map((x) => x || 0).join('.')
  )
}
// echo the message to the console
function echoLog(message: string) {
  console.log(`echo "${message}"`)
}
