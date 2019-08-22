import { StableToken } from '../generated/types/StableToken'
import { BaseWrapper, toBigNumber, toNumber } from './BaseWrapper'

export class StableTokenWrapper extends BaseWrapper<StableToken> {
  allowance = this.proxyCallAndTransform(this.contract.methods.allowance, toBigNumber)
  name = this.proxyCall(this.contract.methods.name)
  symbol = this.proxyCall(this.contract.methods.symbol)
  decimals = this.proxyCallAndTransform(this.contract.methods.decimals, toNumber)
  totalSupply = this.proxyCallAndTransform(this.contract.methods.totalSupply, toBigNumber)
  balanceOf = this.proxyCallAndTransform(this.contract.methods.balanceOf, toBigNumber)
  minter = this.proxyCall(this.contract.methods.minter)
  owner = this.proxyCall(this.contract.methods.owner)
  getInflationParameters = this.proxyCall(this.contract.methods.getInflationParameters)
  valueToUnits = this.proxyCall(this.contract.methods.valueToUnits)
  unitsToValue = this.proxyCall(this.contract.methods.unitsToValue)
  approve = this.proxySend(this.contract.methods.approve)
  mint = this.proxySend(this.contract.methods.mint)
  burn = this.proxySend(this.contract.methods.burn)
  transferWithComment = this.proxySend(this.contract.methods.transferWithComment)
  transfer = this.proxySend(this.contract.methods.transfer)
  transferFrom = this.proxySend(this.contract.methods.transferFrom)
  setInflationParameters = this.proxySend(this.contract.methods.setInflationParameters)
}
