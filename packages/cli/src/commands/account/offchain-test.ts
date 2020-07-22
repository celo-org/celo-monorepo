import { NameAccessor } from '@celo/contractkit/src/identity/offchain/schemas'
import { flags } from '@oclif/command'
import { OffchainDataCommand } from '../../utils/off-chain-data'

export default class Register extends OffchainDataCommand {
  static description =
    'Register an account on-chain. This allows you to lock Gold, which is a pre-requisite for registering a Validator or Group, participating in Validator elections and on-chain Governance, and earning epoch rewards.'

  static flags = {
    ...OffchainDataCommand.flags,
    message: flags.string({ required: true }),
  }

  static args = []

  static examples = [
    'register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account',
  ]

  async run() {
    const res = this.parse(Register)
    this.kit.defaultAccount = res.flags.from
    const nameSchema = new NameAccessor(this.offchainDataWrapper)
    await nameSchema.write({ name: res.flags.message })
  }
}
