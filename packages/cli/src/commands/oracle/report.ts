import { CeloContract, CeloToken } from '@celo/contractkit'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx, failWith } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ReportPrice extends BaseCommand {
  static description =
    'Report the price of Celo Gold in a specified token (currently just Celo Dollar, aka: "StableToken")'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the oracle account' }),
    token: flags.string({
      required: true,
      description: 'The token to report on',
    }),
    price: flags.string({
      required: true,
      description: 'The amount of the specified token equal to 1 cGLD',
    }),
  }

  static example = [
    'report --token StableToken --price 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1',
  ]

  async run() {
    const res = this.parse(ReportPrice)
    let token: CeloToken
    if (res.flags.token === CeloContract.StableToken) {
      token = CeloContract.StableToken
    } else {
      return failWith(`${res.flags.token} is not a valid token to report on`)
    }

    const sortedOracles = await this.kit.contracts.getSortedOracles()
    const price = new BigNumber(res.flags.price)
    const denominator = new BigNumber(10).pow(price.decimalPlaces()).toNumber()
    const numerator = price.multipliedBy(denominator).toNumber()

    await displaySendTx(
      'sortedOracles.report',
      await sortedOracles.report(token, numerator, denominator, res.flags.from)
    )
    this.log(`Reported oracle value of ${price} ${token} for 1 CeloGold`)
  }
}
