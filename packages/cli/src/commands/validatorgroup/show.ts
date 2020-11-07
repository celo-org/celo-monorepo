import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class ValidatorGroupShow extends BaseCommand {
  static description = 'Show information about an existing Validator Group'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  static args: IArg[] = [Args.address('groupAddress', { description: "ValidatorGroup's address" })]

  static examples = ['show 0x97f7333c51897469E8D98E7af8653aAb468050a3']

  async run() {
    const res = this.parse(ValidatorGroupShow)
    const validators = await this.kit.contracts.getValidators()

    await newCheckBuilder(this)
      .isValidatorGroup(res.args.groupAddress)
      .runChecks()

    const validatorGroup = await validators.getValidatorGroup(res.args.groupAddress)
    printValueMap(validatorGroup)
  }
}
