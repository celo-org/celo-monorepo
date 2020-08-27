pragma solidity ^0.5.3;

import "../Attestations.sol";

/*
 * We need a test contract that behaves like the actual Attestations contract,
 * but mocks the implementations of the validator set getters. Otherwise we
 * couldn't test `request` with the current ganache local testnet.
 */
contract AttestationsTest is Attestations {
  address[] private __testValidators;

  function __setValidators(address[] memory validators) public {
    __testValidators = validators;
  }

  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return __testValidators.length;
  }

  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    return __testValidators[index];
  }
}
