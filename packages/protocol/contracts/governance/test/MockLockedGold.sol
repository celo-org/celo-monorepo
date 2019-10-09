pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../interfaces/ILockedGold.sol";


 /**
 * @title A mock LockedGold for testing.
 */
// TODO(asa): Use ILockedGold interface.
contract MockLockedGold {

  using SafeMath for uint256;

  struct MustMaintain {
    uint256 value;
    uint256 timestamp;
  }

  struct Authorizations {
    address validator;
    address voter;
  }

  mapping(address => uint256) public accountTotalLockedGold;
  // TODO(asa): Rename to minimumBalance
  mapping(address => MustMaintain) public mustMaintain;
  mapping(address => uint256) public nonvotingAccountBalance;
  mapping(address => address) public authorizedValidators;
  uint256 private totalLockedGold;

  function authorizeValidator(address account, address validator) external {
    authorizedValidators[account] = validator;
  }

  function getAccountFromValidator(address accountOrValidator) external pure returns (address) {
    return accountOrValidator;
  }

  function getAccountFromActiveValidator(address accountOrValidator) external pure returns (address) {
    return accountOrValidator;
  }

  function getAccountFromActiveVoter(address accountOrVoter) external pure returns (address) {
    return accountOrVoter;
  }

  function getValidatorFromAccount(address account) external view returns (address) {
    address authorizedValidator = authorizedValidators[account];
    return authorizedValidator == address(0) ? account : authorizedValidator;
  }

  function incrementNonvotingAccountBalance(address account, uint256 value) external {
    nonvotingAccountBalance[account] = nonvotingAccountBalance[account].add(value);
  }

  function decrementNonvotingAccountBalance(address account, uint256 value) external {
    nonvotingAccountBalance[account] = nonvotingAccountBalance[account].sub(value);
  }

  function setAccountMustMaintain(
    address account,
    uint256 value,
    uint256 timestamp
  )
    external
    returns (bool)
  {
    mustMaintain[account] = MustMaintain(value, timestamp);
    return true;
  }

  function getAccountMustMaintain(address account) external view returns (uint256, uint256) {
    MustMaintain storage m = mustMaintain[account];
    return (m.value, m.timestamp);
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
}
