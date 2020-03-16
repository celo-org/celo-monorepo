import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class Transfer extends ReleaseGoldCommand {
  static description = 'Transfer stable tokens from the given contract address'

  static flags = {
    ...ReleaseGoldCommand.flags,
    to: Flags.address({
      required: true,
      description: 'Address of the recipient of stable token transfer',
    }),
    value: Flags.wei({ required: true, description: 'Value (in Wei) of stable token to transfer' }),
  }

  static args = []

  static examples = [
    'transfer --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --to 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb --value 10000000000000000000000',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Transfer)
    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    this.kit.defaultAccount = isRevoked
      ? await this.releaseGoldWrapper.getBeneficiary()
      : await this.releaseGoldWrapper.getReleaseOwner()

    await displaySendTx(
      'revokeReleasing',
      await this.releaseGoldWrapper.transfer(flags.to, flags.value)
    )
  }
}
