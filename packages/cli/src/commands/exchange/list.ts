import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description = 'List information about tokens on the exchange (all amounts in wei)'

  static flags = {
    ...BaseCommand.flags,
    amount: flags.string({
      description: 'Amount of sellToken (in wei) to report rates for',
      default: '1000000000000000000',
    }),
  }

  static args = []

  static examples = ['list']

  async run() {
    const { flags: parsedFlags } = this.parse(List)

    cli.action.start('Fetching exchange rates...')
    const exchange = await this.kit.contracts.getExchange()
    const dollarForGold = await exchange.getBuyTokenAmount(parsedFlags.amount as string, true)
    const goldForDollar = await exchange.getBuyTokenAmount(parsedFlags.amount as string, false)
    cli.action.stop()

    this.log(`${parsedFlags.amount} cGLD => ${dollarForGold.toString()} cUSD`)
    this.log(`${parsedFlags.amount} cUSD => ${goldForDollar.toString()} cGLD`)
  }
}
