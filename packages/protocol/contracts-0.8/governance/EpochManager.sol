// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";
import "../../contracts/common/Initializable.sol";

// XXX(soloseng): think about the difference between epochEndBlock && epochProcessingEndBlock
// which one marks the end of the epoch?
// in the case that the epoch is processed late (e.g.: 1 week later).
// does the new epoch start once the old epoch is processed, regardless of time delay?

contract EpochManager is Initializable, UsingRegistry, UsingPrecompiles {
  enum EpochStatus {
    Ongoing,
    Processing,
    Finished
  }

  // XXX(soloseng): create view functions for current epoch history params.
  struct EpochHistory {
    // XXX: (soloseng) not sure this is needed,
    // XXX: since we already have a public getter and we need the number to access the history.
    uint256 number;
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
    uint256 timestampProcessingStarted;
    // timestamp at which epoch processing ended.
    uint256 timestampProcessingFinished;
    // status of the epoch.
    EpochStatus status; // ENUM (processing=0, finished=1)
    // validator set not needed as they never change in Valdiators
    // address[] validatorSet, // TODO change to groups

    // XXX: (soloseng) shouldnt these be handled by EpochReward contract?
    uint256 maxRewardsValidator; // target MAX validator rewards
    uint256 rewardsVoter; // how much to give to voters (or is it Max?)
    // it could be that there's no need to save these nex two
    uint256 rewardsCommunity; // how much to give community fund
    uint256 rewardsCarbonFund; // how much to give to carbon offset fund
    // TODO what happens to the storage if this struct adds data
  }

  // current chain epoch number
  uint256 public epochNumber; // (brought from geth)
  unit256 public firstL2EpochNumber;

  // The lenght of time of an epoch
  uint256 public epochDuration;

  // epochnumber => epochProcessing
  mapping(uint256 => EpochHistory) public epochHistory;

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

  // this needs to be called before the transition
  // so the blockchain can know the current epoch number
  // XXX: (soloseng) is there a way to do this automatically on every L1 epoch? maybe add a call in epoch rewards?

  /**
   * @notice Used to migrate the current epoch number to solidity from precompile.
   * @dev Can only be called prior to the L2 migration.
   */
  function migrateEpochNumberToSolidity() external onlyL1 {
    epochNumber = getEpochNumber();
    firstL2EpochNumber = epochNumber;
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];
    currentEpochHistory.epochEndTimestamp = block.timestamp + epochDuration;
    // XXX:(soloseng) should this update the epoch history so that we know what the first L2 epoch was?
  }

  // TODO come up with better name, it's dublicated
  function startProcessingEpoch(
    uint256 maxRewardsValidator,
    uint256 rewardsVoter,
    uint256 rewardsCommunity,
    uint256 rewardsCarbonFund
  ) external onlyCeloDistributionSchedule {
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];
    currentEpochHistory.processingStartedBlock = block.number;
    currentEpochHistory.timestampProcessingStarted = block.timestamp;
    currentEpochHistory.status = Processing;

    // XXX:(soloseng) save the expected rewards at time of processing?

    // epoch.maxRewardsValidator = maxRewardsValidator
    // epoch.rewardsVoter = rewardsVoter
    // epoch.rewardsCommunity = rewardsCommunity
    // epoch.rewardsCarbonFund = rewardsCarbonFund
  }

  // XXX: (soloseng) no need to check if finished since once finished, a new epoch is started.
  function checkReadyStartProcessingEpoch() public view returns (bool) {
    EpochHistory storage currentEpoch = epochHistory[epochNumber];
    if (
      block.timestamp >= currentEpoch.epochEndTimestamp &&
      currentEpoch.status == EpochStatus.Ongoing
    ) {
      return true;
    } else {
      return false;
    }
  }

  // function currentEpochProcessing()public{
  //   EpochHistory storage currentEpochHistory = epochHistory[epochNumber];
  // // uint256	currentEpoch = epochHistory[epochNumber]
  // 	if currentEpochHistory.number != 0:
  // 	return epoch.status == PROCESSING
  // }

  function startNewEpoch() internal {
    epochNumber++;

    epochStartTimestamp = epochHistory[epochNumber - 1].timestampProcessingFinished;
    epochEndTimestamp = epochHistory[epochNumber - 1].timestampProcessingFinished + epochDuration;

    EpochHistory storage newEpochHistory = epochHistory[epochNumber];
    newEpochHistory.epochStartingBlock = block.number;
    newEpochHistory.epochStartTimestamp = block.timestamp;
    newEpochHistory.status = Ongoing;
    // lastBlockEpochFinished = previousEpochHistory.processingStartedBlock
    // epochFinishesAfter = previousEpochProcessing.timestampProcessingStarted + timestampProcessingStarted
  }

  // XXX:(soloseng) not sure why freeing the struct storage is needed.
  // Do we need to allow a multisig/governance to set this?
  function finishProcessingEpoch() private {
    EpochHistory storage currentEpochHistory = epochHistory[epochNumber];
    currentEpochHistory.status = Finished;
    currentEpochHistory.timestampProcessingFinished = block.timestamp;
    // currentEpochHistory.epochEndTimestamp = block.timestamp;
    currentEpochHistory.epochEndingBlock = block.number;

    // optional free the storage from the previous unfinished epoch
    // if "epochNumber-2" in epochHistory:
    //   delete epochHistory[epochNumber-2]

    startNewEpoch();
  }
}
