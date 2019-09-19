import { BaseCommand } from '../../base'

export default class Parameters extends BaseCommand {
  static description = 'View network parameters'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    const config = await this.kit.getNetworkConfig()

    const attestations = config.attestations
    console.log(
      'attestations.attestationExpirySeconds',
      attestations.attestationExpirySeconds.toString(10),
      'seconds'
    )
    attestations.attestationRequestFees.forEach((el) => {
      console.log('attestations.attestationExpiryFee', el.address, el.fee.toString())
    })

    const lockedGold = config.lockedGold
    console.log('lockedGold.maxNoticePeriod', lockedGold.maxNoticePeriod.toString(10), 'seconds')

    const sortedOracles = config.sortedOracles
    console.log('sortedOracles.reportExpirySeconds', sortedOracles.reportExpirySeconds.toString())

    const exchange = config.exchange
    console.log('exchange.spread', exchange.spread.toString())
    console.log('exchange.reserveFraction', exchange.reserveFraction.toString())
    console.log('exchange.updateFrequency', exchange.updateFrequency.toString())
    console.log('exchange.minimumReports', exchange.minimumReports.toString())

    const governance = config.governance
    console.log('governance.concurrentProposals', governance.concurrentProposals.toString())
    console.log('governance.dequeueFrequency', governance.dequeueFrequency.toString())
    console.log('governance.minDeposit', governance.minDeposit.toString())
    console.log('governance.queueExpiry', governance.queueExpiry.toString())
    const durations = governance.stageDurations
    console.log('governance.approvalStageDuration', durations.approval.toString())
    console.log('governance.referendumStageDuration', durations.referendum.toString())
    console.log('governance.executionStageDuration', durations.execution.toString())

    const gasPriceMinimum = config.gasPriceMinimum
    console.log('gasPriceMinimum.gasPriceMinimum', gasPriceMinimum.gasPriceMinimum.toString())
    console.log('gasPriceMinimum.targetDensity', gasPriceMinimum.targetDensity.toString())
    console.log('gasPriceMinimum.adjustmentSpeed', gasPriceMinimum.adjustmentSpeed.toString())
    console.log(
      'gasPriceMinimum.infrastructureFraction',
      gasPriceMinimum.infrastructureFraction.toString()
    )

    const reserve = config.reserve
    console.log('reserve.tobinTaxStalenessThreshold', reserve.tobinTaxStalenessThreshold.toString())

    const stableToken = config.stableToken
    console.log('stableToken.decimals', stableToken.decimals.toString())
    console.log('stableToken.name', stableToken.name.toString())
    console.log('stableToken.symbol', stableToken.symbol.toString())
    const inflation = stableToken.inflationParameters
    console.log('stableToken.rate', inflation.rate.toString())
    console.log('stableToken.factor', inflation.factor.toString())
    console.log('stableToken.updatePeriod', inflation.updatePeriod.toString())
    console.log('stableToken.factorLastUpdated', inflation.factorLastUpdated.toString())

    const validators = config.validators
    console.log('validators.minElectableValidators', validators.minElectableValidators.toString())
    console.log('validators.maxElectableValidators', validators.maxElectableValidators.toString())
    console.log('validators.electionThreshold', validators.electionThreshold.toString())
    console.log(
      'validators.minLockedGoldValue',
      validators.registrationRequirement.minLockedGoldValue.toString()
    )
    console.log(
      'validators.minLockedGoldNoticePeriod',
      validators.registrationRequirement.minLockedGoldNoticePeriod.toString()
    )
  }
}
