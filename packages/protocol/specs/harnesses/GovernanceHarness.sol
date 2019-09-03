pragma solidity ^0.5.8;

import "contracts/governance/Governance.sol";

contract GovernanceHarness is Governance {

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
		IBondedDeposits bondedDeposits = IBondedDeposits(registry.getAddressFor(BONDED_DEPOSITS_REGISTRY_ID));
		return bondedDeposits.getTotalWeight();
	}
	
	function _getVoterFromAccount(address account) public view returns (address) {
		IBondedDeposits bondedDeposits = IBondedDeposits(registry.getAddressFor(BONDED_DEPOSITS_REGISTRY_ID));
		return bondedDeposits.getVoterFromAccount(account); 
	}
	
	function getAccountFromVoter(address voter) public view returns (address) {
		IBondedDeposits bondedDeposits = IBondedDeposits(registry.getAddressFor(BONDED_DEPOSITS_REGISTRY_ID));
		return bondedDeposits.getAccountFromVoter(voter);
	}
	
	// overriding get account weight
	/*function getAccountWeight(address account) public view returns (uint256) {
		IBondedDeposits bondedDeposits = IBondedDeposits(registry.getAddressFor(BONDED_DEPOSITS_REGISTRY_ID));
		return bondedDeposits.getAccountWeight(account);
	}*/
}