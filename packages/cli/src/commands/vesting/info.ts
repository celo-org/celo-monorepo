import { NULL_ADDRESS } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class VestingInfo extends BaseCommand {
  static description = 'Get info on a vesting instance contract.'

  static flags = {
    ...BaseCommand.flags,
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
  }

  static examples = ['info --beneficiary 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(VestingInfo)
    this.kit.defaultAccount = flags.beneficiary
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(flags.beneficiary)

    await newCheckBuilder(this)
      .addCheck(
        `No vested instance found under the given beneficiary ${flags.beneficiary}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .runChecks()

    const instanceAddressInfo = {
      beneficiary: flags.beneficiary,
      vestingInstanceAddress: vestingInstance.address,
      revoker: await vestingInstance.getRevoker(),
      refunder: await vestingInstance.getRefundDestination(),
      currentlyWithdrawn: await vestingInstance.getCurrentlyWithdrawn(),
      vestingInstanceTotalBalance: await vestingInstance.getVestingInstanceTotalBalance(),
      isPaused: await vestingInstance.isPaused(),
      isRevokable: await vestingInstance.isRevokable(),
      isRevoked: await vestingInstance.isRevoked(),
      vestingScheme: await vestingInstance.getVestingScheme(),
    }
    printValueMapRecursive(instanceAddressInfo)
  }
}
