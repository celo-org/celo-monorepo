pragma solidity ^0.5.13;

import "../linkedlists/AddressSortedLinkedListWithMedian.sol";
import "../linkedlists/SortedLinkedListWithMedian.sol";

contract AddressSortedLinkedListWithMedianTest {
  using AddressSortedLinkedListWithMedian for SortedLinkedListWithMedian.List;

  SortedLinkedListWithMedian.List private list;

  function insert(address key, uint256 numerator, address lesserKey, address greaterKey) external {
    list.insert(key, numerator, lesserKey, greaterKey);
  }

  function update(address key, uint256 numerator, address lesserKey, address greaterKey) external {
    list.update(key, numerator, lesserKey, greaterKey);
  }

  function remove(address key) external {
    list.remove(key);
  }

  function contains(address key) external view returns (bool) {
    return list.contains(key);
  }

  function getNumElements() external view returns (uint256) {
    return list.getNumElements();
  }

  function getElements()
    external
    view
    returns (address[] memory, uint256[] memory, SortedLinkedListWithMedian.MedianRelation[] memory)
  {
    return list.getElements();
  }

  function head() external view returns (address) {
    return list.getHead();
  }

  function tail() external view returns (address) {
    return list.getTail();
  }

  function medianKey() external view returns (address) {
    return list.getMedian();
  }
}
