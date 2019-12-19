pragma solidity ^0.5.3;

interface IHashHeader {
  function hashHeader(bytes calldata header) external view returns (bytes32);
}

// TODO(asa): Limit assembly usage by using X.staticcall instead.
contract UsingPrecompiles {
  address constant PROOF_OF_POSSESSION = address(0xff - 4);
  address constant GET_BLOCK_NUMBER_FROM_HEADER = address(0xff - 8);
  address constant HASH_HEADER = address(0xff - 9);

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
    uint256 ret;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      let newCallDataPosition := mload(0x40)
      let success := staticcall(1000, 0xf8, newCallDataPosition, 0, 0, 0)

      returndatacopy(add(newCallDataPosition, 32), 0, 32)
      ret := mload(add(newCallDataPosition, 32))
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
  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
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

  /**
   * @notice Parses block number out of header.
   * @param header RLP encoded header
   * @return Block number.
   */
  function getBlockNumberFromHeader(bytes memory header) public returns (uint256) {
    bytes memory blockNumber;
    bool success;
    (success, blockNumber) = GET_BLOCK_NUMBER_FROM_HEADER.call.value(0).gas(gasleft())(
      abi.encodePacked(header)
    );
    return bytesToUint256(blockNumber, 0);
  }

  /**
   * @notice Computes hash of header.
   * @param header RLP encoded header
   * @return Header hash.
   */
  function hashHeader(bytes memory header) public returns (bytes32) {
    //return IHashHeader(HASH_HEADER).hashHeader(header);
    bytes memory hash;
    bool success;
    (success, hash) = HASH_HEADER.call.value(0).gas(gasleft())(abi.encodePacked(header));
    return bytesToBytes32(hash, 0);
  }

  /*function bytesToBytes32Loop(bytes memory b, uint offset) private pure returns (bytes32) {
    bytes32 out;

    for (uint i = 0; i < 32; i++) {
      out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
    }
    return out;
  }*/

  function bytesToBytes32(bytes memory bs, uint256 start) internal pure returns (bytes32) {
    require(bs.length >= start + 32, "slicing out of range");
    bytes32 x;
    assembly {
      x := mload(add(bs, add(0x20, start)))
    }
    return x;
  }

  function bytesToUint256(bytes memory bs, uint256 start) internal pure returns (uint256) {
    require(bs.length >= start + 32, "slicing out of range");
    uint256 x;
    assembly {
      x := mload(add(bs, add(0x20, start)))
    }
    return x;
  }
}
