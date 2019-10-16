pragma solidity ^0.5.3;

import "../Attestations.sol";


contract TestAttestations is Attestations {
  address[] private __testValidators;

  function __setValidators(address[] memory validators) public {
    __testValidators = validators;
  }

  function numberValidatorsInCurrentSet() internal view returns (uint256) {
    return __testValidators.length;
  }

  function validatorAddressFromCurrentSet(uint256 index) internal view returns (address) {
    return __testValidators[index];
  }
}
