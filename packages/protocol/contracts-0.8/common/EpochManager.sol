// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

import "./interfaces/IOracle.sol";
import "./interfaces/IStableToken.sol";
import "../common/UsingRegistry.sol";

import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/IEpochManager.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";

contract EpochManager is
  Initializable,
  UsingRegistry,
  IEpochManager,
  ReentrancyGuard,
  ICeloVersionedContract
{
  using FixidityLib for FixidityLib.Fraction;

  struct Epoch {
    uint256 firstBlock;
    uint256 lastBlock;
    uint256 startTimestamp;
    uint256 rewardsBlock;
  }

  enum EpochProcessStatus {
    NotStarted,
    Started
  }

  struct EpochProcessState {
    EpochProcessStatus status;
    uint256 perValidatorReward; // The per validator epoch reward.
    uint256 totalRewardsVoter; // The total rewards to voters.
    uint256 totalRewardsCommunity; // The total community reward.
    uint256 totalRewardsCarbonFund; // The total carbon offsetting partner reward.
    // map the groups and their processed status
    // total number of groups that need to be processed
    uint256 toProcessGroups;
  }

  struct ProcessedGroup {
    bool processed;
    uint256 epochRewards;
  }

  // the length of an epoch in seconds
  uint256 public epochDuration;

  uint256 public firstKnownEpoch;
  uint256 private currentEpochNumber;
  address[] public elected;

  mapping(address => ProcessedGroup) public processedGroups;

  EpochProcessState public epochProcessing;
  mapping(uint256 => Epoch) private epochs;
  mapping(address => uint256) public validatorPendingPayments;

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

  /**
   * @notice Emitted when an epoch payment is sent.
   * @param validator Address of the validator.
   * @param validatorPayment Amount of cUSD sent to the validator.
   * @param group Address of the validator's group.
   * @param groupPayment Amount of cUSD sent to the group.
   */
  event ValidatorEpochPaymentDistributed(
    address indexed validator,
    uint256 validatorPayment,
    address indexed group,
    uint256 groupPayment,
    address indexed beneficiary,
    uint256 delegatedPayment
  );

  modifier onlyEpochManagerEnabler() {
    require(
      msg.sender == registry.getAddressForOrDie(EPOCH_MANAGER_ENABLER_REGISTRY_ID),
      "msg.sender is not Enabler"
    );
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

  // DESIGNDESICION(XXX): we assume that the first epoch on the L2 starts as soon as the system is initialized
  // to minimize amount of "limbo blocks" the network should stop relatively close to an epoch number (but wigh enough time)
  // to have time to call the function EpochInitializer.migrateEpochAndValidators()
  function initializeSystem(
    uint256 firstEpochNumber,
    uint256 firstEpochBlock,
    address[] memory firstElected
  ) external onlyEpochManagerEnabler {
    require(
      address(registry.getAddressForOrDie(CELO_UNRELEASED_TREASURE_REGISTRY_ID)).balance > 0,
      "CeloUnreleasedTreasury not yet funded."
    );
    require(
      getCeloToken().balanceOf(registry.getAddressForOrDie(CELO_UNRELEASED_TREASURE_REGISTRY_ID)) >
        0,
      "CeloUnreleasedTreasury not yet funded."
    );
    require(!systemAlreadyInitialized(), "Epoch system already initialized");
    require(firstEpochNumber > 0, "First epoch number must be greater than 0");
    require(firstEpochBlock > 0, "First epoch block must be greater than 0");
    require(
      firstEpochBlock <= block.number,
      "First epoch block must be less or equal than current block"
    );
    require(firstElected.length > 0, "First elected validators must be greater than 0");
    firstKnownEpoch = firstEpochNumber;
    currentEpochNumber = firstEpochNumber;

    Epoch storage _currentEpoch = epochs[currentEpochNumber];
    _currentEpoch.firstBlock = firstEpochBlock;
    _currentEpoch.startTimestamp = block.timestamp;

    elected = firstElected;
  }

  // TODO maybe "freezeEpochRewards" "prepareForNextEpoch"

  /// start next epoch process.
  /// it freezes the epochrewards at the time of execution,
  /// and starts the distribution of the rewards.
  function startNextEpochProcess() external nonReentrant {
    require(systemAlreadyInitialized(), "Epoch system not initialized");
    require(isTimeForNextEpoch(), "Epoch is not ready to start");
    require(!isOnEpochProcess(), "Epoch process is already started");
    epochProcessing.status = EpochProcessStatus.Started;

    epochs[currentEpochNumber].rewardsBlock = block.number;

    // calculate rewards
    getEpochRewards().updateTargetVotingYield();

    (
      uint256 perValidatorReward,
      uint256 totalRewardsVoter,
      uint256 totalRewardsCommunity,
      uint256 totalRewardsCarbonFund
    ) = getEpochRewards().calculateTargetEpochRewards();

    epochProcessing.perValidatorReward = perValidatorReward;
    epochProcessing.totalRewardsVoter = totalRewardsVoter;
    epochProcessing.totalRewardsCommunity = totalRewardsCommunity;
    epochProcessing.totalRewardsCarbonFund = totalRewardsCarbonFund;

    allocateValidatorsRewards();

    emit EpochProcessingStarted(currentEpochNumber);
  }

  function finishNextEpochProcess(
    address[] calldata groups,
    address[] calldata lessers,
    address[] calldata greaters
  ) external nonReentrant {
    require(isOnEpochProcess(), "Epoch process is not started");
    // finalize epoch
    // last block should be the block before and timestamp from previous block
    epochs[currentEpochNumber].lastBlock = block.number - 1;
    // start new epoch
    currentEpochNumber++;
    epochs[currentEpochNumber].firstBlock = block.number;
    epochs[currentEpochNumber].startTimestamp = block.timestamp;

    for (uint i = 0; i < elected.length; i++) {
      address group = getValidators().getValidatorsGroup(elected[i]);
      if (!processedGroups[group].processed) {
        epochProcessing.toProcessGroups++;
        uint256 groupScore = getScoreReader().getGroupScore(group);
        // We need to precompute epoch rewards for each group since computation depends on total active votes for all groups.
        uint256 epochRewards = getElection().getGroupEpochRewardsBasedOnScore(
          group,
          epochProcessing.totalRewardsVoter,
          groupScore
        );
        processedGroups[group] = ProcessedGroup(true, epochRewards);
      }
    }

    require(epochProcessing.toProcessGroups == groups.length, "number of groups does not match");

    // since we are adding values it makes sense to start from the end
    for (uint ii = groups.length; ii > 0; ii--) {
      uint256 i = ii - 1;
      ProcessedGroup storage processedGroup = processedGroups[groups[i]];
      // checks that group is actually from elected group
      require(processedGroup.processed, "group not processed");
      getElection().distributeEpochRewards(
        groups[i],
        processedGroup.epochRewards,
        lessers[i],
        greaters[i]
      );

      epochProcessing.toProcessGroups = 0;
      delete processedGroups[groups[i]];
    }
    getCeloUnreleasedTreasure().release(
      registry.getAddressForOrDie(GOVERNANCE_REGISTRY_ID),
      epochProcessing.totalRewardsCommunity
    );
    getCeloUnreleasedTreasure().release(
      getEpochRewards().carbonOffsettingPartner(),
      epochProcessing.totalRewardsCarbonFund
    );
    // run elections
    elected = getElection().electValidatorSigners();
    // TODO check how to nullify stuct
    epochProcessing.status = EpochProcessStatus.NotStarted;
  }

  /// returns the current epoch Info
  function getCurrentEpoch() external view returns (uint256, uint256, uint256, uint256) {
    Epoch storage _epoch = epochs[currentEpochNumber];
    return (_epoch.firstBlock, _epoch.lastBlock, _epoch.startTimestamp, _epoch.rewardsBlock);
  }

  /// returns the current epoch number.
  function getCurrentEpochNumber() external view returns (uint256) {
    require(systemAlreadyInitialized(), "EpochManager system not yet initialized.");
    return currentEpochNumber;
  }

  /// returns epoch processing state
  function getEpochProcessingState()
    external
    view
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    return (
      uint256(epochProcessing.status),
      epochProcessing.perValidatorReward,
      epochProcessing.totalRewardsVoter,
      epochProcessing.totalRewardsCommunity,
      epochProcessing.totalRewardsCarbonFund
    );
  }

  function getElected() external view returns (address[] memory) {
    return elected;
  }

  function getFirstBlockAtEpoch(uint256 epoch) external view returns (uint256) {
    require(epoch >= firstKnownEpoch, "Epoch not known");
    require(epoch <= currentEpochNumber, "Epoch not created yet");
    return epochs[epoch].firstBlock;
  }

  function getLastBlockAtEpoch(uint256 epoch) external view returns (uint256) {
    require(epoch >= firstKnownEpoch, "Epoch not known");
    require(epoch < currentEpochNumber, "Epoch not finished yet");
    return epochs[epoch].lastBlock;
  }

  function isBlocked() external view returns (bool) {
    return isOnEpochProcess();
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  /**
   * @notice Sets the time duration of an epoch.
   * @param newEpochDuration The duration of an epoch in seconds.
   * @dev Can only be set by owner.
   */
  function setEpochDuration(uint256 newEpochDuration) public onlyOwner {
    epochDuration = newEpochDuration;
  }

  function isTimeForNextEpoch() public view returns (bool) {
    return block.timestamp >= epochs[currentEpochNumber].startTimestamp + epochDuration;
  }

  function isOnEpochProcess() public view returns (bool) {
    return epochProcessing.status == EpochProcessStatus.Started;
  }

  function systemAlreadyInitialized() public view returns (bool) {
    return initialized && elected.length > 0;
  }

  function allocateValidatorsRewards() internal {
    uint256 totalRewards = 0;
    IScoreReader scoreReader = getScoreReader();
    IValidators validators = getValidators();

    for (uint i = 0; i < elected.length; i++) {
      uint256 validatorScore = scoreReader.getValidatorScore(elected[i]);
      uint256 validatorReward = validators.computeEpochReward(
        elected[i],
        validatorScore,
        epochProcessing.perValidatorReward
      );
      validatorPendingPayments[elected[i]] += validatorReward;
      totalRewards += validatorReward;
    }
    if (totalRewards == 0) {
      return;
    }

    // Mint all cUSD required for payment and the corresponding CELO
    validators.mintStableToEpochManager(totalRewards);
    // this should have a setter for the oracle.

    (uint256 numerator, uint256 denominator) = IOracle(address(getSortedOracles())).getExchangeRate(
      address(getStableToken())
    );

    uint256 CELOequivalent = (numerator * totalRewards) / denominator;
    getCeloUnreleasedTreasure().release(
      registry.getAddressForOrDie(RESERVE_REGISTRY_ID),
      CELOequivalent
    );
  }

  /**
   * @notice Sends the allocated epoch payment to a validator, their group, and
   *   delegation beneficiary.
   * @param validator Account of the validator.
   */
  function sendValidatorPayment(address validator) external {
    IAccounts accounts = IAccounts(getAccounts());
    address signer = accounts.getValidatorSigner(validator);

    FixidityLib.Fraction memory totalPayment = FixidityLib.newFixed(
      validatorPendingPayments[signer]
    );
    validatorPendingPayments[signer] = 0;

    IValidators validators = getValidators();
    address group = validators.getValidatorsGroup(validator);
    (, uint256 commissionUnwrapped, , , , , ) = validators.getValidatorGroup(group);

    uint256 groupPayment = totalPayment.multiply(FixidityLib.wrap(commissionUnwrapped)).fromFixed();
    FixidityLib.Fraction memory remainingPayment = FixidityLib.newFixed(
      totalPayment.fromFixed() - groupPayment
    );
    (address beneficiary, uint256 delegatedFraction) = getAccounts().getPaymentDelegation(
      validator
    );
    uint256 delegatedPayment = remainingPayment
      .multiply(FixidityLib.wrap(delegatedFraction))
      .fromFixed();
    uint256 validatorPayment = remainingPayment.fromFixed() - delegatedPayment;

    IStableToken stableToken = IStableToken(getStableToken());

    if (validatorPayment > 0) {
      require(stableToken.transfer(validator, validatorPayment), "transfer failed to validator");
    }

    if (groupPayment > 0) {
      require(stableToken.transfer(group, groupPayment), "transfer failed to validator group");
    }

    if (delegatedPayment > 0) {
      require(stableToken.transfer(beneficiary, delegatedPayment), "transfer failed to delegatee");
    }

    emit ValidatorEpochPaymentDistributed(
      validator,
      validatorPayment,
      group,
      groupPayment,
      beneficiary,
      delegatedPayment
    );
  }
}
