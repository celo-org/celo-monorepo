import { BaseCommand } from '../../base'
// import { Args } from '../../utils/command'

export default class Parameters extends BaseCommand {
  static description = 'View network parameters'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    const goldToken = await this.kit.contracts.getGoldToken()
    const stableToken = await this.kit.contracts.getStableToken()
    const attestations = await this.kit.contracts.getAttestations()
    console.log(
      'attestations.attestationExpirySeconds',
      (await attestations.attestationExpirySeconds()).toString(10),
      'seconds'
    )
    console.log(
      'attestations.attestationExpiryFee (gold)',
      (await attestations.attestationRequestFees(goldToken.address)).toString(10),
      ''
    )
    console.log(
      'attestations.attestationExpiryFee (stable)',
      (await attestations.attestationRequestFees(stableToken.address)).toString(10),
      ''
    )

    const lockedGold = await this.kit.contracts.getLockedGold()
    console.log(
      'lockedGold.maxNoticePeriod',
      (await lockedGold.maxNoticePeriod()).toString(10),
      'seconds'
    )

    const sortedOracles = await this.kit.contracts.getSortedOracles()
    console.log(
      'sortedOracles.reportExpirySeconds',
      (await sortedOracles.reportExpirySeconds()).toString()
    )

    const exchange = await this.kit.contracts.getExchange()
    console.log('exchange.spread', (await exchange.spread()).toString())
    console.log('exchange.reserveFraction', (await exchange.reserveFraction()).toString())
    console.log('exchange.updateFrequency', (await exchange.updateFrequency()).toString())
    console.log('exchange.minimumReports', (await exchange.minimumReports()).toString())

    const governance = await this.kit.contracts.getGovernance()
    console.log(
      'governance.concurrentProposals',
      (await governance.concurrentProposals()).toString()
    )
    console.log('governance.dequeueFrequency', (await governance.dequeueFrequency()).toString())
    console.log('governance.minDeposit', (await governance.minDeposit()).toString())
    console.log('governance.queueExpiry', (await governance.queueExpiry()).toString())
    const durations = await governance.stageDurations()
    console.log('governance.approvalStageDuration', durations[0])
    console.log('governance.referendumStageDuration', durations[1])
    console.log('governance.executionStageDuration', durations[2])

    // min gas wrapper?

    const reserve = await this.kit.contracts.getReserve()
    console.log(
      'reserve.tobinTaxStalenessThreshold',
      (await reserve.tobinTaxStalenessThreshold()).toString()
    )

    console.log('stableToken.decimals', (await stableToken.decimals()).toString())
    console.log('stableToken.name', (await stableToken.name()).toString())
    console.log('stableToken.symbol', (await stableToken.symbol()).toString())
    const inflation = await stableToken.getInflationParameters()
    console.log('stableToken.rate', inflation[0])
    console.log('stableToken.factor', inflation[1])
    console.log('stableToken.updatePeriod', inflation[2])
    console.log('stableToken.factorLastUpdated', inflation[3])

    const validators = await this.kit.contracts.getValidators()
    console.log(
      'validators.minElectableValidators',
      (await validators.minElectableValidators()).toString()
    )
    console.log(
      'validators.maxElectableValidators',
      (await validators.maxElectableValidators()).toString()
    )
    console.log('validators.electionThreshold', (await validators.electionThreshold()).toString())
    const req = await validators.getRegistrationRequirement()
    console.log('validators.minLockedGoldValue', req[0])
    console.log('validators.minLockedGoldNoticePeriod', req[1])
  }
}
