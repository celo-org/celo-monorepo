import { NULL_ADDRESS } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Revoke extends BaseCommand {
  static description = 'Revoke the vesting for a certain duration'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Revoker of the vesting' }),
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
    timestamp: flags.integer({
      required: true,
      description: 'The timestamp in seconds at which to revoke the vesting',
    }),
  }

  static args = []

  static examples = [
    'revoke --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --beneficiary 0x5409ED021D9299bf6814279A6A1411A7e866A631 --timestamp 1577630534',
  ]

  async run() {
    const res = this.parse(Revoke)
    this.kit.defaultAccount = res.flags.from
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(res.flags.beneficiary)

    await newCheckBuilder(this)
      .addCheck(
        `Revoke timestamp ${res.flags.timestamp} must be in the future and not in the past`,
        async () =>
          res.flags.timestamp > 0 &&
          res.flags.timestamp >= (await this.kit.web3.eth.getBlock('latest')).timestamp
      )
      .addCheck(
        `No vested instance found under the given beneficiary ${res.flags.from}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vested instance has a different revoker`,
        async () => (await vestingInstance.getRevoker()) === res.flags.from
      )
      .runChecks()

    const tx = await vestingInstance.revokeVesting(res.flags.timestamp)
    await displaySendTx('revokeVestingTx', tx, { from: await vestingInstance.getRevoker() })
  }
}
