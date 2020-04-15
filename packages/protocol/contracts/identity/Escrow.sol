pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IAttestations.sol";
import "./interfaces/IEscrow.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/Signatures.sol";
import "../common/libraries/ReentrancyGuard.sol";

contract Escrow is IEscrow, ReentrancyGuard, Ownable, Initializable, UsingRegistry {
  using SafeMath for uint256;

  event Transfer(
    address indexed from,
    bytes32 indexed identifier,
    address indexed token,
    uint256 value,
    address paymentId,
    uint256 minAttestations
  );

  event Withdrawal(
    bytes32 indexed identifier,
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

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
  * @notice Transfer tokens to a specific user. Supports both identity with privacy (an empty
  *         identifier and 0 minAttestations) and without (with identifier and minAttestations).
  * @param identifier The hashed identifier of a user to transfer to.
  * @param token The token to be transferred.
  * @param value The amount to be transferred.
  * @param expirySeconds The number of seconds before the sender can revoke the payment.
  * @param paymentId The address of the temporary wallet associated with this payment. Users must
  *        prove ownership of the corresponding private key to withdraw from escrow.
  * @param minAttestations The min number of attestations required to withdraw the payment.
  * @dev Throws if 'token' or 'value' is 0.
  * @dev msg.sender needs to have already approved this contract to transfer
  * @dev If no identifier is given, then minAttestations must be 0.
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
    require(token != address(0) && value > 0 && expirySeconds > 0, "Invalid transfer inputs.");
    require(
      !(identifier.length <= 0 && !(minAttestations == 0)),
      "Invalid privacy inputs: Can't require attestations if no identifier"
    );

    IAttestations attestations = IAttestations(registry.getAddressFor(ATTESTATIONS_REGISTRY_ID));
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
    // solhint-disable-next-line not-rely-on-time
    newPayment.timestamp = now;
    newPayment.expirySeconds = expirySeconds;
    newPayment.minAttestations = minAttestations;

    require(ERC20(token).transferFrom(msg.sender, address(this), value), "Transfer unsuccessful.");
    emit Transfer(msg.sender, identifier, token, value, paymentId, minAttestations);
    return true;
  }

  /**
  * @notice Withdraws tokens for a verified user.
  * @param paymentId The ID for the EscrowedPayment struct that contains all relevant information.
  * @param v The recovery id of the incoming ECDSA signature.
  * @param r Output value r of the ECDSA signature.
  * @param s Output value s of the ECDSA signature.
  * @dev Throws if 'token' or 'value' is 0.
  * @dev Throws if msg.sender does not prove ownership of the withdraw key.
  */
  function withdraw(address paymentId, uint8 v, bytes32 r, bytes32 s)
    external
    nonReentrant
    returns (bool)
  {
    address signer = Signatures.getSignerOfAddress(msg.sender, v, r, s);
    require(signer == paymentId, "Failed to prove ownership of the withdraw key");
    EscrowedPayment memory payment = escrowedPayments[paymentId];
    require(payment.token != address(0) && payment.value > 0, "Invalid withdraw value.");

    if (payment.recipientIdentifier.length > 0) {
      IAttestations attestations = IAttestations(registry.getAddressFor(ATTESTATIONS_REGISTRY_ID));
      (uint64 completedAttestations, ) = attestations.getAttestationStats(
        payment.recipientIdentifier,
        msg.sender
      );
      require(
        uint256(completedAttestations) >= payment.minAttestations,
        "This account does not have enough attestations to withdraw this payment."
      );
    }

    deletePayment(paymentId);

    require(ERC20(payment.token).transfer(msg.sender, payment.value), "Transfer not successful.");

    emit Withdrawal(
      payment.recipientIdentifier,
      payment.sender,
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
      // solhint-disable-next-line not-rely-on-time
      now >= (payment.timestamp.add(payment.expirySeconds)),
      "Transaction not redeemable for sender yet."
    );

    deletePayment(paymentId);

    require(ERC20(payment.token).transfer(msg.sender, payment.value), "Transfer not successful.");

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
  }
}
