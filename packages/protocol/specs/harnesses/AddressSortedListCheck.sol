pragma solidity ^0.5.8;

import "contracts/governance/AddressSortedLinkedList.sol";

contract AddressSortedListCheck {
	using AddressSortedLinkedList for SortedLinkedList.List;
	
	SortedLinkedList.List l;
	
	function getElementLesser(uint256 k) public view returns (uint256) {
		require (k < 2**160);
		return uint256(l.list.elements[bytes32(k)].previousKey);
	}
	
	function getElementGreater(uint256 k) public view returns (uint256) {
		require (k < 2**160);
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
		require (key < 2**160);
		require (lesserKey < 2**160);
		require (greaterKey < 2**160);
		l.insert(address(key),value,address(lesserKey),address(greaterKey));
	}
	
	function remove(uint256 key) public {
		require (key < 2**160);
		l.remove(address(key));
	}
	
	function update(
		uint256 key,
		uint256 value,
		uint256 lesserKey,
		uint256 greaterKey
	) public {
		require (key < 2**160);
		require (lesserKey < 2**160);
		require (greaterKey < 2**160);
		l.update(address(key),value,address(lesserKey),address(greaterKey));
	}
	
	function contains(uint256 key) public returns (bool) {
		require (key < 2**160);
		return l.contains(address(key));
	}
	
	function getValue(uint256 key) public returns (uint256) {
		require (key < 2**160);
		return l.getValue(address(key));
	}
}