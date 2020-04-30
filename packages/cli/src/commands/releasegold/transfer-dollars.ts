import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { ReleaseGoldCommand } from './release-gold'

export default class TransferDollars extends ReleaseGoldCommand {
  static description =
    'Transfer Celo Dollars from the given contract address. Dollars may be accrued to the ReleaseGold contract via validator epoch rewards.'

  static flags = {
    ...ReleaseGoldCommand.flags,
    to: Flags.address({
      required: true,
      description: 'Address of the recipient of Celo Dollars transfer',
    }),
    value: Flags.wei({ required: true, description: 'Value (in Wei) of Celo Dollars to transfer' }),
  }

  static args = []

  static examples = [
    'transfer-dollars --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --to 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb --value 10000000000000000000000',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(TransferDollars)
    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    this.kit.defaultAccount = isRevoked
      ? await this.releaseGoldWrapper.getReleaseOwner()
      : await this.releaseGoldWrapper.getBeneficiary()

    await displaySendTx('transfer', this.releaseGoldWrapper.transfer(flags.to, flags.value))
  }
}
