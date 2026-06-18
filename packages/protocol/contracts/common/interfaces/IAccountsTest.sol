// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

/**
 * @title Standalone interface for the 0.8 Accounts contract deployed via deployCodeTo.
 * Exposes every method the unit/integration tests call on Accounts: the IAccounts surface,
 * the initializer, the generic-signer authorization surface, the public state-variable
 * getters (authorizedBy, EIP712_AUTHORIZE_SIGNER_TYPEHASH), and the offchain-storage-root
 * helpers. Standalone (no inheritance) because 0.5 interfaces cannot inherit; use IOwnable
 * separately if a test needs owner()/isOwner().
 */
interface IAccountsTest {
  // --- Initializer ---
  function initialize(address registryAddress) external;
  function setEip712DomainSeparator() external;

  // --- Account setters ---
  function setAccount(
    string calldata name,
    bytes calldata dataEncryptionKey,
    address walletAddress,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
  function setName(string calldata name) external;
  function setWalletAddress(address walletAddress, uint8 v, bytes32 r, bytes32 s) external;
  function setAccountDataEncryptionKey(bytes calldata dataEncryptionKey) external;
  function setMetadataURL(string calldata metadataURL) external;
  function createAccount() external returns (bool);

  // --- Offchain storage roots ---
  function addStorageRoot(bytes calldata url) external;
  function removeStorageRoot(uint256 index) external;
  function getOffchainStorageRoots(
    address account
  ) external view returns (bytes memory, uint256[] memory);

  // --- Payment delegation ---
  function setPaymentDelegation(address beneficiary, uint256 fraction) external;
  function deletePaymentDelegation() external;
  function getPaymentDelegation(address account) external view returns (address, uint256);

  // --- Legacy authorization ---
  function authorizeVoteSigner(address signer, uint8 v, bytes32 r, bytes32 s) external;
  function authorizeValidatorSigner(address signer, uint8 v, bytes32 r, bytes32 s) external;
  function authorizeValidatorSignerWithPublicKey(
    address signer,
    uint8 v,
    bytes32 r,
    bytes32 s,
    bytes calldata ecdsaPublicKey
  ) external;
  function authorizeAttestationSigner(address signer, uint8 v, bytes32 r, bytes32 s) external;
  function removeVoteSigner() external;
  function removeValidatorSigner() external;
  function removeAttestationSigner() external;

  // --- Generic (indexed/default) authorization ---
  function authorizeSigner(address signer, bytes32 role) external;
  function authorizeSignerWithSignature(
    address signer,
    bytes32 role,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
  function completeSignerAuthorization(address account, bytes32 role) external;
  function setIndexedSigner(address signer, bytes32 role) external;
  function removeIndexedSigner(bytes32 role) external;
  function removeDefaultSigner(bytes32 role) external;
  function removeSigner(address signer, bytes32 role) external;

  // --- Account getters ---
  function isAccount(address account) external view returns (bool);
  function getName(address account) external view returns (string memory);
  function getMetadataURL(address account) external view returns (string memory);
  function getDataEncryptionKey(address account) external view returns (bytes memory);
  function getWalletAddress(address account) external view returns (address);
  function batchGetMetadataURL(
    address[] calldata accountsToQuery
  ) external view returns (uint256[] memory, bytes memory);

  // --- Signer getters ---
  function isAuthorizedSigner(address signer) external view returns (bool);
  function isSigner(address account, address signer, bytes32 role) external view returns (bool);
  function isLegacySigner(
    address account,
    address signer,
    bytes32 role
  ) external view returns (bool);
  function isDefaultSigner(
    address account,
    address signer,
    bytes32 role
  ) external view returns (bool);
  function isIndexedSigner(
    address account,
    address signer,
    bytes32 role
  ) external view returns (bool);
  function isLegacyRole(bytes32 role) external pure returns (bool);

  function getVoteSigner(address account) external view returns (address);
  function getValidatorSigner(address account) external view returns (address);
  function getAttestationSigner(address account) external view returns (address);
  function getLegacySigner(address account, bytes32 role) external view returns (address);
  function getDefaultSigner(address account, bytes32 role) external view returns (address);
  function getIndexedSigner(address account, bytes32 role) external view returns (address);

  function hasAuthorizedVoteSigner(address account) external view returns (bool);
  function hasAuthorizedValidatorSigner(address account) external view returns (bool);
  function hasAuthorizedAttestationSigner(address account) external view returns (bool);
  function hasAuthorizedSigner(address account, string calldata role) external view returns (bool);
  function hasLegacySigner(address account, bytes32 role) external view returns (bool);
  function hasDefaultSigner(address account, bytes32 role) external view returns (bool);
  function hasIndexedSigner(address account, bytes32 role) external view returns (bool);

  function voteSignerToAccount(address signer) external view returns (address);
  function validatorSignerToAccount(address signer) external view returns (address);
  function attestationSignerToAccount(address signer) external view returns (address);
  function signerToAccount(address signer) external view returns (address);

  function getRoleAuthorizationSigner(
    address account,
    address signer,
    bytes32 role,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external view returns (address);

  // --- public state-variable getters ---
  function authorizedBy(address signer) external view returns (address);
  function eip712DomainSeparator() external view returns (bytes32);
  function EIP712_AUTHORIZE_SIGNER_TYPEHASH() external view returns (bytes32);
  function offchainStorageRoots(
    address account,
    uint256 index
  ) external view returns (bytes memory);

  // --- version ---
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256);
}
