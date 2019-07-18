import { IArg } from '@oclif/parser/lib/args'
import { ValidatorsAdapter } from '../../adapters/validators'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class ValidatorGroupShow extends BaseCommand {
  static description = 'Show information about an existing Validator Group'

  static flags = {
    ...BaseCommand.flags,
  }

  static args: IArg[] = [Args.address('groupAddress', { description: "ValidatorGroup's address" })]

  static examples = ['show 0x97f7333c51897469E8D98E7af8653aAb468050a3']

  async run() {
    const { args } = this.parse(ValidatorGroupShow)
    const validatorGroup = await new ValidatorsAdapter(this.web3).getValidatorGroup(
      args.groupAddress
    )
    printValueMap(validatorGroup)
  }
}
