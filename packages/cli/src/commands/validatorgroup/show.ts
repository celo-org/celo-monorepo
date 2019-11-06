import { flags } from '@oclif/command'
import { IArg } from '@oclif/parser/lib/args'
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
    const res = this.parse(ValidatorGroupShow)
    const validators = await this.kit.contracts.getValidators()
    const validatorGroup: Array<
      ValidatorGroup & { affiliates?: Address[] }
    > = await validators.getValidatorGroup(res.args.groupAddress)
    const registered = await validators.getRegisteredValidators()
    const affiliated = registered.filter((v) => v.affiliation == args.groupAddress)
    validatorGroup.affiliates = affiliated.map((v) => v.address)
    printValueMap(validatorGroup)
  }
}
