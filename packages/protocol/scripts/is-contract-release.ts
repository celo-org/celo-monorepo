import { SemVer } from 'semver'
const arg = process.env.INPUT_VERSION || process.env.GITHUB_TAG

const match = arg?.match(/core-contracts.v(.+)/)
if (!match) {
  console.error(
    `Git tag didn't match the following RegExp("/core-contracts.v(.+)/"), got ${arg}, next steps will be dry-run.`
  )
  process.exit(0)
}

const [, gitTag] = match
const [major, minor, ...patchAndMore] = gitTag.split('.')
const semver = new SemVer(
  [major, minor || 0, ...(patchAndMore.length ? patchAndMore : [0])].map((x) => x || 0).join('.')
)

// tslint:disable-next-line
console.log(`RELEASE_VERSION=${semver.version}`)
// tslint:disable-next-line
console.log(`RELEASE_TYPE=${semver.prerelease.length ? semver.prerelease[0] : 'latest'}`)
process.exit(0)
