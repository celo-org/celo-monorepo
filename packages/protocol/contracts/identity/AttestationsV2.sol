pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/SafeCast.sol";

import "./interfaces/IAttestations.sol";
import "../common/interfaces/IAccounts.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/Signatures.sol";
import "../common/UsingPrecompiles.sol";
import "../common/libraries/ReentrancyGuard.sol";

/**
 * @title Contract mapping identifiers to accounts
 */
contract AttestationsV2 is
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistry,
  ReentrancyGuard,
  UsingPrecompiles
{
  using SafeMath for uint256;
  using SafeCast for uint256;

  // TODO(asa): Is it more efficient to have a smaller request size if there are multiple requests?
  struct Request {
    // The block at which the attestations were requested.
    uint128 blockNumber;
    // The number of attestations that were requested.
    uint128 attestationsRequested;
  }

  // Stores attestations state for a single (identifier, account address) pair.
  struct Attestations {
    // Total number of requested attestations.
    uint32 requested;
    // Total number of completed attestations.
    uint32 completed;
    // List of issuers of completed attestations.
    address[] issuers;
    // Block number at which the attestation was completed.
    mapping(address => uint256) issuedAt;
    Request[] requests;
  }

  struct Identifier {
    // All account addresses associated with this identifier.
    address[] accounts;
    // Keeps the state of attestations for account addresses for this identifier.
    mapping(address => Attestations) attestations;
  }

  mapping(bytes32 => Identifier) identifiers;

  // The duration in blocks in which an attestation can be completed from the block in which the
  // attestation was requested.
  uint256 public attestationExpiryBlocks;

  // The duration to wait until selectIssuers can be called for an attestation request.
  uint256 public selectIssuersWaitBlocks;

  // Limit the maximum number of attestations that can be requested
  uint256 public maxAttestations;

  // The attestation request fee in cUSD, which will be translated into CELO.
  uint256 public attestationRequestFee;
  address public attestationRequestFeeToken;

  // Make it compile
  mapping(address => uint256) public attestationRequestFees;

  // Maps an attestation issuer to the amount that they're owed.
  mapping(address => uint256) public pendingWithdrawals;

  event AttestationsRequested(
    bytes32 indexed identifier,
    address indexed account,
    uint256 attestationsRequested
  );

  event AttestationCompleted(
    bytes32 indexed identifier,
    address indexed account,
    address indexed issuer
  );

  event Withdrawal(address indexed account, uint256 amount);
  event AttestationExpiryBlocksSet(uint256 value);
  event AttestationRequestFeeSet(uint256 value);
  event SelectIssuersWaitBlocksSet(uint256 value);
  event MaxAttestationsSet(uint256 value);

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _attestationExpiryBlocks The new limit on blocks allowed to come between requesting
   * an attestation and completing it.
   * @param _selectIssuersWaitBlocks The wait period in blocks to call selectIssuers on attestation
   * requests.
   */
  function initialize(
    address registryAddress,
    uint256 _attestationExpiryBlocks,
    uint256 _selectIssuersWaitBlocks,
    uint256 _maxAttestations,
    uint256 _attestationRequestFee,
    address _attestationRequestFeeToken
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setAttestationExpiryBlocks(_attestationExpiryBlocks);
    setSelectIssuersWaitBlocks(_selectIssuersWaitBlocks);
    setMaxAttestations(_maxAttestations);
    attestationRequestFee = _attestationRequestFee;
    attestationRequestFeeToken = _attestationRequestFeeToken;
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 1, 1);
  }

  /**
   * @notice Commit to the attestation request of a hashed identifier.
   * @param identifier The hash of the identifier to be attested.
   * @param attestationsRequested The number of requested attestations for this request.
   * be paid.
   * @dev Note that if an attestation expires before it is completed, the fee is forfeited. This is
   * to prevent folks from attacking validators by requesting attestations that they do not
   * complete, and to increase the cost of validators attempting to manipulate the attestations
   * protocol.
   */
  function request(bytes32 identifier, uint256 attestationsRequested)
    external
    payable
    nonReentrant
  {
    // require(msg.value == attestationsRequested.mul(attestationRequestFee), "Insufficient fee");
    require(
      0 < attestationsRequested && attestationsRequested <= maxAttestations,
      "Invalid attestationsRequested"
    );

    require(
      IERC20(attestationRequestFeeToken).transferFrom(
        msg.sender,
        address(this),
        attestationRequestFees[attestationRequestFeeToken].mul(attestationsRequested)
      ),
      "Transfer of attestation request fees failed"
    );

    Attestations storage attestations = identifiers[identifier].attestations[msg.sender];
    uint256 numRequests = attestations.requests.length;
    attestations.requests.length = numRequests + 1;
    attestations.requests[numRequests].blockNumber = block.number.toUint128();
    attestations.requests[numRequests].attestationsRequested = attestationsRequested.toUint128();
    attestations.requested = uint256(attestations.requested).add(attestationsRequested).toUint32();

    emit AttestationsRequested(identifier, msg.sender, attestationsRequested);
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
  function complete(
    bytes32 identifier,
    uint256 requestIndex,
    uint256 issuerIndex,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    address issuer = validateAttestationCode(
      identifier,
      msg.sender,
      requestIndex,
      issuerIndex,
      v,
      r,
      s
    );

    Attestations storage attestations = identifiers[identifier].attestations[msg.sender];
    require(attestations.completed < attestations.completed + 1, "SafeMath32 integer overflow");
    attestations.completed = attestations.completed + 1;

    pendingWithdrawals[issuer] = pendingWithdrawals[issuer].add(attestationRequestFee);

    if (attestations.completed == 1) {
      identifiers[identifier].accounts.push(msg.sender);
    }
    emit AttestationCompleted(identifier, msg.sender, issuer);
  }

  function _getIssuer(
    Attestations storage attestations,
    Request storage attestationsRequest,
    uint256 issuerIndex
  ) private view returns (address) {
    bytes32 seed = getRandom().getBlockRandomness(
      uint256(attestationsRequest.blockNumber).add(selectIssuersWaitBlocks)
    );
    IAccounts accounts = getAccounts();
    uint256 issuersLength = numberValidatorsInCurrentSet();
    uint256[] memory issuers = new uint256[](issuersLength);
    for (uint256 i = 0; i < issuersLength; i = i.add(1)) issuers[i] = i;

    require(attestationsRequest.attestationsRequested <= issuersLength, "not enough issuers");

    // This stuff costs about 20k gas over 3 attestations, i.e. 6.7k each.
    uint256 currentIndex = 0;
    // The length of the list (variable issuersLength) is decremented in each round,
    // so the loop always terminates
    while (currentIndex <= issuerIndex) {
      require(issuersLength > 0, "not enough issuers");
      seed = keccak256(abi.encodePacked(seed));
      uint256 idx = uint256(seed) % issuersLength;
      address signer = validatorSignerAddressFromCurrentSet(issuers[idx]);
      address issuer = accounts.signerToAccount(signer);
      uint256 issuedAt = attestations.issuedAt[issuer];
      if (issuedAt == attestationsRequest.blockNumber || issuedAt == 0) {
        // The issuer is the `currentIndex`th issuer for this attestation request.
        if (currentIndex == issuerIndex) {
          return issuer;
        }
        currentIndex = currentIndex.add(1);
      }
      // Remove the validator that was selected from the list,
      // by replacing it by the last element in the list
      issuersLength = issuersLength.sub(1);
      issuers[idx] = issuers[issuersLength];
    }
    revert("No available attestation issuers");
  }

  function getIssuer(bytes32 identifier, address account, uint256 requestIndex, uint256 issuerIndex)
    public
    view
    returns (address)
  {
    Attestations storage attestations = identifiers[identifier].attestations[account];
    require(requestIndex < attestations.requests.length);
    Request storage attestationsRequest = attestations.requests[requestIndex];
    require(issuerIndex < attestationsRequest.attestationsRequested);
    return _getIssuer(attestations, attestationsRequest, issuerIndex);
  }

  /*
  function withdraw() external {
    address payable issuer = getAccounts().attestationSignerToAccount(msg.sender);
    uint256 value = pendingWithdrawals[issuer];
    require(value > 0, "value was negative/zero");
    pendingWithdrawals[issuer] = 0;
    issuer.transfer(value);
    emit Withdrawal(issuer, value);
  }
  */

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
  function getRequest(bytes32 identifier, address account, uint256 index)
    external
    view
    returns (uint128, uint128)
  {
    return (
      identifiers[identifier].attestations[account].requests[index].blockNumber,
      identifiers[identifier].attestations[account].requests[index].attestationsRequested
    );
  }

  /**
   * @notice Returns attestation issuers for a identifier/account pair.
   * @param identifier Hash of the identifier.
   * @param account Address of the account.
   * @return Addresses of the attestation issuers.
   */
  function getAttestationIssuers(bytes32 identifier, address account)
    external
    view
    returns (address[] memory)
  {
    return identifiers[identifier].attestations[account].issuers;
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
   * @notice Updates the fee  for a particular token.
   * @param fee The fee in 'token' that is required for each attestation.
   */
  function setAttestationRequestFee(uint256 fee) public onlyOwner {
    require(fee > 0, "You have to specify a fee greater than 0");
    attestationRequestFee = fee;
    emit AttestationRequestFeeSet(fee);
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
   * @notice Validates the given attestation code.
   * @param identifier The hash of the identifier to be attested.
   * @param account Address of the account. 
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
    uint256 requestIndex,
    uint256 issuerIndex,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (address) {
    address desiredIssuer = getIssuer(identifier, account, requestIndex, issuerIndex);
    bytes32 codehash = keccak256(abi.encodePacked(identifier, account));
    address signer = Signatures.getSignerOfMessageHash(codehash, v, r, s);
    address issuer = getAccounts().attestationSignerToAccount(signer);
    require(desiredIssuer == issuer, "Invalid attestation code");
    require(
      identifiers[identifier].attestations[account].issuedAt[issuer] == 0,
      "Attestation already completed"
    );
    require(
      !isAttestationExpired(
        identifiers[identifier].attestations[account].requests[requestIndex].blockNumber
      ),
      "Attestation timed out"
    );
    return issuer;
  }

  function getAccountsForIdentifier(bytes32 identifier) external view returns (address[] memory) {
    return identifiers[identifier].accounts;
  }

  function isAttestationExpired(uint128 attestationRequestBlock) internal view returns (bool) {
    return block.number >= uint256(attestationRequestBlock).add(attestationExpiryBlocks);
  }
}
