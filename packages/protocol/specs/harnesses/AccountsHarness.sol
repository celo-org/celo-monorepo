pragma solidity ^0.5.13;

import "contracts/common/Accounts.sol";

contract AccountsHarness is Accounts {
  constructor(bool test) public Accounts(test) {}

  function _getAuthorizedBy(address signer) public view returns (address) {
    return authorizedBy[signer];
  }

  function _getDataEncryptionKeyLen(address a) public view returns (uint256) {
    return this.getDataEncryptionKey(a).length;
  }

  function _getNameLen(address a) public view returns (uint256) {
    return bytes(this.getName(a)).length;
  }

  function _getVoteSigner(address account) public view returns (address) {
    return accounts[account].signers.vote;
  }

  function _getValidatorSigner(address account) public view returns (address) {
    return accounts[account].signers.validator;
  }

  function _getAttestationSigner(address account) public view returns (address) {
    return accounts[account].signers.attestation;
  }

  function _getDefaultSigner(address account, bytes32 role) public view returns (address) {
    return defaultSigners[account][role];
  }

  function isCompletedSignerAuthorization(address account, bytes32 role, address signer)
    public
    view
    returns (bool)
  {
    return signerAuthorizations[account][role][signer].completed;
  }

  function isStartedSignerAuthorization(address account, bytes32 role, address signer)
    public
    view
    returns (bool)
  {
    return signerAuthorizations[account][role][signer].started;
  }

  function _getValidatorRole() public view returns (bytes32) {
    return ValidatorSigner;
  }
  function _getVoteRole() public view returns (bytes32) {
    return VoteSigner;
  }
  function _getAttestationRole() public view returns (bytes32) {
    return AttestationSigner;
  }
}
