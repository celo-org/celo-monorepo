pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for the 0.8 DoubleSigningSlasherMock08 deployed via deployCodeTo.
 * Exposes all methods the 0.5 unit test calls on the mock, including mock-specific
 * precompile setters (setVerifiedSealBitmap, setParentSealBitmap, setEpochSigner,
 * setNumberValidators, setBlockNumber) and mockSlash.
 */
interface IDoubleSigningSlasherMock {
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

  // --- DoubleSigningSlasher methods ---
  function initialize(address registryAddress, uint256 _penalty, uint256 _reward) external;

  function slashingIncentives() external view returns (uint256 penalty, uint256 reward);

  function setSlashingIncentives(uint256 penalty, uint256 reward) external;

  function checkForDoubleSigning(
    address signer,
    uint256 index,
    bytes calldata headerA,
    bytes calldata headerB
  ) external view returns (uint256);

  function getEpochNumber() external view returns (uint256);

  function getEpochNumberOfBlock(uint256 blockNumber) external view returns (uint256);

  // --- MockUsingPrecompiles methods ---
  function setVerifiedSealBitmap(bytes calldata header, bytes32 bitmap) external;

  function setParentSealBitmap(uint256 blockNumber, bytes32 bitmap) external;

  function setEpochSigner(uint256 epoch, uint256 index, address signer) external;

  function setNumberValidators(uint256 num) external;

  function setBlockNumber(bytes calldata header, uint256 number) external;

  // --- Mock-specific ---
  function mockSlash(SlashParams calldata slashParams, address _validator) external;
}
