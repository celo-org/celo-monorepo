pragma solidity ^0.5.13;
// TODO ASv2 come back to this and possibly flatten structs as arg params
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/SafeCast.sol";

import "./interfaces/IFederatedAttestations.sol";
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
contract FederatedAttestations is
  IFederatedAttestations,
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistry,
  ReentrancyGuard,
  UsingPrecompiles
{
  using SafeMath for uint256;
  using SafeCast for uint256;

  struct Attestation {
    address account;
    uint256 issuedOn;
    address signer;
  }
  // identifier -> issuer -> attestations
  mapping(bytes32 => mapping(address => Attestation[])) public identifierToAddresses;
  // account -> issuer -> identifiers
  mapping(address => mapping(address => bytes32[])) public addressToIdentifiers;
  // signer => revocation time
  mapping(address => uint256) public revokedSigners;

  // TODO ASv2 Event declarations

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    // TODO ASv2 initialize any other variables here
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  function _isRevoked(address signer, uint256 time) internal view returns (bool) {
    if (revokedSigners[signer] > 0 && revokedSigners[signer] >= time) {
      return true;
    }
    return false;
  }

  function lookupAttestations(
    bytes32 identifier,
    address[] memory trustedIssuers,
    uint256 maxAttestations
  ) public view returns (Attestation[] memory) {
    // Cannot dynamically allocate an in-memory array
    // For now require a max returned parameter to pre-allocate and then shrink
    // TODO ASv2 probably need a more gas-efficient lookup for the single most-recent attestation for one trusted issuer
    uint256 currIndex = 0;
    Attestation[] memory attestations = new Attestation[](maxAttestations);
    for (uint256 i = 0; i < trustedIssuers.length; i++) {
      address trustedIssuer = trustedIssuers[i];
      for (uint256 j = 0; j < identifierToAddresses[identifier][trustedIssuer].length; j++) {
        // Only create and push new attestation if we haven't hit max
        if (currIndex < maxAttestations) {
          Attestation memory attestation = identifierToAddresses[identifier][trustedIssuer][j];
          if (!_isRevoked(attestation.signer, attestation.issuedOn)) {
            attestations[currIndex] = attestation;
            currIndex++;
          }
        } else {
          break;
        }
      }
    }
    if (currIndex < maxAttestations) {
      Attestation[] memory trimmedAttestations = new Attestation[](currIndex);
      for (uint256 i = 0; i < currIndex; i++) {
        trimmedAttestations[i] = attestations[i];
      }
      return trimmedAttestations;
    } else {
      return attestations;
    }
  }

  function lookupIdentifiersbyAddress(
    address account,
    address[] memory trustedIssuers,
    uint256 maxIdentifiers
  ) public view returns (bytes32[] memory) {
    // Same as for the other lookup, preallocate and then trim for now
    uint256 currIndex = 0;
    bytes32[] memory identifiers = new bytes32[](maxIdentifiers);

    for (uint256 i = 0; i < trustedIssuers.length; i++) {
      address trustedIssuer = trustedIssuers[i];
      for (uint256 j = 0; j < addressToIdentifiers[account][trustedIssuer].length; j++) {
        // Iterate through the list of identifiers
        if (currIndex < maxIdentifiers) {
          bytes32 identifier = addressToIdentifiers[account][trustedIssuer][j];
          // Check if this signer for this particular signer is revoked
          for (uint256 k = 0; k < identifierToAddresses[identifier][trustedIssuer].length; k++) {
            Attestation memory attestation = identifierToAddresses[identifier][trustedIssuer][k];
            // For now, just take the first published, unrevoked signer that matches
            // TODO redo this to take into account either recency or the "correct" identifier
            // based on the index
            if (
              attestation.account == account &&
              !_isRevoked(attestation.signer, attestation.issuedOn)
            ) {
              identifiers[currIndex] = identifier;
              currIndex++;
              break;
            }
          }
        } else {
          break;
        }
      }
    }
    if (currIndex < maxIdentifiers) {
      // Allocate and fill properly-sized array
      bytes32[] memory trimmedIdentifiers = new bytes32[](currIndex);
      for (uint256 i = 0; i < currIndex; i++) {
        trimmedIdentifiers[i] = identifiers[i];
      }
      return trimmedIdentifiers;
    } else {
      return identifiers;
    }
  }

  function validateAttestation(
    bytes32 identifier,
    address issuer,
    Attestation memory attestation,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (address) {}

  function registerAttestation(bytes32 identifier, address issuer, Attestation memory attestation)
    public
  {
    require(
      msg.sender == attestation.account || msg.sender == issuer || msg.sender == attestation.signer
    );
    for (uint256 i = 0; i < identifierToAddresses[identifier][issuer].length; i++) {
      // TODO revisit this: do we only want to check that the account address is not duplicated?
      require(identifierToAddresses[identifier][issuer][i].account != attestation.account);
    }
    identifierToAddresses[identifier][issuer].push(attestation);
    addressToIdentifiers[attestation.account][issuer].push(identifier);
  }

  function deleteAttestation(bytes32 identifier, address issuer, address account, uint256 issuedOn)
    public
  {
    // TODO ASv2 this should short-circuit, but double check (i.e. succeeds if msg.sender == account)
    require(
      msg.sender == account || getAccounts().attestationSignerToAccount(msg.sender) == issuer
    );
    // TODO ASv2 need to revisit all of this once we have the invariants set between
    // identifier -> addresses and reverse mapping

    for (uint256 i = 0; i < identifierToAddresses[identifier][issuer].length; i++) {
      Attestation memory attestation = identifierToAddresses[identifier][issuer][i];
      if (attestation.account == account && attestation.issuedOn == issuedOn) {
        // Delete only first matching attestation
        // TODO ASv2 revisit: alternatively, for not just first match could while loop on attestation.account == account and keep swapping in the last element, then break...weird tho
        identifierToAddresses[identifier][issuer][i] = identifierToAddresses[identifier][issuer][identifierToAddresses[identifier][issuer]
          .length -
          1];
        identifierToAddresses[identifier][issuer].pop();

        bool deletedIdentifier = false;
        for (uint256 j = 0; j < addressToIdentifiers[account][issuer].length; j++) {
          // Delete only first matching identifier
          if (addressToIdentifiers[account][issuer][j] == identifier) {
            addressToIdentifiers[account][issuer][j] = addressToIdentifiers[account][issuer][addressToIdentifiers[account][issuer]
              .length -
              1];
            addressToIdentifiers[account][issuer].pop();
            deletedIdentifier = true;
            break;
          }
        }
        // Hard requirement to delete from both mappings in unison
        require(deletedIdentifier);
        break;
      }
    }
  }

  function revokeSigner(address signer, uint256 revokedOn) public {
    revokedSigners[signer] = revokedOn;
  }
}
