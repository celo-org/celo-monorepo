pragma solidity ^0.5.3;

import "../interfaces/IElection.sol";

/**
 * @title Holds a list of addresses of validators
 */
contract MockElection is IElection {

  mapping(address => bool) public isIneligible;

  function markGroupIneligible(address account) external {
    isIneligible[account] = true;
  }

  function getTotalVotes() external view returns (uint256) {
    return 0;
  }

  function getAccountTotalVotes(address) external view returns (uint256) {
    return 0;
  }

  function electValidators() external view returns (address[] memory) {
    address[] memory r = new address[](0);
    return r;
  }
}
