import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { Exchange } from '../../generated/contracts'

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

    const exchange = await Exchange(this.web3)
    const dollarForGold = await exchange.methods
      .getBuyTokenAmount(parsedFlags.amount as string, true)
      .call()
    const goldForDollar = await exchange.methods
      .getBuyTokenAmount(parsedFlags.amount as string, false)
      .call()

    cli.action.stop()

    this.log(`${parsedFlags.amount} cGLD => ${dollarForGold} cUSD`)
    this.log(`${parsedFlags.amount} cUSD => ${goldForDollar} cGLD`)
  }
}
