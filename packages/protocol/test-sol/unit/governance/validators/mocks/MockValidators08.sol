// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

/**
 * @title MockValidators08
 * @notice Minimal 0.8-compatible mock for Validators, used by slasher unit tests.
 * Only implements the methods called by the slasher test setup.
 */
contract MockValidators08 {
  mapping(address => address) public affiliations;

  function affiliate(address group) external returns (bool) {
    affiliations[msg.sender] = group;
    return true;
  }

  function isValidator(address) external pure returns (bool) {
    return false;
  }

  function isValidatorGroup(address) external pure returns (bool) {
    return false;
  }

  function updateEcdsaPublicKey(address, address, bytes calldata) external pure returns (bool) {
    return true;
  }

  function getMembershipInLastEpoch(address) external pure returns (address) {
    return address(0);
  }

  function getGroupsWithLessors(address, address) external pure returns (address[] memory, address[] memory) {
    address[] memory a = new address[](0);
    return (a, a);
  }
}
