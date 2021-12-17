import { PrivateNameAccessor, PublicNameAccessor } from '@celo/identity/lib/offchain/accessors/name'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import { binaryPrompt } from '../../utils/cli'
import { OffchainDataCommand } from '../../utils/off-chain-data'

export default class OffchainWrite extends OffchainDataCommand {
  static description = 'DEV: Writes a name to offchain storage'

  static flags = {
    ...OffchainDataCommand.flags,
    name: flags.string({ required: true }),
    privateKey: flags.string({ required: true }),

    // private accessor parameters
    privateDEK: flags.string({ dependsOn: ['privateKey', 'encryptTo'] }),
    encryptTo: flags.string({ dependsOn: ['privateKey', 'privateDEK'] }),
  }

  static args = []

  static examples = [
    'offchain-write --name test-account --privateKey 0x...',
    'offchain-write --name test-account --privateKey 0x...  privateDEK 0x... --encryptTo 0x...',
  ]

  async run() {
    const {
      flags: { encryptTo, name, privateDEK, privateKey },
    } = this.parse(OffchainWrite)

    if (encryptTo && privateDEK && privateKey) {
      this.kit.defaultAccount = privateKeyToAddress(privateKey)
      this.kit.addAccount(privateDEK)
      const nameSchema = new PrivateNameAccessor(this.offchainDataWrapper)
      await nameSchema.write({ name }, [encryptTo])
    } else {
      if (
        !(await binaryPrompt(
          'This operation will make your name public. Are you sure you want to do that?',
          true
        ))
      ) {
        return
      }
      const nameSchema = new PublicNameAccessor(this.offchainDataWrapper)
      await nameSchema.write({ name })
    }
  }
}
