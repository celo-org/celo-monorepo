import { CeloContract } from '../base'
import { VestingFactory } from '../generated/types/VestingFactory'
import { newVestingInstance } from '../generated/VestingInstance'
import { BaseWrapper, CeloTransactionObject, toTransactionObject } from './BaseWrapper'
import { VestingInstanceWrapper } from './VestingInstanceWrapper'

interface VestingInstanceInitData {
  vestingBeneficiary: string
  vestingAmount: number | string
  vestingCliff: number | string
  vestingStartTime: number | string
  vestingPeriodSec: number | string
  vestAmountPerPeriod: number | string
  vestingRevokable: boolean
  vestingRevoker: string
  vestingRefundDestination: string
}

/**
 * Contract for creating new vesting contracts as well as reading
 */
export class VestingFactoryWrapper extends BaseWrapper<VestingFactory> {
  /**
   * Creates a new vesting instance
   * @param initData The vesting instance initialisation data of type VestingInstanceInitData
   * @return The vesting instance contract
   */
  async createVestingInstance(
    initData: VestingInstanceInitData
  ): Promise<CeloTransactionObject<string>> {
    return toTransactionObject(
      this.kit,
      this.contract.methods.createVestingInstance(
        initData.vestingBeneficiary,
        initData.vestingAmount,
        initData.vestingCliff,
        initData.vestingStartTime,
        initData.vestingPeriodSec,
        initData.vestAmountPerPeriod,
        initData.vestingRevokable,
        initData.vestingRevoker,
        initData.vestingRefundDestination,
        await this.kit.registry.addressFor(CeloContract.Registry)
      )
    )
  }

  /**
   * Returns the vested instance at the address of the beneficiary.
   * @param account The address of the beneficiary.
   * @return The vesting instance contract
   */
  async getVestedAt(account: string) {
    const vestingInstanceAddress: string = await this.contract.methods.vestings(account).call()
    return new VestingInstanceWrapper(
      this.kit,
      newVestingInstance(this.kit.web3, vestingInstanceAddress)
    )
  }
}
