import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { deploymentForCoreContract } from '@celo/protocol/lib/web3-utils'
import { FeeCurrencyDirectoryInstance } from 'types/08'
import { SOLIDITY_08_PACKAGE } from '../contractPackages'

const initializeArgs = async (): Promise<any[]> => {
  return [
  ]
}

module.exports = deploymentForCoreContract<FeeCurrencyDirectoryInstance>(
  web3,
  artifacts,
  CeloContractName.FeeCurrencyDirectory,
  initializeArgs,
  async (feeCurrencyDirectory: FeeCurrencyDirectoryInstance, _web3: Web3, networkName: string) => {
    console.log("Fee currency directory deployed and registered!!!", feeCurrencyDirectory.address, networkName);
  },
  SOLIDITY_08_PACKAGE
)
