import { NULL_ADDRESS } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class VestingInfo extends BaseCommand {
  static description = 'Get info on vesting instance contract.'

  static flags = {
    ...BaseCommand.flags,
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting ' }),
  }

  static examples = ['vesting-info --beneficiary 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(VestingInfo)
    this.kit.defaultAccount = flags.beneficiary
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingFactoryInstance = await vestingFactory.getVestedAt(flags.beneficiary)
    if ((await vestingFactoryInstance.getBeneficiary()) === NULL_ADDRESS) {
      console.error(`Beneficiary has no vested instance`)
      return
    }
    if ((await vestingFactoryInstance.getBeneficiary()) !== flags.beneficiary) {
      console.error(`Vested instance has a different beneficiary`)
      return
    }

    await newCheckBuilder(this)
      .isAccount(vestingFactoryInstance.address)
      .runChecks()

    const vestingScheme = await vestingFactoryInstance.getVestingScheme()

    const instanceAddressInfo = {
      beneficiary: flags.beneficiary,
      vestingInstanceAddress: vestingFactoryInstance.address,
      revoker: await vestingFactoryInstance.getRevoker(),
      refunder: await vestingFactoryInstance.getRefundDestination(),
      currentlyWithdrawn: await vestingFactoryInstance.getCurrentlyWithdrawn(),
      isPaused: vestingFactoryInstance.isPaused(),
      isRevokable: vestingFactoryInstance.isRevokable(),
      isRevoked: vestingFactoryInstance.isRevoked(),
      vestingScheme: {
        vestingAmount: vestingScheme.vestingAmount.toString(),
        vestingAmountPerPeriod: vestingScheme.vestingAmountPerPeriod.toString(),
        vestingCliffStartTime: vestingScheme.vestingCliffStartTime.toString(),
        vestingPeriodSec: vestingScheme.vestingPeriodSec.toString(),
        vestingPeriods: vestingScheme.vestingPeriods.toString(),
        vestingStartTime: vestingScheme.vestingStartTime.toString(),
      },
    }
    printValueMapRecursive(instanceAddressInfo)
  }
}
