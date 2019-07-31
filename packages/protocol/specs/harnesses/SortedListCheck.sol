pragma solidity ^0.5.8;

import "contracts/governance/SortedLinkedList.sol";

contract SortedListCheck {
	using SortedLinkedList for SortedLinkedList.List;
	
	SortedLinkedList.List l;
	
	function getElementLesser(uint256 k) public view returns (uint256) {
		//require (l.list.elements[bytes32(k)].exists); // this one is dangerous, leaving as a lesson
		return uint256(l.list.elements[bytes32(k)].previousKey);
	}
	
	function getElementGreater(uint256 k) public view returns (uint256) {
		//require (l.list.elements[bytes32(k)].exists);
		return uint256(l.list.elements[bytes32(k)].nextKey);
	}
	
	function getNumElements() public view returns (uint256) {
		return l.list.numElements;
	}
	
	function getTail() public view returns (uint256) {
		return uint256(l.list.tail);
	}
	
	function getHead() public view returns (uint256) {
		return uint256(l.list.head);
	}
	
	function insert(
		uint256 key,
		uint256 value,
		uint256 lesserKey,
		uint256 greaterKey
	) public {
		l.insert(bytes32(key),value,bytes32(lesserKey),bytes32(greaterKey));
	}
	
	function remove(uint256 key) public {
		l.remove(bytes32(key));
	}
	
	function update(
		uint256 key,
		uint256 value,
		uint256 lesserKey,
		uint256 greaterKey
	) public {
		l.update(bytes32(key),value,bytes32(lesserKey),bytes32(greaterKey));
	}
	
	function contains(uint256 key) public returns (bool) {
		return l.contains(bytes32(key));
	}
	
	function getValue(uint256 key) public returns (uint256) {
		return l.getValue(bytes32(key));
	}
}