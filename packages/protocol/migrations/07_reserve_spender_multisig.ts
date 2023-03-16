import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForProxiedContract,
  // transferOwnershipOfProxy,
  transferOwnershipOfProxyExternal,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ReserveSpenderMultiSigInstance } from 'types/mento'
import { MySingleton } from './singletonArtifacts'

// const Artifactor = require('truffle-artifactor')
// console.log("require", artifacts.require('/Users/martinvol/celo/celo-monorepo/packages/protocol/build/mento/ReserveSpenderMultiSig.json'))

// const artifact = require("/Users/martinvol/celo/celo-monorepo/packages/protocol/build/mento/ReserveSpenderMultiSig.json")

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
    // TODO replace with contract
    console.log('insde')

    await transferOwnershipOfProxyExternal(proxy, reserveSpenderMultiSig.address)

    MySingleton.getInstance().initialized = true
    // MySingleton.getInstance().addArtifact(CeloContractName.ReserveSpenderMultiSig, proxy)
    // await transferOwnershipOfProxy(
    //   CeloContractName.ReserveSpenderMultiSig,
    //   reserveSpenderMultiSig.address,
    //   artifacts
    // )
  },
  'mento'
)
