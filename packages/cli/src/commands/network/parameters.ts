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

    // governance wrapper doesn't exist
    // const governance = await this.kit.contracts.getGovernance()

    // reserve wrapper
    const reserve = await this.kit.contracts.getReserve()
    console.log(
      'reserve.tobinTaxStalenessThreshold',
      (await reserve.tobinTaxStalenessThreshold()).toString()
    )

    console.log('stableToken.decimals', (await stableToken.decimals()).toString())
    console.log('stableToken.name', (await stableToken.name()).toString())
    const res = await stableToken.getInflationParameters()
    console.log('stableToken.rate', res[0])
    console.log('stableToken.factor', res[1])
    console.log('stableToken.updatePeriod', res[2])
    console.log('stableToken.factorLastUpdated', res[3])

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
    const res2 = await validators.getRegistrationRequirement()
    console.log('validators.minLockedGoldValue', res2[0])
    console.log('validators.minLockedGoldNoticePeriod', res2[1])
  }
}
