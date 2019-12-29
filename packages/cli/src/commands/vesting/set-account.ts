import { NULL_ADDRESS } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetAccount extends BaseCommand {
  static description =
    'Set account properties to the vesting instance account such as name, wallet address, data encryption key and metadata url'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
    property: flags.string({
      char: 'p',
      options: ['name', 'walletaddress', 'dataencyptionkey', 'metaurl'],
      description: 'Property type to set',
      required: true,
    }),
    value: flags.string({
      description: 'Property value to set',
      required: true,
    }),
  }

  static args = []

  static examples = [
    'set-account --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --property name --value mywallet',
  ]

  async run() {
    const res = this.parse(SetAccount)
    this.kit.defaultAccount = res.flags.from
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(res.flags.from)

    await newCheckBuilder(this)
      .isAccount(vestingInstance.address)
      .addCheck(
        `No vested instance found under the given beneficiary ${res.flags.from}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vested instance has a different beneficiary`,
        async () => (await vestingInstance.getBeneficiary()) === res.flags.from
      )
      .runChecks()

    let tx: any
    if (res.flags.property === 'name') {
      tx = await vestingInstance.setAccountName(res.flags.value)
    } else if (res.flags.property === 'walletaddress') {
      tx = await vestingInstance.setAccountWalletAddress(res.flags.value)
    } else if (res.flags.property === 'dataencyptionkey') {
      tx = await vestingInstance.setAccountDataEncryptionKey(res.flags.value)
    } else if (res.flags.property === 'metaurl') {
      tx = await vestingInstance.setAccountMetadataURL(res.flags.value)
    } else {
      this.error(`Invalid property provided`)
      return
    }
    await displaySendTx('setaccountTx', tx, { from: await vestingInstance.getBeneficiary() })
  }
}
