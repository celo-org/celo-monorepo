pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "contracts/governance/LockedGold.sol";
import "./GoldTokenHarness.sol";

contract LockedGoldHarness is LockedGold {
  using SafeMath for uint256;

  GoldTokenHarness goldToken;

  /* solhint-disable-next-line no-empty-blocks */
  function init_state() public {}

  function ercBalanceOf(address a) public returns (uint256) {
    return a.balance;
  }

  function getPendingWithdrawalsIndex(address account, uint256 index) public returns (uint256) {
    require(getAccounts().isAccount(account), "Unknown account");
    require(
      index < balances[account].pendingWithdrawals.length,
      "Index cannot exceed pending withdrawals length"
    );
    return balances[account].pendingWithdrawals[index].value;
  }

  function getunlockingPeriod() public returns (uint256) {
    return unlockingPeriod;
  }

  function getTotalPendingWithdrawals(address account) public view returns (uint256) {
    require(getAccounts().isAccount(account), "Unknown account");
    uint256 length = balances[account].pendingWithdrawals.length;
    uint256 total = 0;
    for (uint256 i = 0; i < length; i.add(1)) {
      uint256 pendingValue = balances[account].pendingWithdrawals[i].value;
      require(total.add(pendingValue) >= total, "Pending value must be greater than 0");
      total = total.add(pendingValue);
    }
    return total;
  }

  function pendingWithdrawalsNotFull(address account) public view returns (bool) {
    return balances[account].pendingWithdrawals.length.add(2) >= 2; // we can add 2 more additional elements
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
