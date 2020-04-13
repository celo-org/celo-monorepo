import { flags } from '@oclif/command'
import prompts from 'prompts'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class SetBeneficiary extends ReleaseGoldCommand {
  static description = 'Set the beneficiary of the ReleaseGold contract'

  static flags = {
    ...ReleaseGoldCommand.flags,
    new_beneficiary: Flags.address({
      required: true,
      description: 'Address of the new beneficiary',
    }),
    yesreally: flags.boolean({
      description: 'Override prompt to set new beneficiary (be careful!)',
    }),
  }

  static args = []

  static examples = [
    'set-beneficiary --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --new_beneficiary 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetBeneficiary)
    const newBeneficiary = flags.new_beneficiary
    if (!flags.yesreally) {
      const response = await prompts({
        type: 'confirm',
        name: 'confirmation',
        message:
          "Are you sure you want to set a new beneficiary? This will forfeit the current beneficiary's controls. (y/n)",
      })

      if (!response.confirmation) {
        console.info('Aborting due to user response')
        process.exit(0)
      }
    }
    // Multisig is the owner of the ReleaseGold contract
    const owner = await this.releaseGoldWrapper.getOwner()
    const releaseGoldMultiSig = await this.kit.contracts.getMultiSig(owner)
    const releaseOwner = await this.releaseGoldWrapper.getReleaseOwner()
    const beneficiary = await this.releaseGoldWrapper.getBeneficiary()
    console.log(releaseOwner, beneficiary)
    const tx = this.releaseGoldWrapper.setBeneficiary(newBeneficiary)
    const multiSigTxReleaseOwner = await releaseGoldMultiSig.submitOrConfirmTransaction(
      this.contractAddress,
      tx.txo
    )
    await displaySendTx<any>('setBeneficiaryOneOfTwo', multiSigTxReleaseOwner, {
      from: releaseOwner,
    })
    const multiSigTxBeneficiary = await releaseGoldMultiSig.submitOrConfirmTransaction(
      this.contractAddress,
      tx.txo
    )
    await displaySendTx<any>('setBeneficiaryTwoOfTwo', multiSigTxBeneficiary, { from: beneficiary })
  }
}
