import { Address } from '@celo/connect'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class UpdateDelegatedAmount extends BaseCommand {
  static description =
    'Updates the amount of delegated locked gold. There might be discrepancy between the amount of locked gold and the amount of delegated locked gold because of received rewards.'

  static flags = {
    ...BaseCommand.flags,
    from: flags.string({ ...Flags.address, required: true }),
    to: flags.string({ ...Flags.address, required: true }),
  }

  static args = []

  static examples = [
    'update-delegated-amount --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --to 0xc0ffee254729296a45a3885639AC7E10F9d54979',
  ]

  async run() {
    const res = this.parse(UpdateDelegatedAmount)
    const address: Address = res.flags.from
    const to: Address = res.flags.to

    this.kit.defaultAccount = address

    await newCheckBuilder(this).isAccount(address).isAccount(to).runChecks()

    const lockedGold = await this.kit.contracts.getLockedGold()

    const tx = lockedGold.updateDelegatedAmount(address, to)
    await displaySendTx('updateDelegatedAmount', tx)
  }
}
