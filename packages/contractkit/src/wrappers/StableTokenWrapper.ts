import { StableToken } from 'src/generated/types/StableToken'
import { BaseWrapper } from 'src/wrappers/BaseWrapper'

export class StableTokenWrapper extends BaseWrapper<StableToken> {
  allowance = this.proxyCall(this.contract.methods.allowance)
  balanceOf = this.proxyCall(this.contract.methods.balanceOf)
  minter = this.proxyCall(this.contract.methods.minter)
  name = this.proxyCall(this.contract.methods.name)
  symbol = this.proxyCall(this.contract.methods.symbol)
  decimals = this.proxyCall(this.contract.methods.decimals)
  owner = this.proxyCall(this.contract.methods.owner)
  totalSupply = this.proxyCall(this.contract.methods.totalSupply)
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
