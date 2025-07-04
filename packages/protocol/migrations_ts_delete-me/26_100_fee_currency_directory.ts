import { ArtifactsSingleton } from '@celo/protocol/lib/artifactsSingleton'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { SortedOraclesInstance, StableTokenInstance } from '@celo/protocol/types/typechain-mento'
import { FeeCurrencyDirectoryInstance } from 'types/08'
import { MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from '../contractPackages'

const initializeArgs = async (): Promise<any[]> => {
  return []
}

module.exports = deploymentForCoreContract<FeeCurrencyDirectoryInstance>(
  web3,
  artifacts,
  CeloContractName.FeeCurrencyDirectory,
  initializeArgs,
  async (feeCurrencyDirectory: FeeCurrencyDirectoryInstance, _web3: Web3, networkName: string) => {
    const sortedOracles = await getDeployedProxiedContract<SortedOraclesInstance>(
      'SortedOracles',
      artifacts
    )

    for (const token of ['StableToken', 'StableTokenEUR', 'StableTokenBRL']) {
      const stableToken: StableTokenInstance =
        await getDeployedProxiedContract<StableTokenInstance>(
          token,
          ArtifactsSingleton.getInstance(MENTO_PACKAGE)
        )
      console.log(
        'setting currency config for',
        token,
        'with address',
        stableToken.address,
        'and adapter address',
        sortedOracles.address,
        'on network',
        networkName
      )
      await feeCurrencyDirectory.setCurrencyConfig(stableToken.address, sortedOracles.address, 1)
    }

    console.log(
      'Fee currency directory deployed and registered!!!',
      feeCurrencyDirectory.address,
      networkName
    )
  },
  SOLIDITY_08_PACKAGE
)
