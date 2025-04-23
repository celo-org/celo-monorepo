pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "./interfaces/IValidators.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

contract GovernanceSlasher is Ownable, Initializable, UsingRegistry, ICeloVersionedContract {
  using SafeMath for uint256;
  // Maps a slashed address to the amount to be slashed.
  // Note that there is no reward paid when slashing via governance.
  mapping(address => uint256) slashed;
  address internal slasherExecuter;

  event SlashingApproved(address indexed account, uint256 amount);
  event GovernanceSlashPerformed(address indexed account, uint256 amount);
  event GovernanceSlashL2Performed(address indexed account, address indexed group, uint256 amount);
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
    return (1, 2, 0, 0);
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
   * @param account Account to slash
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
  ) external onlyAuthorizedToSlash returns (bool) {
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

    emit GovernanceSlashL2Performed(account, group, penalty);
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

  function getSlasherExecuter() external view returns (address) {
    return slasherExecuter;
  }
}
