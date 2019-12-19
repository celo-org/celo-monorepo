pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// TODO(asa): Limit assembly usage by using X.staticcall instead.
contract UsingPrecompiles {
  using SafeMath for uint256;

  address constant PROOF_OF_POSSESSION = address(0xff - 4);

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

  /**
   * @notice Returns the epoch number at a block.
   * @param blockNumber Block number where epoch number is calculated.
   * @return Epoch number.
   */
  function getEpochNumberOfBlock(uint256 blockNumber) public view returns (uint256) {
    uint256 sz = getEpochSize();
    return blockNumber.add(sz).sub(1) / sz;
  }

  /**
   * @notice Returns the epoch number at a block.
   * @return Current epoch number.
   */
  function getEpochNumber() public view returns (uint256) {
    return getEpochNumberOfBlock(block.number);
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

  // RLP decode and retrieve the parent hash from this header.
  // Used to verify that the hash is the same as the block as the given height.
  function getParentHashFromHeader(bytes memory header) public view returns (bytes32) {}

  // Get hash from header
  function blockHashFromHeader(bytes memory header) public view returns (bytes32) {}

  // Verifies the BLS signature on the header and returns the seal bitmap.
  // The validator set used for verification is retrieved based on the parent
  // hash field of the header.
  // If the parent hash is not in the blockchain, verification fails.
  function getVerifiedSealBitmap(bytes memory header) public view returns (bytes32) {}

  // Retrieves the block header from the database and returns the Istanbul seal bitmap.
  function getSealBitmap(uint256 blockNumber) public view returns (bytes32) {}

  // Retrieves the block header from the database and returns the Istanbul parent seal bitmap.
  function getParentSealBitmap(uint256 blockNumber) public view returns (bytes32) {}

  function getEpochSigner(uint256 epoch, uint256 index) public view returns (address) {}

  function validatorSignerAddress(uint256 index, uint256 blockNumber)
    public
    view
    returns (address)
  {}

  function numberValidators(uint256 blockNumber) public view returns (uint256) {}

  // RLP decode and retreive the block number from the given header.
  function getBlockNumberFromHeader(bytes memory header) public view returns (uint256) {}

}
