pragma solidity ^0.5.3;

import "../interfaces/IGovernance.sol";

/**
 * @title A mock Governance for testing.
 */
contract MockGovernance is IGovernance {
  mapping(address => bool) public isVoting;

  function() external payable {} // solhint-disable no-empty-blocks

  function setVoting(address voter) external {
    isVoting[voter] = true;
  }
}
