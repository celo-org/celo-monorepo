pragma solidity ^0.5.13;

import "../../../contracts-0.8/common/IsL2Check.sol";

/**
 * @title Holds a list of addresses of validators
 */
contract MockElection is IsL2Check {
  mapping(address => bool) public isIneligible;
  mapping(address => bool) public isEligible;
  mapping(address => bool) public allowedToVoteOverMaxNumberOfGroups;
  address[] public electedValidators;
  uint256 active;
  uint256 total;

  function markGroupIneligible(address account) external {
    isIneligible[account] = true;
  }

  function markGroupEligible(address account, address, address) external onlyL1 {
    isEligible[account] = true;
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

  function vote(address, uint256, address, address) external onlyL1 returns (bool) {
    return true;
  }

  function activate(address) external onlyL1 returns (bool) {
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

  function getTotalVotes() external view returns (uint256) {
    return total;
  }

  function getActiveVotes() external view returns (uint256) {
    return active;
  }

  function getTotalVotesByAccount(address) external view returns (uint256) {
    return 0;
  }

  function electValidatorSigners() external view returns (address[] memory) {
    return electedValidators;
  }

  function setAllowedToVoteOverMaxNumberOfGroups(address account, bool flag) public onlyL1 {
    allowedToVoteOverMaxNumberOfGroups[account] = flag;
  }
}
