import { NameAccessor } from '@celo/contractkit/lib/identity/offchain/schemas'
import { flags } from '@oclif/command'
import { OffchainDataCommand } from '../../utils/off-chain-data'

export default class OffchainWrite extends OffchainDataCommand {
  static description = 'DEV: Writes a name to offchain storage'

  static flags = {
    ...OffchainDataCommand.flags,
    name: flags.string({ required: true }),
  }

  static args = []

  static examples = [
    'offchain-write --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'offchain-write --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account',
  ]

  async run() {
    const res = this.parse(OffchainWrite)
    this.kit.defaultAccount = res.flags.from
    const nameSchema = new NameAccessor(this.offchainDataWrapper)
    await nameSchema.write({ name: res.flags.name })
  }
}
