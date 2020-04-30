pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../interfaces/ILockedGold.sol";

/**
 * @title A mock LockedGold for testing.
 */
contract MockLockedGold is ILockedGold {
  using SafeMath for uint256;

  struct Authorizations {
    address validator;
    address voter;
  }

  mapping(address => uint256) public accountTotalLockedGold;
  mapping(address => uint256) public nonvotingAccountBalance;
  mapping(address => address) public authorizedValidators;
  mapping(address => address) public authorizedBy;
  uint256 private totalLockedGold;
  mapping(address => bool) public slashingWhitelist;

  function incrementNonvotingAccountBalance(address account, uint256 value) external {
    nonvotingAccountBalance[account] = nonvotingAccountBalance[account].add(value);
  }

  function decrementNonvotingAccountBalance(address account, uint256 value) public {
    nonvotingAccountBalance[account] = nonvotingAccountBalance[account].sub(value);
  }

  function setAccountTotalLockedGold(address account, uint256 value) external {
    accountTotalLockedGold[account] = value;
  }

  function getAccountTotalLockedGold(address account) external view returns (uint256) {
    return accountTotalLockedGold[account];
  }

  function setTotalLockedGold(uint256 value) external {
    totalLockedGold = value;
  }
  function getTotalLockedGold() external view returns (uint256) {
    return totalLockedGold;
  }

  function lock() external payable {
    accountTotalLockedGold[msg.sender] = accountTotalLockedGold[msg.sender].add(msg.value);
  }

  function unlock(uint256 value) external {
    accountTotalLockedGold[msg.sender] = accountTotalLockedGold[msg.sender].sub(value);
  }

  function relock(uint256 index, uint256 value) external {
    // TODO: add implementation if necessary to mock behaviour
  }

  function withdraw(uint256 index) external {
    // TODO: add implementation if necessary to mock behaviour
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
    accountTotalLockedGold[account] = accountTotalLockedGold[account].sub(penalty);
  }
  function addSlasher(address slasher) external {
    slashingWhitelist[slasher] = true;
  }
  function removeSlasher(address slasher) external {
    slashingWhitelist[slasher] = false;
  }
  function isSlasher(address slasher) external view returns (bool) {
    return slashingWhitelist[slasher];
  }

  function getPendingWithdrawals(address)
    external
    view
    returns (uint256[] memory, uint256[] memory)
  {
    uint256[] memory empty = new uint256[](0);
    return (empty, empty);
  }

  function getTotalPendingWithdrawals(address) external view returns (uint256) {
    return 0;
  }
}
