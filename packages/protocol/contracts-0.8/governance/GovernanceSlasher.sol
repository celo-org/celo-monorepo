// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/utils/math/SafeMath.sol";

import "../../contracts/common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../../contracts/governance/interfaces/IValidators.sol";
import "../../contracts/governance/interfaces/ILockedGold.sol";
import "../../contracts/governance/interfaces/IGovernanceSlasher.sol";

contract GovernanceSlasher is
  Ownable,
  Initializable,
  UsingRegistry,
  ICeloVersionedContract,
  IGovernanceSlasher
{
  using SafeMath for uint256;
  // Maps a slashed address to the amount to be slashed.
  // Note that there is no reward paid when slashing via governance.
  mapping(address => uint256) slashed;
  address internal slasherExecuter;

  event SlashingApproved(address indexed account, uint256 amount);
  event GovernanceSlashPerformed(address indexed account, address indexed group, uint256 amount);
  event SlasherExecuterSet(address slasherExecuter);

  modifier onlyAuthorizedToSlash() {
    require(
      msg.sender == owner() || slasherExecuter == msg.sender,
      "Sender not authorized to slash"
    );
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
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  function setSlasherExecuter(address _slasherExecuter) external onlyOwner {
    slasherExecuter = _slasherExecuter;
    emit SlasherExecuterSet(_slasherExecuter);
  }

  /**
   * @notice Sets account penalty.
   * @param account Address that is punished.
   * @param penalty Amount of penalty in wei.
   * @dev Only callable by governance.
   */
  function approveSlashing(address account, uint256 penalty) external onlyAuthorizedToSlash {
    slashed[account] = slashed[account].add(penalty);
    emit SlashingApproved(account, penalty);
  }

  /**
   * @notice Calls `LockedGold.slash` on `account` if `account` has an entry in `slashed`.
   * @param account Account to slash.
   * @param group Validators group of the account to slash.
   * @param electionLessers Lesser pointers for slashing locked election gold.
   * @param electionGreaters Greater pointers for slashing locked election gold.
   * @param electionIndices Indices of groups voted by slashed account.
   */
  function slash(
    address account,
    address group,
    address[] calldata electionLessers,
    address[] calldata electionGreaters,
    uint256[] calldata electionIndices
  ) external returns (bool) {
    return slashL2(account, group, electionLessers, electionGreaters, electionIndices);
  }

  /**
   * @notice Gets account penalty.
   * @param account Address that is punished.
   * @return Amount slashed.
   */
  function getApprovedSlashing(address account) external view returns (uint256) {
    return slashed[account];
  }

  function getSlasherExecuter() external view returns (address) {
    return slasherExecuter;
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 3, 0, 0);
  }

  /**
   * @notice Calls `LockedGold.slash` on `account` if `account` has an entry in `slashed`.
   * @param account Account to slash.
   * @param group Validators group of the account to slash.
   * @param electionLessers Lesser pointers for slashing locked election gold.
   * @param electionGreaters Greater pointers for slashing locked election gold.
   * @param electionIndices Indices of groups voted by slashed account.
   */
  function slashL2(
    address account,
    address group,
    address[] calldata electionLessers,
    address[] calldata electionGreaters,
    uint256[] calldata electionIndices
  ) public onlyAuthorizedToSlash returns (bool) {
    uint256 penalty = slashed[account];
    require(penalty > 0, "No penalty given by governance");
    slashed[account] = 0;

    ILockedGold lockedGold = getLockedGold();

    lockedGold.slash(
      account,
      penalty,
      address(0),
      0,
      electionLessers,
      electionGreaters,
      electionIndices
    );

    if (group != address(0)) {
      lockedGold.slash(
        group,
        penalty,
        address(0),
        0,
        electionLessers,
        electionGreaters,
        electionIndices
      );
      IValidators validators = getValidators();
      validators.forceDeaffiliateIfValidator(account);
      validators.halveSlashingMultiplier(group);
    }

    emit GovernanceSlashPerformed(account, group, penalty);
    return true;
  }
}
