import { switchToClusterFromEnv } from 'src/lib/cluster'
import { removeHelmRelease } from 'src/lib/tracer-tool'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'tracer-tool'

export const describe = 'destroy tracer-tool deployment'

type TracerToolArgv = DestroyArgv

export const builder = {}

export const handler = async (argv: TracerToolArgv) => {
  await switchToClusterFromEnv()
  await removeHelmRelease(argv.celoEnv)
}
