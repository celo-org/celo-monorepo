pragma solidity ^0.5.3;

import "../interfaces/IElection.sol";

/**
 * @title Holds a list of addresses of validators
 */
contract MockElection is IElection {
  mapping(address => bool) public isIneligible;
  mapping(address => bool) public isEligible;
  address[] public electedValidators;
  uint256 active;
  uint256 total;

  function markGroupIneligible(address account) external {
    isIneligible[account] = true;
  }

  function markGroupEligible(address account, address, address) external {
    isEligible[account] = true;
  }

  function getTotalVotes() external view returns (uint256) {
    return total;
  }

  function getActiveVotes() external view returns (uint256) {
    return active;
  }

  function getTotalVotesByAccount(address) external view returns (uint256) {
    return 0;
  }

  function setActiveVotes(uint256 value) external {
    active = value;
  }

  function setTotalVotes(uint256 value) external {
    total = value;
  }

  function setElectedValidators(address[] calldata _electedValidators) external {
    electedValidators = _electedValidators;
  }

  function electValidatorSigners() external view returns (address[] memory) {
    return electedValidators;
  }

  function vote(address group, uint256 value, address lesser, address greater)
    external
    returns (bool)
  {
    return true;
  }

  function activate(address group) external returns (bool) {
    return true;
  }

  function revokeActive(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  ) external returns (bool) {
    return true;
  }

  function revokePending(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  ) external returns (bool) {
    return true;
  }
}
