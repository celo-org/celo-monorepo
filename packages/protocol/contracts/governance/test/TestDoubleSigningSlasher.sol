pragma solidity ^0.5.3;

import "../DoubleSigningSlasher.sol";

contract TestDoubleSigningSlasher is DoubleSigningSlasher {
  mapping(bytes32 => bytes32) parentHash;
  mapping(bytes32 => bytes32) verifiedSealBitmap;
  mapping(bytes32 => address) epochSigner;

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

  function getParentSealBitmap(uint256 blockNumber) public view returns (bytes32) {}

  function setEpochSigner(uint256 epoch, uint256 index, address signer) public {
    epochSigner[keccak256(abi.encodePacked(epoch, index))] = signer;
  }

  function getEpochSigner(uint256 epoch, uint256 index) public view returns (address) {
    return epochSigner[keccak256(abi.encodePacked(epoch, index))];
  }

  function debug(uint256 index, uint256 blockNumber, bytes memory blockA, bytes memory blockB)
    public
    view
    returns (address, bytes32, bytes32, uint256, uint256)
  {
    uint256 epoch = blockNumber / getEpochSize();
    bytes32 mapA = getVerifiedSealBitmap(blockA);
    bytes32 mapB = getVerifiedSealBitmap(blockB);
    //    require(uint256(mapA) & (1 << index) != 0, "Didn't sign first block");
    //    require(uint256(mapB) & (1 << index) != 0, "Didn't sign second block");
    return (getEpochSigner(epoch, index), mapA, mapB, uint256(1) << index, index);
  }
}
