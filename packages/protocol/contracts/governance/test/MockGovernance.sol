pragma solidity ^0.5.3;


/**
 * @title A mock Governance for testing.
 */
contract MockGovernance {
  mapping(address => bool) public isVoting;

  function setVoting(address voter) external {
    isVoting[voter] = true;
  }
}
