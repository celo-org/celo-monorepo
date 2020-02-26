import { ReleaseSchedule } from '@celo/contractkit/src/wrappers/ReleaseGold'
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'

export interface RevokedState {
  isRevoked: boolean
  revokeTime?: number
  releasedBalanceAtRevoke?: string
}

export interface BalanceState {
  totalWithdrawn: string
  totalBalance: string
  remainingTotalBalance: string
  remainingUnlockedBalance: string
  remainingLockedBalance: string
  currentReleasedTotalAmount: string
}

export interface ReleaseGoldInfo {
  vestingInstanceAddress: string
  beneficiary: string
  revoker: string
  isRevokable: boolean
  vestingSchedule: ReleaseSchedule
  revokedStateData: RevokedState
  balanceStateData: BalanceState
}

export default class Info extends BaseCommand {
  static description = 'Get info on a ReleaseGold instance contract.'

  static flags = {
    ...BaseCommand.flags,
    releaseGoldAddress: Flags.address({
      required: true,
      description: 'Address of the ReleaseGold Contract',
    }),
  }

  static examples = ['info --releaseGoldAddress 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Info)
    const releaseGoldContract = await this.kit.contracts.getReleaseGold()
    const releaseGoldInstance = await releaseGoldContract.getReleaseGoldAt(flags.releaseGoldAddress)
    console.log(releaseGoldInstance)
  }

  //   await newCheckBuilder(this)
  //     .addCheck(
  //       `No vested instance found under the given beneficiary ${flags.beneficiary}`,
  //       () => vestingInstance.address !== NULL_ADDRESS
  //     )
  //     .runChecks()

  //   const pausedStateData: PausedState = {
  //     isPaused: await vestingInstance.isPaused(),
  //   }

  //   if (pausedStateData.isPaused)
  //     pausedStateData.pauseEndTime = valueToInt(await vestingInstance.getPauseEndTime())

  //   const revokedStateData: RevokedState = {
  //     isRevoked: await vestingInstance.isRevoked(),
  //   }

  //   if (revokedStateData.isRevoked) {
  //     revokedStateData.revokeTime = valueToInt(await vestingInstance.getRevokeTime())
  //     revokedStateData.vestedBalanceAtRevoke = (
  //       await vestingInstance.getVestedBalanceAtRevoke()
  //     ).toString()
  //   }

  //   const balanceStateData: BalanceState = {
  //     totalWithdrawn: (await vestingInstance.getTotalWithdrawn()).toString(),
  //     totalBalance: (await vestingInstance.getTotalBalance()).toString(),
  //     remainingTotalBalance: (await vestingInstance.getRemainingTotalBalance()).toString(),
  //     remainingUnlockedBalance: (await vestingInstance.getRemainingUnlockedBalance()).toString(),
  //     remainingLockedBalance: (await vestingInstance.getRemainingLockedBalance()).toString(),
  //     initialVestingAmount: (await vestingInstance.getInitialVestingAmount()).toString(),
  //     currentVestedTotalAmount: (await vestingInstance.getCurrentVestedTotalAmount()).toString(),
  //   }

  //   const vestingInstanceInfo: VestingInstanceInfo = {
  //     vestingInstanceAddress: vestingInstance.address,
  //     beneficiary: flags.beneficiary,
  //     revoker: await vestingInstance.getRevoker(),
  //     isRevokable: await vestingInstance.isRevokable(),
  //     vestingSchedule: await vestingInstance.getVestingSchedule(),
  //     maxPausePeriod: await vestingInstance.getMaxPausePeriod(),
  //     pausedStateData: pausedStateData,
  //     revokedStateData: revokedStateData,
  //     balanceStateData: balanceStateData,
  //   }
  //   printValueMapRecursive(vestingInstanceInfo)
  // }
}
