// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

// Test-only superset interface for the migrated 0.8 Registry. Kept standalone
// (no inheritance) so it stays compilable from 0.5 test files, which cannot use
// `interface X is Y`. Intentionally NOT the production IRegistry so production
// stays minimal.
// NOTE: owner() is intentionally absent — use IOwnable for that (OZ Ownable collision under 0.8).
interface IRegistryTest {
  function initialize() external;

  function setAddressFor(string calldata identifier, address addr) external;

  function getAddressForOrDie(bytes32 identifierHash) external view returns (address);

  function getAddressFor(bytes32 identifierHash) external view returns (address);

  function getAddressForStringOrDie(
    string calldata identifier
  ) external view returns (address);

  function getAddressForString(string calldata identifier) external view returns (address);

  function isOneOf(
    bytes32[] calldata identifierHashes,
    address sender
  ) external view returns (bool);

  // Public mapping getter — not in IRegistry but needed for tests.
  function registry(bytes32 identifierHash) external view returns (address);
}
