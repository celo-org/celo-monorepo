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
  mapping(address => MustMaintain) public mustMaintain;


  function getAccountFromValidator(address accountOrValidator) external view returns (address) {
    return accountOrValidator;
  }

  function setAccountMustMaintain(address account, uint256 value, uint256 timestamp) external {
    mustMaintain[account] = MustMaintain(value, timestamp);
  }

  function getAccountMustMaintain(address account) external view returns (uint256, uint256) {
    MustMaintain storage mustMaintain = mustMaintain[account];
    return (mustMaintain.value, mustMaintain.timestamp);
  }

  function setAccountTotalLockedGold(address account, uint256 value) external {
    totalLockedGold[account] = value;
  }

  function getAccountTotalLockedGold(address account) external view returns (uint256) {
    return totalLockedGold[account];
  }
}
