import { GoldToken } from 'src/generated/types/GoldToken'
import { BaseWrapper } from 'src/wrappers/BaseWrapper'

export class GoldTokenWrapper extends BaseWrapper<GoldToken> {
  allowance = this.proxyCall(this.contract.methods.allowance)
  balanceOf = this.proxyCall(this.contract.methods.balanceOf)
  name = this.proxyCall(this.contract.methods.name)
  symbol = this.proxyCall(this.contract.methods.symbol)
  decimals = this.proxyCall(this.contract.methods.decimals)
  totalSupply = this.proxyCall(this.contract.methods.totalSupply)
  approve = this.proxySend(this.contract.methods.approve)
  transferWithComment = this.proxySend(this.contract.methods.transferWithComment)
  transfer = this.proxySend(this.contract.methods.transfer)
  transferFrom = this.proxySend(this.contract.methods.transferFrom)
}
