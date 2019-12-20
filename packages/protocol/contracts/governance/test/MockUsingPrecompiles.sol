pragma solidity ^0.5.3;

import "../DoubleSigningSlasher.sol";

contract MockUsingPrecompiles {
  mapping(bytes32 => bytes32) parentHash;
  mapping(bytes32 => bytes32) verifiedSealBitmap;
  mapping(uint256 => bytes32) parentSealBitmap;
  mapping(bytes32 => address) epochSigner;

  uint256 numValidators;

  function setParentHashFromHeader(bytes memory header, bytes32 _parentHash) public {
    parentHash[keccak256(abi.encodePacked(header))] = _parentHash;
  }

  function getParentHashFromHeader(bytes memory header) public view returns (bytes32) {
    return parentHash[keccak256(abi.encodePacked(header))];
  }

  function setVerifiedSealBitmap(bytes memory header, bytes32 bitmap) public {
    verifiedSealBitmap[keccak256(abi.encodePacked(header))] = bitmap;
  }

  function getVerifiedSealBitmapFromHeader(bytes memory header) public view returns (bytes32) {
    return verifiedSealBitmap[keccak256(abi.encodePacked(header))];
  }

  function getSealBitmap(uint256 blockNumber) public view returns (bytes32) {}

  function getParentSealBitmap(uint256 blockNumber) public view returns (bytes32) {
    return parentSealBitmap[blockNumber];
  }

  function setParentSealBitmap(uint256 blockNumber, bytes32 bitmap) public {
    parentSealBitmap[blockNumber] = bitmap;
  }

  function setEpochSigner(uint256 epoch, uint256 index, address signer) public {
    epochSigner[keccak256(abi.encodePacked(epoch, index))] = signer;
  }

  function getEpochSigner(uint256 epoch, uint256 index) public view returns (address) {
    return epochSigner[keccak256(abi.encodePacked(epoch, index))];
  }

  function calcEpoch(uint256 blockNumber) internal pure returns (uint256) {
    uint256 sz = 100;
    return (blockNumber + sz - 1) / sz;
  }

  function validatorSignerAddressFromSet(uint256 index, uint256 blockNumber)
    public
    view
    returns (address)
  {
    return epochSigner[keccak256(abi.encodePacked(calcEpoch(blockNumber), index))];
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
