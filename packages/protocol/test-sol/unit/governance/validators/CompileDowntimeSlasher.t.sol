// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts-8/governance/DowntimeSlasher.sol";

// Forces forge to compile the 0.8 DowntimeSlasher so the 0.5 unit tests can deploy
// it via deployCodeTo("DowntimeSlasherCompile", ...). The trivial test keeps this
// file in the compile closure under the validators --match-path run.
contract DowntimeSlasherCompile is DowntimeSlasher(true) {}

/**
 * @title DowntimeSlasherMock08
 * @notice 0.8 mock for DowntimeSlasher, deployed by the 0.5 unit test via deployCodeTo.
 * Overrides precompile functions (getParentSealBitmap, numberValidatorsInSet,
 * validatorSignerAddressFromSet) with in-storage mocks, matching the behaviour of the
 * 0.5 MockUsingPrecompiles.  The mockSlash helper sets up the internal epoch-signer
 * mapping and then invokes slash().
 */
contract DowntimeSlasherMock08 is DowntimeSlasher(true) {
  struct SlashParams {
    uint256[] startBlocks;
    uint256[] endBlocks;
    uint256[] signerIndices;
    uint256 groupMembershipHistoryIndex;
    address[] validatorElectionLessers;
    address[] validatorElectionGreaters;
    uint256[] validatorElectionIndices;
    address[] groupElectionLessers;
    address[] groupElectionGreaters;
    uint256[] groupElectionIndices;
  }

  mapping(uint256 => bytes32) private _parentSealBitmaps;
  mapping(bytes32 => address) private _epochSigners;
  uint256 private _numValidators;

  // --- Mock setters ---

  function setParentSealBitmap(uint256 blockNumber, bytes32 bitmap) external {
    _parentSealBitmaps[blockNumber] = bitmap;
  }

  function setNumberValidators(uint256 num) external {
    _numValidators = num;
  }

  /**
   * @notice Stores the signer address for a given (epoch, index) pair.
   * @param epoch Epoch number.
   * @param index Validator index within the epoch.
   * @param signer Signer address.
   */
  function setEpochSigner(uint256 epoch, uint256 index, address signer) external {
    _epochSigners[keccak256(abi.encodePacked(epoch, index))] = signer;
  }

  // --- UsingPrecompiles overrides ---

  function getParentSealBitmap(uint256 blockNumber) public view override returns (bytes32) {
    return _parentSealBitmaps[blockNumber];
  }

  function numberValidatorsInSet(uint256) public view override returns (uint256) {
    return _numValidators;
  }

  function validatorSignerAddressFromSet(
    uint256 index,
    uint256 blockNumber
  ) public view override returns (address) {
    // Derive epoch from blockNumber using the epoch-size precompile (mocked by ph in tests).
    uint256 epoch = getEpochNumberOfBlock(blockNumber);
    return _epochSigners[keccak256(abi.encodePacked(epoch, index))];
  }

  // --- Mock slash helper ---

  /**
   * @notice Sets up epoch-signer mock state and calls slash().
   * Mirrors the behaviour of the 0.5 DowntimeSlasherMock.mockSlash.
   * @param slashParams Slash parameters.
   * @param validators List of validator addresses corresponding to signerIndices.
   */
  function mockSlash(SlashParams calldata slashParams, address[] calldata validators) external {
    require(
      slashParams.signerIndices.length == validators.length,
      "validators list and signerIndices list length are different."
    );

    // Register the primary signer→validator mapping for startBlocks[0].
    uint256 startEpoch = getEpochNumberOfBlock(slashParams.startBlocks[0]);
    _epochSigners[
      keccak256(abi.encodePacked(startEpoch, slashParams.signerIndices[0]))
    ] = validators[0];

    // Register additional mappings when there are multiple signer indices
    // (cross-epoch slashing).
    if (slashParams.signerIndices.length > 1) {
      for (uint256 i = 0; i < slashParams.startBlocks.length; i++) {
        if (i > 0) {
          uint256 epochSize = getEpochSize();
          if (slashParams.startBlocks[i] % epochSize == 1) {
            uint256 prevEpoch = getEpochNumberOfBlock(slashParams.startBlocks[i] - 1);
            uint256 curEpoch = getEpochNumberOfBlock(slashParams.startBlocks[i]);
            _epochSigners[
              keccak256(abi.encodePacked(prevEpoch, slashParams.signerIndices[i - 1]))
            ] = validators[0];
            _epochSigners[
              keccak256(abi.encodePacked(curEpoch, slashParams.signerIndices[i]))
            ] = validators[1];
          }
        }
      }
    }

    slash(
      slashParams.startBlocks,
      slashParams.endBlocks,
      slashParams.signerIndices,
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

contract CompileDowntimeSlasher is Test {
  function test_nop() public view {}
}
