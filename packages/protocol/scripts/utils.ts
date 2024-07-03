import { execSync } from 'child_process'
import * as fs from 'fs'
import { SemVer } from 'semver'

const DAILY_RELEASE_TAG = 'canary'
const WORKING_RELEASE_BRANCH_PREFIX = 'release/core-contracts/'

export type Exports = Record<
  string,
  { import?: string; require?: string; types?: string; default?: string }
>

export type JSON = Record<string, string | boolean | Exports>

export const determineNextVersion = (
  gitTag: string,
  gitBranch: string,
  npmPackage: string,
  npmTag: string
): SemVer | null => {
  let nextVersion: SemVer | null = null
  const matchesReleaseTag = gitTag.match(/core-contracts.v(.+).post-audit/)
  const matchesPreAuditTag = gitTag.match(/core-contracts.v(.+).pre-audit/)

  if (matchesReleaseTag) {
    nextVersion = getVersionFromGitTag(matchesReleaseTag)
  } else if (matchesPreAuditTag) {
    const tempVersion = getVersionFromGitTag(matchesPreAuditTag)
    nextVersion = new SemVer(
      `${tempVersion.major}.${tempVersion.minor}.${tempVersion.patch}-pre-audit.0`
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
  return tag?.match(/^[a-zA-Z]{1,}[a-zA-Z-]*[a-zA-Z]{1,}$/) !== null
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
