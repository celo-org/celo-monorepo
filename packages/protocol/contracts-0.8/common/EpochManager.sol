// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts8/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

import "./interfaces/IOracle.sol";
import "../common/UsingRegistry.sol";

import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/IEpochManager.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "./interfaces/IEpochManagerInitializer.sol";

/**
 * @title Contract used for managing CELO L2 epoch and elections.
 * @dev DESIGN_DESICION: we assume that the first epoch on the L2 starts as soon as the system is initialized
 * to minimize amount of "limbo blocks" the network should stop relatively close to an epoch number (but with enough time)
 * to have time to call the function `EpochInitializer.migrateEpochAndValidators()`
 */
contract EpochManager is
  Initializable,
  UsingRegistry,
  IEpochManager,
  ReentrancyGuard,
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
    Started,
    IndivudualGroupsProcessing
  }

  struct EpochProcessState {
    EpochProcessStatus status;
    uint256 perValidatorReward; // The per validator epoch reward.
    uint256 totalRewardsVoter; // The total rewards to voters.
    uint256 totalRewardsCommunity; // The total community reward.
    uint256 totalRewardsCarbonFund; // The total carbon offsetting partner reward.
  }

  bool public isSystemInitialized;

  // the length of an epoch in seconds
  uint256 public epochDuration;

  uint256 public firstKnownEpoch;
  uint256 internal currentEpochNumber;
  address public oracleAddress;
  address[] public electedAccounts;
  mapping(address => uint256) public processedGroups;

  EpochProcessState public epochProcessing;
  mapping(uint256 => Epoch) internal epochs;
  mapping(address => uint256) public validatorPendingPayments;
  // Electeds in the L1 assumed signers can not change during the epoch
  // so we keep a copy
  address[] public electedSigners;

  uint256 public toProcessGroups = 0;

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

  /**
   * @notice Throws if called by other than EpochManagerEnabler contract.
   */
  modifier onlyEpochManagerEnabler() {
    require(
      msg.sender == registry.getAddressForOrDie(EPOCH_MANAGER_ENABLER_REGISTRY_ID),
      "msg.sender is not Enabler"
    );
    _;
  }

  /**
   * @notice Throws if called when EpochManager system has not yet been initalized.
   */
  modifier onlySystemAlreadyInitialized() {
    require(systemAlreadyInitialized(), "Epoch system not initialized");
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) Initializable(test) {}

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

    electedAccounts = firstElected;

    _setElectedSigners(firstElected);
  }

  /**
   * @notice Starts processing an epoch and allocates funds to the beneficiaries.
   * @dev Epoch rewards are frozen at the time of execution.
   * @dev Can only be called once the system is initialized.
   */
  function startNextEpochProcess() external nonReentrant onlySystemAlreadyInitialized {
    require(isTimeForNextEpoch(), "Epoch is not ready to start");
    require(
      epochProcessing.status == EpochProcessStatus.NotStarted,
      "Epoch process is already started"
    );
    require(!isEpochProcessingStarted(), "Epoch process is already started");

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
   * @notice Starts individual processing of the elected groups.
   * As second step it is necessary to call processGroup
   */
  function setToProcessGroups() external {
    require(isOnEpochProcess(), "Epoch process is not started");

    EpochProcessState storage _epochProcessing = epochProcessing;
    _epochProcessing.status = EpochProcessStatus.IndivudualGroupsProcessing;

    IValidators validators = getValidators();
    IElection election = getElection();
    IScoreReader scoreReader = getScoreReader();
    require(
      electedAccounts.length == electedSigners.length,
      "Elected accounts and signers of different lengths."
    );
    for (uint i = 0; i < electedAccounts.length; i++) {
      address group = validators.getValidatorsGroup(electedAccounts[i]);
      if (processedGroups[group] == 0) {
        toProcessGroups++;
        uint256 groupScore = scoreReader.getGroupScore(group);
        // We need to precompute epoch rewards for each group since computation depends on total active votes for all groups.
        uint256 epochRewards = election.getGroupEpochRewardsBasedOnScore(
          group,
          _epochProcessing.totalRewardsVoter,
          groupScore
        );
        processedGroups[group] = epochRewards == 0 ? type(uint256).max : epochRewards;
      }
    }
  }

  /**
   * @notice Processes the rewards for a list of groups. For last group it will also finalize the epoch.
   * @param groups List of validator groups to be processed.
   * @param lessers List of validator groups that hold less votes that indexed group.
   * @param greaters List of validator groups that hold more votes that indexed group.
   */
  function processGroups(
    address[] calldata groups,
    address[] calldata lessers,
    address[] calldata greaters
  ) external {
    for (uint i = 0; i < groups.length; i++) {
      processGroup(groups[i], lessers[i], greaters[i]);
    }
  }

  /**
   * @notice Processes the rewards for a group. For last group it will also finalize the epoch.
   * @param group The group to process.
   * @param lesser The group with less votes than the indexed group.
   * @param greater The group with more votes than the indexed group.
   */
  function processGroup(address group, address lesser, address greater) public {
    EpochProcessState storage _epochProcessing = epochProcessing;
    require(isIndividualProcessing(), "Indivudual epoch process is not started");
    require(toProcessGroups > 0, "no more groups to process");

    uint256 epochRewards = processedGroups[group];
    // checks that group is actually from elected group
    require(epochRewards > 0, "group not from current elected set");
    IElection election = getElection();

    if (epochRewards != type(uint256).max) {
      election.distributeEpochRewards(group, epochRewards, lesser, greater);
    }

    delete processedGroups[group];
    toProcessGroups--;

    if (toProcessGroups == 0) {
      _finishEpochHelper(_epochProcessing, election);
    }
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
  ) external virtual nonReentrant {
    require(isOnEpochProcess(), "Epoch process is not started");
    require(toProcessGroups == 0, "Can't finish epoch while individual groups are being processed");

    EpochProcessState storage _epochProcessing = epochProcessing;

    uint256 _toProcessGroups = 0;
    IValidators validators = getValidators();
    IElection election = getElection();
    IScoreReader scoreReader = getScoreReader();
    require(
      electedAccounts.length == electedSigners.length,
      "Elected accounts and signers of different lengths."
    );
    for (uint i = 0; i < electedAccounts.length; i++) {
      address group = validators.getValidatorsGroup(electedAccounts[i]);
      if (processedGroups[group] == 0) {
        _toProcessGroups++;
        uint256 groupScore = scoreReader.getGroupScore(group);
        // We need to precompute epoch rewards for each group since computation depends on total active votes for all groups.
        uint256 epochRewards = election.getGroupEpochRewardsBasedOnScore(
          group,
          _epochProcessing.totalRewardsVoter,
          groupScore
        );
        processedGroups[group] = epochRewards == 0 ? type(uint256).max : epochRewards;
      }
      delete electedAccounts[i];
      delete electedSigners[i];
    }

    require(_toProcessGroups == groups.length, "number of groups does not match");

    for (uint i = 0; i < groups.length; i++) {
      uint256 epochRewards = processedGroups[groups[i]];
      // checks that group is actually from elected group
      require(epochRewards > 0, "group not from current elected set");
      if (epochRewards != type(uint256).max) {
        election.distributeEpochRewards(groups[i], epochRewards, lessers[i], greaters[i]);
      }

      delete processedGroups[groups[i]];
    }

    _finishEpochHelper(_epochProcessing, election);
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
   * @notice Returns the epoch info for the current epoch.
   * @return firstEpoch The first block of the current epoch.
   * @return lastBlock The last block of the current epoch.
   * @return startTimestamp The starting timestamp of the current epoch.
   * @return rewardsBlock The reward block of the current epoch.
   */
  function getCurrentEpoch()
    external
    view
    onlySystemAlreadyInitialized
    returns (uint256, uint256, uint256, uint256)
  {
    return getEpochByNumber(currentEpochNumber);
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
    return isEpochProcessingStarted();
  }

  /**
   * @return The number of elected accounts in the current set.
   */
  function numberOfElectedInCurrentSet()
    external
    view
    onlySystemAlreadyInitialized
    returns (uint256)
  {
    return electedAccounts.length;
  }

  /**
   * @return The list of currently elected validators.
   */
  function getElectedAccounts()
    external
    view
    onlySystemAlreadyInitialized
    returns (address[] memory)
  {
    return electedAccounts;
  }

  /**
   * @notice Returns the currently elected account at a specified index.
   * @param index The index of the currently elected account.
   */
  function getElectedAccountByIndex(
    uint256 index
  ) external view onlySystemAlreadyInitialized returns (address) {
    return electedAccounts[index];
  }

  /**
   * @return The list of the validator signers of elected validators.
   */
  function getElectedSigners()
    external
    view
    onlySystemAlreadyInitialized
    returns (address[] memory)
  {
    return electedSigners;
  }

  /**
   * @notice Returns the currently elected signer address at a specified index.
   * @param index The index of the currently elected signer.
   */
  function getElectedSignerByIndex(
    uint256 index
  ) external view onlySystemAlreadyInitialized returns (address) {
    return electedSigners[index];
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
   * @notice Returns the epoch number of a specified blockNumber.
   * @param _blockNumber Block number of the epoch info is retreived.
   */
  function getEpochNumberOfBlock(
    uint256 _blockNumber
  ) external view onlySystemAlreadyInitialized returns (uint256) {
    (uint256 _epochNumber, , , , ) = _getEpochByBlockNumber(_blockNumber);
    return _epochNumber;
  }

  /**
   * @notice Returns the epoch info of a specified blockNumber.
   * @param _blockNumber Block number of the epoch info is retreived.
   * @return firstEpoch The first block of the given block number.
   * @return lastBlock The first block of the given block number.
   * @return startTimestamp The starting timestamp of the given block number.
   * @return rewardsBlock The reward block of the given block number.
   */
  function getEpochByBlockNumber(
    uint256 _blockNumber
  ) external view onlySystemAlreadyInitialized returns (uint256, uint256, uint256, uint256) {
    (
      ,
      uint256 _firstBlock,
      uint256 _lastBlock,
      uint256 _startTimestamp,
      uint256 _rewardsBlock
    ) = _getEpochByBlockNumber(_blockNumber);
    return (_firstBlock, _lastBlock, _startTimestamp, _rewardsBlock);
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
   * @return Whether epoch is being processed by individualy group by group.
   */
  function isIndividualProcessing() public view returns (bool) {
    return epochProcessing.status == EpochProcessStatus.IndivudualGroupsProcessing;
  }

  /**
   * @return Whether epoch process has been started.
   */
  function isEpochProcessingStarted() public view returns (bool) {
    return isOnEpochProcess() || isIndividualProcessing();
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
   * @notice Returns the epoch info of a specified epoch.
   * @param epochNumber Epoch number where the epoch info is retreived.
   * @return firstEpoch The first block of the given epoch.
   * @return lastBlock The first block of the given epoch.
   * @return startTimestamp The starting timestamp of the given epoch.
   * @return rewardsBlock The reward block of the given epoch.
   */
  function getEpochByNumber(
    uint256 epochNumber
  ) public view onlySystemAlreadyInitialized returns (uint256, uint256, uint256, uint256) {
    Epoch memory _epoch = epochs[epochNumber];
    return (_epoch.firstBlock, _epoch.lastBlock, _epoch.startTimestamp, _epoch.rewardsBlock);
  }

  /**
   * @notice Allocates rewards to elected validator accounts.
   */
  function allocateValidatorsRewards() internal {
    uint256 totalRewards = 0;
    IScoreReader scoreReader = getScoreReader();
    IValidators validators = getValidators();

    EpochProcessState storage _epochProcessing = epochProcessing;

    for (uint i = 0; i < electedAccounts.length; i++) {
      uint256 validatorScore = scoreReader.getValidatorScore(electedAccounts[i]);
      uint256 validatorReward = validators.computeEpochReward(
        electedAccounts[i],
        validatorScore,
        _epochProcessing.perValidatorReward
      );
      validatorPendingPayments[electedAccounts[i]] += validatorReward;
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

  /**
   * @notice Updates the list of elected validator signers.
   */
  function _setElectedSigners(address[] memory _elected) internal {
    require(electedAccounts.length > 0, "Elected list length cannot be zero.");
    IAccounts accounts = getAccounts();
    electedSigners = new address[](_elected.length);
    for (uint i = 0; i < _elected.length; i++) {
      electedSigners[i] = accounts.getValidatorSigner(_elected[i]);
    }
  }

  /**
   * @notice Finishes processing an epoch and releasing funds to the beneficiaries.
   * @param _epochProcessing The current epoch processing state.
   * @param election The Election contract.
   */
  function _finishEpochHelper(
    EpochProcessState storage _epochProcessing,
    IElection election
  ) internal {
    // finalize epoch
    // last block should be the block before and timestamp from previous block
    epochs[currentEpochNumber].lastBlock = block.number - 1;
    currentEpochNumber++;
    // start new epoch
    epochs[currentEpochNumber].firstBlock = block.number;
    epochs[currentEpochNumber].startTimestamp = block.timestamp;

    // run elections
    address[] memory _newlyElected = election.electValidatorAccounts();
    electedAccounts = _newlyElected;
    _setElectedSigners(_newlyElected);

    ICeloUnreleasedTreasury celoUnreleasedTreasury = getCeloUnreleasedTreasury();
    celoUnreleasedTreasury.release(
      registry.getAddressForOrDie(GOVERNANCE_REGISTRY_ID),
      _epochProcessing.totalRewardsCommunity
    );
    celoUnreleasedTreasury.release(
      getEpochRewards().carbonOffsettingPartner(),
      _epochProcessing.totalRewardsCarbonFund
    );

    _epochProcessing.status = EpochProcessStatus.NotStarted;
    _epochProcessing.perValidatorReward = 0;
    _epochProcessing.totalRewardsVoter = 0;
    _epochProcessing.totalRewardsCommunity = 0;
    _epochProcessing.totalRewardsCarbonFund = 0;

    emit EpochProcessingEnded(currentEpochNumber - 1);
  }

  /**
   * @notice Returns the epoch info of a specified blockNumber.
   * @dev This function is here for backward compatibility. It is rather gas heavy and can run out of gas.
   * @param _blockNumber Block number of the epoch info is retreived.
   * @return firstEpoch The first block of the given block number.
   * @return lastBlock The first block of the given block number.
   * @return startTimestamp The starting timestamp of the given block number.
   * @return rewardsBlock The reward block of the given block number.
   */
  function _getEpochByBlockNumber(
    uint256 _blockNumber
  )
    internal
    view
    onlySystemAlreadyInitialized
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    require(_blockNumber <= block.number, "Invalid blockNumber. Value too high.");

    (uint256 _firstBlockOfFirstEpoch, , , ) = getEpochByNumber(firstKnownEpoch);

    require(_blockNumber >= _firstBlockOfFirstEpoch, "Invalid blockNumber. Value too low.");

    uint256 _firstBlockOfCurrentEpoch = epochs[currentEpochNumber].firstBlock;

    if (_blockNumber >= _firstBlockOfCurrentEpoch) {
      (
        uint256 _firstBlock,
        uint256 _lastBlock,
        uint256 _startTimestamp,
        uint256 _rewardsBlock
      ) = getEpochByNumber(currentEpochNumber);
      return (currentEpochNumber, _firstBlock, _lastBlock, _startTimestamp, _rewardsBlock);
    }

    uint256 left = firstKnownEpoch;
    uint256 right = currentEpochNumber - 1;

    while (left <= right) {
      uint256 mid = (left + right) / 2;
      uint256 _epochFirstBlock = epochs[mid].firstBlock;
      uint256 _epochLastBlock = epochs[mid].lastBlock;

      if (_blockNumber >= _epochFirstBlock && _blockNumber <= _epochLastBlock) {
        Epoch memory _epoch = epochs[mid];
        return (
          mid,
          _epoch.firstBlock,
          _epoch.lastBlock,
          _epoch.startTimestamp,
          _epoch.rewardsBlock
        );
      } else if (_blockNumber < _epochFirstBlock) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    revert("No matching epoch found for the given block number.");
  }
}
