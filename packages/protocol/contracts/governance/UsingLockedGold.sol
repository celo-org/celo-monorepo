pragma solidity ^0.5.3;

import "./interfaces/ILockedGold.sol";
import "../common/UsingRegistry.sol";


/**
 * @title A contract for calling functions on the LockedGold contract.
 * @dev Any contract calling these functions should guard against reentrancy.
 */
contract UsingLockedGold is UsingRegistry {
  /**
   * @notice Returns the account associated with `accountOrVoter`.
   * @param accountOrVoter The address of the account or authorized voter.
   * @dev Fails if the `accountOrVoter` is not an account or authorized voter.
   * @return The associated account.
   */
  function getAccountFromVoter(address accountOrVoter) internal view returns (address) {
    return getLockedGold().getAccountFromVoter(accountOrVoter);
  }

  /**
   * @notice Returns the account associated with `accountOrValidator`.
   * @param accountOrValidator The address of the account or authorized validator.
   * @dev Fails if the `accountOrValidator` is not an account or authorized validator.
   * @return The associated account.
   */
  function getAccountFromValidator(address accountOrValidator) internal view returns (address) {
    return getLockedGold().getAccountFromValidator(accountOrValidator);
  }

  /**
   * @notice Returns the validator address for a particular account.
   * @param account The account.
   * @return The associated validator address.
   */
  function getValidatorFromAccount(address account) internal view returns (address) {
    return getLockedGold().getValidatorFromAccount(account);
  }

  function getTotalLockedGold() internal view returns (uint256) {
    return getLockedGold().getTotalLockedGold();
  }

  function getAccountTotalLockedGold(address account) internal view returns (uint256) {
    return getLockedGold().getAccountTotalLockedGold(account);
  }

  function incrementNonvotingAccountBalance(address account, uint256 value) internal returns (bool) {
    return getLockedGold().incrementNonvotingAccountBalance(account, value);
  }

  function decrementNonvotingAccountBalance(address account, uint256 value) internal returns (bool) {
    return getLockedGold().decrementNonvotingAccountBalance(account, value);
  }

  function getLockedGold() internal view returns(ILockedGold) {
    return ILockedGold(registry.getAddressForOrDie(LOCKED_GOLD_REGISTRY_ID));
  }
}
