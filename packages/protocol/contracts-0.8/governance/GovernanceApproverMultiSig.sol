// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../common/MultiSig.sol";

/* solhint-disable no-empty-blocks */
contract GovernanceApproverMultiSig is MultiSig {
  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public MultiSig(test) {}
}
