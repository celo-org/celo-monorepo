pragma solidity ^0.5.13;

import "../DoubleSigningSlasher.sol";

contract MockUsingPrecompiles {
  mapping(bytes32 => bytes32) verifiedSealBitmap;
  mapping(uint256 => bytes32) parentSealBitmap;
  mapping(bytes32 => address) epochSigner;

  uint256 numValidators;

  function setVerifiedSealBitmap(bytes memory header, bytes32 bitmap) public {
    verifiedSealBitmap[keccak256(abi.encodePacked(header))] = bitmap;
  }

  function getVerifiedSealBitmapFromHeader(bytes memory header) public view returns (bytes32) {
    return verifiedSealBitmap[keccak256(abi.encodePacked(header))];
  }

  function getParentSealBitmap(uint256 blockNumber) public view returns (bytes32) {
    return parentSealBitmap[blockNumber];
  }

  function setParentSealBitmap(uint256 blockNumber, bytes32 bitmap) public {
    parentSealBitmap[blockNumber] = bitmap;
  }

  function calcEpoch(uint256 blockNumber) internal pure returns (uint256) {
    uint256 epochSize = 100;
    // Follows GetEpochNumber from celo-blockchain/blob/master/consensus/istanbul/utils.go
    uint256 epochNumber = blockNumber / epochSize;
    if (blockNumber % epochSize == 0) {
      return epochNumber;
    } else {
      return epochNumber + 1;
    }
  }

  function validatorSignerAddressFromSet(uint256 index, uint256 blockNumber)
    public
    view
    returns (address)
  {
    return epochSigner[keccak256(abi.encodePacked(calcEpoch(blockNumber), index))];
  }

  function setEpochSigner(uint256 epoch, uint256 index, address signer) public {
    epochSigner[keccak256(abi.encodePacked(epoch, index))] = signer;
  }

  function setNumberValidators(uint256 num) public {
    numValidators = num;
  }

  function numberValidatorsInSet(uint256) public view returns (uint256) {
    return numValidators;
  }

  mapping(bytes32 => uint256) blockNumbers;

  function getBlockNumberFromHeader(bytes memory header) public view returns (uint256) {
    return blockNumbers[keccak256(abi.encodePacked(header))];
  }

  function setBlockNumber(bytes memory header, uint256 number) public returns (uint256) {
    blockNumbers[keccak256(abi.encodePacked(header))] = number;
  }

  function hashHeader(bytes memory header) public view returns (bytes32) {
    return keccak256(header);
  }
}
