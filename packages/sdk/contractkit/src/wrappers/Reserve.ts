import { Address, EventLog } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { newContractVersion } from '../base'
import { Reserve } from '../generated/Reserve'
import {
  BaseWrapper,
  fixidityValueToBigNumber,
  proxyCall,
  proxySend,
  valueToBigNumber,
} from './BaseWrapper'

export interface ReserveConfig {
  tobinTaxStalenessThreshold: BigNumber
  frozenReserveGoldStartBalance: BigNumber
  frozenReserveGoldStartDay: BigNumber
  frozenReserveGoldDays: BigNumber
  otherReserveAddresses: string[]
}

/**
 * Contract for handling reserve for stable currencies
 */
export class ReserveWrapper extends BaseWrapper<Reserve> {
  /**
   * Query Tobin tax staleness threshold parameter.
   * @returns Current Tobin tax staleness threshold.
   */
  tobinTaxStalenessThreshold = proxyCall(
    this.contract.methods.tobinTaxStalenessThreshold,
    undefined,
    valueToBigNumber
  )
  dailySpendingRatio = proxyCall(
    this.contract.methods.getDailySpendingRatio,
    undefined,
    fixidityValueToBigNumber
  )
  isSpender: (account: string) => Promise<boolean> = proxyCall(this.contract.methods.isSpender)
  transferGold = proxySend(this.kit, this.contract.methods.transferGold)
  getOrComputeTobinTax = proxySend(this.kit, this.contract.methods.getOrComputeTobinTax)
  frozenReserveGoldStartBalance = proxyCall(
    this.contract.methods.frozenReserveGoldStartBalance,
    undefined,
    valueToBigNumber
  )
  frozenReserveGoldStartDay = proxyCall(
    this.contract.methods.frozenReserveGoldStartDay,
    undefined,
    valueToBigNumber
  )
  frozenReserveGoldDays = proxyCall(
    this.contract.methods.frozenReserveGoldDays,
    undefined,
    valueToBigNumber
  )

  /**
   * @alias {getReserveCeloBalance}
   */
  getReserveGoldBalance = proxyCall(
    this.contract.methods.getReserveGoldBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * @notice Returns the amount of CELO included in the reserve
   * @return {BigNumber} The CELO amount included in the reserve.
   */
  getReserveCeloBalance = this.getReserveGoldBalance

  /**
   * @notice Returns the amount of unfrozen CELO in the Reserve contract.
   * @see {getUnfrozenReserveCeloBalance}
   * @return {BigNumber} amount in wei
   */
  getUnfrozenBalance = proxyCall(
    this.contract.methods.getUnfrozenBalance,
    undefined,
    valueToBigNumber
  )

  /**
   * @notice Returns the amount of unfrozen CELO included in the reserve
   *  contract and in other reserve addresses.
   * @see {getUnfrozenBalance}
   * @return {BigNumber} amount in wei
   */
  getUnfrozenReserveCeloBalance = proxyCall(
    this.contract.methods.getUnfrozenReserveGoldBalance,
    undefined,
    valueToBigNumber
  )

  getOtherReserveAddresses = proxyCall(this.contract.methods.getOtherReserveAddresses)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ReserveConfig> {
    return {
      tobinTaxStalenessThreshold: await this.tobinTaxStalenessThreshold(),
      frozenReserveGoldStartBalance: await this.frozenReserveGoldStartBalance(),
      frozenReserveGoldStartDay: await this.frozenReserveGoldStartDay(),
      frozenReserveGoldDays: await this.frozenReserveGoldDays(),
      otherReserveAddresses: await this.getOtherReserveAddresses(),
    }
  }

  isOtherReserveAddress = proxyCall(this.contract.methods.isOtherReserveAddress)

  async getSpenders(): Promise<Address[]> {
    this.onlyVersionOrGreater(newContractVersion(1, 1, 2, 1))
    return this.contract.methods.getExchangeSpenders().call()
  }
}
