import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Revoke extends BaseCommand {
  static description = 'Revoke the given contract instance'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
  }

  static args = []

  static examples = ['revoke --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Revoke)
    const contractAddress = flags.contract
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )
    const isRevoked = await releaseGoldWrapper.isRevoked()
    const isRevocable = await releaseGoldWrapper.isRevocable()

    await newCheckBuilder(this)
      .addCheck('Contract is not revoked', () => !isRevoked)
      .addCheck('Contract is revocable', () => isRevocable)
      .runChecks()

    this.kit.defaultAccount = await releaseGoldWrapper.getReleaseOwner()
    await displaySendTx('revokeReleasing', await releaseGoldWrapper.revokeReleasing())
  }
}
