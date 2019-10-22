import { removeHelmRelease } from 'src/lib/attestation-service'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { DestroyArgv } from '../../deploy/destroy'

export const command = 'attestation-service'

export const describe = 'destroy the attestation-service deploy'

export const builder = {}

export const handler = async (argv: DestroyArgv) => {
  await switchToClusterFromEnv()
  await removeHelmRelease(argv.celoEnv)
}
