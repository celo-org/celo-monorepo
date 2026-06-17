// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts-8/governance/DoubleSigningSlasher.sol";

// Forces forge to compile the 0.8 DoubleSigningSlasher so the 0.5 unit tests can deploy
// it via deployCodeTo("DoubleSigningSlasherCompile", ...). The trivial test keeps this
// file in the compile closure under the validators --match-path run.
contract DoubleSigningSlasherCompile is DoubleSigningSlasher(true) {}

/**
 * @title DoubleSigningSlasherMock08
 * @notice 0.8 mock for DoubleSigningSlasher, deployed by the 0.5 unit test via deployCodeTo.
 * Overrides precompile functions (hashHeader, getBlockNumberFromHeader,
 * getVerifiedSealBitmapFromHeader, numberValidatorsInSet, validatorSignerAddressFromSet)
 * with in-storage mocks, matching the behaviour of the 0.5 MockUsingPrecompiles. The
 * mockSlash helper registers the index→signer mapping for the block and then invokes slash().
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

  // --- Mock setters (mirror 0.5 MockUsingPrecompiles) ---

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

  /**
   * @notice Registers the (epoch, index)→signer mapping for the block under test and
   * calls slash(). Mirrors the behaviour of the 0.5 DoubleSigningSlasherTest.mockSlash,
   * which mocked the GET_VALIDATOR precompile via ph.mockReturn.
   * @param slashParams Slash parameters.
   * @param _validator Validator (signer) address that signed at the provided index.
   */
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

contract CompileDoubleSigningSlasher is Test {
  function test_nop() public view {}
}
