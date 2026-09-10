// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts/governance/interfaces/ILockedGold.sol";

/**
 * @title MockLockedGold08
 * @notice 0.8-compatible mock for LockedGold, ported from contracts/governance/test/MockLockedGold.sol.
 */
contract MockLockedGold08 is ILockedGold {
  mapping(address => uint256) public accountTotalLockedGold;
  mapping(address => uint256) public nonvotingAccountBalance;
  mapping(address => address) public authorizedValidators;
  mapping(address => address) public authorizedBy;
  uint256 private totalLockedGold;
  mapping(string => bool) public slashingWhitelist;
  mapping(address => bool) public slashingWhitelistTest;
  mapping(address => uint256) public totalGovernancePower;
  mapping(address => uint256) public accountTotalDelegatedAmountInPercents;

  function incrementNonvotingAccountBalance(address account, uint256 value) external {
    nonvotingAccountBalance[account] = nonvotingAccountBalance[account] + value;
  }

  function setAccountTotalLockedGold(address account, uint256 value) external {
    accountTotalLockedGold[account] = value;
  }

  function setAccountTotalDelegatedAmountInPercents(address account, uint256 value) external {
    accountTotalDelegatedAmountInPercents[account] = value;
  }

  function setAccountTotalGovernancePower(address account, uint256 value) external {
    totalGovernancePower[account] = value;
  }

  function setTotalLockedGold(uint256 value) external {
    totalLockedGold = value;
  }

  function lock() external payable {
    accountTotalLockedGold[msg.sender] = accountTotalLockedGold[msg.sender] + msg.value;
  }

  function unlock(uint256 value) external {
    accountTotalLockedGold[msg.sender] = accountTotalLockedGold[msg.sender] - value;
  }

  function relock(uint256, uint256) external {
    // not needed
  }

  function withdraw(uint256) external {
    // not needed
  }

  function slash(
    address account,
    uint256 penalty,
    address,
    uint256,
    address[] calldata,
    address[] calldata,
    uint256[] calldata
  ) external {
    accountTotalLockedGold[account] = accountTotalLockedGold[account] - penalty;
  }

  function addSlasherTest(address slasher) external {
    slashingWhitelistTest[slasher] = true;
  }

  function removeSlasherTest(address slasher) external {
    slashingWhitelistTest[slasher] = false;
  }

  function addSlasher(string calldata slasherIdentifier) external {
    slashingWhitelist[slasherIdentifier] = true;
  }

  function removeSlasher(string calldata slasherIdentifier) external {
    slashingWhitelist[slasherIdentifier] = false;
  }

  function getAccountTotalLockedGold(address account) external view returns (uint256) {
    return accountTotalLockedGold[account];
  }

  function getTotalLockedGold() external view returns (uint256) {
    return totalLockedGold;
  }

  function isSlasher(address slasher) external view returns (bool) {
    return slashingWhitelistTest[slasher];
  }

  function getPendingWithdrawals(
    address
  ) external view returns (uint256[] memory, uint256[] memory) {
    uint256[] memory empty = new uint256[](0);
    return (empty, empty);
  }

  function getTotalPendingWithdrawals(address) external view returns (uint256) {
    return 0;
  }

  function getAccountTotalDelegatedFraction(address account) external view returns (uint256) {
    return accountTotalDelegatedAmountInPercents[account];
  }

  function getAccountTotalGovernanceVotingPower(address account) external view returns (uint256) {
    return totalGovernancePower[account];
  }

  function getPendingWithdrawal(address, uint256) external view returns (uint256, uint256) {
    return (0, 0);
  }

  function unlockingPeriod() external view returns (uint256) {
    return 0;
  }

  function getAccountNonvotingLockedGold(address) external view returns (uint256) {
    return 0;
  }

  function decrementNonvotingAccountBalance(address account, uint256 value) public {
    nonvotingAccountBalance[account] = nonvotingAccountBalance[account] - value;
  }
}
