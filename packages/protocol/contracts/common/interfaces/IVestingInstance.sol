pragma solidity ^0.5.3;

interface IVestingInstance {
  function withdraw() external;
  function revoke(uint256) external;
  function pause(uint256) external;
  function getWithdrawableAmountAtTimestamp(uint256) external view returns (uint256);
  function lockGold(uint256) external;
  function unlockGold(uint256) external;
  function relockGold(uint256) external;
  function withdrawLockedGold(uint256) external;
  function authorizeVoteSigner(address, uint8, bytes32, bytes32) external;
  function authorizeValidatorSigner(address, uint8, bytes32, bytes32) external;
  function authorizeValidatorSigner(address, bytes calldata, uint8, bytes32, bytes32) external;
  function authorizeAttestationSigner(address, uint8, bytes32, bytes32) external;
  function createAccount() external;
  function setAccountName(string calldata) external;
  function setAccountWalletAddress(address) external;
  function setAccountDataEncryptionKey(bytes calldata) external;
  function setAccountMetadataURL(string calldata) external;
}
