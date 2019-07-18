import { IArg } from '@oclif/parser/lib/args'
import { ValidatorsAdapter } from '../../adapters/validators'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class ValidatorShow extends BaseCommand {
  static description = 'Show information about an existing Validator'

  static flags = {
    ...BaseCommand.flags,
  }

  static args: IArg[] = [Args.address('validatorAddress', { description: "Validator's address" })]

  static examples = ['show 0x97f7333c51897469E8D98E7af8653aAb468050a3']

  async run() {
    const { args } = this.parse(ValidatorShow)
    const address = args.validatorAddress
    const validator = await new ValidatorsAdapter(this.web3).getValidator(address)
    printValueMap(validator)
  }
}
