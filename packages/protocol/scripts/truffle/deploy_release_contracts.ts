import {
  getDeployedProxiedContract,
  _setInitialProxyImplementation,
} from '@celo/protocol/lib/web3-utils'
import {
  GoldTokenInstance,
  RegistryInstance,
  ReleaseGoldContract,
  ReleaseGoldMultiSigContract,
  ReleaseGoldMultiSigProxyContract,
  ReleaseGoldProxyContract,
} from 'types'
import fs = require('fs')

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
          web3.utils.toWei(releaseGoldConfig.amountReleasedPerPeriod),
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
        const releaseGoldMultiSigProxyInstance = await ReleaseGoldMultiSigProxy.new()
        const releaseGoldMultiSigInstance = await ReleaseGoldMultiSig.new()
        await _setInitialProxyImplementation(
          web3,
          releaseGoldMultiSigInstance,
          releaseGoldMultiSigProxyInstance,
          'ReleaseGoldMultiSig',
          releaseGoldMultiSigInitializeArgs
        )
        const releaseGoldProxyInstance = await ReleaseGoldProxy.new()
        const releaseGoldInstance = await ReleaseGold.new()
        await goldToken.transfer(
          releaseGoldProxyInstance.address,
          releaseGoldConfig.amountReleasedPerPeriod * releaseGoldConfig.numReleasePeriods,
          { from: releaseGoldConfig.releaseOwner }
        )
        await _setInitialProxyImplementation(
          web3,
          releaseGoldInstance,
          releaseGoldProxyInstance,
          'ReleaseGold',
          releaseGoldInitializeArgs
        )
        await ReleaseGold.at(releaseGoldProxyInstance.address).transferOwnership(
          releaseGoldMultiSigProxyInstance.address
        )
        await releaseGoldProxyInstance._transferOwnership(releaseGoldMultiSigProxyInstance.address)
        await releaseGoldMultiSigProxyInstance._transferOwnership(
          releaseGoldMultiSigProxyInstance.address
        )

        releases.push({
          Beneficiary: releaseGoldConfig.beneficiary,
          ProxyAddress: releaseGoldProxyInstance.address,
          MultiSigProxyAddress: releaseGoldMultiSigProxyInstance.address,
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
