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

  /**
   * Approve a user to transfer Celo Gold on behalf of another user.
   * @param spender The address which is being approved to spend Celo Gold.
   * @param value The amount of Celo Gold approved to the spender.
   * @return True if the transaction succeeds.
   */
  approve = proxySend(this.kit, this.contract.methods.approve)

  /**
   * Transfers Celo Gold from one address to another with a comment.
   * @param to The address to transfer Celo Gold to.
   * @param value The amount of Celo Gold to transfer.
   * @param comment The transfer comment
   * @return True if the transaction succeeds.
   */
  transferWithComment = proxySend(this.kit, this.contract.methods.transferWithComment)

  /**
   * Transfers Celo Gold from one address to another.
   * @param to The address to transfer Celo Gold to.
   * @param value The amount of Celo Gold to transfer.
   * @return True if the transaction succeeds.
   */
  transfer = proxySend(this.kit, this.contract.methods.transfer)

  /**
   * Transfers Celo Gold from one address to another on behalf of a user.
   * @param from The address to transfer Celo Gold from.
   * @param to The address to transfer Celo Gold to.
   * @param value The amount of Celo Gold to transfer.
   * @return True if the transaction succeeds.
   */
  transferFrom = proxySend(this.kit, this.contract.methods.transferFrom)

  /**
   * Gets the balance of the specified address.
   * @param owner The address to query the balance of.
   * @return The balance of the specified address.
   */
  balanceOf = (account: Address) => this.kit.web3.eth.getBalance(account).then(toBigNumber)
}
