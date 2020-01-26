import { NULL_ADDRESS } from '@celo/contractkit'
import { toNumber } from '@celo/contractkit/src/wrappers/BaseWrapper'
import { VestingSchedule } from '@celo/contractkit/src/wrappers/VestingInstanceWrapper'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'

export interface PausedState {
  isPaused: boolean
  pauseEndTime?: number
}

export interface RevokedState {
  isRevoked: boolean
  revokeTime?: number
  vestedBalanceAtRevoke?: string
}

export interface BalanceState {
  totalWithdrawn: string
  totalBalance: string
  remainingTotalBalance: string
  remainingUnlockedBalance: string
  remainingLockedBalance: string
  initialVestingAmount: string
  currentVestedTotalAmount: string
}

export interface VestingInstanceInfo {
  vestingInstanceAddress: string
  beneficiary: string
  revoker: string
  isRevokable: boolean
  vestingSchedule: VestingSchedule
  maxPausePeriod: string
  pausedStateData: PausedState
  revokedStateData: RevokedState
  balanceStateData: BalanceState
}

export default class Info extends BaseCommand {
  static description = 'Get info on a vesting instance contract.'

  static flags = {
    ...BaseCommand.flags,
    beneficiary: Flags.address({ required: true, description: 'Beneficiary of the vesting' }),
  }

  static examples = ['info --beneficiary 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95']

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Info)
    this.kit.defaultAccount = flags.beneficiary
    const vestingFactory = await this.kit.contracts.getVestingFactory()
    const vestingInstance = await vestingFactory.getVestedAt(flags.beneficiary)

    await newCheckBuilder(this)
      .addCheck(
        `No vested instance found under the given beneficiary ${flags.beneficiary}`,
        () => vestingInstance.address !== NULL_ADDRESS
      )
      .runChecks()

    const pausedStateData: PausedState = {
      isPaused: await vestingInstance.isPaused(),
    }

    if (pausedStateData.isPaused)
      pausedStateData.pauseEndTime = toNumber(await vestingInstance.getPauseEndTime())

    const revokedStateData: RevokedState = {
      isRevoked: await vestingInstance.isRevoked(),
    }

    if (revokedStateData.isRevoked) {
      revokedStateData.revokeTime = toNumber(await vestingInstance.getRevokeTime())
      revokedStateData.vestedBalanceAtRevoke = (await vestingInstance.getVestedBalanceAtRevoke()).toString()
    }

    const balanceStateData: BalanceState = {
      totalWithdrawn: (await vestingInstance.getTotalWithdrawn()).toString(),
      totalBalance: (await vestingInstance.getTotalBalance()).toString(),
      remainingTotalBalance: (await vestingInstance.getRemainingTotalBalance()).toString(),
      remainingUnlockedBalance: (await vestingInstance.getRemainingUnlockedBalance()).toString(),
      remainingLockedBalance: (await vestingInstance.getRemainingLockedBalance()).toString(),
      initialVestingAmount: (await vestingInstance.getInitialVestingAmount()).toString(),
      currentVestedTotalAmount: (await vestingInstance.getCurrentVestedTotalAmount()).toString(),
    }

    const vestingInstanceInfo: VestingInstanceInfo = {
      vestingInstanceAddress: vestingInstance.address,
      beneficiary: flags.beneficiary,
      revoker: await vestingInstance.getRevoker(),
      isRevokable: await vestingInstance.isRevokable(),
      vestingSchedule: await vestingInstance.getVestingSchedule(),
      maxPausePeriod: await vestingInstance.getMaxPausePeriod(),
      pausedStateData: pausedStateData,
      revokedStateData: revokedStateData,
      balanceStateData: balanceStateData,
    }
    printValueMapRecursive(vestingInstanceInfo)
  }
}
