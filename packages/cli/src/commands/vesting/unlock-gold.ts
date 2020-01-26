import { NULL_ADDRESS } from '@celo/contractkit'
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
    revoker: Flags.address({ required: true, description: 'Revoker of the vesting' }),
    value: flags.string({
      ...LockedGoldArgs.valueArg,
      required: true,
      description: 'Value of Celo Gold to unlock through the vesting instance',
    }),
  }

  static args = []

  static examples = [
    'unlock-gold --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --revoker 0x5409ED021D9299bf6814279A6A1411A7e866A631 --value 10000000000000000000000',
  ]

  async run() {
    const res = this.parse(UnlockGold)
    const beneficiary = res.flags.from
    const revoker = res.flags.revoker
    const value = new BigNumber(res.flags.value)

    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(beneficiary)

    await newCheckBuilder(this)
      .addCheck(`Value [${value.toFixed()}] is not > 0`, () => value.gt(0))
      .addCheck(
        `No vesting instance found under the given beneficiary ${beneficiary}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .addCheck(
        `Vesting instance has a different beneficiary`,
        async () => (await vestingInstance.getBeneficiary()) === beneficiary
      )
      .addCheck(
        `Vesting instance has a different revoker`,
        async () => (await vestingInstance.getRevoker()) === revoker
      )
      .isAccount(vestingInstance.address)
      .runChecks()

    const isRevoked = await vestingInstance.isRevoked()
    this.kit.defaultAccount = isRevoked ? revoker : beneficiary

    await displaySendTx('unlockGoldTx', vestingInstance.unlockGold(value), {
      from: isRevoked ? revoker : beneficiary,
    })
  }
}
