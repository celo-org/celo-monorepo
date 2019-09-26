pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./interfaces/IAttestations.sol";
import "./interfaces/IRandom.sol";
import "../common/interfaces/IERC20Token.sol";
import "../governance/interfaces/IValidators.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";


/**
 * @title Contract mapping identifiers to accounts
 */
contract Attestations is IAttestations, Ownable, Initializable, UsingRegistry, ReentrancyGuard {


  using SafeMath for uint256;
  using SafeMath for uint128;
  using SafeMath for uint96;

  event AttestationsRequested(
    bytes32 indexed identifier,
    address indexed account,
    uint256 attestationsRequested,
    address attestationRequestFeeToken
  );

  event AttestationCompleted(
    bytes32 indexed identifier,
    address indexed account,
    address indexed issuer
  );

  event Withdrawal(
    address indexed account,
    address indexed token,
    uint256 amount
  );

  event AttestationExpirySecondsSet(
    uint256 value
  );

  event AttestationRequestFeeSet(
    address indexed token,
    uint256 value
  );

  event AccountDataEncryptionKeySet(
    address indexed account,
    bytes dataEncryptionKey
  );

  event AccountMetadataURLSet(
    address indexed account,
    string metadataURL
  );

  event AccountWalletAddressSet(
    address indexed account,
    address walletAddress
  );

  enum AttestationStatus {
    None,
    Incomplete,
    Complete
  }

  struct Attestation {
    AttestationStatus status;

    // For outstanding attestations, this is the timestamp of the request
    // For completed attestations, this is the timestamp of the attestation completion
    uint128 time;
  }

  struct Account {
    // The timestamp of the most recent attestation request
    uint96 mostRecentAttestationRequest;

    // The address at which the account expects to receive transfers
    address walletAddress;

    // The token with which attestation request fees are paid
    address attestationRequestFeeToken;

    // The ECDSA public key used to encrypt and decrypt data for this account
    bytes dataEncryptionKey;

    // The URL under which an account adds metadata and claims
    string metadataURL;
  }

  // Stores attestations state for a single (identifier, account address) pair.
  struct AttestationsMapping {
    // Number of completed attestations
    uint64 completed;
    // List of issuers responsible for attestations
    address[] issuers;
    // State of each attestation keyed by issuer
    mapping(address => Attestation) issuedAttestations;
  }

  struct IdentifierState {
    // All account addresses associated with this identifier
    address[] accounts;
    mapping(address => AttestationsMapping) attestations;
  }

  mapping(bytes32 => IdentifierState) identifiers;
  mapping(address => Account) accounts;

  // Address of the RequestAttestation precompiled contract.
  // solhint-disable-next-line state-visibility
  address constant REQUEST_ATTESTATION = address(0xff);

  // The duration in seconds in which an attestation can be completed
  uint256 public attestationExpirySeconds;

  // The fees that are associated with attestations for a particular token.
  mapping(address => uint256) public attestationRequestFees;

  // Maps a token and attestation issuer to the amount that they're owed.
  mapping(address => mapping(address => uint256)) public pendingWithdrawals;

  function initialize(
    address registryAddress,
    uint256 _attestationExpirySeconds,
    address[] calldata attestationRequestFeeTokens,
    uint256[] calldata attestationRequestFeeValues
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setAttestationExpirySeconds(_attestationExpirySeconds);
    require(
      attestationRequestFeeTokens.length > 0 &&
      attestationRequestFeeTokens.length == attestationRequestFeeValues.length,
      "attestationRequestFeeTokens specification was invalid"
    );
    for (uint256 i = 0; i < attestationRequestFeeTokens.length; i = i.add(1)) {
      setAttestationRequestFee(attestationRequestFeeTokens[i], attestationRequestFeeValues[i]);
    }
  }

  /**
   * @notice Commit to the attestation request of a hashed identifier.
   * @param identifier The hash of the identifier to be attested.
   * @param attestationsRequested The number of requested attestations for this request
   * @param attestationRequestFeeToken The address of the token with which the attestation fee will
   * be paid.
   */
  function request(
    bytes32 identifier,
    uint256 attestationsRequested,
    address attestationRequestFeeToken
  )
    external
    nonReentrant
  {
    require(
      attestationRequestFees[attestationRequestFeeToken] > 0,
      "Invalid attestationRequestFeeToken"
    );
    require(
      IERC20Token(attestationRequestFeeToken).transferFrom(
        msg.sender,
        address(this),
        attestationRequestFees[attestationRequestFeeToken].mul(attestationsRequested)
      ),
      "Transfer of attestation request fees failed"
    );

    require(attestationsRequested > 0, "You have to request at least 1 attestation");

    if (accounts[msg.sender].attestationRequestFeeToken != address(0x0)) {
      require(
        !isAttestationTimeValid(accounts[msg.sender].mostRecentAttestationRequest) ||
          accounts[msg.sender].attestationRequestFeeToken == attestationRequestFeeToken,
        "A different fee token was previously specified for this account"
      );
    }

    // solhint-disable-next-line not-rely-on-time
    accounts[msg.sender].mostRecentAttestationRequest = uint96(now);
    accounts[msg.sender].attestationRequestFeeToken = attestationRequestFeeToken;

    IdentifierState storage state = identifiers[identifier];

    addIncompleteAttestations(attestationsRequested, state.attestations[msg.sender]);

    emit AttestationsRequested(
      identifier,
      msg.sender,
      attestationsRequested,
      attestationRequestFeeToken
    );
  }

  /**
   * @notice Reveal the encrypted phone number to the issuer.
   * @param identifier The hash of the identifier to be attested.
   * @param encryptedPhone The number ECIES encrypted with the issuer's public key.
   * @param issuer The issuer of the attestation
   * @param sendSms Whether or not to send an SMS. For testing purposes.
   */
  function reveal(
    bytes32 identifier,
    bytes calldata encryptedPhone,
    address issuer,
    bool sendSms
  )
    external
  {
    Attestation storage attestation =
      identifiers[identifier].attestations[msg.sender].issuedAttestations[issuer];

    require(
      attestation.status == AttestationStatus.Incomplete,
      "Attestation is not incomplete"
    );

    // solhint-disable-next-line not-rely-on-time
    require(isAttestationTimeValid(attestation.time), "Attestation request timed out");

    // Generate the yet-to-be-signed attestation code that will be signed and sent to the
    // encrypted phone number via SMS via the 'RequestAttestation' precompiled contract.
    if (sendSms) {
      bool success;
        // solhint-disable-next-line avoid-call-value
      (success, ) = REQUEST_ATTESTATION.call.value(0).gas(gasleft())(abi.encode(
        identifier,
        keccak256(abi.encodePacked(identifier, msg.sender)),
        msg.sender,
        issuer,
        encryptedPhone
      ));

      require(success, "sending SMS failed");
    }
  }

  /**
   * @notice Submit the secret message sent by the issuer to complete the attestation request.
   * @param identifier The hash of the identifier for this attestation.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @dev Throws if there is no matching outstanding attestation request.
   * @dev Throws if the attestation window has passed.
   */
  function complete(bytes32 identifier, uint8 v, bytes32 r, bytes32 s) external {
    address issuer = validateAttestationCode(identifier, msg.sender, v, r, s);

    Attestation storage attestation =
      identifiers[identifier].attestations[msg.sender].issuedAttestations[issuer];

    // solhint-disable-next-line not-rely-on-time
    attestation.time = uint128(now);
    attestation.status = AttestationStatus.Complete;
    identifiers[identifier].attestations[msg.sender].completed++;

    address token = accounts[msg.sender].attestationRequestFeeToken;

    pendingWithdrawals[token][issuer] = pendingWithdrawals[token][issuer].add(
      attestationRequestFees[token]
    );

    IdentifierState storage state = identifiers[identifier];
    if (identifiers[identifier].attestations[msg.sender].completed == 1) {
      state.accounts.push(msg.sender);
    }

    emit AttestationCompleted(identifier, msg.sender, issuer);
  }

  /**
   * @notice Revokes an account for an identifier
   * @param identifier The identifier for which to revoke
   * @param index The index of the account in the accounts array
   */
  function revoke(bytes32 identifier, uint256 index) external {
    uint256 numAccounts = identifiers[identifier].accounts.length;
    require(index < numAccounts, "Index is invalid");
    require(
      msg.sender == identifiers[identifier].accounts[index],
      "Index does not match msg.sender"
    );

    uint256 newNumAccounts = numAccounts.sub(1);
    if (index != newNumAccounts) {
      identifiers[identifier].accounts[index] = identifiers[identifier].accounts[newNumAccounts];
    }
    identifiers[identifier].accounts[newNumAccounts] = address(0x0);
    identifiers[identifier].accounts.length--;
  }

  /**
   * @notice Allows issuers to withdraw accumulated attestation rewards.
   * @param token The address of the token that will be withdrawn.
   * @dev Throws if msg.sender does not have any rewards to withdraw.
   */
  function withdraw(address token) external {
    uint256 value = pendingWithdrawals[token][msg.sender];
    require(value > 0, "value was negative/zero");
    pendingWithdrawals[token][msg.sender] = 0;
    require(IERC20Token(token).transfer(msg.sender, value), "token transfer failed");
    emit Withdrawal(msg.sender, token, value);
  }

  /**
   * @notice Setter for the dataEncryptionKey and wallet address for an account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account
   */
  function setAccount(
    bytes calldata dataEncryptionKey,
    address walletAddress
  )
    external
  {
    setAccountDataEncryptionKey(dataEncryptionKey);
    setWalletAddress(walletAddress);
  }

  /**
   * @notice Returns attestation issuers for a identifier/account pair
   * @param identifier Hash of the identifier.
   * @param account Address of the account
   * @return Addresses of the attestation issuers
   */
  function getAttestationIssuers(
    bytes32 identifier,
    address account
  )
    external
    view
    returns (address[] memory)
  {
    return identifiers[identifier].attestations[account].issuers;
  }

  /**
   * @notice Returns attestation stats for a identifier/account pair
   * @param identifier Hash of the identifier.
   * @param account Address of the account
   * @return [Number of completed attestations, Number of total requested attestations]
   */
  function getAttestationStats(
    bytes32 identifier,
    address account
  )
    external
    view
    returns (uint64, uint64)
  {
    return (
      identifiers[identifier].attestations[account].completed,
      uint64(identifiers[identifier].attestations[account].issuers.length)
    );
  }

  /**
   * @notice Batch lookup function to determine attestation stats for a list of identifiers
   * @param identifiersToLookup Array of n identifiers
   * @return [0] Array of number of matching accounts per identifier
   * @return [1] Array of sum([0]) matching walletAddresses
   * @return [2] Array of sum([0]) numbers indicating the completions for each account
   * @return [3] Array of sum([0]) numbers indicating the total number of requested
                 attestations for each account
   */
  function batchGetAttestationStats(
    bytes32[] calldata identifiersToLookup
  )
    external
    view
    returns (uint256[] memory, address[] memory, uint64[] memory, uint64[] memory)
  {
    require(identifiersToLookup.length > 0, "You have to pass at least one identifier");

    uint256[] memory matches;
    address[] memory addresses;

    (matches, addresses) = batchlookupAccountsForIdentifier(
      identifiersToLookup
    );

    uint64[] memory completed = new uint64[](addresses.length);
    uint64[] memory total = new uint64[](addresses.length);

    uint256 currentIndex = 0;
    for (uint256 i = 0; i < identifiersToLookup.length; i++) {
      address[] memory addrs = identifiers[identifiersToLookup[i]].accounts;
      for (uint256 matchIndex = 0; matchIndex < matches[i]; matchIndex++) {
        addresses[currentIndex] = accounts[addrs[matchIndex]].walletAddress;
        completed[currentIndex] =
          identifiers[identifiersToLookup[i]].attestations[addrs[matchIndex]].completed;
        total[currentIndex] = uint64(
          identifiers[identifiersToLookup[i]].attestations[addrs[matchIndex]].issuers.length
        );
        currentIndex++;
      }
    }

    return (matches, addresses, completed, total);
  }

  /**
   * @notice Returns the state of a specific attestation
   * @param identifier Hash of the identifier.
   * @param account Address of the account
   * @param issuer Address of the issuer
   * @return [Status of the attestation, time of the attestation]
   */
  function getAttestationState(
    bytes32 identifier,
    address account,
    address issuer
  )
    external
    view
    returns (uint8, uint128)
  {
    return (
      uint8(identifiers[identifier].attestations[account].issuedAttestations[issuer].status),
      identifiers[identifier].attestations[account].issuedAttestations[issuer].time
    );

  }

  /**
   * @notice Returns address of the token in which the account chose to pay attestation fees
   * @param account Address of the account
   * @return Address of the token contract
   */
  function getAttestationRequestFeeToken(address account) external view returns (address) {
    return accounts[account].attestationRequestFeeToken;
  }

  /**
   * @notice Returns timestamp of the most recent attestation request
   * @param account Address of the account
   * @return Timestamp of the most recent attestation request
   */
  function getMostRecentAttestationRequest(address account)
    external
    view
    returns (uint256)
  {
    return accounts[account].mostRecentAttestationRequest;
  }

  /**
   * @notice Returns the fee set for a particular token.
   * @param token Address of the attestationRequestFeeToken.
   * @return The fee.
   */
  function getAttestationRequestFee(address token) external view returns (uint256) {
    return attestationRequestFees[token];
  }

  /**
   * @notice Updates the fee  for a particular token.
   * @param token The address of the attestationRequestFeeToken.
   * @param fee The fee in 'token' that is required for each attestation.
   */
  function setAttestationRequestFee(address token, uint256 fee) public onlyOwner {
    require(fee > 0, "You have to specify a fee greater than 0");
    attestationRequestFees[token] = fee;
    emit AttestationRequestFeeSet(token, fee);
  }

  /**
   * @notice Updates 'attestationExpirySeconds'.
   * @param _attestationExpirySeconds The new limit on blocks allowed to come between requesting
   * an attestation and completing it.
   */
  function setAttestationExpirySeconds(uint256 _attestationExpirySeconds) public onlyOwner {
    require(_attestationExpirySeconds > 0, "attestationExpirySeconds has to be greater than 0");
    attestationExpirySeconds = _attestationExpirySeconds;
    emit AttestationExpirySecondsSet(_attestationExpirySeconds);
  }

  /**
   * @notice Setter for the metadata of an account.
   * @param metadataURL The URL to access the metadata.
   */
  function setMetadataURL(string calldata metadataURL) external {
    accounts[msg.sender].metadataURL = metadataURL;
    emit AccountMetadataURLSet(msg.sender, metadataURL);
  }

  /**
   * @notice Getter for the metadata of an account.
   * @param account The address of the account to get the metadata for.
   * @return metdataURL The URL to access the metadata.
   */
  function getMetadataURL(address account) external view returns (string memory) {
    return accounts[account].metadataURL;
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
   * @notice Getter for the data encryption key and version.
   * @param account The address of the account to get the key for
   * @return dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   */
  function getDataEncryptionKey(address account) external view returns (bytes memory) {
    return accounts[account].dataEncryptionKey;
  }

  /**
   * @notice Setter for the wallet address for an account
   * @param walletAddress The wallet address to set for the account
   */
  function setWalletAddress(address walletAddress) public {
    accounts[msg.sender].walletAddress = walletAddress;
    emit AccountWalletAddressSet(msg.sender, walletAddress);
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
   * @notice Validates the given attestation code.
   * @param identifier The hash of the identifier to be attested.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @return The issuer of the corresponding attestation.
   * @dev Throws if there is no matching outstanding attestation request.
   * @dev Throws if the attestation window has passed.
   */
  function validateAttestationCode(
    bytes32 identifier,
    address account,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    view
    returns (address)
  {
    bytes32 codehash = keccak256(abi.encodePacked(identifier, account));
    address issuer = ecrecover(codehash, v, r, s);

    Attestation storage attestation =
      identifiers[identifier].attestations[account].issuedAttestations[issuer];

    require(
      attestation.status == AttestationStatus.Incomplete,
      "Attestation code does not match any outstanding attestation"
    );
    // solhint-disable-next-line not-rely-on-time
    require(isAttestationTimeValid(attestation.time), "Attestation request timed out");

    return issuer;
  }

  function lookupAccountsForIdentifier(
    bytes32 identifier
  )
    external
    view
    returns (address[] memory)
  {
    return identifiers[identifier].accounts;
  }

  /**
   * @notice Returns the current validator set
   * TODO: Should be replaced with a precompile
   */
  function getValidators() public view returns (address[] memory) {
    IValidators validatorContract = IValidators(
      registry.getAddressForOrDie(VALIDATORS_REGISTRY_ID)
    );
    return validatorContract.getValidators();
  }

  /**
   * @notice Helper function for batchGetAttestationStats to calculate the
             total number of addresses that have >0 complete attestations for the identifiers
   * @param identifiersToLookup Array of n identifiers
   * @return Array of n numbers that indicate the number of matching addresses per identifier
   *         and array of addresses preallocated for total number of matches
   */
  function batchlookupAccountsForIdentifier(
    bytes32[] memory identifiersToLookup
  )
    internal
    view
    returns (uint256[] memory, address[] memory)
  {
    require(identifiersToLookup.length > 0, "You have to pass at least one identifier");
    uint256 totalAddresses = 0;
    uint256[] memory matches = new uint256[](identifiersToLookup.length);

    for (uint256 i = 0; i < identifiersToLookup.length; i++) {
      uint256 count = identifiers[identifiersToLookup[i]].accounts.length;

      totalAddresses = totalAddresses + count;
      matches[i] = count;
    }

    return (matches, new address[](totalAddresses));
  }

  /**
   * @notice Adds additional attestations given the current randomness
   * @param n Number of attestations to add
   * @param state The accountState of the address to add attestations for
   */
  function addIncompleteAttestations(
    uint256 n,
    AttestationsMapping storage state
  )
    internal
  {
    IRandom random = IRandom(registry.getAddressForOrDie(RANDOM_REGISTRY_ID));

    bytes32 seed = random.random();
    address[] memory validators = getValidators();

    uint256 currentIndex = 0;
    address validator;

    while (currentIndex < n) {
      seed = keccak256(abi.encodePacked(seed));
      validator = validators[uint256(seed) % validators.length];

      Attestation storage attestations =
        state.issuedAttestations[validator];

      // Attestation issuers can only be added if they haven't already
      if (attestations.status != AttestationStatus.None) {
        continue;
      }

      currentIndex++;
      attestations.status = AttestationStatus.Incomplete;
      // solhint-disable-next-line not-rely-on-time
      attestations.time = uint128(now);
      state.issuers.push(validator);
    }
  }

  function isAttestationTimeValid(uint128 attestationTime) internal view returns (bool) {
    // solhint-disable-next-line not-rely-on-time
    return now < attestationTime.add(attestationExpirySeconds);
  }
}
