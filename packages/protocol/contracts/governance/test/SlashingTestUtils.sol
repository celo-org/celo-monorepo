pragma solidity ^0.5.3;

import "../DoubleSigningSlasher.sol";

contract SlashingTestUtils {
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

  function getVerifiedSealBitmap(bytes memory header) public view returns (bytes32) {
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

  function validatorSignerAddress(uint256 index, uint256 blockNumber)
    public
    view
    returns (address)
  {
    return epochSigner[keccak256(abi.encodePacked(blockNumber / 100, index))];
  }

  function setNumberValidators(uint256 num) public {
    numValidators = num;
  }

  function numberValidators(uint256 blockNumber) public view returns (uint256) {
    return numValidators;
  }
}
