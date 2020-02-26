import {
  _setInitialProxyImplementation,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { BigNumber } from 'bignumber.js'
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
        const releaseGoldMultiSigProxyInstance = await ReleaseGoldMultiSigProxy.new()
        const releaseGoldMultiSigInstance = await ReleaseGoldMultiSig.new()
        const multiSigTxHash = await _setInitialProxyImplementation(
          web3,
          releaseGoldMultiSigInstance,
          releaseGoldMultiSigProxyInstance,
          'ReleaseGoldMultiSig',
          [releaseGoldConfig.releaseOwner, releaseGoldConfig.beneficiary],
          2,
          2
        )
        const releaseGoldProxyInstance = await ReleaseGoldProxy.new()
        const releaseGoldInstance = await ReleaseGold.new()
        const gold = new BigNumber(
          web3.utils.toWei(releaseGoldConfig.amountReleasedPerPeriod.toString())
        )
        await goldToken.transfer(
          releaseGoldProxyInstance.address,
          gold.multipliedBy(releaseGoldConfig.numReleasePeriods),
          { from: releaseGoldConfig.releaseOwner }
        )
        const releaseGoldTxHash = await _setInitialProxyImplementation(
          web3,
          releaseGoldInstance,
          releaseGoldProxyInstance,
          'ReleaseGold',
          new Date(releaseGoldConfig.releaseStartTime).getTime() / 1000,
          releaseGoldConfig.releaseCliffTime,
          releaseGoldConfig.numReleasePeriods,
          releaseGoldConfig.releasePeriod,
          web3.utils.toHex(gold),
          releaseGoldConfig.revocable,
          releaseGoldConfig.beneficiary,
          releaseGoldConfig.releaseOwner,
          releaseGoldConfig.refundAddress,
          releaseGoldConfig.subjectToLiquidityProvision,
          releaseGoldConfig.initialDistributionRatio,
          releaseGoldConfig.canValidate,
          releaseGoldConfig.canVote,
          registry.address
        )
        const releaseGoldAtProxy = await ReleaseGold.at(releaseGoldProxyInstance.address)
        await releaseGoldAtProxy.transferOwnership(releaseGoldMultiSigProxyInstance.address)
        await releaseGoldProxyInstance._transferOwnership(releaseGoldMultiSigProxyInstance.address)
        await releaseGoldMultiSigProxyInstance._transferOwnership(
          releaseGoldMultiSigProxyInstance.address
        )

        releases.push({
          Beneficiary: releaseGoldConfig.beneficiary,
          ProxyAddress: releaseGoldProxyInstance.address,
          MultiSigProxyAddress: releaseGoldMultiSigProxyInstance.address,
          MultiSigTxHash: multiSigTxHash,
          ReleaseGoldTxHash: releaseGoldTxHash,
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
