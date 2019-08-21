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
		return VoteValue.None;
	}
	function getAbstainVoteEnum() public pure returns (uint256) {
		return VoteValue.Abstain;
	}
	function getYesVoteEnum() public pure returns (uint256) {
		return VoteValue.Yes;
	}
	function getNoVoteEnum() public pure returns (uint256) {
		return VoteValue.No;
	}
	
	
	// requires linkage of registry
	function _getTotalWeightFromBondedDeposits(address account) public view returns (bool) {
		IBondedDeposits bondedDeposits = IValidators(registry.getAddressFor(BONDED_DEPOSITS_REGISTRY_ID));
		return bondedDeposits.getTotalWeight(account);
	}
}