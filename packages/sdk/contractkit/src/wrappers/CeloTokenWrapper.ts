// NOTE: removing this import results in `yarn build` failures in Dockerfiles
// after the move to node 10. This allows types to be inferred without
// referencing '@celo/utils/node_modules/bignumber.js'
import 'bignumber.js'
import { ICeloToken } from '../generated/ICeloToken'
import { Ierc20 } from '../generated/IERC20'
import { proxyCall, proxySend, valueToInt } from './BaseWrapper'
import { Erc20Wrapper } from './Erc20Wrapper'

/**
 * Contract for Celo native currency that adheres to the ICeloToken and IERC20 interfaces.
 */
export class CeloTokenWrapper<T extends Ierc20 & ICeloToken> extends Erc20Wrapper<T> {
  /**
   * Returns the name of the token.
   * @returns Name of the token.
   */
  name = proxyCall(this.contract.methods.name)

  /**
   * Returns the three letter symbol of the token.
   * @returns Symbol of the token.
   */
  symbol = proxyCall(this.contract.methods.symbol)
  /**
   * Returns the number of decimals used in the token.
   * @returns Number of decimals.
   */
  decimals = proxyCall(this.contract.methods.decimals, undefined, valueToInt)

  /**
   * Transfers the token from one address to another with a comment.
   * @param to The address to transfer the token to.
   * @param value The amount of the token to transfer.
   * @param comment The transfer comment
   * @return True if the transaction succeeds.
   */
  transferWithComment = proxySend(this.connection, this.contract.methods.transferWithComment)
}
