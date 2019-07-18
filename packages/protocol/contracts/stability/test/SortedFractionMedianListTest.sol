pragma solidity ^0.5.8;

import "../SortedFractionMedianList.sol";


contract SortedFractionMedianListTest {
  using SortedFractionMedianList for SortedFractionMedianList.List;

  SortedFractionMedianList.List public list;

  function insert(
    address key,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    external
  {
    list.insert(key, numerator, denominator, lesserKey, greaterKey);
  }

  function update(
    address key,
    uint128 numerator,
    uint128 denominator,
    address lesserKey,
    address greaterKey
  )
    external
  {
    list.update(key, numerator, denominator, lesserKey, greaterKey);
  }

  function remove(address key) external {
    list.remove(key);
  }

  function contains(address key) external view returns (bool) {
    return list.contains(key);
  }

  function getNumElements() external view returns (uint256) {
    return list.numElements;
  }

  function getElements()
    external
    view
    returns (
        address[] memory, 
        uint256[] memory, 
        uint256[] memory, 
        SortedFractionMedianList.MedianRelation[] memory
    )
  {
    return list.getElements();
  }

  function head() external view returns (address) {
    return list.head;
  }

  function tail() external view returns (address) {
    return list.tail;
  }

  function medianKey() external view returns (address) {
    return list.medianKey;
  }
}
