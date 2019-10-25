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
import "../common/Signatures.sol";
import "../common/SafeCast.sol";


/**
 * @title Contract mapping identifiers to accounts
 */
contract Attestations is IAttestations, Ownable, Initializable, UsingRegistry, ReentrancyGuard {

  using SafeMath for uint256;
  using SafeCast for uint256;

  struct Attestation {
    AttestationStatus status;

    // For outstanding attestations, this is the block number of the request.
    // For completed attestations, this is the block number of the attestation completion.
    uint32 blockNumber;

    // The token with which attestation request fees were paid.
    address attestationRequestFeeToken;
  }

  struct Account {
    // The address at which the account expects to receive transfers.
    address walletAddress;

    // The address of the key with which this account wants to sign attestations.
    address authorizedAttestor;

    // The ECDSA public key used to encrypt and decrypt data for this account.
    bytes dataEncryptionKey;

    // The URL under which an account adds metadata and claims.
    string metadataURL;
  }

  // Stores attestations state for a single (identifier, account address) pair.
  struct AttestedAddress {
    // Total number of requested attestations.
    uint32 requested;
    // Total number of completed attestations.
    uint32 completed;
    // List of selected issuers responsible for attestations. The length of this list
    // might be smaller than `requested` (which represents the total number of requested
    // attestations) if users are not calling `selectIssuers` on unselected requests.
    address[] selectedIssuers;
    // State of each attestation keyed by issuer.
    mapping(address => Attestation) issuedAttestations;
  }

  struct UnselectedRequest {
    // The block at which the attestations were requested.
    uint32 blockNumber;

    // The number of attestations that were requested.
    uint32 attestationsRequested;

    // The token with which attestation request fees were paid in this request.
    address attestationRequestFeeToken;
  }

  struct IdentifierState {
    // All account addresses associated with this identifier.
    address[] accounts;
    // Keeps the state of attestations for account addresses for this identifier.
    mapping(address => AttestedAddress) attestations;
    // Temporarily stores attestation requests for which issuers should be selected by the account.
    mapping(address => UnselectedRequest) unselectedRequests;
  }

  mapping(bytes32 => IdentifierState) identifiers;
  mapping(address => Account) accounts;

  // Maps attestation keys to the account that provided the authorization.
  mapping(address => address) authorizedBy;

  // Address of the RequestAttestation precompiled contract.
  // solhint-disable-next-line state-visibility
  address constant REQUEST_ATTESTATION = address(0xff);

  // The duration in blocks in which an attestation can be completed from the block in which the
  // attestation was requested.
  uint256 public attestationExpiryBlocks;

  // The fees that are associated with attestations for a particular token.
  mapping(address => uint256) public attestationRequestFees;

  // Maps a token and attestation issuer to the amount that they're owed.
  mapping(address => mapping(address => uint256)) public pendingWithdrawals;

  event AttestationsRequested(
    bytes32 indexed identifier,
    address indexed account,
    uint256 attestationsRequested,
    address attestationRequestFeeToken
  );

  event AttestationIssuersSelected(
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

  event AttestationExpiryBlocksSet(
    uint256 value
  );

  event AttestationRequestFeeSet(
    address indexed token,
    uint256 value
  );

  event AttestorAuthorized(
    address indexed account,
    address attestor
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

  function initialize(
    address registryAddress,
    uint256 _attestationExpiryBlocks,
    address[] calldata attestationRequestFeeTokens,
    uint256[] calldata attestationRequestFeeValues
  )
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setAttestationExpiryBlocks(_attestationExpiryBlocks);
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
   * @param attestationsRequested The number of requested attestations for this request.
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

    IdentifierState storage state = identifiers[identifier];

    require(
      state.unselectedRequests[msg.sender].blockNumber == 0 ||
        isAttestationExpired(state.unselectedRequests[msg.sender].blockNumber),
      "There exists an unexpired, unselected attestation request"
    );

    state.unselectedRequests[msg.sender].blockNumber = block.number.toUint32();
    state.unselectedRequests[msg.sender].attestationsRequested = attestationsRequested.toUint32();
    state.unselectedRequests[msg.sender].attestationRequestFeeToken = attestationRequestFeeToken;

    state.attestations[msg.sender].requested = uint256(
      state.attestations[msg.sender].requested
    ).add(attestationsRequested).toUint32();

    emit AttestationsRequested(
      identifier,
      msg.sender,
      attestationsRequested,
      attestationRequestFeeToken
    );
  }

  /**
   * @notice Selects the issuers for the most recent attestation request.
   * @param identifier The hash of the identifier to be attested.
   */
  function selectIssuers(bytes32 identifier) external {
    IdentifierState storage state = identifiers[identifier];

    require(
      state.unselectedRequests[msg.sender].blockNumber > 0,
      "No unselected attestation request to select issuers for"
    );

    require(
      !isAttestationExpired(state.unselectedRequests[msg.sender].blockNumber),
      "The attestation request has expired"
    );

    addIncompleteAttestations(identifier);
    emit AttestationIssuersSelected(
      identifier,
      msg.sender,
      state.unselectedRequests[msg.sender].attestationsRequested,
      state.unselectedRequests[msg.sender].attestationRequestFeeToken
    );

    delete state.unselectedRequests[msg.sender];
  }

  /**
   * @notice Reveal the encrypted phone number to the issuer.
   * @param identifier The hash of the identifier to be attested.
   * @param encryptedPhone The number ECIES encrypted with the issuer's public key.
   * @param issuer The issuer of the attestation.
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

    require(attestation.status == AttestationStatus.Incomplete, "Attestation is not incomplete");

    // solhint-disable-next-line not-rely-on-time
    require(!isAttestationExpired(attestation.blockNumber), "Attestation timed out");

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

    address token = attestation.attestationRequestFeeToken;

    // solhint-disable-next-line not-rely-on-time
    attestation.blockNumber = block.number.toUint32();
    attestation.status = AttestationStatus.Complete;
    delete attestation.attestationRequestFeeToken;
    identifiers[identifier].attestations[msg.sender].completed++;

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
   * @notice Revokes an account for an identifier.
   * @param identifier The identifier for which to revoke.
   * @param index The index of the account in the accounts array.
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
   * @notice Setter for the dataEncryptionKey and wallet address for an account.
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account.
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
   * @notice Returns the unselected attestation request for an identifier/account pair, if any.
   * @param identifier Hash of the identifier.
   * @param account Address of the account.
   * @return [
   *           Block number at which was requested,
   *           Number of unselected requests,
   *           Address of the token with which this attestation request was paid for
   *         ]
   */
  function getUnselectedRequest(
    bytes32 identifier,
    address account
  )
    external
    view
    returns (uint32, uint32, address)
  {
    return (
      identifiers[identifier].unselectedRequests[account].blockNumber,
      identifiers[identifier].unselectedRequests[account].attestationsRequested,
      identifiers[identifier].unselectedRequests[account].attestationRequestFeeToken
    );
  }

  /**
   * @notice Returns selected attestation issuers for a identifier/account pair.
   * @param identifier Hash of the identifier.
   * @param account Address of the account.
   * @return Addresses of the selected attestation issuers.
   */
  function getAttestationIssuers(
    bytes32 identifier,
    address account
  )
    external
    view
    returns (address[] memory)
  {
    return identifiers[identifier].attestations[account].selectedIssuers;
  }

  /**
   * @notice Returns attestation stats for a identifier/account pair.
   * @param identifier Hash of the identifier.
   * @param account Address of the account.
   * @return [Number of completed attestations, Number of total requested attestations]
   */
  function getAttestationStats(
    bytes32 identifier,
    address account
  )
    external
    view
    returns (uint32, uint32)
  {
    return (
      identifiers[identifier].attestations[account].completed,
      identifiers[identifier].attestations[account].requested
    );
  }

  /**
   * @notice Batch lookup function to determine attestation stats for a list of identifiers.
   * @param identifiersToLookup Array of n identifiers.
   * @return [0] Array of number of matching accounts per identifier.
   * @return [1] Array of sum([0]) matching walletAddresses.
   * @return [2] Array of sum([0]) numbers indicating the completions for each account.
   * @return [3] Array of sum([0]) numbers indicating the total number of requested
                 attestations for each account.
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
        total[currentIndex] =
          identifiers[identifiersToLookup[i]].attestations[addrs[matchIndex]].requested;

        currentIndex++;
      }
    }

    return (matches, addresses, completed, total);
  }

  /**
   * @notice Returns the state of a specific attestation.
   * @param identifier Hash of the identifier.
   * @param account Address of the account.
   * @param issuer Address of the issuer.
   * @return [
   *           Status of the attestation,
   *           Block number of request/completion the attestation,
   *           Address of the token with which this attestation request was paid for
   *         ]
   */
  function getAttestationState(
    bytes32 identifier,
    address account,
    address issuer
  )
    external
    view
    returns (uint8, uint32, address)
  {
    Attestation storage attestation =
      identifiers[identifier].attestations[account].issuedAttestations[issuer];
    return (
      uint8(attestation.status),
      attestation.blockNumber,
      attestation.attestationRequestFeeToken
    );

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
   * @notice Updates 'attestationExpiryBlocks'.
   * @param _attestationExpiryBlocks The new limit on blocks allowed to come between requesting
   * an attestation and completing it.
   */
  function setAttestationExpiryBlocks(uint256 _attestationExpiryBlocks) public onlyOwner {
    require(_attestationExpiryBlocks > 0, "attestationExpiryBlocks has to be greater than 0");
    attestationExpiryBlocks = _attestationExpiryBlocks;
    emit AttestationExpiryBlocksSet(_attestationExpiryBlocks);
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
   * @param account The address of the account to get the key for.
   * @return dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   */
  function getDataEncryptionKey(address account) external view returns (bytes memory) {
    return accounts[account].dataEncryptionKey;
  }

  /**
   * @notice Authorizes attestation power of `msg.sender`'s account to another address.
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
    require(isNotAuthorized(current));

    address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
    require(signer == current);

    authorizedBy[previous] = address(0);
    authorizedBy[current] = msg.sender;
  }

  /**
   * @notice Check if an address has been authorized by an account for attestation.
   * @param account The possibly authorized address.
   * @return Returns `true` if authorized. Returns `false` otherwise.
   */
  function isAuthorized(address account) external view returns (bool) {
    return (authorizedBy[account] != address(0));
  }

  /**
   * @notice Check if an address has been authorized by an account for attestation.
   * @param account The possibly authorized address.
   * @return Returns `false` if authorized. Returns `true` otherwise.
   */
  function isNotAuthorized(address account) internal view returns (bool) {
    return (authorizedBy[account] == address(0));
  }

  /**
   * @notice Authorizes an address to attest on behalf.
   * @param attestor The address of the attestor to set for the account.
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
    authorize(attestor, account.authorizedAttestor, v, r, s);
    account.authorizedAttestor = attestor;
    emit AttestorAuthorized(msg.sender, attestor);
  }

  /**
   * @notice Returns the attestor for the specified account.
   * @param account The address of the account.
   * @return The address with which the account can attest.
   */
  function getAttestorFromAccount(address account) public view returns (address) {
    address attestor = accounts[account].authorizedAttestor;
    return attestor == address(0) ? account : attestor;
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
      require(accounts[authorizingAccount].authorizedAttestor == accountOrAttestor);
      return authorizingAccount;
    } else {
      return accountOrAttestor;
    }
  }

  /**
   * @notice Setter for the wallet address for an account.
   * @param walletAddress The wallet address to set for the account.
   */
  function setWalletAddress(address walletAddress) public {
    accounts[msg.sender].walletAddress = walletAddress;
    emit AccountWalletAddressSet(msg.sender, walletAddress);
  }

  /**
   * @notice Getter for the wallet address for an account.
   * @param account The address of the account to get the wallet address for.
   * @return Wallet address.
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
    address signer = ecrecover(codehash, v, r, s);
    address issuer = getAccountFromAttestor(signer);

    Attestation storage attestation =
      identifiers[identifier].attestations[account].issuedAttestations[issuer];

    require(
      attestation.status == AttestationStatus.Incomplete,
      "Attestation code does not match any outstanding attestation"
    );
    require(!isAttestationExpired(attestation.blockNumber), "Attestation timed out");

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
   * @notice Helper function for batchGetAttestationStats to calculate the
             total number of addresses that have >0 complete attestations for the identifiers.
   * @param identifiersToLookup Array of n identifiers.
   * @return Array of n numbers that indicate the number of matching addresses per identifier
   *         and array of addresses preallocated for total number of matches.
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
   * @notice Adds additional attestations given the current randomness.
   * @param identifier The hash of the identifier to be attested.
   */
  function addIncompleteAttestations(
    bytes32 identifier
  )
    internal
  {
    AttestedAddress storage state = identifiers[identifier].attestations[msg.sender];
    UnselectedRequest storage unselectedRequest =
      identifiers[identifier].unselectedRequests[msg.sender];

    IRandom random = IRandom(registry.getAddressForOrDie(RANDOM_REGISTRY_ID));

    bytes32 seed = random.random();
    address[] memory validators = getElection().electValidators();

    uint256 currentIndex = 0;
    address validator;
    address issuer;

    while (currentIndex < unselectedRequest.attestationsRequested) {
      seed = keccak256(abi.encodePacked(seed));
      validator = validators[uint256(seed) % validators.length];
      issuer = getLockedGold().getAccountFromValidator(validator);
      Attestation storage attestation = state.issuedAttestations[issuer];

      // Attestation issuers can only be added if they haven't been already.
      if (attestation.status != AttestationStatus.None) {
        continue;
      }

      currentIndex++;
      attestation.status = AttestationStatus.Incomplete;
      attestation.blockNumber = unselectedRequest.blockNumber;
      attestation.attestationRequestFeeToken = unselectedRequest.attestationRequestFeeToken;
      state.selectedIssuers.push(issuer);
    }
  }

  function isAttestationExpired(uint128 attestationRequestBlock)
    internal
    view
    returns (bool)
  {
    return block.number >= uint256(attestationRequestBlock).add(attestationExpiryBlocks);
  }
}
