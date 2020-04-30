pragma solidity ^0.5.8;

import "contracts/governance/LockedGold.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "contracts/common/Accounts.sol";
import "./GoldTokenHarness.sol";

contract LockedGoldHarness is LockedGold {
  GoldTokenHarness goldToken;
  Accounts accounts;

  function init_state() public {}

  function getAccounts() internal view returns (IAccounts) {
    return accounts;
  }

  function ercBalanceOf(address a) public returns (uint256) {
    return a.balance;
  }

  function getPendingWithdrawalsIndex(address account, uint256 index)
    public
    view
    returns (uint256)
  {
    require(getAccounts().isAccount(account));
    require(index < balances[account].pendingWithdrawals.length);
    return balances[account].pendingWithdrawals[index].value;
  }

  function getunlockingPeriod() public returns (uint256) {
    return unlockingPeriod;
  }

  function isAccount(address a) public view returns (bool) {
    return getAccounts().isAccount(a);
  }

  function getTotalPendingWithdrawals(address account) public view returns (uint256) {
    //require(getAccounts().isAccount(account)); // TODO: Remove this requirement
    uint256 length = balances[account].pendingWithdrawals.length;
    uint256 total = 0;
    for (uint256 i = 0; i < length; i++) {
      uint256 pendingValue = balances[account].pendingWithdrawals[i].value;
      require(total + pendingValue >= total);
      total = total + pendingValue;
    }
    return total;
  }

  function pendingWithdrawalsNotFull(address account) public view returns (bool) {
    return balances[account].pendingWithdrawals.length + 2 >= 2; // we can add 2 more additional elements
  }

  function getPendingWithdrawalsLength(address account) external view returns (uint256) {
    uint256 length = balances[account].pendingWithdrawals.length;
    return length;
  }

  function getGoldToken() internal view returns (IERC20) {
    return IERC20(goldToken);
  }

  function getGoldTokenExt() public view returns (address) {
    return address(goldToken);
  }
}
