pragma solidity ^0.5.3;

import "../interfaces/IElection.sol";

/**
 * @title Holds a list of addresses of validators
 */
contract MockElection is IElection {

  mapping(address => bool) public isIneligible;
  address[] public electedValidators;

  function markGroupIneligible(address account) external {
    isIneligible[account] = true;
  }

  function getTotalVotes() external view returns (uint256) {
    return 0;
  }

  function getTotalVotesByAccount(address) external view returns (uint256) {
    return 0;
  }

  function setElectedValidators(address[] calldata _electedValidators) external {
    electedValidators = _electedValidators;
  }

  function electValidators() external view returns (address[] memory) {
    return electedValidators;
  }
}
