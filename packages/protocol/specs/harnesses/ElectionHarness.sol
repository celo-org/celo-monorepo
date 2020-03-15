pragma solidity ^0.5.8;
import "contracts/governance/Election.sol";
import "contracts/common/Accounts.sol";
import "specs/harnesses/LockedGoldHarness.sol";
contract ElectionHarness is Election {
  LockedGoldHarness lockedGold;
  Accounts accounts;

  function getLockedGold() internal view returns (ILockedGold) {
    return lockedGold;
  }
  
  function getAccount() internal view returns (Accounts) {
	return accounts;
  }

  function init_state() public {}

  function ercBalanceOf(address a) public returns (uint256) {
    return a.balance;
  }

  function getAccountNonvotingLockedGold(address account) public returns (uint256) {
    return lockedGold.getAccountNonvotingLockedGold(account);
  }

  function getTotalPendingWithdrawals(address account) public returns (uint256) {
    return lockedGold.getTotalPendingWithdrawals(account);
  }

  function getPendingWithdrawalsLength(address account) external view returns (uint256) {
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
  
  function getTotalElectionPendingVotesForGroup(address group) public view returns (uint256) {
    return votes.pending.forGroup[group].total;
  }
  
  
  function getTotalElectionActiveVotesForGroup(address group) public view returns (uint256) {
    return votes.active.forGroup[group].total;
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

  function groupInElectionGroups(address groupId) public returns (bool) {
    return votes.total.eligible.contains(groupId);
  }

  function votesForGroup(address groupId) public returns (uint256) {
    return votes.total.eligible.getValue(groupId);
  }
  
  // overriding to havoc more
  mapping (uint256 => mapping (uint256 => bytes32)) input_validatorSignerAddressFromCurrentSet;
  mapping (uint256 => mapping (uint256 => bytes32)) input_validatorSignerAddressFromSet;
   function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    bytes memory out;
    bool success;
    // let's not pack stuff and this will be easier on the solver
    bytes32 _input = input_validatorSignerAddressFromCurrentSet[index][block.number];
    bytes memory input = new bytes(32);
    assembly {
      mstore(add(input,32),_input)
    }
    (success, out) = GET_VALIDATOR.staticcall(input);
    require(success);
    return address(getUint256FromBytes(out, 0));
  }
  
  // TODO: Suggested Lucas to merge the two
    function validatorSignerAddressFromSet(uint256 index, uint256 blockNumber)
    public
    view
    returns (address)
  {
    bytes memory out;
    bool success;
     // let's not pack stuff and this will be easier on the solver
    bytes32 _input = input_validatorSignerAddressFromSet[index][blockNumber];
    bytes memory input = new bytes(32);
    assembly {
      mstore(add(input,32),_input)
    }
    (success, out) = GET_VALIDATOR.staticcall(input);
    require(success);
    return address(getUint256FromBytes(out, 0));
  }

mapping (uint256 => mapping (uint256 => mapping (uint256 => mapping (uint256 => mapping (uint256 => mapping (uint256 => bytes32)))))) input_fractionMulExp;
 function fractionMulExp(
    uint256 aNumerator,
    uint256 aDenominator,
    uint256 bNumerator,
    uint256 bDenominator,
    uint256 exponent,
    uint256 _decimals
  ) public view returns (uint256, uint256) {
    require(aDenominator != 0 && bDenominator != 0);
    uint256 returnNumerator;
    uint256 returnDenominator;
    bool success;
    bytes memory out;
    bytes32 _input = input_fractionMulExp[aNumerator][aDenominator][bNumerator][bDenominator][exponent][_decimals];
    bytes memory input = new bytes(32);
    assembly {
      mstore(add(input,32),_input)
    }
    (success, out) = FRACTION_MUL.staticcall(
      input
    );
    require(
      success,
      "UsingPrecompiles :: fractionMulExp Unsuccessful invocation of fraction exponent"
    );
    returnNumerator = getUint256FromBytes(out, 0);
    returnDenominator = getUint256FromBytes(out, 32);
    return (returnNumerator, returnDenominator);
  }
}
