// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// 0.8 ports of the 0.5 identity test mocks used by the Escrow / Attestations /
// FederatedAttestations unit tests. The 0.5 originals (contracts/identity/test/
// MockERC20Token.sol and MockAttestations.sol) are strict ^0.5.13 and cannot be
// imported by 0.8 tests, so these concrete equivalents are instantiated directly.

/**
 * @title 0.8 port of the 0.5 MockERC20Token.
 * @dev Tracks raw balances and reverts on underflow with the same
 * "SafeMath: subtraction overflow" message the 0.5 SafeMath produced, so the
 * Escrow tests' insufficient-balance expectation is preserved verbatim.
 */
contract MockERC20Token08 {
  mapping(address => uint256) private balances;

  function transfer(address to, uint256 value) external returns (bool) {
    return transferFrom(msg.sender, to, value);
  }

  function mint(address to, uint256 amount) external returns (bool) {
    balances[to] = balances[to] + amount;
    return true;
  }

  function balanceOf(address owner) external view returns (uint256) {
    return balances[owner];
  }

  function transferFrom(address from, address to, uint256 value) public returns (bool) {
    require(balances[from] >= value, "SafeMath: subtraction overflow");
    balances[from] = balances[from] - value;
    balances[to] = balances[to] + value;
    return true;
  }
}

/**
 * @title 0.8 port of the 0.5 MockAttestations.
 * @dev Only the subset exercised by the Escrow tests is needed: complete() to
 * accrue completions and getAttestationStats() (matching IAttestations) so the
 * Escrow withdraw eligibility check can read them.
 */
contract MockAttestations08 {
  enum AttestationStatus {
    None,
    Incomplete,
    Complete
  }

  struct Attestation {
    AttestationStatus status;
    uint128 time;
  }

  struct Attestations {
    uint32 completed;
    uint32 requested;
    address[] issuers;
    mapping(address => Attestation) issuedAttestations;
  }

  struct IdentifierState {
    address[] accounts;
    mapping(address => Attestations) attestations;
  }

  mapping(bytes32 => IdentifierState) identifiers;

  function complete(bytes32 identifier, uint8, bytes32, bytes32) external {
    identifiers[identifier].attestations[msg.sender].completed++;

    if (identifiers[identifier].attestations[msg.sender].completed == 1) {
      identifiers[identifier].accounts.push(msg.sender);
    }
  }

  function request(bytes32 identifier, uint8, bytes32, bytes32) external {
    identifiers[identifier].attestations[msg.sender].requested++;
  }

  function getAttestationStats(
    bytes32 identifier,
    address account
  ) external view returns (uint32, uint32) {
    return (
      identifiers[identifier].attestations[account].completed,
      identifiers[identifier].attestations[account].requested
    );
  }

  function lookupAccountsForIdentifier(
    bytes32 identifier
  ) external view returns (address[] memory) {
    return identifiers[identifier].accounts;
  }

  function getMaxAttestations() external pure returns (uint256) {
    return 20;
  }
}

/**
 * @title Minimal 0.8 Validators mock for the Attestations tests.
 * @dev Accounts.authorizeValidatorSigner reads only isValidator() (must be false)
 * from the registered Validators contract. The 0.5 MockValidators is strict
 * ^0.5.13 and not in the 0.8 compile closure, so this trimmed-down equivalent is
 * instantiated directly.
 */
contract MockValidators08 {
  function isValidator(address) external pure returns (bool) {
    return false;
  }
}
