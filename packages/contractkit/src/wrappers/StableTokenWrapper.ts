import BigNumber from 'bignumber.js'
import { StableToken } from '../generated/types/StableToken'
import {
  BaseWrapper,
  parseNumber,
  proxyCall,
  proxySend,
  toBigNumber,
  toNumber,
  tupleParser,
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
   * Querying allowance.
   * @param from Account who has given the allowance.
   * @param to Address of account to whom the allowance was given.
   * @returns Amount of allowance.
   */
  allowance = proxyCall(this.contract.methods.allowance, undefined, toBigNumber)
  /**
   * Returns the name of the token.
   * @returns Name of the token.
   */
  name = proxyCall(this.contract.methods.name, undefined, (a: any) => a.toString())
  /**
   * Returns the three letter symbol of the token.
   * @returns Symbol of the token.
   */
  symbol = proxyCall(this.contract.methods.symbol, undefined, (a: any) => a.toString())
  /**
   * Returns the number of decimals used in the token.
   * @returns Number of decimals.
   */
  decimals = proxyCall(this.contract.methods.decimals, undefined, toNumber)
  /**
   * Returns the total supply of the token, that is, the amount of tokens currently minted.
   * @returns Total supply.
   */
  totalSupply = proxyCall(this.contract.methods.totalSupply, undefined, toBigNumber)
  balanceOf = proxyCall(this.contract.methods.balanceOf, undefined, toBigNumber)
  minter = proxyCall(this.contract.methods.minter)
  owner = proxyCall(this.contract.methods.owner)
  valueToUnits = proxyCall(
    this.contract.methods.valueToUnits,
    tupleParser(parseNumber),
    toBigNumber
  )

  unitsToValue = proxyCall(
    this.contract.methods.unitsToValue,
    tupleParser(parseNumber),
    toBigNumber
  )

  approve = proxySend(this.kit, this.contract.methods.approve)
  mint = proxySend(this.kit, this.contract.methods.mint)
  burn = proxySend(this.kit, this.contract.methods.burn)
  transferWithComment = proxySend(this.kit, this.contract.methods.transferWithComment)
  transfer = proxySend(this.kit, this.contract.methods.transfer)
  transferFrom = proxySend(this.kit, this.contract.methods.transferFrom)
  setInflationParameters = proxySend(this.kit, this.contract.methods.setInflationParameters)

  /**
   * Querying the inflation parameters.
   * @returns Inflation rate, inflation factor, inflation update period and the last time factor was updated.
   */
  async getInflationParameters(): Promise<InflationParameters> {
    const res = await this.contract.methods.getInflationParameters().call()
    return {
      rate: toBigNumber(res[0]),
      factor: toBigNumber(res[1]),
      updatePeriod: toBigNumber(res[2]),
      factorLastUpdated: toBigNumber(res[3]),
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
}
