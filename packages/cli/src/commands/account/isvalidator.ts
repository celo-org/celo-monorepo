import { eqAddress } from '@celo/utils/lib/address'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'

export default class IsValidator extends BaseCommand {
  static description =
    'Check whether a given address is elected to be validating in the current epoch'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('address')]

  static examples = ['isvalidator 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const { args } = this.parse(IsValidator)

    const validators = await this.kit.contracts.getValidators()
    const numberValidators = await validators.numberValidatorsInCurrentSet()

    for (let i = 0; i < numberValidators; i++) {
      const validatorAddress = await validators.validatorAddressFromCurrentSet(i)
      if (eqAddress(validatorAddress, args.address)) {
        console.log(`${args.address} is in the current validator set`)
        return
      }
    }

    console.log(`${args.address} is not currently in the validator set`)
  }
}
