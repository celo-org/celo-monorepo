pragma solidity ^0.5.13;

import "../common/MultiSig.sol";

/* solhint-disable no-empty-blocks */
contract GovernanceApproverMultiSig is MultiSig {
  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public MultiSig(test) {}
}
