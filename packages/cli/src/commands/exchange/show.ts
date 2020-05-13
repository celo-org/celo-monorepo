import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class ExchangeShow extends BaseCommand {
  static description = 'Show the current exchange rates offered by the Exchange'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    amount: flags.string({
      description: 'Amount of the token being exchanged to report rates for',
      default: '1000000000000000000',
    }),
  }

  static args = []

  static examples = ['list']

  async run() {
    const { flags: parsedFlags } = this.parse(ExchangeShow)

    cli.action.start('Fetching exchange rates...')
    const exchange = await this.kit.contracts.getExchange()
    const dollarForGold = await exchange.getBuyTokenAmount(parsedFlags.amount as string, true)
    const goldForDollar = await exchange.getBuyTokenAmount(parsedFlags.amount as string, false)
    cli.action.stop()

    this.log(`${parsedFlags.amount} cGLD => ${dollarForGold.toFixed()} cUSD`)
    this.log(`${parsedFlags.amount} cUSD => ${goldForDollar.toFixed()} cGLD`)
  }
}
