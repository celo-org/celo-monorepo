// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/DowntimeSlasher.sol";

/**
 * @title DowntimeSlasherMock08
 * @notice 0.8 mock for DowntimeSlasher used directly by the 0.8 unit tests.
 * Overrides precompile functions with in-storage mocks.
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
    uint256 epoch = getEpochNumberOfBlock(blockNumber);
    return _epochSigners[keccak256(abi.encodePacked(epoch, index))];
  }

  // --- Mock slash helper ---

  function mockSlash(SlashParams calldata slashParams, address[] calldata validators) external {
    require(
      slashParams.signerIndices.length == validators.length,
      "validators list and signerIndices list length are different."
    );

    uint256 startEpoch = getEpochNumberOfBlock(slashParams.startBlocks[0]);
    _epochSigners[
      keccak256(abi.encodePacked(startEpoch, slashParams.signerIndices[0]))
    ] = validators[0];

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
