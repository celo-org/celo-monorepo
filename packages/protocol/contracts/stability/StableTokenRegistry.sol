pragma solidity ^0.5.13;

import "./StableTokenEUR.sol";
import "./StableToken.sol";
import "./StableTokenBRL.sol";

/**
 * @title contract that lists what stable coins are deployed as part of Celo's Stability protocol.
 */
contract StableTokenRegistry {
  mapping(string => string) public stableTokenRegistry;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}
}
