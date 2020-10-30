import { fromFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { StableToken } from '../generated/StableToken'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  stringIdentity,
  tupleParser,
  valueToBigNumber,
  valueToInt,
  valueToString,
} from './BaseWrapper'

export interface InflationParameters {
  rate: BigNumber
  factor: BigNumber
  updatePeriod: BigNumber
  factorLastUpdated: BigNumber
}

export interface StableTokenConfig {
  decimals: number
  name: string
  symbol: string
  inflationParameters: InflationParameters
}

/**
 * Stable token with variable supply (cUSD)
 */
export class StableTokenWrapper extends BaseWrapper<StableToken> {
  /**
   * Gets the amount of owner's StableToken allowed to be spent by spender.
   * @param accountOwner The owner of the StableToken.
   * @param spender The spender of the StableToken.
   * @return The amount of StableToken owner is allowing spender to spend.
   */
  allowance = proxyCall(this.contract.methods.allowance, undefined, valueToBigNumber)

  /**
   * @return The name of the stable token.
   */
  name: () => Promise<string> = proxyCall(this.contract.methods.name)

  /**
   * @return The symbol of the stable token.
   */
  symbol: () => Promise<string> = proxyCall(this.contract.methods.symbol)

  /**
   * @return The number of decimal places to which StableToken is divisible.
   */
  decimals = proxyCall(this.contract.methods.decimals, undefined, valueToInt)

  /**
   * Returns the total supply of the token, that is, the amount of tokens currently minted.
   * @returns Total supply.
   */
  totalSupply = proxyCall(this.contract.methods.totalSupply, undefined, valueToBigNumber)

  /**
   * Gets the balance of the specified address using the presently stored inflation factor.
   * @param owner The address to query the balance of.
   * @return The balance of the specified address.
   */
  balanceOf: (owner: string) => Promise<BigNumber> = proxyCall(
    this.contract.methods.balanceOf,
    undefined,
    valueToBigNumber
  )

  owner = proxyCall(this.contract.methods.owner)

  /**
   * Returns the units for a given value given the current inflation factor.
   * @param value The value to convert to units.
   * @return The units corresponding to `value` given the current inflation factor.
   * @dev We don't compute the updated inflationFactor here because
   * we assume any function calling this will have updated the inflation factor.
   */
  valueToUnits: (value: BigNumber.Value) => Promise<BigNumber> = proxyCall(
    this.contract.methods.valueToUnits,
    tupleParser(valueToString),
    valueToBigNumber
  )

  /**
   * Returns the value of a given number of units given the current inflation factor.
   * @param units The units to convert to value.
   * @return The value corresponding to `units` given the current inflation factor.
   */
  unitsToValue: (units: BigNumber.Value) => Promise<BigNumber> = proxyCall(
    this.contract.methods.unitsToValue,
    tupleParser(valueToString),
    valueToBigNumber
  )

  /**
   * Increases the allowance of another user.
   * @param spender The address which is being approved to spend StableToken.
   * @param value The increment of the amount of StableToken approved to the spender.
   * @returns true if success.
   */
  increaseAllowance = proxySend(
    this.kit,
    this.contract.methods.increaseAllowance,
    tupleParser(stringIdentity, valueToString)
  )
  /**
   * Decreases the allowance of another user.
   * @param spender The address which is being approved to spend StableToken.
   * @param value The decrement of the amount of StableToken approved to the spender.
   * @returns true if success.
   */
  decreaseAllowance = proxySend(this.kit, this.contract.methods.decreaseAllowance)
  mint = proxySend(this.kit, this.contract.methods.mint)
  burn = proxySend(this.kit, this.contract.methods.burn)

  setInflationParameters = proxySend(this.kit, this.contract.methods.setInflationParameters)

  /**
   * Querying the inflation parameters.
   * @returns Inflation rate, inflation factor, inflation update period and the last time factor was updated.
   */
  async getInflationParameters(): Promise<InflationParameters> {
    const res = await this.contract.methods.getInflationParameters().call()
    return {
      rate: fromFixed(valueToBigNumber(res[0])),
      factor: fromFixed(valueToBigNumber(res[1])),
      updatePeriod: valueToBigNumber(res[2]),
      factorLastUpdated: valueToBigNumber(res[3]),
    }
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<StableTokenConfig> {
    const res = await Promise.all([
      this.name(),
      this.symbol(),
      this.decimals(),
      this.getInflationParameters(),
    ])
    return {
      name: res[0],
      symbol: res[1],
      decimals: res[2],
      inflationParameters: res[3],
    }
  }

  /**
   * Approve a user to transfer StableToken on behalf of another user.
   * @param spender The address which is being approved to spend StableToken.
   * @param value The amount of StableToken approved to the spender.
   * @return True if the transaction succeeds.
   */
  approve: (spender: string, value: string | number) => CeloTransactionObject<boolean> = proxySend(
    this.kit,
    this.contract.methods.approve
  )

  /**
   * Transfer token for a specified address
   * @param to The address to transfer to.
   * @param value The amount to be transferred.
   * @param comment The transfer comment.
   * @return True if the transaction succeeds.
   */
  transferWithComment: (
    to: string,
    value: string | number,
    comment: string
  ) => CeloTransactionObject<boolean> = proxySend(
    this.kit,
    this.contract.methods.transferWithComment
  )

  /**
   * Transfers `value` from `msg.sender` to `to`
   * @param to The address to transfer to.
   * @param value The amount to be transferred.
   */

  transfer: (to: string, value: string | number) => CeloTransactionObject<boolean> = proxySend(
    this.kit,
    this.contract.methods.transfer
  )

  /**
   * Transfers StableToken from one address to another on behalf of a user.
   * @param from The address to transfer StableToken from.
   * @param to The address to transfer StableToken to.
   * @param value The amount of StableToken to transfer.
   * @return True if the transaction succeeds.
   */
  transferFrom: (
    from: string,
    to: string,
    value: string | number
  ) => CeloTransactionObject<boolean> = proxySend(this.kit, this.contract.methods.transferFrom)
}
