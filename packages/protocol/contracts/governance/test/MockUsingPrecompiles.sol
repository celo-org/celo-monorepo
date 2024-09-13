pragma solidity ^0.5.13;

contract MockUsingPrecompiles {
  mapping(bytes32 => bytes32) verifiedSealBitmap;
  mapping(uint256 => bytes32) parentSealBitmap;
  mapping(bytes32 => address) epochSigner;

  uint256 numValidators;

  mapping(bytes32 => uint256) blockNumbers;

  function setVerifiedSealBitmap(bytes memory header, bytes32 bitmap) public {
    verifiedSealBitmap[keccak256(abi.encodePacked(header))] = bitmap;
  }

  function setParentSealBitmap(uint256 blockNumber, bytes32 bitmap) public {
    parentSealBitmap[blockNumber] = bitmap;
  }

  function setEpochSigner(uint256 epoch, uint256 index, address signer) public {
    epochSigner[keccak256(abi.encodePacked(epoch, index))] = signer;
  }

  function setNumberValidators(uint256 num) public {
    numValidators = num;
  }

  function setBlockNumber(bytes memory header, uint256 number) public returns (uint256) {
    blockNumbers[keccak256(abi.encodePacked(header))] = number;
  }

  function numberValidatorsInSet(uint256) public view returns (uint256) {
    return numValidators;
  }

  function getBlockNumberFromHeader(bytes memory header) public view returns (uint256) {
    return blockNumbers[keccak256(abi.encodePacked(header))];
  }

  function hashHeader(bytes memory header) public view returns (bytes32) {
    return keccak256(header);
  }

  function getVerifiedSealBitmapFromHeader(bytes memory header) public view returns (bytes32) {
    return verifiedSealBitmap[keccak256(abi.encodePacked(header))];
  }

  function getParentSealBitmap(uint256 blockNumber) public view returns (bytes32) {
    return parentSealBitmap[blockNumber];
  }
}
