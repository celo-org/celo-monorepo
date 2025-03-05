import { execSync } from 'child_process'
import * as fs from 'fs'
import { SemVer } from 'semver'

const DAILY_RELEASE_TAG = 'canary'
const WORKING_RELEASE_BRANCH_PREFIX = 'release/core-contracts/'
const TAG_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]*[a-zA-Z0-9]$/

// prerelease part extracted from official semver regex (can be found on https://semver.org/)
const PRERELEASE_IDENTIFIER_REGEX =
  /^(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*$/

export type Exports = Record<
  string,
  { import?: string; require?: string; types?: string; default?: string }
>

export type JSON = Record<string, string | boolean | Exports>

// versioning is done by either
// A Git tag of the form `core-contracts.vX` (e.g. `core-contracts.v12`) === latest release
// Otherwise if on the release branch a canary tagged release well be created bumping
// the canary version by one (e.g. `@celo/contracts@11.0.0-canary.1`)
// if not on a release branch a dry-run will be done unless an NPM_TAG is provided
// in which case we will try to fetch the last published version with that tag and bump or use the canary to get major and start versioning from there the new tag at 0
//  (e.g. `@celo/contracts@11.0.0@custom-tag.0`)
// It also supports git tags starting with core-contracts.vX-ANY to derive custom npm tags,
// for example `core-contracts.v11.2.3.post-audit` will result in determining
// the next version as `11.2.3-post-audit.0` and `post-audit` npm tag
export const determineNextVersion = (
  gitTag: string,
  gitBranch: string,
  npmPackage: string,
  npmTag: string
): SemVer | null => {
  let nextVersion: SemVer | null = null
  const matchesReleaseTag = gitTag.match(/^core-contracts.v([0-9]+)$/)
  const matchesAnyTag = gitTag.match(/core-contracts.v([0-9\.]+)\.(.+)/)

  if (matchesReleaseTag) {
    nextVersion = getVersionFromGitTag(matchesReleaseTag)
  } else if (matchesAnyTag && isValidNpmTag(matchesAnyTag[2])) {
    const tagFromGitTag = matchesAnyTag[2]
    const isSemverCompliantPreReleaseTag = isValidPrereleaseIdentifier(tagFromGitTag)
    const tag = isSemverCompliantPreReleaseTag ? tagFromGitTag : 'alpha'
    const tempVersion = getVersionFromGitTag(matchesAnyTag)

    nextVersion = new SemVer(
      `${tempVersion.major}.${tempVersion.minor}.${tempVersion.patch}-${tag}.0`
    )
  } else if (gitBranch.startsWith(WORKING_RELEASE_BRANCH_PREFIX)) {
    const lastVersion = getPreviousVersion(npmPackage, DAILY_RELEASE_TAG, 'latest')
    const lastVersionSemVer = new SemVer(lastVersion)

    // since branch names are of the form release/core-contracts.XX we can check the major from the branch name
    const major = gitBranch.split(WORKING_RELEASE_BRANCH_PREFIX)[1]

    const firstCanaryOfMajor = lastVersionSemVer.major !== parseInt(major, 10)
    nextVersion = lastVersionSemVer.inc(
      firstCanaryOfMajor ? 'premajor' : 'prerelease',
      DAILY_RELEASE_TAG
    )
    nextVersion.major = parseInt(major, 10)
  } else if (isValidNpmTag(npmTag)) {
    const lastVersion = getPreviousVersion(npmPackage, npmTag, DAILY_RELEASE_TAG)
    nextVersion = new SemVer(lastVersion).inc('prerelease', npmTag)
  }

  return nextVersion
}

export function isValidNpmTag(tag?: string) {
  return tag?.match(TAG_REGEX) !== null
}

export function isValidPrereleaseIdentifier(identifier: string) {
  return PRERELEASE_IDENTIFIER_REGEX.test(identifier)
}

// get the previous version for this tag or if not exists find the previous for the fallback
export function getPreviousVersion(
  npmPackage: string,
  tag = DAILY_RELEASE_TAG,
  fallbackTag = 'latest'
) {
  try {
    return fetchVersionFromNpm(npmPackage, tag)
  } catch (e) {
    return fetchVersionFromNpm(npmPackage, fallbackTag)
  }
}

export function fetchVersionFromNpm(npmPackage: string, tag: string) {
  return execSync(`npm view ${npmPackage}@${tag} version`, {
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .toString()
    .trim()
}

export function getVersionFromGitTag(matchedTag: RegExpMatchArray) {
  const [, versionFromGitTag] = matchedTag
  const [major, minor, ...patchAndMore] = versionFromGitTag.split('.')
  return new SemVer(
    [major, minor || 0, ...(patchAndMore.length ? patchAndMore : [0])].map((x) => x || 0).join('.')
  )
}

export function getReleaseTypeFromSemVer(version: SemVer): string | number {
  return version.prerelease.length ? version.prerelease[0] : 'latest'
}

export function replacePackageVersionAndMakePublic(
  packageJsonPath: string,
  onDone?: (json: JSON) => void
) {
  const json: JSON = JSON.parse(fs.readFileSync(packageJsonPath).toString())

  if (process.env.RELEASE_VERSION) {
    console.info(`Replacing ${json.name as string} version with provided RELEASE_VERSION`)

    json.version = process.env.RELEASE_VERSION
    json.private = false
  } else {
    console.info('No RELEASE_VERSION provided')
  }

  if (onDone !== undefined) {
    onDone(json)
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(json, null, 2))
}
