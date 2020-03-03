import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetAccount extends BaseCommand {
  static description =
    'Set account properties of the ReleaseGold instance account such as name, data encryption key, and the metadata URL'

  static flags = {
    ...BaseCommand.flags,
    contract: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
    property: flags.string({
      char: 'p',
      options: ['name', 'dataEncryptionKey', 'metaURL'],
      description: 'Property type to set',
      required: true,
    }),
    value: flags.string({
      char: 'v',
      description: 'Property value to set',
      required: true,
    }),
  }

  static args = []

  static examples = [
    'set-account --contract 0x5719118266779B58D0f9519383A4A27aA7b829E5 --property name --value mywallet',
    'set-account --contract 0x5719118266779B58D0f9519383A4A27aA7b829E5 --property dataEncryptionKey --value 0x041bb96e35f9f4b71ca8de561fff55a249ddf9d13ab582bdd09a09e75da68ae4cd0ab7038030f41b237498b4d76387ae878dc8d98fd6f6db2c15362d1a3bf11216',
    'set-account --contract 0x5719118266779B58D0f9519383A4A27aA7b829E5 --property metaURL --value www.test.com',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetAccount)
    const contractAddress = flags.contract
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )
    const isRevoked = await releaseGoldWrapper.isRevoked()

    await newCheckBuilder(this)
      .isAccount(releaseGoldWrapper.address)
      .addCheck('Contract is not revoked', () => !isRevoked)
      .runChecks()

    let tx: any
    if (flags.property === 'name') {
      tx = releaseGoldWrapper.setAccountName(flags.value)
    } else if (flags.property === 'dataEncryptionKey') {
      tx = releaseGoldWrapper.setAccountDataEncryptionKey(flags.value as any)
    } else if (flags.property === 'metaURL') {
      tx = releaseGoldWrapper.setAccountMetadataURL(flags.value)
    } else {
      return this.error(`Invalid property provided`)
    }

    this.kit.defaultAccount = await releaseGoldWrapper.getBeneficiary()
    await displaySendTx('setAccount' + flags.property + 'Tx', tx)
  }
}
