pragma solidity ^0.5.3;

import "./interfaces/ILockedGold.sol";
import "../common/UsingRegistry.sol";


/**
 * @title A contract for calling functions on the LockedGold contract.
 * @dev Any contract calling these functions should guard against reentrancy.
 */
contract UsingLockedGold is UsingRegistry {
  /**
   * @notice Returns whether or not an account's voting power is frozen.
   * @param account The address of the account.
   * @return Whether or not the account's voting power is frozen.
   * @dev Frozen accounts can retract existing votes but not make future votes.
   */
  function isVotingFrozen(address account) internal view returns (bool) {
    return getLockedGold().isVotingFrozen(account);
  }

  /**
   * @notice Returns the account associated with the provided account or voting delegate.
   * @param accountOrDelegate The address of the account or voting delegate.
   * @dev Fails if the `accountOrDelegate` is a non-voting delegate.
   * @return The associated account.
   */
  function getAccountFromVoter(address accountOrDelegate) internal view returns (address) {
    return getLockedGold().getAccountFromDelegateAndRole(
      accountOrDelegate,
      ILockedGold.DelegateRole.Voting
    );
  }

  /**
   * @notice Returns the validator address for a particular account.
   * @param account The account.
   * @return The associated validator address.
   */
  function getValidatorFromAccount(address account) internal view returns (address) {
    return getLockedGold().getDelegateFromAccountAndRole(
      account,
      ILockedGold.DelegateRole.Validating
    );
  }

  /**
   * @notice Returns the account associated with the provided account or validating delegate.
   * @param accountOrDelegate The address of the account or validating delegate.
   * @dev Fails if the `accountOrDelegate` is a non-validating delegate.
   * @return The associated account.
   */
  function getAccountFromValidator(address accountOrDelegate) internal view returns (address) {
    return getLockedGold().getAccountFromDelegateAndRole(
      accountOrDelegate,
      ILockedGold.DelegateRole.Validating
    );
  }

  /**
   * @notice Returns voting weight for a particular account.
   * @param account The address of the account.
   * @return The voting weight of `account`.
   */
  function getAccountWeight(address account) internal view returns (uint256) {
    return getLockedGold().getAccountWeight(account);
  }

  /**
  * @notice Returns the total weight.
  * @return Total account weight.
  */
  function getTotalWeight() internal view returns (uint256) {
    return getLockedGold().totalWeight();
  }

  /**
   * @notice Returns the Locked Gold commitment value for particular account and notice period.
   * @param account The address of the account.
   * @param noticePeriod The notice period of the Locked Gold commitment.
   * @return The value of the Locked Gold commitment.
   */
  function getLockedCommitmentValue(
    address account,
    uint256 noticePeriod
  )
    internal
    view
    returns (uint256)
  {
    uint256 value;
    (value,) = getLockedGold().getLockedCommitment(account, noticePeriod);
    return value;
  }

  function getLockedGold() private view returns(ILockedGold) {
    return ILockedGold(registry.getAddressForOrDie(LOCKED_GOLD_REGISTRY_ID));
  }
}
