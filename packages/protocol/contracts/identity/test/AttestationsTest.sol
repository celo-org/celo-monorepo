pragma solidity ^0.5.13;

import "../Attestations.sol";

/*
 * We need a test contract that behaves like the actual Attestations contract,
 * but mocks the implementations of the validator set getters. Otherwise we
 * couldn't test `request` with the current ganache local testnet.
 */
contract AttestationsTest is Attestations(true) {
  address[] private __testValidators;

  // some deprecated functions are mocked here to ensure that the tests for
  // revoke and withdraw can still run

  /**
   * @notice Commit to the attestation request of a hashed identifier.
   * @param identifier The hash of the identifier to be attested.
   * @param attestationsRequested The number of requested attestations for this request.
   * @param attestationRequestFeeToken The address of the token with which the attestation fee will
   * be paid.
   * @dev Note that if an attestation expires before it is completed, the fee is forfeited. This is
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

    Attestation storage attestation = identifiers[identifier]
      .attestations[msg.sender]
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

  function __setValidators(address[] memory validators) public {
    __testValidators = validators;
  }

  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return __testValidators.length;
  }

  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    return __testValidators[index];
  }

  /**
   * @notice Adds additional attestations given the current randomness.
   * @param identifier The hash of the identifier to be attested.
   */
  function addIncompleteAttestations(bytes32 identifier) internal {
    AttestedAddress storage state = identifiers[identifier].attestations[msg.sender];
    UnselectedRequest storage unselectedRequest = identifiers[identifier].unselectedRequests[
      msg.sender
    ];

    bytes32 seed = getRandom().getBlockRandomness(
      uint256(unselectedRequest.blockNumber).add(selectIssuersWaitBlocks)
    );
    IAccounts accounts = getAccounts();
    uint256 issuersLength = numberValidatorsInCurrentSet();
    uint256[] memory issuers = new uint256[](issuersLength);
    for (uint256 i = 0; i < issuersLength; i = i.add(1)) issuers[i] = i;

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
}
