import { Address } from '../base'
import { GoldToken } from '../generated/types/GoldToken'
import { BaseWrapper, proxyCall, proxySend, toBigNumber, toNumber } from './BaseWrapper'

/**
 * ERC-20 contract for Celo native currency.
 */
export class GoldTokenWrapper extends BaseWrapper<GoldToken> {
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
  approve = proxySend(this.kit, this.contract.methods.approve)
  transferWithComment = proxySend(this.kit, this.contract.methods.transferWithComment)
  transfer = proxySend(this.kit, this.contract.methods.transfer)
  transferFrom = proxySend(this.kit, this.contract.methods.transferFrom)
  balanceOf = (account: Address) => this.kit.web3.eth.getBalance(account).then(toBigNumber)
}
