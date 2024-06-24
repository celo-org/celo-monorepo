import { execSync } from 'child_process'
import { determineNextVersion, getReleaseTypeFromSemVer } from './utils'

const npmPackage = process.env.NPM_PACKAGE?.trim() || ''
const npmTag = process.env.NPM_TAG?.trim() || ''
const gitTag = process.env.GITHUB_TAG || ''
const branchName = execSync('git branch --show-current').toString().trim()

// versioning is done by either
// A Git tag of the form `core-contracts.vX.Y.Z.post-audit` (e.g. `core-contracts.v10.0.0.post-audit`) === latest release
// Otherwise if on the release branch a canary tagged release well be created bumping
// the canary version by one (e.g. `@celo/contracts@11.0.0-canary.1`)
// if not on a release branch a dry-run will be done unless an NPM_TAG is provided
// in which case we will try to fetch the last published version with that tag and bump or use the canary to get major and start versioning from there the new tag at 0
//  (e.g. `@celo/contracts@11.0.0@custom-tag.0`)
const nextVersion = determineNextVersion(gitTag, branchName, npmPackage, npmTag)

if (nextVersion === null) {
  // dry-run will build the package but not publish it
  process.exit(0)
}

process.stdout.write(`RELEASE_VERSION=${nextVersion.version}\n`)
process.stdout.write(`RELEASE_TYPE=${getReleaseTypeFromSemVer(nextVersion)}\n`)

process.exit(0)
