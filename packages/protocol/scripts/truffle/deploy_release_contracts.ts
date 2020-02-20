import BigNumber from 'bignumber.js'
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
    // const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
    const handleJSONFile = async (err, data) => {
      if (err) {
        throw err
      }
      const releaseGoldConfigs: ReleaseGoldConfig[] = JSON.parse(data)
      for (const releaseGoldConfig of releaseGoldConfigs) {
        let args = []
        for (const key of Object.keys(releaseGoldConfig)) {
          args.push(releaseGoldConfig[key])
        }
        args.push('0x0')
        // await ReleaseGoldContract.new.apply(args)
        console.log(releaseGoldConfig)
        // console.log(registry.address)
      }
    }
    fs.readFile('scripts/truffle/releaseGoldContracts.json', handleJSONFile)
  } catch (error) {
    callback(error)
  }
}
