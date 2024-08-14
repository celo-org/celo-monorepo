// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";
import "../../contracts/common/Initializable.sol";

// XXX(soloseng): think about the difference between `epochEndBlock` && `epochProcessingEndBlock`
// which one marks the end of the epoch?
// in the case that the epoch is processed late (e.g.: 1 week later).
// does the new epoch start once the old epoch is processed, regardless of time delay?

// start new epoch at the start of processing plus 1 block, because rewards are frozen when processing starts.

// epochProcessingEndBlock == epochStartingBlock of following epoch
// epochEndBlock == epochProcessingEndBlock == new epochStartingBlock
// XXX(soloseng): If I know a block, how do I get the epoch? => not supported. DC with Mariano

contract EpochManager is Initializable, UsingRegistry, UsingPrecompiles {
  enum EpochStatus {
    NotStarted,
    Processing,
    Ongoing
  }

  // XXX(soloseng): create view functions for current epoch history params.
  struct EpochHistory {
    // block at which an epoch is started
    uint256 epochStartingBlock; // XXX:(soloseng) this should be set every new epoch
    // block at which an epoch is ended
    uint256 epochEndingBlock; // XXX:(soloseng) this should be set every new epoch
    // timestamp at which an epoch started
    uint256 epochStartTimestamp; // XXX:(soloseng) this should be set every new epoch
    // timestamp at which an epoch ended
    uint256 epochEndTimestamp; // XXX:(soloseng) this should be set every new epoch
    // block at which epoch processing started
    uint256 processingStartedBlock;
    // block at which epoch processing ended
    uint256 processingEndedBlock;
    // timestamp at which epoch processing started.
    uint256 processingStartedTimestamp;
    // timestamp at which epoch processing ended.
    uint256 processingEndedTimestamp;
    // status of the epoch.
    EpochStatus status;
  }

  // current chain epoch number
  uint256 public epochNumber;
  uint256 public firstL2EpochNumber;

  // The lenght of time of an epoch
  uint256 public epochDuration;

  // epochnumber => epochProcessing
  mapping(uint256 => EpochHistory) public epochHistory;

  event EpochProcessingStarted(uint256 epochNumber);
  event EpochProcessingEnded(uint256 epochNumber);

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

  // XXX: this needs to be called before the transition at the start of a new epoch
  // so the blockchain can know the current epoch number

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

  // freezes rewards here. marking end of epoch.
  function startProcessingEpoch(
    //XXX: this is the epoch end block, then what is the epoch of the the block during processing?
    uint256 maxRewardsValidator,
    uint256 rewardsVoter,
    uint256 rewardsCommunity,
    uint256 rewardsCarbonFund
  ) external onlyCeloDistributionSchedule {
    require(checkReadyStartProcessingEpoch(), "Epoch not ready to be processed.");
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];
    currentEpochHistory.epochEndingBlock = block.number;
    currentEpochHistory.processingStartedBlock = block.number;
    currentEpochHistory.processingStartedTimestamp = block.timestamp;
    currentEpochHistory.status = EpochStatus.Processing;

    emit EpochProcessingStarted();
  }

  function finishProcessingEpoch() public {
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];

    currentEpochHistory.processingEndedTimestamp = block.timestamp;
    // currentEpochHistory.epochEndingBlock = block.number;

    emit EpochProcessingEnded();
    startNewEpoch();
  }

  function checkReadyStartProcessingEpoch() public view returns (bool) {
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];
    if (
      block.timestamp >= currentEpochHistory.epochEndTimestamp &&
      currentEpochHistory.status == EpochStatus.Ongoing
    ) {
      return true;
    } else {
      return false;
    }
  }

  function startNewEpoch() internal {
    epochNumber++;

    EpochHistory memory previousEpochHistory = epochHistory[epochNumber - 1];

    EpochHistory storage newEpochHistory = epochHistory[epochNumber];
    newEpochHistory.epochStartingBlock = previousEpochHistory.epochEndingBlock + 1;
    newEpochHistory.epochStartTimestamp = block.timestamp;
    newEpochHistory.epochEndTimestamp = block.timestamp + epochDuration;
    newEpochHistory.status = EpochStatus.Ongoing;
  }
}
