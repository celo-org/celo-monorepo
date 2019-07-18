import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import { switchToClusterFromEnv } from '@celo/celotool/src/lib/cluster'
import { removeHelmRelease } from 'src/lib/tracer-tool'

export const command = 'tracer-tool'

export const describe = 'destroy tracer-tool deployment'

type TracerToolArgv = DestroyArgv

export const builder = {}

export const handler = async (argv: TracerToolArgv) => {
  await switchToClusterFromEnv()
  await removeHelmRelease(argv.celoEnv)
}
