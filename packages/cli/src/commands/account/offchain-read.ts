import OffchainDataWrapper from '@celo/contractkit/lib/identity/offchain-data-wrapper'
import { NameAccessor } from '@celo/contractkit/lib/identity/offchain/schemas'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'

export default class OffchainRead extends BaseCommand {
  static description = 'DEV: Reads the name from offchain storage'

  static flags = {
    ...BaseCommand.flags,
    name: flags.string(),
    from: Flags.address({ required: true }),
    root: flags.string(),
  }

  static args = []

  static examples = ['offchain-read --from 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(OffchainRead)
    this.kit.defaultAccount = res.flags.from
    const provider = new OffchainDataWrapper(res.flags.from, this.kit)
    const nameApplication = new NameAccessor(provider)
    const data = await nameApplication.read(res.flags.from)
    console.log(data)
  }
}
