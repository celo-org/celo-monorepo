import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold'
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetAccount extends BaseCommand {
  static description =
    'Set account properties of the ReleaseGold instance account such as name, wallet address, data encryption key, and the metadata url'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the ReleaseGold Contract' }),
    property: flags.string({
      char: 'p',
      options: ['name', 'dataencyptionkey', 'walletaddress', 'metaurl'],
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

  // TODO(lucas): examples for each function, and test walletaddress
  static examples = [
    'set-account --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --property name --value mywallet',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(SetAccount)
    const contractAddress = flags.from
    const releaseGoldWrapper = new ReleaseGoldWrapper(
      this.kit,
      newReleaseGold(this.kit.web3, contractAddress)
    )
    const isRevoked = await releaseGoldWrapper.isRevoked()

    await newCheckBuilder(this)
      .isAccount(releaseGoldWrapper.address)
      .isNotRevoked(releaseGoldWrapper)
      .runChecks()

    let tx: any
    if (flags.property === 'name') {
      tx = await releaseGoldWrapper.setAccountName(flags.value)
    } else if (flags.property === 'walletaddress') {
      tx = await releaseGoldWrapper.setAccountWalletAddress(...flags.value)
    } else if (flags.property === 'dataencyptionkey') {
      tx = await releaseGoldWrapper.setAccountDataEncryptionKey(flags.value as any)
    } else if (flags.property === 'metaurl') {
      tx = await releaseGoldWrapper.setAccountMetadataURL(flags.value)
    } else {
      return this.error(`Invalid property provided`)
    }

    this.kit.defaultAccount = await releaseGoldWrapper.getBeneficiary()

    await displaySendTx('setAccountTx', tx, { from: this.kit.defaultAccount })
  }
}
