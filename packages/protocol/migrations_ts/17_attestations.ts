import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  convertToContractDecimals,
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { AttestationsInstance } from 'types'
import { StableTokenInstance } from 'types/mento'
import { MENTO_PACKAGE } from '../contractPackages'
import { ArtifactsSingleton } from '../lib/artifactsSingleton'

const initializeArgs = async (): Promise<[string, string, string, string, string[], string[]]> => {
  const stableToken: StableTokenInstance = await getDeployedProxiedContract<StableTokenInstance>(
    'StableToken',
    ArtifactsSingleton.getInstance(MENTO_PACKAGE)
  )

  const attestationFee = await convertToContractDecimals(
    config.attestations.attestationRequestFeeInDollars,
    stableToken
  )
  return [
    config.registry.predeployedProxyAddress,
    config.attestations.attestationExpiryBlocks.toString(),
    config.attestations.selectIssuersWaitBlocks.toString(),
    config.attestations.maxAttestations.toString(),
    [stableToken.address],
    [attestationFee.toString()],
  ]
}

module.exports = deploymentForCoreContract<AttestationsInstance>(
  web3,
  artifacts,
  CeloContractName.Attestations,
  initializeArgs
)
