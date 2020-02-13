pragma solidity ^0.5.3;

interface IVestingInstance {
  function isRevoked() external view returns (bool);
  function isPaused() external view returns (bool);
  function withdraw(uint256) external;
  function refundAndFinalize() external;
  function revoke() external;
  function pause(uint256) external;
  function lockGold(uint256) external;
  function unlockGold(uint256) external;
  function relockGold(uint256, uint256) external;
  function withdrawLockedGold(uint256) external;
  function authorizeVoteSigner(address, uint8, bytes32, bytes32) external;
  function createAccount() external;
  function setAccount(string calldata, bytes calldata, address) external;
  function setAccountName(string calldata) external;
  function setAccountWalletAddress(address) external;
  function setAccountDataEncryptionKey(bytes calldata) external;
  function setAccountMetadataURL(string calldata) external;
  function vote(address, uint256, address, address) external;
  function activate(address) external;
  function revokeActive(address, uint256, address, address, uint256) external;
  function revokePending(address, uint256, address, address, uint256) external;

  function getTotalBalance() external view returns (uint256);
  function getRemainingTotalBalance() external view returns (uint256);
  function getRemainingUnlockedBalance() external view returns (uint256);
  function getRemainingLockedBalance() external view returns (uint256);
  function getCurrentVestedTotalAmount() external view returns (uint256);
  function getInitialVestingAmount() external view returns (uint256);

}
