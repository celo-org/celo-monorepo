// NOTE: removing this import results in `yarn build` failures in Dockerfiles
// after the move to node 10. This allows types to be inferred without
// referencing '@celo/utils/node_modules/bignumber.js'
import { Address } from '@celo/base'
import 'bignumber.js'
import { GoldToken } from '../generated/GoldToken'
import {
  BaseWrapper,
  proxyCall,
  proxySend,
  stringIdentity,
  tupleParser,
  valueToBigNumber,
  valueToInt,
  valueToString,
} from './BaseWrapper'

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
  allowance = proxyCall(this.contract.methods.allowance, undefined, valueToBigNumber)

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
  decimals = proxyCall(this.contract.methods.decimals, undefined, valueToInt)

  /**
   * Returns the total supply of the token, that is, the amount of tokens currently minted.
   * @returns Total supply.
   */
  totalSupply = proxyCall(this.contract.methods.totalSupply, undefined, valueToBigNumber)

  /**
   * Approve a user to transfer CELO on behalf of another user.
   * @param spender The address which is being approved to spend CELO.
   * @param value The amount of CELO approved to the spender.
   * @return True if the transaction succeeds.
   */
  approve = proxySend(this.kit, this.contract.methods.approve)
  /**
   * Increases the allowance of another user.
   * @param spender The address which is being approved to spend CELO.
   * @param value The increment of the amount of CELO approved to the spender.
   * @returns true if success.
   */
  increaseAllowance = proxySend(
    this.kit,
    this.contract.methods.increaseAllowance,
    tupleParser(stringIdentity, valueToString)
  )
  /**
   * Decreases the allowance of another user.
   * @param spender The address which is being approved to spend CELO.
   * @param value The decrement of the amount of CELO approved to the spender.
   * @returns true if success.
   */
  decreaseAllowance = proxySend(this.kit, this.contract.methods.decreaseAllowance)

  /**
   * Transfers CELO from one address to another with a comment.
   * @param to The address to transfer CELO to.
   * @param value The amount of CELO to transfer.
   * @param comment The transfer comment
   * @return True if the transaction succeeds.
   */
  transferWithComment = proxySend(this.kit, this.contract.methods.transferWithComment)

  /**
   * Transfers CELO from one address to another.
   * @param to The address to transfer CELO to.
   * @param value The amount of CELO to transfer.
   * @return True if the transaction succeeds.
   */
  transfer = proxySend(this.kit, this.contract.methods.transfer)

  /**
   * Transfers CELO from one address to another on behalf of a user.
   * @param from The address to transfer CELO from.
   * @param to The address to transfer CELO to.
   * @param value The amount of CELO to transfer.
   * @return True if the transaction succeeds.
   */
  transferFrom = proxySend(this.kit, this.contract.methods.transferFrom)

  /**
   * Gets the balance of the specified address.
   * @param owner The address to query the balance of.
   * @return The balance of the specified address.
   */
  balanceOf = (account: Address) =>
    this.kit.connection.web3.eth.getBalance(account).then(valueToBigNumber)
  /* WARNING: The actual call to the Gold contract of the balanceOf:
   * `balanceOf = proxyCall(this.contract.methods.balanceOf, undefined, valueToBigNumber)`
   * has issues with web3. Keep the one calling getBalance
   */
}
