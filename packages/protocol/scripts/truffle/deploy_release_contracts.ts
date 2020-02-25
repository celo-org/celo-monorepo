import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
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
        const releaseStartTime = new Date(releaseGoldConfig.releaseStartTime)
        const releaseCliffTime = releaseGoldConfig.releaseCliffTime
        const numReleasePeriods = releaseGoldConfig.numReleasePeriods
        const releasePeriod = releaseGoldConfig.releasePeriod
        const amountReleasedPerPeriod = releaseGoldConfig.amountReleasedPerPeriod
        const revocable = releaseGoldConfig.revocable
        const beneficiary = releaseGoldConfig.beneficiary
        const releaseOwner = releaseGoldConfig.releaseOwner
        const refundAddress = releaseGoldConfig.refundAddress
        const subjectToLiquidityProvision = releaseGoldConfig.subjectToLiquidityProvision
        const initialDistributionPercentage = releaseGoldConfig.initialDistributionPercentage
        const canValidate = releaseGoldConfig.canValidate
        const canVote = releaseGoldConfig.canVote
        const releaseGoldInstance = await ReleaseGold.new(
          releaseStartTime.getTime() / 1000,
          releaseCliffTime,
          numReleasePeriods,
          releasePeriod,
          amountReleasedPerPeriod,
          revocable,
          beneficiary,
          releaseOwner,
          refundAddress,
          subjectToLiquidityProvision,
          initialDistributionPercentage,
          canValidate,
          canVote,
          registry.address
        )
        const releaseGoldProxyInstance = await ReleaseGoldProxy.new()
        const releaseGoldMultiSigProxyInstance = await ReleaseGoldMultiSigProxy.new()
        await goldToken.transfer(
          releaseGoldProxyInstance.address,
          amountReleasedPerPeriod * numReleasePeriods,
          { from: releaseOwner }
        )
        // const initializeAbi = (releaseGoldProxyInstance as any).abi.find(
        //   (abi: any) => abi.type === 'function' && abi.name === 'initialize'
        // )
        // const callData = web3.eth.abi.encodeFunctionCall(initializeAbi, [])
        // await releaseGoldProxyInstance._setAndInitializeImplementation(releaseGoldInstance.address, callData)
        await releaseGoldProxyInstance._setImplementation(releaseGoldInstance.address)
        const releaseGoldMultiSigInstance = await ReleaseGoldMultiSig.new()
        await releaseGoldMultiSigInstance.initialize([releaseOwner, beneficiary], 2)
        await releaseGoldProxyInstance._transferOwnership(releaseGoldMultiSigInstance.address)
        await releaseGoldMultiSigProxyInstance._setImplementation(
          releaseGoldMultiSigInstance.address
        )
        releases.push([
          releaseGoldConfig.beneficiary,
          releaseGoldProxyInstance.address,
          releaseGoldMultiSigProxyInstance.address,
        ])
      }
      // tslint:disable-next-line: no-console
      console.log(releases)
    }
    fs.readFile(argv.grants, handleJSONFile)
  } catch (error) {
    callback(error)
  }
}
