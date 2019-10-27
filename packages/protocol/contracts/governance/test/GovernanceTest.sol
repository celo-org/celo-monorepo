pragma solidity ^0.5.3;

import "../Governance.sol";

contract GovernanceTest is Governance {
  address[] validatorSet;
  uint256 epochSize;

  // Minimally override core functions from UsingPrecompiles
  function getEpochSize() public view returns (uint256) {
    return epochSize;
  }

  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return validatorSet.length;
  }

  function validatorAddressFromCurrentSet(uint256 index) public view returns (address) {
    return validatorSet[index];
  }

  // Expose test utilities
  function setEpochSize(uint256 _epochSize) external {
    epochSize = _epochSize;
  }

  function addValidator(address validator) external {
    validatorSet.push(validator);
  }
}