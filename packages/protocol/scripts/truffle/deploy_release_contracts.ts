import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import {
  MultiSigContract,
  RegistryInstance,
  ReleaseGoldContract,
  ReleaseGoldProxyContract,
} from 'types'
import fs = require('fs')

module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['network', 'grants'],
    })
    const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
    const Multisig: MultiSigContract = artifacts.require('MultiSig')
    const ReleaseGold: ReleaseGoldContract = artifacts.require('ReleaseGold')
    const ReleaseGoldProxy: ReleaseGoldProxyContract = artifacts.require('ReleaseGoldProxy')
    const releases = []
    const handleJSONFile = async (err, data) => {
      if (err) {
        throw err
      }
      data = JSON.parse(data)
      const entity = data['entity']
      const releaseGoldConfigs = data['grants']
      for (const releaseGoldConfig of releaseGoldConfigs) {
        const releaseStartTime = new Date(releaseGoldConfig['releaseStartTime'])
        const releaseCliffTime = releaseGoldConfig['releaseCliffTime']
        const numReleasePeriods = releaseGoldConfig['numReleasePeriods']
        const releasePeriod = releaseGoldConfig['releasePeriod']
        const amountReleasedPerPeriod = releaseGoldConfig['amountReleasedPerPeriod']
        const revocable = releaseGoldConfig['revocable']
        const beneficiary = releaseGoldConfig['beneficiary']
        const releaseOwner = releaseGoldConfig['releaseOwner']
        const refundAddress = releaseGoldConfig['refundAddress']
        const subjectToLiquidityProvision = releaseGoldConfig['subjectToLiquidityProvision']
        const initialDistributionPercentage = releaseGoldConfig['initialDistributionPercentage']
        const canValidate = releaseGoldConfig['canValidate']
        const canVote = releaseGoldConfig['canVote']
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
        await releaseGoldProxyInstance._setImplementation(releaseGoldInstance.address)
        const multiSigInstance = await Multisig.new()
        await multiSigInstance.initialize([entity, beneficiary], 2)
        await releaseGoldProxyInstance._transferOwnership(multiSigInstance.address)
        releases.push([
          releaseGoldConfig.beneficiary,
          releaseGoldProxyInstance.address,
          multiSigInstance.address,
        ])
      }
      console.log(releases)
    }
    fs.readFile(argv.grants, handleJSONFile)
  } catch (error) {
    callback(error)
  }
}
