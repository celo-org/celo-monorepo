// NOTE: removing this import results in `yarn build` failures in Dockerfiles
// after the move to node 10. This allows types to be inferred without
// referencing '@celo/utils/node_modules/bignumber.js'
import BigNumber from 'bignumber.js'
import { Ierc20 } from '../generated/IERC20'
import { BaseWrapper, proxyCall, proxySend, valueToBigNumber } from './BaseWrapper'

/**
 * ERC-20 contract only containing the non-optional functions
 */
export class Erc20Wrapper<T extends Ierc20> extends BaseWrapper<T> {
  /**
   * Querying allowance.
   * @param from Account who has given the allowance.
   * @param to Address of account to whom the allowance was given.
   * @returns Amount of allowance.
   */
  allowance = proxyCall(this.contract.methods.allowance, undefined, valueToBigNumber)

  /**
   * Returns the total supply of the token, that is, the amount of tokens currently minted.
   * @returns Total supply.
   */
  totalSupply = proxyCall(this.contract.methods.totalSupply, undefined, valueToBigNumber)

  /**
   * Approve a user to transfer the token on behalf of another user.
   * @param spender The address which is being approved to spend the token.
   * @param value The amount of the token approved to the spender.
   * @return True if the transaction succeeds.
   */
  approve = proxySend(this.connection, this.contract.methods.approve)

  /**
   * Transfers the token from one address to another.
   * @param to The address to transfer the token to.
   * @param value The amount of the token to transfer.
   * @return True if the transaction succeeds.
   */
  transfer = proxySend(this.connection, this.contract.methods.transfer)

  /**
   * Transfers the token from one address to another on behalf of a user.
   * @param from The address to transfer the token from.
   * @param to The address to transfer the token to.
   * @param value The amount of the token to transfer.
   * @return True if the transaction succeeds.
   */
  transferFrom = proxySend(this.connection, this.contract.methods.transferFrom)

  /**
   * Gets the balance of the specified address.
   * @param owner The address to query the balance of.
   * @return The balance of the specified address.
   */
  balanceOf: (owner: string) => Promise<BigNumber> = proxyCall(
    this.contract.methods.balanceOf,
    undefined,
    valueToBigNumber
  )
}

export type Erc20WrapperType<T extends Ierc20> = Erc20Wrapper<T>
