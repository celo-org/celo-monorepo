pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IAccounts.sol";

import "../common/FixidityLib.sol";
import "../common/Initializable.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/Signatures.sol";
import "../common/UsingRegistry.sol";
import "../common/libraries/ReentrancyGuard.sol";

contract Accounts is
  IAccounts,
  ICeloVersionedContract,
  Ownable,
  ReentrancyGuard,
  Initializable,
  UsingRegistry
{
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  struct Signers {
    // The address that is authorized to vote in governance and validator elections on behalf of the
    // account. The account can vote as well, whether or not a vote signing key has been specified.
    address vote;
    // The address that is authorized to manage a validator or validator group and sign consensus
    // messages on behalf of the account. The account can manage the validator, whether or not a
    // validator signing key has been specified. However, if a validator signing key has been
    // specified, only that key may actually participate in consensus.
    address validator;
    // The address of the key with which this account wants to sign attestations on the Attestations
    // contract
    address attestation;
  }

  struct SignerAuthorization {
    bool started;
    bool completed;
  }

  struct Account {
    bool exists;
    // [Deprecated] Each account may authorize signing keys to use for voting,
    // validating or attestation. These keys may not be keys of other accounts,
    // and may not be authorized by any other account for any purpose.
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

  struct PaymentDelegation {
    // Address that should receive a fraction of validator payments.
    address beneficiary;
    // Fraction of payment to delegate to `beneficiary`.
    FixidityLib.Fraction fraction;
  }

  mapping(address => Account) internal accounts;
  // Maps authorized signers to the account that provided the authorization.
  mapping(address => address) public authorizedBy;
  // Default signers by account (replaces the legacy Signers struct on Account)
  mapping(address => mapping(bytes32 => address)) defaultSigners;
  // All signers and their roles for a given account
  // solhint-disable-next-line max-line-length
  mapping(address => mapping(bytes32 => mapping(address => SignerAuthorization))) signerAuthorizations;

  bytes32 public constant EIP712_AUTHORIZE_SIGNER_TYPEHASH = keccak256(
    "AuthorizeSigner(address account,address signer,bytes32 role)"
  );
  bytes32 public eip712DomainSeparator;

  // A per-account list of CIP8 storage roots, bypassing CIP3.
  mapping(address => bytes[]) public offchainStorageRoots;

  // Optional per-account validator payment delegation information.
  mapping(address => PaymentDelegation) internal paymentDelegations;

  bytes32 constant ValidatorSigner = keccak256(abi.encodePacked("celo.org/core/validator"));
  bytes32 constant AttestationSigner = keccak256(abi.encodePacked("celo.org/core/attestation"));
  bytes32 constant VoteSigner = keccak256(abi.encodePacked("celo.org/core/vote"));

  event AttestationSignerAuthorized(address indexed account, address signer);
  event VoteSignerAuthorized(address indexed account, address signer);
  event ValidatorSignerAuthorized(address indexed account, address signer);
  event SignerAuthorized(address indexed account, address signer, bytes32 indexed role);
  event SignerAuthorizationStarted(address indexed account, address signer, bytes32 indexed role);
  event SignerAuthorizationCompleted(address indexed account, address signer, bytes32 indexed role);
  event AttestationSignerRemoved(address indexed account, address oldSigner);
  event VoteSignerRemoved(address indexed account, address oldSigner);
  event ValidatorSignerRemoved(address indexed account, address oldSigner);
  event IndexedSignerSet(address indexed account, address signer, bytes32 role);
  event IndexedSignerRemoved(address indexed account, address oldSigner, bytes32 role);
  event DefaultSignerSet(address indexed account, address signer, bytes32 role);
  event DefaultSignerRemoved(address indexed account, address oldSigner, bytes32 role);
  event LegacySignerSet(address indexed account, address signer, bytes32 role);
  event LegacySignerRemoved(address indexed account, address oldSigner, bytes32 role);
  event SignerRemoved(address indexed account, address oldSigner, bytes32 indexed role);
  event AccountDataEncryptionKeySet(address indexed account, bytes dataEncryptionKey);
  event AccountNameSet(address indexed account, string name);
  event AccountMetadataURLSet(address indexed account, string metadataURL);
  event AccountWalletAddressSet(address indexed account, address walletAddress);
  event AccountCreated(address indexed account);
  event OffchainStorageRootAdded(address indexed account, bytes url);
  event OffchainStorageRootRemoved(address indexed account, bytes url, uint256 index);
  event PaymentDelegationSet(address indexed beneficiary, uint256 fraction);

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 3, 0);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setEip712DomainSeparator();
  }

  /**
   * @notice Sets the EIP712 domain separator for the Celo Accounts abstraction.
   */
  function setEip712DomainSeparator() public {
    uint256 chainId;
    assembly {
      chainId := chainid
    }

    eip712DomainSeparator = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes("Celo Core Contracts")),
        keccak256("1.0"),
        chainId,
        address(this)
      )
    );
  }

  /**
   * @notice Convenience Setter for the dataEncryptionKey and wallet address for an account
   * @param name A string to set as the name of the account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender` (unless the wallet address
   *      is 0x0 or msg.sender).
   */
  function setAccount(
    string calldata name,
    bytes calldata dataEncryptionKey,
    address walletAddress,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    if (!isAccount(msg.sender)) {
      createAccount();
    }
    setName(name);
    setAccountDataEncryptionKey(dataEncryptionKey);
    setWalletAddress(walletAddress, v, r, s);
  }

  /**
   * @notice Creates an account.
   * @return True if account creation succeeded.
   */
  function createAccount() public returns (bool) {
    require(isNotAccount(msg.sender) && isNotAuthorizedSigner(msg.sender), "Account exists");
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
    require(isAccount(msg.sender), "Unknown account");
    Account storage account = accounts[msg.sender];
    account.name = name;
    emit AccountNameSet(msg.sender, name);
  }

  /**
   * @notice Setter for the wallet address for an account
   * @param walletAddress The wallet address to set for the account
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Wallet address can be zero. This means that the owner of the wallet
   *  does not want to be paid directly without interaction, and instead wants users to
   * contact them, using the data encryption key, and arrange a payment.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender` (unless the wallet address
   *      is 0x0 or msg.sender).
   */
  function setWalletAddress(address walletAddress, uint8 v, bytes32 r, bytes32 s) public {
    require(isAccount(msg.sender), "Unknown account");
    if (!(walletAddress == msg.sender || walletAddress == address(0x0))) {
      address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
      require(signer == walletAddress, "Invalid signature");
    }
    Account storage account = accounts[msg.sender];
    account.walletAddress = walletAddress;
    emit AccountWalletAddressSet(msg.sender, walletAddress);
  }

  /**
   * @notice Setter for the data encryption key and version.
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   */
  function setAccountDataEncryptionKey(bytes memory dataEncryptionKey) public {
    require(dataEncryptionKey.length >= 33, "data encryption key length <= 32");
    Account storage account = accounts[msg.sender];
    account.dataEncryptionKey = dataEncryptionKey;
    emit AccountDataEncryptionKeySet(msg.sender, dataEncryptionKey);
  }

  /**
   * @notice Setter for the metadata of an account.
   * @param metadataURL The URL to access the metadata.
   */
  function setMetadataURL(string calldata metadataURL) external {
    require(isAccount(msg.sender), "Unknown account");
    Account storage account = accounts[msg.sender];
    account.metadataURL = metadataURL;
    emit AccountMetadataURLSet(msg.sender, metadataURL);
  }

  /**
   * @notice Adds a new CIP8 storage root.
   * @param url The URL pointing to the offchain storage root.
   */
  function addStorageRoot(bytes calldata url) external {
    require(isAccount(msg.sender), "Unknown account");
    offchainStorageRoots[msg.sender].push(url);
    emit OffchainStorageRootAdded(msg.sender, url);
  }

  /**
   * @notice Removes a CIP8 storage root.
   * @param index The index of the storage root to be removed in the account's
   * list of storage roots.
   * @dev The order of storage roots may change after this operation (the last
   * storage root will be moved to `index`), be aware of this if removing
   * multiple storage roots at a time.
   */
  function removeStorageRoot(uint256 index) external {
    require(isAccount(msg.sender), "Unknown account");
    require(index < offchainStorageRoots[msg.sender].length);
    uint256 lastIndex = offchainStorageRoots[msg.sender].length - 1;
    bytes memory url = offchainStorageRoots[msg.sender][index];
    offchainStorageRoots[msg.sender][index] = offchainStorageRoots[msg.sender][lastIndex];
    offchainStorageRoots[msg.sender].length--;
    emit OffchainStorageRootRemoved(msg.sender, url, index);
  }

  /**
   * @notice Returns the full list of offchain storage roots for an account.
   * @param account The account whose storage roots to return.
   * @return List of storage root URLs.
   */
  function getOffchainStorageRoots(address account)
    external
    view
    returns (bytes memory, uint256[] memory)
  {
    require(isAccount(account), "Unknown account");
    uint256 numberRoots = offchainStorageRoots[account].length;
    uint256 totalLength = 0;
    for (uint256 i = 0; i < numberRoots; i++) {
      totalLength += offchainStorageRoots[account][i].length;
    }

    bytes memory concatenated = new bytes(totalLength);
    uint256 lastIndex = 0;
    uint256[] memory lengths = new uint256[](numberRoots);
    for (uint256 i = 0; i < numberRoots; i++) {
      bytes storage root = offchainStorageRoots[account][i];
      lengths[i] = root.length;
      for (uint256 j = 0; j < lengths[i]; j++) {
        concatenated[lastIndex] = root[j];
        lastIndex++;
      }
    }

    return (concatenated, lengths);
  }

  /**
   * @notice Sets validator payment delegation settings.
   * @param beneficiary The address that should receive a portion of vaidator
   * payments.
   * @param fraction The fraction of the validator's payment that should be
   * diverted to `beneficiary` every epoch, given as FixidyLib value. Must not
   * be greater than 1.
   */
  function setPaymentDelegation(address beneficiary, uint256 fraction) public {
    require(isAccount(msg.sender), "Not an account");
    FixidityLib.Fraction memory f = FixidityLib.wrap(fraction);
    require(f.lte(FixidityLib.fixed1()), "Fraction must not be greater than 1");
    paymentDelegations[msg.sender] = PaymentDelegation(beneficiary, f);
    emit PaymentDelegationSet(beneficiary, fraction);
  }

  /**
   * @notice Gets validator payment delegation settings.
   * @return Beneficiary address and fraction of payment delegated.
   */
  function getPaymentDelegation(address account) external view returns (address, uint256) {
    PaymentDelegation storage delegation = paymentDelegations[account];
    return (delegation.beneficiary, delegation.fraction.unwrap());
  }

  /**
   * @notice Set the indexed signer for a specific role
   * @param signer the address to set as default
   * @param role the role to register a default signer for
   */
  function setIndexedSigner(address signer, bytes32 role) public {
    require(isAccount(msg.sender), "Not an account");
    require(isNotAccount(signer), "Cannot authorize account as signer");
    require(
      isNotAuthorizedSignerForAnotherAccount(msg.sender, signer),
      "Not a signer for this account"
    );
    require(isSigner(msg.sender, signer, role), "Must authorize signer before setting as default");

    Account storage account = accounts[msg.sender];
    if (isLegacyRole(role)) {
      if (role == VoteSigner) {
        account.signers.vote = signer;
      } else if (role == AttestationSigner) {
        account.signers.attestation = signer;
      } else if (role == ValidatorSigner) {
        account.signers.validator = signer;
      }
      emit LegacySignerSet(msg.sender, signer, role);
    } else {
      defaultSigners[msg.sender][role] = signer;
      emit DefaultSignerSet(msg.sender, signer, role);
    }

    emit IndexedSignerSet(msg.sender, signer, role);
  }

  /**
   * @notice Authorizes an address to act as a signer, for `role`, on behalf of the account.
   * @param signer The address of the signing key to authorize.
   * @param role The role to authorize signing for.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `signer`'s EIP712 signature over `role`, `msg.sender`  
   *      and `signer`.
   */
  function authorizeSignerWithSignature(address signer, bytes32 role, uint8 v, bytes32 r, bytes32 s)
    public
  {
    authorizeAddressWithRole(signer, role, v, r, s);
    signerAuthorizations[msg.sender][role][signer] = SignerAuthorization({
      started: true,
      completed: true
    });

    emit SignerAuthorized(msg.sender, signer, role);
  }

  function legacyAuthorizeSignerWithSignature(
    address signer,
    bytes32 role,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) private {
    authorizeAddress(signer, v, r, s);
    signerAuthorizations[msg.sender][role][signer] = SignerAuthorization({
      started: true,
      completed: true
    });

    emit SignerAuthorized(msg.sender, signer, role);
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
    legacyAuthorizeSignerWithSignature(signer, VoteSigner, v, r, s);
    setIndexedSigner(signer, VoteSigner);

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
    legacyAuthorizeSignerWithSignature(signer, ValidatorSigner, v, r, s);
    setIndexedSigner(signer, ValidatorSigner);

    require(!getValidators().isValidator(msg.sender), "Cannot authorize validator signer");
    emit ValidatorSignerAuthorized(msg.sender, signer);
  }

  /**
   * @notice Authorizes an address to sign consensus messages on behalf of the account.
   * @param signer The address of the signing key to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender`.
   */
  function authorizeValidatorSignerWithPublicKey(
    address signer,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes calldata ecdsaPublicKey
  ) external nonReentrant {
    legacyAuthorizeSignerWithSignature(signer, ValidatorSigner, v, r, s);
    setIndexedSigner(signer, ValidatorSigner);

    require(
      getValidators().updateEcdsaPublicKey(msg.sender, signer, ecdsaPublicKey),
      "Failed to update ECDSA public key"
    );
    emit ValidatorSignerAuthorized(msg.sender, signer);
  }

  /**
   * @notice Authorizes an address to sign consensus messages on behalf of the account.
   * @param signer The address of the signing key to authorize.
   * @param ecdsaPublicKey The ECDSA public key corresponding to `signer`.
   * @param blsPublicKey The BLS public key that the validator is using for consensus, should pass
   *   proof of possession. 96 bytes.
   * @param blsPop The BLS public key proof-of-possession, which consists of a signature on the
   *   account address. 48 bytes.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev v, r, s constitute `signer`'s signature on `msg.sender`.
   */
  function authorizeValidatorSignerWithKeys(
    address signer,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes calldata ecdsaPublicKey,
    bytes calldata blsPublicKey,
    bytes calldata blsPop
  ) external nonReentrant {
    legacyAuthorizeSignerWithSignature(signer, ValidatorSigner, v, r, s);
    setIndexedSigner(signer, ValidatorSigner);

    require(
      getValidators().updatePublicKeys(msg.sender, signer, ecdsaPublicKey, blsPublicKey, blsPop),
      "Failed to update validator keys"
    );
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
    legacyAuthorizeSignerWithSignature(signer, AttestationSigner, v, r, s);
    setIndexedSigner(signer, AttestationSigner);

    emit AttestationSignerAuthorized(msg.sender, signer);
  }

  /**
   * @notice Begin the process of authorizing an address to sign on behalf of the account
   * @param signer The address of the signing key to authorize.
   * @param role The role to authorize signing for.
   */
  function authorizeSigner(address signer, bytes32 role) public {
    require(isAccount(msg.sender), "Unknown account");
    require(
      isNotAccount(signer) && isNotAuthorizedSignerForAnotherAccount(msg.sender, signer),
      "Cannot re-authorize address signer"
    );

    signerAuthorizations[msg.sender][role][signer] = SignerAuthorization({
      started: true,
      completed: false
    });
    emit SignerAuthorizationStarted(msg.sender, signer, role);
  }

  /**
   * @notice Finish the process of authorizing an address to sign on behalf of the account. 
   * @param account The address of account that authorized signing.
   * @param role The role to finish authorizing for.
   */
  function completeSignerAuthorization(address account, bytes32 role) public {
    require(isAccount(account), "Unknown account");
    require(
      isNotAccount(msg.sender) && isNotAuthorizedSignerForAnotherAccount(account, msg.sender),
      "Cannot re-authorize address signer"
    );
    require(
      signerAuthorizations[account][role][msg.sender].started == true,
      "Signer authorization not started"
    );

    authorizedBy[msg.sender] = account;
    signerAuthorizations[account][role][msg.sender].completed = true;
    emit SignerAuthorizationCompleted(account, msg.sender, role);
  }

  /**
   * @notice Whether or not the signer has been registered as the legacy signer for role
   * @param _account The address of account that authorized signing.
   * @param signer The address of the signer.
   * @param role The role that has been authorized.
   */
  function isLegacySigner(address _account, address signer, bytes32 role)
    public
    view
    returns (bool)
  {
    Account storage account = accounts[_account];
    if (role == ValidatorSigner && account.signers.validator == signer) {
      return true;
    } else if (role == AttestationSigner && account.signers.attestation == signer) {
      return true;
    } else if (role == VoteSigner && account.signers.vote == signer) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @notice Whether or not the signer has been registered as the default signer for role
   * @param account The address of account that authorized signing.
   * @param signer The address of the signer.
   * @param role The role that has been authorized.
   */
  function isDefaultSigner(address account, address signer, bytes32 role)
    public
    view
    returns (bool)
  {
    return defaultSigners[account][role] == signer;
  }

  /**
   * @notice Whether or not the signer has been registered as an indexed signer for role
   * @param account The address of account that authorized signing.
   * @param signer The address of the signer.
   * @param role The role that has been authorized.
   */
  function isIndexedSigner(address account, address signer, bytes32 role)
    public
    view
    returns (bool)
  {
    return
      isLegacyRole(role)
        ? isLegacySigner(account, signer, role)
        : isDefaultSigner(account, signer, role);
  }

  /**
   * @notice Whether or not the signer has been registered as a signer for role
   * @param account The address of account that authorized signing.
   * @param signer The address of the signer.
   * @param role The role that has been authorized.
   */
  function isSigner(address account, address signer, bytes32 role) public view returns (bool) {
    return
      isLegacySigner(account, signer, role) ||
      (signerAuthorizations[account][role][signer].completed && authorizedBy[signer] == account);
  }

  /**
   * @notice Removes the signer for a default role.
   * @param role The role that has been authorized.
   */
  function removeDefaultSigner(bytes32 role) public {
    address signer = defaultSigners[msg.sender][role];
    defaultSigners[msg.sender][role] = address(0);
    emit DefaultSignerRemoved(msg.sender, signer, role);
  }

  /**
   * @notice Remove one of the Validator, Attestation or 
   * Vote signers from an account. Should only be called from
   * methods that check the role is a legacy signer.
   * @param role The role that has been authorized.
   */
  function removeLegacySigner(bytes32 role) private {
    Account storage account = accounts[msg.sender];

    address signer;
    if (role == ValidatorSigner) {
      signer = account.signers.validator;
      account.signers.validator = address(0);
    } else if (role == AttestationSigner) {
      signer = account.signers.attestation;
      account.signers.attestation = address(0);
    } else if (role == VoteSigner) {
      signer = account.signers.vote;
      account.signers.vote = address(0);
    }
    emit LegacySignerRemoved(msg.sender, signer, role);
  }

  /**
   * @notice Removes the currently authorized and indexed signer 
   * for a specific role
   * @param role The role of the signer.
   */
  function removeIndexedSigner(bytes32 role) public {
    address oldSigner = getIndexedSigner(msg.sender, role);
    isLegacyRole(role) ? removeLegacySigner(role) : removeDefaultSigner(role);

    emit IndexedSignerRemoved(msg.sender, oldSigner, role);
  }

  /**
   * @notice Removes the currently authorized signer for a specific role and 
   * if the signer is indexed, remove that as well.
   * @param signer The address of the signer.
   * @param role The role that has been authorized.
   */
  function removeSigner(address signer, bytes32 role) public {
    if (isIndexedSigner(msg.sender, signer, role)) {
      removeIndexedSigner(role);
    }

    delete signerAuthorizations[msg.sender][role][signer];
    emit SignerRemoved(msg.sender, signer, role);
  }

  /**
   * @notice Removes the currently authorized vote signer for the account.
   * Note that the signers cannot be reauthorized after they have been removed.
   */
  function removeVoteSigner() public {
    address signer = getLegacySigner(msg.sender, VoteSigner);
    removeSigner(signer, VoteSigner);
    emit VoteSignerRemoved(msg.sender, signer);
  }

  /**
   * @notice Removes the currently authorized validator signer for the account
   * Note that the signers cannot be reauthorized after they have been removed.
   */
  function removeValidatorSigner() public {
    address signer = getLegacySigner(msg.sender, ValidatorSigner);
    removeSigner(signer, ValidatorSigner);
    emit ValidatorSignerRemoved(msg.sender, signer);
  }

  /**
   * @notice Removes the currently authorized attestation signer for the account
   * Note that the signers cannot be reauthorized after they have been removed.
   */
  function removeAttestationSigner() public {
    address signer = getLegacySigner(msg.sender, AttestationSigner);
    removeSigner(signer, AttestationSigner);
    emit AttestationSignerRemoved(msg.sender, signer);
  }

  function signerToAccountWithRole(address signer, bytes32 role) internal view returns (address) {
    address account = authorizedBy[signer];
    if (account != address(0)) {
      require(isSigner(account, signer, role), "not active authorized signer for role");
      return account;
    }

    require(isAccount(signer), "not an account");
    return signer;
  }

  /**
   * @notice Returns the account associated with `signer`.
   * @param signer The address of the account or currently authorized attestation signer.
   * @dev Fails if the `signer` is not an account or currently authorized attestation signer.
   * @return The associated account.
   */
  function attestationSignerToAccount(address signer) external view returns (address) {
    return signerToAccountWithRole(signer, AttestationSigner);
  }

  /**
   * @notice Returns the account associated with `signer`.
   * @param signer The address of an account or currently authorized validator signer.
   * @dev Fails if the `signer` is not an account or currently authorized validator.
   * @return The associated account.
   */
  function validatorSignerToAccount(address signer) public view returns (address) {
    return signerToAccountWithRole(signer, ValidatorSigner);
  }

  /**
   * @notice Returns the account associated with `signer`.
   * @param signer The address of the account or currently authorized vote signer.
   * @dev Fails if the `signer` is not an account or currently authorized vote signer.
   * @return The associated account.
   */
  function voteSignerToAccount(address signer) external view returns (address) {
    return signerToAccountWithRole(signer, VoteSigner);
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
      require(isAccount(signer), "Not an account");
      return signer;
    }
  }

  /**
   * @notice Checks whether the role is one of Vote, Validator or Attestation
   * @param role The role to check
   */
  function isLegacyRole(bytes32 role) public pure returns (bool) {
    return role == VoteSigner || role == ValidatorSigner || role == AttestationSigner;
  }

  /**
   * @notice Returns the legacy signer for the specified account and 
   * role. If no signer has been specified it will return the account itself.
   * @param _account The address of the account.
   * @param role The role of the signer.
   */
  function getLegacySigner(address _account, bytes32 role) public view returns (address) {
    require(isLegacyRole(role), "Role is not a legacy signer");

    Account storage account = accounts[_account];
    address signer;
    if (role == ValidatorSigner) {
      signer = account.signers.validator;
    } else if (role == AttestationSigner) {
      signer = account.signers.attestation;
    } else if (role == VoteSigner) {
      signer = account.signers.vote;
    }

    return signer == address(0) ? _account : signer;
  }

  /**
   * @notice Returns the default signer for the specified account and 
   * role. If no signer has been specified it will return the account itself.
   * @param account The address of the account.
   * @param role The role of the signer.
   */
  function getDefaultSigner(address account, bytes32 role) public view returns (address) {
    address defaultSigner = defaultSigners[account][role];
    return defaultSigner == address(0) ? account : defaultSigner;
  }

  /**
   * @notice Returns the indexed signer for the specified account and role. 
   * If no signer has been specified it will return the account itself.
   * @param account The address of the account.
   * @param role The role of the signer.
   */
  function getIndexedSigner(address account, bytes32 role) public view returns (address) {
    return isLegacyRole(role) ? getLegacySigner(account, role) : getDefaultSigner(account, role);
  }

  /**
   * @notice Returns the vote signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can sign votes.
   */
  function getVoteSigner(address account) public view returns (address) {
    return getLegacySigner(account, VoteSigner);
  }

  /**
   * @notice Returns the validator signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can register a validator or group.
   */
  function getValidatorSigner(address account) public view returns (address) {
    return getLegacySigner(account, ValidatorSigner);
  }

  /**
   * @notice Returns the attestation signer for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can sign attestations.
   */
  function getAttestationSigner(address account) public view returns (address) {
    return getLegacySigner(account, AttestationSigner);
  }

  /**
   * @notice Checks whether or not the account has an indexed signer
   * registered for one of the legacy roles
   */
  function hasLegacySigner(address account, bytes32 role) public view returns (bool) {
    return getLegacySigner(account, role) != account;
  }

  /**
   * @notice Checks whether or not the account has an indexed signer
   * registered for a role
   */
  function hasDefaultSigner(address account, bytes32 role) public view returns (bool) {
    return getDefaultSigner(account, role) != account;
  }

  /**
   * @notice Checks whether or not the account has an indexed signer
   * registered for the role
   */
  function hasIndexedSigner(address account, bytes32 role) public view returns (bool) {
    return isLegacyRole(role) ? hasLegacySigner(account, role) : hasDefaultSigner(account, role);
  }

  /**
   * @notice Checks whether or not the account has a signer
   * registered for the plaintext role.
   * @dev See `hasIndexedSigner` for more gas efficient call.
   */
  function hasAuthorizedSigner(address account, string calldata role) external view returns (bool) {
    return hasIndexedSigner(account, keccak256(abi.encodePacked(role)));
  }

  /**
   * @notice Returns if account has specified a dedicated vote signer.
   * @param account The address of the account.
   * @return Whether the account has specified a dedicated vote signer.
   */
  function hasAuthorizedVoteSigner(address account) external view returns (bool) {
    return hasLegacySigner(account, VoteSigner);
  }

  /**
   * @notice Returns if account has specified a dedicated validator signer.
   * @param account The address of the account.
   * @return Whether the account has specified a dedicated validator signer.
   */
  function hasAuthorizedValidatorSigner(address account) external view returns (bool) {
    return hasLegacySigner(account, ValidatorSigner);
  }

  /**
   * @notice Returns if account has specified a dedicated attestation signer.
   * @param account The address of the account.
   * @return Whether the account has specified a dedicated attestation signer.
   */
  function hasAuthorizedAttestationSigner(address account) external view returns (bool) {
    return hasLegacySigner(account, AttestationSigner);
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
   * @notice Check if an address has not been an authorized signer for an account.
   * @param signer The possibly authorized address.
   * @return Returns `false` if authorized. Returns `true` otherwise.
   */
  function isNotAuthorizedSigner(address signer) internal view returns (bool) {
    return (authorizedBy[signer] == address(0));
  }

  /**
   * @notice Check if `signer` has not been authorized, and if it has been previously
   *         authorized that it was authorized by `account`.
   * @param account The authorizing account address.
   * @param signer The possibly authorized address.
   * @return Returns `false` if authorized. Returns `true` otherwise.
   */
  function isNotAuthorizedSignerForAnotherAccount(address account, address signer)
    internal
    view
    returns (bool)
  {
    return (authorizedBy[signer] == address(0) || authorizedBy[signer] == account);
  }

  /**
   * @notice Authorizes some role of `msg.sender`'s account to another address.
   * @param authorized The address to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Fails if the address is already authorized to another account or is an account itself.
   * @dev Note that once an address is authorized, it may never be authorized again.
   * @dev v, r, s constitute `authorized`'s signature on `msg.sender`.
   */
  function authorizeAddress(address authorized, uint8 v, bytes32 r, bytes32 s) private {
    address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
    require(signer == authorized, "Invalid signature");

    authorize(authorized);
  }

  /**
   * @notice Returns the address that signed the provided role authorization.
   * @param account The `account` property signed over in the EIP712 signature
   * @param signer The `signer` property signed over in the EIP712 signature
   * @param role The `role` property signed over in the EIP712 signature
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @return The address that signed the provided role authorization.
   */
  function getRoleAuthorizationSigner(
    address account,
    address signer,
    bytes32 role,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (address) {
    bytes32 structHash = keccak256(
      abi.encode(EIP712_AUTHORIZE_SIGNER_TYPEHASH, account, signer, role)
    );
    return Signatures.getSignerOfTypedDataHash(eip712DomainSeparator, structHash, v, r, s);
  }

  /**
   * @notice Authorizes a role of `msg.sender`'s account to another address (`authorized`).
   * @param authorized The address to authorize.
   * @param role The role to authorize.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Fails if the address is already authorized to another account or is an account itself.
   * @dev Note that this signature is EIP712 compliant over the authorizing `account` 
   * (`msg.sender`), `signer` (`authorized`) and `role`.
   */
  function authorizeAddressWithRole(address authorized, bytes32 role, uint8 v, bytes32 r, bytes32 s)
    private
  {
    address signer = getRoleAuthorizationSigner(msg.sender, authorized, role, v, r, s);
    require(signer == authorized, "Invalid signature");

    authorize(authorized);
  }

  /**
   * @notice Authorizes an address to `msg.sender`'s account
   * @param authorized The address to authorize.
   * @dev Fails if the address is already authorized for another account or is an account itself.
   */
  function authorize(address authorized) private {
    require(isAccount(msg.sender), "Unknown account");
    require(
      isNotAccount(authorized) && isNotAuthorizedSignerForAnotherAccount(msg.sender, authorized),
      "Cannot re-authorize address or locked gold account for another account"
    );

    authorizedBy[authorized] = msg.sender;
  }
}
