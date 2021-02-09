pragma solidity ^0.5.13;

import "../common/MultiSig.sol";

contract ReserveSpenderMultiSig is MultiSig {
  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization for tests that use contracts un-proxied.
   */
  constructor(bool test) public MultiSig(test) {}
}
