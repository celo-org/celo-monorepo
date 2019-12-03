import { removeHelmRelease } from 'src/lib/attestation-bot'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'attestation-bot'

export const describe = 'destroy attestation-bot deployment'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()
  await removeHelmRelease(argv.celoEnv)
}
