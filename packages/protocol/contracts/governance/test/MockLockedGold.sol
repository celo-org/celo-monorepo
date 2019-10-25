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

  function authorizeValidator(address account, address validator) external {
    authorizedValidators[account] = validator;
    authorizedBy[validator] = account;
  }

  function getAccountFromValidator(address accountOrValidator) external view returns (address) {
    if (authorizedBy[accountOrValidator] == address(0)) {
      return accountOrValidator;
    } else {
      return authorizedBy[accountOrValidator];
    }
  }

  function getAccountFromActiveValidator(
    address accountOrValidator
  )
    external
    view
    returns (address)
  {
    return accountOrValidator;
  }

  function getAccountFromActiveVoter(address accountOrVoter) external view returns (address) {
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
