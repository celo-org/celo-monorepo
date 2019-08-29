import { Address } from '../base'
import { GoldToken } from '../generated/types/GoldToken'
import { BaseWrapper, proxyCall, proxySend, toBigNumber, toNumber } from './BaseWrapper'

export class GoldTokenWrapper extends BaseWrapper<GoldToken> {
  allowance = proxyCall(this.contract.methods.allowance, undefined, toBigNumber)
  name = proxyCall(this.contract.methods.name)
  symbol = proxyCall(this.contract.methods.symbol)
  decimals = proxyCall(this.contract.methods.decimals, undefined, toNumber)
  totalSupply = proxyCall(this.contract.methods.totalSupply, undefined, toBigNumber)
  approve = proxySend(this.kit, this.contract.methods.approve)
  transferWithComment = proxySend(this.kit, this.contract.methods.transferWithComment)
  transfer = proxySend(this.kit, this.contract.methods.transfer)
  transferFrom = proxySend(this.kit, this.contract.methods.transferFrom)
  balanceOf = (account: Address) => this.kit.web3.eth.getBalance(account).then(toBigNumber)
}
