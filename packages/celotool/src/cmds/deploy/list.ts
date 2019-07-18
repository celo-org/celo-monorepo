import { DeployArgv } from '@celo/celotool/src/cmds/deploy'
import { forEach, groupBy } from 'lodash'
import {
  getNonSystemHelmReleases,
  getPackageName,
  HelmRelease,
  switchToClusterFromEnv,
} from 'src/lib/cluster'

export const command = 'list'

export const describe = 'list the deploys on the cluster given an env'

export type ListArgv = DeployArgv

export const builder = {}

export const handler = async (_argv: ListArgv) => {
  await switchToClusterFromEnv()
  const releases = await getNonSystemHelmReleases()
  printReleases(releases)
}

export function printReleases(releases: HelmRelease[]) {
  const releasesByEnv = groupBy(releases, (release) => release.Namespace)

  forEach(releasesByEnv, (envReleases, key) => {
    console.info(`Environment: ${key}, Releases:\n`)

    envReleases.forEach((release) =>
      console.info(
        `  - ${getPackageName(release.Chart)} (${release.Status}), last updated at: ${
          release.Updated
        }`
      )
    )
    console.info(`\n`)
  })
}
