pragma solidity ^0.5.8;

import "./interfaces/IBondedDeposits.sol";
import "../common/UsingRegistry.sol";


/**
 * @title A contract for calling functions on the BondedDeposits contract.
 * @dev Any contract calling these functions should guard against reentrancy.
 */
contract UsingBondedDeposits is UsingRegistry {

  /**
   * @notice Returns whether or not an account's voting power is frozen.
   * @param account The address of the account.
   * @return Whether or not the account's voting power is frozen.
   * @dev Frozen accounts can retract existing votes but not make future votes.
   */
  function isVotingFrozen(address account) internal view returns (bool) {
    return getBondedDeposits().isVotingFrozen(account);
  }

  /**
   * @notice Returns the account associated with the provided account or voting delegate.
   * @param accountOrDelegate The address of the account or voting delegate.
   * @dev Fails if the `accountOrDelegate` is a non-voting delegate.
   * @return The associated account.
   */
  function getAccountFromVoter(address accountOrDelegate) internal view returns (address) {
    return getBondedDeposits().getAccountFromVoter(accountOrDelegate);
  }

  /**
   * @notice Returns the validator address for a particular account.
   * @param account The account.
   * @return The associated validator address.
   */
  function getValidatorFromAccount(address account) internal view returns (address) {
    return getBondedDeposits().getValidatorFromAccount(account);
  }

  /**
   * @notice Returns the account associated with the provided account or validating delegate.
   * @param accountOrDelegate The address of the account or validating delegate.
   * @dev Fails if the `accountOrDelegate` is a non-validating delegate.
   * @return The associated account.
   */
  function getAccountFromValidator(address accountOrDelegate) internal view returns (address) {
    return getBondedDeposits().getAccountFromValidator(accountOrDelegate);
  }

  /**
   * @notice Returns voting weight for a particular account.
   * @param account The address of the account.
   * @return The voting weight of `account`.
   */
  function getAccountWeight(address account) internal view returns (uint256) {
    return getBondedDeposits().getAccountWeight(account);
  }

  /**
   * @notice Returns the total weight across all accounts.
   * @return The total weight.
   */
  function totalWeight() internal view returns (uint256) {
    return getBondedDeposits().totalWeight();
  }

  /**
   * @notice Returns the bonded deposit value for particular account and notice period.
   * @param account The address of the account.
   * @param noticePeriod The notice period of the bonded deposit.
   * @return The value of the bonded deposit.
   */
  function getBondedDepositValue(
    address account,
    uint256 noticePeriod
  )
    internal
    view
    returns (uint256)
  {
    uint256 value;
    (value,) = getBondedDeposits().getBondedDeposit(account, noticePeriod);
    return value;
  }

  function getBondedDeposits() private view returns(IBondedDeposits) {
    return IBondedDeposits(registry.getAddressFor(BONDED_DEPOSITS_REGISTRY_ID));
  }
}
