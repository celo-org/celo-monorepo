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

export class StableTokenWrapper extends BaseWrapper<StableToken> {
  allowance = proxyCall(this.contract.methods.allowance, undefined, toBigNumber)
  name = proxyCall(this.contract.methods.name)
  symbol = proxyCall(this.contract.methods.symbol)
  decimals = proxyCall(this.contract.methods.decimals, undefined, toNumber)
  totalSupply = proxyCall(this.contract.methods.totalSupply, undefined, toBigNumber)
  balanceOf = proxyCall(this.contract.methods.balanceOf, undefined, toBigNumber)
  minter = proxyCall(this.contract.methods.minter)
  owner = proxyCall(this.contract.methods.owner)
  getInflationParameters = proxyCall(this.contract.methods.getInflationParameters)
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
}
