import { NULL_ADDRESS } from '@celo/contractkit'
import { Address } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class UnlockGold extends BaseCommand {
  static description =
    'Unlocks Celo Gold owned by the vesting instance, which can be withdrawn after the unlocking period. Unlocked gold will appear as a "pending withdrawal" until the unlocking period is over, after which it can be withdrawn via "vesting:withdraw-gold".'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
    value: flags.string({
      ...LockedGoldArgs.valueArg,
      required: true,
      description: 'Value of Celo Gold to unlock through the vesting instance',
    }),
  }

  static args = []

  static examples = [
    'unlock-gold --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 10000000000000000000000',
  ]

  async run() {
    const res = this.parse(UnlockGold)
    const address: Address = res.flags.from

    this.kit.defaultAccount = address
    const value = new BigNumber(res.flags.value)

    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(res.flags.from)

    await newCheckBuilder(this)
      .addCheck(`Value [${value.toFixed()}] is not > 0`, () => value.gt(0))
      .addCheck(
        `No vested instance found under the given beneficiary ${res.flags.from}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vested instance has a different beneficiary`,
        async () => (await vestingInstance.getBeneficiary()) === res.flags.from
      )
      .isAccount(vestingInstance.address)
      .runChecks()

    await displaySendTx('unlock', vestingInstance.unlockGold(value), {
      from: await vestingInstance.getBeneficiary(),
    })
  }
}
