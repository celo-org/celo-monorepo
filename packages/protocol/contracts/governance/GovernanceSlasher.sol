pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";

contract GovernanceSlasher is Ownable, Initializable, UsingRegistry {
  using SafeMath for uint256;
  // Maps a slashed address to the amount to be slashed.
  // Note that there is no reward paid when slashing via governance.
  mapping(address => uint256) slashed;

  event SlashingApproved(address indexed account, uint256 amount);
  event GovernanceSlashPerformed(address indexed account, uint256 amount);

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice Sets account penalty.
   * @param account Address that is punished.
   * @param penalty Amount of penalty in wei.
   * @dev Only callable by governance.
   */
  function approveSlashing(address account, uint256 penalty) external onlyOwner {
    slashed[account] = slashed[account].add(penalty);
    emit SlashingApproved(account, penalty);
  }

  /**
   * @notice Gets account penalty.
   * @param account Address that is punished.
   * @return Amount slashed.
   */
  function getApprovedSlashing(address account) external view returns (uint256) {
    return slashed[account];
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
  ) external returns (bool) {
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
}
