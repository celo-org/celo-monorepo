import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import fs = require('fs')
import {
  GoldTokenInstance,
  RegistryInstance,
  ReleaseGoldContract,
  ReleaseGoldMultiSigContract,
  ReleaseGoldMultiSigProxyContract,
  ReleaseGoldProxyContract,
} from 'types'

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['network', 'grants'],
    })
    const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
    const goldToken = await getDeployedProxiedContract<GoldTokenInstance>('GoldToken', artifacts)
    const ReleaseGoldMultiSig: ReleaseGoldMultiSigContract = artifacts.require(
      'ReleaseGoldMultiSig'
    )
    const ReleaseGoldMultiSigProxy: ReleaseGoldMultiSigProxyContract = artifacts.require(
      'ReleaseGoldMultiSigProxy'
    )
    const ReleaseGold: ReleaseGoldContract = artifacts.require('ReleaseGold')
    const ReleaseGoldProxy: ReleaseGoldProxyContract = artifacts.require('ReleaseGoldProxy')
    const releases = []
    const handleJSONFile = async (err, data) => {
      if (err) {
        throw err
      }
      for (const releaseGoldConfig of JSON.parse(data)) {
        const releaseGoldInitializeArgs = [
          new Date(releaseGoldConfig.releaseStartTime).getTime() / 1000,
          releaseGoldConfig.releaseCliffTime,
          releaseGoldConfig.numReleasePeriods,
          releaseGoldConfig.releasePeriod,
          releaseGoldConfig.amountReleasedPerPeriod,
          releaseGoldConfig.revocable,
          releaseGoldConfig.beneficiary,
          releaseGoldConfig.releaseOwner,
          releaseGoldConfig.refundAddress,
          releaseGoldConfig.subjectToLiquidityProvision,
          releaseGoldConfig.initialDistributionRatio,
          releaseGoldConfig.canValidate,
          releaseGoldConfig.canVote,
          registry.address,
        ]
        const releaseGoldMultiSigInitializeArgs = [
          [releaseGoldConfig.releaseOwner, releaseGoldConfig.beneficiary],
          2,
          2,
        ]
        const initializeProxyContract = async (contractInstance, proxyInstance, args) => {
          const initializeAbi = (contractInstance as any).abi.find(
            (abi: any) => abi.type === 'function' && abi.name === 'initialize'
          )
          const callData = web3.eth.abi.encodeFunctionCall(initializeAbi, args)
          const reciept = await proxyInstance._setAndInitializeImplementation(
            contractInstance.address,
            callData as any
          )
          return reciept.tx
        }
        const releaseGoldProxyInstance = await ReleaseGoldProxy.new()
        const releaseGoldInstance = await ReleaseGold.new()
        const releaseGoldMultiSigProxyInstance = await ReleaseGoldMultiSigProxy.new()
        const releaseGoldMultiSigInstance = await ReleaseGoldMultiSig.new()
        await goldToken.transfer(
          releaseGoldProxyInstance.address,
          releaseGoldConfig.amountReleasedPerPeriod * releaseGoldConfig.numReleasePeriods,
          { from: releaseGoldConfig.releaseOwner }
        )
        const releaseTxHash = await initializeProxyContract(
          releaseGoldMultiSigInstance,
          releaseGoldMultiSigProxyInstance,
          releaseGoldMultiSigInitializeArgs
        )
        const multiSigTxHash = await initializeProxyContract(
          releaseGoldInstance,
          releaseGoldProxyInstance,
          releaseGoldInitializeArgs
        )
        // TODO(lucas): Is owner multisig proxy or multisig
        await releaseGoldProxyInstance._transferOwnership(releaseGoldMultiSigInstance.address)

        releases.push({
          Beneficiary: releaseGoldConfig.beneficiary,
          ProxyAddress: releaseGoldProxyInstance.address,
          MultiSigProxyAddress: releaseGoldMultiSigProxyInstance.address,
          ReleaseTxHash: releaseTxHash,
          MultiSigTxHash: multiSigTxHash,
        })
      }
      // tslint:disable-next-line: no-console
      console.log(releases)
    }
    fs.readFile(argv.grants, handleJSONFile)
  } catch (error) {
    callback(error)
  }
}
