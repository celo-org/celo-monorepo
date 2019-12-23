pragma solidity ^0.5.3;

// TODO(asa): Limit assembly usage by using X.staticcall instead.
contract UsingPrecompiles {
  address constant TRANSFER = address(0xff - 2);
  address constant FRACTION_MUL = address(0xff - 3);
  address constant PROOF_OF_POSSESSION = address(0xff - 4);
  address constant GET_VALIDATOR = address(0xff - 5);
  address constant NUMBER_VALIDATORS = address(0xff - 6);
  address constant EPOCH_SIZE = address(0xff - 7);
  address constant BLOCK_NUMBER_FROM_HEADER = address(0xff - 8);
  address constant HASH_HEADER = address(0xff - 9);
  address constant GET_PARENT_SEAL_BITMAP = address(0xff - 10);
  address constant GET_VERIFIED_SEAL_BITMAP = address(0xff - 11);

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
    // solhint-disable-next-line no-inline-assembly
    assembly {
      let newCallDataPosition := mload(0x40)
      mstore(0x40, add(newCallDataPosition, calldatasize))
      mstore(newCallDataPosition, aNumerator)
      mstore(add(newCallDataPosition, 32), aDenominator)
      mstore(add(newCallDataPosition, 64), bNumerator)
      mstore(add(newCallDataPosition, 96), bDenominator)
      mstore(add(newCallDataPosition, 128), exponent)
      mstore(add(newCallDataPosition, 160), _decimals)
      let success := staticcall(
        1050, // estimated gas cost for this function
        0xfc,
        newCallDataPosition,
        0xc4, // input size, 6 * 32 = 192 bytes
        0,
        0
      )

      let returnDataSize := returndatasize
      let returnDataPosition := mload(0x40)
      mstore(0x40, add(returnDataPosition, returnDataSize))
      returndatacopy(returnDataPosition, 0, returnDataSize)

      switch success
        case 0 {
          revert(returnDataPosition, returnDataSize)
        }
        default {
          returnNumerator := mload(returnDataPosition)
          returnDenominator := mload(add(returnDataPosition, 32))
        }
    }
    return (returnNumerator, returnDenominator);
  }

  /**
   * @notice Returns the current epoch size in blocks.
   * @return The current epoch size in blocks.
   */
  function getEpochSize() public view returns (uint256) {
    bytes memory out;
    bool success;
    (success, out) = EPOCH_SIZE.staticcall(abi.encodePacked());
    require(success);
    return getUint256FromBytes(out, 0);
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
   * @param index Index of requested validator in the validator set.
   * @return Address of validator at the requested index.
   */
  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    bytes memory out;
    bool success;
    (success, out) = GET_VALIDATOR.staticcall(abi.encodePacked(index, uint256(block.number)));
    require(success);
    return address(getUint256FromBytes(out, 0));
  }

  /**
   * @notice Gets a validator address from the validator set at the given block number.
   * @param index Index of requested validator in the validator set.
   * @param blockNumber Block number to retrieve the validator set from.
   * @return Address of validator at the requested index.
   */
  function validatorSignerAddressFromSet(uint256 index, uint256 blockNumber)
    public
    view
    returns (address)
  {
    bytes memory out;
    bool success;
    (success, out) = GET_VALIDATOR.staticcall(abi.encodePacked(index, blockNumber));
    require(success);
    return address(getUint256FromBytes(out, 0));
  }

  /**
   * @notice Gets the size of the current elected validator set.
   * @return Size of the current elected validator set.
   */
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    bytes memory out;
    bool success;
    (success, out) = NUMBER_VALIDATORS.staticcall(abi.encodePacked(uint256(block.number)));
    require(success);
    return getUint256FromBytes(out, 0);
  }

  /**
   * @notice Gets the size of the validator set that must sign the given block number.
   * @param blockNumber Block number to retrieve the validator set from.
   * @return Size of the validator set.
   */
  function numberValidatorsInSet(uint256 blockNumber) public view returns (uint256) {
    bytes memory out;
    bool success;
    (success, out) = NUMBER_VALIDATORS.staticcall(abi.encodePacked(blockNumber));
    require(success);
    return getUint256FromBytes(out, 0);
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
    view
    returns (bool)
  {
    bool success;
    (success, ) = PROOF_OF_POSSESSION.staticcall(abi.encodePacked(sender, blsKey, blsPop));
    return success;
  }

  /**
   * @notice Parses block number out of header.
   * @param header RLP encoded header
   * @return Block number.
   */
  function getBlockNumberFromHeader(bytes memory header) public view returns (uint256) {
    bytes memory out;
    bool success;
    (success, out) = BLOCK_NUMBER_FROM_HEADER.staticcall(abi.encodePacked(header));
    require(success);
    return getUint256FromBytes(out, 0);
  }

  /**
   * @notice Computes hash of header.
   * @param header RLP encoded header
   * @return Header hash.
   */
  function hashHeader(bytes memory header) public view returns (bytes32) {
    bytes memory out;
    bool success;
    (success, out) = HASH_HEADER.staticcall(abi.encodePacked(header));
    require(success);
    return getBytes32FromBytes(out, 0);
  }

  /**
   * @notice Gets the parent seal bitmap from the header at the given block number.
   * @param blockNumber Block number to retrieve. Must be within 4 epochs of the current number.
   * @return Bitmap parent seal with set bits at indices correspoinding to signing validators.
   */
  function getParentSealBitmap(uint256 blockNumber) public view returns (bytes32) {
    bytes memory out;
    bool success;
    (success, out) = GET_PARENT_SEAL_BITMAP.staticcall(abi.encodePacked(blockNumber));
    require(success);
    return getBytes32FromBytes(out, 0);
  }

  /**
   * @notice Verifies the given header and returns the seal bitmap is successful.
   * @param header RLP encoded header
   * @return Bitmap parent seal with set bits at indices correspoinding to signing validators.
   */
  function getVerifiedSealBitmapFromHeader(bytes memory header) public view returns (bytes32) {
    bytes memory out;
    bool success;
    (success, out) = GET_VERIFIED_SEAL_BITMAP.staticcall(abi.encodePacked(header));
    require(success);
    return getBytes32FromBytes(out, 0);
  }

  /**
   * @notice Converts bytes to uint256.
   * @param bs byte[] data
   * @param start offset into byte data to convert
   * @return uint256 data
   */
  function getUint256FromBytes(bytes memory bs, uint256 start) internal pure returns (uint256) {
    return uint256(getBytes32FromBytes(bs, start));
  }

  /**
   * @notice Converts bytes to bytes32.
   * @param bs byte[] data
   * @param start offset into byte data to convert
   * @return bytes32 data
   */
  function getBytes32FromBytes(bytes memory bs, uint256 start) internal pure returns (bytes32) {
    require(bs.length >= start + 32, "slicing out of range");
    bytes32 x;
    assembly {
      x := mload(add(bs, add(start, 32)))
    }
    return x;
  }
}
