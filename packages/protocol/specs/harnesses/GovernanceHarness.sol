pragma solidity ^0.5.8;

import "contracts/governance/Governance.sol";

contract GovernanceHarness is Governance {

	function getDequeuedLength() public view returns (uint256) {
		return dequeued.length;
	}
	
	function getFromDequeued(uint256 index) public view returns (uint256) {
		return dequeued[index];
	}
}