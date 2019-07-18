import { BaseCommand } from '../../base'
import { BondedDeposits } from '../../generated/contracts'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Register extends BaseCommand {
  static description = 'Register an account for bonded deposit eligibility'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
  }

  static args = []

  static examples = ['register']

  async run() {
    const res = this.parse(Register)
    const bondedDeposits = await BondedDeposits(this.web3, res.flags.from)
    const tx = bondedDeposits.methods.createAccount()
    await displaySendTx('register', tx)
  }
}
