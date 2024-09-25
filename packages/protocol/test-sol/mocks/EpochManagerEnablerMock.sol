pragma solidity ^0.8.0;

import "../../contracts-0.8/common/EpochManagerEnabler.sol";

/**
 * @title A wrapper around EpochManagerEnabler that exposes internal functions for testing.
 */
contract EpochManagerEnablerMock is EpochManagerEnabler(true) {
  address[] validatorSet;

  function setFirstBlockOfEpoch() external {
    return _setFirstBlockOfEpoch();
  }

  function addValidator(address validator) external {
    validatorSet.push(validator);
  }

  // Minimally override core functions from UsingPrecompiles
  function numberValidatorsInCurrentSet() public view override returns (uint256) {
    return validatorSet.length;
  }

  function numberValidatorsInSet(uint256) public view override returns (uint256) {
    return validatorSet.length;
  }

  function validatorSignerAddressFromCurrentSet(
    uint256 index
  ) public view override returns (address) {
    return validatorSet[index];
  }
}
