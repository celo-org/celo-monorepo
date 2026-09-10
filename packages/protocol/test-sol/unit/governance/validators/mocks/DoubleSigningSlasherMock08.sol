// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/DoubleSigningSlasher.sol";

/**
 * @title DoubleSigningSlasherMock08
 * @notice 0.8 mock for DoubleSigningSlasher used directly by the 0.8 unit tests.
 * Overrides precompile functions with in-storage mocks.
 */
contract DoubleSigningSlasherMock08 is DoubleSigningSlasher(true) {
  struct SlashParams {
    address signer;
    uint256 index;
    bytes headerA;
    bytes headerB;
    uint256 groupMembershipHistoryIndex;
    address[] validatorElectionLessers;
    address[] validatorElectionGreaters;
    uint256[] validatorElectionIndices;
    address[] groupElectionLessers;
    address[] groupElectionGreaters;
    uint256[] groupElectionIndices;
  }

  mapping(bytes32 => bytes32) private _verifiedSealBitmap;
  mapping(uint256 => bytes32) private _parentSealBitmap;
  mapping(bytes32 => address) private _epochSigners;
  mapping(bytes32 => uint256) private _blockNumbers;
  uint256 private _numValidators;

  // --- Mock setters ---

  function setVerifiedSealBitmap(bytes calldata header, bytes32 bitmap) external {
    _verifiedSealBitmap[keccak256(abi.encodePacked(header))] = bitmap;
  }

  function setParentSealBitmap(uint256 blockNumber, bytes32 bitmap) external {
    _parentSealBitmap[blockNumber] = bitmap;
  }

  function setEpochSigner(uint256 epoch, uint256 index, address signer) external {
    _epochSigners[keccak256(abi.encodePacked(epoch, index))] = signer;
  }

  function setNumberValidators(uint256 num) external {
    _numValidators = num;
  }

  function setBlockNumber(bytes calldata header, uint256 number) external {
    _blockNumbers[keccak256(abi.encodePacked(header))] = number;
  }

  // --- UsingPrecompiles overrides ---

  function numberValidatorsInSet(uint256) public view override returns (uint256) {
    return _numValidators;
  }

  function getBlockNumberFromHeader(
    bytes memory header
  ) public view override onlyL1 returns (uint256) {
    return _blockNumbers[keccak256(abi.encodePacked(header))];
  }

  function hashHeader(bytes memory header) public view override returns (bytes32) {
    return keccak256(header);
  }

  function getVerifiedSealBitmapFromHeader(
    bytes memory header
  ) public view override returns (bytes32) {
    return _verifiedSealBitmap[keccak256(abi.encodePacked(header))];
  }

  function getParentSealBitmap(uint256 blockNumber) public view override returns (bytes32) {
    return _parentSealBitmap[blockNumber];
  }

  function validatorSignerAddressFromSet(
    uint256 index,
    uint256 blockNumber
  ) public view override returns (address) {
    uint256 epoch = getEpochNumberOfBlock(blockNumber);
    return _epochSigners[keccak256(abi.encodePacked(epoch, index))];
  }

  // --- Mock slash helper ---

  function mockSlash(SlashParams calldata slashParams, address _validator) external {
    uint256 blockNumber = getBlockNumberFromHeader(slashParams.headerA);
    uint256 epoch = getEpochNumberOfBlock(blockNumber);
    _epochSigners[keccak256(abi.encodePacked(epoch, slashParams.index))] = _validator;

    slash(
      slashParams.signer,
      slashParams.index,
      slashParams.headerA,
      slashParams.headerB,
      slashParams.groupMembershipHistoryIndex,
      slashParams.validatorElectionLessers,
      slashParams.validatorElectionGreaters,
      slashParams.validatorElectionIndices,
      slashParams.groupElectionLessers,
      slashParams.groupElectionGreaters,
      slashParams.groupElectionIndices
    );
  }
}
