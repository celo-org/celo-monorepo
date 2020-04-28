pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/SafeCast.sol";

import "./interfaces/IAttestations.sol";
import "./interfaces/IRandom.sol";
import "../common/interfaces/IAccounts.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/Signatures.sol";
import "../common/UsingPrecompiles.sol";
import "../common/libraries/ReentrancyGuard.sol";

/**
 * @title Contract mapping identifiers to accounts
 */
contract Attestations is
  IAttestations,
  Ownable,
  Initializable,
  UsingRegistry,
  ReentrancyGuard,
  UsingPrecompiles
{
  using SafeMath for uint256;
  using SafeCast for uint256;

  enum AttestationStatus { None, Incomplete, Complete }

  struct Attestation {
    AttestationStatus status;
    // For outstanding attestations, this is the block number of the request.
    // For completed attestations, this is the block number of the attestation completion.
    uint32 blockNumber;
    // The token with which attestation request fees were paid.
    address attestationRequestFeeToken;
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

  // The duration in blocks in which an attestation can be completed from the block in which the
  // attestation was requested.
  uint256 public attestationExpiryBlocks;

  // The duration to wait until selectIssuers can be called for an attestation request.
  uint256 public selectIssuersWaitBlocks;

  // Limit the maximum number of attestations that can be requested
  uint256 public maxAttestations;

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

  event AttestationIssuerSelected(
    bytes32 indexed identifier,
    address indexed account,
    address indexed issuer,
    address attestationRequestFeeToken
  );

  event AttestationCompleted(
    bytes32 indexed identifier,
    address indexed account,
    address indexed issuer
  );

  event Withdrawal(address indexed account, address indexed token, uint256 amount);
  event AttestationExpiryBlocksSet(uint256 value);
  event AttestationRequestFeeSet(address indexed token, uint256 value);
  event SelectIssuersWaitBlocksSet(uint256 value);
  event MaxAttestationsSet(uint256 value);

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _attestationExpiryBlocks The new limit on blocks allowed to come between requesting
   * an attestation and completing it.
   * @param _selectIssuersWaitBlocks The wait period in blocks to call selectIssuers on attestation
   * requests.
   * @param attestationRequestFeeTokens The address of tokens that fees should be payable in.
   * @param attestationRequestFeeValues The corresponding fee values.
   */
  function initialize(
    address registryAddress,
    uint256 _attestationExpiryBlocks,
    uint256 _selectIssuersWaitBlocks,
    uint256 _maxAttestations,
    address[] calldata attestationRequestFeeTokens,
    uint256[] calldata attestationRequestFeeValues
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setAttestationExpiryBlocks(_attestationExpiryBlocks);
    setSelectIssuersWaitBlocks(_selectIssuersWaitBlocks);
    setMaxAttestations(_maxAttestations);

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
   * @dev Note that if an attestion expires before it is completed, the fee is forfeited. This is
   * to prevent folks from attacking validators by requesting attestations that they do not
   * complete, and to increase the cost of validators attempting to manipulate the attestations
   * protocol.
   */
  function request(
    bytes32 identifier,
    uint256 attestationsRequested,
    address attestationRequestFeeToken
  ) external nonReentrant {
    require(
      attestationRequestFees[attestationRequestFeeToken] > 0,
      "Invalid attestationRequestFeeToken"
    );
    require(
      IERC20(attestationRequestFeeToken).transferFrom(
        msg.sender,
        address(this),
        attestationRequestFees[attestationRequestFeeToken].mul(attestationsRequested)
      ),
      "Transfer of attestation request fees failed"
    );

    require(attestationsRequested > 0, "You have to request at least 1 attestation");
    require(attestationsRequested <= maxAttestations, "Too many attestations requested");

    IdentifierState storage state = identifiers[identifier];

    require(
      state.unselectedRequests[msg.sender].blockNumber == 0 ||
        isAttestationExpired(state.unselectedRequests[msg.sender].blockNumber) ||
        !isAttestationRequestSelectable(state.unselectedRequests[msg.sender].blockNumber),
      "There exists an unexpired, unselected attestation request"
    );

    state.unselectedRequests[msg.sender].blockNumber = block.number.toUint32();
    state.unselectedRequests[msg.sender].attestationsRequested = attestationsRequested.toUint32();
    state.unselectedRequests[msg.sender].attestationRequestFeeToken = attestationRequestFeeToken;

    state.attestations[msg.sender].requested = uint256(state.attestations[msg.sender].requested)
      .add(attestationsRequested)
      .toUint32();

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
    delete state.unselectedRequests[msg.sender];
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

    Attestation storage attestation = identifiers[identifier].attestations[msg.sender]
      .issuedAttestations[issuer];

    address token = attestation.attestationRequestFeeToken;

    // solhint-disable-next-line not-rely-on-time
    attestation.blockNumber = block.number.toUint32();
    attestation.status = AttestationStatus.Complete;
    delete attestation.attestationRequestFeeToken;
    AttestedAddress storage attestedAddress = identifiers[identifier].attestations[msg.sender];
    require(
      attestedAddress.completed < attestedAddress.completed + 1,
      "SafeMath32 integer overflow"
    );
    attestedAddress.completed = attestedAddress.completed + 1;

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
    identifiers[identifier].accounts.length = identifiers[identifier].accounts.length.sub(1);
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
    require(IERC20(token).transfer(msg.sender, value), "token transfer failed");
    emit Withdrawal(msg.sender, token, value);
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
  function getUnselectedRequest(bytes32 identifier, address account)
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
  function getAttestationIssuers(bytes32 identifier, address account)
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
  function getAttestationStats(bytes32 identifier, address account)
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
  function batchGetAttestationStats(bytes32[] calldata identifiersToLookup)
    external
    view
    returns (uint256[] memory, address[] memory, uint64[] memory, uint64[] memory)
  {
    require(identifiersToLookup.length > 0, "You have to pass at least one identifier");

    uint256[] memory matches;
    address[] memory addresses;

    (matches, addresses) = batchlookupAccountsForIdentifier(identifiersToLookup);

    uint64[] memory completed = new uint64[](addresses.length);
    uint64[] memory total = new uint64[](addresses.length);

    uint256 currentIndex = 0;
    for (uint256 i = 0; i < identifiersToLookup.length; i = i.add(1)) {
      address[] memory addrs = identifiers[identifiersToLookup[i]].accounts;
      for (uint256 matchIndex = 0; matchIndex < matches[i]; matchIndex = matchIndex.add(1)) {
        addresses[currentIndex] = getAccounts().getWalletAddress(addrs[matchIndex]);
        completed[currentIndex] = identifiers[identifiersToLookup[i]]
          .attestations[addrs[matchIndex]]
          .completed;
        total[currentIndex] = identifiers[identifiersToLookup[i]].attestations[addrs[matchIndex]]
          .requested;
        currentIndex = currentIndex.add(1);
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
  function getAttestationState(bytes32 identifier, address account, address issuer)
    external
    view
    returns (uint8, uint32, address)
  {
    Attestation storage attestation = identifiers[identifier].attestations[account]
      .issuedAttestations[issuer];
    return (
      uint8(attestation.status),
      attestation.blockNumber,
      attestation.attestationRequestFeeToken
    );

  }

  /**
    * @notice Returns the state of all attestations that are completable
    * @param identifier Hash of the identifier.
    * @param account Address of the account.
    * @return ( blockNumbers[] - Block number of request/completion the attestation,
    *           issuers[] - Address of the issuer,
    *           stringLengths[] - The length of each metadataURL string for each issuer,
    *           stringData - All strings concatenated
    *         )
    */
  function getCompletableAttestations(bytes32 identifier, address account)
    external
    view
    returns (uint32[] memory, address[] memory, uint256[] memory, bytes memory)
  {
    AttestedAddress storage state = identifiers[identifier].attestations[account];
    address[] storage issuers = state.selectedIssuers;

    uint256 num = 0;
    for (uint256 i = 0; i < issuers.length; i = i.add(1)) {
      if (isAttestationCompletable(state.issuedAttestations[issuers[i]])) {
        num = num.add(1);
      }
    }

    uint32[] memory blockNumbers = new uint32[](num);
    address[] memory completableIssuers = new address[](num);

    uint256 pointer = 0;
    for (uint256 i = 0; i < issuers.length; i = i.add(1)) {
      if (isAttestationCompletable(state.issuedAttestations[issuers[i]])) {
        blockNumbers[pointer] = state.issuedAttestations[issuers[i]].blockNumber;
        completableIssuers[pointer] = issuers[i];
        pointer = pointer.add(1);
      }
    }

    uint256[] memory stringLengths;
    bytes memory stringData;
    (stringLengths, stringData) = getAccounts().batchGetMetadataURL(completableIssuers);
    return (blockNumbers, completableIssuers, stringLengths, stringData);
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
   * @notice Updates 'selectIssuersWaitBlocks'.
   * @param _selectIssuersWaitBlocks The wait period in blocks to call selectIssuers on attestation
   *                                 requests.
   */
  function setSelectIssuersWaitBlocks(uint256 _selectIssuersWaitBlocks) public onlyOwner {
    require(_selectIssuersWaitBlocks > 0, "selectIssuersWaitBlocks has to be greater than 0");
    selectIssuersWaitBlocks = _selectIssuersWaitBlocks;
    emit SelectIssuersWaitBlocksSet(_selectIssuersWaitBlocks);
  }

  /**
   * @notice Updates 'maxAttestations'.
   * @param _maxAttestations Maximum number of attestations that can be requested.
   */
  function setMaxAttestations(uint256 _maxAttestations) public onlyOwner {
    require(_maxAttestations > 0, "maxAttestations has to be greater than 0");
    maxAttestations = _maxAttestations;
    emit MaxAttestationsSet(_maxAttestations);
  }

  /**
   * @notice Query 'maxAttestations'
   * @return Maximum number of attestations that can be requested.
   */
  function getMaxAttestations() external view returns (uint256) {
    return maxAttestations;
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
  ) public view returns (address) {
    bytes32 codehash = keccak256(abi.encodePacked(identifier, account));
    address signer = Signatures.getSignerOfMessageHash(codehash, v, r, s);
    address issuer = getAccounts().attestationSignerToAccount(signer);

    Attestation storage attestation = identifiers[identifier].attestations[account]
      .issuedAttestations[issuer];

    require(
      attestation.status == AttestationStatus.Incomplete,
      "Attestation code does not match any outstanding attestation"
    );
    require(!isAttestationExpired(attestation.blockNumber), "Attestation timed out");

    return issuer;
  }

  function lookupAccountsForIdentifier(bytes32 identifier)
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
  function batchlookupAccountsForIdentifier(bytes32[] memory identifiersToLookup)
    internal
    view
    returns (uint256[] memory, address[] memory)
  {
    require(identifiersToLookup.length > 0, "You have to pass at least one identifier");
    uint256 totalAddresses = 0;
    uint256[] memory matches = new uint256[](identifiersToLookup.length);

    for (uint256 i = 0; i < identifiersToLookup.length; i = i.add(1)) {
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
  function addIncompleteAttestations(bytes32 identifier) internal {
    AttestedAddress storage state = identifiers[identifier].attestations[msg.sender];
    UnselectedRequest storage unselectedRequest = identifiers[identifier].unselectedRequests[msg
      .sender];

    bytes32 seed = getRandom().getBlockRandomness(
      uint256(unselectedRequest.blockNumber).add(selectIssuersWaitBlocks)
    );
    IAccounts accounts = getAccounts();
    uint256 issuersLength = numberValidatorsInCurrentSet();
    uint256[] memory issuers = new uint256[](issuersLength);
    for (uint256 i = 0; i < issuersLength; i++) issuers[i] = i;

    require(unselectedRequest.attestationsRequested <= issuersLength, "not enough issuers");

    uint256 currentIndex = 0;

    // The length of the list (variable issuersLength) is decremented in each round,
    // so the loop always terminates
    while (currentIndex < unselectedRequest.attestationsRequested) {
      require(issuersLength > 0, "not enough issuers");
      seed = keccak256(abi.encodePacked(seed));
      uint256 idx = uint256(seed) % issuersLength;
      address signer = validatorSignerAddressFromCurrentSet(issuers[idx]);
      address issuer = accounts.signerToAccount(signer);

      Attestation storage attestation = state.issuedAttestations[issuer];

      if (
        attestation.status == AttestationStatus.None &&
        accounts.hasAuthorizedAttestationSigner(issuer)
      ) {
        currentIndex = currentIndex.add(1);
        attestation.status = AttestationStatus.Incomplete;
        attestation.blockNumber = unselectedRequest.blockNumber;
        attestation.attestationRequestFeeToken = unselectedRequest.attestationRequestFeeToken;
        state.selectedIssuers.push(issuer);

        emit AttestationIssuerSelected(
          identifier,
          msg.sender,
          issuer,
          unselectedRequest.attestationRequestFeeToken
        );
      }

      // Remove the validator that was selected from the list,
      // by replacing it by the last element in the list
      issuersLength = issuersLength.sub(1);
      issuers[idx] = issuers[issuersLength];
    }
  }

  function isAttestationExpired(uint128 attestationRequestBlock) internal view returns (bool) {
    return block.number >= uint256(attestationRequestBlock).add(attestationExpiryBlocks);
  }

  function isAttestationCompletable(Attestation storage attestation) internal view returns (bool) {
    return (attestation.status == AttestationStatus.Incomplete &&
      !isAttestationExpired(attestation.blockNumber));
  }

  function isAttestationRequestSelectable(uint256 attestationRequestBlock)
    internal
    view
    returns (bool)
  {
    return block.number < attestationRequestBlock.add(getRandom().randomnessBlockRetentionWindow());
  }
}
