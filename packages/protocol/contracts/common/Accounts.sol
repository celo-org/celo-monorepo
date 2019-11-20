pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "./interfaces/IAccounts.sol";

import "../common/Initializable.sol";
import "../common/Signatures.sol";
import "../common/UsingRegistry.sol";

contract Accounts is IAccounts, Ownable, ReentrancyGuard, Initializable, UsingRegistry {
  using SafeMath for uint256;

  struct Signers {
    //The address that is authorized to vote in governance and validator elections on behalf of the
    // account. The account can vote as well, whether or not an vote signing key has been specified.
    address vote;
    // The address that is authorized to manage a validator or validator group and sign consensus
    // messages on behalf of the account. The account can manage the validator, whether or not an
    // validator signing key has been specified. However if an validator signing key has been
    // specified, only that key may actually participate in consensus.
    address validator;
    // The address of the key with which this account wants to sign attestations on the Attestations
    // contract
    address attestation;
  }

  struct Account {
    bool exists;
    // Each account may authorize signing keys to use for voting, valdiating or attestation.
    // These keys may not be keys of other accounts, and may not be authorized by any other
    // account for any purpose.
    Signers signers;
    // The address at which the account expects to receive transfers. If it's empty/0x0, the
    // account indicates that an address exchange should be initiated with the dataEncryptionKey
    address walletAddress;
    // An optional human readable identifier for the account
    string name;
    // The ECDSA public key used to encrypt and decrypt data for this account
    bytes dataEncryptionKey;
    // The URL under which an account adds metadata and claims
    string metadataURL;
  }

  mapping(address => Account) private accounts;
  // Maps authorized signers to the account that provided the authorization.
  mapping(address => address) public authorizedBy;

  event AttestationSignerAuthorized(address indexed account, address signer);
  event VoteSignerAuthorized(address indexed account, address signer);
  event ValidatorSignerAuthorized(address indexed account, address signer);
  event AccountDataEncryptionKeySet(address indexed account, bytes dataEncryptionKey);
  event AccountNameSet(address indexed account, string name);
  event AccountMetadataURLSet(address indexed account, string metadataURL);
  event AccountWalletAddressSet(address indexed account, address walletAddress);
  event AccountCreated(address indexed account);

  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice Convenience Setter for the dataEncryptionKey and wallet address for an account
   * @param name A string to set as the name of the account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account
   */
  function setAccount(string calldata name, bytes calldata dataEncryptionKey, address walletAddress)
    external
  {
    if (!isAccount(msg.sender)) {
      createAccount();
    }
    setName(name);
    setAccountDataEncryptionKey(dataEncryptionKey);
    setWalletAddress(walletAddress);
  }

  /**
   * @notice Creates an account.
   * @return True if account creation succeeded.
   */
  function createAccount() public returns (bool) {
    require(isNotAccount(msg.sender) && isNotAuthorizedSigner(msg.sender));
    Account storage account = accounts[msg.sender];
    account.exists = true;
    emit AccountCreated(msg.sender);
    return true;
  }

  /**
   * @notice Setter for the name of an account.
   * @param name The name to set.
   */
  function setName(string memory name) public {
    require(isAccount(msg.sender));
    accounts[msg.sender].name = name;
    emit AccountNameSet(msg.sender, name);
  }

  /**
   * @notice Setter for the wallet address for an account
   * @param walletAddress The wallet address to set for the account
   */
  function setWalletAddress(address walletAddress) public {
    require(isAccount(msg.sender));
    accounts[msg.sender].walletAddress = walletAddress;
    emit AccountWalletAddressSet(msg.sender, walletAddress);
  }

  /**
   * @notice Setter for the data encryption key and version.
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   */
  function setAccountDataEncryptionKey(bytes memory dataEncryptionKey) public {
    require(dataEncryptionKey.length >= 33, "data encryption key length <= 32");
    accounts[msg.sender].dataEncryptionKey = dataEncryptionKey;
    emit AccountDataEncryptionKeySet(msg.sender, dataEncryptionKey);
  }

  /**
   * @notice Setter for the metadata of an account.
   * @param metadataURL The URL to access the metadata.
   */
  function setMetadataURL(string calldata metadataURL) external {
    require(isAccount(msg.sender));
    accounts[msg.sender].metadataURL = metadataURL;
    emit AccountMetadataURLSet(msg.sender, metadataURL);
  }

  /**
   * @notice Authorizes an address to sign votes on behalf of the account.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender`.
   */
  function authorizeVoteSigner(address signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
  {
    Account storage account = accounts[msg.sender];
    authorize(signer, v, r, s);
    account.signers.vote = signer;
    emit VoteSignerAuthorized(msg.sender, signer);
  }

  /**
   * @notice Authorizes an address to sign consensus messages on behalf of the account.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender`.
   */
  function authorizeValidatorSigner(address signer, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
  {
    Account storage account = accounts[msg.sender];
    authorize(signer, v, r, s);
    account.signers.validator = signer;
    require(!getValidators().isValidator(msg.sender));
    emit ValidatorSignerAuthorized(msg.sender, signer);
  }

  /**
   * @notice Authorizes an address to sign consensus messages on behalf of the account.
   * @param signer The address of the signing key to authorize.
   * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender`.
   */
  function authorizeValidatorSigner(
    address signer,
    bytes calldata ecdsaPublicKey,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external nonReentrant {
    Account storage account = accounts[msg.sender];
    authorize(signer, v, r, s);
    account.signers.validator = signer;
    require(getValidators().updateEcdsaPublicKey(msg.sender, signer, ecdsaPublicKey));
    emit ValidatorSignerAuthorized(msg.sender, signer);
  }

  /**
   * @notice Authorizes an address to sign attestations on behalf of the account.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender`.
   */
  function authorizeAttestationSigner(address signer, uint8 v, bytes32 r, bytes32 s) public {
    Account storage account = accounts[msg.sender];
    authorize(signer, v, r, s);
    account.signers.attestation = signer;
    emit AttestationSignerAuthorized(msg.sender, signer);
  }

  /**
   * @notice Returns the account associated with `signer`.
   * @param signer The address of the account or currently authorized attestation signer.
   * @dev Fails if the `signer` is not an account or currently authorized attestation signer.
   * @return The associated account.
   */
  function attestationSignerToAccount(address signer) external view returns (address) {
    address authorizingAccount = authorizedBy[signer];
    if (authorizingAccount != address(0)) {
      require(accounts[authorizingAccount].signers.attestation == signer);
      return authorizingAccount;
    } else {
      require(isAccount(signer));
      return signer;
    }
  }

  /**
   * @notice Returns the account associated with `signer`.
   * @param signer The address of an account or currently authorized validator signer.
   * @dev Fails if the `signer` is not an account or currently authorized validator.
   * @return The associated account.
   */
  function validatorSignerToAccount(address signer) public view returns (address) {
    address authorizingAccount = authorizedBy[signer];
    if (authorizingAccount != address(0)) {
      require(accounts[authorizingAccount].signers.validator == signer);
      return authorizingAccount;
    } else {
      require(isAccount(signer));
      return signer;
    }
  }

  /**
   * @notice Returns the account associated with `signer`.
   * @param signer The address of the account or currently authorized vote signer.
   * @dev Fails if the `signer` is not an account or currently authorized vote signer.
   * @return The associated account.
   */
  function voteSignerToAccount(address signer) external view returns (address) {
    address authorizingAccount = authorizedBy[signer];
    if (authorizingAccount != address(0)) {
      require(accounts[authorizingAccount].signers.vote == signer);
      return authorizingAccount;
    } else {
      require(isAccount(signer));
      return signer;
    }
  }

  /**
   * @notice Returns the account associated with `signer`.
   * @param signer The address of the account or previously authorized signer.
   * @dev Fails if the `signer` is not an account or previously authorized signer.
   * @return The associated account.
   */
  function signerToAccount(address signer) external view returns (address) {
    address authorizingAccount = authorizedBy[signer];
    if (authorizingAccount != address(0)) {
      return authorizingAccount;
    } else {
      require(isAccount(signer));
      return signer;
    }
  }

  /**
   * @notice Returns the vote signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can sign votes.
   */
  function getVoteSigner(address account) public view returns (address) {
    require(isAccount(account));
    address signer = accounts[account].signers.vote;
    return signer == address(0) ? account : signer;
  }

  /**
   * @notice Returns the validator signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can register a validator or group.
   */
  function getValidatorSigner(address account) public view returns (address) {
    require(isAccount(account));
    address signer = accounts[account].signers.validator;
    return signer == address(0) ? account : signer;
  }

  /**
   * @notice Returns the attestation signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can sign attestations.
   */
  function getAttestationSigner(address account) public view returns (address) {
    require(isAccount(account));
    address signer = accounts[account].signers.attestation;
    return signer == address(0) ? account : signer;
  }

  /**
   * @notice Getter for the name of an account.
   * @param account The address of the account to get the name for.
   * @return name The name of the account.
   */
  function getName(address account) external view returns (string memory) {
    return accounts[account].name;
  }

  /**
   * @notice Getter for the metadata of an account.
   * @param account The address of the account to get the metadata for.
   * @return metadataURL The URL to access the metadata.
   */
  function getMetadataURL(address account) external view returns (string memory) {
    return accounts[account].metadataURL;
  }

  /**
   * @notice Getter for the metadata of multiple accounts.
   * @param accountsToQuery The addresses of the accounts to get the metadata for.
   * @return (stringLengths[] - the length of each string in bytes
   *          data - all strings concatenated
   *         )
   */
  function batchGetMetadataURL(address[] calldata accountsToQuery)
    external
    view
    returns (uint256[] memory, bytes memory)
  {
    uint256 totalSize = 0;
    uint256[] memory sizes = new uint256[](accountsToQuery.length);
    for (uint256 i = 0; i < accountsToQuery.length; i = i.add(1)) {
      sizes[i] = bytes(accounts[accountsToQuery[i]].metadataURL).length;
      totalSize = totalSize.add(sizes[i]);
    }

    bytes memory data = new bytes(totalSize);
    uint256 pointer = 0;
    for (uint256 i = 0; i < accountsToQuery.length; i = i.add(1)) {
      for (uint256 j = 0; j < sizes[i]; j = j.add(1)) {
        data[pointer] = bytes(accounts[accountsToQuery[i]].metadataURL)[j];
        pointer = pointer.add(1);
      }
    }
    return (sizes, data);
  }

  /**
   * @notice Getter for the data encryption key and version.
   * @param account The address of the account to get the key for
   * @return dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   */
  function getDataEncryptionKey(address account) external view returns (bytes memory) {
    return accounts[account].dataEncryptionKey;
  }

  /**
   * @notice Getter for the wallet address for an account
   * @param account The address of the account to get the wallet address for
   * @return Wallet address
   */
  function getWalletAddress(address account) external view returns (address) {
    return accounts[account].walletAddress;
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
   * @notice Check if an address has been an authorized signer for an account.
   * @param signer The possibly authorized address.
   * @return Returns `true` if authorized. Returns `false` otherwise.
   */
  function isAuthorizedSigner(address signer) external view returns (bool) {
    return (authorizedBy[signer] != address(0));
  }

  /**
   * @notice Check if an address has been an authorized signer for an account.
   * @param signer The possibly authorized address.
   * @return Returns `false` if authorized. Returns `true` otherwise.
   */
  function isNotAuthorizedSigner(address signer) internal view returns (bool) {
    return (authorizedBy[signer] == address(0));
  }

  /**
   * @notice Authorizes some role of of `msg.sender`'s account to another address.
   * @param authorized The address to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Fails if the address is already authorized or is an account.
   * @dev Note that once an address is authorized, it may never be authorized again.
   * @dev v, r, s constitute `current`'s signature on `msg.sender`.
   */
  function authorize(address authorized, uint8 v, bytes32 r, bytes32 s) private {
    require(isAccount(msg.sender) && isNotAccount(authorized) && isNotAuthorizedSigner(authorized));

    address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
    require(signer == authorized);

    authorizedBy[authorized] = msg.sender;
  }
}
