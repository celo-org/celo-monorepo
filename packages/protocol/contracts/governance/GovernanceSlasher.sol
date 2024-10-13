pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "./interfaces/IValidators.sol";
import "../../contracts-0.8/common/IsL2Check.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

// import {console} from "forge-std/console.sol";

contract GovernanceSlasher is
  Ownable,
  Initializable,
  UsingRegistry,
  ICeloVersionedContract,
  IsL2Check
{
  using SafeMath for uint256;
  // Maps a slashed address to the amount to be slashed.
  // Note that there is no reward paid when slashing via governance.
  mapping(address => uint256) slashed;

  event SlashingApproved(address indexed account, uint256 amount);
  event GovernanceSlashPerformed(address indexed account, uint256 amount);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 1, 0);
  }

  /**
   * @notice Sets account penalty.
   * @param account Address that is punished.
   * @param penalty Amount of penalty in wei.
   * @dev Only callable by governance.
   */
  function approveSlashing(
    address account,
    uint256 penalty
  )
    external
    onlyOwner // slashing multisig?
  {
    slashed[account] = slashed[account].add(penalty);
    emit SlashingApproved(account, penalty);
  }

  /**
   * @notice Calls `LockedGold.slash` on `account` if `account` has an entry in `slashed`.
   * @param account Account to slash
   * @param electionLessers Lesser pointers for slashing locked election gold.
   * @param electionGreaters Greater pointers for slashing locked election gold.
   * @param electionIndices Indices of groups voted by slashed account.
   */
  function slash(
    address account,
    address[] calldata electionLessers,
    address[] calldata electionGreaters,
    uint256[] calldata electionIndices
  ) external onlyL1 returns (bool) {
    uint256 penalty = slashed[account];
    require(penalty > 0, "No penalty given by governance");
    slashed[account] = 0;
    getLockedGold().slash(
      account,
      penalty,
      address(0),
      0,
      electionLessers,
      electionGreaters,
      electionIndices
    );
    emit GovernanceSlashPerformed(account, penalty);
    return true;
  }

  /**
   * @notice Calls `LockedGold.slash` on `account` if `account` has an entry in `slashed`.
   * @param account Account to slash
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
  )
    external
    onlyL2
    onlyOwner // TODO slashing multisig + governance
    returns (bool)
  {
    uint256 penalty = slashed[account];
    require(penalty > 0, "No penalty given by governance");
    slashed[account] = 0;
    getLockedGold().slash(
      account,
      penalty,
      address(0),
      0,
      electionLessers,
      electionGreaters,
      electionIndices
    );

    IValidators validators = getValidators();

    if (group != address(0)) {
      validators.forceDeaffiliateIfValidator(account);
      validators.halveSlashingMultiplier(group);
    }

    emit GovernanceSlashPerformed(account, penalty);
    return true;
  }

  /**
   * @notice Gets account penalty.
   * @param account Address that is punished.
   * @return Amount slashed.
   */
  function getApprovedSlashing(address account) external view returns (uint256) {
    return slashed[account];
  }
}
