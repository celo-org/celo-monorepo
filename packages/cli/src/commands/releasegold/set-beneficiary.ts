import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetBeneficiary extends BaseCommand {
  static description = 'Set the beneficiary of the ReleaseGold contract'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
    owner: Flags.address({
      required: true,
      description: 'Owner of `contract` capable of setting the new beneficiary (multisig)',
    }),
    beneficiary: Flags.address({ required: true, description: 'Address of the new beneficiary' }),
  }

  static args = []

  static examples = [
    'set-beneficiary --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --owner 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb --beneficiary 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetBeneficiary)
    const contractAddress = flags.contract
    const owner = flags.owner
    const newBeneficiary = flags.beneficiary
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )

    await newCheckBuilder(this)
      .addCheck(
        'Owner argument is contract owner',
        async () => owner === (await releaseGoldWrapper.getOwner())
      )
      .runChecks()

    this.kit.defaultAccount = owner
    const tx = releaseGoldWrapper.setBeneficiary(newBeneficiary)
    await displaySendTx('setBeneficiary', tx)
  }
}
