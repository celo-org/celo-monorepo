pragma solidity ^0.5.8;

import "contracts/common/Accounts.sol";

contract AccountsHarness is Accounts {
  function _getAuthorizedBy(address signer) public view returns (address) {
    return authorizedBy[signer];
  }

  function _getDataEncryptionKeyLen(address a) public view returns (uint256) {
    return this.getDataEncryptionKey(a).length;
  }
  function _getNameLen(address a) public view returns (uint256) {
    return bytes(this.getName(a)).length;
  }

  function init_state() public {}

  function _getVoteSigner(address account) public view returns (address) {
    return accounts[account].signers.vote;
  }

  function _getValidatorSigner(address account) public view returns (address) {
    return accounts[account].signers.validator;
  }

  function _getAttestationSigner(address account) public view returns (address) {
    return accounts[account].signers.attestation;
  }

  // override authorize function to simulate that for each set of parameters there is a unique signer.
  mapping(address => mapping(uint8 => mapping(bytes32 => mapping(bytes32 => address)))) signerMap;
  function authorize(address authorized, uint8 v, bytes32 r, bytes32 s) internal {
    require(isAccount(msg.sender), "Unknown account");
    require(
      isNotAccount(authorized) && isNotAuthorizedSigner(authorized),
      "delegate or account exists"
    );
    address signer = signerMap[msg.sender][v][r][s];
    require(signer == authorized, "Invalid signature");

    authorizedBy[authorized] = msg.sender;
  }

}
