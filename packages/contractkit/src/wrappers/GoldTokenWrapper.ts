import { Address } from '../base'
import { GoldToken } from '../generated/types/GoldToken'
import { BaseWrapper, toBigNumber, toNumber } from './BaseWrapper'

export class GoldTokenWrapper extends BaseWrapper<GoldToken> {
  allowance = this.proxyCallAndTransform(this.contract.methods.allowance, toBigNumber)
  name = this.proxyCall(this.contract.methods.name)
  symbol = this.proxyCall(this.contract.methods.symbol)
  decimals = this.proxyCallAndTransform(this.contract.methods.decimals, toNumber)
  totalSupply = this.proxyCallAndTransform(this.contract.methods.totalSupply, toBigNumber)
  approve = this.proxySend(this.contract.methods.approve)
  transferWithComment = this.proxySend(this.contract.methods.transferWithComment)
  transfer = this.proxySend(this.contract.methods.transfer)
  transferFrom = this.proxySend(this.contract.methods.transferFrom)
  balanceOf = (account: Address) => this.kit.web3.eth.getBalance(account).then(toBigNumber)
}
