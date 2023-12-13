import { execSync } from 'child_process'
import { determineNextVersion, getReleaseTypeFromSemVer } from './utils'

const npmTag = process.env.NPM_TAG?.trim() || ''
const gitTag = process.env.GITHUB_TAG || ''
const branchName = execSync('git branch --show-current').toString().trim()

const nextVersion = determineNextVersion(gitTag, branchName, npmTag)

if (nextVersion === null) {
  // dry-run will build the package but not publish it
  process.exit(0)
}

console.log(`RELEASE_VERSION=${nextVersion.version}`)
console.log(`RELEASE_TYPE=${getReleaseTypeFromSemVer(nextVersion)}`)

process.exit(0)
