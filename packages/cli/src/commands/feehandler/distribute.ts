import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Distribute extends BaseCommand {
  static description = 'Distributes the the token to the beneficiary'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Initiator's address" }),
    to: Flags.address({ required: true, description: 'The address to receive the token' }),
  }

  static examples = [
    'distribute --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --to 0x5409ed021d9299bf6814279a6a1411a7e866a631',
  ]

  async run() {
    const res = this.parse(Distribute)
    const from: string = res.flags.from
    this.kit.defaultAccount = from
    const to: string = res.flags.to
    const feeHandler = await this.kit.contracts.getFeeHandler()
    await displaySendTx('distribute', await feeHandler.distribute(to), {}, 'TokensDistributed')
  }
}
