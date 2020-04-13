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
  }

  static args = []

  static examples = [
    'set-beneficiary --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --new-beneficiary 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetBeneficiary)
    const newBeneficiary = flags.new_beneficiary
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
    const owner = await this.releaseGoldWrapper.getOwner()
    const releaseGoldMultiSig = await this.kit.contracts.getMultiSig(owner)
    const tx = this.releaseGoldWrapper.setBeneficiary(newBeneficiary)
    const multiSigTx = await releaseGoldMultiSig.submitOrConfirmTransaction(
      this.contractAddress,
      tx.txo
    )
    const accounts = await this.web3.eth.getAccounts()
    this.kit.defaultAccount = accounts[0]
    await displaySendTx<any>('setBeneficiary', multiSigTx, {}, 'BeneficiarySet')
  }
}
