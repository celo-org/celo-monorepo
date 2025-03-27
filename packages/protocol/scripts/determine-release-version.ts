import { execSync } from 'child_process';
import { determineNextVersion, getReleaseTypeFromSemVer } from './utils';

const npmPackage = process.env.NPM_PACKAGE?.trim() || ''
const npmTag = process.env.NPM_TAG?.trim() || ''
const gitTag = process.env.GITHUB_TAG || ''
const branchName = execSync('git branch --show-current').toString().trim()

const nextVersion = determineNextVersion(gitTag, branchName, npmPackage, npmTag)

if (nextVersion === null) {
  // dry-run will build the package but not publish it
  process.exit(0)
}

process.stdout.write(`RELEASE_VERSION=${nextVersion.version}\n`)
process.stdout.write(`RELEASE_TYPE=${getReleaseTypeFromSemVer(nextVersion)}\n`)

process.exit(0)
