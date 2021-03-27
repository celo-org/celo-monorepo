import { CeloContract } from '@celo/contractkit'
import { stableTokenContractArray } from '@celo/contractkit/lib/base'
import { BaseCommand } from '../../base'
import { displaySendTx, failWith } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class RemoveExpiredReports extends BaseCommand {
  static description =
    'Remove expired oracle reports for a specified token (currently just Celo Dollar, aka "StableToken")'

  static args = [
    {
      name: 'token',
      required: true,
      default: CeloContract.StableToken,
      description: 'Token to remove expired reports for',
      options: stableTokenContractArray,
    },
  ]
  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'Address of the account removing oracle reports',
    }),
  }

  static example = [
    'remove-expired-reports StableToken --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1',
    'remove-expired-reports --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1',
    'remove-expired-reports StableTokenEUR --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1',
  ]

  async run() {
    const res = this.parse(RemoveExpiredReports)

    try {
      await this.kit.registry.addressFor(res.args.token)
    } catch {
      failWith(`The ${res.args.token} contract was not deployed yet`)
    }

    const sortedOracles = await this.kit.contracts.getSortedOracles()
    const txo = await sortedOracles.removeExpiredReports(res.args.token)
    await displaySendTx('removeExpiredReports', txo)
  }
}
