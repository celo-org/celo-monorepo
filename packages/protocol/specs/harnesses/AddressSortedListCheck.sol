pragma solidity ^0.5.8;

import "contracts/common/linkedlists/AddressSortedLinkedList.sol";

contract AddressSortedListCheck {
	using AddressSortedLinkedList for SortedLinkedList.List;
	
	SortedLinkedList.List l;
	
	function toBytes(address a) public pure returns (bytes32) { // not sure why won't import?
		return bytes32(uint256(a) << 96);
	}
	
	function toAddress(bytes32 b) public pure returns (address) {
		return address(uint256(b) >> 96);
	}
  
	function getElementLesser(uint256 k) public view returns (uint256) {
		require (k < 2**160);
		bytes32 int_result = l.list.elements[toBytes(address(k))].previousKey;
		address result = toAddress(int_result);
		require (toBytes(result) == int_result);
		return uint256(result);
	}
	
	function getElementGreater(uint256 k) public view returns (uint256) {
		require (k < 2**160);
		bytes32 int_result = l.list.elements[toBytes(address(k))].nextKey;
		address result = toAddress(int_result);
		require (toBytes(result) == int_result);
		return uint256(result);
	}
	
	function getNumElements() public view returns (uint256) {
		return l.list.numElements;
	}
	
	function getTail() public view returns (uint256) {
		bytes32 int_result = l.list.tail;
		address result = toAddress(int_result);
		require (toBytes(result) == int_result);
		return uint256(result);
	}
	
	function getHead() public view returns (uint256) {
		bytes32 int_result = l.list.head;
		address result = toAddress(int_result);
		require (toBytes(result) == int_result);
		return uint256(result);
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