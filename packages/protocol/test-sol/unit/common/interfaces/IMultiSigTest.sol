// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

// Test-only superset interface for the migrated 0.8 MultiSig. Kept standalone
// (no inheritance) so it stays compilable from 0.5 test files, which cannot use
// `interface X is Y`. Intentionally NOT the production IMultiSig so production
// stays minimal.
interface IMultiSigTest {
  function initialize(
    address[] calldata _owners,
    uint256 _required,
    uint256 _internalRequired
  ) external;
  function submitTransaction(
    address destination,
    uint256 value,
    bytes calldata data
  ) external returns (uint256 transactionId);
  function confirmTransaction(uint256 transactionId) external;
  function revokeConfirmation(uint256 transactionId) external;
  function addOwner(address owner) external;
  function removeOwner(address owner) external;
  function replaceOwner(address owner, address newOwner) external;
  function changeRequirement(uint256 _required) external;
  function changeInternalRequirement(uint256 _internalRequired) external;
  function executeTransaction(uint256 transactionId) external;
  function transactions(
    uint256
  ) external view returns (address destination, uint256 value, bytes memory data, bool executed);
  function confirmations(uint256, address) external view returns (bool);
  function isOwner(address) external view returns (bool);
  function owners(uint256) external view returns (address);
  function required() external view returns (uint256);
  function internalRequired() external view returns (uint256);
  function transactionCount() external view returns (uint256);
  function MAX_OWNER_COUNT() external view returns (uint256);
  function isConfirmed(uint256 transactionId) external view returns (bool);
  function getConfirmationCount(uint256 transactionId) external view returns (uint256 count);
  function getTransactionCount(
    bool pending,
    bool executed
  ) external view returns (uint256 count);
  function getOwners() external view returns (address[] memory);
  function getConfirmations(
    uint256 transactionId
  ) external view returns (address[] memory _confirmations);
  function getTransactionIds(
    uint256 from,
    uint256 to,
    bool pending,
    bool executed
  ) external view returns (uint256[] memory _transactionIds);
}
