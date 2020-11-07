import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class ResetSlashingMultiplier extends BaseCommand {
  static description = 'Reset validator group slashing multiplier.'

  static flags = {
    ...BaseCommand.flags,
  }

  static args: IArg[] = [Args.address('groupAddress', { description: "ValidatorGroup's address" })]

  static examples = ['reset-slashing-multiplier 0x97f7333c51897469E8D98E7af8653aAb468050a3']

  async run() {
    const { args } = this.parse(ResetSlashingMultiplier)
    const address = args.groupAddress

    const validators = await this.kit.contracts.getValidators()
    this.kit.defaultAccount = address

    await newCheckBuilder(this, address)
      .isSignerOrAccount()
      .canSignValidatorTxs()
      .signerAccountIsValidatorGroup()
      .resetSlashingmultiplierPeriodPassed()
      .runChecks()

    await displaySendTx('reset-slashing-multiplier', validators.resetSlashingMultiplier())
  }
}
