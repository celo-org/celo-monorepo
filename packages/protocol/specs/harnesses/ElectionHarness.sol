pragma solidity ^0.5.8;
import "contracts/governance/Election.sol";
import "contracts/common/Accounts.sol";
import "specs/harnesses/LockedGoldHarness.sol";

contract ElectionHarness is Election {
  LockedGoldHarness lockedGold;
  Accounts accounts;

// for using invariants - must have this function that simulates the constructure  
  function init_state() public {}

/*** override the getters for the other contracts so we can link to the contract ****/
  function getLockedGold() internal view returns (ILockedGold) {
    return lockedGold;
  }
  
  function getAccounts() internal view returns (IAccounts) {
	return accounts;
  }
  
  //wrapper for account functionality 
  function isAccount(address account) public view returns (bool) {
    return accounts.isAccount(account);
  }

  

/*** getters for the voting structures ****/
  function getPendingVotes(address group, address account) public returns (uint256) {
    PendingVotes storage pending = votes.pending;
    GroupPendingVotes storage groupPending = pending.forGroup[group];
    PendingVote storage pendingVote = groupPending.byAccount[account];
    return pendingVote.value;
  }
  
  function getActiveVotesForGroupByAccountRAW(address group, address account ) public returns (uint256) {
    ActiveVotes storage active = votes.active;
    GroupActiveVotes storage groupActive = active.forGroup[group];
    return groupActive.unitsByAccount[account];
  }

  function getTotalElectionPendingVotes(address account) public returns (uint256) {
    address[] memory groups = votes.groupsVotedFor[account];
    uint256 total;
    for (uint256 i = 0; i < groups.length; i = i.add(1)) {
      total += getPendingVotes(groups[i], account);
    }
    return total;
  }
  
  function getTotalElectionPendingVotesForGroup(address group) public view returns (uint256) {
    return votes.pending.forGroup[group].total;
  }
  
    
  function getTotalElectionActiveVotesForGroup(address group) public view returns (uint256) {
    return votes.active.forGroup[group].total;
  }
  
  function getTotalUnitsVotingForGroup(address group) public view returns (uint256) {
    return votes.active.forGroup[group].totalUnits;
  }
  

  function unlock(uint256 value) public {
    lockedGold.unlock(value);
  }

  function relock(uint256 index, uint256 value) external {
    lockedGold.relock(index, value);
  }

  function withdraw(uint256 index) external {
    lockedGold.withdraw(index);
  }

  function electValidatorSignersLength() external view returns (uint256) {
    address[] memory res = this.electValidatorSigners();
    return res.length;
  }

  function electValidatorSignersTwoResults() external view returns (address, address) {
    address[] memory res = this.electValidatorSigners();
    if (res.length > 1) {
      return (res[0], res[1]);
    } else {
      return (address(0), address(0));
    }
  }

  function userVotedFor(address account, address group) external view returns (bool) {
    uint256 total = 0;
    address[] memory groups = votes.groupsVotedFor[account];
    for (uint256 i = 0; i < groups.length; i = i.add(1)) {
      if (groups[i] == group) {
        return true;
      }
    }
    return false;

  }
  
  /* a wrapper for dHondt algorithm
  need to use global arrays and also access them for assuming certain properties 
  */
  address[] internal electionGroups;
  uint256[] internal numMembers;
  uint256[] internal numMembersElected;
  uint256  internal totalNumMembersElected;
  function dHondtWrapper() public returns (uint256, bool) {
    require (numMembersElected.length == electionGroups.length); // This looks like an invariant of the original calls to dHondt()
    return dHondt(electionGroups, numMembers, totalNumMembersElected, numMembersElected);
  }

  function getNumGroups() public returns (uint256) {
    return electionGroups.length;
  }
  function getNumMembers(uint256 groupId) public returns (uint256) {
    return numMembers[groupId];
  }

  function getNumMembersElected(uint256 groupId) public returns (uint256) {
    return numMembersElected[groupId];
  }

  function groupInGhostElectionGroups(address group) public returns (bool) {
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
      if (electionGroups[i] == group) return true;

    }
    return false;
  }

  function getGroupIdInElection(address group) public returns (uint256) {
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
      if (electionGroups[i] == group) return i;

    }
    assert(false);
  }

  function getGroupFromGroupId(uint256 groupId) public returns (address) {
    return electionGroups[groupId];
  }
  
  
	// access to the eligible groups  link list 
  function groupInElectionGroups(address groupId) public returns (bool) {
    return votes.total.eligible.contains(groupId);
  }

  function votesForGroup(address groupId) public returns (uint256) {
    return votes.total.eligible.getValue(groupId);
  }
}
