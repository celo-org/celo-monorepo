pragma solidity ^0.5.3;


contract UsingPrecompiles {
  /**
   * @notice Gets a validator address from the current validator set.
   * @param index Index of requested validator in the validator set as sorted by the election.
   * @return Address of validator at the requested index.
   */
  function validatorAddressFromCurrentSet(uint256 index) public view returns (address) {
    address validatorAddress;
    assembly {
      let newCallDataPosition := mload(0x40)
      mstore(newCallDataPosition, index)
      let success := staticcall(5000, 0xfa, newCallDataPosition, 32, 0, 0)
      returndatacopy(add(newCallDataPosition, 64), 0, 32)
      validatorAddress := mload(add(newCallDataPosition, 64))
    }

    return validatorAddress;
  }

  /**
   * @notice Gets the size of the current elected validator set.
   * @return Size of the current elected validator set.
   */
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    uint256 numberValidators;
    assembly {
      let success := staticcall(5000, 0xf9, 0, 0, 0, 0)
      let returnData := mload(0x40)
      returndatacopy(returnData, 0, 32)
      numberValidators := mload(returnData)
    }

    return numberValidators;
  }
}
