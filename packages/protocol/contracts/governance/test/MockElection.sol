pragma solidity >=0.5.13 <0.8.20;

/**
 * @title Holds a list of addresses of validators
 */
contract MockElection {
  mapping(address => bool) public isIneligible;
  mapping(address => bool) public isEligible;
  mapping(address => bool) public allowedToVoteOverMaxNumberOfGroups;
  mapping(address => uint256) public groupRewardsBasedOnScore;
  mapping(address => uint256) public distributedEpochRewards;
  address[] public electedValidators;
  uint256 active;
  uint256 total;

  function markGroupIneligible(address account) external {
    isIneligible[account] = true;
  }

  function markGroupEligible(address account, address, address) external {
    isEligible[account] = true;
  }

  function setActiveVotes(uint256 value) external {
    active = value;
  }

  function setTotalVotes(uint256 value) external {
    total = value;
  }

  function setElectedValidators(address[] calldata _electedValidators) external {
    electedValidators = _electedValidators;
  }

  function vote(address, uint256, address, address) external pure returns (bool) {
    return true;
  }

  function activate(address) external pure returns (bool) {
    return true;
  }

  function revokeAllActive(address, address, address, uint256) external pure returns (bool) {
    return true;
  }

  function revokeActive(address, uint256, address, address, uint256) external pure returns (bool) {
    return true;
  }

  function revokePending(address, uint256, address, address, uint256) external pure returns (bool) {
    return true;
  }

  function forceDecrementVotes(
    address,
    uint256 value,
    address[] calldata,
    address[] calldata,
    uint256[] calldata
  ) external returns (uint256) {
    this.setActiveVotes(this.getActiveVotes() - value);
    return value;
  }

  function getTotalVotes() external view returns (uint256) {
    return total;
  }

  function getActiveVotes() external view returns (uint256) {
    return active;
  }

  function getTotalVotesByAccount(address) external pure returns (uint256) {
    return 0;
  }

  function electValidatorSigners() external view returns (address[] memory) {
    return electedValidators;
  }
  function electValidatorAccounts() external view returns (address[] memory) {
    return electedValidators;
  }

  function setAllowedToVoteOverMaxNumberOfGroups(address account, bool flag) public {
    allowedToVoteOverMaxNumberOfGroups[account] = flag;
  }

  function getGroupEpochRewardsBasedOnScore(
    address group,
    uint256,
    uint256
  ) external view returns (uint256) {
    return groupRewardsBasedOnScore[group];
  }

  function setGroupEpochRewardsBasedOnScore(address group, uint256 groupRewards) external {
    groupRewardsBasedOnScore[group] = groupRewards;
  }

  function distributeEpochRewards(address group, uint256 value, address, address) external {
    distributedEpochRewards[group] = value;
  }
}
