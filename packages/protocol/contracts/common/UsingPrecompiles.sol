pragma solidity ^0.5.3;

// TODO(asa): Limit assembly usage by using X.staticcall instead.
contract UsingPrecompiles {
  address constant FRACTUON_MU_EXP = address(0xff - 3);
  address constant PROOF_OF_POSSESSION = address(0xff - 4);
  address constant GET_VALIDATOR = address(0xff - 5);
  address constant NUMBER_OF_VALIDATORS = address(0xff - 6);
  address constant EPOCH_SIZE = address(0xff - 7);

  /**
   * @notice calculate a * b^x for fractions a, b to `decimals` precision
   * @param aNumerator Numerator of first fraction
   * @param aDenominator Denominator of first fraction
   * @param bNumerator Numerator of exponentiated fraction
   * @param bDenominator Denominator of exponentiated fraction
   * @param exponent exponent to raise b to
   * @param _decimals precision
   * @return numerator/denominator of the computed quantity (not reduced).
   */
  function fractionMulExp(
    uint256 aNumerator,
    uint256 aDenominator,
    uint256 bNumerator,
    uint256 bDenominator,
    uint256 exponent,
    uint256 _decimals
  ) public view returns (uint256, uint256) {
    require(aDenominator != 0 && bDenominator != 0);
    uint256 returnNumerator;
    uint256 returnDenominator;

    bool success;
    bytes memory result;
    (success, result) = FRACTUON_MU_EXP.staticcall(
      abi.encodePacked(aNumerator, aDenominator, bNumerator, bDenominator, exponent, _decimals)
    );
    require(
      success,
      "UsingPrecompiles :: fractionMulExp Unsuccessful invocation of fraction exponent"
    );
    assembly {
      returnNumerator := mload(add(result, 32))
      returnDenominator := mload(add(result, 64))
    }
    return (returnNumerator, returnDenominator);
  }

  /**
   * @notice Returns the current epoch size in blocks.
   * @return The current epoch size in blocks.
   */
  function getEpochSize() public view returns (uint256) {
    uint256 ret;
    bool success;
    bytes memory result;
    (success, result) = EPOCH_SIZE.staticcall("");
    require(success, "UsingPrecompiles :: getEpochSize Unsuccessful getting of the epoch size");
    assembly {
      ret := mload(add(result, 32))
    }
    return ret;
  }

  function getEpochNumber() public view returns (uint256) {
    uint256 epochSize = getEpochSize();
    uint256 epochNumber = block.number / epochSize;
    if (block.number % epochSize == 0) {
      epochNumber = epochNumber - 1;
    }
    return epochNumber;
  }

  /**
   * @notice Gets a validator address from the current validator set.
   * @param index Index of requested validator in the validator set as sorted by the election.
   * @return Address of validator at the requested index.
   */
  function validatorAddressFromCurrentSet(uint256 index) public view returns (address) {
    address validatorAddress;

    bool success;
    bytes memory result;
    (success, result) = GET_VALIDATOR.staticcall(abi.encodePacked(index));
    require(
      success,
      "UsingPrecompiles :: validatorAddressFromCurrentSet Unsuccessful getting of the validator address for index"
    );
    assembly {
      validatorAddress := mload(add(result, 20))
    }

    return validatorAddress;
  }

  /**
   * @notice Gets the size of the current elected validator set.
   * @return Size of the current elected validator set.
   */
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    uint256 numberValidators;

    bool success;
    bytes memory result;
    (success, result) = NUMBER_OF_VALIDATORS.staticcall("");
    require(
      success,
      "UsingPrecompiles :: numberValidatorsInCurrentSet Unsuccessful getting number of validators "
    );
    assembly {
      numberValidators := mload(result)
    }

    return numberValidators;
  }

  /**
   * @notice Checks a BLS proof of possession.
   * @param sender The address signed by the BLS key to generate the proof of possession.
   * @param blsKey The BLS public key that the validator is using for consensus, should pass proof
   *   of possession. 48 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 96 bytes.
   * @return True upon success.
   */
  function checkProofOfPossession(address sender, bytes memory blsKey, bytes memory blsPop)
    public
    returns (bool)
  {
    bool success;
    (success, ) = PROOF_OF_POSSESSION.call.value(0).gas(gasleft())(
      abi.encodePacked(sender, blsKey, blsPop)
    );
    return success;
  }
}
