import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
export default class CreateAccount extends BaseCommand {
  static description = 'Creates a new account for the ReleaseGold instance'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
  }

  static args = []

  static examples = ['create-account --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(CreateAccount)
    const contractAddress = flags.contract
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )

    const isRevoked = await releaseGoldWrapper.isRevoked()
    await newCheckBuilder(this)
      .isNotAccount(releaseGoldWrapper.address)
      .addCheck('Contract is not revoked', () => !isRevoked)
      .runChecks()

    this.kit.defaultAccount = await releaseGoldWrapper.getBeneficiary()
    await displaySendTx('createAccount', releaseGoldWrapper.createAccount())
  }
}
