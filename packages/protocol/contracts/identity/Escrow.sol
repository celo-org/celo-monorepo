pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/IAttestations.sol";
import "./interfaces/IFederatedAttestations.sol";
import "./interfaces/IEscrow.sol";
import "../common/Initializable.sol";
import "../common/interfaces/ICeloVersionedContract.sol";
import "../common/UsingRegistryV2BackwardsCompatible.sol";
import "../common/Signatures.sol";
import "../common/libraries/ReentrancyGuard.sol";

contract Escrow is
  IEscrow,
  ICeloVersionedContract,
  ReentrancyGuard,
  Ownable,
  Initializable,
  // Maintain storage alignment since Escrow was initially deployed with UsingRegistry.sol
  UsingRegistryV2BackwardsCompatible
{
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  struct EscrowedPayment {
    bytes32 recipientIdentifier;
    address sender;
    address token;
    uint256 value;
    uint256 sentIndex; // Location of this payment in sender's list of sent payments.
    uint256 receivedIndex; // Location of this payment in receivers's list of received payments.
    uint256 timestamp;
    uint256 expirySeconds;
    uint256 minAttestations;
  }

  // Maps unique payment IDs to escrowed payments.
  // These payment IDs are the temporary wallet addresses created with the escrowed payments.
  mapping(address => EscrowedPayment) public escrowedPayments;

  // Maps receivers' identifiers to a list of received escrowed payment IDs.
  mapping(bytes32 => address[]) public receivedPaymentIds;

  // Maps senders' addresses to a list of sent escrowed payment IDs.
  mapping(address => address[]) public sentPaymentIds;

  // Maps payment ID to a list of issuers whose attestations will be accepted.
  mapping(address => address[]) public trustedIssuersPerPayment;

  // Governable list of trustedIssuers to set for payments by default.
  address[] public defaultTrustedIssuers;

  // Based on benchmarking of FederatedAttestations lookup gas consumption
  // in the worst case (with a significant amount of buffer).
  uint256 public constant MAX_TRUSTED_ISSUERS_PER_PAYMENT = 100;

  event DefaultTrustedIssuerAdded(address indexed trustedIssuer);
  event DefaultTrustedIssuerRemoved(address indexed trustedIssuer);

  event Transfer(
    address indexed from,
    bytes32 indexed identifier,
    address indexed token,
    uint256 value,
    address paymentId,
    uint256 minAttestations
  );

  event TrustedIssuersSet(address indexed paymentId, address[] trustedIssuers);
  event TrustedIssuersUnset(address indexed paymentId);

  event Withdrawal(
    bytes32 indexed identifier,
    // Note that in previous versions of Escrow.sol, `to` referenced
    // the original sender of the payment
    address indexed to,
    address indexed token,
    uint256 value,
    address paymentId
  );

  event Revocation(
    bytes32 indexed identifier,
    address indexed by,
    address indexed token,
    uint256 value,
    address paymentId
  );

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Add an address to the defaultTrustedIssuers list.
   * @param trustedIssuer Address of the trustedIssuer to add.
   * @dev Throws if trustedIssuer is null or already in defaultTrustedIssuers.
   * @dev Throws if defaultTrustedIssuers is already at max allowed length.
   */
  function addDefaultTrustedIssuer(address trustedIssuer) external onlyOwner {
    require(address(0) != trustedIssuer, "trustedIssuer can't be null");
    require(
      defaultTrustedIssuers.length.add(1) <= MAX_TRUSTED_ISSUERS_PER_PAYMENT,
      "defaultTrustedIssuers.length can't exceed allowed number of trustedIssuers"
    );

    // Ensure list of trusted issuers is unique
    for (uint256 i = 0; i < defaultTrustedIssuers.length; i = i.add(1)) {
      require(
        defaultTrustedIssuers[i] != trustedIssuer,
        "trustedIssuer already in defaultTrustedIssuers"
      );
    }
    defaultTrustedIssuers.push(trustedIssuer);
    emit DefaultTrustedIssuerAdded(trustedIssuer);
  }

  /**
   * @notice Remove an address from the defaultTrustedIssuers list.
   * @param trustedIssuer Address of the trustedIssuer to remove.
   * @param index Index of trustedIssuer in defaultTrustedIssuers.
   * @dev Throws if trustedIssuer is not in defaultTrustedIssuers at index.
   */
  function removeDefaultTrustedIssuer(address trustedIssuer, uint256 index) external onlyOwner {
    uint256 numDefaultTrustedIssuers = defaultTrustedIssuers.length;
    require(index < numDefaultTrustedIssuers, "index is invalid");
    require(
      defaultTrustedIssuers[index] == trustedIssuer,
      "trustedIssuer does not match address found at defaultTrustedIssuers[index]"
    );
    if (index != numDefaultTrustedIssuers - 1) {
      // Swap last index with index-to-remove
      defaultTrustedIssuers[index] = defaultTrustedIssuers[numDefaultTrustedIssuers - 1];
    }
    defaultTrustedIssuers.pop();
    emit DefaultTrustedIssuerRemoved(trustedIssuer);
  }

  /**
   * @notice Transfer tokens to a specific user. Supports both identity with privacy (an empty
   *         identifier and 0 minAttestations) and without (with identifier and minAttestations).
   *         Sets trustedIssuers to the issuers listed in `defaultTrustedIssuers`.
   *         (To override this and set custom trusted issuers, use `transferWithTrustedIssuers`.)
   * @param identifier The hashed identifier of a user to transfer to.
   * @param token The token to be transferred.
   * @param value The amount to be transferred.
   * @param expirySeconds The number of seconds before the sender can revoke the payment.
   * @param paymentId The address of the temporary wallet associated with this payment. Users must
   *        prove ownership of the corresponding private key to withdraw from escrow.
   * @param minAttestations The min number of attestations required to withdraw the payment.
   * @return True if transfer succeeded.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if identifier is null and minAttestations > 0.
   * @dev If minAttestations is 0, trustedIssuers will be set to empty list.
   * @dev msg.sender needs to have already approved this contract to transfer
   */
  // solhint-disable-next-line no-simple-event-func-name
  function transfer(
    bytes32 identifier,
    address token,
    uint256 value,
    uint256 expirySeconds,
    address paymentId,
    uint256 minAttestations
  ) external nonReentrant returns (bool) {
    address[] memory trustedIssuers;
    // If minAttestations == 0, trustedIssuers should remain empty
    if (minAttestations > 0) {
      trustedIssuers = defaultTrustedIssuers;
    }
    return
      _transfer(
        identifier,
        token,
        value,
        expirySeconds,
        paymentId,
        minAttestations,
        trustedIssuers
      );
  }

  /**
   * @notice Transfer tokens to a specific user. Supports both identity with privacy (an empty
   *         identifier and 0 minAttestations) and without (with identifier
   *         and attestations completed by trustedIssuers).
   * @param identifier The hashed identifier of a user to transfer to.
   * @param token The token to be transferred.
   * @param value The amount to be transferred.
   * @param expirySeconds The number of seconds before the sender can revoke the payment.
   * @param paymentId The address of the temporary wallet associated with this payment. Users must
   *        prove ownership of the corresponding private key to withdraw from escrow.
   * @param minAttestations The min number of attestations required to withdraw the payment.
   * @param trustedIssuers Array of issuers whose attestations in FederatedAttestations.sol
   *        will be accepted to prove ownership over an identifier.
   * @return True if transfer succeeded.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if identifier is null and minAttestations > 0.
   * @dev Throws if minAttestations == 0 but trustedIssuers are provided.
   * @dev msg.sender needs to have already approved this contract to transfer.
   */
  function transferWithTrustedIssuers(
    bytes32 identifier,
    address token,
    uint256 value,
    uint256 expirySeconds,
    address paymentId,
    uint256 minAttestations,
    address[] calldata trustedIssuers
  ) external nonReentrant returns (bool) {
    return
      _transfer(
        identifier,
        token,
        value,
        expirySeconds,
        paymentId,
        minAttestations,
        trustedIssuers
      );
  }

  /**
   * @notice Withdraws tokens for a verified user.
   * @param paymentId The ID for the EscrowedPayment struct that contains all relevant information.
   * @param v The recovery id of the incoming ECDSA signature.
   * @param r Output value r of the ECDSA signature.
   * @param s Output value s of the ECDSA signature.
   * @return True if withdraw succeeded.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if msg.sender does not prove ownership of the withdraw key.
   */
  function withdraw(
    address paymentId,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external nonReentrant returns (bool) {
    address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
    require(signer == paymentId, "Failed to prove ownership of the withdraw key");
    EscrowedPayment memory payment = escrowedPayments[paymentId];
    require(payment.token != address(0) && payment.value > 0, "Invalid withdraw value.");

    // Due to an old bug, there may exist payments with no identifier and minAttestations > 0
    // So ensure that these fail the attestations check, as they previously would have
    if (payment.minAttestations > 0) {
      bool passedCheck = false;
      address[] memory trustedIssuers = trustedIssuersPerPayment[paymentId];
      address attestationsAddress = registryContract.getAddressForOrDie(ATTESTATIONS_REGISTRY_ID);

      if (trustedIssuers.length > 0) {
        passedCheck =
          hasCompletedV1AttestationsAsTrustedIssuer(
            attestationsAddress,
            payment.recipientIdentifier,
            msg.sender,
            payment.minAttestations,
            trustedIssuers
          ) ||
          hasCompletedV2Attestations(payment.recipientIdentifier, msg.sender, trustedIssuers);
      } else {
        // This is for backwards compatibility, not default/fallback behavior
        passedCheck = hasCompletedV1Attestations(
          attestationsAddress,
          payment.recipientIdentifier,
          msg.sender,
          payment.minAttestations
        );
      }
      require(
        passedCheck,
        "This account does not have the required attestations to withdraw this payment."
      );
    }

    deletePayment(paymentId);

    ERC20(payment.token).safeTransfer(msg.sender, payment.value);

    emit Withdrawal(
      payment.recipientIdentifier,
      msg.sender,
      payment.token,
      payment.value,
      paymentId
    );

    return true;
  }

  /**
   * @notice Revokes tokens for a sender who is redeeming a payment after it has expired.
   * @param paymentId The ID for the EscrowedPayment struct that contains all relevant information.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if msg.sender is not the sender of payment.
   * @dev Throws if redeem time hasn't been reached yet.
   */
  function revoke(address paymentId) external nonReentrant returns (bool) {
    EscrowedPayment memory payment = escrowedPayments[paymentId];
    require(payment.sender == msg.sender, "Only sender of payment can attempt to revoke payment.");
    require(
      now >= (payment.timestamp.add(payment.expirySeconds)),
      "Transaction not redeemable for sender yet."
    );

    deletePayment(paymentId);

    ERC20(payment.token).safeTransfer(msg.sender, payment.value);

    emit Revocation(
      payment.recipientIdentifier,
      payment.sender,
      payment.token,
      payment.value,
      paymentId
    );

    return true;
  }

  /**
   * @notice Gets array of all Escrowed Payments received by identifier.
   * @param identifier The hash of an identifier of the receiver of the escrowed payment.
   * @return An array containing all the IDs of the Escrowed Payments that were received
   * by the specified receiver.
   */
  function getReceivedPaymentIds(bytes32 identifier) external view returns (address[] memory) {
    return receivedPaymentIds[identifier];
  }

  /**
   * @notice Gets array of all Escrowed Payment IDs sent by sender.
   * @param sender The address of the sender of the escrowed payments.
   * @return An array containing all the IDs of the Escrowed Payments that were sent by the
   * specified sender.
   */
  function getSentPaymentIds(address sender) external view returns (address[] memory) {
    return sentPaymentIds[sender];
  }

  /**
   * @notice Gets array of all trusted issuers set per paymentId.
   * @param paymentId The ID of the payment to get.
   * @return An array of addresses of trusted issuers set for an escrowed payment.
   */
  function getTrustedIssuersPerPayment(address paymentId) external view returns (address[] memory) {
    return trustedIssuersPerPayment[paymentId];
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 2, 0, 0);
  }

  /**
   * @notice Gets trusted issuers set as default for payments by `transfer` function.
   * @return An array of addresses of trusted issuers.
   */
  function getDefaultTrustedIssuers() public view returns (address[] memory) {
    return defaultTrustedIssuers;
  }

  /**
   * @notice Checks if account has completed minAttestations for identifier in Attestations.sol.
   * @param attestationsAddress The address of Attestations.sol.
   * @param identifier The hash of an identifier for which to look up attestations.
   * @param account The account for which to look up attestations.
   * @param minAttestations The minimum number of attestations to have completed.
   * @return Whether or not attestations in Attestations.sol
   *         exceeds minAttestations for (identifier, account).
   */
  function hasCompletedV1Attestations(
    address attestationsAddress,
    bytes32 identifier,
    address account,
    uint256 minAttestations
  ) internal view returns (bool) {
    IAttestations attestations = IAttestations(attestationsAddress);
    (uint64 completedAttestations, ) = attestations.getAttestationStats(identifier, account);
    return (uint256(completedAttestations) >= minAttestations);
  }

  /**
   * @notice Helper function that checks if one of the trustedIssuers is the old Attestations.sol
   *         contract and applies the escrow V1 check against minAttestations.
   * @param attestationsAddress The address of Attestations.sol.
   * @param identifier The hash of an identifier for which to look up attestations.
   * @param account The account for which to look up attestations.
   * @param minAttestations The minimum number of attestations to have completed.
   * @param trustedIssuers The trustedIssuer addresses to search through.
   * @return Whether or not a trustedIssuer is Attestations.sol & attestations
   *         exceed minAttestations for (identifier, account).
   */
  function hasCompletedV1AttestationsAsTrustedIssuer(
    address attestationsAddress,
    bytes32 identifier,
    address account,
    uint256 minAttestations,
    address[] memory trustedIssuers
  ) internal view returns (bool) {
    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      if (trustedIssuers[i] != attestationsAddress) {
        continue;
      }
      // This can be false; one of the several trustedIssuers listed needs to prove attestations
      return hasCompletedV1Attestations(attestationsAddress, identifier, account, minAttestations);
    }
    return false;
  }

  /**
   * @notice Checks if there are attestations for account <-> identifier from
   *         any of trustedIssuers in FederatedAttestations.sol.
   * @param identifier The hash of an identifier for which to look up attestations.
   * @param account The account for which to look up attestations.
   * @param trustedIssuers Issuer addresses whose attestations to trust.
   * @return Whether or not attestations exist in FederatedAttestations.sol
   *         for (identifier, account).
   */
  function hasCompletedV2Attestations(
    bytes32 identifier,
    address account,
    address[] memory trustedIssuers
  ) internal view returns (bool) {
    // Check for an attestation from a trusted issuer
    IFederatedAttestations federatedAttestations = getFederatedAttestations();
    (, address[] memory accounts, , , ) = federatedAttestations.lookupAttestations(
      identifier,
      trustedIssuers
    );
    // Check if an attestation was found for recipientIdentifier -> account
    for (uint256 i = 0; i < accounts.length; i = i.add(1)) {
      if (accounts[i] == account) {
        return true;
      }
    }
    return false;
  }

  /**
   * @notice Helper function for `transferWithTrustedIssuers` and `transfer`, to
   *         enable backwards-compatible function signature for `transfer`,
   *         and since `transfer` cannot directly call `transferWithTrustedIssuers`
   *         due to reentrancy guard.
   * @param identifier The hashed identifier of a user to transfer to.
   * @param token The token to be transferred.
   * @param value The amount to be transferred.
   * @param expirySeconds The number of seconds before the sender can revoke the payment.
   * @param paymentId The address of the temporary wallet associated with this payment. Users must
   *        prove ownership of the corresponding private key to withdraw from escrow.
   * @param minAttestations The min number of attestations required to withdraw the payment.
   * @param trustedIssuers Array of issuers whose attestations in FederatedAttestations.sol
   *        will be accepted to prove ownership over an identifier.
   * @return True if transfer succeeded.
   * @dev Throws if 'token' or 'value' is 0.
   * @dev Throws if identifier is null and minAttestations > 0.
   * @dev Throws if minAttestations == 0 but trustedIssuers are provided.
   * @dev msg.sender needs to have already approved this contract to transfer.
   */
  function _transfer(
    bytes32 identifier,
    address token,
    uint256 value,
    uint256 expirySeconds,
    address paymentId,
    uint256 minAttestations,
    address[] memory trustedIssuers
  ) private returns (bool) {
    require(token != address(0) && value > 0 && expirySeconds > 0, "Invalid transfer inputs.");
    require(
      !(identifier == 0 && minAttestations > 0),
      "Invalid privacy inputs: Can't require attestations if no identifier"
    );
    // Withdraw logic with trustedIssuers in FederatedAttestations disregards
    // minAttestations, so ensure that this is not set to 0 to prevent confusing behavior
    // This also implies: if identifier == 0 => trustedIssuers.length == 0
    require(
      !(minAttestations == 0 && trustedIssuers.length > 0),
      "trustedIssuers may only be set when attestations are required"
    );

    // Ensure that withdrawal will not fail due to exceeding trustedIssuer limit
    // in FederatedAttestations.lookupAttestations
    require(
      trustedIssuers.length <= MAX_TRUSTED_ISSUERS_PER_PAYMENT,
      "Too many trustedIssuers provided"
    );

    IAttestations attestations = getAttestations();
    require(
      minAttestations <= attestations.getMaxAttestations(),
      "minAttestations larger than limit"
    );

    uint256 sentIndex = sentPaymentIds[msg.sender].push(paymentId).sub(1);
    uint256 receivedIndex = receivedPaymentIds[identifier].push(paymentId).sub(1);

    EscrowedPayment storage newPayment = escrowedPayments[paymentId];
    require(newPayment.timestamp == 0, "paymentId already used");
    newPayment.recipientIdentifier = identifier;
    newPayment.sender = msg.sender;
    newPayment.token = token;
    newPayment.value = value;
    newPayment.sentIndex = sentIndex;
    newPayment.receivedIndex = receivedIndex;
    newPayment.timestamp = block.timestamp;
    newPayment.expirySeconds = expirySeconds;
    newPayment.minAttestations = minAttestations;

    // Avoid unnecessary storage write
    if (trustedIssuers.length > 0) {
      trustedIssuersPerPayment[paymentId] = trustedIssuers;
    }

    ERC20(token).safeTransferFrom(msg.sender, address(this), value);
    emit Transfer(msg.sender, identifier, token, value, paymentId, minAttestations);
    // Split into a second event for ABI backwards compatibility
    emit TrustedIssuersSet(paymentId, trustedIssuers);
    return true;
  }

  /**
   * @notice Deletes the payment from its receiver's and sender's lists of payments,
   * and zeroes out all the data in the struct.
   * @param paymentId The ID of the payment to be deleted.
   */
  function deletePayment(address paymentId) private {
    EscrowedPayment storage payment = escrowedPayments[paymentId];
    address[] storage received = receivedPaymentIds[payment.recipientIdentifier];
    address[] storage sent = sentPaymentIds[payment.sender];

    escrowedPayments[received[received.length - 1]].receivedIndex = payment.receivedIndex;
    received[payment.receivedIndex] = received[received.length - 1];
    received.length = received.length.sub(1);

    escrowedPayments[sent[sent.length - 1]].sentIndex = payment.sentIndex;
    sent[payment.sentIndex] = sent[sent.length - 1];
    sent.length = sent.length.sub(1);

    delete escrowedPayments[paymentId];
    delete trustedIssuersPerPayment[paymentId];
    emit TrustedIssuersUnset(paymentId);
  }
}
