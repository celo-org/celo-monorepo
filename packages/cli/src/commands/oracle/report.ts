import { CeloContract } from '@celo/contractkit'
import { stableTokenContractArray } from '@celo/contractkit/lib/base'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx, failWith } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ReportPrice extends BaseCommand {
  static description =
    'Report the price of CELO in a specified token (currently just Celo Dollar, aka "StableToken")'

  static args = [
    {
      name: 'token',
      required: true,
      default: CeloContract.StableToken,
      description: 'Token to report on',
      options: stableTokenContractArray,
    },
  ]
  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the oracle account' }),
    value: flags.string({
      required: true,
      description: 'Amount of the specified token equal to 1 CELO',
    }),
  }

  static example = [
    'report StableToken --value 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1',
    'report --value 0.99 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1',
    'report StableTokenEUR --value 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1',
  ]

  async run() {
    const res = this.parse(ReportPrice)
    const sortedOracles = await this.kit.contracts.getSortedOracles()
    const value = new BigNumber(res.flags.value)

    try {
      await this.kit.registry.addressFor(res.args.token)
    } catch {
      failWith(`The ${res.args.token} contract was not deployed yet`)
    }

    await displaySendTx(
      'sortedOracles.report',
      await sortedOracles.report(res.args.token, value, res.flags.from)
    )
    this.log(`Reported oracle value: ${value.toString()} ${res.args.token} == 1 CELO`)
  }
}
