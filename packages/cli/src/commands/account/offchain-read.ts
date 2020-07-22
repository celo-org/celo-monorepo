import OffchainDataWrapper, {
  NameSchema,
} from '@celo/contractkit/src/identity/offchain-data-wrapper'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'

export default class Register extends BaseCommand {
  static description =
    'Register an account on-chain. This allows you to lock Gold, which is a pre-requisite for registering a Validator or Group, participating in Validator elections and on-chain Governance, and earning epoch rewards.'

  static flags = {
    ...BaseCommand.flags,
    name: flags.string(),
    from: Flags.address({ required: true }),
    root: flags.string(),
  }

  static args = []

  static examples = [
    'register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account',
  ]

  async run() {
    const res = this.parse(Register)
    this.kit.defaultAccount = res.flags.from
    const provider = new OffchainDataWrapper(res.flags.from, this.kit)
    const nameSchema = new NameSchema(provider)
    const data = await nameSchema.readName(res.flags.from)
    console.log(data)
  }
}
