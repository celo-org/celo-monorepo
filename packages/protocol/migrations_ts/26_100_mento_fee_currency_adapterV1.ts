import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract, getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { SortedOraclesInstance } from '@celo/protocol/types'
import { MentoFeeCurrencyAdapterV1Instance } from 'types/08'
import { SOLIDITY_08_PACKAGE } from '../contractPackages'

const initializeArgs = async (): Promise<any[]> => {
  const sortedOraclesAddress = await getDeployedProxiedContract<SortedOraclesInstance>('SortedOracles', artifacts)
  return [
    sortedOraclesAddress.address
  ]
}

module.exports = deploymentForCoreContract<MentoFeeCurrencyAdapterV1Instance>(
  web3,
  artifacts,
  CeloContractName.MentoFeeCurrencyAdapterV1,
  initializeArgs,
  async (feeCurrencyDirectory: MentoFeeCurrencyAdapterV1Instance, _web3: Web3, networkName: string) => {

    console.log("MentoFeeCurrencyAdapterV1Instance deployed and registered!!!", feeCurrencyDirectory.address, networkName);
  },
  SOLIDITY_08_PACKAGE
)
