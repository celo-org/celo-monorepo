// TODO figure out if we can use a new solidity version for just this one contract
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

  struct IdentifierOwnershipAttestation {
    address account;
    uint256 issuedOn;
    address signer;
  }
  // identifier -> issuer -> attestations
  mapping(bytes32 => mapping(address => IdentifierOwnershipAttestation[])) public identifierToAddresses;
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
  ) public view returns (IdentifierOwnershipAttestation[] memory) {
    // Cannot dynamically allocate an in-memory array
    // For now require a max returned parameter to pre-allocate and then shrink
    // TODO ASv2 probably need a more gas-efficient lookup for the single most-recent attestation for one trusted issuer
    uint256 currIndex = 0;
    IdentifierOwnershipAttestation[] memory attestations = new IdentifierOwnershipAttestation[](
      maxAttestations
    );
    for (uint256 i = 0; i < trustedIssuers.length; i++) {
      address trustedIssuer = trustedIssuers[i];
      for (uint256 j = 0; j < identifierToAddresses[identifier][trustedIssuer].length; j++) {
        // Only create and push new attestation if we haven't hit max
        if (currIndex < maxAttestations) {
          IdentifierOwnershipAttestation memory attestation = identifierToAddresses[identifier][trustedIssuer][j];
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
      IdentifierOwnershipAttestation[] memory trimmedAttestations = new IdentifierOwnershipAttestation[](
        currIndex
      );
      for (uint256 i = 0; i < currIndex; i++) {
        trimmedAttestations[i] = attestations[i];
      }
      return trimmedAttestations;
    } else {
      return attestations;
    }
  }

  function lookupIdentifiersByAddress(
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
            IdentifierOwnershipAttestation memory attestation = identifierToAddresses[identifier][trustedIssuer][k];
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
    IdentifierOwnershipAttestation memory attestation,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (address) {
    // TODO check if signer is revoked and is a valid signer of the account
  }

  function registerAttestation(
    bytes32 identifier,
    address issuer,
    IdentifierOwnershipAttestation memory attestation
  ) public {
    // TODO call validateAttestation here
    require(
      msg.sender == attestation.account || msg.sender == issuer || msg.sender == attestation.signer
    );
    for (uint256 i = 0; i < identifierToAddresses[identifier][issuer].length; i++) {
      // This enforces only one attestation to be uploaded for a given set of (identifier, issuer, account)
      // Editing/upgrading an attestation requires that it be deleted before a new one is registered
      require(identifierToAddresses[identifier][issuer][i].account != attestation.account);
    }
    identifierToAddresses[identifier][issuer].push(attestation);
    addressToIdentifiers[attestation.account][issuer].push(identifier);
  }

  function deleteAttestation(bytes32 identifier, address issuer, address account) public {
    // TODO ASv2 this should short-circuit, but double check (i.e. succeeds if msg.sender == account)
    require(
      msg.sender == account || getAccounts().attestationSignerToAccount(msg.sender) == issuer
    );

    for (uint256 i = 0; i < identifierToAddresses[identifier][issuer].length; i++) {
      IdentifierOwnershipAttestation memory attestation = identifierToAddresses[identifier][issuer][i];
      if (attestation.account == account) {
        // This is meant to delete the attestation in the array and then move the last element in the array to that empty spot, to avoid having empty elements in the array
        // Not sure if this is needed and if the added gas costs from the complexity is worth it
        identifierToAddresses[identifier][issuer][i] = identifierToAddresses[identifier][issuer][identifierToAddresses[identifier][issuer]
          .length -
          1];
        identifierToAddresses[identifier][issuer].pop();

        // TODO revisit if deletedIdentifier check is necessary - not sure if there would ever be a situation where the matching identifier is not present
        bool deletedIdentifier = false;
        for (uint256 j = 0; j < addressToIdentifiers[account][issuer].length; j++) {
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
    // TODO ASv2 add constraints on who can revoke a signer
    revokedSigners[signer] = revokedOn;
  }
}
