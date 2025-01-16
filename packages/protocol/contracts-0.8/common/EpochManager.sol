// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";
import "../../lib/openzeppelin-contracts8-copy/security/ReentrancyGuard8.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

import "./interfaces/IOracle.sol";
import "../common/UsingRegistry.sol";

import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/IEpochManager.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "./interfaces/IEpochManagerInitializer.sol";

contract EpochManager is
  Initializable,
  UsingRegistry,
  IEpochManager,
  ReentrancyGuard8,
  ICeloVersionedContract,
  IEpochManagerInitializer
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
  }

  struct ProcessedGroup {
    bool processed;
    uint256 epochRewards;
  }
  bool public isSystemInitialized;

  // the length of an epoch in seconds
  uint256 public epochDuration;

  uint256 public firstKnownEpoch;
  uint256 private currentEpochNumber;
  address public oracleAddress;
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
   * @notice Event emited when a new epoch duration is set.
   * @param newEpochDuration The new epoch duration.
   */
  event EpochDurationSet(uint256 indexed newEpochDuration);

  /**
   * @notice Event emited when a new oracle address is set.
   * @param newOracleAddress The new oracle address.
   */
  event OracleAddressSet(address indexed newOracleAddress);

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

  modifier onlySystemAlreadyInitialized() {
    require(systemAlreadyInitialized(), "Epoch system not initialized");
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
    setOracleAddress(registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID));
  }

  // DESIGNDESICION(XXX): we assume that the first epoch on the L2 starts as soon as the system is initialized
  // to minimize amount of "limbo blocks" the network should stop relatively close to an epoch number (but with enough time)
  // to have time to call the function EpochInitializer.migrateEpochAndValidators()

  /**
   * @notice Initializes the EpochManager system, allowing it to start processing epoch
   * and distributing the epoch rewards.
   * @dev Can only be called by the EpochManagerEnabler contract.
   */
  function initializeSystem(
    uint256 firstEpochNumber,
    uint256 firstEpochBlock,
    address[] memory firstElected
  ) external onlyEpochManagerEnabler {
    require(
      getCeloToken().balanceOf(registry.getAddressForOrDie(CELO_UNRELEASED_TREASURY_REGISTRY_ID)) >
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
    isSystemInitialized = true;
    firstKnownEpoch = firstEpochNumber;
    currentEpochNumber = firstEpochNumber;

    Epoch storage _currentEpoch = epochs[currentEpochNumber];
    _currentEpoch.firstBlock = firstEpochBlock;
    _currentEpoch.startTimestamp = block.timestamp;

    elected = firstElected;
  }

  /**
   * @notice Starts processing an epoch and allocates funds to the beneficiaries.
   * @dev Epoch rewards are frozen at the time of execution.
   * @dev Can only be called once the system is initialized.
   */
  function startNextEpochProcess() external nonReentrant onlySystemAlreadyInitialized {
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

  /**
   * @notice Finishes processing an epoch and releasing funds to the beneficiaries.
   * @param groups List of validator groups to be processed.
   * @param lessers List of validator groups that hold less votes that indexed group.
   * @param greaters List of validator groups that hold more votes that indexed group.
   */
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

    EpochProcessState storage _epochProcessing = epochProcessing;

    uint256 toProcessGroups = 0;
    IValidators validators = getValidators();
    IElection election = getElection();
    IScoreReader scoreReader = getScoreReader();
    for (uint i = 0; i < elected.length; i++) {
      address group = validators.getValidatorsGroup(elected[i]);
      if (!processedGroups[group].processed) {
        toProcessGroups++;
        uint256 groupScore = scoreReader.getGroupScore(group);
        // We need to precompute epoch rewards for each group since computation depends on total active votes for all groups.
        uint256 epochRewards = election.getGroupEpochRewardsBasedOnScore(
          group,
          _epochProcessing.totalRewardsVoter,
          groupScore
        );
        processedGroups[group] = ProcessedGroup(true, epochRewards);
      }
    }

    require(toProcessGroups == groups.length, "number of groups does not match");

    for (uint i = 0; i < groups.length; i++) {
      ProcessedGroup storage processedGroup = processedGroups[groups[i]];
      // checks that group is actually from elected group
      require(processedGroup.processed, "group not from current elected set");
      election.distributeEpochRewards(
        groups[i],
        processedGroup.epochRewards,
        lessers[i],
        greaters[i]
      );

      delete processedGroups[groups[i]];
    }
    getCeloUnreleasedTreasury().release(
      registry.getAddressForOrDie(GOVERNANCE_REGISTRY_ID),
      epochProcessing.totalRewardsCommunity
    );
    getCeloUnreleasedTreasury().release(
      getEpochRewards().carbonOffsettingPartner(),
      epochProcessing.totalRewardsCarbonFund
    );
    // run elections
    elected = election.electValidatorAccounts();
    _epochProcessing.status = EpochProcessStatus.NotStarted;
  }

  /**
   * @notice Sends the allocated epoch payment to a validator, their group, and
   *   delegation beneficiary.
   * @param validator Account of the validator.
   * @dev Can only be called once the system is initialized.
   */
  function sendValidatorPayment(address validator) external onlySystemAlreadyInitialized {
    FixidityLib.Fraction memory totalPayment = FixidityLib.newFixed(
      validatorPendingPayments[validator]
    );
    validatorPendingPayments[validator] = 0;

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

    IERC20 stableToken = IERC20(getStableToken());

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

  /**
   * @return The current epoch info.
   */
  function getCurrentEpoch()
    external
    view
    onlySystemAlreadyInitialized
    returns (uint256, uint256, uint256, uint256)
  {
    Epoch storage _epoch = epochs[currentEpochNumber];
    return (_epoch.firstBlock, _epoch.lastBlock, _epoch.startTimestamp, _epoch.rewardsBlock);
  }

  /**
   * @return The current epoch number.
   * @dev Can only be called once the system is initialized.
   */
  function getCurrentEpochNumber() external view onlySystemAlreadyInitialized returns (uint256) {
    return currentEpochNumber;
  }

  /**
   * @return The latest epoch processing state.
   */
  function getEpochProcessingState()
    external
    view
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    EpochProcessState storage _epochProcessing = epochProcessing;
    return (
      uint256(_epochProcessing.status),
      _epochProcessing.perValidatorReward,
      _epochProcessing.totalRewardsVoter,
      _epochProcessing.totalRewardsCommunity,
      _epochProcessing.totalRewardsCarbonFund
    );
  }

  /**
   * @notice Used to block select functions in blockable contracts.
   * @return Whether or not the blockable functions are blocked.
   */
  function isBlocked() external view returns (bool) {
    return isOnEpochProcess();
  }

  /**
   * @return The list of elected validators.
   */
  function getElected() external view returns (address[] memory) {
    return elected;
  }

  /**
   * @param epoch The epoch number of interest.
   * @return The First block of the specified epoch.
   */
  function getFirstBlockAtEpoch(uint256 epoch) external view returns (uint256) {
    require(epoch >= firstKnownEpoch, "Epoch not known");
    require(epoch <= currentEpochNumber, "Epoch not created yet");
    return epochs[epoch].firstBlock;
  }

  /**
   * @param epoch The epoch number of interest.
   * @return The last block of the specified epoch.
   */
  function getLastBlockAtEpoch(uint256 epoch) external view returns (uint256) {
    require(epoch >= firstKnownEpoch, "Epoch not known");
    require(epoch < currentEpochNumber, "Epoch not finished yet");
    return epochs[epoch].lastBlock;
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
    require(newEpochDuration > 0, "New epoch duration must be greater than zero.");
    require(!isOnEpochProcess(), "Cannot change epoch duration during processing.");
    epochDuration = newEpochDuration;
    emit EpochDurationSet(newEpochDuration);
  }

  /**
   * @notice Sets the address of the Oracle used by this contract.
   * @param newOracleAddress The address of the new oracle.
   * @dev Can only be set by owner.
   */
  function setOracleAddress(address newOracleAddress) public onlyOwner {
    require(newOracleAddress != address(0), "Cannot set address zero as the Oracle.");
    require(newOracleAddress != oracleAddress, "Oracle address cannot be the same.");
    require(!isOnEpochProcess(), "Cannot change oracle address during epoch processing.");
    oracleAddress = newOracleAddress;
    emit OracleAddressSet(newOracleAddress);
  }

  /**
   * @return Whether or not the next epoch can be processed.
   */
  function isTimeForNextEpoch() public view returns (bool) {
    return block.timestamp >= epochs[currentEpochNumber].startTimestamp + epochDuration;
  }

  /**
   * @return Whether or not the current epoch is being processed.
   */
  function isOnEpochProcess() public view returns (bool) {
    return epochProcessing.status == EpochProcessStatus.Started;
  }

  /**
   * @return Whether or not the EpochManager contract has been activated to start processing epochs.
   */
  function systemAlreadyInitialized() public view returns (bool) {
    return initialized && isSystemInitialized;
  }

  /**
   * @notice Allocates rewards to elected validator accounts.
   */
  function allocateValidatorsRewards() internal {
    uint256 totalRewards = 0;
    IScoreReader scoreReader = getScoreReader();
    IValidators validators = getValidators();

    EpochProcessState storage _epochProcessing = epochProcessing;

    for (uint i = 0; i < elected.length; i++) {
      uint256 validatorScore = scoreReader.getValidatorScore(elected[i]);
      uint256 validatorReward = validators.computeEpochReward(
        elected[i],
        validatorScore,
        _epochProcessing.perValidatorReward
      );
      validatorPendingPayments[elected[i]] += validatorReward;
      totalRewards += validatorReward;
    }
    if (totalRewards == 0) {
      return;
    }

    // Mint all cUSD required for payment and the corresponding CELO
    validators.mintStableToEpochManager(totalRewards);

    (uint256 numerator, uint256 denominator) = IOracle(oracleAddress).getExchangeRate(
      address(getStableToken())
    );

    uint256 CELOequivalent = (numerator * totalRewards) / denominator;
    getCeloUnreleasedTreasury().release(
      registry.getAddressForOrDie(RESERVE_REGISTRY_ID),
      CELOequivalent
    );
  }
}
