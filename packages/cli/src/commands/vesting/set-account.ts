import { NULL_ADDRESS } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetAccount extends BaseCommand {
  static description =
    'Keep your locked Gold more secure by authorizing alternative keys to be used for signing attestations, voting, or validating. By doing so, you can continue to participate in the protocol why keeping the key with access to your locked Gold in cold storage. You must include a "proof-of-possession" of the key being authorized, which can be generated with the "account:proof-of-possession" command.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Beneficiary of the vesting ' }),
    property: flags.string({
      char: 'p',
      options: ['name', 'walletaddress', 'dataenckey', 'metaurl'],
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
    const vestingFactoryInstance = await vestingFactory.getVestedAt(res.flags.from)
    if (vestingFactoryInstance.address === NULL_ADDRESS) {
      console.error(`No vested instance found under the given beneficiary`)
      return
    }
    if ((await vestingFactoryInstance.getBeneficiary()) !== res.flags.from) {
      console.error(`Vested instance has a different beneficiary`)
      return
    }

    await newCheckBuilder(this)
      .isAccount(res.flags.from)
      .runChecks()

    await newCheckBuilder(this)
      .isAccount(vestingFactoryInstance.address)
      .runChecks()

    let tx: any
    if (res.flags.property === 'name') {
      tx = await vestingFactoryInstance.setAccountName(res.flags.value)
    } else if (res.flags.property === 'walletaddress') {
      tx = await vestingFactoryInstance.setAccountWalletAddress(res.flags.value)
    } else if (res.flags.property === 'dataenckey') {
      // tx = await vestingFactoryInstance.setAccountDataEncryptionKey(res.flags.value)
    } else if (res.flags.property === 'metaurl') {
      tx = await vestingFactoryInstance.setAccountMetadataURL(res.flags.value)
    } else {
      this.error(`Invalid property provided`)
      return
    }
    await displaySendTx('setaccountTx', tx)
  }
}
