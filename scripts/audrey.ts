import { execCmdWithExitOnFailure } from '@celo/celotool/src/lib/utils'
// import path from 'path'
async function packageNeedsBump(): Promise<boolean> {
  const commitForLastPublish = await tagForLastPublish()
  // The current published version was not tagged with the relevant commit.
  // It may be the case that no changes have happened, but getting a real
  // answer is difficult, so let's just publish it again.
  if (!commitForLastPublish) {
    return true
  }
  // if files other than package.json have changed -> return true
  // look at changes in package.json. If anything other than the version
  // and @celo dependency versions have changed -> return true
  // if any @celo dependencies need update -> return true
  return false
}
async function bumpPackageVersion(): Promise<void> {
  await execCmdWithExitOnFailure('yarn version --minor')
}
// async function celoPackageDependencies() {}
async function getCurrentBranch(): Promise<string> {
  const [branch] = await execCmdWithExitOnFailure('git rev-parse --abbrev-ref HEAD')
  return branch
}
async function getRecentCommits() {
  const [commits] = await execCmdWithExitOnFailure('git rev-list -10 HEAD -- .')
  return commits.trim().split('\n')
}
// async function diffSinceCommit(commitHash: string) {
//   const [diff] = await execCmdWithExitOnFailure(
//     `git diff --word-diff=porcelain -U0 ${commitHash}..HEAD .`
//   )
//   return diff
// }
// async function getFilesChanged() {}
async function tagForLastPublish(): Promise<string | undefined> {
  const [latestPublished] = await execCmdWithExitOnFailure('npm view . version')
  const [distTagsResponse] = await execCmdWithExitOnFailure('npm view . dist-tags --json')
  const tagsToVersion = JSON.parse(distTagsResponse)
  let currentCommitTags: string[] = []
  for (let tag of Object.keys(tagsToVersion)) {
    tag = tag.toString()
    if (tag.length === 40 && tagsToVersion[tag] === latestPublished) {
      currentCommitTags.push(tag)
    }
  }
  if (currentCommitTags.length === 1) {
    return currentCommitTags[0]
  }
}
// async function celoDependenciesCurrent(): string[] {
//   f
// }
async function main() {
  console.info(`Recent commits: ${await getRecentCommits()}`)
  console.info(`Current branch: ${await getCurrentBranch()}`)
  const commitHash = (await tagForLastPublish())!
  console.info(`tag for last pub: ${commitHash}`)
  // console.info(await diffSinceCommit(commitHash))
  const needsBump = await packageNeedsBump()
  console.info(`Needs it??? ${needsBump}`)
  if (needsBump) {
    console.info('bumping version....')
    await bumpPackageVersion()
  }
}
main()
