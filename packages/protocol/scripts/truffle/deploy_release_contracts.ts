import BigNumber from 'bignumber.js'
import { getDeployedProxiedContract } from 'lib/web3-utils'
import { RegistryInstance, ReleaseGoldContract } from 'types'
import fs = require('fs')

interface ReleaseGoldConfig {
  releaseStartTime: number
  releaseCliffTime: number
  numReleasePeriods: number
  releasePeriod: number
  amountReleasedPerPeriod: BigNumber
  revocable: boolean
  beneficiary: string
  releaseOwner: string
  refundAddress: string
  subjectToLiquidityProvision: boolean
  initialDistributionPercentage: number
  canValidate: boolean
  canVote: boolean
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
    const ReleaseGold: ReleaseGoldContract = artifacts.require('ReleaseGold')
    const releases = []
    const handleJSONFile = async (err, data) => {
      if (err) {
        throw err
      }
      const releaseGoldConfigs: ReleaseGoldConfig[] = JSON.parse(data)
      for (const releaseGoldConfig of releaseGoldConfigs) {
        const args = []
        for (const key of Object.keys(releaseGoldConfig)) {
          args.push(releaseGoldConfig[key])
        }
        args.push(registry.address)
        const releaseGoldInstance = await ReleaseGold.new.apply(args)
        releases.push([releaseGoldConfig.beneficiary, releaseGoldInstance.address])
      }
    }
    fs.readFile('scripts/truffle/releaseGoldContracts.json', handleJSONFile)
  } catch (error) {
    callback(error)
  }
}
