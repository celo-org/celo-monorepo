import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Transfer extends BaseCommand {
  static description = 'Transfer stable tokens from the given contract address'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
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
    const contractAddress = flags.contract
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )
    const isRevoked = await releaseGoldWrapper.isRevoked()
    this.kit.defaultAccount = isRevoked
      ? await releaseGoldWrapper.getBeneficiary()
      : await releaseGoldWrapper.getReleaseOwner()

    await displaySendTx('revokeReleasing', await releaseGoldWrapper.transfer(flags.to, flags.value))
  }
}
