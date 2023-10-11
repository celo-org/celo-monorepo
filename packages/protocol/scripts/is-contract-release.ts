import { SemVer } from 'semver'
const arg = process.argv[2]
if (!arg) {
  console.error('Missing git tag')
  process.exit(1)
}

const match = arg.match(/core-contracts.v(.+)/)
if (!match) {
  console.error(`Git tag didn't match the following RegExp("/core-contracts.v(.+)/"), got ${arg}`)
  process.exit(1)
}

const [, gitTag] = match
const [major, minor, patchAndMore] = gitTag.split('.')
const semver = new SemVer([major, minor, patchAndMore].map((x) => x || 0).join('.'))

console.log(semver)
console.log(`RELEASE_VERSION=${semver.version}`)
console.log(`RELEASE_TYPE=${semver.prerelease.length ? 'prerelease' : 'release'}`)
process.exit(0)
