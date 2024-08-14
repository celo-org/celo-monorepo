// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../common/UsingRegistry.sol";
import "../../contracts/common/Initializable.sol";

// XXX(soloseng): If I know a block, how do I get the epoch? => not supported. DC with Mariano

contract EpochManager is Initializable, UsingRegistry, UsingPrecompiles {
  enum EpochStatus {
    NotStarted,
    Processing,
    Ongoing
  }

  // XXX(soloseng): create view functions for current epoch history params.
  struct EpochHistory {
    /// The block at which an epoch is considered started.
    uint256 epochStartingBlock;
    /// The block at which an epoch is considered ended.
    uint256 epochEndingBlock;
    /// The timestamp at which an epoch started.
    uint256 epochStartTimestamp;
    /// The minimum required time that an epoch should last.
    uint256 epochEndTimestamp;
    /// The block at which the epoch processing started.
    uint256 processingStartedBlock;
    /// The block at which the epoch processing ended.
    uint256 processingEndedBlock;
    /// The timestamp at which the epoch processing started.
    uint256 processingStartedTimestamp;
    /// The timestamp at which the epoch processing ended.
    uint256 processingEndedTimestamp;
    /// The status of the epoch.
    EpochStatus status;
  }

  /// The current epoch number.
  uint256 public epochNumber;
  /// The epoch number at which L2 started.
  uint256 public firstL2EpochNumber;

  /// The minimum required lenght of time of an epoch.
  uint256 public epochDuration;

  /// Maps and epoch number to the EpochHistory struct.
  mapping(uint256 => EpochHistory) public epochHistory;

  /**
   * @notice Event emited when epochProcessing has begun.
   * @param epochNumber The epoch number that is being processed.
   */
  event EpochProcessingStarted(uint256 indexed epochNumber);

  /**
   * @notice Event emited when epochProcessing has ended.
   * @param epochNumber The epoch number that is finished being processed.
   */
  event EpochProcessingEnded(uint256 indexed epochNumber);

  modifier onlyEpochInitializer() {
    require(msg.sender == registry.getAddressForOrDie(EPOCH_INITIALIZER_ID));
    _;
  }

  modifier onlyCeloDistributionSchedule() {
    require(msg.sender == registry.getAddressForOrDie(CELO_DISTRIBUTION_SCHEDULE_ID));
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param newEpochDuration The duration of an epoch in seconds.
   */
  function initialize(address registryAddress, uint256 newEpochDuration) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setEpochDuration(newEpochDuration);
  }

  /**
   * @notice Used to set the duration of an epoch.
   * @param newEpochDuration The duration of an epoch in seconds.
   * @dev Can only be set by owner.
   */
  function setEpochDuration(uint256 newEpochDuration) external onlyOwner {
    epochDuration = newEpochDuration;
  }

  // TODO(soloseng):
  // move this function to an initializer contract, and pass the values to the epochManager by calling the kickoff function.
  // this kickoff function is only calleable by initializer contract.

  /**
   * @notice Used to migrate the current epoch number to solidity from precompile.
   * @dev Can only be called prior to the L2 migration.
   */
  function migrateEpochNumberToSolidity() external onlyEpochInitializer {
    firstL2EpochNumber = epochNumber;
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];

    currentEpochHistory.epochStartingBlock = block.number;
    currentEpochHistory.epochStartTimestamp = block.timestamp;
    currentEpochHistory.epochEndTimestamp = block.timestamp + epochDuration;
    currentEpochHistory.status = EpochStatus.Ongoing;
  }

  /**
   * @notice Starts the processing of the previous epoch.
   * @dev Previous epoch always end 1 block before processing is started.
   */
  function startProcessingEpoch() external onlyCeloDistributionSchedule {
    require(checkReadyStartProcessingEpoch(), "Epoch not ready to be processed.");
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];
    currentEpochHistory.epochEndingBlock = block.number - 1;
    currentEpochHistory.processingStartedBlock = block.number;
    currentEpochHistory.processingStartedTimestamp = block.timestamp;
    currentEpochHistory.status = EpochStatus.Processing;

    emit EpochProcessingStarted(epochNumber);
    startNewEpoch();
  }

  /**
   * @notice Marks the end of the previous epoch processing.
   */
  function finishProcessingEpoch() public {
    EpochHistory storage previousEpochHistory = epochHistory[epochNumber - 1];

    previousEpochHistory.processingEndedTimestamp = block.timestamp;
    previousEpochHistory.processingEndedBlock = block.number;

    emit EpochProcessingEnded(epochNumber - 1);
  }

  /**
   * @return Whether or not an epoch is ready for processing.
   * @dev Can only start processing an epoch if the current timestamp is strictly
   * greater than `currentEpochHistory.epochEndTimestamp`
   */
  function checkReadyStartProcessingEpoch() public view returns (bool) {
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];
    if (
      block.timestamp > currentEpochHistory.epochEndTimestamp &&
      currentEpochHistory.status == EpochStatus.Ongoing
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @notice Marks the start of a new epoch.
   */
  function startNewEpoch() internal {
    epochNumber++;

    EpochHistory storage newEpochHistory = epochHistory[epochNumber];
    newEpochHistory.epochStartingBlock = block.number;
    newEpochHistory.epochStartTimestamp = block.timestamp;
    newEpochHistory.epochEndTimestamp = block.timestamp + epochDuration;
    newEpochHistory.status = EpochStatus.Ongoing;
  }
}
