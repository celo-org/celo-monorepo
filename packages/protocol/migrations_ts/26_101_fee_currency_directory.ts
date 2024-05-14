import { ArtifactsSingleton } from '@celo/protocol/lib/artifactsSingleton'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { StableTokenInstance } from '@celo/protocol/types/typechain-mento'
import { FeeCurrencyDirectoryInstance, MentoFeeCurrencyAdapterV1Instance } from 'types/08'
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
    const artifacts08 = ArtifactsSingleton.getInstance(SOLIDITY_08_PACKAGE, artifacts)
    const feeCurrencyDirectoryInstance =
      await getDeployedProxiedContract<FeeCurrencyDirectoryInstance>(
        'FeeCurrencyDirectory',
        artifacts08
      )
    const nentoFeeCurrencyAdapterV1Instance =
      await getDeployedProxiedContract<MentoFeeCurrencyAdapterV1Instance>(
        'MentoFeeCurrencyAdapterV1',
        artifacts08
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
        nentoFeeCurrencyAdapterV1Instance.address,
        'on network',
        networkName
      )
      await feeCurrencyDirectoryInstance.setCurrencyConfig(
        stableToken.address,
        nentoFeeCurrencyAdapterV1Instance.address,
        1
      )
    }

    console.log(
      'Fee currency directory deployed and registered!!!',
      feeCurrencyDirectory.address,
      networkName
    )
  },
  SOLIDITY_08_PACKAGE
)
