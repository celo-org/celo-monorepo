import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForProxiedContract,
  // transferOwnershipOfProxy,
  transferOwnershipOfProxyExternal,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ReserveSpenderMultiSigInstance } from 'types/mento'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.reserveSpenderMultiSig.signatories,
    config.reserveSpenderMultiSig.numRequiredConfirmations,
    config.reserveSpenderMultiSig.numInternalRequiredConfirmations,
  ]
}

module.exports = deploymentForProxiedContract<ReserveSpenderMultiSigInstance>(
  web3,
  artifacts,
  CeloContractName.ReserveSpenderMultiSig,
  initializeArgs,
  async (
    reserveSpenderMultiSig: ReserveSpenderMultiSigInstance,
    _web3: any,
    _networkName: any,
    proxy?: any
  ) => {
    await transferOwnershipOfProxyExternal(proxy, reserveSpenderMultiSig.address)
  },
  'mento'
)
