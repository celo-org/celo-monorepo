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
  allowance = proxyCall(this.contract.methods.allowance, undefined, toBigNumber)
  name = proxyCall(this.contract.methods.name, undefined, (a: any) => a.toString())
  symbol = proxyCall(this.contract.methods.symbol, undefined, (a: any) => a.toString())
  decimals = proxyCall(this.contract.methods.decimals, undefined, toNumber)
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

  async getInflationParameters(): Promise<InflationParameters> {
    const res = await this.contract.methods.getInflationParameters().call()
    return {
      rate: toBigNumber(res[0]),
      factor: toBigNumber(res[1]),
      updatePeriod: toBigNumber(res[2]),
      factorLastUpdated: toBigNumber(res[3]),
    }
  }

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
