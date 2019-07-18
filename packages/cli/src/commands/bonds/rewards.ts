import { flags } from '@oclif/command'
import { BondedDepositAdapter } from '../../adapters/bonded-deposit'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Rewards extends BaseCommand {
  static description = 'Manage rewards for bonded deposit account'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    redeem: flags.boolean({
      char: 'r',
      description: 'Redeem accrued rewards from bonded deposits',
      exclusive: ['delegate'],
    }),
    delegate: Flags.address({
      char: 'd',
      description: 'Delegate rewards to provided account',
      exclusive: ['redeem'],
    }),
  }

  static args = []

  static examples = [
    'rewards --redeem',
    'rewards --delegate=0x56e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]

  async run() {
    const res = this.parse(Rewards)

    if (!res.flags.redeem && !res.flags.delegate) {
      this.error(`Specify action with --redeem or --delegate`)
      return
    }

    const adapter = await new BondedDepositAdapter(this.web3, res.flags.from)
    if (res.flags.redeem) {
      const contract = await adapter.contract()
      const tx = contract.methods.redeemRewards()
      await displaySendTx('redeemRewards', tx)
    }

    if (res.flags.delegate) {
      const tx = await adapter.delegateRewardsTx(res.flags.from, res.flags.delegate)
      await displaySendTx('delegateRewards', tx)
    }
  }
}
