pragma solidity ^0.5.8;

import "contracts/governance/Governance.sol";
import "contracts/governance/Proposals.sol";

contract GovernanceHarness is Governance {
	using Proposals for Proposals.Proposal;
	
	function getDequeuedLength() public view returns (uint256) {
		return dequeued.length;
	}
	
	function getFromDequeued(uint256 index) public view returns (uint256) {
		return dequeued[index];
	}
	
	// VoteValue
	function getNoneVoteEnum() public pure returns (uint256) {
		return uint256(VoteValue.None);
	}
	function getAbstainVoteEnum() public pure returns (uint256) {
		return uint256(VoteValue.Abstain);
	}
	function getYesVoteEnum() public pure returns (uint256) {
		return uint256(VoteValue.Yes);
	}
	function getNoVoteEnum() public pure returns (uint256) {
		return uint256(VoteValue.No);
	}
	
	
	// requires linkage of registry
	// TODO: Note in the harness we assume already that getAddressFor always returns just the registry address
	function _getTotalWeightFromBondedDeposits() public view returns (uint256) {
		return getTotalWeight();
		//ILockedGold lockedGold = ILockedGold(registry.getAddressFor(LOCKED_GOLD_REGISTRY_ID));
		//return lockedGold.getTotalWeight();
	}
	
	function _getVoterFromAccount(address account) public view returns (address) {
		ILockedGold lockedGold = ILockedGold(registry.getAddressFor(LOCKED_GOLD_REGISTRY_ID));
		return lockedGold.getDelegateFromAccountAndRole(account, ILockedGold.DelegateRole.Voting); 
	}
	
	function getAccountFromVoter(address voter) public view returns (address) {
		ILockedGold lockedGold = ILockedGold(registry.getAddressFor(LOCKED_GOLD_REGISTRY_ID));
		return lockedGold.getAccountFromDelegateAndRole(voter, ILockedGold.DelegateRole.Voting);
	}
	
	// overriding get account weight
	/*function getAccountWeight(address account) public view returns (uint256) {
		ILockedGold lockedGold = ILockedGold(registry.getAddressFor(LOCKED_GOLD_REGISTRY_ID));
		return lockedGold.getAccountWeight(account);
	}*/
	
	// TODO: Fix
	function _isDequeuedProposalExpired(uint256 proposalId) public view returns (bool) { 
		Proposals.Proposal storage proposal = _getProposal(proposalId);
		Proposals.Stage stage = proposal.getDequeuedStage(stageDurations);
		return isDequeuedProposalExpired(proposal,stage);
	}
}