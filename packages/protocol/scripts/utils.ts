import { execSync } from 'child_process'
import { SemVer } from 'semver'

const DAILY_RELEASE_TAG = 'canary'
const WORKING_RELEASE_BRANCH_PREFIX = 'release/core-contracts/'

export const determineNextVersion = (
  gitTag: string,
  gitBranch: string,
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
    const lastVersion = getPreviousVersion(DAILY_RELEASE_TAG, 'latest')
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
    const lastVersion = getPreviousVersion(npmTag, DAILY_RELEASE_TAG)
    nextVersion = new SemVer(lastVersion).inc('prerelease', npmTag)
  }

  return nextVersion
}

export function isValidNpmTag(tag?: string) {
  return tag?.match(/^[a-zA-Z]{1,}[a-zA-Z-]*[a-zA-Z]{1,}$/) !== null
}

// get the previous version for this tag or if not exists find the previous for the fallback
export function getPreviousVersion(tag = DAILY_RELEASE_TAG, fallbackTag = 'latest') {
  try {
    return fetchVersionFromNpm(tag)
  } catch (e) {
    return fetchVersionFromNpm(fallbackTag)
  }
}

export function fetchVersionFromNpm(tag: string) {
  return execSync(`npm view @celo/contracts@${tag} version`, {
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
