pragma solidity ^0.5.13;

import "../Governance.sol";

contract GovernanceTest is Governance(true) {
  address[] validatorSet;

  // Minimally override core functions from UsingPrecompiles
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return validatorSet.length;
  }

  function numberValidatorsInSet(uint256) public view returns (uint256) {
    return validatorSet.length;
  }

  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    return validatorSet[index];
  }

  // Expose test utilities
  function addValidator(address validator) external {
    validatorSet.push(validator);
  }
}
