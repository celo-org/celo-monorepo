import { Ierc20 } from '@celo/contractkit/lib/generated/IERC20'
import { Erc20Wrapper } from '@celo/contractkit/lib/wrappers/Erc20Wrapper'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx, failWith } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class TransferErc20 extends BaseCommand {
  static description = 'Transfer ERC20 to a specified address'

  static flags = {
    ...BaseCommand.flags,
    erc20Address: Flags.address({
      required: true,
      description: "Custom erc20 to check it's balance too",
    }),
    from: Flags.address({
      required: true,
      description: 'Address of the sender',
    }),
    to: Flags.address({
      required: true,
      description: 'Address of the receiver',
    }),
    value: flags.string({
      required: true,
      description: 'Amount to transfer (in wei)',
    }),
  }

  static examples = [
    'erc20 --erc20Address 0x765DE816845861e75A25fCA122bb6898B8B1282a --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 10000000000000000000',
  ]

  async run() {
    const res = this.parse(TransferErc20)

    const from: string = res.flags.from
    const to: string = res.flags.to
    const value = new BigNumber(res.flags.value)

    this.kit.defaultAccount = from
    let celoToken: Erc20Wrapper<Ierc20>
    try {
      celoToken = await this.kit.contracts.getErc20(res.flags.erc20Address)
      // this call allow us to check if it is a valid erc20
      await celoToken.balanceOf(res.flags.from)
    } catch {
      failWith('Invalid erc20 address')
    }
    await newCheckBuilder(this).hasEnoughErc20(from, value, res.flags.erc20Address).runChecks()

    await displaySendTx('transfer', celoToken.transfer(to, value.toFixed()))
  }
}
