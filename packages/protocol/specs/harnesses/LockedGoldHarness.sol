pragma solidity ^0.5.8;

import "contracts/governance/LockedGold.sol";


contract LockedGoldHarness is LockedGold {

	function init_state() public {  }

	function ercBalanceOf(address a) public returns (uint256){
		return a.balance;
	}

	function getPendingWithdrawalsIndex(address account, uint256 index )
    public  returns (uint256)
  {
    require(getAccounts().isAccount(account));
    require( index <balances[account].pendingWithdrawals.length);
    return balances[account].pendingWithdrawals[index].value;
    
  }
  
	function getunlockingPeriod() public returns (uint256) {
		return unlockingPeriod;
	}
  
    function getTotalPendingWithdrawals(address account)
    public
    view
    returns (uint256)
  {
    require(getAccounts().isAccount(account));
    uint256 length = balances[account].pendingWithdrawals.length;
	uint256 total = 0;
    for (uint256 i = 0; i < length; i++) {
      PendingWithdrawal memory pendingWithdrawal = (
        balances[account].pendingWithdrawals[i]
      );
      total  =  total + pendingWithdrawal.value;
    }
    return total;
  }
  
   function getPendingWithdrawalsLength(address account)
    external
    view
    returns (uint256)
  {
    uint256 length = balances[account].pendingWithdrawals.length;
	return length;
	}
  
}

