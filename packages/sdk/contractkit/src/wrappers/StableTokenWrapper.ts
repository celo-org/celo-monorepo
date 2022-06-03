import { fromFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { StableToken } from '../generated/StableToken'
import {
  proxyCall,
  proxySend,
  secondsToDurationString,
  stringIdentity,
  tupleParser,
  unixSecondsTimestampToDateString,
  valueToBigNumber,
  valueToString,
} from './BaseWrapper'
import { CeloTokenWrapper } from './CeloTokenWrapper'

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
 * Stable token with variable supply
 */
export class StableTokenWrapper extends CeloTokenWrapper<StableToken> {
  /**
   * Returns the address of the owner of the contract.
   * @return the address of the owner of the contract.
   */
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
    this.connection,
    this.contract.methods.increaseAllowance,
    tupleParser(stringIdentity, valueToString)
  )
  /**
   * Decreases the allowance of another user.
   * @param spender The address which is being approved to spend StableToken.
   * @param value The decrement of the amount of StableToken approved to the spender.
   * @returns true if success.
   */
  decreaseAllowance = proxySend(this.connection, this.contract.methods.decreaseAllowance)
  mint = proxySend(this.connection, this.contract.methods.mint)
  burn = proxySend(this.connection, this.contract.methods.burn)

  setInflationParameters = proxySend(this.connection, this.contract.methods.setInflationParameters)

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
   * @dev Returns human readable configuration of the stabletoken contract
   * @return StableTokenConfig object
   */
  async getHumanReadableConfig() {
    const config = await this.getConfig()
    const inflationParameters = {
      ...config.inflationParameters,
      updatePeriod: secondsToDurationString(config.inflationParameters.updatePeriod),
      factorLastUpdated: unixSecondsTimestampToDateString(
        config.inflationParameters.factorLastUpdated
      ),
    }
    return {
      ...config,
      inflationParameters,
    }
  }
}

export type StableTokenWrapperType = StableTokenWrapper
