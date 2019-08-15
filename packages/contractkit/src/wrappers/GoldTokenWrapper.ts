import { Address } from '../base'
import { GoldToken } from '../generated/types/GoldToken'
import { BaseWrapper } from './BaseWrapper'

export class GoldTokenWrapper extends BaseWrapper<GoldToken> {
  allowance = this.proxyCall(this.contract.methods.allowance)
  name = this.proxyCall(this.contract.methods.name)
  symbol = this.proxyCall(this.contract.methods.symbol)
  decimals = this.proxyCall(this.contract.methods.decimals)
  totalSupply = this.proxyCall(this.contract.methods.totalSupply)
  approve = this.proxySend(this.contract.methods.approve)
  transferWithComment = this.proxySend(this.contract.methods.transferWithComment)
  transfer = this.proxySend(this.contract.methods.transfer)
  transferFrom = this.proxySend(this.contract.methods.transferFrom)
  balanceOf = (account: Address) => this.kit.web3.eth.getBalance(account)
}
