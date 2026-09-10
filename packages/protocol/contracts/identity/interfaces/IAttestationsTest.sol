// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

/**
 * @title Standalone interface for the 0.8 AttestationsTestMock08 deployed via deployCodeTo.
 * Exposes every method the 0.5 unit tests call on the mock: the Attestations surface
 * plus the test-only hooks (request, selectIssuers, complete, __setValidators) and the
 * public state-variable getters. Standalone (no inheritance) because 0.5 interfaces
 * cannot inherit.
 */
interface IAttestationsTest {
  // --- Attestations initializer ---
  function initialize(
    address registryAddress,
    uint256 attestationExpiryBlocks,
    uint256 selectIssuersWaitBlocks,
    uint256 maxAttestations,
    address[] calldata attestationRequestFeeTokens,
    uint256[] calldata attestationRequestFeeValues
  ) external;

  // --- AttestationsTest hooks ---
  function request(
    bytes32 identifier,
    uint256 attestationsRequested,
    address attestationRequestFeeToken
  ) external;
  function selectIssuers(bytes32 identifier) external;
  function complete(bytes32 identifier, uint8 v, bytes32 r, bytes32 s) external;
  function __setValidators(address[] calldata validators) external;

  // --- Attestations public methods ---
  function revoke(bytes32 identifier, uint256 index) external;
  function withdraw(address token) external;
  function setAttestationRequestFee(address token, uint256 fee) external;
  function setAttestationExpiryBlocks(uint256 _attestationExpiryBlocks) external;
  function setSelectIssuersWaitBlocks(uint256 _selectIssuersWaitBlocks) external;
  function setMaxAttestations(uint256 _maxAttestations) external;

  // --- Attestations view methods ---
  function getAttestationIssuers(
    bytes32 identifier,
    address account
  ) external view returns (address[] memory);
  function batchGetAttestationStats(
    bytes32[] calldata identifiersToLookup
  ) external view returns (uint256[] memory, address[] memory, uint64[] memory, uint64[] memory);
  function getAttestationRequestFee(address token) external view returns (uint256);
  function lookupAccountsForIdentifier(bytes32 identifier) external view returns (address[] memory);
  function requireNAttestationsRequested(
    bytes32 identifier,
    address account,
    uint32 expected
  ) external view;

  // --- public state-variable getters ---
  function attestationExpiryBlocks() external view returns (uint256);
  function selectIssuersWaitBlocks() external view returns (uint256);
  function maxAttestations() external view returns (uint256);
  function attestationRequestFees(address token) external view returns (uint256);
  function pendingWithdrawals(address token, address issuer) external view returns (uint256);
}
