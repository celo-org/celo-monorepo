import {
  _setInitialProxyImplementation,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import BigNumber from 'bignumber.js'
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
        const releaseGoldMultiSigProxy = await ReleaseGoldMultiSigProxy.new()
        const releaseGoldMultiSigInstance = await ReleaseGoldMultiSig.new()
        const multiSigTxHash = await _setInitialProxyImplementation(
          web3,
          releaseGoldMultiSigInstance,
          releaseGoldMultiSigProxy,
          'ReleaseGoldMultiSig',
          [releaseGoldConfig.releaseOwner, releaseGoldConfig.beneficiary],
          2,
          2
        )
        await releaseGoldMultiSigProxy._transferOwnership(releaseGoldMultiSigProxy.address)
        const releaseGoldProxy = await ReleaseGoldProxy.new()
        const releaseGoldInstance = await ReleaseGold.new()
        const weiAmountReleasedPerPeriod = new BigNumber(
          web3.utils.toWei(releaseGoldConfig.amountReleasedPerPeriod.toString())
        )
        await goldToken.transfer(
          releaseGoldProxy.address,
          weiAmountReleasedPerPeriod.multipliedBy(releaseGoldConfig.numReleasePeriods)
        )
        const releaseGoldTxHash = await _setInitialProxyImplementation(
          web3,
          releaseGoldInstance,
          releaseGoldProxy,
          'ReleaseGold',
          new Date(releaseGoldConfig.releaseStartTime).getTime() / 1000,
          releaseGoldConfig.releaseCliffTime,
          releaseGoldConfig.numReleasePeriods,
          releaseGoldConfig.releasePeriod,
          web3.utils.toHex(weiAmountReleasedPerPeriod),
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
        const proxiedReleaseGold = await ReleaseGold.at(releaseGoldProxy.address)
        await proxiedReleaseGold.transferOwnership(releaseGoldMultiSigProxy.address)
        await releaseGoldProxy._transferOwnership(releaseGoldMultiSigProxy.address)

        releases.push({
          Beneficiary: releaseGoldConfig.beneficiary,
          ProxyAddress: releaseGoldProxy.address,
          MultiSigProxyAddress: releaseGoldMultiSigProxy.address,
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
