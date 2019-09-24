pragma solidity ^0.5.3;

import "../interfaces/ILockedGold.sol";


 /**
 * @title A mock LockedGold for testing.
 */
contract MockLockedGold is ILockedGold {
  struct MustMaintain {
    uint256 value;
    uint256 timestamp;
  }

  mapping(address => uint256) public totalLockedGold;
  // TODO(asa): Rename to minimumBalance
  mapping(address => MustMaintain) public mustMaintain;


  function getAccountFromValidator(address accountOrValidator) external view returns (address) {
    return accountOrValidator;
  }

  function getAccountFromVoter(address accountOrVoter) external view returns (address) {
    return accountOrVoter;
  }

  function getValidatorFromAccount(address account) external view returns (address) {
    return account;
  }

  function incrementNonvotingAccountBalance(address, uint256) external {}
  function decrementNonvotingAccountBalance(address, uint256) external {}

  function setAccountMustMaintain(address account, uint256 value, uint256 timestamp) external returns (bool) {
    mustMaintain[account] = MustMaintain(value, timestamp);
    return true;
  }

  function getAccountMustMaintain(address account) external view returns (uint256, uint256) {
    MustMaintain storage m = mustMaintain[account];
    return (m.value, m.timestamp);
  }

  function setAccountTotalLockedGold(address account, uint256 value) external {
    totalLockedGold[account] = value;
  }

  function getAccountTotalLockedGold(address account) external view returns (uint256) {
    return totalLockedGold[account];
  }

  function getTotalLockedGold() external view returns (uint256) {
    return 0;
  }
}
