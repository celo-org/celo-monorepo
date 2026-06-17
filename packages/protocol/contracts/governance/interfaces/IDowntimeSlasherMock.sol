pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for the 0.8 DowntimeSlasherMock08 deployed via deployCodeTo.
 * Exposes all methods the 0.5 unit test calls on the mock, including mock-specific
 * setters (setParentSealBitmap, setNumberValidators, setEpochSigner) and mockSlash.
 */
interface IDowntimeSlasherMock {
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

  // --- DowntimeSlasher methods ---
  function initialize(
    address registryAddress,
    uint256 _penalty,
    uint256 _reward,
    uint256 _slashableDowntime
  ) external;

  function slashingIncentives() external view returns (uint256 penalty, uint256 reward);

  function slashableDowntime() external view returns (uint256);

  function setSlashingIncentives(uint256 penalty, uint256 reward) external;

  function setSlashableDowntime(uint256 interval) external;

  function setBitmapForInterval(uint256 startBlock, uint256 endBlock) external returns (bytes32);

  function getBitmapForInterval(
    uint256 startBlock,
    uint256 endBlock
  ) external view returns (bytes32);

  function getEpochNumber() external view returns (uint256);

  function getEpochNumberOfBlock(uint256 blockNumber) external view returns (uint256);

  // --- MockUsingPrecompiles methods ---
  function setParentSealBitmap(uint256 blockNumber, bytes32 bitmap) external;

  function setNumberValidators(uint256 num) external;

  function setEpochSigner(uint256 epoch, uint256 index, address signer) external;

  // --- Mock-specific ---
  function mockSlash(SlashParams calldata slashParams, address[] calldata validators) external;
}
