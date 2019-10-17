pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IAccounts.sol";

import "../common/Initializable.sol";
import "../common/Signatures.sol";
import "../common/UsingRegistry.sol";

contract Accounts is IAccounts, ReentrancyGuard, Initializable, UsingRegistry {

  using SafeMath for uint256;

  struct Authorizations {
    // The address that is authorized to vote on behalf of the account.
    // The account can vote as well, whether or not an authorized voter has been specified.
    address voting;
    // The address that is authorized to validate on behalf of the account.
    // The account can manage the validator, whether or not an authorized validator has been
    // specified. However if an authorized validator has been specified, only that key may actually
    // participate in consensus.
    address validating;

    // The address of the key with which this account wants to sign attestations on the Attestations
    // contract
    address attesting;
  }

  struct Account {
    bool exists;
    // Each account may authorize additional keys to use for voting or valdiating.
    // These keys may not be keys of other accounts, and may not be authorized by any other
    // account for any purpose.
    Authorizations authorizations;
  }

  mapping(address => Account) private accounts;

  // Maps voting and validating keys to the account that provided the authorization.
  mapping(address => address) public authorizedBy;


  event AttestorAuthorized(address indexed account, address attestor);
  event VoterAuthorized(address indexed account, address voter);
  event ValidatorAuthorized(address indexed account, address validator);
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Creates an account.
   * @return True if account creation succeeded.
   */
  function createAccount() external returns (bool) {
    require(isNotAccount(msg.sender) && isNotAuthorized(msg.sender));
    Account storage account = accounts[msg.sender];
    account.exists = true;
    return true;
  }

  /**
   * @notice Authorizes an address to vote on behalf of the account.
   * @param voter The address to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `voter`'s signature on `msg.sender`.
   */
  function authorizeVoter(
    address voter,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    nonReentrant
  {
    Account storage account = accounts[msg.sender];
    authorize(voter, account.authorizations.voting, v, r, s);
    account.authorizations.voting = voter;
    emit VoterAuthorized(msg.sender, voter);
  }

  /**
   * @notice Authorizes an address to validate on behalf of the account.
   * @param validator The address to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `validator`'s signature on `msg.sender`.
   */
  function authorizeValidator(
    address validator,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    nonReentrant
  {
    Account storage account = accounts[msg.sender];
    authorize(validator, account.authorizations.validating, v, r, s);
    account.authorizations.validating = validator;
    emit ValidatorAuthorized(msg.sender, validator);
  }

  /**
   * @notice Authorizes an address to attest on behalf
   * @param attestor The address of the attestor to set for the account
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `attestor`'s signature on `msg.sender`.
   */
  function authorizeAttestor(
    address attestor,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
  {
    Account storage account = accounts[msg.sender];
    authorize(attestor, account.authorizations.attesting, v, r, s);
    account.authorizations.attesting = attestor;
    emit AttestorAuthorized(msg.sender, attestor);
  }

  /**
   * @notice Returns the account associated with `accountOrAttestor`.
   * @param accountOrAttestor The address of the account or authorized attestor.
   * @dev Fails if the `accountOrAttestor` is not an account or authorized attestor.
   * @return The associated account.
   */
  function getAccountFromAttestor(address accountOrAttestor) public view returns (address) {
    address authorizingAccount = authorizedBy[accountOrAttestor];
    if (authorizingAccount != address(0)) {
      require(accounts[authorizingAccount].authorizations.attesting == accountOrAttestor);
      return authorizingAccount;
    } else {
      return accountOrAttestor;
    }
  }

  /**
   * @notice Returns the account associated with `accountOrVoter`.
   * @param accountOrVoter The address of the account or authorized voter.
   * @dev Fails if the `accountOrVoter` is not an account or authorized voter.
   * @return The associated account.
   */
  function getAccountFromVoter(address accountOrVoter) external view returns (address) {
    address authorizingAccount = authorizedBy[accountOrVoter];
    if (authorizingAccount != address(0)) {
      require(accounts[authorizingAccount].authorizations.voting == accountOrVoter);
      return authorizingAccount;
    } else {
      require(isAccount(accountOrVoter));
      return accountOrVoter;
    }
  }

  /**
   * @notice Returns the account associated with `accountOrValidator`.
   * @param accountOrValidator The address of the account or authorized validator.
   * @dev Fails if the `accountOrValidator` is not an account or authorized validator.
   * @return The associated account.
   */
  function getAccountFromValidator(address accountOrValidator) public view returns (address) {
    address authorizingAccount = authorizedBy[accountOrValidator];
    if (authorizingAccount != address(0)) {
      require(accounts[authorizingAccount].authorizations.validating == accountOrValidator);
      return authorizingAccount;
    } else {
      require(isAccount(accountOrValidator));
      return accountOrValidator;
    }
  }

  /**
   * @notice Returns the voter for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can vote.
   */
  function getVoterFromAccount(address account) public view returns (address) {
    require(isAccount(account));
    address voter = accounts[account].authorizations.voting;
    return voter == address(0) ? account : voter;
  }

  /**
   * @notice Returns the validator for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can register a validator or group.
   */
  function getValidatorFromAccount(address account) public view returns (address) {
    require(isAccount(account));
    address validator = accounts[account].authorizations.validating;
    return validator == address(0) ? account : validator;
  }

  /**
   * @notice Returns the attestor for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can attest.
   */
  function getAttestorFromAccount(address account) public view returns (address) {
    address attestor = accounts[account].authorizations.attesting;
    return attestor == address(0) ? account : attestor;
  }

    /**
   * @notice Authorizes voting or validating power of `msg.sender`'s account to another address.
   * @param current The address to authorize.
   * @param previous The previous authorized address.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Fails if the address is already authorized or is an account.
   * @dev v, r, s constitute `current`'s signature on `msg.sender`.
   */
  function authorize(
    address current,
    address previous,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    private
  {
    require(isAccount(msg.sender) && isNotAccount(current) && isNotAuthorized(current));

    address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
    require(signer == current);

    authorizedBy[previous] = address(0);
    authorizedBy[current] = msg.sender;
  }

  /**
   * @notice Check if an account already exists.
   * @param account The address of the account
   * @return Returns `true` if account exists. Returns `false` otherwise.
   */
  function isAccount(address account) public view returns (bool) {
    return (accounts[account].exists);
  }

  /**
   * @notice Check if an account already exists.
   * @param account The address of the account
   * @return Returns `false` if account exists. Returns `true` otherwise.
   */
  function isNotAccount(address account) internal view returns (bool) {
    return (!accounts[account].exists);
  }

    /**
   * @notice Check if an address has been authorized by an account for voting or validating.
   * @param account The possibly authorized address.
   * @return Returns `true` if authorized. Returns `false` otherwise.
   */
  function isAuthorized(address account) external view returns (bool) {
    return (authorizedBy[account] != address(0));
  }

  /**
   * @notice Check if an address has been authorized by an account for voting or validating.
   * @param account The possibly authorized address.
   * @return Returns `false` if authorized. Returns `true` otherwise.
   */
  function isNotAuthorized(address account) internal view returns (bool) {
    return (authorizedBy[account] == address(0));
  }
}