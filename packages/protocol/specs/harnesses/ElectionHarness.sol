pragma solidity ^0.5.8;
import "contracts/governance/Election.sol";
import "specs/harnesses/LockedGoldHarness.sol";
contract ElectionHarness is Election {

	LockedGoldHarness lockedGold;
	
	function getLockedGold() internal view returns (ILockedGold) {
		return lockedGold;
	}
  
	function init_state() public {  }

	function ercBalanceOf(address a) public returns (uint256){
		return a.balance;
	}

	
	function getAccountNonvotingLockedGold(address account) public returns (uint256) {
		return lockedGold.getAccountNonvotingLockedGold(account);
	}
	
	function getTotalPendingWithdrawals(address account) public  returns (uint256) {
		return lockedGold.getTotalPendingWithdrawals(account);
	}
	
		
	function getPendingWithdrawalsLength(address account)
    external
    view
    returns (uint256)
	{
		return lockedGold.getPendingWithdrawalsLength(account);
	}
  
  /*function getElectableValidators() public view returns (uint256, uint256) {
    return (electableValidators.min, electableValidators.max);
  }*/
  
	function getPendingVotes(address group, address account) public returns (uint256) {
		PendingVotes storage pending = votes.pending;
		GroupPendingVotes storage groupPending = pending.forGroup[group];
		PendingVote storage pendingVote = groupPending.byAccount[account];
		return pendingVote.value;
	}
	
	
	function getTotalElectionPendingVotes(address account) public returns (uint256) {
		address[] memory groups = votes.groupsVotedFor[account];
		uint256 total;
		for (uint256 i = 0; i < groups.length; i = i.add(1)) {
			total += getPendingVotes(groups[i], account);
		}
		return total;
	}
	
  
	function unlock(uint256 value) public  {
		lockedGold.unlock(value);
	}
  
	function relock(uint256 index, uint256 value) external  {
		lockedGold.relock(index,value);
	}
	
	function withdraw(uint256 index) external  {
		lockedGold.withdraw(index);
	}
  
	function electValidatorSignersLength() external view returns (uint256) {
		
		address[] memory res = this.electValidatorSigners();
		return res.length;
	}


	function electValidatorSignersTwoResults() external view returns (address,address) {	
		 address[] memory res = this.electValidatorSigners();
		if (res.length > 1) {
			return (res[0],res[1]);
			}
		else { 
			return (address(0) ,address(0));
			}
	}
	
	function userVotedFor(address account,address group) external view returns (bool) {
    uint256 total = 0;
    address[] memory groups = votes.groupsVotedFor[account];
	for (uint256 i = 0; i < groups.length; i = i.add(1)) {
      if (groups[i] == group) {
		return true;
		}
	}
	return false;
		
	}
	
	
	address[]  public electionGroups;
	uint256[]  public numMembers;
	uint256[] public numMembersElected = new uint256[](2000);
	function dHondWrapper(uint256 numGroups) public returns (uint256, bool)   {
		return dHondt(electionGroups, numMembers, numMembersElected);
	}
	
	function getNumMembers(uint256 groupId) public returns (uint256) {
		return numMembers[groupId];
	}
	
	function getNumMembersElected(uint256 groupId) public returns (uint256) {
		return numMembersElected[groupId];
	}
	
	function groupInGhostElectionGroups(address groupId) public returns (bool) {
		for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
			if (electionGroups[i]==groupId)
				return true;
			
		}
		return false;
	}
	
	function groupInElectionGroups(address groupId) public returns (bool) {

		return votes.total.eligible.contains(groupId);
	}
	
	
}

