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

  function vote(address, uint256, address, address) external returns (bool) {
    return true;
  }

  function activate(address) external returns (bool) {
    return true;
  }

  function revokeAllActive(address, address, address, uint256) external returns (bool) {
    return true;
  }

  function revokeActive(address, uint256, address, address, uint256) external returns (bool) {
    return true;
  }

  function revokePending(address, uint256, address, address, uint256) external returns (bool) {
    return true;
  }

  function forceDecrementVotes(
    address,
    uint256 value,
    address[] calldata,
    address[] calldata,
    uint256[] calldata
  ) external returns (uint256) {
    this.setActiveVotes(this.getActiveVotes() - value);
    return value;
  }
}
